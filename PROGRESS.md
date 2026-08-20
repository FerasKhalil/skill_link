# SkillLink — Project Progress

> **Last updated:** 2026-08-20 (Phase 6 + layout + admin fixes round 2)
> **Status:** Build: ✅ Passing | Lint: ✅ Passing (0 errors) | 47 API routes | 36 pages

---

## Architecture

```
Next.js 16.3.1 (App Router, Turbopack, standalone output)
React 19.2.8 + TypeScript 5
Tailwind CSS v4 (CSS-based config, no tailwind.config.*)
Drizzle ORM 0.45 + PostgreSQL (postgres.js driver)
jose (JWT) + bcryptjs (password hashing)
zod (validation), SWR (data fetching on search page)
Custom i18n: en/ar via src/i18n/{en,ar}.ts (614 lines each)
```

**Key decisions:**
- `[locale]` dynamic segment for i18n routing (not next-intl middleware)
- JWT stored in HTTP-only cookie (`skilllink_session`)
- Drizzle schema-first approach (no raw SQL migrations beyond seed)
- Custom React Context store (not Zustand/Redux)
- API client is a thin typed `fetch` wrapper in `src/lib/api-client.ts`

---

## Database

- **21 tables**, **14 enums** defined in `src/db/schema.ts` (489 lines)
- **1 migration** in `drizzle/0000_awesome_blazing_skull.sql` (generated 2026-08-19)
- Seed script (`src/db/seed.ts`) creates tables via raw SQL + seeds demo data
- **Tables:** users, sessions, provider_profiles, provider_applications, categories, listings, listing_media, availability_rules, availability_exceptions, conversations, messages, quote_requests, bookings, reviews, saved_providers, blocked_users, reports, notifications, media, audit_events, search_index

**Seed accounts:**
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@skilllink.jo | SkillLinkAdmin2024! |
| Provider | provider@skilllink.jo | DemoProvider2024! |
| Customer | customer@skilllink.jo | DemoCustomer2024! |

**Seed categories:** 14 categories across 3 parent groups (Tutoring, Skilled Labour, Instruments)

---

## Implementation Status

### IMPLEMENTED — Full API + Frontend Wiring

| Feature | API Routes | Frontend Pages | Status |
|---------|-----------|----------------|--------|
| **Auth** (register, login, logout, me) | `auth/*` (5 routes) | sign-in, sign-up | ✅ Complete |
| **Provider profiles** (CRUD, get) | `providers/*` (8 routes) | providers/[slug] | ✅ Complete |
| **Listings** (CRUD, per-provider) | `providers/[id]/listings/*` | provider/services, new | ✅ Complete |
| **Availability rules** | `providers/[id]/availability` | provider/availability | ✅ Complete |
| **Provider applications** | `providers/applications/*` | become-provider | ✅ Complete |
| **Categories** (list, get, suggest) | `categories/*` (3 routes) | categories/* | ✅ Complete |
| **Search** (filters, pagination) | `search` | search | ✅ Complete |
| **Conversations** (list, create, block) | `conversations/*` | messages/* | ✅ Complete |
| **Messages** (list, send) | `conversations/[id]/messages` | messages/[id] | ✅ Complete |
| **Bookings** (list, get, create, update) | `bookings/*` | bookings/*, provider/bookings | ✅ Complete |
| **Quotes** (list, create, respond) | `quotes/*` | quote-requests | ✅ Complete |
| **Reviews** (list, create, update, delete) | `reviews/*`, providers/[id]/reviews | reviews | ✅ Complete |
| **Saved providers** (list, save, unsave) | `saved/*` | saved | ✅ Complete |
| **Reports** (list, create, update) | `reports/*` | (via admin only) | ✅ Complete |
| **Notifications** (list, mark-read, count) | `notifications/*` | (header dropdown) | ✅ Complete |
| **Admin** (overview, users, providers, apps, categories, reports, audit, bookings) | `admin/*` (10 routes) | admin | ✅ Complete |
| **Provider verification** | (via admin providers PUT) | provider/verification | ✅ Complete |
| **Provider workspace** | (composed from existing APIs) | provider/workspace | ✅ Complete |
| **Provider settings** | (via providers PUT) | provider/settings | ✅ Complete |
| **Customer dashboard** | (composed from existing APIs) | dashboard | ✅ Complete |
| **Customer settings** | (no dedicated API; reads from auth/me) | settings | ⚠️ Read-only |
| **Homepage** | (composed from categories + providers APIs) | / | ✅ Complete |
| **Forgot password** | `auth/forgot-password` | forgot-password | ⚠️ Page exists, email not sent |
| **Verify email** | `auth/verify-email`, `auth/verify-email/resend` | verify-email | ⚠️ Token-based verify works, resend generates token but no email sent |
| **User profile update** | `users/me` | settings | ✅ Complete — saves to DB |
| **Password change** | `auth/change-password` | settings (security tab) | ✅ Complete |
| **File uploads** | `media/upload` | (no frontend yet) | ✅ API works — stores to disk |

### PARTIALLY IMPLEMENTED

| Feature | Status | Gap |
|---------|--------|-----|
| **Phone verification** | ⚠️ | Schema fields exist (phone_verify_code, phone_verify_expiry) but no API |
| **Real-time messaging** | ⚠️ | No WebSocket/SSE — messaging is request/response only |
| **Booking concurrency** | ⚠️ | No `EXCLUDE` constraint for double-booking prevention on availability |
| **RTL layout** | ⚠️ | CSS has `[dir="rtl"]` rules, translations exist, but `<html>` tag is hardcoded to `lang="en" dir="ltr"` |
| **Password reset** | ⚠️ | `forgot-password` generates token + logs it, but `reset-password` endpoint doesn't exist yet |

### NOT IMPLEMENTED

| Feature | Notes |
|---------|-------|
| **Tests** | Zero test files. No test framework installed (no Jest/Vitest/Playwright) |
| **Email sending** | `.env.example` has SMTP config but no email utility exists |
| **Map/geolocation** | `.env.example` references Leaflet/OSM but no map integration |
| **Push notifications** | No service worker or push subscription |
| **Admin sub-routes** | Admin is a single-page component with tabs, no nested routes |
| **Content moderation workflow** | Reports can be resolved/dismissed but no automated moderation |
| **Analytics/reporting** | No analytics beyond the admin overview stats |
| **Rate limiting** | No rate limiting on any API endpoints |
| **CSRF protection** | No CSRF tokens (relies on SameSite cookie) |

---

## Build / Lint / Type Status

```
Build:   ✅ next build passes — TypeScript OK, 36 pages generated
Lint:    ✅ eslint passes — 0 errors, 0 warnings
```

**ESLint config:** `@typescript-eslint/no-explicit-any` is OFF (API client layer uses `any` extensively)
**Middleware:** `middleware.ts` still supported in Next.js 16, no deprecation warning

---

## Environment Variables

Required (from `.env`):
```
DATABASE_URL=postgresql://skilllink:skilllink_dev_2024@localhost:5433/skilllink
AUTH_SECRET=dev-secret-key-change-in-production-32-chars!!
SESSION_COOKIE_NAME=skilllink_session
SESSION_MAX_AGE=604800000
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
ADMIN_BOOTSTRAP_EMAIL=admin@skilllink.jo
ADMIN_BOOTSTRAP_PASSWORD=SkillLinkAdmin2024!
```

Optional (from `.env.example`):
```
SMTP_HOST, SMTP_PORT, SMTP_FROM        # Email (not implemented)
MAP_PROVIDER, MAP_TILE_URL             # Maps (not implemented)
REALTIME_PROVIDER=polling              # Real-time (not implemented)
```

---

## Key Files Modified During Development

| File | Lines | Purpose |
|------|-------|---------|
| `src/lib/api-client.ts` | 261 | All typed API methods (auth, providers, media, etc.) |
| `src/lib/store.tsx` | 181 | Global React Context state |
| `src/lib/auth.ts` | 154 | JWT session management |
| `src/lib/api-helpers.ts` | 77 | Server-side response helpers |
| `src/db/schema.ts` | 489 | Full database schema (21 tables) |
| `src/db/seed.ts` | 598 | Seed script with demo data |
| `src/i18n/en.ts` | 614 | English translations |
| `src/i18n/ar.ts` | 614 | Arabic translations |
| `src/app/[locale]/admin/page.tsx` | 585 | Admin dashboard (all sections) |
| `src/app/[locale]/page.tsx` | 237 | Homepage |
| `src/app/[locale]/(app)/settings/page.tsx` | ~110 | Customer settings (profile + password) |
| `src/app/[locale]/(app)/become-provider/page.tsx` | ~170 | Provider onboarding wizard |
| `src/app/api/v1/users/me/route.ts` | ~60 | User profile update endpoint |
| `src/app/api/v1/auth/change-password/route.ts` | ~50 | Password change endpoint |
| `src/app/api/v1/auth/verify-email/route.ts` | ~50 | Email verification endpoint |
| `src/app/api/v1/auth/verify-email/resend/route.ts` | ~40 | Resend verification token |
| `src/app/api/v1/media/upload/route.ts` | ~80 | File upload endpoint |
| `src/app/[locale]/layout.tsx` | ~10 | Header + Footer wrapper for all locale pages |
| `src/components/layout/header.tsx` | 209 | Navigation with auth/search/notifications |
| `src/components/layout/footer.tsx` | ~60 | Footer with real categories |
| `ADMIN-GUIDE.md` | ~200 | Admin guide: credentials, workflows, DB access |
| `drizzle/0000_awesome_blazing_skull.sql` | 479 | Initial DB migration |

---

## Known Issues

1. **Default README:** Still has create-next-app boilerplate.
2. **No custom assets:** No logo, favicon, or branding SVGs.
3. **Email sending:** forgot-password and verify-email generate tokens but log them to console (no SMTP).
4. **Password reset endpoint missing:** `POST /api/v1/auth/reset-password` (accepts token + new password) not yet created.
5. **Middleware simplified:** Admin auth check removed from middleware (APIs handle it). Consider adding Edge-compatible DB check later.

---

## Remaining Work (Priority Order)

### Phase 6 — ✅ COMPLETE (2026-08-20)
- `PUT /api/v1/users/me` — User profile update endpoint
- `POST /api/v1/auth/change-password` — Password change endpoint
- `POST /api/v1/auth/verify-email` — Email verification + resend
- `POST /api/v1/media/upload` — File upload endpoint (stores to disk)
- Customer settings page wired to real `PUT /users/me`
- Deleted dead `src/data/mock.ts`
- Removed unused `next-intl` dependency

### Phase 7 — Production Hardening
1. `POST /api/v1/auth/reset-password` — Complete password reset flow (token + new password)
2. Rate limiting on auth endpoints (login, register, forgot-password)
3. Booking concurrency constraint (EXCLUDE on availability_rules + bookings)
4. Input sanitization / XSS prevention review
5. Error boundary components for client-side error handling
6. `GET /api/v1/users/me/sessions` — Session management

### Phase 8 — Testing
7. Install test framework (Vitest recommended for Next.js)
8. Unit tests for auth (hashPassword, verifyPassword, createSession)
9. API integration tests for critical flows (register → login → book → review)
10. E2E tests for auth flow and booking flow

### Phase 9 — Polish
11. Add custom favicon and branding assets
12. Fix RTL: make `<html>` lang/dir dynamic based on locale
13. Write project-specific README

### Phase 10 — Nice to Have
14. Real-time messaging (WebSocket or SSE)
15. Email notifications (transactional emails via SMTP)
16. Map integration (Leaflet/OpenStreetMap)
17. Push notifications
18. Admin analytics dashboard with charts

---

## How to Resume Development

1. Ensure PostgreSQL is running on port 5433
2. `cp .env.example .env` (or use existing `.env`)
3. `npm install`
4. `npm run db:push` (create tables) OR `npm run db:migrate` (run Drizzle migration)
5. `npm run db:seed` (seed demo data)
6. `npm run dev` (start dev server on http://localhost:3000)
7. Read this file to understand current state
8. Verify claims in this file against actual source code — this file is NOT more authoritative than the code
