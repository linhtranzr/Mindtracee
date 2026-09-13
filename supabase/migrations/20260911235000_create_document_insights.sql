create table public.document_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  content jsonb not null,
  source_pages integer not null check (source_pages > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, document_id)
);
create index document_insights_document_idx on public.document_insights(document_id);
alter table public.document_insights enable row level security;
revoke all on public.document_insights from anon;
grant select, insert, update, delete on public.document_insights to authenticated;
create policy "Users read own document insights" on public.document_insights for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users insert own document insights" on public.document_insights for insert to authenticated with check ((select auth.uid()) = user_id and exists(select 1 from public.documents d where d.id = document_id and d.user_id = (select auth.uid())));
create policy "Users update own document insights" on public.document_insights for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users delete own document insights" on public.document_insights for delete to authenticated using ((select auth.uid()) = user_id);
