-- NUMPA SaaS foundation. Apply with Supabase CLI or SQL Editor.
-- Private file bytes are optional; browser-only datasets do not need database rows.

create extension if not exists pgcrypto with schema extensions;

do $$ begin
  create type public.workspace_role as enum ('owner', 'admin', 'editor', 'viewer');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.dataset_status as enum ('uploading', 'ready', 'failed', 'deleting');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.job_status as enum ('queued', 'running', 'succeeded', 'failed', 'cancelled');
exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (display_name is null or char_length(display_name) <= 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 100),
  owner_id uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (id, owner_id)
);

create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.workspace_role not null default 'viewer',
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table if not exists public.datasets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  name text not null check (char_length(name) between 1 and 160),
  source_filename text not null check (char_length(source_filename) between 1 and 255),
  media_type text not null default 'text/csv' check (media_type = 'text/csv'),
  byte_size bigint not null check (byte_size between 1 and 10485760),
  status public.dataset_status not null default 'uploading',
  source_object_key text,
  current_version_number integer not null default 0 check (current_version_number >= 0),
  sha256 text check (sha256 is null or sha256 ~ '^[0-9a-f]{64}$'),
  row_count integer check (row_count is null or row_count between 0 and 20000),
  column_count integer check (column_count is null or column_count between 0 and 80),
  profile jsonb not null default '{}'::jsonb check (jsonb_typeof(profile) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, id),
  check (source_object_key is null or source_object_key = workspace_id::text || '/' || id::text || '/source.csv')
);

create table if not exists public.dataset_versions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  dataset_id uuid not null,
  version_number integer not null check (version_number > 0),
  parent_version_id uuid,
  object_key text not null,
  sha256 text not null check (sha256 ~ '^[0-9a-f]{64}$'),
  schema_snapshot jsonb not null default '[]'::jsonb check (jsonb_typeof(schema_snapshot) = 'array'),
  row_count integer not null check (row_count between 0 and 20000),
  column_count integer not null check (column_count between 1 and 80),
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (workspace_id, id),
  unique (workspace_id, dataset_id, version_number),
  check (object_key = case when version_number = 1
    then workspace_id::text || '/' || dataset_id::text || '/source.csv'
    else workspace_id::text || '/' || dataset_id::text || '/versions/v' || version_number::text || '.csv' end),
  foreign key (workspace_id, dataset_id) references public.datasets(workspace_id, id) on delete cascade,
  foreign key (workspace_id, parent_version_id) references public.dataset_versions(workspace_id, id) on delete restrict
);

create table if not exists public.processing_jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  dataset_id uuid not null,
  dataset_version_id uuid,
  requested_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  kind text not null check (kind in ('profile', 'clean_preview', 'clean_apply', 'export')),
  status public.job_status not null default 'queued',
  progress smallint not null default 0 check (progress between 0 and 100),
  idempotency_key text not null check (char_length(idempotency_key) between 16 and 128),
  config jsonb not null default '{}'::jsonb check (jsonb_typeof(config) = 'object'),
  result jsonb check (result is null or jsonb_typeof(result) = 'object'),
  error_code text check (error_code is null or char_length(error_code) <= 80),
  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz,
  unique (workspace_id, idempotency_key),
  unique (workspace_id, id),
  foreign key (workspace_id, dataset_id) references public.datasets(workspace_id, id) on delete cascade,
  foreign key (workspace_id, dataset_version_id) references public.dataset_versions(workspace_id, id) on delete restrict
);

create table if not exists public.findings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  dataset_id uuid not null,
  job_id uuid,
  code text not null check (char_length(code) between 1 and 80),
  severity text not null check (severity in ('blocker', 'warning', 'info', 'positive')),
  summary text not null check (char_length(summary) between 1 and 500),
  evidence jsonb not null default '{}'::jsonb check (jsonb_typeof(evidence) = 'object'),
  created_at timestamptz not null default now(),
  foreign key (workspace_id, dataset_id) references public.datasets(workspace_id, id) on delete cascade,
  foreign key (workspace_id, job_id) references public.processing_jobs(workspace_id, id) on delete cascade
);

create index if not exists workspace_members_user_idx on public.workspace_members(user_id, workspace_id);
create index if not exists datasets_workspace_updated_idx on public.datasets(workspace_id, updated_at desc);
create index if not exists processing_jobs_workspace_status_idx on public.processing_jobs(workspace_id, status, created_at desc);
create index if not exists findings_dataset_idx on public.findings(workspace_id, dataset_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
drop trigger if exists workspaces_set_updated_at on public.workspaces;
create trigger workspaces_set_updated_at before update on public.workspaces for each row execute function public.set_updated_at();
drop trigger if exists datasets_set_updated_at on public.datasets;
create trigger datasets_set_updated_at before update on public.datasets for each row execute function public.set_updated_at();

create or replace function public.has_workspace_role(target_workspace uuid, allowed_roles public.workspace_role[])
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.workspace_members m
    where m.workspace_id = target_workspace
      and m.user_id = (select auth.uid())
      and m.role = any(allowed_roles)
  );
$$;

create or replace function public.can_access_dataset_object(object_name text, write_access boolean default false)
returns boolean
language plpgsql stable security definer
set search_path = ''
as $$
declare
  target_workspace uuid;
  target_dataset uuid;
  target_version integer;
begin
  if array_length(string_to_array(object_name, '/'), 1) not in (3, 4) then return false; end if;
  if array_length(string_to_array(object_name, '/'), 1) = 3 and split_part(object_name, '/', 3) <> 'source.csv' then return false; end if;
  if array_length(string_to_array(object_name, '/'), 1) = 4 and (split_part(object_name, '/', 3) <> 'versions' or split_part(object_name, '/', 4) !~ '^v([2-9]|[1-9][0-9]+)[.]csv$') then return false; end if;
  begin
    target_workspace := split_part(object_name, '/', 1)::uuid;
    target_dataset := split_part(object_name, '/', 2)::uuid;
    if array_length(string_to_array(object_name, '/'), 1) = 4 then
      target_version := substring(split_part(object_name, '/', 4) from '^v([0-9]+)[.]csv$')::integer;
    end if;
  exception when invalid_text_representation then
    return false;
  when numeric_value_out_of_range then
    return false;
  end;
  return exists (
    select 1 from public.datasets d
    join public.workspace_members m on m.workspace_id = d.workspace_id
    where d.workspace_id = target_workspace
      and d.id = target_dataset
      and m.user_id = (select auth.uid())
      and (not write_access or (
        m.role in ('owner', 'admin', 'editor')
        and ((array_length(string_to_array(object_name, '/'), 1) = 3 and d.current_version_number = 0 and d.status = 'uploading')
          or (array_length(string_to_array(object_name, '/'), 1) = 4 and target_version = d.current_version_number + 1))
      ))
  );
end;
$$;

create or replace function public.fail_dataset_upload(p_workspace_id uuid, p_dataset_id uuid)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  if not public.has_workspace_role(p_workspace_id, array['owner','admin','editor']::public.workspace_role[]) then
    raise insufficient_privilege;
  end if;
  update public.datasets set status = 'failed', source_object_key = null
  where workspace_id = p_workspace_id and id = p_dataset_id
    and created_by = (select auth.uid()) and current_version_number = 0 and status = 'uploading';
  if not found then raise no_data_found using message = 'Pending dataset upload not found.'; end if;
end;
$$;

create or replace function public.create_dataset_version(
  p_workspace_id uuid,
  p_dataset_id uuid,
  p_object_key text,
  p_sha256 text,
  p_schema_snapshot jsonb,
  p_row_count integer,
  p_column_count integer,
  p_byte_size bigint
)
returns table(version_id uuid, version_number integer)
language plpgsql security definer
set search_path = ''
as $$
declare
  current_number integer;
  next_number integer;
  parent_id uuid;
  created_version_id uuid;
begin
  if p_workspace_id is null or p_dataset_id is null or p_object_key is null or p_sha256 is null
    or p_schema_snapshot is null or p_row_count is null or p_column_count is null or p_byte_size is null then
    raise check_violation using message = 'Dataset version metadata is incomplete.';
  end if;
  if not public.has_workspace_role(p_workspace_id, array['owner','admin','editor']::public.workspace_role[]) then
    raise insufficient_privilege;
  end if;
  if p_sha256 !~ '^[0-9a-f]{64}$' or jsonb_typeof(p_schema_snapshot) <> 'array'
    or p_row_count < 0 or p_row_count > 20000 or p_column_count < 1 or p_column_count > 80
    or p_byte_size < 1 or p_byte_size > 10485760 then
    raise check_violation using message = 'Dataset version exceeds a configured limit.';
  end if;
  select d.current_version_number into current_number
  from public.datasets d
  where d.workspace_id = p_workspace_id and d.id = p_dataset_id
  for update;
  if not found then raise no_data_found using message = 'Dataset not found in this workspace.'; end if;

  next_number := current_number + 1;
  if next_number = 1 and p_object_key <> p_workspace_id::text || '/' || p_dataset_id::text || '/source.csv' then
    raise check_violation using message = 'Invalid source object key.';
  elsif next_number > 1 and p_object_key <> p_workspace_id::text || '/' || p_dataset_id::text || '/versions/v' || next_number::text || '.csv' then
    raise check_violation using message = 'Invalid version object key.';
  end if;
  if not exists (select 1 from storage.objects o where o.bucket_id = 'numpa-private' and o.name = p_object_key) then
    raise no_data_found using message = 'Private dataset object was not uploaded.';
  end if;

  if current_number > 0 then
    select v.id into parent_id from public.dataset_versions v
    where v.workspace_id = p_workspace_id and v.dataset_id = p_dataset_id and v.version_number = current_number;
  end if;
  insert into public.dataset_versions(workspace_id, dataset_id, version_number, parent_version_id, object_key, sha256, schema_snapshot, row_count, column_count, created_by)
  values (p_workspace_id, p_dataset_id, next_number, parent_id, p_object_key, p_sha256, p_schema_snapshot, p_row_count, p_column_count, (select auth.uid()))
  returning id into created_version_id;

  update public.datasets set status = 'ready', current_version_number = next_number,
    sha256 = p_sha256, row_count = p_row_count, column_count = p_column_count,
    byte_size = p_byte_size, profile = jsonb_build_object('columns', p_schema_snapshot)
  where workspace_id = p_workspace_id and id = p_dataset_id;
  return query select created_version_id, next_number;
end;
$$;

revoke all on function public.has_workspace_role(uuid, public.workspace_role[]) from public, anon;
revoke all on function public.can_access_dataset_object(text, boolean) from public, anon;
revoke all on function public.fail_dataset_upload(uuid, uuid) from public, anon;
grant execute on function public.has_workspace_role(uuid, public.workspace_role[]) to authenticated;
grant execute on function public.can_access_dataset_object(text, boolean) to authenticated;
grant execute on function public.fail_dataset_upload(uuid, uuid) to authenticated;
revoke all on function public.create_dataset_version(uuid, uuid, text, text, jsonb, integer, integer, bigint) from public, anon;
grant execute on function public.create_dataset_version(uuid, uuid, text, text, jsonb, integer, integer, bigint) to authenticated;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  new_workspace uuid;
  workspace_name text;
begin
  insert into public.profiles(user_id, display_name)
  values (new.id, nullif(left(coalesce(new.raw_user_meta_data ->> 'display_name', ''), 120), ''))
  on conflict (user_id) do nothing;

  workspace_name := coalesce(nullif(left(new.raw_user_meta_data ->> 'workspace_name', 100), ''), left(coalesce(split_part(new.email, '@', 1), 'Personal') || '''s workspace', 100));
  insert into public.workspaces(name, owner_id) values (workspace_name, new.id) returning id into new_workspace;
  insert into public.workspace_members(workspace_id, user_id, role) values (new_workspace, new.id, 'owner');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_numpa on auth.users;
create trigger on_auth_user_created_numpa
after insert on auth.users
for each row execute procedure public.handle_new_auth_user();

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.datasets enable row level security;
alter table public.dataset_versions enable row level security;
alter table public.processing_jobs enable row level security;
alter table public.findings enable row level security;

create policy profiles_select_self on public.profiles for select to authenticated using (user_id = (select auth.uid()));
create policy profiles_update_self on public.profiles for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy workspaces_select_member on public.workspaces for select to authenticated using (public.has_workspace_role(id, array['owner','admin','editor','viewer']::public.workspace_role[]));
create policy workspaces_update_admin on public.workspaces for update to authenticated using (public.has_workspace_role(id, array['owner','admin']::public.workspace_role[])) with check (public.has_workspace_role(id, array['owner','admin']::public.workspace_role[]));

create policy members_select_member on public.workspace_members for select to authenticated using (public.has_workspace_role(workspace_id, array['owner','admin','editor','viewer']::public.workspace_role[]));

create policy datasets_select_member on public.datasets for select to authenticated using (public.has_workspace_role(workspace_id, array['owner','admin','editor','viewer']::public.workspace_role[]));
create policy datasets_insert_editor on public.datasets for insert to authenticated with check (
  created_by = (select auth.uid()) and current_version_number = 0 and status = 'uploading'
  and sha256 is null and row_count is null and column_count is null and profile = '{}'::jsonb
  and public.has_workspace_role(workspace_id, array['owner','admin','editor']::public.workspace_role[])
);
create policy versions_select_member on public.dataset_versions for select to authenticated using (public.has_workspace_role(workspace_id, array['owner','admin','editor','viewer']::public.workspace_role[]));

create policy jobs_select_member on public.processing_jobs for select to authenticated using (public.has_workspace_role(workspace_id, array['owner','admin','editor','viewer']::public.workspace_role[]));
create policy jobs_insert_editor on public.processing_jobs for insert to authenticated with check (requested_by = (select auth.uid()) and public.has_workspace_role(workspace_id, array['owner','admin','editor']::public.workspace_role[]));

create policy findings_select_member on public.findings for select to authenticated using (public.has_workspace_role(workspace_id, array['owner','admin','editor','viewer']::public.workspace_role[]));

grant select, update on public.profiles to authenticated;
grant select, update on public.workspaces to authenticated;
grant select on public.workspace_members to authenticated;
grant select, insert on public.datasets to authenticated;
grant select on public.dataset_versions to authenticated;
grant select, insert on public.processing_jobs to authenticated;
grant select on public.findings to authenticated;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('numpa-private', 'numpa-private', false, 10485760, array['text/csv', 'application/vnd.ms-excel'])
on conflict (id) do update set public = false, file_size_limit = 10485760, allowed_mime_types = excluded.allowed_mime_types;

create policy numpa_private_read on storage.objects for select to authenticated
using (bucket_id = 'numpa-private' and public.can_access_dataset_object(name, false));
create policy numpa_private_upload on storage.objects for insert to authenticated
with check (bucket_id = 'numpa-private' and public.can_access_dataset_object(name, true));
create policy numpa_private_delete on storage.objects for delete to authenticated
using (bucket_id = 'numpa-private' and public.can_access_dataset_object(name, true));
