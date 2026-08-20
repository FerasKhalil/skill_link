# SkillLink — How to Use

SkillLink is a bilingual (English/Arabic) service marketplace connecting customers with skilled providers in Jordan. Customers search for providers, book services, message, and leave reviews. Providers list services, manage bookings, and build their reputation.

---

## Prerequisites

- **Node.js** 18+ (recommended: 20 LTS)
- **PostgreSQL** 14+ running on port **5433** (or change `DATABASE_URL` in `.env`)
- **npm** (comes with Node)

---

## Setup (First Time)

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env if your PostgreSQL uses different credentials/port

# 3. Create database tables
npm run db:push

# 4. Seed demo data (3 accounts + 14 categories)
npm run db:seed

# 5. Start development server
npm run dev
```

Open **http://localhost:3000** in your browser.

---

## Demo Accounts

| Role | Email | Password | What you can do |
|------|-------|----------|-----------------|
| **Admin** | admin@skilllink.jo | SkillLinkAdmin2024! | Manage users, providers, categories, reports, view audit log |
| **Provider** | provider@skilllink.jo | DemoProvider2024! | Manage services, view bookings, respond to quotes, messages |
| **Customer** | customer@skilllink.jo | DemoCustomer2024! | Search providers, book services, leave reviews, save providers |

---

## User Flows

### As a Customer

1. **Browse** — Visit the homepage to see popular categories and top-rated providers
2. **Search** — Use the search bar or `/search` page to filter by category, delivery mode, verified status, and sort by rating/price
3. **View Provider** — Click a provider to see their profile, services (listings), reviews, and bio
4. **Message** — Click "Chat with Provider" on a provider profile to start a conversation
5. **Book** — Create a booking through the quote request flow or direct booking
6. **Review** — After a booking is completed, leave a rating and review
7. **Save** — Bookmark providers you like via the bookmark icon

### As a Provider

1. **Apply** — Visit `/become-provider` to submit an application (multi-step wizard)
2. **Get Approved** — An admin reviews your application (demo: log in as admin to approve)
3. **Add Services** — After approval, create listings under "My Services" (`/provider/services`)
4. **Set Availability** — Define your working hours under "Availability" (`/provider/availability`)
5. **Manage Bookings** — View and confirm/reject incoming bookings under "My Bookings"
6. **Respond to Quotes** — Review and respond to customer quote requests
7. **Messages** — Chat with customers who reach out

### As an Admin

1. **Overview** — See platform stats (users, providers, bookings, reports)
2. **Users** — Search, suspend, or activate user accounts
3. **Providers** — Review and approve/reject provider verification status
4. **Applications** — Review pending provider applications
5. **Categories** — View and manage service categories
6. **Reports** — Review and resolve user-submitted reports
7. **Audit Log** — View system activity events

---

## Key Pages

| URL Pattern | Purpose |
|-------------|---------|
| `/` | Homepage with categories and top providers |
| `/search?q=...` | Search results with filters |
| `/categories` | Browse all service categories |
| `/categories/[slug]` | Providers in a specific category |
| `/providers/[id]` | Public provider profile |
| `/sign-in` | Login |
| `/sign-up` | Registration |
| `/dashboard` | Customer dashboard (bookings, messages, saved) |
| `/bookings` | Customer bookings list |
| `/bookings/[id]` | Booking detail |
| `/messages` | Conversations list |
| `/messages/[id]` | Message thread |
| `/reviews` | Customer reviews |
| `/saved` | Saved/bookmarked providers |
| `/quote-requests` | Quote requests from customers |
| `/settings` | Account settings |
| `/become-provider` | Provider application wizard |
| `/provider/workspace` | Provider dashboard overview |
| `/provider/services` | Manage service listings |
| `/provider/services/new` | Create new listing |
| `/provider/availability` | Set working hours |
| `/provider/bookings` | Provider's bookings |
| `/provider/messages` | Provider's conversations |
| `/provider/verification` | View verification status |
| `/provider/settings` | Provider profile settings |
| `/admin` | Admin panel (all sections in one page) |

---

## Internationalization (i18n)

- Toggle language via the **globe icon** in the header
- English (`en`) and Arabic (`ar`) are fully supported
- All UI strings are in `src/i18n/en.ts` and `src/i18n/ar.ts`
- RTL layout is partially supported (CSS rules exist but `<html>` tag defaults to LTR)

---

## Database Management

```bash
npm run db:push      # Push schema changes to database (no migration file)
npm run db:generate  # Generate a Drizzle migration SQL file
npm run db:migrate   # Run pending Drizzle migrations
npm run db:seed      # Re-seed demo data (safe — uses ON CONFLICT DO NOTHING)
npm run db:studio    # Open Drizzle Studio (visual DB browser)
npm run db:reset     # Drop all tables, re-push schema, re-seed
```

---

## Project Structure

```
src/
  app/
    [locale]/           # All pages (locale = en | ar)
      page.tsx          # Homepage
      admin/            # Admin panel
      categories/       # Category browsing
      search/           # Search results
      providers/        # Provider public profiles
      (auth)/           # Auth pages (sign-in, sign-up, etc.)
      (app)/            # Authenticated pages
        dashboard/      # Customer dashboard
        bookings/       # Customer bookings
        messages/       # Customer messages
        reviews/        # Customer reviews
        saved/          # Saved providers
        settings/       # Account settings
        become-provider/ # Provider application
        provider/       # Provider-specific pages
    api/v1/             # All API routes
  components/
    layout/             # header, footer, providers (AppProvider)
    ui/                 # 18 reusable UI components
  db/
    schema.ts           # Drizzle database schema (21 tables)
    seed.ts             # Database seed script
    index.ts            # DB connection singleton
  i18n/                 # Translation files (en.ts, ar.ts)
  lib/
    api-client.ts       # Typed API client for all endpoints
    auth.ts             # JWT auth (jose + bcryptjs)
    store.tsx           # React Context global state
    api-helpers.ts      # Server-side response helpers
    utils.ts            # Utility functions
  data/
    mock.ts             # Dead code — not imported anywhere
```

---

## API Reference

All API endpoints are under `/api/v1/`. Authentication is via HTTP-only cookie (`skilllink_session`).

| Endpoint | Methods | Auth Required |
|----------|---------|---------------|
| `/auth/register` | POST | No |
| `/auth/login` | POST | No |
| `/auth/logout` | POST | Yes |
| `/auth/me` | GET | Yes |
| `/auth/forgot-password` | POST | No |
| `/providers` | GET, POST | GET: No, POST: Yes |
| `/providers/[id]` | GET, PUT | GET: No, PUT: Yes (owner) |
| `/providers/[id]/listings` | GET, POST | GET: No, POST: Yes (owner) |
| `/providers/[id]/listings/[listingId]` | GET, PUT, DELETE | GET: No, PUT/DELETE: Yes (owner) |
| `/providers/[id]/availability` | GET, PUT | GET: No, PUT: Yes (owner) |
| `/providers/[id]/reviews` | GET, POST | GET: No, POST: Yes |
| `/providers/applications` | POST | Yes |
| `/providers/applications/me` | GET | Yes |
| `/categories` | GET | No |
| `/categories/[id]` | GET | No |
| `/categories/suggest` | POST | Yes |
| `/search` | GET | No |
| `/conversations` | GET, POST | Yes |
| `/conversations/[id]/messages` | GET, POST | Yes |
| `/conversations/[id]/block` | POST | Yes |
| `/bookings` | GET, POST | Yes |
| `/bookings/[id]` | GET, PUT | Yes |
| `/quotes` | GET, POST | Yes |
| `/quotes/[id]` | PUT | Yes |
| `/reviews` | GET, POST | Yes |
| `/reviews/[id]` | PUT, DELETE | Yes |
| `/reports` | GET, POST | Yes |
| `/reports/[id]` | PUT | Yes (admin) |
| `/saved` | GET, POST | Yes |
| `/saved/[providerId]` | DELETE | Yes |
| `/notifications` | GET, PUT | Yes |
| `/notifications/unread-count` | GET | Yes |
| `/admin/overview` | GET | Yes (admin) |
| `/admin/users` | GET, PUT | Yes (admin) |
| `/admin/providers` | GET, PUT | Yes (admin) |
| `/admin/applications` | GET, PUT | Yes (admin) |
| `/admin/categories` | GET | Yes (admin) |
| `/admin/categories/[id]` | PUT, DELETE | Yes (admin) |
| `/admin/categories/approve/[id]` | POST | Yes (admin) |
| `/admin/reports` | GET, PUT | Yes (admin) |
| `/admin/bookings` | GET | Yes (admin) |
| `/admin/audit` | GET | Yes (admin) |

---

## Troubleshooting

**"Cannot connect to database"**
- Ensure PostgreSQL is running on port 5433
- Check `DATABASE_URL` in `.env`

**"Tables don't exist"**
- Run `npm run db:push` to create tables from schema
- Then `npm run db:seed` to populate demo data

**Homepage shows no providers**
- Make sure the demo provider's verification status is `approved` (it is by default in the seed)
- Check that `npm run db:seed` completed successfully

**Login fails**
- Use the exact demo emails and passwords listed above
- Passwords are case-sensitive

**Build fails**
- Run `npm run build` and check for TypeScript errors
- The most common issue is a missing import or type mismatch
