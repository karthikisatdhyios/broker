import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEffect } from 'react';
import { BANGALORE } from './PropertyMap.jsx';

const pickIcon = L.divIcon({
  className: 'pin-wrap',
  html: '<div class="pin green"></div>',
  iconSize: [28, 28],
  iconAnchor: [14, 26],
});

function ClickHandler({ onPick }) {
  useMapEvents({ click(e) { onPick({ lat: e.latlng.lat, lng: e.latlng.lng }); } });
  return null;
}

function Mover({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView([position.lat, position.lng], Math.max(map.getZoom(), 14));
  }, [position, map]);
  return null;
}

export default function LocationPicker({ position, onPick }) {
  const center = position ? [position.lat, position.lng] : BANGALORE;
  return (
    <div style={{ height: 220, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}>
      <MapContainer center={center} zoom={position ? 14 : 11} className="leaflet-container">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <ClickHandler onPick={onPick} />
        <Mover position={position} />
        {position && (
          <Marker
            position={[position.lat, position.lng]}
            icon={pickIcon}
            draggable
            eventHandlers={{ dragend: (e) => { const ll = e.target.getLatLng(); onPick({ lat: ll.lat, lng: ll.lng }); } }}
          />
        )}
      </MapContainer>
    </div>
  );
}
