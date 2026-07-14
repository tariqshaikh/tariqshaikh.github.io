import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, ZoomControl, useMap } from 'react-leaflet';
import L from 'leaflet';

delete (L.Icon.Default.prototype as any)._getIconUrl;

const townIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:14px;height:14px;border-radius:50%;
    background:#1D4ED8;border:3px solid white;
    box-shadow:0 2px 10px rgba(29,78,216,0.6),0 0 0 4px rgba(29,78,216,0.15);
  "></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

function FitBounds({ geojson }: { geojson: any }) {
  const map = useMap();
  useEffect(() => {
    if (!geojson) return;
    try {
      const layer = L.geoJSON(geojson);
      const bounds = layer.getBounds();
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [24, 24] });
    } catch {}
  }, [geojson]);
  return null;
}

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => { map.setView([lat, lng], 14); }, [lat, lng]);
  return null;
}

interface TownMapProps {
  townName: string;
  county: string;
}

interface Coords { lat: number; lng: number; }

const NJ_CENTER: Coords = { lat: 40.0583, lng: -74.4057 };

async function geocodeWithBoundary(query: string): Promise<{ coords: Coords; boundary: any } | null> {
  const cacheKey = `geo2_${query.toLowerCase().replace(/\s+/g, '_')}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) { try { return JSON.parse(cached); } catch {} }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&polygon_geojson=1&limit=1`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    if (data?.[0]) {
      const result = {
        coords: { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) },
        boundary: data[0].geojson || null,
      };
      localStorage.setItem(cacheKey, JSON.stringify(result));
      return result;
    }
  } catch {}
  return null;
}

const TILES = {
  street: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attr: 'Tiles © Esri',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attr: 'Tiles © Esri',
  },
};

export default function TownMap({ townName, county }: TownMapProps) {
  const [center, setCenter] = useState<Coords | null>(null);
  const [boundary, setBoundary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tileMode, setTileMode] = useState<'street' | 'satellite'>('street');

  useEffect(() => {
    geocodeWithBoundary(`${townName}, ${county} County, New Jersey`).then(result => {
      setCenter(result?.coords || NJ_CENTER);
      setBoundary(result?.boundary || null);
      setLoading(false);
    });
  }, [townName]);

  if (loading) {
    return (
      <div className="w-full rounded-2xl bg-slate-100 flex items-center justify-center" style={{ height: 440 }}>
        <div className="text-slate-400 text-xs font-mono animate-pulse">Mapping {townName}...</div>
      </div>
    );
  }

  const tile = TILES[tileMode];

  return (
    <div className="w-full">
      {/* Toggle row */}
      <div className="flex items-center gap-1.5 mb-2">
        {(['street', 'satellite'] as const).map(mode => (
          <button
            key={mode}
            onClick={() => setTileMode(mode)}
            className={`px-3 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all ${
              tileMode === mode
                ? 'bg-white text-[#0471A4]'
                : 'bg-white/10 text-white/50 hover:bg-white/20 hover:text-white'
            }`}
          >
            {mode === 'street' ? 'Map' : 'Satellite'}
          </button>
        ))}
        <a
          href={`https://www.google.com/maps/search/${encodeURIComponent(townName + ', ' + county + ' County, NJ')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto px-3 py-1 rounded-lg text-[10px] font-mono text-white/40 hover:text-white/70 transition-colors"
        >
          Open in Google Maps ↗
        </a>
      </div>

      {/* Map */}
      <div className="w-full rounded-2xl overflow-hidden shadow-xl border border-white/10" style={{ height: 440 }}>
        <MapContainer
          center={[center!.lat, center!.lng]}
          zoom={14}
          style={{ height: 440, width: '100%' }}
          zoomControl={false}
          scrollWheelZoom={false}
          attributionControl={false}
        >
          <TileLayer key={tileMode} url={tile.url} attribution={tile.attr} />
          <ZoomControl position="bottomright" />

          {boundary ? <FitBounds geojson={boundary} /> : <Recenter lat={center!.lat} lng={center!.lng} />}

          {/* Town boundary */}
          {boundary && (
            <GeoJSON
              key={`${townName}-${tileMode}`}
              data={boundary}
              style={{
                color: tileMode === 'satellite' ? '#60A5FA' : '#1D4ED8',
                weight: 3,
                fillColor: tileMode === 'satellite' ? '#60A5FA' : '#3B82F6',
                fillOpacity: tileMode === 'satellite' ? 0.12 : 0.07,
                opacity: 1,
                dashArray: '6 4',
              }}
            />
          )}

          {/* Town center pin */}
          <Marker position={[center!.lat, center!.lng]} icon={townIcon}>
            <Popup>
              <div style={{ fontFamily: 'monospace', fontSize: 12 }}>
                <strong style={{ color: '#1D4ED8' }}>{townName}</strong><br />
                <span style={{ color: '#64748b' }}>{county} County, NJ</span>
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>
    </div>
  );
}
