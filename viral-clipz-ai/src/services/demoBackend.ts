/**
 * Demo-mode backend: implements the Backend contract against local sample
 * data with realistic latency and a time-driven processing-job simulation.
 *
 * Clearly separated so it can be deleted once the Supabase backend exists.
 * Nothing here touches the network.
 */

import { PLANS } from '@/config/plans';
import {
  DEMO_USER_ID,
  DEMO_WORKSPACE_ID,
  demoAnalytics,
  demoBrandKits,
  demoClips,
  demoCopy,
  demoCopyFallback,
  demoMinutesUsed,
  demoNotifications,
  demoProjects,
  demoScores,
  demoStrategies,
  demoSubscription,
} from '@/data/demo';
import type { Backend, CreateProjectInput } from '@/services/backend';
import type { Clip, JobStage, ProcessingJob, Project } from '@/types/entities';

const latency = (ms = 350) => new Promise<void>((r) => setTimeout(r, ms));

/** Pipeline stages with their share of overall progress. */
const STAGES: { stage: JobStage; until: number; message: string }[] = [
  { stage: 'uploading', until: 10, message: 'Uploading your video securely…' },
  { stage: 'extracting_audio', until: 18, message: 'Separating the audio track…' },
  { stage: 'transcribing', until: 34, message: 'Transcribing every word with timestamps…' },
  { stage: 'understanding_topics', until: 46, message: 'Mapping topics, claims, and stories…' },
  { stage: 'detecting_moments', until: 60, message: 'Hunting for the moments worth clipping…' },
  { stage: 'ranking_hooks', until: 70, message: 'Scoring hooks against your objective…' },
  { stage: 'reframing_speakers', until: 80, message: 'Reframing speakers for vertical…' },
  { stage: 'generating_captions', until: 90, message: 'Writing word-timed captions…' },
  { stage: 'applying_brand', until: 96, message: 'Applying your brand kit…' },
  { stage: 'preparing_clips', until: 100, message: 'Packaging clips and strategy notes…' },
];

/** Demo pipeline duration (ms) — long enough to show every stage. */
const SIMULATED_DURATION_MS = 45_000;

interface SimJob {
  projectId: string;
  startedAt: number;
  cancelled: boolean;
}

// Mutable in-memory state, seeded from the sample data set.
const projects: Project[] = demoProjects.map((p) => ({ ...p }));
const clips: Clip[] = demoClips.map((c) => ({ ...c }));
const brandKits = demoBrandKits.map((k) => ({ ...k }));
const jobs = new Map<string, SimJob>();

// The seeded "processing" sample project gets a live simulated job so the
// processing screen is demonstrable immediately.
jobs.set('demo-project-0002', { projectId: 'demo-project-0002', startedAt: Date.now() - 20_000, cancelled: false });

let idCounter = 100;
const nextId = (prefix: string) => `${prefix}-${String(idCounter++).padStart(4, '0')}`;

function computeJob(sim: SimJob): ProcessingJob {
  const elapsed = Date.now() - sim.startedAt;
  const progress = Math.min(100, Math.round((elapsed / SIMULATED_DURATION_MS) * 100));
  const current = STAGES.find((s) => progress < s.until) ?? STAGES[STAGES.length - 1];
  const done = progress >= 100;
  const status = sim.cancelled ? 'cancelled' : done ? 'completed' : 'running';
  return {
    id: `job-${sim.projectId}`,
    projectId: sim.projectId,
    status,
    stage: current.stage,
    progress: sim.cancelled ? progress : done ? 100 : progress,
    message: sim.cancelled ? 'Processing cancelled.' : done ? 'All clips are ready.' : current.message,
    error: null,
    startedAt: new Date(sim.startedAt).toISOString(),
    finishedAt: done ? new Date(sim.startedAt + SIMULATED_DURATION_MS).toISOString() : null,
    createdAt: new Date(sim.startedAt).toISOString(),
  };
}

/** When a simulated job completes, materialize results onto the project. */
function settleProject(projectId: string) {
  const sim = jobs.get(projectId);
  if (!sim) return;
  const job = computeJob(sim);
  const project = projects.find((p) => p.id === projectId);
  if (!project) return;
  if (job.status === 'completed' && project.status === 'processing') {
    project.status = 'completed';
    // Demo projects reuse the sample clip set so results are always populated.
    const existing = clips.filter((c) => c.projectId === projectId);
    if (existing.length === 0) {
      for (const c of demoClips) {
        clips.push({ ...c, id: nextId('demo-clip'), projectId });
      }
    }
    project.clipCount = clips.filter((c) => c.projectId === projectId).length;
    project.updatedAt = new Date().toISOString();
  }
  if (job.status === 'cancelled' && project.status === 'processing') {
    project.status = 'cancelled';
    project.updatedAt = new Date().toISOString();
  }
}

export const demoBackend: Backend = {
  async listProjects() {
    await latency();
    projects.forEach((p) => settleProject(p.id));
    return projects
      .filter((p) => p.status !== 'archived')
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async getProject(id) {
    await latency(200);
    settleProject(id);
    return projects.find((p) => p.id === id) ?? null;
  },

  async createProject(input: CreateProjectInput) {
    await latency(500);
    const now = new Date().toISOString();
    const durationSec = input.source.durationSec ?? 1800;
    const project: Project = {
      id: nextId('demo-project'),
      workspaceId: DEMO_WORKSPACE_ID,
      createdBy: DEMO_USER_ID,
      title: input.title,
      status: 'processing',
      objective: input.objective,
      audience: input.audience,
      config: input.config,
      sourceVideoId: nextId('demo-source'),
      thumbnailUrl: null,
      durationSec,
      clipCount: 0,
      estimatedCreditsMin: Math.ceil(durationSec / 60),
      failureReason: null,
      createdAt: now,
      updatedAt: now,
    };
    projects.unshift(project);
    jobs.set(project.id, { projectId: project.id, startedAt: Date.now(), cancelled: false });
    return project;
  },

  async cancelProcessing(projectId) {
    await latency(200);
    const sim = jobs.get(projectId);
    if (sim) sim.cancelled = true;
    settleProject(projectId);
  },

  async retryProject(projectId) {
    await latency(300);
    const project = projects.find((p) => p.id === projectId);
    if (!project) throw new Error('Project not found');
    project.status = 'processing';
    project.failureReason = null;
    project.updatedAt = new Date().toISOString();
    jobs.set(projectId, { projectId, startedAt: Date.now(), cancelled: false });
    return project;
  },

  async archiveProject(projectId) {
    await latency(200);
    const project = projects.find((p) => p.id === projectId);
    if (project) project.status = 'archived';
  },

  async getJob(projectId) {
    await latency(150);
    const sim = jobs.get(projectId);
    if (!sim) return null;
    const job = computeJob(sim);
    settleProject(projectId);
    return job;
  },

  async listClips(projectId) {
    await latency(300);
    settleProject(projectId);
    return clips.filter((c) => c.projectId === projectId);
  },

  async getClip(clipId) {
    await latency(150);
    return clips.find((c) => c.id === clipId) ?? null;
  },

  async getScores(clipId) {
    await latency(120);
    return demoScores[clipId] ?? demoScores['demo-clip-0001'] ?? null;
  },

  async getStrategy(clipId) {
    await latency(120);
    return demoStrategies[clipId] ?? demoStrategies['demo-clip-0001'] ?? null;
  },

  async getCopy(clipId) {
    await latency(150);
    return demoCopy[clipId] ?? demoCopyFallback(clipId);
  },

  async setClipApproved(clipId, approved) {
    await latency(120);
    const clip = clips.find((c) => c.id === clipId);
    if (clip) clip.approved = approved;
  },

  async listBrandKits() {
    await latency(200);
    return brandKits.slice();
  },

  async saveBrandKit(kit) {
    await latency(300);
    const idx = brandKits.findIndex((k) => k.id === kit.id);
    const saved = { ...kit, updatedAt: new Date().toISOString() };
    if (idx >= 0) brandKits[idx] = saved;
    else brandKits.push({ ...saved, id: kit.id || nextId('demo-brand') });
    return saved;
  },

  async deleteBrandKit(id) {
    await latency(200);
    const idx = brandKits.findIndex((k) => k.id === id);
    if (idx >= 0) brandKits.splice(idx, 1);
  },

  async getUsage() {
    await latency(150);
    const plan = PLANS[demoSubscription.planId];
    return {
      planId: plan.id,
      minutesUsed: demoMinutesUsed,
      minutesIncluded: plan.processingMinutes,
      cycleEndsAt: demoSubscription.currentPeriodEnd,
    };
  },

  async getSubscription() {
    await latency(150);
    return { ...demoSubscription };
  },

  async getAnalytics() {
    await latency(400);
    return { ...demoAnalytics, isSampleData: true };
  },

  async listNotifications() {
    await latency(200);
    return demoNotifications.slice();
  },
};
