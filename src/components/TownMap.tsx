import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';

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
    background:#3B82F6;border:3px solid #93C5FD;
    box-shadow:0 0 14px rgba(59,130,246,0.9);
  "></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const placeIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:9px;height:9px;border-radius:50%;
    background:#34D399;border:2px solid rgba(255,255,255,0.7);
    box-shadow:0 0 7px rgba(52,211,153,0.7);
  "></div>`,
  iconSize: [9, 9],
  iconAnchor: [4, 4],
});

function FitBounds({ geojson }: { geojson: any }) {
  const map = useMap();
  useEffect(() => {
    if (!geojson) return;
    try {
      const layer = L.geoJSON(geojson);
      const bounds = layer.getBounds();
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [20, 20] });
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
  localScene: string[];
}

interface Coords { lat: number; lng: number; }

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

async function geocodePlace(query: string): Promise<Coords | null> {
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
  const [boundary, setBoundary] = useState<any>(null);
  const [placeCoords, setPlaceCoords] = useState<{ name: string; coords: Coords }[]>([]);
  const [loading, setLoading] = useState(true);

  const NJ_CENTER: Coords = { lat: 40.0583, lng: -74.4057 };

  useEffect(() => {
    geocodeWithBoundary(`${townName}, ${county} County, New Jersey`).then(result => {
      setCenter(result?.coords || NJ_CENTER);
      setBoundary(result?.boundary || null);
      setLoading(false);
    });
  }, [townName]);

  useEffect(() => {
    if (!center || localScene.length === 0) return;
    const places = localScene.slice(0, 4);
    let cancelled = false;
    (async () => {
      const results: { name: string; coords: Coords }[] = [];
      for (const place of places) {
        if (cancelled) break;
        const coords = await geocodePlace(`${place}, ${townName}, NJ`);
        if (coords) results.push({ name: place, coords });
        await new Promise(r => setTimeout(r, 1100));
      }
      if (!cancelled) setPlaceCoords(results);
    })();
    return () => { cancelled = true; };
  }, [center, localScene.join(',')]);

  if (loading) {
    return (
      <div className="w-full rounded-2xl overflow-hidden border border-white/10 bg-slate-100 flex items-center justify-center" style={{ height: 320 }}>
        <div className="text-slate-400 text-xs font-mono animate-pulse">Locating {townName}...</div>
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

        {boundary ? <FitBounds geojson={boundary} /> : <Recenter lat={center!.lat} lng={center!.lng} />}

        {/* Town boundary polygon */}
        {boundary && (
          <GeoJSON
            key={townName}
            data={boundary}
            style={{
              color: '#2563EB',
              weight: 3,
              fillColor: '#3B82F6',
              fillOpacity: 0.1,
              opacity: 0.85,
            }}
          />
        )}

        {/* Town center */}
        <Marker position={[center!.lat, center!.lng]} icon={townIcon}>
          <Popup>
            <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 'bold', color: '#2563EB' }}>
              {townName}, NJ
            </span>
          </Popup>
        </Marker>

        {/* Local spots */}
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
