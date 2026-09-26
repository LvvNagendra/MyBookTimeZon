# SlotNexa

Multi-tenant appointment SaaS for **salons, clinics, and beauty businesses**.

One product, **three delivery variants**:

| Variant | What it is | Status |
|---------|------------|--------|
| **1. Desktop website** | Responsive React SPA (admin + tenant hub + customer book) | Ready for soft launch |
| **2. Mobile website / PWA** | Same SPA + `manifest.webmanifest` — installable on phone home screen | Ready (install from browser) |
| **3. Mobile application** | Native shell (Android/iOS) wrapping the PWA / Capacitor or TWA | Planned wrapper; UI already mobile-first |

Brand UI: SlotNexa · Backend: Spring Boot (`:8090`) · Frontend: Vite React (`:5173`)

---

## E2E status (local, Sep 2026)

### Passing (live APIs + screens)

| Role | Flow | Result |
|------|------|--------|
| **Super Admin** | Login → Overview, Tenants, End users, Payments (manual Activate), Sectors, Roles, System | **PASS** |
| **Tenant Admin** | Login → Services, Staff, Bookings, CRM, Settings (map pin), Mark paid (CASH/UPI) | **PASS** |
| **Customer** | Register → discover → book → My bookings; salon page + map | **PASS** |
| **Payments** | Pay-at-salon + tenant **Mark paid** (no Razorpay required) | **PASS** |
| **AI personalize** | `POST /api/v1/beauty-coach/personalize` (heuristic if no LLM key) | **PASS** |
| **AI chat** | `POST /api/v1/beauty-coach/chat` (offline fallback if LLM down) | **PASS** |
| **AI Hair UI** | Face Landmarker local contour tint + style reference images | **PASS** (guide only, not photoreal try-on) |
| **Geo pin** | Tenant saves lat/lng; discovery shows pin; `POST /api/v1/geo/resolve` | **PASS** (Nominatim if no Google key) |

### Missing / not production-ready yet

| Area | Status | Notes |
|------|--------|--------|
| **Google-accurate geocode** | Optional key | Without `GOOGLE_MAPS_API_KEY`, pin uses OpenStreetMap Nominatim (good enough, not Google) |
| **Live LLM coach** | Optional keys | Without OpenAI/Gemini keys, coach uses offline tips (still usable) |
| **Maps iframe quality** | Optional key | Without `VITE_GOOGLE_MAPS_API_KEY`, embed uses fallback Maps URL |
| **Booking confirmation email** | Needs SMTP | Copy `application-local.yml.example` → `application-local.yml` + Gmail App Password |
| **SMS / WhatsApp** | Not wired | Mobile numbers stored; no Twilio/Meta send yet |
| **Razorpay online checkout** | Optional | Manual SaaS Activate + pay-at-salon work without it |
| **Analytics / inventory / portfolio / staff earnings** | Coming soon | Honest gated pages in UI |
| **Native store apps** | Planned | PWA works today; Capacitor/TWA later |
| **Prod deploy** | Pending | HTTPS, Postgres, secrets, CORS, backups |

---

## API keys & secrets (what to set)

**Never commit real keys.** Use env vars or gitignored `application-local.yml` / `.env.local`.

### Required for a solid local/prod run

| Variable | Where | Used for |
|----------|--------|----------|
| `JWT_SECRET` | Backend env / `application.yml` | Auth tokens (min 32 chars in prod) |
| DB credentials | `SPRING_DATASOURCE_*` / Postgres | Persistence |
| `SPRING_PROFILES_ACTIVE` | e.g. `dev,local` | Activate local overrides |

### Optional — turn features “top quality”

| Variable | Feature if missing | Feature if set |
|----------|--------------------|----------------|
| `GOOGLE_MAPS_API_KEY` | Geocode via Nominatim; map pin still works | **Google Geocoding** for “Pin from address (Google)” — enable **Geocoding API** in Google Cloud |
| `VITE_GOOGLE_MAPS_API_KEY` | Fallback Maps iframe | **Maps Embed API** iframe on salon / settings pages |
| `OPENAI_API_KEY` | Offline beauty coach tips | Live OpenAI chat / personalize |
| `GEMINI_API_KEY` | Same offline fallback | Live Gemini (set `BEAUTY_COACH_LLM=GEMINI` or `AUTO`) |
| `BEAUTY_COACH_LLM` | `AUTO` default | Force `OPENAI` / `GEMINI` / `AUTO` |
| `MAIL_HOST` / `MAIL_USERNAME` / `MAIL_PASSWORD` | No confirmation emails | SMTP booking emails |
| `BOOKING_CONFIRM_EMAIL` | Off unless local profile | Set `true` to send confirmations |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET` | Manual pay + mock SaaS checkout | Online SaaS / appointment checkout |
| `RAZORPAY_MOCK` | Default mock OK | Set `false` when going live with Razorpay |

### Frontend (`.env.local` — copy from `frontend/.env.example`)

```bash
VITE_USE_MOCK=false
# VITE_API_BASE_URL=https://api.yourdomain.com
# VITE_GOOGLE_MAPS_API_KEY=   # Maps Embed API only
```

### Backend local mail + Google Maps (`application-local.yml`)

```bash
# Copy example → gitignored file
cp backend/src/main/resources/application-local.yml.example \
   backend/src/main/resources/application-local.yml
```

```yaml
# In application-local.yml (or env)
app:
  google-maps:
    api-key: ${GOOGLE_MAPS_API_KEY:}   # Geocoding API
  notifications:
    confirmation-email-enabled: true
spring:
  mail:
    username: your@gmail.com
    password: "your-16-char-app-password"
```

Run API with: `SPRING_PROFILES_ACTIVE=dev,local`

### Google Cloud checklist (maps)

1. Create a key → enable **Geocoding API** (server: `GOOGLE_MAPS_API_KEY`)
2. Same or second key → enable **Maps Embed API** (browser: `VITE_GOOGLE_MAPS_API_KEY`)
3. Restrict keys (HTTP referrer for Vite; IP/API for server)

### AI provider checklist

1. Prefer `GEMINI_API_KEY` **or** `OPENAI_API_KEY` (not both required)
2. Restart Spring Boot after setting keys
3. Without keys: personalize + chat still return useful offline answers

---

## What we have done (product)

### Core product (E2E tested)
- **Super Admin** — tenants (with map pin on create), end-user directory, sectors, roles, SaaS plan assign + **manual Activate**
- **Tenant Admin** — services, staff, bookings, CRM, settings (lat/lng + pin from address), pay-at-salon ops
- **Customer** — discover → book → my bookings (cancel / reschedule)
- **Staff** — schedule, complete / no-show, **mark cash/UPI collected**

### Payments (Razorpay optional)
- Default: **pay at salon** (cash / UPI / bank / other)
- Tenant/staff: **Mark paid** in Bookings
- Super Admin: activate tenant after **manual SaaS payment**

### Notifications
- Booking confirmation email via SMTP when configured
- SMS / WhatsApp — **not wired** (contacts stored)

### Product polish
- Coming-soon gates (analytics, inventory, portfolio, staff earnings)
- Password show/hide, Help / Privacy, PWA manifest
- AI hair + beauty coach (LLM optional)

---

## Pending before go-live

1. **Deploy** — HTTPS domain, Postgres, API + static UI
2. **Secrets** — `JWT_SECRET`, DB, mail, maps, AI keys via env (never commit)
3. **Email on server** — `MAIL_*` + confirmation enabled
4. **CORS / prod config** — lock origins; disable H2/dev bootstrap
5. **SMS / WhatsApp** (optional)
6. **Razorpay** (optional) — only if you need online checkout
7. **Google Maps keys** (recommended) — accurate pin + embed
8. **Store listing** (variant 3) — Capacitor/TWA
9. **Monitoring** — uptime, logs, DB backups

### Soft-launch capacity (single mid VPS + Postgres)
- **Sectors:** 5–10 · **Tenants:** ~50–150 · **Customers:** ~5k–20k · **Bookings/day:** ~500–2,000

---

## Run locally

```bash
# Root — API + UI together
npm run dev

# Or separately
npm run api    # Spring Boot (needs JAVA_HOME + Postgres)
npm run ui     # Vite → http://127.0.0.1:5173  (proxies /api → :8090)
```

After changing backend Java, rebuild and restart the jar (Vite HMR alone is not enough for new API endpoints).

---

## Roles & URLs

| Role | After login |
|------|-------------|
| SUPER_ADMIN | `/admin` |
| TENANT_ADMIN / CLINIC_ADMIN | `/dashboard` |
| STAFF | `/staff/schedule` |
| CUSTOMER | `/home`, `/nearby`, `/salon/{slug}`, `/my-bookings` |

Public API book: `GET/POST /api/v1/public/{businessType}/{slug}`  
Customer UI: `/salon/{slug}?businessType=SALON` (slug is the **booking slug** from Super Admin)

---

## Three variants — how we ship

### 1) Desktop website
- Build: `npm run build --prefix frontend`
- Serve `frontend/dist` behind Nginx / Cloudflare
- API on same host or `VITE_API_BASE_URL=https://api.yourdomain.com`

### 2) Mobile website + PWA
- Same build; `manifest.webmanifest` + theme-color already set
- Users: Chrome/Safari → **Add to Home Screen**

### 3) Mobile application (native)
- Wrap production URL with **Trusted Web Activity (Android)** or **Capacitor**
- Same UI codebase for v1

---

## Stack

- **Frontend:** React 18, Vite, TypeScript, React Router  
- **Backend:** Spring Boot 3, JWT, Flyway, JPA, PostgreSQL  
- **Realtime:** optional WebSocket slot updates  

---

## License / ownership

Private product — SlotNexa platform. Do not commit secrets (`.env`, `.env.local`, `application-local.yml`).
