import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import Modal from '../components/Modal.jsx';
import { inr, fmtDate } from '../utils/format.js';

export default function CrmPage() {
  const [tab, setTab] = useState('landlords');
  return (
    <>
      <div className="page-header"><div><h1>CRM</h1><p>Your private landlord & tenant records. Not shared with anyone.</p></div></div>
      <div className="tabs">
        <button className={tab === 'landlords' ? 'active' : ''} onClick={() => setTab('landlords')}>Landlords</button>
        <button className={tab === 'tenants' ? 'active' : ''} onClick={() => setTab('tenants')}>Tenants</button>
      </div>
      {tab === 'landlords' ? <Landlords /> : <Tenants />}
    </>
  );
}

function Landlords() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [edit, setEdit] = useState(null);
  const blank = { name: '', phone: '', email: '', area: '', propertiesOwned: '', notes: '' };

  const load = async () => { const { data } = await api.get('/landlords', { params: q ? { q } : {} }); setItems(data.landlords); };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [q]);

  const remove = async (id) => { if (confirm('Delete landlord?')) { await api.delete(`/landlords/${id}`); load(); } };

  return (
    <>
      <div className="spread" style={{ marginBottom: 14 }}>
        <input className="input" style={{ maxWidth: 300 }} placeholder="Search by name or area…" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn" onClick={() => setEdit(blank)}>+ Add landlord</button>
      </div>
      {items.length === 0 ? <div className="card empty"><div className="big">👤</div>No landlords yet.</div> : (
        <div className="table-wrap card" style={{ padding: 0 }}>
          <table className="table">
            <thead><tr><th>Name</th><th>Phone</th><th>Area</th><th>Properties</th><th>Notes</th><th></th></tr></thead>
            <tbody>
              {items.map((l) => (
                <tr key={l._id}>
                  <td><strong>{l.name}</strong></td>
                  <td>{l.phone || '—'}</td>
                  <td>{l.area || '—'}</td>
                  <td>{l.propertiesOwned || '—'}</td>
                  <td className="muted small">{l.notes || '—'}</td>
                  <td>
                    <div className="row" style={{ gap: 6 }}>
                      <button className="btn secondary small" onClick={() => setEdit(l)}>Edit</button>
                      <button className="btn danger small" onClick={() => remove(l._id)}>Del</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {edit && <LandlordModal initial={edit} onClose={() => setEdit(null)} onDone={() => { setEdit(null); load(); }} />}
    </>
  );
}

function LandlordModal({ initial, onClose, onDone }) {
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setBusy(true);
    try {
      if (form._id) await api.patch(`/landlords/${form._id}`, form);
      else await api.post('/landlords', form);
      onDone();
    } finally { setBusy(false); }
  };
  return (
    <Modal title={form._id ? 'Edit landlord' : 'Add landlord'} onClose={onClose} maxWidth={460}>
      <form onSubmit={submit}>
        <div className="field"><label>Name *</label><input className="input" value={form.name} onChange={set('name')} required /></div>
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
          <div className="field"><label>Email</label><input className="input" type="email" value={form.email} onChange={set('email')} /></div>
        </div>
        <div className="row">
          <div className="field"><label>Area</label><input className="input" value={form.area} onChange={set('area')} /></div>
          <div className="field"><label>Properties owned</label><input className="input" value={form.propertiesOwned} onChange={set('propertiesOwned')} /></div>
        </div>
        <div className="field"><label>Notes</label><textarea className="textarea" value={form.notes} onChange={set('notes')} /></div>
        <button className="btn block" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
      </form>
    </Modal>
  );
}

function Tenants() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [edit, setEdit] = useState(null);
  const blank = { name: '', phone: '', email: '', propertyAddress: '', rent: '', requirements: '', leaseStart: new Date().toISOString().slice(0, 10) };

  const load = async () => { const { data } = await api.get('/tenants', { params: q ? { q } : {} }); setItems(data.tenants); };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [q]);
  const remove = async (id) => { if (confirm('Delete tenant?')) { await api.delete(`/tenants/${id}`); load(); } };

  return (
    <>
      <div className="spread" style={{ marginBottom: 14 }}>
        <input className="input" style={{ maxWidth: 300 }} placeholder="Search by name or address…" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn" onClick={() => setEdit(blank)}>+ Add tenant</button>
      </div>
      {items.length === 0 ? <div className="card empty"><div className="big">🧑‍🤝‍🧑</div>No tenants yet.</div> : (
        <div className="table-wrap card" style={{ padding: 0 }}>
          <table className="table">
            <thead><tr><th>Name</th><th>Phone</th><th>Property</th><th>Rent</th><th>Lease start</th><th>Lease end</th><th></th></tr></thead>
            <tbody>
              {items.map((t) => (
                <tr key={t._id}>
                  <td><strong>{t.name}</strong></td>
                  <td>{t.phone || '—'}</td>
                  <td className="small">{t.propertyAddress || '—'}</td>
                  <td>{t.rent ? inr(t.rent) : '—'}</td>
                  <td>{fmtDate(t.leaseStart)}</td>
                  <td>{fmtDate(t.leaseEnd)}</td>
                  <td>
                    <div className="row" style={{ gap: 6 }}>
                      <button className="btn secondary small" onClick={() => setEdit({ ...t, leaseStart: t.leaseStart?.slice(0, 10) })}>Edit</button>
                      <button className="btn danger small" onClick={() => remove(t._id)}>Del</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {edit && <TenantModal initial={edit} onClose={() => setEdit(null)} onDone={() => { setEdit(null); load(); }} />}
    </>
  );
}

function TenantModal({ initial, onClose, onDone }) {
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setBusy(true);
    try {
      if (form._id) await api.patch(`/tenants/${form._id}`, form);
      else await api.post('/tenants', form);
      onDone();
    } finally { setBusy(false); }
  };
  return (
    <Modal title={form._id ? 'Edit tenant' : 'Add tenant'} onClose={onClose} maxWidth={460}>
      <form onSubmit={submit}>
        <div className="field"><label>Name *</label><input className="input" value={form.name} onChange={set('name')} required /></div>
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
          <div className="field"><label>Email</label><input className="input" type="email" value={form.email} onChange={set('email')} /></div>
        </div>
        <div className="field"><label>Property address</label><input className="input" value={form.propertyAddress} onChange={set('propertyAddress')} /></div>
        <div className="row">
          <div className="field"><label>Rent</label><input className="input" type="number" value={form.rent} onChange={set('rent')} /></div>
          <div className="field"><label>Lease start</label><input className="input" type="date" value={form.leaseStart} onChange={set('leaseStart')} /></div>
        </div>
        <div className="help">Lease end is auto-calculated as start + 11 months.</div>
        <div className="field"><label>Requirements / notes</label><textarea className="textarea" value={form.requirements} onChange={set('requirements')} /></div>
        <button className="btn block" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
      </form>
    </Modal>
  );
}
