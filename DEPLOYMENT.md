# Deploy Reelwise to Vercel + Supabase

This is a Next.js application with a real Supabase/PostgreSQL backend. The source package contains 25 original animated videos and the complete 175-file source-link catalog from the prototype. It does not contain your credentials, accounts, or a provisioned hosted database.

## 1. Create a Supabase project

Create a new Supabase project (or use a fresh development project). Record its project URL, publishable key, project reference, and database password. Keep the database password out of the app and out of Git.

Apply these files **in order** using the Supabase SQL Editor:

1. `supabase/migrations/202611050001_schema.sql`
2. `supabase/migrations/202611050002_curriculum.sql`

These install the schema and seed one published Data 140 course, 25 lessons/quizzes, and 175 source links. The seed includes original explanations, not copies of textbook prose. Run each migration once. The schema migration deliberately fails if installed twice; migrations are tracked by the CLI when using `db push`.

Alternatively, install the Supabase CLI, then from the application root:

```sh
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

The content is a migration, so it is included in `db push`; no additional remote seed step is required. For local Supabase with Docker, run `npx supabase start`, then `npx supabase db reset`. `supabase/config.toml` supplies local Auth URLs. Hosted project Auth URLs are configured separately below.

## 2. Run locally

Use Node.js 22 or newer (24 is recommended and was tested).

```sh
npm ci
cp .env.example .env.local
```

Edit `.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
```

A legacy `anon` key also works. No service-role or secret API key is required, and neither belongs in a `NEXT_PUBLIC_` variable. Row-level security and the signed-in user's JWT protect account data.

```sh
npm run dev
```

Open http://localhost:3000. Without valid environment variables or the schema, the app displays a setup page instead of a fake working backend.

## 3. Deploy the frontend to Vercel

Upload the source to your own GitHub repository and import it into Vercel, or use the Vercel CLI from the project root:

```sh
npx vercel
```

For a Git import, select the directory containing `package.json` as the Root Directory. Vercel detects Next.js; `vercel.json` supplies `npm ci` and `npm run build`. Use Node.js 24.x or 22.x in the Vercel project settings.

Set the two environment variables above for the environments you deploy (Production and, if needed, Preview/Development). Do not enter credentials into source files. Redeploy after changing environment variables; the public browser values are included at build time.

To publish with the CLI after preview review:

```sh
npx vercel --prod
```

The application uses Next.js rendering on Vercel and Supabase Auth/Data API/SQL functions as its backend. It is not a static HTML export.

## 4. Configure Supabase Auth for the deployed domain

In Supabase Authentication > URL Configuration:

- **Site URL:** `https://YOUR_APP.vercel.app` (or your custom domain).
- **Redirect allow list:** `https://YOUR_APP.vercel.app/auth/callback` and `https://YOUR_APP.vercel.app/auth/callback?next=/account/reset`.
- Add the same localhost callback URLs for local development. Add specific Vercel preview URLs if you want email auth in previews.

Keep email confirmation enabled. The signup confirmation and password recovery use the PKCE callback route. If you customize email templates to send token hashes directly, use `/auth/callback?token_hash={{ .TokenHash }}&type=signup` for signup and `/auth/callback?token_hash={{ .TokenHash }}&type=recovery&next=/account/reset` for password recovery; allow those routes as appropriate. Do not mix custom token-hash templates with an unrelated implicit-flow callback.

Configure your SMTP provider in Supabase for real student signups. Supabase's default email service has delivery and recipient/rate restrictions. Keep password auth enabled, and configure its password policy at least as strong as the app's 8-character minimum.

## 5. Deployment acceptance checks

After provisioning, verify with two separate student accounts:

1. Browse lessons and source search while signed out. Try a quick check or bookmark: sign-in should be required.
2. Sign up, confirm the email, sign in, and edit the display name.
3. Add Data 140 to My classes; bookmark a lesson.
4. Answer a quiz incorrectly: see remedial feedback without a passed result. Answer correctly: mastery updates.
5. Sign in on another device: bookmarks, enrollment, watched progress, and passed checks persist. Switch accounts: no other user's saved items should appear.
6. Reset the password from an email link and sign in with the new password. Sign out and verify private progress is no longer visible.
7. Verify MP4 playback on iOS Safari and Android Chrome, plus the three externally hosted narrated players. Browser autoplay is muted and respects reduced-motion preferences; narration requires a user gesture and a supported speech-synthesis browser.

Actual hosted email delivery, hosted Supabase RLS behavior, and deployed browser playback require the configured services and are not established by a local build.

## Backend design

- Public read-only content: `courses`, `lessons`, `course_sources`, `quiz_questions`.
- Private per-user state: `profiles`, `enrollments`, `bookmarks`, `lesson_progress`, `quiz_attempts`.
- Correct answers live in `private.quiz_keys`, outside the exposed API schemas.
- `submit_quiz` verifies authentication, validates the option, grades server-side, records an attempt, enrolls in the course, and updates passed mastery atomically. It rate-limits users to 30 attempts/minute.
- `record_watch` clamps seconds to the lesson duration, preserves the maximum watched time, and cannot mark a quiz passed.
- Client roles have no direct insert/update permission on quiz results, attempts, or progress. SQL policies isolate each user's own records. Deleting an Auth user cascades their app data.
- Course editing is an administrator operation via SQL migrations/dashboard. There is no client-side admin role or public content-editing endpoint.

## Existing data and media

The former prototype's localStorage arrays are not imported as verified quiz results; students start fresh and earn mastery through database-graded checks. The old hosted prototype has not been replaced by this Vercel application.

The small MP4 files are versioned in `public/videos/` and deploy with Vercel. For a large media library, upload the videos to a Supabase Storage bucket or a video CDN and update `lessons.video_path` to its HTTPS URL. Supabase Storage is not required to run this release. Hosted narrated video URLs are the approved unlisted Descript embeds; this application does not call Descript to generate content.

This application includes no live AI/video-generation backend or file ingestion pipeline. Those services can be integrated later without changing the account/database foundation.

## Validation and updates

```sh
npm run typecheck
npm test
npm run db:test
npm run build
```

`db:test` uses an embedded PostgreSQL runtime (PGlite) with Supabase-like auth roles to exercise the real schema, grants, policies, grading, and seed. It is not a substitute for running acceptance checks against your actual Supabase project. Production dependencies were audited with no reported vulnerabilities when packaged.

Update source content in `scripts/curriculum-source.json`; `python scripts/generate-seed.py` regenerates the initial seed migration. **After a real deployment, create a new forward migration for content changes instead of editing applied migrations.** Never run `db reset` against your production database.
