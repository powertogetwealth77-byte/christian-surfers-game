import { execFile } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import path from 'node:path';
import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { env } from './config.js';
import type { MediaInfo } from './types.js';

const execFileAsync = promisify(execFile);

const ffprobeSchema = z.object({
  format: z.object({ duration: z.string().optional() }).passthrough(),
  streams: z.array(z.object({
    codec_type: z.string(),
    codec_name: z.string().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
    avg_frame_rate: z.string().optional(),
    tags: z.record(z.string(), z.string()).optional(),
    side_data_list: z.array(z.object({ rotation: z.number().optional() }).passthrough()).optional(),
  }).passthrough()),
});

function parseRate(value?: string): number {
  if (!value || value === '0/0') return 0;
  const [a, b] = value.split('/').map(Number);
  return b ? a / b : a;
}

export async function downloadSource(db: SupabaseClient, storagePath: string, jobDir: string): Promise<string> {
  await mkdir(jobDir, { recursive: true });
  const { data, error } = await db.storage.from(env.SOURCE_BUCKET).download(storagePath);
  if (error || !data) throw new Error(`SOURCE_DOWNLOAD_FAILED: ${error?.message ?? 'empty response'}`);
  const localPath = path.join(jobDir, path.basename(storagePath));
  await writeFile(localPath, Buffer.from(await data.arrayBuffer()));
  return localPath;
}

export async function inspectMedia(inputPath: string): Promise<MediaInfo> {
  const { stdout } = await execFileAsync('ffprobe', [
    '-v','error','-print_format','json','-show_format','-show_streams',inputPath,
  ], { maxBuffer: 10 * 1024 * 1024 });
  const parsed = ffprobeSchema.parse(JSON.parse(stdout));
  const video = parsed.streams.find((stream) => stream.codec_type === 'video');
  const audio = parsed.streams.find((stream) => stream.codec_type === 'audio');
  const durationSeconds = Number(parsed.format.duration ?? 0);
  if (!video || !Number.isFinite(durationSeconds) || durationSeconds <= 0) throw new Error('MEDIA_CORRUPTED');
  if (!audio) throw new Error('AUDIO_MISSING');
  if (durationSeconds > env.MAX_VIDEO_DURATION_SECONDS) throw new Error('VIDEO_TOO_LONG');
  const rotation = Number(video.side_data_list?.find((item) => item.rotation != null)?.rotation ?? video.tags?.rotate ?? 0);
  return {
    durationSeconds,
    width: video.width ?? 0,
    height: video.height ?? 0,
    frameRate: parseRate(video.avg_frame_rate),
    rotation: Number.isFinite(rotation) ? rotation : 0,
    videoCodec: video.codec_name ?? 'unknown',
    audioCodec: audio.codec_name ?? null,
    hasAudio: true,
  };
}

export async function extractAudio(inputPath: string, outputPath: string): Promise<void> {
  await execFileAsync('ffmpeg', [
    '-y','-v','error','-i',inputPath,'-vn','-ac','1','-ar','16000','-c:a','pcm_s16le',outputPath,
  ], { maxBuffer: 10 * 1024 * 1024 });
}

export async function renderVerticalPreview(args: {
  inputPath: string;
  outputPath: string;
  startSeconds: number;
  durationSeconds: number;
  watermarked: boolean;
}): Promise<void> {
  const filters = [
    'scale=720:1280:force_original_aspect_ratio=increase',
    'crop=720:1280',
  ];
  if (args.watermarked) {
    filters.push("drawtext=text='Viral Clipz AI':x=w-tw-24:y=h-th-24:fontsize=24:fontcolor=white@0.75:box=1:boxcolor=black@0.35:boxborderw=10");
  }
  await execFileAsync('ffmpeg', [
    '-y','-v','error','-ss',String(args.startSeconds),'-i',args.inputPath,
    '-t',String(args.durationSeconds),'-vf',filters.join(','),
    '-c:v','libx264','-preset','veryfast','-crf','24','-pix_fmt','yuv420p',
    '-c:a','aac','-b:a','128k','-movflags','+faststart',args.outputPath,
  ], { maxBuffer: 20 * 1024 * 1024 });
}

export async function extractThumbnail(inputPath: string, outputPath: string, atSeconds: number): Promise<void> {
  await execFileAsync('ffmpeg', [
    '-y','-v','error','-ss',String(atSeconds),'-i',inputPath,'-frames:v','1','-vf','scale=720:-2',outputPath,
  ], { maxBuffer: 10 * 1024 * 1024 });
}
