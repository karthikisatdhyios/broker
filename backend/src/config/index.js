import dotenv from 'dotenv';
dotenv.config();

const num = (v, fallback) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

export const config = {
  port: num(process.env.PORT, 5200),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientOrigins: (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),

  mongoUri: process.env.MONGO_URI || '',

  jwtSecret: process.env.JWT_SECRET || 'dev_insecure_secret_change_me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  propertyExpiryHours: num(process.env.PROPERTY_EXPIRY_HOURS, 48),
  leadExpiryDays: num(process.env.LEAD_EXPIRY_DAYS, 21),
  leaseDurationMonths: num(process.env.LEASE_DURATION_MONTHS, 11),
  renewalWindowDays: num(process.env.RENEWAL_WINDOW_DAYS, 30),
  freeTierPropertyLimit: num(process.env.FREE_TIER_PROPERTY_LIMIT, 5),

  nominatimUrl: process.env.NOMINATIM_URL || 'https://nominatim.openstreetmap.org/search',
  googleGeocodingApiKey: process.env.GOOGLE_GEOCODING_API_KEY || '',

  uploadDriver: process.env.UPLOAD_DRIVER || 'local',
};
