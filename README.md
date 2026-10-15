# Routine Scrapper Max

<p align="center">
  <img src="public/app-icon.png" alt="Routine Scrapper Max app icon" width="112" />
</p>

<p align="center">
  <strong>A clearer way to follow the CSE Batch 69 routine.</strong><br />
  Find your classes, keep track of deadlines, and get your schedule on your phone.
</p>

<p align="center">
  <a href="https://routine-scrapper-max.vercel.app"><strong>Open the app</strong></a>
  ·
  <a href="https://github.com/Darkedgeblood/routine-scrapper-max/releases/latest">Download the latest Android APK</a>
</p>

---

## What it does

- **Schedules for Batch 69:** Browse sections `69_A` through `69_P` and see course times, rooms, instructors, and lab sections.
- **Lab group filters:** Focus on Group 1 or Group 2 while keeping other groups visible for reference.
- **At-a-glance day view:** Check the current time, first or next class, class count, and total class time.
- **Deadline tracking:** Add quizzes, assignments, and presentations, then mark them complete.
- **Optional reminders:** Enable class and deadline alerts on supported devices.
- **Calendar export:** Download a recurring `.ics` file for a chosen number of weeks and import it into a calendar app. Holidays and one-off room changes are not included in the export.
- **National holiday labels:** See listed national holidays in place of that day's class cards.
- **Feedback in the app:** Report a schedule correction or suggest an improvement.

## Use it on your phone

### Android

Download the APK from [GitHub Releases](https://github.com/Darkedgeblood/routine-scrapper-max/releases/latest). Android will ask you to confirm installation. Future APKs use the same signing key so supported existing installs can update in place. See the [Android release guide](docs/android-releases.md) for maintainer setup and release details.

### iPhone

Open [the web app](https://routine-scrapper-max.vercel.app) in Safari, tap **Share → Add to Home Screen**, enable **Open as Web App**, then tap **Add**. This creates a home-screen shortcut to the web app; it is not a native iOS APK.

## Run locally

The project uses Node.js 22 and pnpm. From the repository root:

```sh
corepack enable
corepack prepare pnpm@12.3.4 --activate
pnpm install --allow-build=sharp
pnpm dev
```

Then open [http://localhost:3000](http://localhost:3000).

For account-backed features, configure these public Supabase project values in `.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-key
```

The routine can still be browsed without Supabase configuration; account features need a configured project and its database schema from [`supabase/schema.sql`](supabase/schema.sql).

Useful commands:

```sh
pnpm dev       # Start the development server
pnpm build     # Build the production web app
pnpm start     # Run the production build locally
```

## Project layout

| Path | Purpose |
| --- | --- |
| `app/` | Next.js app routes, page, manifest, and styling |
| `components/` | Schedule, account, reminder, and settings UI |
| `lib/` | Routine data, holidays, reminders, notifications, and app logic |
| `supabase/` | Database schema for account-backed features |
| `.github/workflows/` | Android APK build and release automation |
| `docs/` | Maintainer and release documentation |

## Contributing

Use the in-app feedback form to report a routine correction or share an idea. Code changes can be submitted through GitHub pull requests. Please do not commit passwords, signing keys, or other private credentials.

---

<p align="center"><sub>Built for CSE Batch 69.</sub></p>
