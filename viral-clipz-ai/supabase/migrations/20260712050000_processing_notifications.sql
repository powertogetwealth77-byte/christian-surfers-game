begin;

create or replace function public.notify_project_processing_complete()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  if new.status='review_ready' and old.status is distinct from new.status then
    insert into public.notifications(user_id,workspace_id,type,title,body,metadata)
    select new.created_by,new.workspace_id,'processing_complete','Your clips are ready',
           coalesce((select count(*)::text from public.clips c where c.project_id=new.id),'0')||' ranked clips were created from '||new.title||'.',
           jsonb_build_object('projectId',new.id)
    where not exists(
      select 1 from public.notifications n
      where n.user_id=new.created_by
        and n.type='processing_complete'
        and n.metadata->>'projectId'=new.id::text
    );
  end if;
  return new;
end $$;

create trigger projects_notify_processing_complete
after update of status on public.projects
for each row execute function public.notify_project_processing_complete();

commit;
