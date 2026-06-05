import { inr, timeLeft, ago } from '../utils/format.js';
import PhotoCarousel from './PhotoCarousel.jsx';

export default function PropertyDetails({ property }) {
  if (!property) return null;
  const p = property;
  const available = p.status === 'available';
  return (
    <div className="card prop-card">
      <div className="spread">
        <span className={`badge ${available ? 'green' : 'red'}`}>
          <span className={`dot ${available ? 'green' : 'red'}`} /> {p.status}
        </span>
        <span className="tiny muted">{ago(p.postedAt)}</span>
      </div>

      {p.photos?.length > 0 && <PhotoCarousel photos={p.photos} alt={p.title} height={170} />}

      <h3 style={{ margin: '8px 0 2px' }}>{p.title || p.address}</h3>
      <div className="rent">{inr(p.rent)}<span className="small muted">/month</span></div>
      <div className="prop-meta">
        <span>🛏 {p.bedrooms} BHK</span>
        <span>🛋 {p.furnishing}</span>
        <span>👤 {p.tenantPreference}</span>
        {p.petsAllowed && <span>🐾 Pets ok</span>}
      </div>
      <div className="small muted">📍 {p.address}{p.city ? `, ${p.city}` : ''}</div>

      <div className="card" style={{ marginTop: 12, background: '#f9fafb', padding: 12 }}>
        <div className="small"><strong>Commission:</strong> {p.commissionSplit}</div>
        {available && (
          <div className="small" style={{ color: 'var(--amber)' }}>
            ⏳ {timeLeft(p.expiresAt)} (auto-expires 48h after posting)
          </div>
        )}
      </div>

      {p.broker && (
        <div style={{ marginTop: 12 }}>
          <div className="tiny muted" style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>Listing broker</div>
          <div><strong>{p.broker.name}</strong> {p.broker.agency && <span className="muted">· {p.broker.agency}</span>}</div>
          {p.broker.phone && <div className="small">📞 <a href={`tel:${p.broker.phone}`}>{p.broker.phone}</a></div>}
          {p.broker.email && <div className="small">✉️ <a href={`mailto:${p.broker.email}`}>{p.broker.email}</a></div>}
        </div>
      )}
    </div>
  );
}
