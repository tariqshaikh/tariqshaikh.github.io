import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, ZoomControl, useMap } from 'react-leaflet';
import L from 'leaflet';

/**
 * Plots a destination's neighborhoods on a map.
 *
 * Geocoding is Nominatim (OpenStreetMap) — free, no key, but its usage policy
 * asks for ~1 request/second and discourages bulk use. So lookups run
 * sequentially with a delay, results are cached in localStorage indefinitely,
 * and pins appear progressively as they resolve rather than all at the end.
 *
 * Neighborhood centroids are approximate by nature: these are fuzzy areas, not
 * addresses. Good enough to show how districts relate to each other, which is
 * the thing the text cards can't convey. Not good enough to navigate by.
 */

interface Neighborhood {
  name: string;
  vibe: string;
  bestFor: string;
  mustSee: string;
}

interface Props {
  destination: string;
  neighborhoods: Neighborhood[];
  /** Index of the neighborhood to emphasise, or null. */
  activeIndex?: number | null;
  onSelect?: (index: number | null) => void;
}

interface Coords {
  lat: number;
  lng: number;
}

interface Pin extends Coords {
  index: number;
  name: string;
  vibe: string;
  bestFor: string;
}

const NOMINATIM_DELAY_MS = 1100;
const TILE_PREF_KEY = 'nbhd_map_style';

const ESRI = 'https://server.arcgisonline.com/ArcGIS/rest/services';

/**
 * All keyless. Esri serves tiles as {z}/{y}/{x} — note the row/col order.
 *
 * CARTO's basemaps were used here initially and had to be removed: they return
 * HTTP 200 with a valid PNG that has "API KEY REQUIRED" watermarked across it,
 * so a status-code check passes while the map is visibly broken. Verify tiles
 * by looking at them.
 *
 * Esri's canvas styles split labels into a separate transparent "Reference"
 * layer, so Minimal and Dark stack two layers via `overlay` — the base alone
 * renders with no place names at all.
 */
const TILES = {
  street: {
    label: 'Street',
    url: `${ESRI}/World_Street_Map/MapServer/tile/{z}/{y}/{x}`,
    attr: 'Tiles © Esri',
  },
  minimal: {
    label: 'Minimal',
    url: `${ESRI}/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}`,
    overlay: `${ESRI}/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}`,
    attr: 'Tiles © Esri',
  },
  terrain: {
    label: 'Terrain',
    url: `${ESRI}/World_Topo_Map/MapServer/tile/{z}/{y}/{x}`,
    attr: 'Tiles © Esri',
  },
  satellite: {
    label: 'Satellite',
    url: `${ESRI}/World_Imagery/MapServer/tile/{z}/{y}/{x}`,
    attr: 'Tiles © Esri',
  },
  dark: {
    label: 'Dark',
    url: `${ESRI}/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}`,
    overlay: `${ESRI}/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}`,
    attr: 'Tiles © Esri',
  },
} as const;

type TileMode = keyof typeof TILES;

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

/** Reject anything further than this from the destination centre. */
const MAX_KM_FROM_CENTRE = 30;

/**
 * Nominatim classes that denote a place or area rather than a point of interest.
 * Without this preference, "Pyrgos, Santorini" matches a mountain peak 34km away
 * and "Nishiki, Kyoto" matches a restaurant in the wrong district.
 */
const PLACE_CLASSES = new Set(['place', 'boundary', 'landuse']);

/** "Nishiki / Downtown" -> "Nishiki"; drops parentheticals and generic suffixes. */
function cleanName(name: string): string {
  return name
    .split('/')[0]
    .replace(/\([^)]*\)/g, '')
    .replace(/\b\d+(st|nd|rd|th)\b/gi, '')
    .replace(/\barrondissement\b/gi, '')
    .replace(/\b(Town|Village|District|Area)\b/gi, '')
    .trim();
}

function distanceKm(a: Coords, b: Coords): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function pinIcon(active: boolean) {
  const size = active ? 20 : 14;
  return L.divIcon({
    className: '',
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:${active ? '#0369A1' : '#0891B2'};
      border:3px solid white;
      box-shadow:0 2px 10px rgba(8,145,178,0.55),0 0 0 ${active ? 6 : 4}px rgba(8,145,178,0.18);
      transition:all .2s;
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

interface NominatimHit { lat: string; lon: string; class?: string; type?: string }

const cacheKeyFor = (s: string) => `nbhd_geo_${s.toLowerCase().replace(/\s+/g, '_')}`;

/** Returns true when the network was actually hit, so callers know to throttle. */
async function nominatim(query: string, limit: number): Promise<NominatimHit[]> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=${limit}`,
      { headers: { 'Accept-Language': 'en' } }
    );
    return res.ok ? await res.json() : [];
  } catch {
    return [];
  }
}

async function geocodeCentre(destination: string): Promise<Coords | null> {
  const key = cacheKeyFor(`centre_${destination}`);
  const cached = localStorage.getItem(key);
  if (cached) {
    try {
      const v = JSON.parse(cached);
      return v && typeof v.lat === 'number' ? v : null;
    } catch { /* refetch */ }
  }
  const hits = await nominatim(destination, 1);
  const centre = hits[0] ? { lat: parseFloat(hits[0].lat), lng: parseFloat(hits[0].lon) } : null;
  localStorage.setItem(key, JSON.stringify(centre));
  return centre;
}

/**
 * Two attempts: "<hood>, <destination>" then "<hood>, <country>". The second
 * matters for regions — "Positano, Amalfi Coast, Italy" finds nothing because
 * the Amalfi Coast isn't an administrative area, but "Positano, Italy" works.
 *
 * Candidates are filtered to within MAX_KM_FROM_CENTRE and ranked by whether
 * they look like a place rather than a POI.
 */
async function geocodeNeighborhood(
  neighborhood: string,
  destination: string,
  centre: Coords | null
): Promise<{ coords: Coords | null; usedNetwork: boolean }> {
  const cleaned = cleanName(neighborhood);
  const key = cacheKeyFor(`${cleaned}, ${destination}`);

  const cached = localStorage.getItem(key);
  if (cached) {
    try {
      const v = JSON.parse(cached);
      return { coords: v && typeof v.lat === 'number' ? v : null, usedNetwork: false };
    } catch { /* refetch */ }
  }

  const country = destination.split(',').pop()?.trim() ?? destination;
  const queries = [`${cleaned}, ${destination}`];
  if (country && country !== destination) queries.push(`${cleaned}, ${country}`);

  let best: Coords | null = null;
  for (const q of queries) {
    const hits = await nominatim(q, 5);
    const ranked = hits
      .map(h => {
        const coords = { lat: parseFloat(h.lat), lng: parseFloat(h.lon) };
        return { coords, isPlace: PLACE_CLASSES.has(h.class ?? ''), dist: centre ? distanceKm(centre, coords) : 0 };
      })
      .filter(c => Number.isFinite(c.coords.lat) && (!centre || c.dist <= MAX_KM_FROM_CENTRE))
      .sort((a, b) => Number(b.isPlace) - Number(a.isPlace) || a.dist - b.dist);

    if (ranked.length) { best = ranked[0].coords; break; }
  }

  localStorage.setItem(key, JSON.stringify(best));
  return { coords: best, usedNetwork: true };
}

/** Keeps all pins in frame as they stream in. */
function FitPins({ pins }: { pins: Pin[] }) {
  const map = useMap();
  useEffect(() => {
    if (!pins.length) return;
    if (pins.length === 1) {
      map.setView([pins[0].lat, pins[0].lng], 13);
      return;
    }
    const bounds = L.latLngBounds(pins.map(p => [p.lat, p.lng] as [number, number]));
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [48, 48], maxZoom: 14 });
  }, [pins, map]);
  return null;
}

/** Pans to the hovered/selected neighborhood without changing zoom. */
function PanTo({ pin }: { pin: Pin | null }) {
  const map = useMap();
  useEffect(() => {
    if (pin) map.panTo([pin.lat, pin.lng], { animate: true });
  }, [pin, map]);
  return null;
}

const NeighborhoodMap: React.FC<Props> = ({ destination, neighborhoods, activeIndex = null, onSelect }) => {
  const [pins, setPins] = useState<Pin[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle');
  // Remember the chosen style across destinations and visits.
  const [tileMode, setTileMode] = useState<TileMode>(() => {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(TILE_PREF_KEY) : null;
    return saved && saved in TILES ? (saved as TileMode) : 'street';
  });
  const [inView, setInView] = useState(false);
  const shellRef = useRef<HTMLDivElement>(null);
  const runId = useRef(0);
  const latest = useRef(neighborhoods);
  latest.current = neighborhoods;

  // Don't geocode until the section is near the viewport. This sits well below
  // the fold, so firing ~13 Nominatim requests on every page load — for
  // visitors who may never scroll here — would be rude to a free service.
  useEffect(() => {
    const el = shellRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') { setInView(true); return; }
    const io = new IntersectionObserver(
      entries => {
        if (entries.some(e => e.isIntersecting)) { setInView(true); io.disconnect(); }
      },
      { rootMargin: '300px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Depend on a derived string, not the array identity — `data.neighborhoods`
  // is rebuilt on every parent render, which would loop forever.
  const hoodKey = neighborhoods.map(n => n.name).join('|');

  useEffect(() => {
    if (!inView) return;
    const id = ++runId.current;
    const neighborhoods = latest.current;
    setPins([]);
    setStatus('loading');

    (async () => {
      // Centre first — it's what lets us reject results in the wrong country.
      const centre = await geocodeCentre(destination);
      if (runId.current !== id) return;

      const found: Pin[] = [];
      for (let i = 0; i < neighborhoods.length; i++) {
        if (runId.current !== id) return; // destination changed mid-flight
        const hood = neighborhoods[i];
        const { coords, usedNetwork } = await geocodeNeighborhood(hood.name, destination, centre);
        if (runId.current !== id) return;

        if (coords) {
          found.push({ index: i, name: hood.name, vibe: hood.vibe, bestFor: hood.bestFor, ...coords });
          setPins([...found]);
        }
        // Nominatim asks for ~1 req/sec. Cached lookups skip the wait entirely,
        // so a revisit renders instantly.
        if (usedNetwork && i < neighborhoods.length - 1) await sleep(NOMINATIM_DELAY_MS);
      }
      if (runId.current === id) setStatus('done');
    })();
  }, [destination, hoodKey, inView]);

  // Nothing resolved — say so rather than showing an empty map of the ocean.
  if (status === 'done' && pins.length === 0) {
    return (
      <div ref={shellRef} className="mb-8 rounded-[2.5rem] border border-black/[0.13] bg-[#F7F2E8]/50 px-8 py-6">
        <p className="text-[10px] text-slate-500">
          Couldn't place these neighborhoods on a map — the guide below still has everything.
        </p>
      </div>
    );
  }

  // Placeholder also carries the observer target, otherwise nothing ever
  // triggers the lookup.
  if (pins.length === 0) {
    return (
      <div
        ref={shellRef}
        className="mb-8 rounded-[2.5rem] bg-[#F7F2E8]/50 border border-black/[0.13] flex items-center justify-center"
        style={{ height: 380 }}
      >
        <p className="text-slate-500 text-xs font-mono animate-pulse">
          {status === 'idle' ? 'Map loads as you scroll…' : `Placing ${destination} neighborhoods…`}
        </p>
      </div>
    );
  }

  const tile = TILES[tileMode];
  const activePin = pins.find(p => p.index === activeIndex) ?? null;

  return (
    <div ref={shellRef} className="mb-8">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-3">
        <div>
          <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">
            Where these neighborhoods are
          </p>
          <p className="text-[10px] text-slate-500 mt-1">
            Approximate centres · {pins.length} of {neighborhoods.length} mapped
            {status === 'loading' && <span className="animate-pulse"> · locating…</span>}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(TILES) as TileMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => {
                setTileMode(mode);
                try { localStorage.setItem(TILE_PREF_KEY, mode); } catch { /* private mode */ }
              }}
              className={`px-3 py-1.5 rounded-full text-[9px] uppercase tracking-widest font-bold border transition-all ${
                tileMode === mode
                  ? 'bg-[#0891B2]/10 border-[#0891B2]/30 text-[#0891B2]'
                  : 'bg-white border-black/[0.13] text-slate-500 hover:text-[#0A1A2E]'
              }`}
            >
              {TILES[mode].label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-[2.5rem] overflow-hidden border border-black/[0.13]" style={{ height: 380 }}>
        <MapContainer
          center={[pins[0].lat, pins[0].lng]}
          zoom={12}
          zoomControl={false}
          attributionControl={false}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer key={tileMode} url={tile.url} attribution={tile.attr} maxZoom={19} />
          {'overlay' in tile && tile.overlay && (
            <TileLayer key={`${tileMode}-labels`} url={tile.overlay} maxZoom={19} />
          )}
          <ZoomControl position="bottomright" />
          <FitPins pins={pins} />
          <PanTo pin={activePin} />

          {pins.map(pin => (
            <Marker
              key={pin.index}
              position={[pin.lat, pin.lng]}
              icon={pinIcon(pin.index === activeIndex)}
              eventHandlers={{
                click: () => onSelect?.(pin.index),
                mouseover: () => onSelect?.(pin.index),
                mouseout: () => onSelect?.(null),
              }}
            >
              <Tooltip direction="top" offset={[0, -10]}>
                <span className="font-bold">{pin.name}</span> · {pin.vibe}
              </Tooltip>
              <Popup>
                <div className="min-w-[160px]">
                  <p className="font-serif text-base text-[#0A1A2E] mb-1">{pin.name}</p>
                  <p className="text-[10px] uppercase tracking-widest text-[#0891B2] font-bold mb-2">{pin.vibe}</p>
                  <p className="text-xs text-slate-700 leading-relaxed">{pin.bestFor}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <p className="text-[9px] text-slate-500 mt-2">
        {tile.attr} · geocoding © OpenStreetMap contributors
      </p>
    </div>
  );
};

export default NeighborhoodMap;
