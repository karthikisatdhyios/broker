import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', agency: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (mode === 'login') await login(form.email, form.password);
      else await register(form);
    } catch (err) {
      setError(err.userMessage || 'Failed');
    } finally {
      setBusy(false);
    }
  };

  const demoLogin = async () => {
    setBusy(true); setError('');
    try { await login('broker1@example.com', 'password123'); }
    catch (err) { setError(err.userMessage); }
    finally { setBusy(false); }
  };

  return (
    <div className="auth-wrap">
      <div className="card auth-card">
        <div className="brand" style={{ fontSize: 24, marginBottom: 6 }}>
          <span className="logo">📍</span> BrokerNet
        </div>
        <p className="muted" style={{ marginTop: 0 }}>
          Co-broking & rental inventory for real estate brokers.
        </p>

        <div className="tabs">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Sign in</button>
          <button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>Create account</button>
        </div>

        <form onSubmit={submit}>
          {mode === 'register' && (
            <>
              <div className="field">
                <label>Full name</label>
                <input className="input" value={form.name} onChange={set('name')} required />
              </div>
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
            </>
          )}
          <div className="field">
            <label>Email</label>
            <input className="input" type="email" value={form.email} onChange={set('email')} required />
          </div>
          <div className="field">
            <label>Password</label>
            <input className="input" type="password" value={form.password} onChange={set('password')} required />
          </div>

          {error && <div className="error-text">{error}</div>}

          <button className="btn block" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <div className="demo-box">
          <strong>Demo account</strong><br />
          broker1@example.com / password123
          <button className="btn secondary small block" style={{ marginTop: 8 }} onClick={demoLogin} disabled={busy}>
            Use demo login
          </button>
        </div>
      </div>
    </div>
  );
}
