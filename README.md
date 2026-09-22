# LAGCC Tennis Clinic Sign-Ups

A sign-up site for weekly kids' tennis clinics: parents pick a clinic and add
one or more kids with just a name and phone number (no account needed), and
coaches log in to manage rosters and manually cancel clinics when needed
(with an automatic text message to everyone signed up).

## The weekly schedule

Defined in [`lib/clinics.ts`](./lib/clinics.ts) and loaded into the database
by the seed script:

| Day | Clinics | Time | Ages |
|---|---|---|---|
| Monday | Junior Clinic | 3:30–4:30pm | 6–10 |
| Tuesday | Super Stars / Junior Clinic | 3:30–4:30pm | 3–6 / 6–10 |
| Wednesday | Super Stars / Junior Clinic | 3:30–4:30pm | 3–6 / 6–10 |
| Thursday | Super Stars / Junior Clinic / Junior Clinic | 3:30–4:30pm | 3–6 / 6–10 / 10–15 |
| Friday | Junior Clinic (x2) | 3:30–4:30pm | 6–10 / 10–15 |
| Saturday | Junior Clinic | 1:00–2:00pm | 6–10 |
| Sunday | Junior Clinic (x2) | 10:00–11:00am / 11:00am–12:00pm | 6–10 / 10–15 |

To change the schedule (add a day, rename a clinic, change a time or age
range), edit `lib/clinics.ts` and re-run `npm run db:seed` — it's safe to
run repeatedly since it upserts by name/day/time.

Default capacity per clinic is 4–8 kids (both editable per-session by a
coach from the dashboard): once full, additional sign-ups go on a waitlist
and are automatically promoted if a spot opens up. Cancelling a clinic —
for weather, low sign-ups, or anything else — is always a coach's manual
call from the dashboard; the app never cancels one on its own.

## What's built

- **Public sign-up pages** at `/week/YYYY-MM-DD` (one Monday-start week at a
  time, with prev/next navigation), where anyone can add multiple kids to a
  clinic in one sign-up — a cell phone number (for text updates) and each
  kid's first/last name, no account or password needed — plus a "Non-member"
  checkbox for a kid who isn't a club member. Checking it reveals a required
  "Member name" field naming the club member sponsoring that guest. Coaches
  have the same checkbox (and sponsor-name field) on the walk-in form.
  Membership status shows up on the coach roster, billing, and CSV export as
  "Member" or "Non-member," with the sponsor's name shown underneath for any
  non-member entry, so it's clear at a glance who isn't a member and who's
  sponsoring them. Who's signed up is shown prominently on both the public
  clinic card (bold green "Signed up" pills, collapsible via a dropdown once
  there are several) and the coach dashboard (bold child names in the roster
  table). Clicking a signed-up kid's name on the public page opens a quick
  cancel box right there — type the child's first and last name and confirm,
  no need to go through the phone-lookup panel (this is a convenience check,
  not real verification, since the name is already shown on the pill).
  Cancelling this way follows the same 24-hour policy as the lookup panel
  below: 24+ hours out it just cancels, less than 24 hours out it's still
  recorded (and flagged for billing on the coach side) per club policy.
- **Manage my sign-ups** — a collapsible panel at the top of every week page
  where a parent types the phone number they signed up with to find and
  cancel their own kids' sign-ups, no account or login needed — the same
  phone number is all that identifies a sign-up as theirs. A clinic they
  cancelled within 24 hours stays visible in the results (rather than
  disappearing) until its date passes, flagged in red with "— cancelled less
  than 24 hours" and a note that it's still billed — mirroring how the
  coach's own roster flags it.
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
  "Sign-ups closed" badge in place of the Sign Up button. Enforced on the
  page and in the sign-up API. Coaches can still add a walk-in after the
  cutoff from the dashboard.
- **Manual cancellation only** — every clinic has a minimum (default 4) and
  maximum (default 8), both coach-editable per session, purely as a
  reference: the "signed up" badge on the coach dashboard turns gold and
  reads "below min" once a clinic is short of its minimum (late
  cancellations still count toward it, since they're still billed), so a
  coach can see at a glance which clinics might be worth cancelling — but
  nothing ever cancels a clinic automatically. A coach always makes that
  call themselves from **Cancel Clinic** on the dashboard.
- **Late-cancellation tracking (24-hour policy)** — per club policy, cancelling
  a sign-up less than 24 hours before the clinic's start time still incurs a
  charge. A self-serve cancellation made 24+ hours ahead simply removes the
  sign-up, same as before. One made within 24 hours is kept on record: it's
  flagged in red on that clinic's roster on the coach dashboard (e.g. "Peter -
  cancelled less than 24 hours") and in the "Manage my sign-ups" phone lookup
  results, and shows up in the CSV export as "Cancelled (late — still
  billed)". Early cancellations don't appear on any of those. See also
  **Billing** below.
- **Coach login** (`/coach/login`, credentials-based, coach accounts live only
  in the database — there's no public sign-up for coach accounts). Every
  coach-only page and API route checks specifically for a coach session, so
  nothing under `/coach` is reachable without logging in.
- **Coaches** (`/coach/coaches`) — an already-logged-in coach adds every other
  coach by name/email and sets their password directly in this UI (there's no
  self-service coach sign-up, and passwords are never emailed/texted or typed
  into anything besides this page). Also lets a coach remove another coach's
  access; the last remaining coach account can't be removed, so the club can
  never get locked out entirely. See **Getting started** below for how the
  very first coach account gets created.
  - Each coach can also have a phone number on file (optional, editable
    inline any time). A coach with a phone number gets a text alongside the
    parents the moment a clinic is cancelled; a coach with no phone number
    just doesn't get one.
- **Coach dashboard** (`/coach/dashboard`) per week: a bold, clickable
  "X/8 signed up" badge on every clinic toggles its roster open or closed
  (collapsed by default is never forced — it starts open) so it's easy to
  scan who's signed up and how many at a glance, plus a running total for
  the whole week shown right under "Signed in as [coach]". From there: add
  a walk-in/phone sign-up, remove a kid, edit a clinic's minimum and
  maximum, export a roster as CSV, and cancel or reopen a clinic.
- **Billing** (`/coach/billing`) — every late cancellation across every week,
  in one list, instead of having to click through each week's dashboard to
  find the red flags. A "Dismiss" button clears a row once it's been billed.
- **Cancellation reasons**: Rain, Extreme heat, Not enough sign-ups, Other
  (with an optional free-text note) — chosen when a coach cancels a clinic.
- **Text message notifications** via Twilio:
  - Confirmation text when a parent signs up (or is added by a coach).
  - Cancellation text to every parent signed up (including the waitlist)
    and every coach with a phone number on file, the moment a coach cancels
    a clinic, naming the reason.
  - If Twilio isn't configured, messages are logged to the server console
    instead of failing, so everything else still works in development.

## Ideas not yet built (worth adding later)

- Automated day-before reminder texts.
- Email notifications alongside text.
- Multiple named coach roles/permissions (currently any coach account can do
  anything).
- A real weather API hook to suggest "Rain" cancellations automatically.
- Payment/billing integration if clinics ever need to be paid per session —
  today the app only flags late cancellations (on the coach's Billing page
  and in the phone lookup results) for a coach to bill manually, it doesn't
  charge anyone itself.

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
`SEED_COACH_PASSWORD` from your `.env` — this first account is the only one
created outside the app itself. Add every other coach from `/coach/coaches`
once you're logged in (name, email, and a password you set there directly);
there's no public coach sign-up. Locally, you can alternatively run:

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
   URL, `NEXTAUTH_SECRET`, `SEED_COACH_EMAIL`/`PASSWORD`/`NAME`, and the
   Twilio vars once you have them).
3. Deploy. The build itself creates the tables and loads the clinic
   schedule + coach account — no manual step needed.
4. Give parents the site's home page URL — it always redirects to the
   current week. Log in as a coach at `/coach/login`.

Every future `git push` to the connected branch redeploys automatically.
