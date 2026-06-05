import { createModel } from '../db/odm.js';

/**
 * A co-broking connection between two brokers around a Lead (and optionally a
 * Property the other broker wants to pitch). Contact details are revealed only
 * after the lead owner accepts. Messages are stored as an embedded array.
 */
export const MatchRequest = createModel('MatchRequest', {
  refs: { lead: 'Lead', leadBroker: 'User', matchBroker: 'User', property: 'Property' },
  defaults: {
    lead: null,
    leadBroker: null,
    matchBroker: null,
    property: null,
    initiatorMessage: '',
    leadBrokerAccepted: false,
    matchBrokerAccepted: true,
    status: 'pending',
    messages: () => [],
  },
});
