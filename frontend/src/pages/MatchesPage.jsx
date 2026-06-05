import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { inr } from '../utils/format.js';

export default function MatchesPage() {
  const [matches, setMatches] = useState([]);
  const [active, setActive] = useState(null);
  const [text, setText] = useState('');

  const load = async () => {
    const { data } = await api.get('/matches');
    setMatches(data.matches);
    setActive((cur) => (cur ? data.matches.find((m) => m.id === cur.id) || cur : null));
  };
  useEffect(() => { load(); const t = setInterval(load, 8000); return () => clearInterval(t); }, []);

  const respond = async (id, decision) => { await api.post(`/matches/${id}/respond`, { decision }); load(); };
  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    await api.post(`/matches/${active.id}/messages`, { text });
    setText('');
    load();
  };

  return (
    <>
      <div className="page-header"><div><h1>Matches & Chat</h1><p>Co-broking conversations. Contact details unlock once the lead owner accepts.</p></div></div>

      {matches.length === 0 ? (
        <div className="card empty"><div className="big">🤝</div>No match requests yet. Find a lead in the Co-broking feed and click "I have a match".</div>
      ) : (
        <div className="grid matches-layout" style={{ alignItems: 'start' }}>
          <div className="stack">
            {matches.map((m) => (
              <div key={m.id} className="card" style={{ cursor: 'pointer', borderColor: active?.id === m.id ? 'var(--primary)' : undefined }} onClick={() => setActive(m)}>
                <div className="spread">
                  <strong>{m.counterpart.name}</strong>
                  <span className={`badge ${m.status === 'accepted' ? 'green' : m.status === 'declined' ? 'red' : 'amber'}`}>{m.status}</span>
                </div>
                <div className="small muted">{m.role === 'lead_owner' ? 'Wants your lead' : 'You requested'} · {m.lead.bedrooms}BHK {m.lead.area}</div>
                <div className="tiny muted">{inr(m.lead.budgetMax)} budget</div>
              </div>
            ))}
          </div>

          <div className="card">
            {!active ? <div className="empty">Select a conversation.</div> : (
              <>
                <div className="spread">
                  <div>
                    <strong>{active.counterpart.name}</strong>
                    {active.counterpart.agency && <span className="muted"> · {active.counterpart.agency}</span>}
                  </div>
                  <span className={`badge ${active.status === 'accepted' ? 'green' : active.status === 'declined' ? 'red' : 'amber'}`}>{active.status}</span>
                </div>

                {active.status === 'accepted' ? (
                  <div className="card" style={{ background: 'var(--green-bg)', marginTop: 10, padding: 12 }}>
                    <div className="small"><strong>Contact unlocked:</strong></div>
                    {active.counterpart.phone && <div className="small">📞 <a href={`tel:${active.counterpart.phone}`}>{active.counterpart.phone}</a></div>}
                    {active.counterpart.email && <div className="small">✉️ {active.counterpart.email}</div>}
                    {active.lead.customerContact && <div className="small">Customer: {active.lead.customerName} · {active.lead.customerContact}</div>}
                  </div>
                ) : (
                  <div className="card" style={{ background: '#f9fafb', marginTop: 10, padding: 12 }}>
                    <div className="small muted">Contact details are hidden until the lead owner accepts.</div>
                    {active.canAct && (
                      <div className="row" style={{ marginTop: 10, gap: 8 }}>
                        <button className="btn success small" onClick={() => respond(active.id, 'accept')}>Accept</button>
                        <button className="btn danger small" onClick={() => respond(active.id, 'decline')}>Decline</button>
                      </div>
                    )}
                  </div>
                )}

                <div className="chat" style={{ marginTop: 12 }}>
                  {active.messages.length === 0 && <div className="muted small" style={{ textAlign: 'center' }}>No messages yet.</div>}
                  {active.messages.map((m, i) => (
                    <div key={i} className={`msg ${m.mine ? 'mine' : 'theirs'}`}>{m.text}</div>
                  ))}
                </div>

                {active.status !== 'declined' && (
                  <form onSubmit={send} className="row" style={{ marginTop: 12, gap: 8 }}>
                    <input className="input" style={{ flex: 4 }} value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message…" />
                    <button className="btn" style={{ flex: 1, minWidth: 80 }}>Send</button>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
