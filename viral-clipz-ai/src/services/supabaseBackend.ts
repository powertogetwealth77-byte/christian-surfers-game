import { PLANS } from '@/config/plans';
import { supabase } from '@/lib/supabase';
import type {
  AppNotification,
  BrandKit,
  Clip,
  ClipScores,
  ClipStrategy,
  GeneratedCopy,
  Platform,
  ProcessingJob,
  Project,
  Subscription,
} from '@/types/entities';
import type { AnalyticsSummary, Backend, CreateProjectInput, UsageSummary } from './backend';

function client() {
  if (!supabase) throw new Error('CONFIGURATION_ERROR: Supabase is not configured.');
  return supabase;
}

async function currentWorkspaceId(): Promise<string> {
  const db = client();
  const { data: auth, error: authError } = await db.auth.getUser();
  if (authError || !auth.user) throw new Error('AUTH_REQUIRED');
  const { data, error } = await db.rpc('bootstrap_current_user');
  if (error || !data) throw new Error(error?.message ?? 'WORKSPACE_BOOTSTRAP_FAILED');
  return data as string;
}

function audienceFrom(row: Record<string, any>): Project['audience'] {
  if (!row.target_audience && !row.audience_pain_point && !row.desired_transformation && !row.tone) return null;
  return {
    targetAudience: row.target_audience ?? '',
    painPoint: row.audience_pain_point ?? '',
    transformation: row.desired_transformation ?? '',
    tone: row.tone ?? '',
    prioritizeTopics: row.processing_settings?.prioritizeTopics ?? [],
    avoidTopics: row.processing_settings?.avoidTopics ?? [],
  };
}

function mapProject(row: Record<string, any>): Project {
  const config = row.processing_settings?.config ?? row.processing_settings ?? {};
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    createdBy: row.created_by,
    title: row.title,
    status: row.status === 'review_ready' ? 'completed' : row.status === 'awaiting_upload' ? 'uploading' : row.status,
    objective: row.objective,
    audience: audienceFrom(row),
    config,
    sourceVideoId: row.source_videos?.[0]?.id ?? row.source_video_id ?? null,
    thumbnailUrl: null,
    durationSec: row.source_videos?.[0]?.duration_seconds == null ? null : Number(row.source_videos[0].duration_seconds),
    clipCount: row.clips?.[0]?.count ?? row.clip_count ?? 0,
    estimatedCreditsMin: Number(row.processing_settings?.estimatedCreditsMin ?? 0),
    failureReason: row.error_message ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  } as Project;
}

async function signedOutput(path: string | null): Promise<string | null> {
  if (!path) return null;
  const { data, error } = await client().storage.from('viral-clipz-outputs').createSignedUrl(path, 3600);
  if (error) return null;
  return data.signedUrl;
}

async function mapClip(row: Record<string, any>): Promise<Clip> {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    startMs: Math.round(Number(row.start_seconds) * 1000),
    endMs: Math.round(Number(row.end_seconds) * 1000),
    aspectRatio: row.aspect_ratio,
    status: row.status,
    approved: Boolean(row.approved_at),
    platformRecommendation: row.recommended_platform as Platform,
    aiSummary: row.ai_summary ?? '',
    previewUrl: await signedOutput(row.preview_storage_path ?? row.output_storage_path),
    thumbnailUrl: await signedOutput(row.thumbnail_storage_path),
    transcriptExcerpt: row.transcript_excerpt ?? '',
    createdAt: row.created_at,
  };
}

function mapJob(row: Record<string, any>): ProcessingJob {
  const stageMap: Record<string, ProcessingJob['stage']> = {
    validate_source: 'uploading',
    inspect_media: 'uploading',
    extract_audio: 'extracting_audio',
    transcribe: 'transcribing',
    normalize_transcript: 'transcribing',
    generate_candidates: 'detecting_moments',
    analyze_candidates: 'understanding_topics',
    score_candidates: 'ranking_hooks',
    select_candidates: 'ranking_hooks',
    generate_captions: 'generating_captions',
    render_previews: 'reframing_speakers',
    generate_copy: 'applying_brand',
    finalize_assets: 'preparing_clips',
    complete: 'preparing_clips',
  };
  const statusMap: Record<string, ProcessingJob['status']> = {
    queued: 'queued', claimed: 'running', processing: 'running', retrying: 'running', completed: 'completed', failed: 'failed', cancelled: 'cancelled', dead_letter: 'failed',
  };
  return {
    id: row.id,
    projectId: row.project_id,
    status: statusMap[row.status] ?? 'queued',
    stage: stageMap[row.current_stage] ?? 'uploading',
    progress: row.progress_percent,
    message: row.output_payload?.message ?? null,
    error: row.error_message ?? null,
    startedAt: row.started_at,
    finishedAt: row.completed_at,
    createdAt: row.created_at,
  };
}

function mapBrandKit(row: Record<string, any>): BrandKit {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    logoUrl: row.logo_path,
    primaryColor: row.primary_color,
    secondaryColor: row.secondary_color,
    accentColor: row.accent_color,
    captionFont: row.font_family,
    captionStyle: row.caption_preset,
    logoPosition: row.logo_position,
    introCardEnabled: false,
    outroCardEnabled: false,
    defaultCta: row.default_cta,
    watermarkEnabled: row.watermark_enabled,
    isDefault: row.is_default,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const supabaseBackend: Backend = {
  async listProjects() {
    const workspaceId = await currentWorkspaceId();
    const { data, error } = await client().from('projects').select('*,source_videos(id,duration_seconds),clips(count)').eq('workspace_id', workspaceId).neq('status', 'archived').order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapProject);
  },

  async getProject(id) {
    const { data, error } = await client().from('projects').select('*,source_videos(id,duration_seconds),clips(count)').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? mapProject(data) : null;
  },

  async createProject(input: CreateProjectInput) {
    const db = client();
    const workspaceId = await currentWorkspaceId();
    const { data: auth } = await db.auth.getUser();
    if (!auth.user) throw new Error('AUTH_REQUIRED');
    const { data, error } = await db.from('projects').insert({
      workspace_id: workspaceId,
      created_by: auth.user.id,
      title: input.title,
      objective: input.objective,
      target_audience: input.audience?.targetAudience ?? null,
      audience_pain_point: input.audience?.painPoint ?? null,
      desired_transformation: input.audience?.transformation ?? null,
      tone: input.audience?.tone ?? null,
      status: input.source.kind === 'upload' || input.source.kind === 'record' ? 'awaiting_upload' : 'queued',
      processing_settings: {
        config: input.config,
        source: input.source,
        prioritizeTopics: input.audience?.prioritizeTopics ?? [],
        avoidTopics: input.audience?.avoidTopics ?? [],
        estimatedCreditsMin: input.source.durationSec ? Math.ceil(input.source.durationSec / 60) : 0,
      },
    }).select('*').single();
    if (error) throw error;
    return mapProject(data);
  },

  async cancelProcessing(projectId) {
    const { error } = await client().from('projects').update({ status: 'cancelled' }).eq('id', projectId);
    if (error) throw error;
  },

  async retryProject(projectId) {
    const db = client();
    const { data, error } = await db.from('projects').update({ status: 'queued', error_code: null, error_message: null }).eq('id', projectId).select('*').single();
    if (error) throw error;
    return mapProject(data);
  },

  async archiveProject(projectId) {
    const { error } = await client().from('projects').update({ status: 'archived' }).eq('id', projectId);
    if (error) throw error;
  },

  async getJob(projectId) {
    const { data, error } = await client().from('processing_jobs').select('*').eq('project_id', projectId).order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (error) throw error;
    return data ? mapJob(data) : null;
  },

  async listClips(projectId) {
    const { data, error } = await client().from('clips').select('*').eq('project_id', projectId).order('rank');
    if (error) throw error;
    return Promise.all((data ?? []).map(mapClip));
  },

  async getClip(clipId) {
    const { data, error } = await client().from('clips').select('*').eq('id', clipId).maybeSingle();
    if (error) throw error;
    return data ? mapClip(data) : null;
  },

  async getScores(clipId) {
    const { data, error } = await client().from('clip_scores').select('*').eq('clip_id', clipId).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return {
      clipId,
      viralPotential: Math.round(Number(data.overall_score)),
      hookStrength: Math.round(Number(data.hook_strength)),
      clarity: Math.round(Number(data.clarity)),
      emotionalImpact: Math.round(Number(data.emotional_impact)),
      ctaOpportunity: Math.round(Number(data.conversion_potential)),
      leadPotential: Math.round(Number(data.lead_potential)),
    } satisfies ClipScores;
  },

  async getStrategy(clipId) {
    const { data, error } = await client().from('clip_scores').select('strategy').eq('clip_id', clipId).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return { clipId, ...(data.strategy as Omit<ClipStrategy, 'clipId'>) };
  },

  async getCopy(clipId) {
    const { data, error } = await client().from('generated_copy').select('*').eq('clip_id', clipId);
    if (error) throw error;
    if (!data?.length) return null;
    const byType = Object.fromEntries(data.map((row) => [row.content_type, row.content]));
    return {
      id: `copy-${clipId}`,
      clipId,
      hooks: byType.hooks ?? [],
      titles: byType.titles ?? [],
      captions: byType.captions ?? [],
      ctaOptions: byType.ctas ?? [],
      hashtagsByPlatform: byType.hashtags ?? {},
      thumbnailIdeas: byType.thumbnails ?? [],
      postingStrategy: byType.strategy?.text ?? byType.strategy ?? '',
      recommendedPostingTime: byType.strategy?.postingTime ?? null,
      createdAt: data[0].created_at,
    } satisfies GeneratedCopy;
  },

  async setClipApproved(clipId, approved) {
    const { error } = await client().from('clips').update({ approved_at: approved ? new Date().toISOString() : null }).eq('id', clipId);
    if (error) throw error;
  },

  async listBrandKits() {
    const workspaceId = await currentWorkspaceId();
    const { data, error } = await client().from('brand_kits').select('*').eq('workspace_id', workspaceId).order('created_at');
    if (error) throw error;
    return (data ?? []).map(mapBrandKit);
  },

  async saveBrandKit(kit) {
    const workspaceId = await currentWorkspaceId();
    const payload = {
      id: kit.id,
      workspace_id: workspaceId,
      name: kit.name,
      logo_path: kit.logoUrl,
      primary_color: kit.primaryColor,
      secondary_color: kit.secondaryColor,
      accent_color: kit.accentColor,
      font_family: kit.captionFont,
      caption_preset: kit.captionStyle,
      logo_position: kit.logoPosition,
      watermark_enabled: kit.watermarkEnabled,
      default_cta: kit.defaultCta,
      is_default: kit.isDefault,
    };
    const { data, error } = await client().from('brand_kits').upsert(payload).select('*').single();
    if (error) throw error;
    return mapBrandKit(data);
  },

  async deleteBrandKit(id) {
    const { error } = await client().from('brand_kits').delete().eq('id', id).eq('is_default', false);
    if (error) throw error;
  },

  async getUsage(): Promise<UsageSummary> {
    const workspaceId = await currentWorkspaceId();
    const db = client();
    const [{ data: subscription, error: subError }, { data: ledger, error: ledgerError }] = await Promise.all([
      db.from('subscriptions').select('*').eq('workspace_id', workspaceId).single(),
      db.from('usage_ledger').select('quantity,direction,status,created_at').eq('workspace_id', workspaceId).eq('usage_type', 'processing_minutes').in('status', ['settled','adjusted']),
    ]);
    if (subError) throw subError;
    if (ledgerError) throw ledgerError;
    const planId = subscription.plan_code as keyof typeof PLANS;
    const used = (ledger ?? []).reduce((sum, row) => sum + (row.direction === 'debit' ? Number(row.quantity) : -Number(row.quantity)), 0);
    return { planId, minutesUsed: Math.max(0, used), minutesIncluded: PLANS[planId].processingMinutes, cycleEndsAt: subscription.current_period_end };
  },

  async getSubscription() {
    const workspaceId = await currentWorkspaceId();
    const { data, error } = await client().from('subscriptions').select('*').eq('workspace_id', workspaceId).single();
    if (error) throw error;
    return {
      id: data.id,
      workspaceId,
      planId: data.plan_code,
      status: data.status,
      provider: data.provider,
      currentPeriodStart: data.current_period_start,
      currentPeriodEnd: data.current_period_end,
      cancelAtPeriodEnd: data.cancel_at_period_end,
    } satisfies Subscription;
  },

  async getAnalytics(): Promise<AnalyticsSummary> {
    const workspaceId = await currentWorkspaceId();
    const db = client();
    const [{ count: totalClips }, { data: usage }] = await Promise.all([
      db.from('clips').select('id,projects!inner(workspace_id)', { count: 'exact', head: true }).eq('projects.workspace_id', workspaceId),
      db.from('usage_ledger').select('quantity,direction').eq('workspace_id', workspaceId).eq('usage_type', 'processing_minutes').eq('status', 'settled'),
    ]);
    return {
      totalClips: totalClips ?? 0,
      minutesProcessed: (usage ?? []).reduce((sum, row) => sum + (row.direction === 'debit' ? Number(row.quantity) : 0), 0),
      clipsExported: 0,
      clipsPublished: 0,
      views: 0,
      avgWatchPct: 0,
      engagementRate: 0,
      leadsAttributed: 0,
      topHook: 'Connect social accounts to learn your best hook',
      topTopic: 'No performance data yet',
      bestPlatform: 'Not connected',
      bestLengthSec: 0,
      weeklyTrend: [],
      recommendations: ['Process your first video to begin building performance intelligence.'],
      isSampleData: false,
    };
  },

  async listNotifications() {
    const { data: auth } = await client().auth.getUser();
    if (!auth.user) throw new Error('AUTH_REQUIRED');
    const { data, error } = await client().from('notifications').select('*').eq('user_id', auth.user.id).order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row): AppNotification => ({
      id: row.id,
      userId: row.user_id,
      kind: row.type,
      title: row.title,
      body: row.body,
      readAt: row.read_at,
      createdAt: row.created_at,
    }));
  },
};
