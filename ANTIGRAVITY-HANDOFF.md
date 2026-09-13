# MindTrace v2 - Antigravity handoff

## Objective

Recreate and continue MindTrace as a responsive personal learning application. The product turns reading into durable understanding through this loop:

`Upload PDF -> Read -> Highlight/Note -> Free Recall -> AI Reflection -> Knowledge Evidence -> Review`

Product direction: **Quiet Reading, Visible Understanding**. The interface should feel calm, book-like, private, and non-judgmental. Do not introduce scores, streaks, leaderboards, a chatbot home, or a decorative knowledge graph.

Read these source-of-truth documents before changing implementation:

1. `docs/mindtrace-v2-project-overview-prd.md`
2. `docs/mindtrace-v2-design-guidelines.md`
3. `docs/mindtrace-v2-development-plan.md`

## Current stack

- Vite 7
- React 19
- TypeScript 5.9
- React Router 7
- Supabase Auth, Postgres, Storage, and RLS
- React-PDF 10.5 / PDF.js 5.4
- Lucide React icons
- Vitest and ESLint
- pnpm with pinned dependencies and lockfile

## Implemented

### Authentication

- Email/password signup.
- Mandatory email confirmation.
- Resend verification.
- Sign in and sign out.
- Persistent/refreshing sessions.
- Forgot-password email and password recovery page.
- Protected app routes; unverified users cannot enter the main app.
- Account Settings shell.
- Generic recovery messaging to reduce account enumeration.

### Library and Storage

- Authenticated PDF upload, maximum 50 MB.
- Private Supabase bucket named `documents`.
- `documents` table with per-account ownership and RLS.
- Library listing, safe file naming, deletion, and recovery messaging.
- Data API grants are explicit because new Supabase projects may not expose tables automatically.

### In-app Reader

- `/reader/:documentId` route; PDF stays inside MindTrace.
- PDF is downloaded as an authenticated Blob before being passed to PDF.js. Do not replace this with a raw signed URL without testing; the signed-URL implementation failed for the existing uploaded PDF.
- Page navigation and zoom.
- Text layer and native PDF links.
- Page progress persisted to `documents.current_location` and `documents.progress`.
- Notes panel beside the document.
- Selecting PDF text captures a source excerpt for a note.
- Notes are linked to page number and persisted in `annotations`.
- Per-account RLS for all annotations.
- Responsive reader and notes drawer on smaller screens.

### App shells/placeholders

- Today.
- Library.
- Knowledge Map placeholder.
- Settings placeholder.
- Desktop sidebar and mobile bottom navigation.

## Supabase state

The connected development project reference used during implementation was `eviwpspkoathiezysmnf`. Do not hardcode this identifier in product source. Configure the application through environment variables.

Applied migrations:

- `supabase/migrations/20260911093704_create_documents_and_private_storage.sql`
- `supabase/migrations/20260911135534_create_reader_annotations.sql`

The remote project was verified with:

- `public.documents`: RLS enabled.
- `public.annotations`: RLS enabled.
- `documents` Storage bucket: private.
- Document policies: SELECT, INSERT, UPDATE, DELETE ownership checks.
- Storage policies: owner-folder PDF upload, read, and delete.
- Annotation policies: SELECT, INSERT, UPDATE, DELETE with document ownership validation.

Never use a service-role or secret key in the browser. Only use a Supabase publishable key in `VITE_SUPABASE_PUBLISHABLE_KEY`.

## Local environment

Create `.env.local` from `.env.example`:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
```

Required Auth settings:

- Email provider enabled.
- New signup enabled.
- Confirm email enabled.
- Anonymous sign-in disabled.
- Site URL: `http://127.0.0.1:5173`
- Redirect URL: `http://127.0.0.1:5173/auth/callback`
- Redirect URL: `http://127.0.0.1:5173/reset-password`

Run:

```bash
pnpm install
pnpm dev
```

Windows users in the original Codex environment can double-click `start.bat`.

## Verification baseline

The last completed validation passed:

- ESLint.
- TypeScript typecheck.
- 7 Vitest tests.
- Vite production build.
- The original uploaded PDF was inspected as a valid, unencrypted PDF 1.4 document with 8 pages.

Commands:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Known considerations

- The PDF worker is bundled locally through `pdfjs-dist`; keep the worker version aligned with React-PDF.
- PDF bundle size is large. Prefer lazy-loading the Reader route in a later optimization.
- Current Reader displays one page at a time. Page thumbnails and continuous scrolling are not implemented.
- Notes work, but persistent geometric highlight overlays are not yet implemented.
- Supabase advisor reported leaked-password protection disabled. Enable it before production if the project plan supports the feature.
- The two annotation indexes are currently reported as unused because the table is new; do not remove them based solely on that early signal.
- Built-in Supabase email delivery is development-only and heavily rate-limited. Configure custom SMTP before production.
- Account deletion remains disabled until retention/backup semantics are approved.

## Next implementation order

Follow `docs/mindtrace-v2-development-plan.md`:

1. Finish Reader annotations: persistent highlight geometry/source anchors and reload tests.
2. Add Reader recovery states and integration tests for another account attempting access.
3. Implement contextual AI through a server-side/Edge Function boundary; no LLM key in the client.
4. Implement Reflection, persisting recall before any AI request.
5. Implement topics, sources, append-only knowledge evidence, and deterministic state transitions.
6. Implement review scheduling and append-only review evidence.
7. Implement account deletion only after retention and backup policy approval.
8. Complete accessibility, mobile, reliability, and instrumentation acceptance criteria.

## Non-negotiable security rules

- The authenticated user ID is the ownership root.
- Never trust a client-supplied user ID when server/auth context exists.
- Keep every document private.
- Enable RLS on every exposed user-owned table.
- UPDATE policies require both `USING` and `WITH CHECK`.
- AI errors must never erase user input.
- Evidence/history is append-only; do not overwrite history.
- Do not log passwords, tokens, raw book content, notes, or recalls.

## Prompt for Antigravity

Use this prompt after attaching the handoff archive:

> Read `ANTIGRAVITY-HANDOFF.md` and all files under `docs/` before making changes. Recreate MindTrace from the included source code while preserving its current Supabase schema, RLS ownership model, private Storage model, Auth contract, in-app Blob-based PDF Reader, visual tokens, and Vietnamese UX copy. Run lint, typecheck, tests, and production build after every implementation phase. Do not add features outside the approved PRD. Continue from the next implementation order in the handoff rather than rebuilding completed behavior blindly.
