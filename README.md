# Reelwise

A mobile-first Next.js + React + TypeScript application for Vercel, with Supabase Auth and PostgreSQL as the backend. Preserves the warm cream/graphite brand, pastel outlined cards, lime pill actions, vertical video feed, Data 140 curriculum, narrated embeds, and source library.

Features: email signup/confirmation/sign-in/reset, editable profiles, course enrollment, account-private bookmarks, database-graded quizzes, authored remedial feedback, watched progress and quiz mastery synced across sessions/devices. Public browsing requires no account. No mock accounts or simulated database.

Start with **[DEPLOYMENT.md](./DEPLOYMENT.md)** for Supabase migrations, environment variables, Auth URLs, and Vercel deployment. Node.js 22+ is required.

```sh
npm ci
cp .env.example .env.local
# Set Supabase public project URL and publishable key; apply migrations.
npm run dev
```

## Project structure

- `src/app`: Next.js pages, Auth callback, password reset, loading/error states.
- `src/components`: React learning feed, searchable library, account/profile, quiz interactions.
- `src/lib/supabase`: cookie-based browser/server clients; `src/proxy.ts` refreshes verified sessions.
- `supabase/migrations`: schema/RLS/functions + real course seed.
- `public/videos`: 25 18-second H.264 animated chapter introductions.
- `scripts`: deterministic seed generator and PostgreSQL integration tests.
- `tests`: redirect/configuration/content packaging checks.

There is no live AI generation pipeline yet. Mastery reflects these introduction quizzes, not a comprehensive course grade. Source attribution and media/provenance limits are in `CONTENT.md` and the in-app course information panel.

## Validation

`npm run typecheck`, `npm test`, `npm run db:test`, `npm run build`.

A successful local build is not a claim that a Vercel project or Supabase instance has been provisioned. Without configured services, the deployed application displays an honest setup screen. The original HTML prototype remains separate.
