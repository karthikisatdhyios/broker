// Client-side fallback when the geocode API is unreachable or returns no match.
// Mirrors the Bengaluru/Mumbai locality list on the backend.
const LOCALITIES = [
  { keys: ['indiranagar', 'indra nagar'], lat: 12.9719, lng: 77.6412 },
  { keys: ['koramangala'], lat: 12.9352, lng: 77.6245 },
  { keys: ['hsr layout', 'hsr'], lat: 12.9116, lng: 77.6389 },
  { keys: ['whitefield'], lat: 12.9698, lng: 77.75 },
  { keys: ['jayanagar'], lat: 12.925, lng: 77.5938 },
  { keys: ['btm layout', 'btm'], lat: 12.9166, lng: 77.6101 },
  { keys: ['mg road', 'mahatma gandhi road'], lat: 12.9758, lng: 77.6046 },
  { keys: ['marathahalli'], lat: 12.956, lng: 77.701 },
  { keys: ['electronic city'], lat: 12.8452, lng: 77.6602 },
  { keys: ['hebbal'], lat: 13.0358, lng: 77.597 },
  { keys: ['yelahanka'], lat: 13.1007, lng: 77.5963 },
  { keys: ['malleshwaram', 'malleswaram'], lat: 13.0031, lng: 77.5643 },
  { keys: ['rajajinagar'], lat: 12.9915, lng: 77.555 },
  { keys: ['banashankari'], lat: 12.9255, lng: 77.5468 },
  { keys: ['bellandur'], lat: 12.9304, lng: 77.6784 },
  { keys: ['sarjapur'], lat: 12.86, lng: 77.786 },
  { keys: ['jp nagar', 'j p nagar'], lat: 12.9077, lng: 77.585 },
  { keys: ['bandra'], lat: 19.0596, lng: 72.8295 },
  { keys: ['andheri'], lat: 19.1197, lng: 72.8464 },
  { keys: ['powai'], lat: 19.1176, lng: 72.906 },
  { keys: ['worli'], lat: 19.0176, lng: 72.8178 },
  { keys: ['thane'], lat: 19.2183, lng: 72.9781 },
];

export function localGeocodeFallback(address, city = '') {
  const haystack = `${address} ${city}`.toLowerCase();
  const match = LOCALITIES.find((loc) => loc.keys.some((key) => haystack.includes(key)));
  if (!match) return null;
  return { lat: match.lat, lng: match.lng, source: 'local-fallback' };
}

export async function resolvePropertyLocation(api, address, city) {
  try {
    const { data } = await api.get('/geocode', { params: { address, city } });
    if (data?.location) return data.location;
  } catch {
    // fall through to client-side locality match
  }
  return localGeocodeFallback(address, city);
}
