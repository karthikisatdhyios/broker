import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEffect } from 'react';

export const BANGALORE = [12.9716, 77.5946];

function pinIcon(status) {
  const color = status === 'available' ? 'green' : 'red';
  return L.divIcon({
    className: 'pin-wrap',
    html: `<div class="pin ${color}"></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 26],
    popupAnchor: [0, -24],
  });
}

function Recenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, Math.max(map.getZoom(), 14), { duration: 0.6 });
  }, [center, map]);
  return null;
}

export default function PropertyMap({ properties = [], onSelect, focus }) {
  return (
    <MapContainer center={BANGALORE} zoom={12} scrollWheelZoom className="leaflet-container">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {focus && <Recenter center={focus} />}
      {properties
        .filter((p) => p.location && p.location.lat)
        .map((p) => (
          <Marker
            key={p.id}
            position={[p.location.lat, p.location.lng]}
            icon={pinIcon(p.status)}
            eventHandlers={{ click: () => onSelect?.(p) }}
          >
            <Popup>
              <strong>{p.title || p.address}</strong>
              <br />₹{Number(p.rent).toLocaleString('en-IN')}/mo · {p.bedrooms}BHK
              <br />
              <span className={`badge ${p.status === 'available' ? 'green' : 'red'}`}>
                {p.status}
              </span>
            </Popup>
          </Marker>
        ))}
    </MapContainer>
  );
}
