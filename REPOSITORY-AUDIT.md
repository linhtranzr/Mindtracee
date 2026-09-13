# MindTrace v2 — Repository audit

## Discovery result

- The workspace is a multi-project repository with unrelated static/Vite apps.
- No existing MindTrace v2 application, Supabase project reference, migrations, PDF renderer, AI provider, test setup, or deployment configuration was found.
- `mindtrace-slides/` contains only a presentation HTML file and is not an application foundation.
- Greenfield approach selected: Vite + React + TypeScript + React Router + Supabase JS.
- Package manager: pnpm. Runtime note: the current shell does not expose `node` or `npm` directly, while pnpm is available.

## Integration map

- Auth: Supabase email/password with confirm-email enabled.
- Session: browser session persistence and token refresh through Supabase JS.
- Routing: public auth routes and a verified-user protected app shell.
- Database/storage: not configured; Phase 2 will add migrations, RLS, and a private document bucket.
- PDF renderer/source anchors: open decision for Phase 3.
- AI provider/model: open decision for Phase 4; secrets must remain server-side.
- Deployment: open decision; redirect allowlists must be exact for staging/production.

## Blocking policy decision

Account deletion is not implemented because retention/backup behavior remains explicitly undecided in the approved PRD. The Settings entry is visible but disabled to avoid a misleading or incomplete destructive flow.
