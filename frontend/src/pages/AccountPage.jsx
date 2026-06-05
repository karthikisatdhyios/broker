import { useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { fmtDate } from '../utils/format.js';

export default function AccountPage() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ name: user.name, phone: user.phone || '', agency: user.agency || '' });
  const [toast, setToast] = useState('');
  const [busy, setBusy] = useState(false);

  const flash = (m) => { setToast(m); setTimeout(() => setToast(''), 2500); };
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const saveProfile = async (e) => {
    e.preventDefault(); setBusy(true);
    try { const { data } = await api.patch('/auth/me', form); setUser(data.user); flash('Profile updated'); }
    finally { setBusy(false); }
  };

  const subscribe = async () => {
    const { data } = await api.post('/subscription/subscribe');
    setUser(data.user); flash('Subscribed! Unlimited listings unlocked.');
  };
  const cancel = async () => {
    const { data } = await api.post('/subscription/cancel');
    setUser(data.user); flash('Subscription cancelled.');
  };

  const paid = user.subscription?.tier === 'paid';

  return (
    <>
      <div className="page-header"><div><h1>Account & Subscription</h1><p>Manage your profile and plan. Your CRM data stays private to you.</p></div></div>

      <div className="grid cols-2">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Profile</h3>
          <form onSubmit={saveProfile}>
            <div className="field"><label>Name</label><input className="input" value={form.name} onChange={set('name')} /></div>
            <div className="field"><label>Email</label><input className="input" value={user.email} disabled /></div>
            <div className="row">
              <div className="field">
                <label>Phone</label>
                <input
                  className="input"
                  type="tel"
                  inputMode="tel"
                  pattern="^\+?[0-9][0-9\s().-]{6,19}$"
                  title="Enter a valid phone number, e.g. +91 98765 43210"
                  value={form.phone}
                  onChange={set('phone')}
                />
              </div>
              <div className="field"><label>Agency</label><input className="input" value={form.agency} onChange={set('agency')} /></div>
            </div>
            <button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Save profile'}</button>
          </form>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Subscription</h3>
          <div className="spread">
            <span>Current plan</span>
            <span className={`badge ${paid ? 'green' : 'gray'}`}>{paid ? '★ Paid' : 'Free'}</span>
          </div>
          {paid && user.subscription?.validUntil && (
            <div className="small muted" style={{ marginTop: 6 }}>Valid until {fmtDate(user.subscription.validUntil)}</div>
          )}

          <div className="grid cols-2" style={{ marginTop: 16 }}>
            <div className="card" style={{ borderColor: paid ? 'var(--border)' : 'var(--primary)' }}>
              <strong>Free</strong>
              <div className="rent" style={{ fontSize: 22 }}>₹0</div>
              <ul className="small muted" style={{ paddingLeft: 18 }}>
                <li>Up to 5 active properties</li>
                <li>Co-broking feed & leads</li>
                <li>Full CRM & renewals</li>
              </ul>
            </div>
            <div className="card" style={{ borderColor: paid ? 'var(--green)' : 'var(--border)' }}>
              <strong>Paid</strong>
              <div className="rent" style={{ fontSize: 22 }}>₹999<span className="small muted">/mo</span></div>
              <ul className="small muted" style={{ paddingLeft: 18 }}>
                <li>Unlimited properties</li>
                <li>Priority co-broking</li>
                <li>Everything in Free</li>
              </ul>
            </div>
          </div>

          {paid ? (
            <button className="btn danger block" style={{ marginTop: 14 }} onClick={cancel}>Cancel subscription</button>
          ) : (
            <button className="btn success block" style={{ marginTop: 14 }} onClick={subscribe}>Subscribe (mock payment)</button>
          )}
          <div className="help">This is a mock payment for the MVP — no real charge is made.</div>
        </div>
      </div>
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
