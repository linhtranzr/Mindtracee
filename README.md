# MindTrace v2

Phase 0–1 implementation of the MindTrace MVP: responsive React/TypeScript UI with Supabase email/password authentication, mandatory email verification, persistent sessions, password recovery, protected routes, and an account settings shell.

## Run locally

### Cách nhanh nhất trên Windows

Nhấp đúp `start.bat`. Launcher sẽ tự tìm Node.js đi kèm Codex, khởi động máy chủ ở `http://127.0.0.1:5173`, rồi mở trình duyệt. Không mở trực tiếp `index.html` vì đây là ứng dụng Vite và cần chạy qua local server.

### Chạy từ terminal

1. Copy `.env.example` to `.env.local` and add the project URL and **publishable** key.
2. In Supabase Auth, enable **Confirm email**.
3. Add these redirect URLs (adjust the port if Vite chooses another one):
   - `http://localhost:5173/auth/callback`
   - `http://localhost:5173/reset-password`
4. Install and run:

```bash
pnpm install
pnpm dev
```

Never put a secret/service-role key in a `VITE_*` variable. Browser variables are public.

## Commands

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Current scope

- Complete Phase 1 auth UI and Supabase client integration.
- Protected app shell with Today, Library, Knowledge Map, and Settings placeholders.
- Account deletion intentionally disabled until retention/backup semantics are approved.
- Phase 2 document foundation: private PDF upload, per-account document rows, RLS, library listing, signed opening links, and deletion.
- In-app PDF Reader powered by PDF.js: page navigation, zoom, text selection, page-linked notes, reading progress, and per-account annotation persistence.

## Apply the Phase 2 database migration

Open Supabase Dashboard → SQL Editor, paste the complete contents of `supabase/migrations/20260911093704_create_documents_and_private_storage.sql`, then click **Run** once. This creates the `documents` table, a private `documents` bucket, explicit Data API grants, and ownership policies. Never make the bucket public.

The Reader also requires `supabase/migrations/20260911135534_create_reader_annotations.sql`. It creates the private, RLS-protected `annotations` table. In the connected development project, both migrations have already been applied.
