import { Tenant } from '../models/Tenant.js';
import { config } from '../config/index.js';
import { addMonths, addDays, daysBetween } from '../utils/time.js';
import { requireValidContactFields } from '../utils/validation.js';

export async function listTenants(req, res) {
  const { q } = req.query;
  const filter = { broker: req.user._id };
  if (q) {
    filter.$or = [
      { name: new RegExp(q, 'i') },
      { propertyAddress: new RegExp(q, 'i') },
      { phone: new RegExp(q, 'i') },
    ];
  }
  const tenants = await Tenant.find(filter).sort({ leaseEnd: 1 });
  res.json({ tenants });
}

export async function createTenant(req, res) {
  const { name, leaseStart } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const contactError = requireValidContactFields({ phone: req.body.phone, email: req.body.email });
  if (contactError) return res.status(400).json({ error: contactError });

  const start = leaseStart ? new Date(leaseStart) : new Date();
  const tenant = await Tenant.create({
    ...req.body,
    broker: req.user._id,
    leaseStart: start,
    leaseEnd: req.body.leaseEnd
      ? new Date(req.body.leaseEnd)
      : addMonths(start, config.leaseDurationMonths),
  });
  res.status(201).json({ tenant });
}

export async function updateTenant(req, res) {
  const tenant = await Tenant.findOne({ _id: req.params.id, broker: req.user._id });
  if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
  const contactError = requireValidContactFields({ phone: req.body.phone, email: req.body.email });
  if (contactError) return res.status(400).json({ error: contactError });

  const editable = ['name', 'phone', 'email', 'propertyAddress', 'requirements', 'rent', 'renewalContacted'];
  editable.forEach((k) => {
    if (req.body[k] !== undefined) tenant[k] = req.body[k];
  });
  if (req.body.leaseStart) {
    tenant.leaseStart = new Date(req.body.leaseStart);
    tenant.leaseEnd = addMonths(tenant.leaseStart, config.leaseDurationMonths);
  }
  if (req.body.leaseEnd) tenant.leaseEnd = new Date(req.body.leaseEnd);
  if (req.body.renewalContacted === true) tenant.renewalContactedAt = new Date();
  await tenant.save();
  res.json({ tenant });
}

export async function deleteTenant(req, res) {
  const tenant = await Tenant.findOneAndDelete({ _id: req.params.id, broker: req.user._id });
  if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
  res.json({ ok: true });
}

// Renewal watchlist: leases ending within RENEWAL_WINDOW_DAYS.
export async function renewalWatchlist(req, res) {
  const now = new Date();
  const horizon = addDays(now, config.renewalWindowDays);

  const tenants = await Tenant.find({
    broker: req.user._id,
    leaseEnd: { $lte: horizon },
  }).sort({ leaseEnd: 1 });

  const data = tenants.map((t) => {
    const daysLeft = daysBetween(now, t.leaseEnd);
    return {
      id: t._id,
      name: t.name,
      phone: t.phone,
      email: t.email,
      propertyAddress: t.propertyAddress,
      rent: t.rent,
      leaseStart: t.leaseStart,
      leaseEnd: t.leaseEnd,
      daysLeft,
      overdue: daysLeft < 0,
      renewalContacted: t.renewalContacted,
    };
  });

  res.json({ tenants: data, windowDays: config.renewalWindowDays });
}

export async function markRenewalContacted(req, res) {
  const tenant = await Tenant.findOneAndUpdate(
    { _id: req.params.id, broker: req.user._id },
    { renewalContacted: true, renewalContactedAt: new Date() },
    { new: true }
  );
  if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
  res.json({ tenant });
}
