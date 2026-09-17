# LAGCC Tennis Clinic Sign-Ups

A sign-up site for weekly kids' tennis clinics: parents pick a clinic and add
one or more kids, coaches log in to manage rosters and cancel clinics (with
an automatic text message to everyone signed up).

## The weekly schedule

Defined in [`lib/clinics.ts`](./lib/clinics.ts) and loaded into the database
by the seed script:

| Day | Clinics | Time | Ages |
|---|---|---|---|
| Monday | Monday Clinic | 3:30–4:30pm | 6–10 |
| Tuesday | Super Stars / Junior Clinic | 3:30–4:30pm | 3–6 / 6–10 |
| Wednesday | Super Stars / Junior Clinic | 3:30–4:30pm | 3–6 / 6–10 |
| Thursday | Super Stars / Junior Clinic / Teen Clinic | 3:30–4:30pm | 3–6 / 6–10 / 10–15 |
| Friday | Clinic / Teen Clinic | 3:30–4:30pm | 8–10 / 10–15 |
| Saturday | Saturday Clinic | 1:00–2:00pm | 6–10 |
| Sunday | Sunday Clinic (x2) | 10:00–11:00am / 11:00am–12:00pm | 6–10 / 10–15 |

To change the schedule (add a day, rename a clinic, change a time or age
range), edit `lib/clinics.ts` and re-run `npm run db:seed` — it's safe to
run repeatedly since it upserts by name/day/time.

Default capacity per clinic is 8 kids (editable per-week by a coach from the
dashboard); once full, additional sign-ups go on a waitlist and are
automatically promoted if a spot opens up.

## What's built

- **Public sign-up pages** at `/week/YYYY-MM-DD` (one Monday-start week at a
  time, with prev/next navigation). Parents fill in their name and phone
  number once and can add multiple kids in the same sign-up.
- **Waitlisting** once a clinic hits capacity.
- **Self-serve management** — a "Manage my sign-ups" panel lets a parent look
  up everything they've signed up for by phone number and cancel it
  themselves, without needing a coach.
- **Coach login** (`/coach/login`, credentials-based, coach accounts live only
  in the database — there's no public sign-up for coach accounts).
- **Coach dashboard** (`/coach/dashboard`) per week: view every roster,
  add a walk-in/phone sign-up, remove a kid, edit a clinic's capacity,
  export a roster as CSV, and cancel or reopen a clinic.
- **Cancellation reasons**: Rain, Extreme heat, Not enough sign-ups, Other
  (with an optional free-text note) — chosen when a coach cancels a clinic.
- **Text message notifications** via Twilio:
  - Confirmation text when a parent signs up (or is added by a coach).
  - Cancellation text to every parent signed up (including the waitlist)
    the moment a coach cancels a clinic, naming the reason.
  - If Twilio isn't configured, messages are logged to the server console
    instead of failing, so everything else still works in development.

## Ideas not yet built (worth adding later)

- Automated day-before reminder texts (would need a scheduled job/cron).
- Email notifications alongside text (email field is already collected).
- Multiple named coach roles/permissions (currently any coach account can do
  anything).
- A real weather API hook to suggest "Rain" cancellations automatically.
- Recurring/season-long sign-up ("sign my kid up for every Tuesday this
  season") instead of one week at a time.
- Payment/billing integration if clinics ever need to be paid per session.

## Getting started (local dev)

You'll need a Postgres database to point at — a free one from
[Neon](https://neon.tech) or [Vercel Postgres](https://vercel.com/storage/postgres)
takes under a minute to create and works fine for both local dev and
production (one `DATABASE_URL`, no separate local database to install).

```bash
npm install
cp .env.example .env      # then edit .env — paste in your DATABASE_URL, see below
npm run db:push           # creates the tables from the schema
npm run db:seed           # loads the clinic schedule + a coach account
npm run dev                # http://localhost:3000
```

Sign in as a coach at `/coach/login` using `SEED_COACH_EMAIL` /
`SEED_COACH_PASSWORD` from your `.env`. Add more coach accounts anytime with:

```bash
npm run coach:add -- "Assistant Pro" assistant@lagcc.example "a-strong-password"
```

## Environment variables

See [`.env.example`](./.env.example) for the full list. Three need a real
account to work:

- **`DATABASE_URL`** — a Postgres connection string. Neon and Vercel Postgres
  both give you one immediately on signup (no credit card). If your host
  runs your app on serverless functions (Vercel included), use the
  **pooled** connection string your provider gives you, not the direct one —
  otherwise you can run out of database connections under normal traffic.
- **Twilio** (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`)
  — sign up at twilio.com, buy a phone number capable of SMS, and put its
  number (E.164 format, e.g. `+15551234567`) in `TWILIO_FROM_NUMBER`. Without
  this set, the app still works, it just logs texts to the server console
  instead of sending them.
- **`NEXTAUTH_SECRET`** — required for coach login sessions. Generate one
  with `openssl rand -base64 32`.

## Deploying

This is a standard Next.js + Prisma app, so it deploys well to Vercel,
Railway, Render, or any Node host. On Vercel specifically:

1. Push this repo to GitHub (already done) and go to
   [vercel.com](https://vercel.com) → **Add New → Project** → pick this repo
   and branch.
2. Before the first deploy, add the environment variables above in the
   project's settings (`DATABASE_URL`, `NEXTAUTH_URL` — your `*.vercel.app`
   URL, `NEXTAUTH_SECRET`, `SEED_COACH_EMAIL`/`PASSWORD`/`NAME`, and the
   Twilio vars once you have them).
3. Deploy. Then run the schema + seed once against that same
   `DATABASE_URL` — easiest from your own machine:
   ```bash
   DATABASE_URL="<paste the same value you put in Vercel>" npm run db:push
   DATABASE_URL="<paste the same value you put in Vercel>" npm run db:seed
   ```
4. Give parents the site's home page URL — it always redirects to the
   current week. Log in as a coach at `/coach/login`.

Every future `git push` to the connected branch redeploys automatically.
