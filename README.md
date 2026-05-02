# Philly Picks Lab

A polished contextual bandit restaurant recommender for Philadelphia. The MVP uses 100 synthetic restaurants, simulated users, and in-browser event logs so the product loop can be demonstrated before Google Places or Postgres are connected.

## What It Shows

- Contextual recommendations by neighborhood, price, category, and vibe
- Thompson-style exploration/exploitation scoring
- Synthetic users that generate realistic event logs
- Reward instrumentation for skips, details, saves, reservations, and orders
- Analytics dashboard for reward rate, action mix, regret, top restaurants, and segments
- Postgres-ready schema in `lib/schema.sql`

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Supabase/Postgres Setup

1. Create a Supabase project.
2. Run the SQL in `lib/schema.sql` in the Supabase SQL editor.
3. Copy `.env.example` to `.env.local`.
4. Fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

The app reads events from `/api/events` and writes new impressions/actions there. If the Supabase variables are absent, it stays in demo mode with simulated in-browser events.

To seed Supabase with the synthetic restaurant catalog and simulated events during development:

```bash
ALLOW_DATABASE_SEED=true
```

Then run the app and send a `POST` request to:

```bash
http://localhost:3000/api/seed
```

Turn `ALLOW_DATABASE_SEED` back to `false` after seeding.

## Next Data Step

Google Places fields can be added as optional enrichment columns after the MVP is working against Supabase/Postgres. See `docs/google-places-ingestion.md` for the recommended ingestion flow.
