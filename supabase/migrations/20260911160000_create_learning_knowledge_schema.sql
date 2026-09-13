-- Phase 5-7: Learning Sessions, Knowledge Topics, Sources, Evidence, and Reviews

-- 1. learning_sessions
create table public.learning_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  scope jsonb not null default '{}'::jsonb,
  recall text not null default '',
  reflection jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index learning_sessions_user_created_idx on public.learning_sessions (user_id, created_at desc);
create index learning_sessions_document_idx on public.learning_sessions (document_id);
alter table public.learning_sessions enable row level security;
revoke all on table public.learning_sessions from anon;
grant select, insert, update, delete on table public.learning_sessions to authenticated;

create policy "Users can read their own learning sessions" on public.learning_sessions for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert learning sessions for their documents" on public.learning_sessions for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (select 1 from public.documents where documents.id = document_id and documents.user_id = (select auth.uid()))
);

create policy "Users can update their own learning sessions" on public.learning_sessions for update to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and exists (select 1 from public.documents where documents.id = document_id and documents.user_id = (select auth.uid()))
);

create policy "Users can delete their own learning sessions" on public.learning_sessions for delete to authenticated
using ((select auth.uid()) = user_id);


-- 2. knowledge_topics
create table public.knowledge_topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  topic_name text not null check (char_length(topic_name) between 1 and 300),
  status text not null default 'exposed' check (status in ('unread', 'exposed', 'forming', 'mastered', 'needs_review')),
  weak_point text,
  next_review timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index knowledge_topics_user_idx on public.knowledge_topics (user_id, updated_at desc);
alter table public.knowledge_topics enable row level security;
revoke all on table public.knowledge_topics from anon;
grant select, insert, update, delete on table public.knowledge_topics to authenticated;

create policy "Users can read their own knowledge topics" on public.knowledge_topics for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert their own knowledge topics" on public.knowledge_topics for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own knowledge topics" on public.knowledge_topics for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own knowledge topics" on public.knowledge_topics for delete to authenticated
using ((select auth.uid()) = user_id);


-- 3. topic_sources
create table public.topic_sources (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.knowledge_topics(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  source_location jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index topic_sources_topic_idx on public.topic_sources (topic_id);
create index topic_sources_document_idx on public.topic_sources (document_id);
alter table public.topic_sources enable row level security;
revoke all on table public.topic_sources from anon;
grant select, insert, update, delete on table public.topic_sources to authenticated;

create policy "Users can read topic sources for their topics" on public.topic_sources for select to authenticated
using (exists (select 1 from public.knowledge_topics where knowledge_topics.id = topic_id and knowledge_topics.user_id = (select auth.uid())));

create policy "Users can insert topic sources for their topics" on public.topic_sources for insert to authenticated
with check (exists (select 1 from public.knowledge_topics where knowledge_topics.id = topic_id and knowledge_topics.user_id = (select auth.uid())));

create policy "Users can update topic sources for their topics" on public.topic_sources for update to authenticated
using (exists (select 1 from public.knowledge_topics where knowledge_topics.id = topic_id and knowledge_topics.user_id = (select auth.uid())))
with check (exists (select 1 from public.knowledge_topics where knowledge_topics.id = topic_id and knowledge_topics.user_id = (select auth.uid())));

create policy "Users can delete topic sources for their topics" on public.topic_sources for delete to authenticated
using (exists (select 1 from public.knowledge_topics where knowledge_topics.id = topic_id and knowledge_topics.user_id = (select auth.uid())));


-- 4. knowledge_evidence
create table public.knowledge_evidence (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  topic_id uuid references public.knowledge_topics(id) on delete cascade,
  kind text not null check (kind in ('read', 'highlighted', 'asked_for_help', 'free_recall', 'explained', 'connected', 'applied', 'could_not_recall', 'self_reported_unclear', 'review_recall', 'misconception_corrected')),
  content text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index knowledge_evidence_user_topic_idx on public.knowledge_evidence (user_id, topic_id, created_at desc);
alter table public.knowledge_evidence enable row level security;
revoke all on table public.knowledge_evidence from anon;
grant select, insert, update, delete on table public.knowledge_evidence to authenticated;

create policy "Users can read their own knowledge evidence" on public.knowledge_evidence for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert their own knowledge evidence" on public.knowledge_evidence for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own knowledge evidence" on public.knowledge_evidence for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own knowledge evidence" on public.knowledge_evidence for delete to authenticated
using ((select auth.uid()) = user_id);


-- 5. reviews
create table public.reviews (
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

create index reviews_user_scheduled_idx on public.reviews (user_id, scheduled_for, status);
create index reviews_topic_idx on public.reviews (topic_id);
alter table public.reviews enable row level security;
revoke all on table public.reviews from anon;
grant select, insert, update, delete on table public.reviews to authenticated;

create policy "Users can read their own reviews" on public.reviews for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert their own reviews" on public.reviews for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own reviews" on public.reviews for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own reviews" on public.reviews for delete to authenticated
using ((select auth.uid()) = user_id);
