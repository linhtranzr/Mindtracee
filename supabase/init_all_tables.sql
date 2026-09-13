-- ========================================================
-- MINTRACE V2 - FULL DATABASE & STORAGE INITIALIZATION SQL
-- Copy and paste this complete script into Supabase Dashboard -> SQL Editor -> Run
-- ========================================================

-- 1. DOCUMENTS TABLE
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 300),
  storage_path text not null unique,
  file_size bigint not null check (file_size > 0 and file_size <= 52428800),
  mime_type text not null default 'application/pdf' check (mime_type = 'application/pdf'),
  status text not null default 'ready' check (status in ('uploading', 'processing', 'ready', 'error')),
  progress real not null default 0 check (progress >= 0 and progress <= 1),
  current_location jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint documents_path_belongs_to_user check (split_part(storage_path, '/', 1) = user_id::text)
);

create index if not exists documents_user_created_idx on public.documents (user_id, created_at desc);
alter table public.documents enable row level security;
revoke all on table public.documents from anon;
grant select, insert, update, delete on table public.documents to authenticated;

drop policy if exists "Users can read their own documents" on public.documents;
create policy "Users can read their own documents" on public.documents for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own documents" on public.documents;
create policy "Users can insert their own documents" on public.documents for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own documents" on public.documents;
create policy "Users can update their own documents" on public.documents for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own documents" on public.documents;
create policy "Users can delete their own documents" on public.documents for delete to authenticated using ((select auth.uid()) = user_id);


-- 2. PRIVATE STORAGE BUCKET FOR DOCUMENTS
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('documents', 'documents', false, 52428800, array['application/pdf'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can upload PDFs to their own folder" on storage.objects;
create policy "Users can upload PDFs to their own folder" on storage.objects for insert to authenticated
with check (bucket_id = 'documents' and (storage.foldername(name))[1] = (select auth.uid()::text) and lower(storage.extension(name)) = 'pdf');

drop policy if exists "Users can read their own PDFs" on storage.objects;
create policy "Users can read their own PDFs" on storage.objects for select to authenticated
using (bucket_id = 'documents' and owner_id = (select auth.uid()::text) and (storage.foldername(name))[1] = (select auth.uid()::text));

drop policy if exists "Users can delete their own PDFs" on storage.objects;
create policy "Users can delete their own PDFs" on storage.objects for delete to authenticated
using (bucket_id = 'documents' and owner_id = (select auth.uid()::text) and (storage.foldername(name))[1] = (select auth.uid()::text));


-- 3. ANNOTATIONS TABLE
create table if not exists public.annotations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  kind text not null default 'note' check (kind in ('note', 'highlight', 'ink')),
  selected_text text,
  note text check (
    (kind = 'ink' and note is null)
    or (kind in ('note', 'highlight') and note is not null and char_length(note) between 1 and 10000)
  ),
  source_location jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists annotations_document_created_idx on public.annotations (document_id, created_at desc);
create index if not exists annotations_user_idx on public.annotations (user_id);
alter table public.annotations enable row level security;
revoke all on table public.annotations from anon;
grant select, insert, update, delete on table public.annotations to authenticated;

drop policy if exists "Users can read their own annotations" on public.annotations;
create policy "Users can read their own annotations" on public.annotations for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert annotations for their documents" on public.annotations;
create policy "Users can insert annotations for their documents" on public.annotations for insert to authenticated
with check ((select auth.uid()) = user_id and exists (select 1 from public.documents where documents.id = document_id and documents.user_id = (select auth.uid())));

drop policy if exists "Users can update their own annotations" on public.annotations;
create policy "Users can update their own annotations" on public.annotations for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id and exists (select 1 from public.documents where documents.id = document_id and documents.user_id = (select auth.uid())));

drop policy if exists "Users can delete their own annotations" on public.annotations;
create policy "Users can delete their own annotations" on public.annotations for delete to authenticated using ((select auth.uid()) = user_id);


-- 4. LEARNING SESSIONS TABLE
create table if not exists public.learning_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  scope jsonb not null default '{}'::jsonb,
  recall text not null default '',
  reflection jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists learning_sessions_user_created_idx on public.learning_sessions (user_id, created_at desc);
create index if not exists learning_sessions_document_idx on public.learning_sessions (document_id);
alter table public.learning_sessions enable row level security;
revoke all on table public.learning_sessions from anon;
grant select, insert, update, delete on table public.learning_sessions to authenticated;

drop policy if exists "Users can read their own learning sessions" on public.learning_sessions;
create policy "Users can read their own learning sessions" on public.learning_sessions for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert learning sessions for their documents" on public.learning_sessions;
create policy "Users can insert learning sessions for their documents" on public.learning_sessions for insert to authenticated
with check ((select auth.uid()) = user_id and exists (select 1 from public.documents where documents.id = document_id and documents.user_id = (select auth.uid())));

drop policy if exists "Users can update their own learning sessions" on public.learning_sessions;
create policy "Users can update their own learning sessions" on public.learning_sessions for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id and exists (select 1 from public.documents where documents.id = document_id and documents.user_id = (select auth.uid())));

drop policy if exists "Users can delete their own learning sessions" on public.learning_sessions;
create policy "Users can delete their own learning sessions" on public.learning_sessions for delete to authenticated using ((select auth.uid()) = user_id);


-- 5. KNOWLEDGE TOPICS TABLE
create table if not exists public.knowledge_topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  topic_name text not null check (char_length(topic_name) between 1 and 300),
  status text not null default 'exposed' check (status in ('unread', 'exposed', 'forming', 'mastered', 'needs_review')),
  weak_point text,
  next_review timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists knowledge_topics_user_idx on public.knowledge_topics (user_id, updated_at desc);
alter table public.knowledge_topics enable row level security;
revoke all on table public.knowledge_topics from anon;
grant select, insert, update, delete on table public.knowledge_topics to authenticated;

drop policy if exists "Users can read their own knowledge topics" on public.knowledge_topics;
create policy "Users can read their own knowledge topics" on public.knowledge_topics for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own knowledge topics" on public.knowledge_topics;
create policy "Users can insert their own knowledge topics" on public.knowledge_topics for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own knowledge topics" on public.knowledge_topics;
create policy "Users can update their own knowledge topics" on public.knowledge_topics for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own knowledge topics" on public.knowledge_topics;
create policy "Users can delete their own knowledge topics" on public.knowledge_topics for delete to authenticated using ((select auth.uid()) = user_id);


-- 6. TOPIC SOURCES TABLE
create table if not exists public.topic_sources (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.knowledge_topics(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  source_location jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists topic_sources_topic_idx on public.topic_sources (topic_id);
create index if not exists topic_sources_document_idx on public.topic_sources (document_id);
alter table public.topic_sources enable row level security;
revoke all on table public.topic_sources from anon;
grant select, insert, update, delete on table public.topic_sources to authenticated;

drop policy if exists "Users can read topic sources for their topics" on public.topic_sources;
create policy "Users can read topic sources for their topics" on public.topic_sources for select to authenticated
using (exists (select 1 from public.knowledge_topics where knowledge_topics.id = topic_id and knowledge_topics.user_id = (select auth.uid())));

drop policy if exists "Users can insert topic sources for their topics" on public.topic_sources;
create policy "Users can insert topic sources for their topics" on public.topic_sources for insert to authenticated
with check (exists (select 1 from public.knowledge_topics where knowledge_topics.id = topic_id and knowledge_topics.user_id = (select auth.uid())));

drop policy if exists "Users can update topic sources for their topics" on public.topic_sources;
create policy "Users can update topic sources for their topics" on public.topic_sources for update to authenticated
using (exists (select 1 from public.knowledge_topics where knowledge_topics.id = topic_id and knowledge_topics.user_id = (select auth.uid())))
with check (exists (select 1 from public.knowledge_topics where knowledge_topics.id = topic_id and knowledge_topics.user_id = (select auth.uid())));

drop policy if exists "Users can delete topic sources for their topics" on public.topic_sources;
create policy "Users can delete topic sources for their topics" on public.topic_sources for delete to authenticated
using (exists (select 1 from public.knowledge_topics where knowledge_topics.id = topic_id and knowledge_topics.user_id = (select auth.uid())));


-- 7. KNOWLEDGE EVIDENCE TABLE
create table if not exists public.knowledge_evidence (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  topic_id uuid references public.knowledge_topics(id) on delete cascade,
  kind text not null check (kind in ('read', 'highlighted', 'asked_for_help', 'free_recall', 'explained', 'connected', 'applied', 'could_not_recall', 'self_reported_unclear', 'review_recall', 'misconception_corrected')),
  content text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists knowledge_evidence_user_topic_idx on public.knowledge_evidence (user_id, topic_id, created_at desc);
alter table public.knowledge_evidence enable row level security;
revoke all on table public.knowledge_evidence from anon;
grant select, insert, update, delete on table public.knowledge_evidence to authenticated;

drop policy if exists "Users can read their own knowledge evidence" on public.knowledge_evidence;
create policy "Users can read their own knowledge evidence" on public.knowledge_evidence for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own knowledge evidence" on public.knowledge_evidence;
create policy "Users can insert their own knowledge evidence" on public.knowledge_evidence for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own knowledge evidence" on public.knowledge_evidence;
create policy "Users can update their own knowledge evidence" on public.knowledge_evidence for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own knowledge evidence" on public.knowledge_evidence;
create policy "Users can delete their own knowledge evidence" on public.knowledge_evidence for delete to authenticated using ((select auth.uid()) = user_id);


-- 8. REVIEWS TABLE
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  topic_id uuid not null references public.knowledge_topics(id) on delete cascade,
  scheduled_for timestamptz not null default now(),
  status text not null default 'pending' check (status in ('pending', 'completed', 'skipped')),
  recall_input text,
  ai_feedback jsonb not null default '{}'::jsonb,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists reviews_user_scheduled_idx on public.reviews (user_id, scheduled_for, status);
create index if not exists reviews_topic_idx on public.reviews (topic_id);
alter table public.reviews enable row level security;
revoke all on table public.reviews from anon;
grant select, insert, update, delete on table public.reviews to authenticated;

drop policy if exists "Users can read their own reviews" on public.reviews;
create policy "Users can read their own reviews" on public.reviews for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own reviews" on public.reviews;
create policy "Users can insert their own reviews" on public.reviews for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own reviews" on public.reviews;
create policy "Users can update their own reviews" on public.reviews for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own reviews" on public.reviews;
create policy "Users can delete their own reviews" on public.reviews for delete to authenticated using ((select auth.uid()) = user_id);


-- 9. AI MESSAGES TABLE
create table if not exists public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  page_number integer not null check (page_number > 0),
  role text not null check (role in ('user', 'assistant')),
  selected_text text check (selected_text is null or char_length(selected_text) <= 6000),
  content text not null check (char_length(content) between 1 and 12000),
  created_at timestamptz not null default now()
);

create index if not exists ai_messages_document_created_idx on public.ai_messages (document_id, created_at);
create index if not exists ai_messages_user_idx on public.ai_messages (user_id);
alter table public.ai_messages enable row level security;
revoke all on table public.ai_messages from anon;
grant select, insert, delete on table public.ai_messages to authenticated;

drop policy if exists "Users can read their own AI messages" on public.ai_messages;
create policy "Users can read their own AI messages" on public.ai_messages for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert AI messages for their documents" on public.ai_messages;
create policy "Users can insert AI messages for their documents" on public.ai_messages for insert to authenticated
with check ((select auth.uid()) = user_id and exists (select 1 from public.documents where documents.id = document_id and documents.user_id = (select auth.uid())));

drop policy if exists "Users can delete their own AI messages" on public.ai_messages;
create policy "Users can delete their own AI messages" on public.ai_messages for delete to authenticated using ((select auth.uid()) = user_id);


-- 10. DOCUMENT INSIGHTS TABLE
create table if not exists public.document_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  content jsonb not null,
  source_pages integer not null check (source_pages > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, document_id)
);

create index if not exists document_insights_document_idx on public.document_insights(document_id);
alter table public.document_insights enable row level security;
revoke all on public.document_insights from anon;
grant select, insert, update, delete on public.document_insights to authenticated;

drop policy if exists "Users read own document insights" on public.document_insights;
create policy "Users read own document insights" on public.document_insights for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Users insert own document insights" on public.document_insights;
create policy "Users insert own document insights" on public.document_insights for insert to authenticated with check ((select auth.uid()) = user_id and exists(select 1 from public.documents d where d.id = document_id and d.user_id = (select auth.uid())));

drop policy if exists "Users update own document insights" on public.document_insights;
create policy "Users update own document insights" on public.document_insights for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "Users delete own document insights" on public.document_insights;
create policy "Users delete own document insights" on public.document_insights for delete to authenticated using ((select auth.uid()) = user_id);
