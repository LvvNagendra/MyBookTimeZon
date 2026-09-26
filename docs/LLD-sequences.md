# MyBookTimeZon — LLD alignment & sequence flows (text)

This project maps the appointment-booking SaaS LLD to code: **Clinic** is the **tenant** row; `clinic_id` on services, staff, appointments, and payments is the multi-tenant key. JWT carries `clinicId` for tenant users (null for super admin and customers who only use `/me` after login).

## Actors → implementation

| LLD role        | Code (`UserRole`) | Notes |
|----------------|-------------------|--------|
| Super Admin    | `SUPER_ADMIN`     | Seeded via `saas.bootstrap-super-admin` (disable in prod). APIs under `/api/v1/admin/**`. |
| Tenant owner   | `TENANT_ADMIN`    | Registers a business; `ClinicMembershipRole.TENANT_ADMIN`. |
| Staff          | `STAFF`           | Same tenant; appointments list filtered to linked `StaffMember`. |
| Customer       | `CUSTOMER`        | Created on public book (guest email) or future sign-up; `/api/v1/me/appointments`. |

## Multi-category URLs (CLINIC / SALON / FITNESS)

Public booking: **`GET/POST /api/v1/public/{businessType}/{slug}/...`**  
Example: `/api/v1/public/SALON/urban-hair-studio`  
`businessType` must match the tenant’s `BusinessType` or the API returns 404 (isolates wrong vertical links).

## Sequence — Super admin revenue (platform subscription)

1. Tenant completes trial (`Clinic.trialEndsAt`, `SubscriptionStatus.TRIAL`).
2. Tenant calls **`POST /api/v1/clinics/{clinicId}/payments/saas/checkout`** with `{ "plan": "STANDARD" }`.
3. API creates **`PaymentLedger`** (`PLATFORM_SUBSCRIPTION`, `PENDING`) and returns Razorpay-oriented fields + **`ledgerId`**.
4. Production: complete payment with **Razorpay Subscriptions**; webhook marks ledger `PAID` (to be wired).
5. Dev/mock: **`POST .../payments/saas/confirm-mock/{ledgerId}`** sets tenant `ACTIVE` and applies `subscriptionPlan`.  
**Money**: configured to go to the platform Razorpay account (keys in env), not the tenant.

## Sequence — Tenant uses SaaS

1. Register → `TENANT_ADMIN` + `Clinic` + membership; trial starts.
2. **`GET/POST/PUT .../clinics/{clinicId}/services`** and **`/staff`** (owner-only writes).
3. **`GET .../clinics/{clinicId}/appointments`** (owner sees all; staff sees own).
4. If trial ended or suspended, mutating operations return **403** with a clear message.

## Sequence — Customer books

1. **`GET /api/v1/public/{type}/{slug}`** → services + staff.
2. **`GET .../slots?date=&serviceId=&staffId=`** → hourly slots + `available` flag.
3. **`POST .../book`** with customer name/email and chosen slot → creates/finds **`CUSTOMER`** user, **`Appointment`**, optional **`PaymentLedger`** (`APPOINTMENT`) if `onlinePaymentsEnabled`.
4. **Money**: appointment checkout is intended for **tenant’s** Razorpay account (integrate on frontend + webhook); platform fee is separate (subscription only).

## Sequence — Super admin monitors / suspends

1. **`GET /api/v1/admin/dashboard`** — tenant counts, pending platform payments, estimated MRR (plan catalog × active tenants).
2. **`GET /api/v1/admin/tenants`**
3. **`PATCH /api/v1/admin/tenants/{id}/suspended?value=true|false`**

## Security summary

- Tenant isolation: services resolve `clinicId` from path + **`TenantPolicyService`** (membership / owner checks).
- JWT: `role`, optional `clinicId` (see `JwtTokenProvider`).
- Method security: `@PreAuthorize` on admin and customer-only endpoints.

## Frontend routes (market-ready UI)

- `/` — marketing + sign-in / register (business category from `GET /api/v1/meta/business-types`).
- `/find` — customer picks category + slug, then opens booking.
- `/book/{BUSINESS_TYPE}/{slug}` — public slot grid; **WebSocket** `/topic/clinics/{clinicId}/slots` + **8s polling** refresh when someone else books.
- `/dashboard` — tenant: category, services, staff, appointments, SaaS billing (owner).
- `/admin` — super admin KPIs + tenant suspend.
- `/my-bookings` — customer JWT only.

## Making it a real business

- Enable Flyway SQL migrations for production, turn off `ddl-auto: update`.
- Set **`saas.bootstrap-super-admin.enabled: false`** and create admin via secure process.
- Configure **`RAZORPAY_*`** env vars; implement webhooks for subscription + appointment capture.
- Add email/SMS reminders (1h / 24h) via scheduled jobs + provider integration.
