begin;

create or replace function public.prepare_source_upload(
  p_project_id uuid,
  p_filename text,
  p_mime_type text,
  p_byte_size bigint
) returns jsonb
language plpgsql
security definer
set search_path=public,storage
as $$
declare
  v_project public.projects;
  v_source_id uuid;
  v_safe_name text;
  v_path text;
begin
  select * into v_project from public.projects where id=p_project_id;
  if v_project.id is null then raise exception 'PROJECT_NOT_FOUND'; end if;
  if not public.has_workspace_role(v_project.workspace_id,array['owner','admin','editor']::public.workspace_role[]) then
    raise exception 'WORKSPACE_ACCESS_DENIED';
  end if;
  if p_byte_size is null or p_byte_size <= 0 or p_byte_size > 2147483648 then raise exception 'FILE_TOO_LARGE'; end if;
  if lower(coalesce(p_mime_type,'')) not in ('video/mp4','video/quicktime','video/x-m4v','video/webm') then raise exception 'INVALID_MEDIA_TYPE'; end if;
  v_safe_name := regexp_replace(lower(coalesce(p_filename,'source.mp4')),'[^a-z0-9._-]+','-','g');
  insert into public.source_videos(project_id,source_type,original_filename,mime_type,byte_size,ingestion_status)
  values(p_project_id,'upload',v_safe_name,p_mime_type,p_byte_size,'pending')
  on conflict(project_id) do update set original_filename=excluded.original_filename,mime_type=excluded.mime_type,byte_size=excluded.byte_size,ingestion_status='pending',updated_at=now()
  returning id into v_source_id;
  v_path := v_project.workspace_id::text||'/'||p_project_id::text||'/'||v_source_id::text||'/'||v_safe_name;
  update public.source_videos set storage_path=v_path where id=v_source_id;
  update public.projects set status='awaiting_upload' where id=p_project_id;
  return jsonb_build_object('sourceVideoId',v_source_id,'bucket','viral-clipz-sources','path',v_path);
end $$;

revoke all on function public.prepare_source_upload(uuid,text,text,bigint) from public;
grant execute on function public.prepare_source_upload(uuid,text,text,bigint) to authenticated;

create or replace function public.complete_source_upload(p_project_id uuid,p_source_video_id uuid)
returns uuid
language plpgsql
security definer
set search_path=public,storage
as $$
declare
  v_project public.projects;
  v_source public.source_videos;
  v_job_id uuid;
begin
  select * into v_project from public.projects where id=p_project_id;
  if v_project.id is null then raise exception 'PROJECT_NOT_FOUND'; end if;
  if not public.has_workspace_role(v_project.workspace_id,array['owner','admin','editor']::public.workspace_role[]) then raise exception 'WORKSPACE_ACCESS_DENIED'; end if;
  select * into v_source from public.source_videos where id=p_source_video_id and project_id=p_project_id;
  if v_source.id is null or v_source.storage_path is null then raise exception 'INVALID_SOURCE'; end if;
  if not exists(select 1 from storage.objects where bucket_id='viral-clipz-sources' and name=v_source.storage_path) then raise exception 'UPLOAD_NOT_FOUND'; end if;
  update public.source_videos set ingestion_status='uploaded',updated_at=now() where id=v_source.id;
  insert into public.processing_jobs(project_id,idempotency_key,input_payload)
  values(p_project_id,'process:'||p_project_id::text,jsonb_build_object('sourceVideoId',v_source.id,'storagePath',v_source.storage_path))
  on conflict(idempotency_key) do update set updated_at=now()
  returning id into v_job_id;
  update public.projects set status='queued',updated_at=now() where id=p_project_id;
  return v_job_id;
end $$;

revoke all on function public.complete_source_upload(uuid,uuid) from public;
grant execute on function public.complete_source_upload(uuid,uuid) to authenticated;

create policy source_objects_insert on storage.objects for insert to authenticated
with check(bucket_id='viral-clipz-sources' and public.has_workspace_role((storage.foldername(name))[1]::uuid,array['owner','admin','editor']::public.workspace_role[]));
create policy source_objects_update on storage.objects for update to authenticated
using(bucket_id='viral-clipz-sources' and public.has_workspace_role((storage.foldername(name))[1]::uuid,array['owner','admin','editor']::public.workspace_role[]))
with check(bucket_id='viral-clipz-sources' and public.has_workspace_role((storage.foldername(name))[1]::uuid,array['owner','admin','editor']::public.workspace_role[]));

commit;
