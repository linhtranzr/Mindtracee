create table public.annotations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  kind text not null default 'note' check (kind in ('note', 'highlight')),
  selected_text text,
  note text not null check (char_length(note) between 1 and 10000),
  source_location jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index annotations_document_created_idx on public.annotations (document_id, created_at desc);
create index annotations_user_idx on public.annotations (user_id);
alter table public.annotations enable row level security;
revoke all on table public.annotations from anon;
grant select, insert, update, delete on table public.annotations to authenticated;

create policy "Users can read their own annotations" on public.annotations for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert annotations for their documents" on public.annotations for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (select 1 from public.documents where documents.id = document_id and documents.user_id = (select auth.uid()))
);

create policy "Users can update their own annotations" on public.annotations for update to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and exists (select 1 from public.documents where documents.id = document_id and documents.user_id = (select auth.uid()))
);

create policy "Users can delete their own annotations" on public.annotations for delete to authenticated
using ((select auth.uid()) = user_id);
