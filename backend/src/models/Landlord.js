import { createModel } from '../db/odm.js';

export const Landlord = createModel('Landlord', {
  refs: { broker: 'User' },
  defaults: {
    broker: null,
    name: '',
    phone: '',
    email: '',
    area: '',
    propertiesOwned: '',
    notes: '',
  },
});
