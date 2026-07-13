import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, ZoomControl, useMap } from 'react-leaflet';
import L from 'leaflet';

delete (L.Icon.Default.prototype as any)._getIconUrl;

const townIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:18px;height:18px;border-radius:50%;
    background:#1D4ED8;border:3px solid white;
    box-shadow:0 2px 8px rgba(29,78,216,0.7), 0 0 0 4px rgba(29,78,216,0.2);
  "></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const numberedIcon = (n: number) => L.divIcon({
  className: '',
  html: `<div style="
    width:24px;height:24px;border-radius:50%;
    background:#059669;border:2.5px solid white;
    display:flex;align-items:center;justify-content:center;
    font-family:monospace;font-size:11px;font-weight:800;color:white;
    box-shadow:0 2px 6px rgba(0,0,0,0.35);
  ">${n}</div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

function FitBounds({ geojson }: { geojson: any }) {
  const map = useMap();
  useEffect(() => {
    if (!geojson) return;
    try {
      const layer = L.geoJSON(geojson);
      const bounds = layer.getBounds();
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [28, 28] });
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
  const [placeCoords, setPlaceCoords] = useState<{ name: string; coords: Coords; index: number }[]>([]);
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
      const results: { name: string; coords: Coords; index: number }[] = [];
      for (let i = 0; i < places.length; i++) {
        if (cancelled) break;
        const coords = await geocodePlace(`${places[i]}, ${townName}, NJ`);
        if (coords) results.push({ name: places[i], coords, index: i + 1 });
        await new Promise(r => setTimeout(r, 1100));
      }
      if (!cancelled) setPlaceCoords(results);
    })();
    return () => { cancelled = true; };
  }, [center, localScene.join(',')]);

  if (loading) {
    return (
      <div className="w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center" style={{ height: 360 }}>
        <div className="text-slate-400 text-xs font-mono animate-pulse">Mapping {townName}...</div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl overflow-hidden shadow-xl border border-slate-200" style={{ height: 360 }}>
      <MapContainer
        center={[center!.lat, center!.lng]}
        zoom={14}
        style={{ height: 360, width: '100%' }}
        zoomControl={false}
        scrollWheelZoom={false}
        attributionControl={false}
      >
        {/* Esri World Street Map — streets, parks, neighborhoods all labeled */}
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
          attribution="Tiles © Esri"
        />

        <ZoomControl position="bottomright" />

        {boundary ? <FitBounds geojson={boundary} /> : <Recenter lat={center!.lat} lng={center!.lng} />}

        {/* Town boundary */}
        {boundary && (
          <GeoJSON
            key={townName}
            data={boundary}
            style={{
              color: '#1D4ED8',
              weight: 3,
              fillColor: '#3B82F6',
              fillOpacity: 0.08,
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

        {/* Numbered local spots */}
        {placeCoords.map(({ name, coords, index }) => (
          <Marker key={name} position={[coords.lat, coords.lng]} icon={numberedIcon(index)}>
            <Popup>
              <div style={{ fontFamily: 'monospace', fontSize: 11 }}>
                <strong style={{ color: '#059669' }}>#{index}</strong> {name}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
