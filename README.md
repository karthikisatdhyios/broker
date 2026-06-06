# BrokerNet — Real Estate Co-broking MVP

A full-stack web app for **real estate brokers** to collaborate on rental
inventory, customer leads, and lease renewals. Ships with demo data for
**Bengaluru**.

![Stack](https://img.shields.io/badge/Node.js-Express-green) ![React](https://img.shields.io/badge/React-Vite-blue) ![Map](https://img.shields.io/badge/Map-Leaflet%20%2B%20OSM-orange)

---

## Features

| Feature | Description |
|---------|-------------|
| **Map view** | Leaflet + OpenStreetMap. Green pins = available, red = rented. Click a pin for details, broker contact, commission, and the 48h expiry countdown. |
| **Post inventory** | Address geocoding (Nominatim), photo upload to S3, drag/drop map pin, "mark as rented" → creates a tenant record. |
| **Co-broking leads** | Post customer requirements (budget, area, BHK, family/bachelor). Active ~3 weeks. Filter & match with other brokers. |
| **Match & chat** | In-app messaging. Contact details are revealed only after the lead owner accepts the match. |
| **CRM** | Private landlord & tenant profiles. Search by name/area. Add/edit/delete. |
| **Renewal watchlist** | Lease end = start + 11 months. Daily scan for leases ending within 30 days → in-app notifications. |
| **Subscription** | Mock payment. Free = 5 active properties, Paid = unlimited. |

---

## Tech stack

- **Frontend:** React 18, Vite, React Router, Axios, Leaflet / react-leaflet
- **Backend:** Node.js, Express, JWT auth, bcrypt, multer, `node-cron` (scheduled jobs)
- **Database:** MongoDB (the code talks to MongoDB via a small Mongoose-like ODM in `backend/src/db/odm.js`). Use **MongoDB Atlas** (managed, has a free tier) or **Amazon DocumentDB** if you want to stay fully inside AWS.
- **Image storage:** AWS S3 (photos are uploaded server-side and stored as public URLs)
- **Maps / geocoding:** OpenStreetMap tiles + Nominatim (free, no API key required)
- **Deploy:** Backend on **AWS Elastic Beanstalk**, frontend on **AWS S3 + CloudFront**

---

## Local development

### Prerequisites

- **Node.js 18+** and npm
- A **MongoDB connection string** (MongoDB Atlas free tier is easiest)
- *(Optional, only for photo uploads)* an **AWS S3 bucket** + credentials. You can list properties without photos and skip this for basic local testing.

### 1. Install

```bash
cd real-estate-broker-app
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure the backend

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` and set at minimum:

- `MONGODB_URI` — your MongoDB connection string
- `JWT_SECRET` — any long random string
- *(for photo uploads)* `AWS_REGION`, `AWS_S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`

### 3. Run both servers

**Terminal 1 — API (http://localhost:5000):**
```bash
cd backend
npm run dev
```

**Terminal 2 — Frontend (http://localhost:5173):**
```bash
cd frontend
npm run dev
```

The Vite dev server proxies `/api` to `http://localhost:5000`, so no frontend
env var is needed locally.

Open **http://localhost:5173**.

### 4. Demo login

| Email | Password |
|-------|----------|
| `broker1@example.com` | `password123` |
| `broker2@example.com` | `password123` |

On first boot the backend auto-seeds demo brokers, Bengaluru properties, leads,
landlords, tenants, and a renewal notification (only when the database is empty).

---

## Project structure

```
real-estate-broker-app/
├── backend/
│   ├── Procfile             # "web: npm start" — used by Elastic Beanstalk
│   ├── .env.example
│   └── src/
│       ├── config/          # env (index.js) + MongoDB connection (db.js)
│       ├── controllers/     # route handlers
│       ├── db/odm.js        # Mongoose-like ODM over the MongoDB driver
│       ├── middleware/      # JWT auth, multer + S3 upload
│       ├── models/          # User, Property, Lead, Landlord, Tenant, …
│       ├── routes/          # Express routers
│       ├── utils/           # geocode, jobs, scheduler, seed, time, validation
│       ├── app.js           # Express app (CORS, body parsing, routes)
│       └── server.js        # entry point (connect DB, seed, listen, cron)
└── frontend/
    ├── vercel.json          # (legacy) SPA rewrite config — unused on S3/CloudFront
    ├── vite.config.js
    └── src/
        ├── api/             # axios client (baseURL = VITE_API_URL || /api)
        ├── components/      # Map, PropertyForm, Layout, PhotoCarousel, …
        ├── context/         # AuthProvider
        ├── pages/           # Map, MyProperties, Leads, Matches, CRM, Renewals, …
        └── utils/           # format, geocodeClient, clipboard
```

---

## API overview

Base path: `/api`. All routes except `auth/register`, `auth/login`, `health`,
and `cron` require an `Authorization: Bearer <token>` header.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check (`{ ok: true }`) |
| GET | `/api/cron` | Run scheduled jobs (optional `CRON_SECRET`) |
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Sign in |
| GET | `/api/auth/me` | Current user |
| PATCH | `/api/auth/me` | Update profile |
| GET | `/api/properties` | Map feed (all brokers) |
| POST | `/api/properties` | Post property (multipart, photos) |
| GET | `/api/properties/mine` | My listings |
| POST | `/api/properties/:id/refresh` | Extend the 48h expiry |
| POST | `/api/properties/:id/rent` | Mark rented (+ optional tenant) |
| GET | `/api/leads` | Co-broking feed |
| GET | `/api/leads/mine` | My leads |
| POST | `/api/leads` | Create lead |
| POST | `/api/leads/:id/convert` | Convert lead → tenant |
| GET | `/api/matches` | My match requests |
| POST | `/api/matches` | Request a co-broking match |
| POST | `/api/matches/:id/respond` | Accept / decline |
| POST | `/api/matches/:id/messages` | Send a message |
| GET | `/api/landlords` | List landlords (CRM) |
| GET | `/api/tenants` | List tenants (CRM) |
| GET | `/api/tenants/renewals` | Renewal watchlist |
| POST | `/api/subscription/subscribe` | Mock upgrade to paid |
| GET | `/api/geocode?address=…` | Geocode an address → lat/lng |

---

## Environment variables

See `backend/.env.example`. Key settings:

| Variable | Default | Purpose |
|----------|---------|---------|
| `MONGODB_URI` | (required) | MongoDB / DocumentDB connection string |
| `MONGODB_DB` | `broker_collab` | Database name |
| `PORT` | `5000` | API port (Elastic Beanstalk sets this automatically) |
| `CLIENT_ORIGIN` | `http://localhost:5173` | Allowed CORS origin(s), comma-separated |
| `JWT_SECRET` | (required in prod) | JWT signing key |
| `JWT_EXPIRES_IN` | `7d` | Token lifetime |
| `AWS_REGION` | `ap-south-1` | AWS region for the S3 photo bucket |
| `AWS_S3_BUCKET` | (required for uploads) | Bucket that stores property photos |
| `AWS_ACCESS_KEY_ID` | (optional on AWS) | IAM key; omit if using an instance role |
| `AWS_SECRET_ACCESS_KEY` | (optional on AWS) | IAM secret; omit if using an instance role |
| `AWS_S3_PUBLIC_BASE_URL` | (empty) | Optional CloudFront/custom base URL for photo links |
| `CRON_SECRET` | (empty) | Optional bearer token to protect `GET /api/cron` |
| `PROPERTY_EXPIRY_HOURS` | `48` | Listing auto-expiry window |
| `LEAD_EXPIRY_DAYS` | `21` | Lead active window |
| `LEASE_DURATION_MONTHS` | `11` | Lease length used for renewals |
| `RENEWAL_WINDOW_DAYS` | `30` | Renewal notification window |
| `FREE_TIER_PROPERTY_LIMIT` | `5` | Free plan active-property cap |
| `GOOGLE_GEOCODING_API_KEY` | (empty) | Optional; falls back to Nominatim if unset |

> **CORS note:** the current `app.js` is intentionally permissive (it accepts
> any origin) so the demo "just works". Tighten it with `CLIENT_ORIGIN` before a
> real production launch.

---

## Scheduled jobs

The backend runs `node-cron` whenever it's a long-running process (local dev or
Elastic Beanstalk):

- **Every 15 minutes:** expire properties past 48h, expire leads past their window.
- **Daily 08:00 (server time):** scan tenants whose lease ends within 30 days and
  create deduped in-app notifications.

`GET /api/cron` runs all jobs on demand — handy for manual triggers or an
external scheduler (e.g. AWS EventBridge). Protect it with `CRON_SECRET`.

---

## Data ownership & privacy

- **Landlords, tenants, and lead customer contacts** are private to each broker.
- **Properties and lead summaries** (budget, area, BHK — not the customer's phone)
  are visible to all logged-in brokers for co-broking.
- Match contact details unlock only after the lead owner accepts.

---

## Reset demo data

The database auto-seeds when empty. To wipe and reseed against your configured
`MONGODB_URI`:

```bash
cd backend
npm run seed
```

---

## Production deployment (AWS)

This is the setup the project is configured for: **backend on Elastic Beanstalk**,
**frontend on S3 + CloudFront**, **MongoDB Atlas** for data, **S3** for photos.

### 1. Database — MongoDB Atlas

1. Create a free cluster at <https://www.mongodb.com/atlas>.
2. Create a database user.
3. Network Access → allow `0.0.0.0/0` (or your backend's IPs).
4. Copy the connection string for `MONGODB_URI`, e.g.
   `mongodb+srv://USER:PASS@cluster0.xxxx.mongodb.net/?retryWrites=true&w=majority`.

> All-AWS alternative: Amazon DocumentDB works with the same code, but it's
> VPC-only (your backend must run in the same VPC), requires the TLS CA bundle,
> and is not free. Atlas is simpler and cheaper for an MVP.

### 2. Photo storage — S3 bucket

1. Create a bucket (e.g. `broker-collab-photos`).
2. Allow public read of objects so the browser can load them. Turn off
   "Block all public access" and add a bucket policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "PublicReadPropertyPhotos",
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::broker-collab-photos/*"
  }]
}
```

3. Set `AWS_S3_BUCKET` to this bucket. (Optional: front it with CloudFront and
   set `AWS_S3_PUBLIC_BASE_URL` to the CloudFront domain.)

### 3. Backend — Elastic Beanstalk

1. Zip the **contents** of `backend/` (so `package.json` and `Procfile` are at
   the zip root, not inside a `backend/` folder). Exclude `node_modules`, `.env`,
   `data/`, and `uploads/`.
2. AWS Console → Elastic Beanstalk → Create application → Platform **Node.js** →
   upload the zip.
3. Add environment properties:
   - `NODE_ENV=production`
   - `MONGODB_URI=<your Atlas URI>`
   - `MONGODB_DB=broker_collab`
   - `JWT_SECRET=<long random string>`
   - `AWS_REGION=ap-south-1`
   - `AWS_S3_BUCKET=<your photo bucket>`
   - `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` *(or attach an instance role with `s3:PutObject`)*
   - `CLIENT_ORIGIN=https://<your-cloudfront-domain>`
4. Don't set `PORT` — the platform provides it and the app reads `process.env.PORT`.
5. Verify: `http://<your-env>.elasticbeanstalk.com/api/health` → `{ "ok": true }`.

The `Procfile` (`web: npm start`) runs `node src/server.js`, which connects to
MongoDB, seeds on first boot, starts the API, and starts `node-cron`.

### 4. Frontend — S3 + CloudFront (HTTPS)

A single CloudFront distribution serves the static site **and** proxies the API,
so the frontend and API share one HTTPS origin (no mixed-content, no CORS).

**a. Build** (relative `/api`, since the API is same-origin):

```bash
cd frontend
# ensure there is no .env.production forcing an absolute API URL
npm run build
```

**b. Host the build on S3**
- Create a separate bucket (e.g. `broker-collab-web`).
- Upload the **contents** of `frontend/dist/` (so `index.html` is at the bucket root).

**c. CloudFront distribution**
- **Origin 1:** the `broker-collab-web` S3 bucket (use Origin Access Control).
- **Origin 2:** the Elastic Beanstalk domain, **HTTP only** protocol.
- **Default behavior** → S3 origin, Viewer protocol policy **Redirect HTTP to HTTPS**.
- **Behavior `/api/*`** → EB origin, with:
  - Allowed methods: `GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE`
  - Cache policy: **CachingDisabled**
  - Origin request policy: **AllViewer**
- **Default root object:** `index.html`.
- **Custom error responses** (for SPA routing): map **403 → /index.html (200)**
  and **404 → /index.html (200)**.

**d. WAF (important if you enable it)**
If the distribution has AWS WAF with the Common Rule Set, the
`SizeRestrictions_BODY` rule **blocks request bodies larger than 8 KB**, which
breaks photo uploads (you'll get a CloudFront `403 — Request blocked`). Fix it by
setting `SizeRestrictions_BODY` (and `CrossSiteScripting_BODY` if present) to
**Count**, or remove WAF from the distribution.

### 5. Redeploy routine (frontend)

Because `index.html` references hashed asset filenames, always upload fresh files
**and** invalidate the cache:

1. `npm run build`
2. Upload the new `frontend/dist/` contents to the S3 web bucket (replace old files).
3. CloudFront → **Invalidations** → create `/*`.

Tip: serving `index.html` with `Cache-Control: no-cache, must-revalidate` avoids
stale-HTML/blank-page issues between deploys (hashed JS/CSS can cache long-term).

---

## Production checklist

- [ ] Strong `JWT_SECRET` set on the backend.
- [ ] `CLIENT_ORIGIN` set to the CloudFront URL (and CORS tightened in `app.js` if desired).
- [ ] Photo bucket objects are publicly readable (or served via CloudFront).
- [ ] WAF (if enabled) allows multipart uploads (`SizeRestrictions_BODY` → Count).
- [ ] Frontend served over HTTPS (CloudFront) so the clipboard and secure APIs work.
- [ ] Replace the mock subscription with a real provider (Stripe/Razorpay) when ready.

---

## License

MIT — demo / MVP use.
