import { User } from '../models/User.js';
import { signToken } from '../middleware/auth.js';
import { requireValidContactFields } from '../utils/validation.js';

export async function register(req, res) {
  const { name, email, password, phone, agency } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email and password are required' });
  }
  const contactError = requireValidContactFields({ email, phone });
  if (contactError) return res.status(400).json({ error: contactError });
  const normalizedEmail = email.toLowerCase().trim();
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) return res.status(409).json({ error: 'Email already registered' });

  const user = new User({ name, email: normalizedEmail, phone, agency });
  await user.setPassword(password);
  await user.save();

  const token = signToken(user);
  res.status(201).json({ token, user: user.toSafeJSON() });
}

export async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }
  const contactError = requireValidContactFields({ email });
  if (contactError) return res.status(400).json({ error: contactError });
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const ok = await user.verifyPassword(password);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  const token = signToken(user);
  res.json({ token, user: user.toSafeJSON() });
}

export async function me(req, res) {
  res.json({ user: req.user.toSafeJSON() });
}

export async function updateProfile(req, res) {
  const { name, phone, agency } = req.body;
  const contactError = requireValidContactFields({ phone });
  if (contactError) return res.status(400).json({ error: contactError });
  if (name !== undefined) req.user.name = name;
  if (phone !== undefined) req.user.phone = phone;
  if (agency !== undefined) req.user.agency = agency;
  await req.user.save();
  res.json({ user: req.user.toSafeJSON() });
}
