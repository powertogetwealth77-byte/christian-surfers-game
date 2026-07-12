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
