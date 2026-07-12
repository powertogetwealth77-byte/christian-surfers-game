import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const envSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  WORKER_ID: z.string().min(1).default(`worker-${process.pid}`),
  WORKER_POLL_MS: z.coerce.number().int().min(500).default(3000),
});

const env = envSchema.parse(process.env);
const db = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

let shuttingDown = false;

async function updateJob(jobId: string, patch: Record<string, unknown>) {
  const { error } = await db.from('processing_jobs').update(patch).eq('id', jobId);
  if (error) throw error;
}

async function updateProject(projectId: string, patch: Record<string, unknown>) {
  const { error } = await db.from('projects').update(patch).eq('id', projectId);
  if (error) throw error;
}

async function processJob(job: Record<string, any>) {
  const stages = [
    ['validate_source', 5],
    ['inspect_media', 12],
    ['extract_audio', 20],
    ['transcribe', 38],
    ['normalize_transcript', 46],
    ['generate_candidates', 58],
    ['analyze_candidates', 68],
    ['score_candidates', 76],
    ['select_candidates', 82],
    ['generate_captions', 88],
    ['render_previews', 94],
    ['generate_copy', 97],
    ['finalize_assets', 99],
  ] as const;

  await updateProject(job.project_id, { status: 'processing', error_code: null, error_message: null });

  try {
    for (const [stage, progress] of stages) {
      if (shuttingDown) throw new Error('WORKER_SHUTDOWN');
      await updateJob(job.id, {
        status: 'processing',
        current_stage: stage,
        progress_percent: progress,
        heartbeat_at: new Date().toISOString(),
        output_payload: { message: stage.replaceAll('_', ' ') },
      });

      // Launch scaffold: each stage is intentionally explicit. Real ffprobe,
      // transcription, scoring and FFmpeg adapters plug in here next.
      await new Promise((resolve) => setTimeout(resolve, 150));
    }

    await updateJob(job.id, {
      status: 'completed',
      current_stage: 'complete',
      progress_percent: 100,
      completed_at: new Date().toISOString(),
      heartbeat_at: new Date().toISOString(),
      output_payload: { message: 'processing complete', mode: 'pipeline_scaffold' },
    });
    await updateProject(job.project_id, { status: 'review_ready', completed_at: new Date().toISOString() });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'INTERNAL_ERROR';
    const retryable = job.attempt_count < job.maximum_attempts;
    await updateJob(job.id, {
      status: retryable ? 'retrying' : 'dead_letter',
      error_code: message === 'WORKER_SHUTDOWN' ? 'WORKER_SHUTDOWN' : 'INTERNAL_ERROR',
      error_message: message,
      heartbeat_at: new Date().toISOString(),
    });
    if (!retryable) await updateProject(job.project_id, { status: 'failed', error_code: 'INTERNAL_ERROR', error_message: message });
  }
}

async function claimNextJob() {
  const { data, error } = await db.rpc('claim_next_processing_job', { p_worker_id: env.WORKER_ID });
  if (error) throw error;
  return data as Record<string, any> | null;
}

async function main() {
  console.log(JSON.stringify({ event: 'worker_started', workerId: env.WORKER_ID }));
  while (!shuttingDown) {
    try {
      const job = await claimNextJob();
      if (job?.id) {
        console.log(JSON.stringify({ event: 'job_claimed', jobId: job.id, projectId: job.project_id }));
        await processJob(job);
      } else {
        await new Promise((resolve) => setTimeout(resolve, env.WORKER_POLL_MS));
      }
    } catch (error) {
      console.error(JSON.stringify({ event: 'worker_error', message: error instanceof Error ? error.message : String(error) }));
      await new Promise((resolve) => setTimeout(resolve, env.WORKER_POLL_MS));
    }
  }
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    shuttingDown = true;
    console.log(JSON.stringify({ event: 'worker_stopping', signal }));
  });
}

void main();
