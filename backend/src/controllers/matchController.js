import { MatchRequest } from '../models/MatchRequest.js';
import { Lead } from '../models/Lead.js';
import { Notification } from '../models/Notification.js';

async function shape(mr, viewerId) {
  await mr.populate([
    { path: 'leadBroker', select: 'name phone email agency' },
    { path: 'matchBroker', select: 'name phone email agency' },
    { path: 'lead', select: 'area city budgetMax bedrooms commissionSplit customerName customerContact' },
    { path: 'property', select: 'address rent bedrooms' },
  ]);

  const accepted = mr.status === 'accepted';
  const viewer = String(viewerId);
  const isLeadBroker = String(mr.leadBroker._id) === viewer;
  const counterpart = isLeadBroker ? mr.matchBroker : mr.leadBroker;

  return {
    id: mr._id,
    status: mr.status,
    role: isLeadBroker ? 'lead_owner' : 'initiator',
    lead: {
      id: mr.lead?._id,
      area: mr.lead?.area,
      city: mr.lead?.city,
      budgetMax: mr.lead?.budgetMax,
      bedrooms: mr.lead?.bedrooms,
      commissionSplit: mr.lead?.commissionSplit,
      // customer contact revealed to initiator only after acceptance
      customerName: accepted ? mr.lead?.customerName : undefined,
      customerContact: accepted ? mr.lead?.customerContact : undefined,
    },
    property: mr.property
      ? { id: mr.property._id, address: mr.property.address, rent: mr.property.rent, bedrooms: mr.property.bedrooms }
      : null,
    counterpart: {
      id: counterpart._id,
      name: counterpart.name,
      agency: counterpart.agency,
      // contact revealed only after mutual accept
      phone: accepted ? counterpart.phone : undefined,
      email: accepted ? counterpart.email : undefined,
    },
    messages: mr.messages.map((m) => ({
      mine: String(m.sender) === viewer,
      text: m.text,
      at: m.at,
    })),
    canAct: !isLeadBroker ? false : mr.status === 'pending', // lead owner accepts/declines
    createdAt: mr.createdAt,
  };
}

export async function createMatch(req, res) {
  const { leadId, propertyId, message } = req.body;
  const lead = await Lead.findById(leadId);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  if (String(lead.broker) === String(req.user._id)) {
    return res.status(400).json({ error: "You can't match your own lead" });
  }
  if (lead.status !== 'active') {
    return res.status(400).json({ error: 'Lead is no longer active' });
  }

  const existing = await MatchRequest.findOne({ lead: lead._id, matchBroker: req.user._id });
  if (existing) {
    return res.status(409).json({ error: 'You already requested a match on this lead' });
  }

  const mr = await MatchRequest.create({
    lead: lead._id,
    leadBroker: lead.broker,
    matchBroker: req.user._id,
    property: propertyId || undefined,
    initiatorMessage: message || '',
    messages: message ? [{ sender: req.user._id, text: message }] : [],
  });

  await Notification.create({
    user: lead.broker,
    type: 'match',
    title: 'New co-broking match request',
    body: `${req.user.name} wants to connect on your lead in ${lead.area || lead.city || 'your area'}.`,
    link: '/matches',
  });

  res.status(201).json({ match: await shape(mr, req.user._id) });
}

export async function listMatches(req, res) {
  const matches = await MatchRequest.find({
    $or: [{ leadBroker: req.user._id }, { matchBroker: req.user._id }],
  }).sort({ updatedAt: -1 });
  const data = await Promise.all(matches.map((m) => shape(m, req.user._id)));
  res.json({ matches: data });
}

export async function respondMatch(req, res) {
  const { decision } = req.body; // 'accept' | 'decline'
  const mr = await MatchRequest.findById(req.params.id);
  if (!mr) return res.status(404).json({ error: 'Match not found' });
  if (String(mr.leadBroker) !== String(req.user._id)) {
    return res.status(403).json({ error: 'Only the lead owner can respond' });
  }

  if (decision === 'accept') {
    mr.leadBrokerAccepted = true;
    mr.status = 'accepted';
  } else {
    mr.status = 'declined';
  }
  await mr.save();

  await Notification.create({
    user: mr.matchBroker,
    type: 'match',
    title: `Match ${mr.status}`,
    body:
      mr.status === 'accepted'
        ? 'Your co-broking request was accepted. Contact details are now visible.'
        : 'Your co-broking request was declined.',
    link: '/matches',
  });

  res.json({ match: await shape(mr, req.user._id) });
}

export async function postMessage(req, res) {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'text is required' });

  const mr = await MatchRequest.findById(req.params.id);
  if (!mr) return res.status(404).json({ error: 'Match not found' });

  const isParty =
    String(mr.leadBroker) === String(req.user._id) ||
    String(mr.matchBroker) === String(req.user._id);
  if (!isParty) return res.status(403).json({ error: 'Not your conversation' });

  mr.messages.push({ sender: req.user._id, text });
  await mr.save();

  const recipient =
    String(mr.leadBroker) === String(req.user._id) ? mr.matchBroker : mr.leadBroker;
  await Notification.create({
    user: recipient,
    type: 'message',
    title: 'New co-broking message',
    body: `${req.user.name}: ${text.slice(0, 60)}`,
    link: '/matches',
  });

  res.json({ match: await shape(mr, req.user._id) });
}
