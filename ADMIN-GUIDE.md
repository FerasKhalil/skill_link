# SkillLink — Complete Guide

## What Is SkillLink?

SkillLink is a **service marketplace** — like a Jordanian version of TaskRabbit or Thumbtack. It connects **customers** who need services (tutoring, electrical work, plumbing, music lessons) with **providers** who offer those services.

Think of it this way:
- **Customer** = person who needs a math tutor
- **Provider** = math tutor who offers their services
- **Admin** = you, the platform owner who makes sure everything runs properly

---

## The Three Roles

### 1. Customer (Regular User)

**What they can do:**
- Search for providers by category, location, rating
- View provider profiles, services, and reviews
- Book services (request a tutoring session, electrician visit, etc.)
- Message providers directly
- Leave reviews after a service
- Save/bookmark providers they like
- Suggest new categories

**What they cannot do:**
- Create service listings
- Approve other providers
- Access the admin panel

**How they become a customer:** Sign up at `/sign-up` with email and password.

---

### 2. Provider (Service Provider)

**What they can do:**
Everything a customer can do, PLUS:
- Create and manage service listings (e.g., "Math Tutoring — 15-25 JOD/hour")
- Set their availability (working hours)
- Accept or reject bookings
- Respond to quote requests
- View their workspace dashboard (earnings, bookings, messages)

**What they cannot do:**
- Approve other providers
- Access the admin panel

**How they become a provider:**
1. Sign up as a regular customer
2. Go to "Become a Provider" page
3. Fill out the application (profession, bio, experience)
4. Submit → application goes to "pending" status
5. **You (admin) approve it** → they become a provider
6. They can then create service listings

---

### 3. Admin (You — The Platform Owner)

**What you can do:**
- **Approve or reject provider applications** — Every new provider must be reviewed by you before they can appear on the platform
- **Manage users** — Suspend bad actors, change roles, view all accounts
- **Manage providers** — Change verification status, view provider details
- **Handle reports** — When users report spam, fraud, harassment, you investigate and resolve
- **Manage categories** — Add, edit, or hide service categories
- **View audit log** — See every action taken on the platform
- **See platform stats** — Total users, providers, bookings, reports

**What you cannot do:**
- Nothing is restricted for you

---

## How the Website Works — Step by Step

### A New Customer Signs Up
```
1. User goes to /sign-up
2. Enters name, email, password
3. Account created → role = "customer"
4. Can now search, browse, and message providers
```

### A Customer Wants to Become a Provider
```
1. Customer clicks "Become a Provider" (in the header or dashboard)
2. Fills out a 5-step form:
   - Step 1: Confirm eligibility (age 18+, accept terms)
   - Step 2: Complete profile (profession, bio, experience)
   - Step 3: Services info (explained — can add after approval)
   - Step 4: Identity verification (explained — handled after submission)
   - Step 5: Review and submit
3. Application submitted → status = "pending"
4. Provider profile created → verificationStatus = "pending"
5. Customer sees: "Your application is under review"
```

### You (Admin) Approve the Provider
```
1. You log in as admin (admin@skilllink.jo)
2. Go to /en/admin
3. Click "Applications" in the sidebar
4. See the pending application with:
   - Applicant name and email
   - Profession and bio
   - Submission date
5. Click "Approve" or "Reject"
6. If APPROVED:
   - provider_profiles.verificationStatus → "approved"
   - users.role → "provider"
   - Provider can now create listings and appear in search
7. If REJECTED:
   - provider_profiles.verificationStatus → "rejected"
   - User stays as "customer"
   - They cannot create listings
```

### Provider Creates a Service Listing
```
1. Provider logs in → goes to "My Services" (/provider/services)
2. Clicks "Add New Service"
3. Fills out:
   - Title (e.g., "Professional Mathematics Tutoring")
   - Description
   - Category (e.g., "Math Tutoring")
   - Delivery mode (onsite, remote, or both)
   - Pricing (hourly, fixed, or starting at)
   - Service areas
4. Listing goes live → appears in search results
```

### Customer Books a Service
```
1. Customer searches for "math tutor"
2. Finds a provider → views their profile
3. Clicks "Book" or "Send Message"
4. Creates a booking or quote request
5. Provider confirms the booking
6. Service happens
7. Customer leaves a review
```

---

## How to Access the Admin Panel

**URL:** `http://localhost:3000/en/admin`

**Login credentials:**
- Email: `admin@skilllink.jo`
- Password: `SkillLinkAdmin2024!`

**Step by step:**
1. Go to `http://localhost:3000/en/admin`
2. You'll be redirected to the sign-in page (because you're not logged in)
3. Enter the admin email and password
4. After login, you'll be on the homepage
5. Click your avatar (top right) → click "Admin Panel"
6. OR manually go to `http://localhost:3000/en/admin`

**Important:** The admin page requires you to be logged in AND have the "admin" role. If you sign up with a new account, you'll be a "customer" and won't see the admin panel.

---

## How to See Your Database

The database is PostgreSQL — a professional database system that stores all your data (users, providers, bookings, reviews, etc.).

### Option 1: Drizzle Studio (Visual Interface)

```bash
npm run db:studio
```

This opens a visual database browser in your browser. You can:
- Click on any table (users, provider_profiles, bookings, etc.)
- See all records
- Edit data directly
- Run SQL queries

### Option 2: Command Line (psql)

```bash
psql postgresql://skilllink:skilllink_dev_2024@localhost:5433/skilllink
```

Then run SQL queries:
```sql
-- See all users
SELECT id, email, first_name, last_name, role, account_state FROM users;

-- See pending provider applications
SELECT pa.id, u.email, pa.profession, pa.status, pa.submitted_at
FROM provider_applications pa
JOIN users u ON pa.user_id = u.id
WHERE pa.status = 'pending';

-- See all providers
SELECT pp.id, u.first_name, pp.profession, pp.verification_status, pp.rating_avg
FROM provider_profiles pp
JOIN users u ON pp.user_id = u.id;

-- Count users by role
SELECT role, COUNT(*) FROM users GROUP BY role;
```

### Option 3: Reset Everything

```bash
npm run db:reset
```

This drops all tables, recreates them, and re-seeds the 3 demo accounts.

---

## What Each Admin Tab Does

### Overview
Platform statistics:
- Total users (and how many joined this week)
- Total providers (and how many pending verification)
- Total listings (and how many active)
- Total bookings (pending, confirmed, completed)
- Reports (open, under review)

### Users
List of all registered users. You can:
- **Suspend** a user (blocks their login, hides them from the platform)
- **Activate** a suspended user
- **Change role** (promote customer to moderator, etc.)

### Providers
List of all approved providers. You can:
- View their profile details
- Change verification status
- See their ratings and booking counts

### Provider Verification (Applications)
List of all provider applications. You can:
- **Approve** — lets them become a provider
- **Reject** — denies their application
- **Request more info** — asks them to provide additional documents

### Categories
List of all service categories. You can:
- **Approve** suggested categories (from user suggestions)
- **Deactivate** categories you don't want visible
- **Delete** categories entirely

### Reports
User-submitted reports about:
- Spam content
- Inappropriate behavior
- Fraud
- Harassment
- Fake profiles
- Safety concerns

You can:
- Mark as "Under Review"
- **Resolve** (with a resolution note)
- **Dismiss** (if the report is unfounded)

### Audit Log
A chronological list of every admin action taken on the platform. Shows:
- Who did it (admin name)
- What they did (e.g., "approved application", "suspended user")
- When they did it
- Details of the change

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Can't see the admin panel | Make sure you're logged in as `admin@skilllink.jo` |
| Admin panel shows "Access Denied" | Your account doesn't have admin role — use the demo admin credentials |
| Provider application not showing | Make sure someone actually submitted one — create a test account and apply |
| Can't see the database | Run `npm run db:studio` (needs dev server running) |
| Database connection error | Make sure PostgreSQL is running on port 5433 |
| Want to start over | Run `npm run db:reset` |

---

## Quick Reference

| What | Where |
|------|-------|
| Homepage | `http://localhost:3000/en` |
| Sign In | `http://localhost:3000/en/sign-in` |
| Sign Up | `http://localhost:3000/en/sign-up` |
| Admin Panel | `http://localhost:3000/en/admin` |
| Search | `http://localhost:3000/en/search` |
| Categories | `http://localhost:3000/en/categories` |
| Database Studio | Run `npm run db:studio` |
| Reset Database | Run `npm run db:reset` |

| Account | Email | Password |
|---------|-------|----------|
| Admin | `admin@skilllink.jo` | `SkillLinkAdmin2024!` |
| Provider (demo) | `provider@skilllink.jo` | `DemoProvider2024!` |
| Customer (demo) | `customer@skilllink.jo` | `DemoCustomer2024!` |
