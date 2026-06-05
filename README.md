# BrokerNet — Real Estate Co-broking MVP

A full-stack web app for **real estate brokers** to collaborate on rental inventory, customer leads, and lease renewals. Built as a working MVP with demo data for **Bengaluru**.

![Stack](https://img.shields.io/badge/Node.js-Express-green) ![React](https://img.shields.io/badge/React-Vite-blue) ![Map](https://img.shields.io/badge/Map-Leaflet%20%2B%20OSM-orange)

## Features

| Feature | Description |
|---------|-------------|
| **Map view** | Leaflet + OpenStreetMap. Green pins = available, red = rented. Click for details, broker contact, commission, 48h expiry countdown. |
| **Post inventory** | Address geocoding (Nominatim), photo upload (local), drag/drop pin, mark as rented → creates tenant record. |
| **Co-broking leads** | Post customer requirements (budget, area, BHK, family/bachelor). Active 3 weeks. Filter & match with other brokers. |
| **Match & chat** | In-app messaging. Contact details revealed only after lead owner accepts the match. |
| **CRM** | Private landlord & tenant profiles. Search by name/area. Add/edit/delete. |
| **Renewal watchlist** | Auto-calculates lease end = start + 11 months. Daily scan for leases ending within 30 days. In-app notifications. |
| **Subscription** | Mock payment. Free = 5 properties. Paid = unlimited. |

## Tech stack

- **Backend:** Node.js, Express, JWT auth, bcrypt, multer (image upload), node-cron (scheduled jobs)
- **Database:** NeDB (file-backed, zero setup). Models use a Mongoose-like API — swap in MongoDB/Postgres later if needed.
- **Frontend:** React 18, Vite, React Router, Axios, Leaflet / react-leaflet
- **Maps:** OpenStreetMap tiles + Nominatim geocoding (free, no API key required)

## Quick start

### Prerequisites

- **Node.js 18+** and npm

No database server, Docker, or MongoDB install required.

### 1. Clone & install

```bash
cd real-estate-broker-app
npm run install:all
```

### 2. Configure backend (optional)

```bash
cp backend/.env.example backend/.env
# Defaults work out of the box for local dev.
```

### 3. Start the servers

**Terminal 1 — API (port 5000):**
```bash
cd backend
npm run dev
```

**Terminal 2 — Frontend (port 5173):**
```bash
cd frontend
npm run dev
```

Open **http://localhost:5173**

### 4. Demo login

| Email | Password |
|-------|----------|
| `broker1@example.com` | `password123` |
| `broker2@example.com` | `password123` |

On first boot the backend auto-seeds demo properties (Bengaluru), leads, landlords, tenants, and a renewal notification.

## Project structure

```
real-estate-broker-app/
├── backend/
│   ├── src/
│   │   ├── config/          # env + DB connection
│   │   ├── controllers/     # route handlers
│   │   ├── db/odm.js        # NeDB ODM (Mongoose-like)
│   │   ├── middleware/      # JWT auth, multer upload
│   │   ├── models/          # User, Property, Lead, Tenant, …
│   │   ├── routes/          # Express routers
│   │   └── utils/           # geocode, scheduler, seed
│   ├── data/                # persisted JSON databases (auto-created)
│   ├── uploads/             # property photos
│   └── .env.example
├── frontend/
│   └── src/
│       ├── components/      # Map, PropertyForm, Layout, …
│       ├── pages/           # Map, Leads, CRM, Renewals, …
│       └── context/         # AuthProvider
└── README.md
```

## API overview

All routes (except login/register) require `Authorization: Bearer <token>`.

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Sign in |
| POST | `/api/auth/register` | Create account |
| GET | `/api/properties` | Map feed (all brokers) |
| POST | `/api/properties` | Post property (multipart) |
| POST | `/api/properties/:id/refresh` | Extend 48h expiry |
| POST | `/api/properties/:id/rent` | Mark rented + optional tenant |
| GET | `/api/leads` | Co-broking feed |
| POST | `/api/leads` | Create lead |
| POST | `/api/leads/:id/convert` | Convert to tenant |
| POST | `/api/matches` | Request co-broking match |
| POST | `/api/matches/:id/respond` | Accept / decline |
| GET | `/api/tenants/renewals` | Renewal watchlist |
| POST | `/api/subscription/subscribe` | Mock upgrade to paid |
| GET | `/api/geocode?address=…` | Geocode address → lat/lng |

## Environment variables

See `backend/.env.example`. Key settings:

| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | `5000` | API port |
| `JWT_SECRET` | (required in prod) | JWT signing key |
| `PROPERTY_EXPIRY_HOURS` | `48` | Listing auto-expiry |
| `LEAD_EXPIRY_DAYS` | `21` | Lead active window |
| `LEASE_DURATION_MONTHS` | `11` | Lease length for renewals |
| `RENEWAL_WINDOW_DAYS` | `30` | Renewal notification window |
| `FREE_TIER_PROPERTY_LIMIT` | `5` | Free plan cap |
| `GOOGLE_GEOCODING_API_KEY` | (empty) | Optional; uses Nominatim if unset |
| `DATA_DIR` | `backend/data` | Where NeDB files are stored |

## Scheduled jobs

- **Every 15 min:** expire properties past 48h, expire leads past 21 days
- **Daily 08:00:** scan tenants with lease ending within 30 days → create in-app notifications (deduped)

## Data ownership & privacy

- **Landlords, tenants, lead customer contacts** are private to each broker.
- **Properties and lead summaries** (budget, area, BHK — not customer phone) are visible to all logged-in brokers for co-broking.
- Match contact details unlock only after mutual accept.

## Reset demo data

```bash
cd backend
rm -rf data
npm run dev   # re-seeds on empty DB
```

Or force reseed:
```bash
npm run seed
```

## Production notes

1. Set a strong `JWT_SECRET`.
2. Serve the frontend build (`frontend/dist`) behind nginx or similar; proxy `/api` and `/uploads` to the backend.
3. For scale, replace `src/db/odm.js` with Mongoose (MongoDB) or Sequelize (PostgreSQL) — controllers already use standard query patterns.
4. Replace mock subscription with Stripe/Razorpay when ready.
5. Add real email notifications (currently in-app only).

## License

MIT — demo / MVP use.
