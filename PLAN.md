# LinguaFlow — Project Plan & Roadmap

> Living document. Read this first when resuming work. Update it as phases complete.

## Product vision

Pivot from a manual word-list app to an **auto-enriched dictionary + smarter quizzes**.
A user enters a word (e.g. Italian `affrontare`) and we automatically fetch:
- English translation(s)
- Part of speech (verb, noun, adjective…)
- Example sentences (source language + English translation)
- Optional: CEFR level (A1–C2), verb conjugations

**Improvements over Reverso (product goals):**
- Examples ordered easy → hard
- Highlight the target word in each example
- Include verb conjugations
- Build quizzes from real example sentences (cloze), not isolated words
- Handle multiple meanings separately (e.g. `portare` = bring / carry / wear)

## Locked decisions

| Area | Decision | Notes |
|---|---|---|
| DB + Auth | **Supabase** (Postgres + Supabase Auth + Storage), Prisma as ORM | Replaced NextAuth. Project ref `yfcmexnqxaxiingzfjof`, region `aws-0-eu-west-3` |
| Payments (Phase 4) | **Lemon Squeezy** (Merchant of Record — handles tax) | Paywall after 50 words. (User first said "Strapi" — that's a CMS, corrected.) |
| Analytics | **PostHog** (US Cloud) | |
| Enrichment sources ($0, no keys) | **kaikki.org** (Wiktextract) + **Tatoeba** + **DeepL Free** (fallback only) | Google Translate API is NOT free — avoid scraper libs |
| Language scope | **Italian → English first**, behind a language-keyed adapter registry so adding languages is config-level | Schema is `langCode`-aware everywhere |

### Why those sources (validated by spike — see `scripts/SPIKE-NOTES.md`)
- **kaikki** (machine-readable Wiktionary JSON): senses, POS, **English glosses ARE the translation** (so little/no machine translation needed for headwords), full conjugation tables. Excellent quality; multiple meanings come pre-separated.
- **Tatoeba**: example sentences, many with linked English translations. Usable but needs filtering (dedupe trivial sentences) and **highlight via the kaikki `forms` set**, not a naive stem.
- **DeepL Free** (~500k chars/mo): only to translate example sentences Tatoeba didn't already translate.
- CEFR is **not** in kaikki — would need a separate CEFR word-list later (optional).

## Planned enrichment data model (Phase 1)

Shared/deduped dictionary layer so each word is enriched once and reused across all users:

```
Lemma (shared)        text, langCode, status(pending|ready|failed), enrichedAt
 └─ Sense             pos, cefr?, order            ← one per meaning
     ├─ Translation   targetLang, text, order
     └─ Example       sourceText, targetText, source, difficulty, targetOffsets(highlight)
 └─ Conjugation       form, tags[]                 ← from kaikki; doubles as highlight dictionary
UserWord (private)    userId → lemmaId, savedSenseIds, notes   ← replaces current per-user Word
```

Enrichment pipeline: server-side only; check Lemma cache → miss → create `pending`, fetch from sources, normalize, mark `ready`. Graceful degradation (translation can succeed even if examples fail). For slow/ratelimited fetches, return `pending` and drain a jobs table via a cron.

## Phases

- **Phase 0 — Foundation** ✅ **DONE & verified** (login works end-to-end)
  - SQLite → Supabase Postgres (Prisma + `@prisma/adapter-pg`)
  - NextAuth → Supabase Auth (`@supabase/ssr`), session refresh in `proxy.ts`
  - PostHog wired into root layout
  - Prisma client regenerated for Postgres
- **Phase 1 — Enrichment MVP** 🔄 IN PROGRESS (engine verified; UI pending browser test)
  - ✅ Schema: `Lemma/Sense/Example/Conjugation` + `Word.lemmaId` (augments, doesn't replace Word)
  - ✅ Engine `lib/enrichment/` — language registry (`languages.ts`, Italian), `kaikki.ts`, `tatoeba.ts`, cached `enrich.ts` orchestrator. Verified end-to-end (affrontare/casa → senses/examples/conjugations, highlight via forms+stem fallback, warm-cache ~195ms). No DeepL needed (Tatoeba pre-translated).
  - ✅ `createWord` auto-enriches + auto-fills translation from first sense + links lemma; add form translation now optional
  - ✅ Vocabulary rows: shadcn **Collapsible** expandable detail (`components/enriched-detail.tsx`) — meanings, highlighted examples, conjugation chips
  - ⬜ Browser verification; optional: re-enrich on word edit; cap/lazy-load conjugations; broaden languages
  - Note: enrichment runs **inline** in `createWord` (~2s cold, cached after). UI primitives via shadcn CLI (see memory).
- **Phase 2 — Depth** ⬜
  - Conjugations, CEFR, multiple senses, difficulty ordering, highlighting; broaden languages
- **Phase 3 — Cloze quizzes** ⬜
  - Quizzes from stored examples (reuses existing XP/streak/badge engine)
- **Phase 4 — Paywall** ⬜
  - 50-word gate enforced server-side in `createWord`; Lemon Squeezy checkout + webhook flips `User.plan`

## Current tech stack (post-Phase 0)

- Next.js 16.2.4 (Turbopack) + TypeScript + Tailwind v4 + React 19
- Prisma 7.8.0 + Postgres via `@prisma/adapter-pg`
- Supabase Auth via `@supabase/ssr` (email/password + Google OAuth)
- shadcn (base-ui primitives) — `components/ui/button.tsx` (variants: primary/secondary/ghost/success; sizes default/sm/lg/icon)
- next-themes (warm terracotta/parchment palette; Fraunces display + Nunito body)
- PostHog (`posthog-js` / `posthog-node`)

## Key gotchas (this repo is non-standard — see AGENTS.md)

- **Next.js 16:** `middleware.ts` → **`proxy.ts`** (default export `proxy`). `params`/`searchParams` are Promises (await them). `useSearchParams()` needs `<Suspense>`.
- **Prisma 7:** generator is `prisma-client` (not `-js`), `output = "../app/generated/prisma"`, import from `@/app/generated/prisma/client`. Must pass a driver adapter to `new PrismaClient()`.
- **`prisma db push` does NOT auto-run `prisma generate`** — run generate separately after schema changes.
- **Supabase pooler + node-postgres TLS:** the pooler presents a self-signed chain. `lib/prisma.ts` strips `sslmode` from the URL and sets `ssl: { rejectUnauthorized: false }`. (Production: pin Supabase's CA.) `.env` keeps `sslmode=require` for the Prisma CLI, which handles the cert fine.
- The Prisma client is cached on `globalForPrisma` across HMR — restart the dev server after changing `lib/prisma.ts`.

## Auth architecture map

- `lib/supabase/server.ts` / `client.ts` — SSR + browser Supabase clients
- `proxy.ts` (root) — refreshes the auth cookie on every request
- `lib/dal.ts` — `getAuthUser()` (raw), `getCurrentUser()` (upserts a `User` profile keyed by the Supabase auth UID), `requireUserId()` (throws if unauthed)
- `app/auth/callback/route.ts` — OAuth / email-confirmation code exchange
- `app/actions/auth.ts` — `signOut` server action
- Server actions (`words.ts`, `quiz.ts`, `languages.ts`) import `requireUserId as requireUser` from the DAL
- `app/(app)/layout.tsx` redirects unauthed → `/sign-in`; passes `user` to `<Nav>`

## Environment (`.env`, gitignored)

- `DATABASE_URL` / `DIRECT_URL` — Supabase **session pooler** (5432) for dev (both). Prod: switch DATABASE_URL to transaction pooler (6543) + `?pgbouncer=true`.
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (new `sb_publishable_…` format)
- `NEXT_PUBLIC_POSTHOG_KEY` (must be the `phc_…` **project** key), `NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com`
- Google OAuth client ID/secret live in the **Supabase dashboard**, not in env.
- `.env.local` still has dead NextAuth vars (`NEXTAUTH_*`, empty `GOOGLE_*`) — safe to delete.

## Supabase dashboard config (done during Phase 0)

- Auth → Providers → Email: "Confirm email" off (instant dev login)
- Auth → Providers → Google: enabled with the OAuth client
- Google Cloud Console redirect URI: `https://yfcmexnqxaxiingzfjof.supabase.co/auth/v1/callback`
- Auth → URL Configuration: Site URL `http://localhost:3000`, Redirect URLs `http://localhost:3000/**`

## Working conventions

- **Work on `main` only — no version control / commits for now** (per user, current preference).
- Read `node_modules/next/dist/docs/` before writing framework code (Next here is non-standard).
- Throwaway spike lives in `scripts/spike-enrichment.mjs` (+ `SPIKE-NOTES.md`) — delete once Phase 1 absorbs it.
