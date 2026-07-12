import { createClient } from '@supabase/supabase-js';
import { env } from './config.js';
import { executePipeline } from './pipeline.js';
import type { ClaimedJob } from './types.js';

const db = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

let shuttingDown = false;

const sleep = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

function errorCode(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const prefix = message.split(':')[0].trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
  return prefix || 'INTERNAL_ERROR';
}

function isPermanent(code: string) {
  return new Set([
    'INVALID_SOURCE','PROJECT_NOT_FOUND','MEDIA_CORRUPTED','AUDIO_MISSING',
    'VIDEO_TOO_LONG','INVALID_MEDIA_TYPE','FILE_TOO_LARGE','UNSUPPORTED_CODEC',
  ]).has(code);
}

async function failJob(job: ClaimedJob, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const code = errorCode(error);
  const retryable = !isPermanent(code) && job.attempt_count < job.maximum_attempts;
  const terminalStatus = retryable ? 'retrying' : 'dead_letter';
  const { error: jobError } = await db.from('processing_jobs').update({
    status: terminalStatus,
    error_code: code,
    error_message: message.slice(0, 2000),
    heartbeat_at: new Date().toISOString(),
    claimed_by: retryable ? null : env.WORKER_ID,
  }).eq('id', job.id).eq('claimed_by', env.WORKER_ID);
  if (jobError) console.error(JSON.stringify({ event: 'job_failure_persist_error', jobId: job.id, message: jobError.message }));
  if (!retryable) {
    await db.from('projects').update({ status: 'failed', error_code: code, error_message: message.slice(0, 2000) }).eq('id', job.project_id);
  }
  console.error(JSON.stringify({ event: 'job_failed', jobId: job.id, projectId: job.project_id, code, retryable, message }));
}

async function processClaimedJob(job: ClaimedJob) {
  console.log(JSON.stringify({ event: 'job_claimed', jobId: job.id, projectId: job.project_id, attempt: job.attempt_count }));
  let timer: NodeJS.Timeout | undefined;
  try {
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('JOB_TIMEOUT')), env.WORKER_JOB_TIMEOUT_MS);
    });
    const result = await Promise.race([executePipeline(db, job), timeout]);
    console.log(JSON.stringify({ event: 'job_completed', jobId: job.id, ...result }));
  } catch (error) {
    await failJob(job, error);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function claimNextJob(): Promise<ClaimedJob | null> {
  const { data, error } = await db.rpc('claim_next_processing_job', { p_worker_id: env.WORKER_ID });
  if (error) throw error;
  return data && typeof data === 'object' && 'id' in data ? data as ClaimedJob : null;
}

async function main() {
  console.log(JSON.stringify({
    event: 'worker_started',
    workerId: env.WORKER_ID,
    transcriptionProvider: env.TRANSCRIPTION_PROVIDER,
    pollMs: env.WORKER_POLL_MS,
  }));
  while (!shuttingDown) {
    try {
      const job = await claimNextJob();
      if (job) await processClaimedJob(job);
      else await sleep(env.WORKER_POLL_MS);
    } catch (error) {
      console.error(JSON.stringify({ event: 'worker_error', message: error instanceof Error ? error.message : String(error) }));
      await sleep(env.WORKER_POLL_MS);
    }
  }
  console.log(JSON.stringify({ event: 'worker_stopped', workerId: env.WORKER_ID }));
}

for (const signal of ['SIGINT','SIGTERM'] as const) {
  process.on(signal, () => {
    shuttingDown = true;
    console.log(JSON.stringify({ event: 'worker_stopping', signal }));
  });
}

void main();
