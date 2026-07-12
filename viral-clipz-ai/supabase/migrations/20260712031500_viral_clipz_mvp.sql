begin;

create extension if not exists pgcrypto;

create type public.workspace_role as enum ('owner','admin','editor','reviewer','viewer');
create type public.plan_code as enum ('free','creator','growth','agency');
create type public.project_status as enum ('draft','awaiting_upload','queued','processing','review_ready','completed','failed','cancelled','archived');
create type public.job_status as enum ('queued','claimed','processing','retrying','completed','failed','cancelled','dead_letter');
create type public.job_stage as enum ('validate_source','inspect_media','extract_audio','transcribe','normalize_transcript','generate_candidates','analyze_candidates','score_candidates','select_candidates','generate_captions','render_previews','generate_copy','finalize_assets','complete');
create type public.usage_status as enum ('reserved','settled','released','adjusted');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  creator_type text,
  primary_goal text,
  target_audience text,
  content_style text,
  platforms text[] not null default '{}',
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  slug text not null unique,
  workspace_type text not null default 'creator',
  plan_code public.plan_code not null default 'free',
  status text not null default 'active' check (status in ('active','suspended','deleted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.workspace_role not null,
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  primary key (workspace_id,user_id)
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null unique references public.workspaces(id) on delete cascade,
  provider text not null default 'none' check (provider in ('none','revenuecat','stripe')),
  provider_customer_id text,
  provider_subscription_id text,
  plan_code public.plan_code not null default 'free',
  status text not null default 'active' check (status in ('active','trialing','past_due','canceled','expired')),
  current_period_start timestamptz not null default now(),
  current_period_end timestamptz not null default (now() + interval '30 days'),
  cancel_at_period_end boolean not null default false,
  entitlements jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.brand_kits (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  logo_path text,
  primary_color text not null default '#FF5A36',
  secondary_color text not null default '#7C5CFF',
  accent_color text not null default '#4EF2B4',
  font_family text not null default 'Inter',
  caption_preset text not null default 'bold_pop',
  logo_position text not null default 'top_right',
  watermark_enabled boolean not null default true,
  default_cta text not null default 'Follow for more',
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index brand_kits_one_default_per_workspace on public.brand_kits(workspace_id) where is_default;

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  title text not null,
  objective text not null,
  target_audience text,
  audience_pain_point text,
  desired_transformation text,
  tone text,
  status public.project_status not null default 'draft',
  processing_settings jsonb not null default '{}',
  error_code text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);
create index projects_workspace_created_idx on public.projects(workspace_id,created_at desc);

create table public.source_videos (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references public.projects(id) on delete cascade,
  source_type text not null,
  storage_path text,
  original_url text,
  original_filename text,
  mime_type text,
  byte_size bigint,
  duration_seconds numeric,
  width integer,
  height integer,
  frame_rate numeric,
  rotation integer,
  codec text,
  checksum text,
  ingestion_status text not null default 'pending' check (ingestion_status in ('pending','uploaded','validated','failed')),
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.processing_jobs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  job_type text not null default 'process_video',
  status public.job_status not null default 'queued',
  current_stage public.job_stage not null default 'validate_source',
  progress_percent integer not null default 0 check (progress_percent between 0 and 100),
  provider text,
  attempt_count integer not null default 0,
  maximum_attempts integer not null default 3,
  idempotency_key text not null unique,
  claimed_by text,
  heartbeat_at timestamptz,
  error_code text,
  error_message text,
  input_payload jsonb not null default '{}',
  output_payload jsonb not null default '{}',
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index processing_jobs_status_created_idx on public.processing_jobs(status,created_at);
create unique index one_active_job_per_project on public.processing_jobs(project_id) where status in ('queued','claimed','processing','retrying');

create table public.transcripts (
  id uuid primary key default gen_random_uuid(),
  source_video_id uuid not null unique references public.source_videos(id) on delete cascade,
  provider text not null,
  detected_language text,
  full_text text not null,
  confidence numeric,
  word_count integer not null default 0,
  duration_seconds numeric,
  created_at timestamptz not null default now()
);

create table public.transcript_segments (
  id uuid primary key default gen_random_uuid(),
  transcript_id uuid not null references public.transcripts(id) on delete cascade,
  sequence_number integer not null,
  start_seconds numeric not null,
  end_seconds numeric not null,
  speaker_label text,
  text text not null,
  confidence numeric,
  words_json jsonb not null default '[]',
  created_at timestamptz not null default now(),
  unique(transcript_id,sequence_number),
  check (end_seconds > start_seconds)
);

create table public.clips (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  source_video_id uuid not null references public.source_videos(id) on delete cascade,
  title text not null,
  start_seconds numeric not null,
  end_seconds numeric not null,
  duration_seconds numeric generated always as (end_seconds-start_seconds) stored,
  status text not null default 'alternative' check (status in ('recommended','alternative','needs_review')),
  rank integer not null,
  objective text not null,
  recommended_platform text not null default 'instagram_reels',
  aspect_ratio text not null default '9:16',
  output_storage_path text,
  preview_storage_path text,
  thumbnail_storage_path text,
  caption_file_path text,
  transcript_excerpt text not null default '',
  ai_summary text not null default '',
  edit_settings jsonb not null default '{}',
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(project_id,rank),
  check (end_seconds > start_seconds)
);

create table public.clip_scores (
  clip_id uuid primary key references public.clips(id) on delete cascade,
  overall_score numeric not null check (overall_score between 0 and 100),
  hook_strength numeric not null check (hook_strength between 0 and 100),
  retention_potential numeric not null check (retention_potential between 0 and 100),
  clarity numeric not null check (clarity between 0 and 100),
  emotional_impact numeric not null check (emotional_impact between 0 and 100),
  novelty numeric not null check (novelty between 0 and 100),
  audience_relevance numeric not null check (audience_relevance between 0 and 100),
  lead_potential numeric not null check (lead_potential between 0 and 100),
  authority_value numeric not null check (authority_value between 0 and 100),
  conversion_potential numeric not null check (conversion_potential between 0 and 100),
  context_completeness numeric not null check (context_completeness between 0 and 100),
  risk_penalty numeric not null default 0 check (risk_penalty between 0 and 100),
  explanation text not null,
  strategy jsonb not null default '{}',
  scoring_version text not null default 'v1',
  weight_profile jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table public.generated_copy (
  id uuid primary key default gen_random_uuid(),
  clip_id uuid not null references public.clips(id) on delete cascade,
  content_type text not null,
  platform text,
  content jsonb not null,
  variation_number integer not null default 1,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique(clip_id,content_type,platform,variation_number)
);

create table public.clip_assets (
  id uuid primary key default gen_random_uuid(),
  clip_id uuid not null references public.clips(id) on delete cascade,
  asset_type text not null,
  storage_path text not null,
  mime_type text,
  width integer,
  height integer,
  duration_seconds numeric,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique(clip_id,asset_type)
);

create table public.usage_ledger (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  usage_type text not null,
  quantity numeric not null,
  unit text not null,
  direction text not null check (direction in ('debit','credit')),
  status public.usage_status not null,
  idempotency_key text not null unique,
  reference_id text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  read_at timestamptz,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table public.provider_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  external_event_id text not null,
  event_type text not null,
  payload_hash text not null,
  processed_at timestamptz,
  status text not null default 'received' check (status in ('received','processed','failed')),
  error_message text,
  created_at timestamptz not null default now(),
  unique(provider,external_event_id)
);

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
create trigger workspaces_touch before update on public.workspaces for each row execute function public.touch_updated_at();
create trigger subscriptions_touch before update on public.subscriptions for each row execute function public.touch_updated_at();
create trigger brand_kits_touch before update on public.brand_kits for each row execute function public.touch_updated_at();
create trigger projects_touch before update on public.projects for each row execute function public.touch_updated_at();
create trigger source_videos_touch before update on public.source_videos for each row execute function public.touch_updated_at();
create trigger processing_jobs_touch before update on public.processing_jobs for each row execute function public.touch_updated_at();
create trigger clips_touch before update on public.clips for each row execute function public.touch_updated_at();

create or replace function public.is_workspace_member(p_workspace_id uuid) returns boolean
language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.workspace_members wm where wm.workspace_id=p_workspace_id and wm.user_id=auth.uid());
$$;

create or replace function public.has_workspace_role(p_workspace_id uuid,p_roles public.workspace_role[]) returns boolean
language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.workspace_members wm where wm.workspace_id=p_workspace_id and wm.user_id=auth.uid() and wm.role=any(p_roles));
$$;

create or replace function public.bootstrap_current_user() returns uuid
language plpgsql security definer set search_path=public as $$
declare v_user auth.users; v_workspace uuid; v_slug text;
begin
  select * into v_user from auth.users where id=auth.uid();
  if v_user.id is null then raise exception 'AUTH_REQUIRED'; end if;
  insert into public.profiles(id,email,full_name)
  values(v_user.id,coalesce(v_user.email,''),coalesce(v_user.raw_user_meta_data->>'full_name',''))
  on conflict(id) do update set email=excluded.email;
  select workspace_id into v_workspace from public.workspace_members where user_id=v_user.id order by created_at limit 1;
  if v_workspace is null then
    v_slug := lower(regexp_replace(coalesce(split_part(v_user.email,'@',1),'creator'),'[^a-zA-Z0-9]+','-','g'))||'-'||substr(v_user.id::text,1,8);
    insert into public.workspaces(owner_id,name,slug) values(v_user.id,coalesce(v_user.raw_user_meta_data->>'full_name','My Workspace'),v_slug) returning id into v_workspace;
    insert into public.workspace_members(workspace_id,user_id,role) values(v_workspace,v_user.id,'owner');
    insert into public.subscriptions(workspace_id) values(v_workspace);
    insert into public.brand_kits(workspace_id,name,is_default) values(v_workspace,'Default Brand',true);
  end if;
  return v_workspace;
end $$;
revoke all on function public.bootstrap_current_user() from public;
grant execute on function public.bootstrap_current_user() to authenticated;

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.subscriptions enable row level security;
alter table public.brand_kits enable row level security;
alter table public.projects enable row level security;
alter table public.source_videos enable row level security;
alter table public.processing_jobs enable row level security;
alter table public.transcripts enable row level security;
alter table public.transcript_segments enable row level security;
alter table public.clips enable row level security;
alter table public.clip_scores enable row level security;
alter table public.generated_copy enable row level security;
alter table public.clip_assets enable row level security;
alter table public.usage_ledger enable row level security;
alter table public.notifications enable row level security;
alter table public.provider_webhook_events enable row level security;

create policy profiles_self_select on public.profiles for select using(id=auth.uid());
create policy profiles_self_update on public.profiles for update using(id=auth.uid()) with check(id=auth.uid());
create policy workspaces_member_select on public.workspaces for select using(public.is_workspace_member(id));
create policy members_member_select on public.workspace_members for select using(public.is_workspace_member(workspace_id));
create policy subscriptions_member_select on public.subscriptions for select using(public.is_workspace_member(workspace_id));
create policy brand_kits_member_select on public.brand_kits for select using(public.is_workspace_member(workspace_id));
create policy brand_kits_editor_write on public.brand_kits for all using(public.has_workspace_role(workspace_id,array['owner','admin','editor']::public.workspace_role[])) with check(public.has_workspace_role(workspace_id,array['owner','admin','editor']::public.workspace_role[]));
create policy projects_member_select on public.projects for select using(public.is_workspace_member(workspace_id));
create policy projects_editor_insert on public.projects for insert with check(created_by=auth.uid() and public.has_workspace_role(workspace_id,array['owner','admin','editor']::public.workspace_role[]));
create policy projects_editor_update on public.projects for update using(public.has_workspace_role(workspace_id,array['owner','admin','editor']::public.workspace_role[])) with check(public.has_workspace_role(workspace_id,array['owner','admin','editor']::public.workspace_role[]));
create policy source_videos_member_select on public.source_videos for select using(exists(select 1 from public.projects p where p.id=project_id and public.is_workspace_member(p.workspace_id)));
create policy processing_jobs_member_select on public.processing_jobs for select using(exists(select 1 from public.projects p where p.id=project_id and public.is_workspace_member(p.workspace_id)));
create policy transcripts_member_select on public.transcripts for select using(exists(select 1 from public.source_videos sv join public.projects p on p.id=sv.project_id where sv.id=source_video_id and public.is_workspace_member(p.workspace_id)));
create policy segments_member_select on public.transcript_segments for select using(exists(select 1 from public.transcripts t join public.source_videos sv on sv.id=t.source_video_id join public.projects p on p.id=sv.project_id where t.id=transcript_id and public.is_workspace_member(p.workspace_id)));
create policy clips_member_select on public.clips for select using(exists(select 1 from public.projects p where p.id=project_id and public.is_workspace_member(p.workspace_id)));
create policy clips_reviewer_update on public.clips for update using(exists(select 1 from public.projects p where p.id=project_id and public.has_workspace_role(p.workspace_id,array['owner','admin','editor','reviewer']::public.workspace_role[]))) with check(exists(select 1 from public.projects p where p.id=project_id and public.has_workspace_role(p.workspace_id,array['owner','admin','editor','reviewer']::public.workspace_role[])));
create policy scores_member_select on public.clip_scores for select using(exists(select 1 from public.clips c join public.projects p on p.id=c.project_id where c.id=clip_id and public.is_workspace_member(p.workspace_id)));
create policy copy_member_select on public.generated_copy for select using(exists(select 1 from public.clips c join public.projects p on p.id=c.project_id where c.id=clip_id and public.is_workspace_member(p.workspace_id)));
create policy assets_member_select on public.clip_assets for select using(exists(select 1 from public.clips c join public.projects p on p.id=c.project_id where c.id=clip_id and public.is_workspace_member(p.workspace_id)));
create policy usage_member_select on public.usage_ledger for select using(public.is_workspace_member(workspace_id));
create policy notifications_self_select on public.notifications for select using(user_id=auth.uid());
create policy notifications_self_update on public.notifications for update using(user_id=auth.uid()) with check(user_id=auth.uid());

insert into storage.buckets(id,name,public) values
('viral-clipz-sources','viral-clipz-sources',false),
('viral-clipz-outputs','viral-clipz-outputs',false),
('viral-clipz-brand-assets','viral-clipz-brand-assets',false)
on conflict(id) do update set public=false;

create policy source_objects_read on storage.objects for select using(bucket_id='viral-clipz-sources' and public.is_workspace_member((storage.foldername(name))[1]::uuid));
create policy output_objects_read on storage.objects for select using(bucket_id='viral-clipz-outputs' and public.is_workspace_member((storage.foldername(name))[1]::uuid));
create policy brand_objects_read on storage.objects for select using(bucket_id='viral-clipz-brand-assets' and public.is_workspace_member((storage.foldername(name))[1]::uuid));

commit;