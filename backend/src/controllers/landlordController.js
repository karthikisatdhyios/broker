import { Landlord } from '../models/Landlord.js';
import { requireValidContactFields } from '../utils/validation.js';

export async function listLandlords(req, res) {
  const { q } = req.query;
  const filter = { broker: req.user._id };
  if (q) {
    filter.$or = [
      { name: new RegExp(q, 'i') },
      { area: new RegExp(q, 'i') },
      { phone: new RegExp(q, 'i') },
    ];
  }
  const landlords = await Landlord.find(filter).sort({ updatedAt: -1 });
  res.json({ landlords });
}

export async function createLandlord(req, res) {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const contactError = requireValidContactFields({ phone: req.body.phone, email: req.body.email });
  if (contactError) return res.status(400).json({ error: contactError });
  const landlord = await Landlord.create({ ...req.body, broker: req.user._id });
  res.status(201).json({ landlord });
}

export async function updateLandlord(req, res) {
  const contactError = requireValidContactFields({ phone: req.body.phone, email: req.body.email });
  if (contactError) return res.status(400).json({ error: contactError });
  const landlord = await Landlord.findOneAndUpdate(
    { _id: req.params.id, broker: req.user._id },
    req.body,
    { new: true }
  );
  if (!landlord) return res.status(404).json({ error: 'Landlord not found' });
  res.json({ landlord });
}

export async function deleteLandlord(req, res) {
  const landlord = await Landlord.findOneAndDelete({ _id: req.params.id, broker: req.user._id });
  if (!landlord) return res.status(404).json({ error: 'Landlord not found' });
  res.json({ ok: true });
}
