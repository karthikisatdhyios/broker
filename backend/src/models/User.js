import bcrypt from 'bcryptjs';
import { createModel } from '../db/odm.js';

export const User = createModel('User', {
  defaults: {
    name: '',
    email: '',
    phone: '',
    agency: '',
    passwordHash: '',
    subscription: () => ({ tier: 'free', status: 'active', since: null, validUntil: null }),
  },
  indexes: [{ fieldName: 'email', unique: true }],
  methods: {
    async setPassword(password) {
      this.passwordHash = await bcrypt.hash(password, 10);
    },
    verifyPassword(password) {
      return bcrypt.compare(password, this.passwordHash);
    },
    toSafeJSON() {
      return {
        id: this._id,
        name: this.name,
        email: this.email,
        phone: this.phone,
        agency: this.agency,
        subscription: this.subscription,
        createdAt: this.createdAt,
      };
    },
  },
});
