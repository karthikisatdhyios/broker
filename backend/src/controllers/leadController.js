import { Lead } from '../models/Lead.js';
import { Tenant } from '../models/Tenant.js';
import { config } from '../config/index.js';
import { addDays, addMonths } from '../utils/time.js';
import { requireValidContactFields } from '../utils/validation.js';

function publicLead(lead, viewerId) {
  const isOwner = String(lead.broker?._id || lead.broker) === String(viewerId);
  return {
    id: lead._id,
    budgetMin: lead.budgetMin,
    budgetMax: lead.budgetMax,
    bedrooms: lead.bedrooms,
    area: lead.area,
    city: lead.city,
    occupantType: lead.occupantType,
    pets: lead.pets,
    jobType: lead.jobType,
    commissionSplit: lead.commissionSplit,
    notes: lead.notes,
    status: lead.status,
    expiresAt: lead.expiresAt,
    createdAt: lead.createdAt,
    isOwner,
    broker: lead.broker?.name
      ? { id: lead.broker._id, name: lead.broker.name, agency: lead.broker.agency }
      : undefined,
    // private fields only for owner
    customerName: isOwner ? lead.customerName : undefined,
    customerContact: isOwner ? lead.customerContact : undefined,
  };
}

export async function createLead(req, res) {
  const {
    customerName, customerContact, budgetMin, budgetMax, bedrooms,
    area, city, occupantType, pets, jobType, commissionSplit, notes,
  } = req.body;

  if (budgetMax === undefined) {
    return res.status(400).json({ error: 'budgetMax is required' });
  }
  const contactError = requireValidContactFields({ customerContact });
  if (contactError) return res.status(400).json({ error: contactError });

  const lead = await Lead.create({
    broker: req.user._id,
    customerName, customerContact,
    budgetMin: Number(budgetMin) || 0,
    budgetMax: Number(budgetMax),
    bedrooms: Number(bedrooms) || 1,
    area, city, occupantType, pets: !!pets, jobType, commissionSplit, notes,
    status: 'active',
    expiresAt: addDays(new Date(), config.leadExpiryDays),
  });

  res.status(201).json({ lead: publicLead(lead, req.user._id) });
}

// Co-broking feed: active leads from all brokers.
export async function listLeads(req, res) {
  const { area, minBudget, maxBudget, bedrooms, occupantType, mine } = req.query;
  const filter = { status: 'active' };

  // Co-broking feed excludes your own leads (those live under "My leads").
  if (mine === 'true') filter.broker = req.user._id;
  else filter.broker = { $ne: req.user._id };

  if (area) filter.area = new RegExp(area, 'i');
  if (bedrooms) filter.bedrooms = Number(bedrooms);
  if (occupantType) filter.occupantType = occupantType;
  if (minBudget) filter.budgetMax = { ...(filter.budgetMax || {}), $gte: Number(minBudget) };
  if (maxBudget) filter.budgetMax = { ...(filter.budgetMax || {}), $lte: Number(maxBudget) };

  const leads = await Lead.find(filter).populate('broker', 'name agency').sort({ createdAt: -1 });
  res.json({ leads: leads.map((l) => publicLead(l, req.user._id)) });
}

export async function myLeads(req, res) {
  const leads = await Lead.find({ broker: req.user._id })
    .populate('broker', 'name agency')
    .sort({ createdAt: -1 });
  res.json({ leads: leads.map((l) => publicLead(l, req.user._id)) });
}

export async function updateLead(req, res) {
  const lead = await Lead.findOne({ _id: req.params.id, broker: req.user._id });
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  const contactError = requireValidContactFields({ customerContact: req.body.customerContact });
  if (contactError) return res.status(400).json({ error: contactError });

  const editable = [
    'customerName', 'customerContact', 'budgetMin', 'budgetMax', 'bedrooms',
    'area', 'city', 'occupantType', 'pets', 'jobType', 'commissionSplit', 'notes', 'status',
  ];
  editable.forEach((k) => {
    if (req.body[k] !== undefined) lead[k] = req.body[k];
  });
  await lead.save();
  res.json({ lead: publicLead(lead, req.user._id) });
}

export async function deleteLead(req, res) {
  const lead = await Lead.findOneAndDelete({ _id: req.params.id, broker: req.user._id });
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  res.json({ ok: true });
}

export async function convertLead(req, res) {
  const lead = await Lead.findOne({ _id: req.params.id, broker: req.user._id });
  if (!lead) return res.status(404).json({ error: 'Lead not found' });

  const { name, phone, email, propertyAddress, leaseStart, rent } = req.body;
  const contactError = requireValidContactFields({ phone, email });
  if (contactError) return res.status(400).json({ error: contactError });
  const start = leaseStart ? new Date(leaseStart) : new Date();

  const tenant = await Tenant.create({
    broker: req.user._id,
    name: name || lead.customerName || 'Tenant',
    phone: phone || lead.customerContact || '',
    email: email || '',
    propertyAddress: propertyAddress || '',
    requirements: `${lead.bedrooms}BHK, ${lead.area || lead.city}, budget ${lead.budgetMax}`,
    rent: Number(rent) || 0,
    leaseStart: start,
    leaseEnd: addMonths(start, config.leaseDurationMonths),
    sourceLead: lead._id,
  });

  lead.status = 'converted';
  await lead.save();

  res.status(201).json({ tenant, lead: publicLead(lead, req.user._id) });
}
