import { z } from 'zod';

const schema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  WORKER_ID: z.string().min(1).default(`worker-${process.pid}`),
  WORKER_POLL_MS: z.coerce.number().int().min(500).default(3000),
  WORKER_JOB_TIMEOUT_MS: z.coerce.number().int().min(60_000).default(1_800_000),
  TEMP_DIRECTORY: z.string().default('/tmp/viral-clipz'),
  SOURCE_BUCKET: z.string().default('viral-clipz-sources'),
  OUTPUT_BUCKET: z.string().default('viral-clipz-outputs'),
  TRANSCRIPTION_PROVIDER: z.enum(['deepgram','fixture']).default('fixture'),
  DEEPGRAM_API_KEY: z.string().optional(),
  MAX_VIDEO_DURATION_SECONDS: z.coerce.number().positive().default(10_800),
});

export const env = schema.parse(process.env);

if (env.TRANSCRIPTION_PROVIDER === 'deepgram' && !env.DEEPGRAM_API_KEY) {
  throw new Error('CONFIGURATION_ERROR: DEEPGRAM_API_KEY is required when TRANSCRIPTION_PROVIDER=deepgram');
}
