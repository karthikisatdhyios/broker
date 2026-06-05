import { useEffect, useState, useMemo } from 'react';
import { api } from '../api/client.js';
import PropertyMap from '../components/PropertyMap.jsx';
import PropertyDetails from '../components/PropertyDetails.jsx';
import PropertyForm from '../components/PropertyForm.jsx';
import Modal from '../components/Modal.jsx';

export default function MapPage() {
  const [properties, setProperties] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({ status: '', maxRent: '', bedrooms: '' });

  const load = async () => {
    const { data } = await api.get('/properties');
    setProperties(data.properties);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return properties.filter((p) => {
      if (filters.status && p.status !== filters.status) return false;
      if (filters.maxRent && p.rent > Number(filters.maxRent)) return false;
      if (filters.bedrooms && p.bedrooms !== Number(filters.bedrooms)) return false;
      return true;
    });
  }, [properties, filters]);

  const onCreated = (prop) => {
    setShowForm(false);
    setProperties((prev) => [prop, ...prev]);
    setSelected(prop);
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Rental Map · Bengaluru</h1>
          <p>
            <span className="badge green">● available</span>{' '}
            <span className="badge red">● rented / off-market</span>{' '}
            <span className="muted">— pins auto-expire 48h after posting.</span>
          </p>
        </div>
        <button className="btn" onClick={() => setShowForm(true)}>+ Post property</button>
      </div>

      <div className="map-layout">
        <div className="map-container">
          <PropertyMap
            properties={filtered}
            onSelect={setSelected}
            focus={selected?.location ? [selected.location.lat, selected.location.lng] : null}
          />
        </div>

        <div className="map-sidebar">
          <div className="card">
            <div className="row">
              <div className="field" style={{ margin: 0 }}>
                <label>Status</label>
                <select className="select" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                  <option value="">All</option>
                  <option value="available">Available</option>
                  <option value="rented">Rented</option>
                </select>
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label>Max rent</label>
                <input className="input" type="number" placeholder="₹" value={filters.maxRent} onChange={(e) => setFilters({ ...filters, maxRent: e.target.value })} />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label>BHK</label>
                <select className="select" value={filters.bedrooms} onChange={(e) => setFilters({ ...filters, bedrooms: e.target.value })}>
                  <option value="">Any</option>
                  {[1, 2, 3, 4].map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            </div>
            <div className="tiny muted" style={{ marginTop: 8 }}>{filtered.length} properties shown</div>
          </div>

          {selected ? (
            <PropertyDetails property={selected} />
          ) : (
            <div className="card empty" style={{ padding: 30 }}>
              <div className="big">🗺️</div>
              Click a pin to see property details, broker contact and commission.
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <Modal title="Post a property" onClose={() => setShowForm(false)}>
          <PropertyForm onCreated={onCreated} />
        </Modal>
      )}
    </>
  );
}
