import { useState } from 'react';
import { api } from '../api/client.js';
import LocationPicker from './LocationPicker.jsx';
import { resolvePropertyLocation } from '../utils/geocodeClient.js';

const empty = {
  title: '', address: '', city: 'Bengaluru', rent: '', bedrooms: '1',
  furnishing: 'Semi-furnished', tenantPreference: 'Any', petsAllowed: false,
  landlordName: '', landlordContact: '', commissionSplit: '50% of 1 month', notes: '',
};

export default function PropertyForm({ onCreated }) {
  const [form, setForm] = useState(empty);
  const [position, setPosition] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [geocoding, setGeocoding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) =>
    setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const geocode = async () => {
    if (!form.address) return;
    setGeocoding(true); setError('');
    try {
      const location = await resolvePropertyLocation(api, form.address, form.city);
      if (!location) {
        setError('No results for that address — you can also click the map to drop a pin.');
        return;
      }
      setPosition(location);
    } finally {
      setGeocoding(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      let coords = position;
      if (!coords) {
        coords = await resolvePropertyLocation(api, form.address, form.city);
        if (coords) setPosition(coords);
      }

      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (coords) { fd.append('lat', coords.lat); fd.append('lng', coords.lng); }
      photos.forEach((f) => fd.append('photos', f));
      const { data } = await api.post('/properties', fd);
      setForm(empty); setPosition(null); setPhotos([]);
      onCreated?.(data.property);
    } catch (err) {
      setError(err.userMessage);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit}>
      {error && <div className="error-text">{error}</div>}
      <div className="field">
        <label>Title</label>
        <input className="input" placeholder="2BHK near Indiranagar Metro" value={form.title} onChange={set('title')} />
      </div>
      <div className="field">
        <label>Address *</label>
        <div className="row" style={{ gap: 8 }}>
          <input className="input" style={{ flex: 3 }} placeholder="Street, area" value={form.address} onChange={set('address')} required />
          <button type="button" className="btn secondary" style={{ flex: 1, minWidth: 110 }} onClick={geocode} disabled={geocoding || !form.address}>
            {geocoding ? 'Locating…' : 'Find on map'}
          </button>
        </div>
        <div className="help">Click "Find on map" to auto-geocode, or click/drag on the map to set the exact pin.</div>
      </div>

      <LocationPicker position={position} onPick={setPosition} />
      <div className="help" style={{ marginBottom: 12 }}>
        {position ? `Pin set at ${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}` : 'No pin yet — geocode or click the map.'}
      </div>

      <div className="row">
        <div className="field"><label>Rent (₹/mo) *</label><input className="input" type="number" value={form.rent} onChange={set('rent')} required /></div>
        <div className="field"><label>Bedrooms *</label>
          <select className="select" value={form.bedrooms} onChange={set('bedrooms')}>
            {['1', '2', '3', '4', '5'].map((b) => <option key={b}>{b}</option>)}
          </select>
        </div>
      </div>
      <div className="row">
        <div className="field"><label>Furnishing</label>
          <select className="select" value={form.furnishing} onChange={set('furnishing')}>
            <option>Unfurnished</option><option>Semi-furnished</option><option>Furnished</option>
          </select>
        </div>
        <div className="field"><label>Tenant preference</label>
          <select className="select" value={form.tenantPreference} onChange={set('tenantPreference')}>
            <option>Any</option><option>Family</option><option>Bachelor</option>
          </select>
        </div>
      </div>
      <div className="field checkbox">
        <input type="checkbox" id="pets" checked={form.petsAllowed} onChange={set('petsAllowed')} />
        <label htmlFor="pets" style={{ margin: 0 }}>Pets allowed</label>
      </div>

      <div className="row">
        <div className="field"><label>Landlord name (optional)</label><input className="input" value={form.landlordName} onChange={set('landlordName')} /></div>
        <div className="field">
          <label>Landlord phone (optional)</label>
          <input
            className="input"
            type="tel"
            inputMode="tel"
            pattern="^\+?[0-9][0-9\s().-]{6,19}$"
            title="Enter a valid phone number, e.g. +91 98765 43210"
            value={form.landlordContact}
            onChange={set('landlordContact')}
          />
        </div>
      </div>
      <div className="field">
        <label>Commission split offered</label>
        <input className="input" value={form.commissionSplit} onChange={set('commissionSplit')} placeholder="e.g. 50% of 1 month" />
      </div>
      <div className="field">
        <label>Photos</label>
        <input className="input" type="file" accept="image/*" multiple onChange={(e) => setPhotos([...e.target.files])} />
        <div className="help">Up to 6 images. Uploaded securely to AWS S3.</div>
      </div>
      <div className="field">
        <label>Notes</label>
        <textarea className="textarea" value={form.notes} onChange={set('notes')} />
      </div>

      <button className="btn block" disabled={busy}>{busy ? 'Posting…' : 'Post property (goes live for 48h)'}</button>
    </form>
  );
}
