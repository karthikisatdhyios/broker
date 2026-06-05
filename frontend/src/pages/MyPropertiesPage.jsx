import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import Modal from '../components/Modal.jsx';
import PropertyForm from '../components/PropertyForm.jsx';
import PhotoCarousel from '../components/PhotoCarousel.jsx';
import { inr, timeLeft, fmtDate } from '../utils/format.js';

export default function MyPropertiesPage() {
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [rentTarget, setRentTarget] = useState(null);
  const [toast, setToast] = useState('');

  const load = async () => {
    const { data } = await api.get('/properties/mine');
    setItems(data.properties);
  };
  useEffect(() => { load(); }, []);

  const flash = (m) => { setToast(m); setTimeout(() => setToast(''), 2500); };

  const refresh = async (id) => {
    await api.post(`/properties/${id}/refresh`);
    flash('Listing refreshed — live for another 48h');
    load();
  };
  const remove = async (id) => {
    if (!confirm('Delete this property?')) return;
    await api.delete(`/properties/${id}`);
    load();
  };

  return (
    <>
      <div className="page-header">
        <div><h1>My Inventory</h1><p>Your posted properties. Refresh before the 48h expiry to keep them live.</p></div>
        <button className="btn" onClick={() => setShowForm(true)}>+ Post property</button>
      </div>

      {items.length === 0 ? (
        <div className="card empty"><div className="big">🏠</div>No properties yet. Post your first listing!</div>
      ) : (
        <div className="grid auto">
          {items.map((p) => {
            const available = p.status === 'available';
            const expired = p.status === 'expired';
            return (
              <div className="card prop-card" key={p.id}>
                {p.photos?.length > 0 && <PhotoCarousel photos={p.photos} alt={p.title || p.address} height={150} />}
                <div className="spread">
                  <span className={`badge ${available ? 'green' : expired ? 'amber' : 'red'}`}>{p.status}</span>
                  <span className="rent">{inr(p.rent)}</span>
                </div>
                <h3 style={{ margin: '8px 0 2px' }}>{p.title || p.address}</h3>
                <div className="prop-meta"><span>🛏 {p.bedrooms}BHK</span><span>📍 {p.address}</span></div>
                <div className="small muted">Commission: {p.commissionSplit}</div>
                {available && <div className="small" style={{ color: 'var(--amber)' }}>⏳ {timeLeft(p.expiresAt)}</div>}
                {expired && <div className="small" style={{ color: 'var(--amber)' }}>Expired — refresh to relist</div>}

                <div className="card-actions">
                  {p.status !== 'rented' && <button className="btn secondary small" onClick={() => refresh(p.id)}>Refresh 48h</button>}
                  {available && <button className="btn success small" onClick={() => setRentTarget(p)}>Mark rented</button>}
                  <button className="btn danger small" onClick={() => remove(p.id)}>Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <Modal title="Post a property" onClose={() => setShowForm(false)}>
          <PropertyForm onCreated={() => { setShowForm(false); load(); }} />
        </Modal>
      )}
      {rentTarget && (
        <MarkRentedModal property={rentTarget} onClose={() => setRentTarget(null)} onDone={() => { setRentTarget(null); flash('Marked rented & tenant saved'); load(); }} />
      )}
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}

function MarkRentedModal({ property, onClose, onDone }) {
  const [form, setForm] = useState({ tenantName: '', tenantPhone: '', tenantEmail: '', leaseStart: new Date().toISOString().slice(0, 10) });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault(); setBusy(true);
    try { await api.post(`/properties/${property.id}/rent`, form); onDone(); }
    finally { setBusy(false); }
  };
  return (
    <Modal title="Mark as rented" onClose={onClose} maxWidth={460}>
      <p className="muted small">Optionally add tenant details to create a converted tenant record (lease auto-set to 11 months for renewal tracking).</p>
      <form onSubmit={submit}>
        <div className="field"><label>Tenant name</label><input className="input" value={form.tenantName} onChange={set('tenantName')} /></div>
        <div className="row">
          <div className="field">
            <label>Phone</label>
            <input
              className="input"
              type="tel"
              inputMode="tel"
              pattern="^\+?[0-9][0-9\s().-]{6,19}$"
              title="Enter a valid phone number, e.g. +91 98765 43210"
              value={form.tenantPhone}
              onChange={set('tenantPhone')}
            />
          </div>
          <div className="field"><label>Email</label><input className="input" type="email" value={form.tenantEmail} onChange={set('tenantEmail')} /></div>
        </div>
        <div className="field"><label>Lease start date</label><input className="input" type="date" value={form.leaseStart} onChange={set('leaseStart')} /></div>
        <button className="btn success block" disabled={busy}>{busy ? 'Saving…' : 'Confirm rented'}</button>
      </form>
    </Modal>
  );
}
