import { Property } from '../models/Property.js';
import { Tenant } from '../models/Tenant.js';
import { config } from '../config/index.js';
import { geocodeAddress } from '../utils/geocode.js';
import { addHours, addMonths } from '../utils/time.js';
import { requireValidContactFields } from '../utils/validation.js';

function fileToUrl(req, filename) {
  return `${req.protocol}://${req.get('host')}/uploads/${filename}`;
}

async function withBrokerContact(prop) {
  await prop.populate('broker', 'name phone agency email');
  const obj = prop.toMapJSON();
  obj.broker = prop.broker
    ? {
        id: prop.broker._id,
        name: prop.broker.name,
        phone: prop.broker.phone,
        email: prop.broker.email,
        agency: prop.broker.agency,
      }
    : null;
  obj.landlordName = prop.landlordName;
  obj.landlordContact = prop.landlordContact;
  obj.notes = prop.notes;
  return obj;
}

export async function createProperty(req, res) {
  const {
    title, address, city, rent, bedrooms, propertyType, furnishing,
    tenantPreference, petsAllowed, landlordName, landlordContact,
    commissionSplit, notes, lat, lng,
  } = req.body;

  if (!address || rent === undefined || bedrooms === undefined) {
    return res.status(400).json({ error: 'address, rent and bedrooms are required' });
  }
  const contactError = requireValidContactFields({ landlordContact });
  if (contactError) return res.status(400).json({ error: contactError });

  // Free tier limit (counts active/rented, not expired)
  if (req.user.subscription?.tier !== 'paid') {
    const count = await Property.countDocuments({
      broker: req.user._id,
      status: { $in: ['available', 'rented'] },
    });
    if (count >= config.freeTierPropertyLimit) {
      return res.status(402).json({
        error: `Free tier is limited to ${config.freeTierPropertyLimit} active properties. Subscribe for unlimited listings.`,
        code: 'FREE_TIER_LIMIT',
      });
    }
  }

  // Resolve coordinates: use provided lat/lng or geocode the address.
  let location = null;
  if (lat && lng) {
    location = { lat: Number(lat), lng: Number(lng) };
  } else {
    location = await geocodeAddress(address, city);
  }
  if (!location) {
    return res.status(422).json({
      error: 'Could not geocode that address. Try a more specific address or drop the pin manually.',
      code: 'GEOCODE_FAILED',
    });
  }

  const photos = (req.files || []).map((f) => fileToUrl(req, f.filename));

  const now = new Date();
  const property = await Property.create({
    broker: req.user._id,
    title, address, city, location,
    rent: Number(rent),
    bedrooms: Number(bedrooms),
    propertyType, furnishing, tenantPreference,
    petsAllowed: petsAllowed === 'true' || petsAllowed === true,
    photos, landlordName, landlordContact,
    commissionSplit, notes,
    status: 'available',
    postedAt: now,
    expiresAt: addHours(now, config.propertyExpiryHours),
  });

  res.status(201).json({ property: await withBrokerContact(property) });
}

// Map feed: all available + recently rented properties from every broker.
export async function listProperties(req, res) {
  const { status, city, minRent, maxRent, bedrooms } = req.query;
  const filter = {};

  if (status) filter.status = status;
  else filter.status = { $in: ['available', 'rented'] };

  if (city) filter.city = new RegExp(city, 'i');
  if (bedrooms) filter.bedrooms = Number(bedrooms);
  if (minRent || maxRent) {
    filter.rent = {};
    if (minRent) filter.rent.$gte = Number(minRent);
    if (maxRent) filter.rent.$lte = Number(maxRent);
  }

  const props = await Property.find(filter).sort({ postedAt: -1 }).limit(500);
  const data = await Promise.all(props.map((p) => withBrokerContact(p)));
  res.json({ properties: data });
}

export async function getProperty(req, res) {
  const prop = await Property.findById(req.params.id);
  if (!prop) return res.status(404).json({ error: 'Property not found' });
  res.json({ property: await withBrokerContact(prop) });
}

export async function myProperties(req, res) {
  const props = await Property.find({ broker: req.user._id }).sort({ createdAt: -1 });
  const data = await Promise.all(props.map((p) => withBrokerContact(p)));
  res.json({ properties: data });
}

export async function refreshProperty(req, res) {
  const prop = await Property.findOne({ _id: req.params.id, broker: req.user._id });
  if (!prop) return res.status(404).json({ error: 'Property not found' });

  const now = new Date();
  prop.postedAt = now;
  prop.expiresAt = addHours(now, config.propertyExpiryHours);
  if (prop.status === 'expired') prop.status = 'available';
  await prop.save();
  res.json({ property: await withBrokerContact(prop) });
}

export async function updateProperty(req, res) {
  const prop = await Property.findOne({ _id: req.params.id, broker: req.user._id });
  if (!prop) return res.status(404).json({ error: 'Property not found' });

  const editable = [
    'title', 'address', 'city', 'rent', 'bedrooms', 'propertyType', 'furnishing',
    'tenantPreference', 'landlordName', 'landlordContact', 'commissionSplit', 'notes',
  ];
  const contactError = requireValidContactFields({ landlordContact: req.body.landlordContact });
  if (contactError) return res.status(400).json({ error: contactError });
  editable.forEach((k) => {
    if (req.body[k] !== undefined) prop[k] = req.body[k];
  });
  if (req.body.petsAllowed !== undefined) {
    prop.petsAllowed = req.body.petsAllowed === 'true' || req.body.petsAllowed === true;
  }
  if (req.body.lat && req.body.lng) {
    prop.location = { lat: Number(req.body.lat), lng: Number(req.body.lng) };
  }
  await prop.save();
  res.json({ property: await withBrokerContact(prop) });
}

export async function markRented(req, res) {
  const prop = await Property.findOne({ _id: req.params.id, broker: req.user._id });
  if (!prop) return res.status(404).json({ error: 'Property not found' });

  const { tenantName, tenantPhone, tenantEmail, leaseStart } = req.body;
  const contactError = requireValidContactFields({ tenantPhone, tenantEmail });
  if (contactError) return res.status(400).json({ error: contactError });

  prop.status = 'rented';
  prop.rentedAt = new Date();

  // Optionally create a converted tenant record (CRM + renewal tracking).
  let tenant = null;
  if (tenantName) {
    const start = leaseStart ? new Date(leaseStart) : new Date();
    tenant = await Tenant.create({
      broker: req.user._id,
      name: tenantName,
      phone: tenantPhone || '',
      email: tenantEmail || '',
      propertyAddress: prop.address,
      rent: prop.rent,
      leaseStart: start,
      leaseEnd: addMonths(start, config.leaseDurationMonths),
      sourceProperty: prop._id,
    });
    prop.tenant = tenant._id;
  }
  await prop.save();

  res.json({ property: await withBrokerContact(prop), tenant });
}

export async function deleteProperty(req, res) {
  const prop = await Property.findOneAndDelete({ _id: req.params.id, broker: req.user._id });
  if (!prop) return res.status(404).json({ error: 'Property not found' });
  res.json({ ok: true });
}
