import type {
  AppNotification,
  BrandKit,
  Clip,
  ClipScores,
  ClipStrategy,
  GeneratedCopy,
  PlanId,
  ProcessingJob,
  Project,
  Subscription,
} from '@/types/entities';

/**
 * Backend service contract.
 *
 * The UI talks only to this interface. In demo mode it is implemented by
 * src/services/demoBackend.ts against local sample data; the production
 * implementation uses Supabase with RLS and a trusted media worker.
 */

export interface UsageSummary {
  planId: PlanId;
  minutesUsed: number;
  minutesIncluded: number;
  cycleEndsAt: string;
}

export interface AnalyticsSummary {
  totalClips: number;
  minutesProcessed: number;
  clipsExported: number;
  clipsPublished: number;
  views: number;
  avgWatchPct: number;
  engagementRate: number;
  leadsAttributed: number;
  topHook: string;
  topTopic: string;
  bestPlatform: string;
  bestLengthSec: number;
  weeklyTrend: number[];
  recommendations: string[];
  /** True when numbers are demonstration data, not connected platform data */
  isSampleData: boolean;
}

export interface CreateProjectInput {
  title: string;
  objective: Project['objective'];
  audience: Project['audience'];
  config: Project['config'];
  source: {
    kind: 'upload' | 'record' | 'link' | 'youtube' | 'google_drive' | 'dropbox' | 'zoom' | 'riverside';
    url?: string;
    uri?: string;
    fileName?: string;
    mimeType?: string;
    sizeBytes?: number;
    durationSec?: number;
  };
}

export interface Backend {
  // Projects
  listProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project | null>;
  createProject(input: CreateProjectInput): Promise<Project>;
  cancelProcessing(projectId: string): Promise<void>;
  retryProject(projectId: string): Promise<Project>;
  archiveProject(projectId: string): Promise<void>;

  // Processing job status — poll-friendly; production may swap in Realtime
  // without changing consumers.
  getJob(projectId: string): Promise<ProcessingJob | null>;

  // Clips
  listClips(projectId: string): Promise<Clip[]>;
  getClip(clipId: string): Promise<Clip | null>;
  getScores(clipId: string): Promise<ClipScores | null>;
  getStrategy(clipId: string): Promise<ClipStrategy | null>;
  getCopy(clipId: string): Promise<GeneratedCopy | null>;
  setClipApproved(clipId: string, approved: boolean): Promise<void>;

  // Brand kits
  listBrandKits(): Promise<BrandKit[]>;
  saveBrandKit(kit: BrandKit): Promise<BrandKit>;
  deleteBrandKit(id: string): Promise<void>;

  // Account
  getUsage(): Promise<UsageSummary>;
  getSubscription(): Promise<Subscription>;
  getAnalytics(): Promise<AnalyticsSummary>;
  listNotifications(): Promise<AppNotification[]>;
}
