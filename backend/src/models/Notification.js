import { createModel } from '../db/odm.js';

export const Notification = createModel('Notification', {
  refs: { user: 'User' },
  defaults: {
    user: null,
    type: 'system',
    title: '',
    body: '',
    link: '',
    read: false,
    dedupeKey: null,
  },
});
