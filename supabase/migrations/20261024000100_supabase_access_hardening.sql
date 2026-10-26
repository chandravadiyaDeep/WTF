-- Tighten client write grants and validate dataset version metadata before a
-- development project receives real user data. This follows the SaaS foundation
-- migration so an already-linked project can apply it as a new migration.

revoke all on public.profiles from anon;
revoke insert, update, delete on public.profiles from authenticated;
grant select on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;

revoke all on public.workspaces from anon;
revoke insert, update, delete on public.workspaces from authenticated;
grant select on public.workspaces to authenticated;
grant update (name) on public.workspaces to authenticated;

revoke all on public.workspace_members from anon;
revoke insert, update, delete on public.workspace_members from authenticated;
grant select on public.workspace_members to authenticated;

revoke all on public.datasets from anon;
revoke update, delete on public.datasets from authenticated;
grant select, insert on public.datasets to authenticated;

revoke all on public.dataset_versions from anon;
revoke insert, update, delete on public.dataset_versions from authenticated;
grant select on public.dataset_versions to authenticated;

revoke all on public.processing_jobs from anon;
revoke update, delete on public.processing_jobs from authenticated;
grant select, insert on public.processing_jobs to authenticated;

revoke all on public.findings from anon;
revoke insert, update, delete on public.findings from authenticated;
grant select on public.findings to authenticated;

drop policy if exists datasets_insert_editor on public.datasets;
create policy datasets_insert_editor on public.datasets
for insert to authenticated
with check (
  created_by = (select auth.uid())
  and current_version_number = 0
  and status = 'uploading'
  and source_object_key = workspace_id::text || '/' || id::text || '/source.csv'
  and sha256 is null
  and row_count is null
  and column_count is null
  and profile = '{}'::jsonb
  and public.has_workspace_role(workspace_id, array['owner','admin','editor']::public.workspace_role[])
);

drop policy if exists jobs_insert_editor on public.processing_jobs;
create policy jobs_insert_editor on public.processing_jobs
for insert to authenticated
with check (
  requested_by = (select auth.uid())
  and status = 'queued'
  and progress = 0
  and result is null
  and error_code is null
  and started_at is null
  and finished_at is null
  and public.has_workspace_role(workspace_id, array['owner','admin','editor']::public.workspace_role[])
);

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
  current_status public.dataset_status;
  current_source_key text;
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
  if p_sha256 !~ '^[0-9a-f]{64}$' or p_row_count < 0 or p_row_count > 20000
    or p_column_count < 1 or p_column_count > 80 or p_byte_size < 1 or p_byte_size > 10485760 then
    raise check_violation using message = 'Dataset version exceeds a configured limit.';
  end if;
  if pg_catalog.jsonb_typeof(p_schema_snapshot) <> 'array' then
    raise check_violation using message = 'Dataset schema summary must be an array.';
  end if;
  if pg_catalog.jsonb_array_length(p_schema_snapshot) <> p_column_count
    or pg_catalog.octet_length(p_schema_snapshot::text) > 65536 then
    raise check_violation using message = 'Dataset schema summary is malformed or too large.';
  end if;
  if exists (
    select 1
    from pg_catalog.jsonb_array_elements(p_schema_snapshot) as item(column_data)
    where pg_catalog.jsonb_typeof(item.column_data) <> 'object'
      or case when pg_catalog.jsonb_typeof(item.column_data) = 'object'
        then pg_catalog.jsonb_object_length(item.column_data) <> 4 else true end
      or not (item.column_data ?& array['name','type','missing','unique'])
      or pg_catalog.jsonb_typeof(item.column_data -> 'name') <> 'string'
      or pg_catalog.char_length(item.column_data ->> 'name') not between 1 and 500
      or item.column_data ->> 'type' not in ('number','boolean','date','text')
      or pg_catalog.jsonb_typeof(item.column_data -> 'missing') <> 'number'
      or (item.column_data ->> 'missing') !~ '^(0|[1-9][0-9]{0,4})$'
      or case when (item.column_data ->> 'missing') ~ '^(0|[1-9][0-9]{0,4})$'
        then (item.column_data ->> 'missing')::integer > p_row_count else true end
      or pg_catalog.jsonb_typeof(item.column_data -> 'unique') <> 'number'
      or (item.column_data ->> 'unique') !~ '^(0|[1-9][0-9]{0,4})$'
      or case when (item.column_data ->> 'unique') ~ '^(0|[1-9][0-9]{0,4})$'
        then (item.column_data ->> 'unique')::integer > p_row_count else true end
  ) then
    raise check_violation using message = 'Dataset schema summary contains invalid or private fields.';
  end if;

  select d.current_version_number, d.status, d.source_object_key
    into current_number, current_status, current_source_key
  from public.datasets d
  where d.workspace_id = p_workspace_id and d.id = p_dataset_id
  for update;
  if not found then raise no_data_found using message = 'Dataset not found in this workspace.'; end if;

  next_number := current_number + 1;
  if next_number = 1 then
    if current_status <> 'uploading'
      or current_source_key is distinct from (p_workspace_id::text || '/' || p_dataset_id::text || '/source.csv')
      or p_object_key is distinct from current_source_key then
      raise check_violation using message = 'Dataset is not awaiting its initial source version.';
    end if;
  else
    if current_status <> 'ready'
      or p_object_key is distinct from (p_workspace_id::text || '/' || p_dataset_id::text || '/versions/v' || next_number::text || '.csv') then
      raise check_violation using message = 'Invalid dataset version state or object key.';
    end if;
  end if;
  if not exists (select 1 from storage.objects o where o.bucket_id = 'numpa-private' and o.name = p_object_key) then
    raise no_data_found using message = 'Private dataset object was not uploaded.';
  end if;

  if current_number > 0 then
    select v.id into parent_id from public.dataset_versions v
    where v.workspace_id = p_workspace_id and v.dataset_id = p_dataset_id and v.version_number = current_number;
    if not found then raise check_violation using message = 'Previous dataset version is missing.'; end if;
  end if;
  insert into public.dataset_versions(workspace_id, dataset_id, version_number, parent_version_id, object_key, sha256, schema_snapshot, row_count, column_count, created_by)
  values (p_workspace_id, p_dataset_id, next_number, parent_id, p_object_key, p_sha256, p_schema_snapshot, p_row_count, p_column_count, (select auth.uid()))
  returning id into created_version_id;

  update public.datasets set status = 'ready', current_version_number = next_number,
    sha256 = p_sha256, row_count = p_row_count, column_count = p_column_count,
    byte_size = p_byte_size, profile = pg_catalog.jsonb_build_object('columns', p_schema_snapshot)
  where workspace_id = p_workspace_id and id = p_dataset_id;
  return query select created_version_id, next_number;
end;
$$;

revoke all on function public.create_dataset_version(uuid, uuid, text, text, jsonb, integer, integer, bigint) from public, anon;
grant execute on function public.create_dataset_version(uuid, uuid, text, text, jsonb, integer, integer, bigint) to authenticated;

