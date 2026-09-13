create table public.documents (
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

create index documents_user_created_idx on public.documents (user_id, created_at desc);
alter table public.documents enable row level security;
revoke all on table public.documents from anon;
grant select, insert, update, delete on table public.documents to authenticated;

create policy "Users can read their own documents" on public.documents for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can insert their own documents" on public.documents for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update their own documents" on public.documents for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete their own documents" on public.documents for delete to authenticated using ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('documents', 'documents', false, 52428800, array['application/pdf'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "Users can upload PDFs to their own folder" on storage.objects for insert to authenticated
with check (bucket_id = 'documents' and (storage.foldername(name))[1] = (select auth.uid()::text) and lower(storage.extension(name)) = 'pdf');

create policy "Users can read their own PDFs" on storage.objects for select to authenticated
using (bucket_id = 'documents' and owner_id = (select auth.uid()::text) and (storage.foldername(name))[1] = (select auth.uid()::text));

create policy "Users can delete their own PDFs" on storage.objects for delete to authenticated
using (bucket_id = 'documents' and owner_id = (select auth.uid()::text) and (storage.foldername(name))[1] = (select auth.uid()::text));
