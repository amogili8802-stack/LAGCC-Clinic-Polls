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

Default capacity per clinic is 4–8 kids (both editable per-session by a
coach from the dashboard): once full, additional sign-ups go on a waitlist
and are automatically promoted if a spot opens up; if a clinic still hasn't
hit its minimum by 8pm the night before, it's automatically cancelled and
everyone signed up gets a text (see **Auto-cancellation for low sign-ups**
below).

## What's built

- **Public sign-up pages** at `/week/YYYY-MM-DD` (one Monday-start week at a
  time, with prev/next navigation). Parents fill in their name and phone
  number once and can add multiple kids in the same sign-up, each with their
  own member number.
- **Weekly recurring sign-ups** — a parent can check "🔁 Sign up
  automatically every week until I cancel" on any child when signing up.
  From then on, every time that week's clinics open, the kid is
  auto-enrolled in the matching clinic with no action needed — a
  confirmation (or waitlist) text goes out the same as a normal sign-up.
  Recurring enrollment runs as part of the same lazy per-week setup as
  everything else (see **Rolling weekly release**), so it happens the
  moment anyone loads that week, not on a separate schedule. Parents manage
  or stop a recurring sign-up from the same "Manage my sign-ups" panel
  used for one-off sign-ups; stopping it only affects future weeks, not
  ones already created. Coaches can also check the same box when adding a
  walk-in.
- **Rolling weekly release** — a week only opens for public sign-up at
  10:00am (club-local time, `CLUB_TIMEZONE`) on the Thursday of the week
  before it. The current week is always open; anything further out shows a
  "sign-ups open [date/time]" message instead of the clinic list. Coaches
  aren't affected — the dashboard always shows every week. Enforced both on
  the page and in the sign-up API, so it can't be bypassed by hitting the
  API directly.
- **Waitlisting** once a clinic hits capacity.
- **Nightly 8pm sign-up cutoff** — each clinic stops accepting new public
  sign-ups at 8:00pm (club-local time) the night before it runs, shown as a
  "Sign-ups closed" badge in place of the Sign Up button. This is separate
  from and happens regardless of the auto-cancellation check below — a
  clinic that already has enough kids by 8pm just closes, it isn't
  cancelled. Enforced on the page and in the sign-up API. Coaches can still
  add a walk-in after the cutoff from the dashboard.
- **Auto-cancellation for low sign-ups** — every clinic has a minimum
  (default 4) and maximum (default 8), both coach-editable per session. The
  same nightly 8pm check that closes sign-ups also cancels the clinic (with
  reason "Not enough sign-ups" and a text to everyone signed up, including
  the waitlist) if it's still under its minimum at that point. See
  **Deploying** for the one-time cron setup this needs.
- **Self-serve management** — a "Manage my sign-ups" panel lets a parent look
  up everything they've signed up for by phone number and cancel it
  themselves, without needing a coach.
- **Late-cancellation tracking (24-hour policy)** — per club policy, cancelling
  a sign-up less than 24 hours before the clinic's start time still incurs a
  charge. A self-serve cancellation made 24+ hours ahead simply removes the
  sign-up, same as before. One made within 24 hours is kept on record and
  flagged in red on that clinic's roster on the coach dashboard (e.g. "Peter -
  cancelled less than 24 hours") so the coach knows to bill for it; a
  "Dismiss" button on that row clears the record once billing is resolved. It
  also shows up in the CSV export as "Cancelled (late — still billed)". Early
  cancellations don't appear on the roster or CSV at all.
- **Coach login** (`/coach/login`, credentials-based, coach accounts live only
  in the database — there's no public sign-up for coach accounts).
- **Coach dashboard** (`/coach/dashboard`) per week: view every roster
  (including each kid's member number), add a walk-in/phone sign-up, remove
  a kid, edit a clinic's minimum and maximum, export a roster as CSV, and
  cancel or reopen a clinic.
- **Cancellation reasons**: Rain, Extreme heat, Not enough sign-ups, Other
  (with an optional free-text note) — chosen when a coach cancels a clinic.
- **Text message notifications** via Twilio:
  - Confirmation text when a parent signs up (or is added by a coach).
  - Cancellation text to every parent signed up (including the waitlist)
    the moment a coach cancels a clinic, naming the reason.
  - If Twilio isn't configured, messages are logged to the server console
    instead of failing, so everything else still works in development.

## Ideas not yet built (worth adding later)

- Automated day-before reminder texts (the cron infrastructure from
  auto-cancellation could easily grow a second scheduled check for this).
- Email notifications alongside text (email field is already collected).
- Multiple named coach roles/permissions (currently any coach account can do
  anything).
- A real weather API hook to suggest "Rain" cancellations automatically.
- A coach-facing view of all active recurring sign-ups (today a coach can
  see the "🔁 weekly" tag on a roster and add one via the walk-in form, but
  stopping someone's recurring sign-up on their behalf currently has to go
  through the parent's own self-serve phone lookup).
- Payment/billing integration if clinics ever need to be paid per session —
  today the app only flags late cancellations for a coach to bill manually,
  it doesn't charge anyone itself.

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
- **`CRON_SECRET`** — optional but recommended once deployed. If set,
  Vercel automatically sends it as a bearer token when it triggers the
  auto-cancellation job, and the job rejects any request without it — so
  nobody else can trigger a mass-cancellation by hitting the URL. Generate
  one the same way as `NEXTAUTH_SECRET` and add it in Vercel's project
  settings (it doesn't need to be in your local `.env`).
- **`CLUB_TIMEZONE`** — optional, defaults to `America/Los_Angeles`. Only
  used to compute the Thursday-10am weekly release time. Set it to your
  club's IANA timezone (e.g. `America/New_York`) if it's not Pacific.

The database schema and clinic schedule sync themselves automatically on
every `npm run build` (see `package.json`'s `build` script) — there's no
separate migration step to remember, locally or in production.

## Deploying

This is a standard Next.js + Prisma app, so it deploys well to Vercel,
Railway, Render, or any Node host. On Vercel specifically:

1. Push this repo to GitHub (already done) and go to
   [vercel.com](https://vercel.com) → **Add New → Project** → pick this repo
   and branch.
2. Before the first deploy, add the environment variables above in the
   project's settings (`DATABASE_URL`, `NEXTAUTH_URL` — your `*.vercel.app`
   URL, `NEXTAUTH_SECRET`, `CRON_SECRET`, `SEED_COACH_EMAIL`/`PASSWORD`/`NAME`,
   and the Twilio vars once you have them).
3. Deploy. The build itself creates the tables and loads the clinic
   schedule + coach account — no manual step needed.
4. Give parents the site's home page URL — it always redirects to the
   current week. Log in as a coach at `/coach/login`.

Every future `git push` to the connected branch redeploys automatically.

### Auto-cancellation cron job

`vercel.json` schedules `/api/cron/auto-cancel-low-signups` to run once a
day at 4:00 UTC (8pm Pacific Standard Time; Vercel Cron doesn't shift for
daylight saving, so it lands around 9pm Pacific in the summer). If your
club is in a different timezone, edit the `schedule` in `vercel.json`
(cron syntax, always UTC) to `8 hours before your local midnight-shifted
clinic day` — e.g. 8pm Eastern is `0 1 * * *`. Vercel's free Hobby plan
allows cron jobs that run at most once a day, which this fits.
