# TryOn

An app that allows users to virtually try on clothes using Gemini.

## Tech Stack

- **Next.js (App Router)**
- **Auth.js (NextAuth v5)** with Google OAuth
- **Prisma** + **PostgreSQL**
- **TypeScript**
- **Tailwind CSS**

## Monorepo Layout

- `tryon/` — Next.js app, API routes, Prisma schema, migrations

## Prerequisites

- Node.js 18+
- PostgreSQL database (e.g., Neon)
- Google Cloud project with OAuth 2.0 Client ID (Web application)

## 1) Clone and install

```bash
git clone <this-repo-url>
cd tryon
npm install
```

## 2) Create .env

Create a `.env` file in `tryon/`:

```bash
# Auth.js
AUTH_SECRET=<run `npx auth secret` and paste value here>

# Google OAuth
AUTH_GOOGLE_ID=<your-google-oauth-client-id>
AUTH_GOOGLE_SECRET=<your-google-oauth-client-secret>

# Database (example uses Neon; keep sslmode=require)
DATABASE_URL=postgresql://neondb_owner:<password>@<host>:<port>/<database>?sslmode=require

# NextAuth callback base URL
NEXTAUTH_URL=http://localhost:3000

# Environment
NODE_ENV=development
```

Tips:
- Generate `AUTH_SECRET`:
  ```bash
  npx auth secret
  ```
- Google OAuth authorized redirect URI (local):
  - `http://localhost:3000/api/auth/callback/google`
- Also add your production domain redirect URI before deploying:
  - `https://<your-domain>/api/auth/callback/google`

## 3) Database: Prisma generate + migrate

```bash
cd tryon
npx prisma generate
# apply existing migrations
npx prisma migrate deploy
# for local schema changes during development:
# npx prisma migrate dev --name init
```

This creates the required tables: `User`, `Account`, `Session`, `VerificationToken`, and optional `Authenticator`.

## 4) Run the app

```bash
npm run dev
```

Open http://localhost:3000 and click “Signin with Google”.

## 5) Verify

- After signing in:
  - Home page shows “Hi <your name>” and your Google profile image.
  - Database contains a `User` row (unique by email) and an `Account` row for provider `google`.
- After signing out:
  - Session is cleared and the Sign In button reappears.

## Troubleshooting

- Ensure `AUTH_SECRET`, `AUTH_GOOGLE_ID`, and `AUTH_GOOGLE_SECRET` are set and correct.
- Verify the Google redirect URI exactly matches your environment (localhost vs production).
- If using Neon or another hosted DB, keep `sslmode=require` in `DATABASE_URL`.
- Re-run `npx prisma generate` after changing the Prisma schema.

## Scripts

From `tryon/`:

- `npm run dev` — Start Next.js dev server
- `npx prisma studio` — View/edit DB in a GUI