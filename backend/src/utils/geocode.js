import { config } from '../config/index.js';

const LOCALITY_COORDS = [
  // Bengaluru
  { keys: ['indiranagar', 'indra nagar'], city: 'Bengaluru', lat: 12.9719, lng: 77.6412 },
  { keys: ['koramangala'], city: 'Bengaluru', lat: 12.9352, lng: 77.6245 },
  { keys: ['hsr', 'hsr layout'], city: 'Bengaluru', lat: 12.9116, lng: 77.6389 },
  { keys: ['whitefield'], city: 'Bengaluru', lat: 12.9698, lng: 77.75 },
  { keys: ['jayanagar'], city: 'Bengaluru', lat: 12.925, lng: 77.5938 },
  { keys: ['btm', 'btm layout'], city: 'Bengaluru', lat: 12.9166, lng: 77.6101 },
  { keys: ['mg road', 'mahatma gandhi road'], city: 'Bengaluru', lat: 12.9758, lng: 77.6046 },
  { keys: ['marathahalli'], city: 'Bengaluru', lat: 12.956, lng: 77.701 },
  { keys: ['electronic city'], city: 'Bengaluru', lat: 12.8452, lng: 77.6602 },
  { keys: ['hebbal'], city: 'Bengaluru', lat: 13.0358, lng: 77.597 },
  { keys: ['yelahanka'], city: 'Bengaluru', lat: 13.1007, lng: 77.5963 },
  { keys: ['malleshwaram', 'malleswaram'], city: 'Bengaluru', lat: 13.0031, lng: 77.5643 },
  { keys: ['rajajinagar'], city: 'Bengaluru', lat: 12.9915, lng: 77.555 },
  { keys: ['banashankari'], city: 'Bengaluru', lat: 12.9255, lng: 77.5468 },
  { keys: ['bellandur'], city: 'Bengaluru', lat: 12.9304, lng: 77.6784 },
  { keys: ['sarjapur'], city: 'Bengaluru', lat: 12.86, lng: 77.786 },
  { keys: ['jp nagar', 'j p nagar'], city: 'Bengaluru', lat: 12.9077, lng: 77.585 },

  // Mumbai
  { keys: ['bandra'], city: 'Mumbai', lat: 19.0596, lng: 72.8295 },
  { keys: ['andheri'], city: 'Mumbai', lat: 19.1197, lng: 72.8464 },
  { keys: ['powai'], city: 'Mumbai', lat: 19.1176, lng: 72.906 },
  { keys: ['worli'], city: 'Mumbai', lat: 19.0176, lng: 72.8178 },
  { keys: ['thane'], city: 'Mumbai', lat: 19.2183, lng: 72.9781 },
];

function normalizeCity(city = '') {
  const c = String(city).toLowerCase();
  if (c.includes('bangalore')) return 'Bengaluru';
  if (c.includes('bengaluru')) return 'Bengaluru';
  if (c.includes('mumbai') || c.includes('bombay')) return 'Mumbai';
  return city || 'Bengaluru';
}

function fallbackLocality(address, city = '') {
  const haystack = `${address} ${city}`.toLowerCase();
  const preferredCity = normalizeCity(city).toLowerCase();

  const match =
    LOCALITY_COORDS.find((loc) => loc.city.toLowerCase() === preferredCity && loc.keys.some((key) => haystack.includes(key))) ||
    LOCALITY_COORDS.find((loc) => loc.keys.some((key) => haystack.includes(key)));

  if (!match) return null;
  return { lat: match.lat, lng: match.lng, source: 'locality-fallback', label: `${match.keys[0]}, ${match.city}` };
}

function candidateQueries(address, city) {
  const c = normalizeCity(city);
  const base = String(address).trim();
  return [
    [base, c, 'India'].filter(Boolean).join(', '),
    [base, c === 'Bengaluru' ? 'Bangalore' : c, 'Karnataka', 'India'].filter(Boolean).join(', '),
    [base, 'India'].filter(Boolean).join(', '),
    base,
  ].filter((q, idx, arr) => q && arr.indexOf(q) === idx);
}

/**
 * Geocode a free-text address to { lat, lng }.
 * Uses Google Geocoding if a key is set, otherwise free OpenStreetMap Nominatim.
 * Falls back to null on failure so callers can decide what to do.
 */
export async function geocodeAddress(address, city = '') {
  if (!address) return null;

  try {
    if (config.googleGeocodingApiKey) {
      const query = candidateQueries(address, city)[0];
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        query
      )}&key=${config.googleGeocodingApiKey}`;
      const res = await fetch(url);
      const data = await res.json();
      const loc = data?.results?.[0]?.geometry?.location;
      if (loc) return { lat: loc.lat, lng: loc.lng };
      return null;
    }

    for (const query of candidateQueries(address, city)) {
      const params = new URLSearchParams({
        format: 'jsonv2',
        limit: '1',
        addressdetails: '1',
        countrycodes: 'in',
        q: query,
      });
      const url = `${config.nominatimUrl}?${params.toString()}`;
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'broker-collab-mvp/1.0 (local demo)',
          'Accept-Language': 'en-IN,en;q=0.9',
        },
      });
      if (!res.ok) continue;
      const data = await res.json();
      if (Array.isArray(data) && data[0]) {
        return {
          lat: Number(data[0].lat),
          lng: Number(data[0].lon),
          source: 'nominatim',
          label: data[0].display_name,
        };
      }
    }
  } catch (err) {
    console.warn('[geocode] failed:', err.message);
  }

  return fallbackLocality(address, city);
}
