/**
 * Typed entities mirroring the planned Supabase schema.
 * These are the contracts the backend (Prompt 2) must satisfy.
 * IDs are UUIDs; timestamps are ISO-8601 strings.
 */

export type CreatorType =
  | 'content_creator'
  | 'podcaster'
  | 'coach'
  | 'business'
  | 'agency'
  | 'ministry'
  | 'educator'
  | 'other';

export type PrimaryGoal =
  | 'grow_followers'
  | 'generate_leads'
  | 'sell_product'
  | 'promote_service'
  | 'build_authority'
  | 'increase_engagement'
  | 'repurpose_faster';

export type Platform =
  | 'tiktok'
  | 'instagram_reels'
  | 'youtube_shorts'
  | 'facebook_reels'
  | 'linkedin'
  | 'x'
  | 'other';

export type ContentStyle =
  | 'educational'
  | 'motivational'
  | 'entertaining'
  | 'story_driven'
  | 'opinion_led'
  | 'faith_based'
  | 'product_focused'
  | 'podcast_highlights';

export type PlanId = 'free' | 'creator' | 'growth' | 'agency';

export type AspectRatio = '9:16' | '1:1' | '4:5' | '16:9';

export type CaptionStyle = 'bold_pop' | 'clean_minimal' | 'karaoke' | 'block_highlight' | 'typewriter';

export interface Profile {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  creatorType: CreatorType | null;
  primaryGoal: PrimaryGoal | null;
  platforms: Platform[];
  contentStyle: ContentStyle | null;
  onboardingCompletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  planId: PlanId;
  isClientWorkspace: boolean;
  createdAt: string;
}

export type WorkspaceRole = 'owner' | 'admin' | 'editor' | 'viewer';

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  invitedEmail: string | null;
  acceptedAt: string | null;
  createdAt: string;
}

export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'expired';

export interface Subscription {
  id: string;
  workspaceId: string;
  planId: PlanId;
  status: SubscriptionStatus;
  provider: 'revenuecat' | 'stripe' | 'none';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

export type UsageEntryType =
  | 'processing_minutes'
  | 'export'
  | 'storage_bytes'
  | 'credit_grant'
  | 'credit_adjustment';

export interface UsageLedgerEntry {
  id: string;
  workspaceId: string;
  projectId: string | null;
  type: UsageEntryType;
  /** Positive = consumed, negative = granted/refunded */
  amount: number;
  note: string | null;
  createdAt: string;
}

export interface BrandKit {
  id: string;
  workspaceId: string;
  name: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  captionFont: string;
  captionStyle: CaptionStyle;
  logoPosition: 'top_left' | 'top_right' | 'bottom_left' | 'bottom_right';
  introCardEnabled: boolean;
  outroCardEnabled: boolean;
  defaultCta: string;
  watermarkEnabled: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ProjectStatus =
  | 'draft'
  | 'uploading'
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'archived';

export type ClipObjective =
  | 'maximize_reach'
  | 'generate_leads'
  | 'sell_offer'
  | 'build_authority'
  | 'drive_comments'
  | 'promote_event'
  | 'teach_idea'
  | 'inspire'
  | 'podcast_highlights';

export interface AudienceBrief {
  targetAudience: string;
  painPoint: string;
  transformation: string;
  tone: string;
  prioritizeTopics: string[];
  avoidTopics: string[];
}

export interface ClipConfig {
  autoSelect: boolean;
  clipCount: number;
  minLengthSec: number;
  maxLengthSec: number;
  aspectRatio: AspectRatio;
  captionStyle: CaptionStyle;
  speakerTracking: boolean;
  emojiLevel: 'none' | 'light' | 'expressive';
  profanityFilter: boolean;
  removeFillerWords: boolean;
  removeSilence: boolean;
  autoZoom: boolean;
  brollSuggestions: boolean;
  defaultCta: string;
  brandKitId: string | null;
}

export interface Project {
  id: string;
  workspaceId: string;
  createdBy: string;
  title: string;
  status: ProjectStatus;
  objective: ClipObjective;
  audience: AudienceBrief | null;
  config: ClipConfig;
  sourceVideoId: string | null;
  thumbnailUrl: string | null;
  durationSec: number | null;
  clipCount: number;
  estimatedCreditsMin: number;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export type SourceKind =
  | 'upload'
  | 'record'
  | 'link'
  | 'youtube'
  | 'google_drive'
  | 'dropbox'
  | 'zoom'
  | 'riverside';

export interface SourceVideo {
  id: string;
  workspaceId: string;
  projectId: string;
  kind: SourceKind;
  originalUrl: string | null;
  storagePath: string | null;
  fileName: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  durationSec: number | null;
  width: number | null;
  height: number | null;
  createdAt: string;
}

export type JobStage =
  | 'uploading'
  | 'extracting_audio'
  | 'transcribing'
  | 'understanding_topics'
  | 'detecting_moments'
  | 'ranking_hooks'
  | 'reframing_speakers'
  | 'generating_captions'
  | 'applying_brand'
  | 'preparing_clips';

export type JobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface ProcessingJob {
  id: string;
  projectId: string;
  status: JobStatus;
  stage: JobStage;
  /** 0–100 across the whole pipeline */
  progress: number;
  message: string | null;
  error: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
}

export interface Transcript {
  id: string;
  projectId: string;
  language: string;
  fullText: string;
  createdAt: string;
}

export interface TranscriptSegment {
  id: string;
  transcriptId: string;
  startMs: number;
  endMs: number;
  speaker: string | null;
  text: string;
  confidence: number;
}

export type ClipRecommendation = 'recommended' | 'alternative' | 'needs_review';

export interface Clip {
  id: string;
  projectId: string;
  title: string;
  startMs: number;
  endMs: number;
  aspectRatio: AspectRatio;
  status: ClipRecommendation;
  approved: boolean;
  platformRecommendation: Platform;
  aiSummary: string;
  previewUrl: string | null;
  thumbnailUrl: string | null;
  transcriptExcerpt: string;
  createdAt: string;
}

export interface ClipScores {
  clipId: string;
  /** 0–100 */
  viralPotential: number;
  hookStrength: number;
  clarity: number;
  emotionalImpact: number;
  ctaOpportunity: number;
  /** 0–100 lead-gen suitability, used for sorting */
  leadPotential: number;
}

/** Structured "Why this could work" strategy panel */
export interface ClipStrategy {
  clipId: string;
  hookAnalysis: string;
  audienceRelevance: string;
  emotionalTrigger: string;
  curiosityMechanism: string;
  retentionRisk: string;
  bestPlatform: Platform;
  postingAngle: string;
  suggestedCta: string;
  improvement: string;
}

export type ClipAssetKind = 'render_720p' | 'render_1080p' | 'thumbnail' | 'captions_srt' | 'captions_json';

export interface ClipAsset {
  id: string;
  clipId: string;
  kind: ClipAssetKind;
  storagePath: string;
  sizeBytes: number | null;
  watermarked: boolean;
  createdAt: string;
}

export interface SocialAccount {
  id: string;
  workspaceId: string;
  platform: Platform;
  handle: string;
  status: 'connected' | 'expired' | 'revoked';
  connectedAt: string;
}

export interface Publication {
  id: string;
  clipId: string;
  socialAccountId: string;
  platform: Platform;
  externalUrl: string | null;
  publishedAt: string;
  status: 'scheduled' | 'published' | 'failed';
}

export interface PerformanceMetrics {
  id: string;
  publicationId: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  avgWatchPct: number;
  leadsAttributed: number;
  capturedAt: string;
}

export interface GeneratedCopy {
  id: string;
  clipId: string;
  hooks: string[];
  titles: string[];
  captions: string[];
  ctaOptions: string[];
  hashtagsByPlatform: Partial<Record<Platform, string[]>>;
  thumbnailIdeas: string[];
  postingStrategy: string;
  recommendedPostingTime: string | null;
  createdAt: string;
}

export type NotificationKind =
  | 'processing_complete'
  | 'processing_failed'
  | 'usage_low'
  | 'plan_change'
  | 'team_invite'
  | 'tip';

export interface AppNotification {
  id: string;
  userId: string;
  kind: NotificationKind;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  workspaceId: string;
  actorId: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}
