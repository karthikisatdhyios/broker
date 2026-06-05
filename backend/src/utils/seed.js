import { connectDB, disconnectDB } from '../config/db.js';
import { config } from '../config/index.js';
import { User } from '../models/User.js';
import { Property } from '../models/Property.js';
import { Lead } from '../models/Lead.js';
import { Landlord } from '../models/Landlord.js';
import { Tenant } from '../models/Tenant.js';
import { addHours, addDays, addMonths } from './time.js';

const PHOTO = (seed) => `https://picsum.photos/seed/${seed}/640/420`;

async function makeUser({ name, email, phone, agency, tier = 'free' }) {
  const u = new User({ name, email, phone, agency });
  await u.setPassword('password123');
  if (tier === 'paid') {
    u.subscription = { tier: 'paid', status: 'active', since: new Date(), validUntil: addMonths(new Date(), 1) };
  }
  await u.save();
  return u;
}

export async function seed() {
  const now = new Date();

  const broker1 = await makeUser({
    name: 'Arjun Mehta', email: 'broker1@example.com', phone: '+91 90000 11111',
    agency: 'Skyline Realty', tier: 'paid',
  });
  const broker2 = await makeUser({
    name: 'Priya Nair', email: 'broker2@example.com', phone: '+91 90000 22222',
    agency: 'Nest Hunters',
  });

  const properties = [
    { broker: broker1, title: '2BHK near Indiranagar Metro', address: '100 Feet Road, Indiranagar, Bengaluru', city: 'Bengaluru', lat: 12.9719, lng: 77.6412, rent: 42000, bedrooms: 2, furnishing: 'Semi-furnished', tenantPreference: 'Family', commissionSplit: '50% of 1 month', seed: 'indiranagar' },
    { broker: broker1, title: 'Cozy 1BHK in Koramangala', address: '5th Block, Koramangala, Bengaluru', city: 'Bengaluru', lat: 12.9352, lng: 77.6245, rent: 28000, bedrooms: 1, furnishing: 'Furnished', tenantPreference: 'Bachelor', petsAllowed: true, commissionSplit: '50% of 1 month', seed: 'koramangala' },
    { broker: broker2, title: 'Spacious 3BHK in HSR Layout', address: 'Sector 2, HSR Layout, Bengaluru', city: 'Bengaluru', lat: 12.9116, lng: 77.6389, rent: 55000, bedrooms: 3, furnishing: 'Semi-furnished', tenantPreference: 'Family', commissionSplit: '1 month, 50-50 split', seed: 'hsr' },
    { broker: broker2, title: 'IT-park adjacent 2BHK', address: 'Whitefield Main Road, Bengaluru', city: 'Bengaluru', lat: 12.9698, lng: 77.7500, rent: 36000, bedrooms: 2, furnishing: 'Furnished', tenantPreference: 'Any', commissionSplit: '50% of 1 month', seed: 'whitefield' },
    { broker: broker1, title: 'Quiet 2BHK in Jayanagar', address: '4th Block, Jayanagar, Bengaluru', city: 'Bengaluru', lat: 12.9250, lng: 77.5938, rent: 32000, bedrooms: 2, furnishing: 'Unfurnished', tenantPreference: 'Family', commissionSplit: '50% of 1 month', seed: 'jayanagar' },
  ];

  for (const p of properties) {
    await Property.create({
      broker: p.broker._id,
      title: p.title, address: p.address, city: p.city,
      location: { lat: p.lat, lng: p.lng },
      rent: p.rent, bedrooms: p.bedrooms,
      furnishing: p.furnishing, tenantPreference: p.tenantPreference,
      petsAllowed: !!p.petsAllowed,
      photos: [PHOTO(p.seed), PHOTO(`${p.seed}-2`)],
      landlordName: 'Landlord ' + p.title.split(' ')[0],
      landlordContact: '+91 98888 00000',
      commissionSplit: p.commissionSplit,
      status: 'available',
      postedAt: now,
      expiresAt: addHours(now, config.propertyExpiryHours),
    });
  }

  // One already-rented property (red pin demo)
  await Property.create({
    broker: broker2._id,
    title: 'Rented 2BHK in Marathahalli', address: 'Marathahalli, Bengaluru', city: 'Bengaluru',
    location: { lat: 12.9560, lng: 77.7010 },
    rent: 30000, bedrooms: 2, furnishing: 'Semi-furnished',
    photos: [PHOTO('marathahalli')],
    commissionSplit: '50% of 1 month',
    status: 'rented', rentedAt: now,
    postedAt: now, expiresAt: addHours(now, config.propertyExpiryHours),
  });

  // Leads (co-broking)
  await Lead.create([
    {
      broker: broker2._id, customerName: 'Rahul (software)', customerContact: '+91 91111 22222',
      budgetMin: 25000, budgetMax: 40000, bedrooms: 2, area: 'Indiranagar', city: 'Bengaluru',
      occupantType: 'Family', jobType: 'Software Engineer', commissionSplit: '50-50 split',
      notes: 'Wants semi-furnished, ready to move in 2 weeks.',
      status: 'active', expiresAt: addDays(now, config.leadExpiryDays),
    },
    {
      broker: broker1._id, customerName: 'Sneha & friends', customerContact: '+91 93333 44444',
      budgetMin: 20000, budgetMax: 30000, bedrooms: 2, area: 'Koramangala', city: 'Bengaluru',
      occupantType: 'Bachelor', pets: false, jobType: 'Designers', commissionSplit: '50% of 1 month',
      notes: 'Bachelor-friendly building required.',
      status: 'active', expiresAt: addDays(now, config.leadExpiryDays),
    },
  ]);

  // Landlords (private CRM of broker1)
  await Landlord.create([
    { broker: broker1._id, name: 'Mr. Suresh Rao', phone: '+91 90011 22334', area: 'Indiranagar', propertiesOwned: '2BHK, 3BHK', notes: 'Prefers family tenants. Quick to respond.' },
    { broker: broker1._id, name: 'Mrs. Latha', phone: '+91 90011 55667', area: 'Jayanagar', propertiesOwned: '1BHK', notes: 'No brokerage negotiation.' },
  ]);

  // Tenants for broker1 — one renewing soon, one far out
  const soonStart = addMonths(now, -10.5); // lease ends in ~2 weeks
  const farStart = addMonths(now, -2);
  await Tenant.create([
    {
      broker: broker1._id, name: 'Karthik Iyer', phone: '+91 95555 66778', email: 'karthik@example.com',
      propertyAddress: '4th Block, Jayanagar, Bengaluru', rent: 32000,
      requirements: '2BHK family', leaseStart: soonStart, leaseEnd: addMonths(soonStart, config.leaseDurationMonths),
    },
    {
      broker: broker1._id, name: 'Divya Sharma', phone: '+91 96666 77889', email: 'divya@example.com',
      propertyAddress: '5th Block, Koramangala, Bengaluru', rent: 28000,
      requirements: '1BHK bachelor', leaseStart: farStart, leaseEnd: addMonths(farStart, config.leaseDurationMonths),
    },
  ]);

  console.log('[seed] created demo brokers, properties, leads, landlords and tenants.');
}

// Seed only if there are no users yet (safe to call on every boot).
export async function ensureSeed() {
  const count = await User.countDocuments();
  if (count > 0) return false;
  await seed();
  return true;
}

// CLI: `npm run seed` wipes and reseeds.
const isMain = process.argv[1] && process.argv[1].endsWith('seed.js');
if (isMain) {
  (async () => {
    await connectDB();
    console.log('[seed] Resetting datastore and inserting demo data...');
    await Promise.all([
      User.deleteMany({}), Property.deleteMany({}), Lead.deleteMany({}),
      Landlord.deleteMany({}), Tenant.deleteMany({}),
    ]);
    await seed();
    await disconnectDB();
    process.exit(0);
  })();
}
