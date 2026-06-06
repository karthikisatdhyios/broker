import { Property } from '../models/Property.js';
import { Lead } from '../models/Lead.js';
import { Tenant } from '../models/Tenant.js';
import { Notification } from '../models/Notification.js';
import { config } from '../config/index.js';
import { addDays, daysBetween } from './time.js';

// Expire properties whose 48h window has passed (available -> expired).
export async function expireProperties() {
  const now = new Date();
  const result = await Property.updateMany(
    { status: 'available', expiresAt: { $lte: now } },
    { $set: { status: 'expired' } }
  );
  if (result.modifiedCount) console.log(`[jobs] expired ${result.modifiedCount} properties`);
  return result.modifiedCount;
}

// Disable leads past their 2-3 week window (active -> expired).
export async function expireLeads() {
  const now = new Date();
  const result = await Lead.updateMany(
    { status: 'active', expiresAt: { $lte: now } },
    { $set: { status: 'expired' } }
  );
  if (result.modifiedCount) console.log(`[jobs] expired ${result.modifiedCount} leads`);
  return result.modifiedCount;
}

// Notify brokers about leases ending within the renewal window (deduped per tenant per window).
export async function generateRenewalNotifications() {
  const now = new Date();
  const horizon = addDays(now, config.renewalWindowDays);
  const tenants = await Tenant.find({ leaseEnd: { $gte: now, $lte: horizon } });

  let created = 0;
  for (const t of tenants) {
    const daysLeft = daysBetween(now, t.leaseEnd);
    const dedupeKey = `renewal:${t._id}:${t.leaseEnd.toISOString().slice(0, 10)}`;
    const exists = await Notification.findOne({ dedupeKey });
    if (exists) continue;

    await Notification.create({
      user: t.broker,
      type: 'renewal',
      title: 'Lease renewal coming up',
      body: `${t.name}'s lease at ${t.propertyAddress || 'their property'} ends in ${daysLeft} day(s).`,
      link: '/renewals',
      dedupeKey,
    });
    created += 1;
  }
  if (created) console.log(`[jobs] created ${created} renewal notifications`);
  return created;
}

export async function runAllJobs() {
  await expireProperties();
  await expireLeads();
  await generateRenewalNotifications();
}
