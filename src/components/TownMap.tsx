import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons (Leaflet + Vite issue)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const townIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:14px;height:14px;border-radius:50%;
    background:#0471A4;border:3px solid #8ECAE6;
    box-shadow:0 0 12px rgba(4,113,164,0.8);
  "></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const placeIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:9px;height:9px;border-radius:50%;
    background:#8ECAE6;border:2px solid rgba(255,255,255,0.6);
    box-shadow:0 0 6px rgba(142,202,230,0.6);
  "></div>`,
  iconSize: [9, 9],
  iconAnchor: [4, 4],
});

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => { map.setView([lat, lng], 13); }, [lat, lng]);
  return null;
}

interface TownMapProps {
  townName: string;
  county: string;
  localScene: string[];
}

interface Coords { lat: number; lng: number; }

async function geocode(query: string): Promise<Coords | null> {
  const cacheKey = `geo_${query.toLowerCase().replace(/\s+/g, '_')}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) { try { return JSON.parse(cached); } catch {} }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    if (data?.[0]) {
      const coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      localStorage.setItem(cacheKey, JSON.stringify(coords));
      return coords;
    }
  } catch {}
  return null;
}

export default function TownMap({ townName, county, localScene }: TownMapProps) {
  const [center, setCenter] = useState<Coords | null>(null);
  const [placeCoords, setPlaceCoords] = useState<{ name: string; coords: Coords }[]>([]);
  const [loading, setLoading] = useState(true);

  // NJ fallback center
  const NJ_CENTER: Coords = { lat: 40.0583, lng: -74.4057 };

  useEffect(() => {
    geocode(`${townName}, ${county} County, New Jersey`)
      .then(c => { setCenter(c || NJ_CENTER); setLoading(false); });
  }, [townName]);

  // Geocode up to 4 local places sequentially (respects Nominatim 1req/s limit)
  useEffect(() => {
    if (!center || localScene.length === 0) return;
    const places = localScene.slice(0, 4);
    let cancelled = false;

    (async () => {
      const results: { name: string; coords: Coords }[] = [];
      for (const place of places) {
        if (cancelled) break;
        const coords = await geocode(`${place}, ${townName}, NJ`);
        if (coords) results.push({ name: place, coords });
        await new Promise(r => setTimeout(r, 1100)); // Nominatim rate limit
      }
      if (!cancelled) setPlaceCoords(results);
    })();

    return () => { cancelled = true; };
  }, [center, localScene.join(',')]);

  if (loading) {
    return (
      <div className="w-full rounded-2xl overflow-hidden border border-white/10 bg-[#0a1520] flex items-center justify-center" style={{ height: 320 }}>
        <div className="text-white/30 text-xs font-mono animate-pulse">Loading map...</div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl" style={{ height: 320 }}>
      <MapContainer
        center={[center!.lat, center!.lng]}
        zoom={13}
        style={{ height: '100%', width: '100%', background: '#0a1520' }}
        zoomControl={false}
        scrollWheelZoom={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />
        <Recenter lat={center!.lat} lng={center!.lng} />

        {/* Town center marker */}
        <Marker position={[center!.lat, center!.lng]} icon={townIcon}>
          <Popup className="hb-popup">
            <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#0471A4', fontWeight: 'bold' }}>
              {townName}, NJ
            </div>
          </Popup>
        </Marker>

        {/* Local scene markers */}
        {placeCoords.map(({ name, coords }) => (
          <Marker key={name} position={[coords.lat, coords.lng]} icon={placeIcon}>
            <Popup>
              <div style={{ fontFamily: 'monospace', fontSize: 11 }}>{name}</div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
