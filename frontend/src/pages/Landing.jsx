import { Link } from 'react-router-dom';

const FEATURES = [
  { icon: '🗺️', title: 'Live rental map', text: 'See every available property on a city map. Green pins are live, red are rented — with 48-hour auto-expiry to keep listings fresh.' },
  { icon: '🤝', title: 'Co-broking leads', text: 'Post client requirements and connect with brokers who have a matching property. Contact details unlock only after a mutual accept.' },
  { icon: '💬', title: 'In-app chat', text: 'Negotiate splits and share details with co-brokers in real time, without leaving the platform.' },
  { icon: '📇', title: 'Private CRM', text: 'Keep your landlords and tenants organized. Your data stays yours — never shared with other brokers.' },
  { icon: '🔔', title: 'Renewal watchlist', text: 'Lease end dates are tracked automatically. Get reminded 30 days before renewals so you never lose a deal.' },
  { icon: '⭐', title: 'Flexible plans', text: 'Start free with up to 5 listings. Upgrade anytime for unlimited inventory and priority co-broking.' },
];

const STEPS = [
  { n: '1', title: 'Post your inventory', text: 'Add properties with photos, rent, and an auto-located map pin.' },
  { n: '2', title: 'Match & co-broke', text: 'Browse the lead feed, request matches, and chat with brokers.' },
  { n: '3', title: 'Close & track', text: 'Convert leads to tenants and let the renewal watchlist do the rest.' },
];

export default function Landing() {
  return (
    <div className="landing">
      {/* Nav */}
      <header className="landing-nav">
        <div className="brand" style={{ fontSize: 22 }}>
          <span className="logo">📍</span> BrokerNet
        </div>
        <nav className="landing-nav-links">
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
          <Link to="/login" className="btn secondary small">Sign in</Link>
          <Link to="/login" className="btn small">Get started</Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <span className="hero-pill">🚀 Built for modern rental brokers</span>
          <h1 className="hero-title">
            Collaborate, co-broke and <span className="grad-text">close faster</span> on rentals.
          </h1>
          <p className="hero-sub">
            BrokerNet brings your rental inventory, co-broking leads, client CRM and lease renewals
            into one beautiful workspace — so you spend less time chasing and more time closing.
          </p>
          <div className="hero-cta">
            <Link to="/login" className="btn">Start for free →</Link>
            <a href="#features" className="btn secondary">Explore features</a>
          </div>
          <div className="hero-stats">
            <div><strong>48h</strong><span>fresh listings</span></div>
            <div className="hero-stat-divider" />
            <div><strong>50-50</strong><span>commission splits</span></div>
            <div className="hero-stat-divider" />
            <div><strong>0₹</strong><span>to get started</span></div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-card float-a">
            <div className="spread">
              <span className="badge green"><span className="dot green" /> Available</span>
              <strong>₹42,000</strong>
            </div>
            <div className="hero-card-img" />
            <div style={{ fontWeight: 700, marginTop: 8 }}>2BHK · Indiranagar</div>
            <div className="muted small">Commission: 50% of 1 month</div>
          </div>
          <div className="hero-card mini float-b">
            <div className="badge blue">🤝 New match request</div>
            <div className="small" style={{ marginTop: 8 }}>Priya wants to connect on your HSR lead.</div>
          </div>
          <div className="hero-card mini float-c">
            <div className="badge amber">🔔 Renewal in 10 days</div>
            <div className="small" style={{ marginTop: 8 }}>Ananya Reddy · HSR Layout</div>
          </div>
          <div className="hero-glow" />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="landing-section">
        <div className="section-head">
          <span className="eyebrow">Everything in one place</span>
          <h2>One workspace for your entire rental pipeline</h2>
          <p className="muted">From the first listing to the lease renewal — BrokerNet has every step covered.</p>
        </div>
        <div className="feature-grid">
          {FEATURES.map((f) => (
            <div className="feature-card" key={f.title}>
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p className="muted small">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="landing-section">
        <div className="section-head">
          <span className="eyebrow">Simple by design</span>
          <h2>Get going in three steps</h2>
        </div>
        <div className="steps">
          {STEPS.map((s) => (
            <div className="step" key={s.n}>
              <div className="step-num">{s.n}</div>
              <h3>{s.title}</h3>
              <p className="muted small">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-banner">
        <h2>Ready to grow your rental business?</h2>
        <p>Join brokers collaborating smarter on BrokerNet. Free to start, no card required.</p>
        <div className="hero-cta" style={{ justifyContent: 'center' }}>
          <Link to="/login" className="btn">Create your account</Link>
          <Link to="/login" className="btn secondary">Try the demo</Link>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="brand"><span className="logo">📍</span> BrokerNet</div>
        <span className="muted small">© {new Date().getFullYear()} BrokerNet · Rental co-broking made simple.</span>
      </footer>
    </div>
  );
}
