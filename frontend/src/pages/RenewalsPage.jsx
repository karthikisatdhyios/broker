import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { inr, fmtDate } from '../utils/format.js';

export default function RenewalsPage() {
  const [tenants, setTenants] = useState([]);
  const [windowDays, setWindowDays] = useState(30);
  const [toast, setToast] = useState('');

  const load = async () => {
    const { data } = await api.get('/tenants/renewals');
    setTenants(data.tenants);
    setWindowDays(data.windowDays);
  };
  useEffect(() => { load(); }, []);

  const flash = (m) => { setToast(m); setTimeout(() => setToast(''), 2000); };
  const contacted = async (id) => { await api.post(`/tenants/${id}/renewal-contacted`); flash('Marked as contacted'); load(); };
  const copy = (txt) => { navigator.clipboard?.writeText(txt); flash('Copied: ' + txt); };

  const badge = (d) => (d < 0 ? 'red' : d <= 7 ? 'red' : d <= 15 ? 'amber' : 'green');

  return (
    <>
      <div className="page-header"><div><h1>Renewal Watchlist</h1><p>Tenants whose lease ends within the next {windowDays} days. Reach out early to retain the deal.</p></div></div>

      {tenants.length === 0 ? (
        <div className="card empty"><div className="big">✅</div>No renewals due in the next {windowDays} days.</div>
      ) : (
        <div className="table-wrap card" style={{ padding: 0 }}>
          <table className="table">
            <thead><tr><th>Tenant</th><th>Property</th><th>Lease end</th><th>Days left</th><th>Rent</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {tenants.map((t) => (
                <tr key={t.id}>
                  <td><strong>{t.name}</strong><div className="tiny muted">{t.phone}</div></td>
                  <td className="small">{t.propertyAddress || '—'}</td>
                  <td>{fmtDate(t.leaseEnd)}</td>
                  <td><span className={`badge ${badge(t.daysLeft)}`}>{t.daysLeft < 0 ? `${-t.daysLeft}d overdue` : `${t.daysLeft} days`}</span></td>
                  <td>{t.rent ? inr(t.rent) : '—'}</td>
                  <td>{t.renewalContacted ? <span className="badge blue">contacted</span> : <span className="badge gray">pending</span>}</td>
                  <td>
                    <div className="row" style={{ gap: 6 }}>
                      {t.phone && <button className="btn secondary small" onClick={() => copy(t.phone)}>Copy phone</button>}
                      {t.email && <button className="btn secondary small" onClick={() => copy(t.email)}>Copy email</button>}
                      {!t.renewalContacted && <button className="btn small" onClick={() => contacted(t.id)}>Mark contacted</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
