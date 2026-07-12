# Viral Clipz AI

Mobile-first AI video repurposing app: upload one long video, get a ranked set of platform-ready
vertical clips — each with captions, scores, a "why this could work" strategy panel, and a full
social content package (hooks, titles, captions, hashtags, CTAs, posting strategy).

Built with Expo + React Native + TypeScript. Runs on iOS, Android, and web.

## Product overview

Viral Clipz AI is not a generic video editor — it's a content growth engine:

1. **Find** the most valuable moments inside long videos.
2. **Convert** them into polished vertical clips (captions, branding, reframing).
3. **Explain** why each clip could perform (hook analysis, retention risk, platform fit).
4. **Package** every clip with hooks, titles, captions, hashtags, and CTAs.
5. **Learn** from published performance to improve future picks.

## Architecture

```
viral-clipz-ai/
├── app/                     # expo-router file-based routes
│   ├── _layout.tsx          # providers + auth gate (signed out → auth, new → onboarding)
│   ├── index.tsx            # splash while auth initializes
│   ├── (auth)/              # welcome, sign-in, sign-up, forgot-password, verify-email
│   ├── onboarding/          # 6-step creator onboarding
│   ├── (tabs)/              # Home · Projects · [Create] · Analytics · Profile
│   ├── create/              # 5-step project wizard (source → outcome → audience → config → review)
│   ├── project/[id]/        # processing pipeline screen + ranked results feed
│   ├── clip/[id]/           # clip detail (scores, strategy, content package) + editor shell
│   ├── brand-kits/          # brand kit list + editor
│   └── settings/            # subscription paywall, social connections
└── src/
    ├── theme/tokens.ts      # design tokens: color, spacing, radius, type, shadows, motion
    ├── types/entities.ts    # typed entities mirroring the planned Supabase schema (20 tables)
    ├── config/plans.ts      # subscription plans as data (Free/Creator/Growth/Agency)
    ├── lib/                 # env, supabase client, analytics layer, error reporting, formatters
    ├── stores/              # zustand: auth, onboarding answers, create-flow draft, editor undo/redo
    ├── services/            # Backend interface + demo implementation
    ├── data/demo.ts         # ALL demo-mode sample data (delete when backend lands)
    └── components/          # ui/ primitives + feature/ composites
```

Key decisions:

- **Service seam** — screens only talk to the `Backend` interface (`src/services/backend.ts`).
  The demo implementation (`demoBackend.ts`) runs the whole app offline; the production Supabase
  implementation swaps in via one line in `src/services/index.ts`.
- **Job status is an interface, not a timer** — the processing screen polls `backend.getJob()`
  (React Query `refetchInterval`). The demo backend simulates stage-by-stage progress; production
  implements the same shape with Supabase Realtime or polling — no screen changes.
- **Tokens over ad-hoc styles** — every color/space/radius/type value comes from `src/theme/tokens.ts`.
- **Analytics vendor-agnostic** — `track()` in `src/lib/analytics.ts` with a swappable provider
  (console in dev, PostHog-ready). All growth-loop events from the spec are instrumented.
- **Plans are data** — pricing/limits live in `src/config/plans.ts` with RevenueCat entitlement IDs.

## Local setup

```bash
cd viral-clipz-ai
npm install
npm start          # Expo dev server (press i / a / w)
```

With no environment variables set, the app boots in **Demo Mode** automatically.

## Environment variables

Copy `.env.example` → `.env`. All variables are `EXPO_PUBLIC_*` (client-safe only):

| Variable | Purpose |
| --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (RLS-enforced, safe for clients) |
| `EXPO_PUBLIC_POSTHOG_KEY` / `_HOST` | PostHog analytics (optional) |
| `EXPO_PUBLIC_SENTRY_DSN` | Sentry error reporting (optional) |
| `EXPO_PUBLIC_REVENUECAT_IOS_KEY` / `_ANDROID_KEY` | RevenueCat public SDK keys (optional) |

**Never** put a service-role key or any privileged secret in the client. Server-side code must
verify user/workspace ownership itself — client-sent IDs are hints, not authority.

## Supabase setup

1. Create a project at supabase.com; copy the URL + anon key into `.env`.
2. Enable Email auth (and optionally Apple/Google providers) in Auth settings.
3. Create the schema from `src/types/entities.ts` (profiles, workspaces, workspace_members,
   subscriptions, usage_ledger, brand_kits, projects, source_videos, processing_jobs, transcripts,
   transcript_segments, clips, clip_scores, clip_assets, social_accounts, publications,
   performance_metrics, generated_copy, notifications, audit_logs) with RLS on every table.
4. Restart the dev server — auth becomes real; data services stay on demo until the backend
   implementation ships (see below).

## Demo mode

When Supabase credentials are absent:

- "Explore in Demo Mode" appears on the welcome screen; sign-in/sign-up route into a local session.
- A persistent **Demo Mode banner** appears on every main screen.
- All data comes from `src/data/demo.ts`; the processing screen runs a simulated staged pipeline.
- Analytics screens are explicitly labeled "Demonstration data".
- Nothing pretends to touch production: checkout is disabled, unconnected integrations say so.

To remove demo mode later: delete `src/data/demo.ts` + `src/services/demoBackend.ts` and point
`src/services/index.ts` at the Supabase implementation.

## Commands

| Command | What it does |
| --- | --- |
| `npm start` | Expo dev server |
| `npm run ios` / `android` / `web` | Platform targets |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run build:web` | Static web export to `dist/` |

## Backend integration points (Prompt 2)

- `src/services/index.ts` — swap `demoBackend` for a `supabaseBackend` implementing `Backend`.
- `src/stores/authStore.ts` — `completeOnboarding` already upserts to `profiles` when configured.
- `app/project/[id]/processing.tsx` — replace polling with Supabase Realtime on `processing_jobs`.
- `app/settings/subscription.tsx` — `startCheckout` is the RevenueCat purchase seam.
- `src/lib/analytics.ts` — `setAnalyticsProvider()` for PostHog; `src/lib/errors.ts` for Sentry.
- Source connectors (Drive/Dropbox/Zoom/Riverside) and social OAuth are visible but clearly
  labeled integration-ready, not functional.

## Known limitations

- Clip previews are placeholder frames — real rendering/playback requires the media backend
  (expo-video is installed and ready).
- The editor is a functional shell: trim/caption/framing/brand state is real and undoable, but
  media re-rendering happens server-side after export.
- Static web export logs React hydration warnings (#418) because auth state is client-only;
  React recovers and native apps are unaffected.
- Magic link / password reset require Supabase; in demo mode they explain that instead of failing.
- No automated test suite yet — verification is typecheck + web export + headless smoke test.

## Next production steps

1. Implement `supabaseBackend` + SQL migrations with RLS for the 20 entities.
2. Build the processing pipeline (upload → transcode → transcribe → moment detection → scoring →
   caption render) behind the existing `ProcessingJob` contract.
3. Wire RevenueCat offerings to `config/plans.ts` entitlements and gate exports server-side.
4. Add social OAuth + publishing, then feed real metrics into the analytics screen.
