import { createModel } from '../db/odm.js';

export const Lead = createModel('Lead', {
  refs: { broker: 'User' },
  defaults: {
    broker: null,
    customerName: '',
    customerContact: '',
    budgetMin: 0,
    budgetMax: 0,
    bedrooms: 1,
    area: '',
    city: '',
    occupantType: 'Any',
    pets: false,
    jobType: '',
    commissionSplit: '50% of 1 month',
    notes: '',
    status: 'active',
    expiresAt: null,
  },
});
