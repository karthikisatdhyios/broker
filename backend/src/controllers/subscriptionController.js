import { addMonths } from '../utils/time.js';

/**
 * Mock subscription. No real payment — flips the user's tier to paid for 1 month.
 */
export async function subscribe(req, res) {
  const now = new Date();
  req.user.subscription = {
    tier: 'paid',
    status: 'active',
    since: now,
    validUntil: addMonths(now, 1),
  };
  await req.user.save();
  res.json({ user: req.user.toSafeJSON() });
}

export async function cancelSubscription(req, res) {
  req.user.subscription = {
    ...req.user.subscription.toObject?.() ?? req.user.subscription,
    tier: 'free',
    status: 'inactive',
  };
  await req.user.save();
  res.json({ user: req.user.toSafeJSON() });
}
