import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

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
    width:16px;height:16px;border-radius:50%;
    background:#3B82F6;border:3px solid #93C5FD;
    box-shadow:0 0 14px rgba(59,130,246,0.9);
  "></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const placeIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:10px;height:10px;border-radius:50%;
    background:#34D399;border:2px solid rgba(255,255,255,0.7);
    box-shadow:0 0 8px rgba(52,211,153,0.7);
  "></div>`,
  iconSize: [10, 10],
  iconAnchor: [5, 5],
});

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => { map.setView([lat, lng], 14); }, [lat, lng]);
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
        await new Promise(r => setTimeout(r, 1100));
      }
      if (!cancelled) setPlaceCoords(results);
    })();

    return () => { cancelled = true; };
  }, [center, localScene.join(',')]);

  if (loading) {
    return (
      <div
        className="w-full rounded-2xl overflow-hidden border border-white/10 bg-[#0d1b2a] flex items-center justify-center"
        style={{ height: 320 }}
      >
        <div className="text-white/30 text-xs font-mono animate-pulse">Locating {townName}...</div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl" style={{ height: 320 }}>
      <MapContainer
        center={[center!.lat, center!.lng]}
        zoom={14}
        style={{ height: 320, width: '100%' }}
        zoomControl={false}
        scrollWheelZoom={false}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png" />
        <Recenter lat={center!.lat} lng={center!.lng} />

        <Marker position={[center!.lat, center!.lng]} icon={townIcon}>
          <Popup>
            <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 'bold', color: '#3B82F6' }}>
              {townName}, NJ
            </span>
          </Popup>
        </Marker>

        {placeCoords.map(({ name, coords }) => (
          <Marker key={name} position={[coords.lat, coords.lng]} icon={placeIcon}>
            <Popup>
              <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{name}</span>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
