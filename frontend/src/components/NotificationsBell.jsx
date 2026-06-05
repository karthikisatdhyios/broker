import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';

export default function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef(null);
  const navigate = useNavigate();

  const load = async () => {
    try {
      const { data } = await api.get('/notifications');
      setItems(data.notifications);
      setUnread(data.unread);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 30000); // poll every 30s
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const markAll = async () => {
    await api.post('/notifications/read-all');
    load();
  };

  const openItem = async (n) => {
    if (!n.read) await api.post(`/notifications/${n._id}/read`);
    setOpen(false);
    if (n.link) navigate(n.link);
    load();
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button className="bell" onClick={() => setOpen((o) => !o)} aria-label="Notifications">
        🔔{unread > 0 && <span className="count">{unread}</span>}
      </button>
      {open && (
        <div className="dropdown">
          <div className="spread" style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
            <strong>Notifications</strong>
            {unread > 0 && <button className="btn ghost small" onClick={markAll}>Mark all read</button>}
          </div>
          {items.length === 0 && <div className="notif-item muted">No notifications yet.</div>}
          {items.map((n) => (
            <div
              key={n._id}
              className={`notif-item ${n.read ? '' : 'unread'}`}
              onClick={() => openItem(n)}
              style={{ cursor: 'pointer' }}
            >
              <div className="t">{n.title}</div>
              <div className="small muted">{n.body}</div>
              <div className="tiny muted">{new Date(n.createdAt).toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
