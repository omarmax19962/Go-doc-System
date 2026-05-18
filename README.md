# Go Doc — Operations Platform v1

Internal operations platform for Go Doc Home Physiotherapy. Two roles: Admin and Doctor.

---

## Prerequisites

Install these on your Mac before starting:

```bash
# 1. Node.js (via nvm — recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
nvm install 20
nvm use 20

# 2. Supabase CLI (via Homebrew)
brew install supabase/tap/supabase

# 3. Docker Desktop — required for local Supabase
# Download from: https://www.docker.com/products/docker-desktop/
# Start Docker Desktop before running Supabase
```

---

## First-time setup

```bash
# Clone / navigate to project
cd godoc

# Install dependencies
npm install

# Copy env file
cp .env.local.example .env.local

# Start local Supabase (Docker must be running)
npm run db:start

# This prints your local keys — copy them into .env.local:
# NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
# NEXT_PUBLIC_SUPABASE_ANON_KEY=<printed anon key>

# Run migrations (creates all tables, RLS, seed data)
npm run db:reset

# Generate TypeScript types from your schema
npm run db:types

# Start the app
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Create your first users

After `db:reset`, open the Supabase Studio at [http://localhost:54323](http://localhost:54323)

Go to **Authentication → Users → Add user** and create:

**Admin user:**
- Email: `admin@godoc.eg`
- Password: `godoc2024`
- User metadata (raw JSON):
```json
{ "role": "admin", "full_name": "Omar" }
```

**Doctor user:**
- Email: `doctor@godoc.eg`  
- Password: `godoc2024`
- User metadata:
```json
{ "role": "doctor", "full_name": "Dr. Ahmed Ali" }
```

Then insert a doctor record for the doctor user. In **Table Editor → doctors**, insert:
```json
{
  "user_id": "<doctor user id from profiles table>",
  "specialty": "Musculoskeletal",
  "gender": "male",
  "covered_locations": []
}
```

---

## Daily development

```bash
# Start Supabase (if not running)
npm run db:start

# Start Next.js
npm run dev

# Stop Supabase when done
npm run db:stop
```

---

## Project structure

```
src/
├── app/
│   ├── [locale]/
│   │   ├── auth/           # Login page
│   │   ├── admin/
│   │   │   ├── today/      # Command center
│   │   │   ├── patients/   # Patient list + new patient
│   │   │   ├── review/     # Note review queue
│   │   │   ├── doctors/    # Doctor management (Wave 2)
│   │   │   └── insights/   # Dashboards (Wave 3)
│   │   └── doctor/
│   │       ├── today/      # Doctor's daily visit list
│   │       ├── patients/   # Assigned patients (Wave 2)
│   │       ├── notes/      # Draft + submitted notes
│   │       └── profile/    # Doctor profile
├── components/
│   ├── admin/              # Admin-specific components
│   ├── doctor/             # Doctor-specific components
│   └── shared/             # Shared across roles
├── lib/
│   ├── supabase.ts         # Supabase client (browser + server)
│   └── utils.ts            # Utility functions
├── types/
│   ├── index.ts            # All TypeScript interfaces
│   └── supabase.ts         # Auto-generated DB types
├── i18n/
│   ├── routing.ts          # Locale config (en/ar)
│   └── request.ts          # next-intl server config
├── messages/
│   ├── en.json             # English strings
│   └── ar.json             # Arabic strings
└── middleware.ts            # Auth + role routing

supabase/
└── migrations/
    └── 001_initial.sql     # Full schema + RLS + seed data
```

---

## What's built (Wave 1)

- ✅ Auth (login/logout, role-based redirect)
- ✅ Middleware (protects routes by role)
- ✅ Arabic/English i18n with RTL support
- ✅ Admin sidebar layout
- ✅ Admin: Today command center
- ✅ Admin: Patients list with search + status filter
- ✅ Admin: New patient intake form
- ✅ Admin: Note review queue with approve/send-back
- ✅ Doctor bottom-nav layout (mobile-first)
- ✅ Doctor: Today's visit list
- ✅ Doctor: Notes list with review status
- ✅ Full database schema + RLS policies
- ✅ All APTA diagnoses seeded (47 conditions, Arabic + English)

## What's next (Wave 2)

- Patient detail page (full file, status history, programs)
- Visit detail + quick sheet form (start/complete flow)
- Full SOAP sheet
- Program upload + form builder
- Exercise library
- Doctor patients list
- Doctor profile editing
- Doctor management (admin)

## Deploy to Vercel + Supabase Cloud

1. Create a project on [supabase.com](https://supabase.com)
2. Run `supabase db push` to push your local migrations
3. Push to GitHub
4. Connect repo to Vercel
5. Add env vars in Vercel dashboard (use cloud Supabase URL + keys)
6. Deploy
