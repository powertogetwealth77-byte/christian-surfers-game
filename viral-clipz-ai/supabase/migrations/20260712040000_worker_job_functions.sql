begin;

create or replace function public.claim_next_processing_job(p_worker_id text)
returns public.processing_jobs
language plpgsql
security definer
set search_path=public
as $$
declare
  v_job public.processing_jobs;
begin
  if coalesce(trim(p_worker_id), '') = '' then
    raise exception 'WORKER_ID_REQUIRED';