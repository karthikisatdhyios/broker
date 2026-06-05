import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import Modal from '../components/Modal.jsx';
import { inr, fmtDate } from '../utils/format.js';

const emptyLead = {
  customerName: '', customerContact: '', budgetMin: '', budgetMax: '', bedrooms: '2',
  area: '', city: 'Bengaluru', occupantType: 'Any', pets: false, jobType: '',
  commissionSplit: '50% of 1 month', notes: '',
};

export default function LeadsPage() {
  const [tab, setTab] = useState('feed');
  const [feed, setFeed] = useState([]);
  const [mine, setMine] = useState([]);
  const [filters, setFilters] = useState({ area: '', maxBudget: '', bedrooms: '' });
  const [showForm, setShowForm] = useState(false);
  const [matchTarget, setMatchTarget] = useState(null);
  const [convertTarget, setConvertTarget] = useState(null);
  const [toast, setToast] = useState('');
  const navigate = useNavigate();

  const flash = (m) => { setToast(m); setTimeout(() => setToast(''), 2500); };

  const loadFeed = async () => {
    const params = {};
    if (filters.area) params.area = filters.area;
    if (filters.maxBudget) params.maxBudget = filters.maxBudget;
    if (filters.bedrooms) params.bedrooms = filters.bedrooms;
    const { data } = await api.get('/leads', { params });
    // Co-broking feed shows only other brokers' leads (yours are under "My leads").
    setFeed(data.leads.filter((l) => !l.isOwner));
  };
  const loadMine = async () => {
    const { data } = await api.get('/leads/mine');
    setMine(data.leads);
  };
  useEffect(() => { loadFeed(); loadMine(); }, []);
  useEffect(() => { loadFeed(); /* eslint-disable-next-line */ }, [filters]);

  const remove = async (id) => { if (confirm('Delete lead?')) { await api.delete(`/leads/${id}`); loadMine(); loadFeed(); } };

  return (
    <>
      <div className="page-header">
        <div><h1>Co-broking Leads</h1><p>Share customer requirements and connect with brokers who have a matching property.</p></div>
        <button className="btn" onClick={() => setShowForm(true)}>+ New lead</button>
      </div>

      <div className="tabs">
        <button className={tab === 'feed' ? 'active' : ''} onClick={() => setTab('feed')}>Co-broking feed</button>
        <button className={tab === 'mine' ? 'active' : ''} onClick={() => setTab('mine')}>My leads ({mine.length})</button>
      </div>

      {tab === 'feed' && (
        <>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="row">
              <div className="field" style={{ margin: 0 }}><label>Area</label><input className="input" value={filters.area} onChange={(e) => setFilters({ ...filters, area: e.target.value })} placeholder="e.g. Koramangala" /></div>
              <div className="field" style={{ margin: 0 }}><label>Max budget</label><input className="input" type="number" value={filters.maxBudget} onChange={(e) => setFilters({ ...filters, maxBudget: e.target.value })} /></div>
              <div className="field" style={{ margin: 0 }}><label>BHK</label>
                <select className="select" value={filters.bedrooms} onChange={(e) => setFilters({ ...filters, bedrooms: e.target.value })}>
                  <option value="">Any</option>{[1, 2, 3, 4].map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            </div>
          </div>
          {feed.length === 0 ? <div className="card empty"><div className="big">🔎</div>No active leads match your filters.</div> : (
            <div className="grid auto">
              {feed.map((l) => <LeadCard key={l.id} lead={l} onMatch={() => setMatchTarget(l)} />)}
            </div>
          )}
        </>
      )}

      {tab === 'mine' && (
        mine.length === 0 ? <div className="card empty"><div className="big">📋</div>No leads yet. Create one to start co-broking.</div> : (
          <div className="grid auto">
            {mine.map((l) => (
              <LeadCard key={l.id} lead={l} owner
                onConvert={l.status === 'active' ? () => setConvertTarget(l) : null}
                onDelete={() => remove(l.id)} />
            ))}
          </div>
        )
      )}

      {showForm && <LeadFormModal onClose={() => setShowForm(false)} onDone={() => { setShowForm(false); loadMine(); loadFeed(); flash('Lead created'); }} />}
      {matchTarget && <MatchModal lead={matchTarget} onClose={() => setMatchTarget(null)} onDone={() => { setMatchTarget(null); flash('Match request sent!'); navigate('/matches'); }} />}
      {convertTarget && <ConvertModal lead={convertTarget} onClose={() => setConvertTarget(null)} onDone={() => { setConvertTarget(null); loadMine(); flash('Lead converted to tenant'); }} />}
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}

function LeadCard({ lead: l, owner, onMatch, onConvert, onDelete }) {
  const expired = l.status !== 'active';
  return (
    <div className="card">
      <div className="spread">
        <span className={`badge ${l.status === 'active' ? 'green' : l.status === 'converted' ? 'blue' : 'gray'}`}>{l.status}</span>
        <span className="tiny muted">expires {fmtDate(l.expiresAt)}</span>
      </div>
      <h3 style={{ margin: '8px 0 4px' }}>{inr(l.budgetMin)}–{inr(l.budgetMax)} · {l.bedrooms}BHK</h3>
      <div className="prop-meta">
        <span>📍 {l.area || l.city}</span>
        <span>👥 {l.occupantType}</span>
        {l.pets && <span>🐾 pets</span>}
        {l.jobType && <span>💼 {l.jobType}</span>}
      </div>
      {l.notes && <div className="small muted">{l.notes}</div>}
      <div className="small" style={{ marginTop: 6 }}><strong>Split:</strong> {l.commissionSplit}</div>
      {owner ? (
        <>
          <div className="small muted" style={{ marginTop: 6 }}>Customer: {l.customerName || '—'} {l.customerContact && `· ${l.customerContact}`}</div>
          <div className="card-actions">
            {onConvert && <button className="btn success small" onClick={onConvert}>Convert to tenant</button>}
            <button className="btn danger small" onClick={onDelete}>Delete</button>
          </div>
        </>
      ) : (
        <div className="card-actions">
          <div className="tiny muted" style={{ flex: '1 1 100%' }}>Posted by {l.broker?.name}{l.broker?.agency ? ` · ${l.broker.agency}` : ''}</div>
          <button className="btn small block" disabled={expired} onClick={onMatch}>I have a match →</button>
        </div>
      )}
    </div>
  );
}

function LeadFormModal({ onClose, onDone }) {
  const [form, setForm] = useState(emptyLead);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setError('');
    try { await api.post('/leads', form); onDone(); }
    catch (err) { setError(err.userMessage); } finally { setBusy(false); }
  };
  return (
    <Modal title="New customer lead" onClose={onClose}>
      <form onSubmit={submit}>
        {error && <div className="error-text">{error}</div>}
        <div className="row">
          <div className="field"><label>Customer name</label><input className="input" value={form.customerName} onChange={set('customerName')} /></div>
          <div className="field">
            <label>Customer phone (private)</label>
            <input
              className="input"
              type="tel"
              inputMode="tel"
              pattern="^\+?[0-9][0-9\s().-]{6,19}$"
              title="Enter a valid phone number, e.g. +91 98765 43210"
              value={form.customerContact}
              onChange={set('customerContact')}
            />
          </div>
        </div>
        <div className="row">
          <div className="field"><label>Budget min</label><input className="input" type="number" value={form.budgetMin} onChange={set('budgetMin')} /></div>
          <div className="field"><label>Budget max *</label><input className="input" type="number" value={form.budgetMax} onChange={set('budgetMax')} required /></div>
          <div className="field"><label>BHK</label>
            <select className="select" value={form.bedrooms} onChange={set('bedrooms')}>{[1, 2, 3, 4, 5].map((b) => <option key={b} value={b}>{b}</option>)}</select>
          </div>
        </div>
        <div className="row">
          <div className="field"><label>Area</label><input className="input" value={form.area} onChange={set('area')} placeholder="e.g. HSR Layout" /></div>
          <div className="field"><label>Occupant</label>
            <select className="select" value={form.occupantType} onChange={set('occupantType')}><option>Any</option><option>Family</option><option>Bachelor</option></select>
          </div>
        </div>
        <div className="row">
          <div className="field"><label>Job type</label><input className="input" value={form.jobType} onChange={set('jobType')} /></div>
          <div className="field"><label>Commission split</label><input className="input" value={form.commissionSplit} onChange={set('commissionSplit')} /></div>
        </div>
        <div className="field checkbox"><input id="lpets" type="checkbox" checked={form.pets} onChange={set('pets')} /><label htmlFor="lpets" style={{ margin: 0 }}>Has pets</label></div>
        <div className="field"><label>Notes</label><textarea className="textarea" value={form.notes} onChange={set('notes')} /></div>
        <button className="btn block" disabled={busy}>{busy ? 'Saving…' : 'Create lead (active 3 weeks)'}</button>
      </form>
    </Modal>
  );
}

function MatchModal({ lead, onClose, onDone }) {
  const [message, setMessage] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [props, setProps] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { api.get('/properties/mine').then(({ data }) => setProps(data.properties.filter((p) => p.status === 'available'))); }, []);
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setError('');
    try { await api.post('/matches', { leadId: lead.id, propertyId: propertyId || undefined, message }); onDone(); }
    catch (err) { setError(err.userMessage); } finally { setBusy(false); }
  };
  return (
    <Modal title="Request co-broking match" onClose={onClose} maxWidth={480}>
      <p className="small muted">Lead: {inr(lead.budgetMin)}–{inr(lead.budgetMax)}, {lead.bedrooms}BHK in {lead.area || lead.city}. The lead owner must accept before contact details are revealed.</p>
      <form onSubmit={submit}>
        {error && <div className="error-text">{error}</div>}
        <div className="field"><label>Offer one of your properties (optional)</label>
          <select className="select" value={propertyId} onChange={(e) => setPropertyId(e.target.value)}>
            <option value="">— none —</option>
            {props.map((p) => <option key={p.id} value={p.id}>{(p.title || p.address)} · {inr(p.rent)}</option>)}
          </select>
        </div>
        <div className="field"><label>Message</label><textarea className="textarea" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Hi, I have a matching 2BHK in your client's budget…" /></div>
        <button className="btn block" disabled={busy}>{busy ? 'Sending…' : 'Send match request'}</button>
      </form>
    </Modal>
  );
}

function ConvertModal({ lead, onClose, onDone }) {
  const [form, setForm] = useState({ name: lead.customerName || '', phone: lead.customerContact || '', propertyAddress: '', rent: '', leaseStart: new Date().toISOString().slice(0, 10) });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const submit = async (e) => { e.preventDefault(); setBusy(true); try { await api.post(`/leads/${lead.id}/convert`, form); onDone(); } finally { setBusy(false); } };
  return (
    <Modal title="Convert lead to tenant" onClose={onClose} maxWidth={460}>
      <form onSubmit={submit}>
        <div className="field"><label>Tenant name</label><input className="input" value={form.name} onChange={set('name')} required /></div>
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
          <div className="field"><label>Rent</label><input className="input" type="number" value={form.rent} onChange={set('rent')} /></div>
        </div>
        <div className="field"><label>Property address</label><input className="input" value={form.propertyAddress} onChange={set('propertyAddress')} /></div>
        <div className="field"><label>Lease start</label><input className="input" type="date" value={form.leaseStart} onChange={set('leaseStart')} /></div>
        <button className="btn success block" disabled={busy}>{busy ? 'Saving…' : 'Convert to tenant'}</button>
      </form>
    </Modal>
  );
}
