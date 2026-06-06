import cron from 'node-cron';
import { runAllJobs, expireProperties, expireLeads, generateRenewalNotifications } from './jobs.js';

/**
 * node-cron scheduler — used whenever the API runs as a long-lived process
 * (local dev, Elastic Beanstalk, App Runner, EC2, etc.).
 */
export function startScheduler() {
  // Run shortly after boot so the demo reflects current state immediately.
  setTimeout(() => runAllJobs().catch((e) => console.error('[jobs] error', e)), 3000);

  // Expiry checks every 15 minutes (48h windows are time-sensitive).
  cron.schedule('*/15 * * * *', () => {
    expireProperties().catch((e) => console.error(e));
    expireLeads().catch((e) => console.error(e));
  });

  // Renewal scan once a day at 08:00 server time.
  cron.schedule('0 8 * * *', () => {
    generateRenewalNotifications().catch((e) => console.error(e));
  });

  console.log('[jobs] scheduler started (expiry every 15m, renewals daily 08:00)');
}
