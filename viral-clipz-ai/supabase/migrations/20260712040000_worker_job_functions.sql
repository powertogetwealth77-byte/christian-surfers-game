begin;

create or replace function public.claim_next_processing_job(p_worker_id text)
returns public.processing_jobs
language plpgsql
security definer
set search_path=public
as $$
declare
  v_job_id uuid;
  v_job public.processing_jobs;
begin
  if coalesce(trim(p_worker_id),'')='' then
    raise exception 'WORKER_ID_REQUIRED';
  end if;

  select id into v_job_id
  from public.processing_jobs
  where status in ('queued','retrying')
    and attempt_count < maximum_attempts
  order by created_at
  for update skip locked
  limit 1;

  if v_job_id is null then
    return null;
  end if;

  update public.processing_jobs
  set status='claimed',
      claimed_by=p_worker_id,
      attempt_count=attempt_count+1,
      started_at=coalesce(started_at,now()),
      heartbeat_at=now(),
      error_code=null,
      error_message=null,
      updated_at=now()
  where id=v_job_id
  returning * into v_job;

  return v_job;
end $$;

revoke all on function public.claim_next_processing_job(text) from public;
grant execute on function public.claim_next_processing_job(text) to service_role;

create or replace function public.heartbeat_processing_job(
  p_job_id uuid,
  p_worker_id text,
  p_stage public.job_stage,
  p_progress integer,
  p_message text default null
) returns boolean
language plpgsql
security definer
set search_path=public
as $$
begin
  update public.processing_jobs
  set status='processing',
      current_stage=p_stage,
      progress_percent=greatest(0,least(100,p_progress)),
      heartbeat_at=now(),
      output_payload=jsonb_set(coalesce(output_payload,'{}'::jsonb),'{message}',to_jsonb(coalesce(p_message,replace(p_stage::text,'_',' '))),true),
      updated_at=now()
  where id=p_job_id
    and claimed_by=p_worker_id
    and status in ('claimed','processing','retrying');
  return found;
end $$;

revoke all on function public.heartbeat_processing_job(uuid,text,public.job_stage,integer,text) from public;
grant execute on function public.heartbeat_processing_job(uuid,text,public.job_stage,integer,text) to service_role;

commit;
