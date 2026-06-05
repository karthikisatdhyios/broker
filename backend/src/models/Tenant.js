import { createModel } from '../db/odm.js';

export const Tenant = createModel('Tenant', {
  refs: { broker: 'User', sourceLead: 'Lead', sourceProperty: 'Property' },
  defaults: {
    broker: null,
    name: '',
    phone: '',
    email: '',
    propertyAddress: '',
    requirements: '',
    rent: 0,
    leaseStart: null,
    leaseEnd: null,
    renewalContacted: false,
    renewalContactedAt: null,
    sourceLead: null,
    sourceProperty: null,
  },
});
