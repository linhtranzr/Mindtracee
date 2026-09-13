alter table public.annotations drop constraint if exists annotations_kind_check;
alter table public.annotations add constraint annotations_kind_check check (kind in ('note', 'highlight', 'ink'));
alter table public.annotations alter column note drop not null;
alter table public.annotations drop constraint if exists annotations_note_check;
alter table public.annotations add constraint annotations_note_check check (
  (kind = 'ink' and note is null)
  or (kind in ('note', 'highlight') and note is not null and char_length(note) between 1 and 10000)
);

create table public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  page_number integer not null check (page_number > 0),
  role text not null check (role in ('user', 'assistant')),
  selected_text text check (selected_text is null or char_length(selected_text) <= 6000),
  content text not null check (char_length(content) between 1 and 12000),
  created_at timestamptz not null default now()
);

create index ai_messages_document_created_idx on public.ai_messages (document_id, created_at);
create index ai_messages_user_idx on public.ai_messages (user_id);
alter table public.ai_messages enable row level security;
revoke all on table public.ai_messages from anon;
grant select, insert, delete on table public.ai_messages to authenticated;

create policy "Users can read their own AI messages" on public.ai_messages for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert AI messages for their documents" on public.ai_messages for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (select 1 from public.documents where documents.id = document_id and documents.user_id = (select auth.uid()))
);

create policy "Users can delete their own AI messages" on public.ai_messages for delete to authenticated
using ((select auth.uid()) = user_id);
