# MindTrace v2 — Antigravity transfer

## Included

- React/Vite/TypeScript application currently used in Antigravity.
- Supabase Auth, private PDF Storage, document library and in-browser PDF reader.
- Per-page notes and highlights with RLS.
- Colored ink drawing overlay with brush size, undo, clear and persistent strokes.
- Contextual AI Q&A from highlighted text.
- “Ask AI” action from an existing saved note.
- Groq-powered AI through authenticated Supabase Edge Functions; no provider key in the browser.
- Document-level AI overview: summary, key points with page references, simple explanations, terms and review questions.
- Reflection, review and knowledge features from the Antigravity branch.
- Original product, design and development documents.

## Important fixes already applied

- Supabase configuration is loaded from `.env.local` instead of hard-coded browser values.
- Private PDFs are downloaded as authenticated blobs and rendered inside MindTrace.
- Reader no longer opens PDFs in another browser page.
- Supabase tables, Storage and AI records use authenticated ownership policies.
- AI errors expose actionable causes: invalid key, missing key, free-tier rate limit and provider errors.
- OpenAI credit dependency was removed; Groq is the active provider.
- Failed AI questions are preserved for retry.
- PDF drawing coordinates are normalized so strokes scale with zoom.

## Local setup

1. Install Node.js and pnpm.
2. Run `pnpm install`.
3. Copy `.env.example` to `.env.local`.
4. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
5. Run `pnpm dev`.

Never commit `.env.local`.

## Supabase

Project used during development: `eviwpspkoathiezysmnf`.

Applied database features are represented in `supabase/migrations`:

- private documents and Storage policies;
- reader annotations;
- ink and AI messages;
- document insights.

Deployed Edge Functions are in `supabase/functions`:

- `ask-document` — highlighted passage Q&A;
- `analyze-document` — document overview generation.

Required Supabase Edge Function secret:

- `GROQ_API_KEY`: the Groq key beginning with `gsk_`.

Optional secret:

- `GROQ_MODEL`: defaults to `openai/gpt-oss-20b`.

Do not place either secret in frontend environment files.

## Privacy boundary

- Q&A sends only the highlighted passage and user question to Groq.
- Document analysis extracts text page-by-page in the browser and sends text excerpts, not the original PDF file.
- The first implementation caps analysis input at approximately 24,000 characters to stay within free-tier limits.
- AI history and document insights are stored in Supabase under the authenticated user’s RLS policies.
- For stricter privacy, enable Zero Data Retention in Groq Data Controls.

## Verification completed before transfer

- TypeScript check passed.
- 22 Vitest tests passed.
- Vite production build passed.

## Recommended next work

1. Add OCR for scanned/image-only PDFs.
2. Replace the 24,000-character cap with map/reduce chunk summarization.
3. Add embeddings and retrieval so whole-document Q&A cites the most relevant pages.
4. Add deletion/export controls for AI history and derived insights.
5. Add streaming answers and retry/backoff for Groq free-tier rate limits.
6. Code-split PDF.js to reduce the initial JavaScript bundle.
