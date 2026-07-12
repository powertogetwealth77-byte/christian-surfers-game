begin;

create or replace function public.claim_next_processing_job(p_worker_id text)
returns public.processing_jobs
language plpgsql
security definer
set search_path=public
as $$
declare v_job public.processing_jobs;
begin
  select * into v_job
  from public.processing_jobs
  where status in ('queued','retrying')
    and attempt_count < maximum_attempts
  order by created_at