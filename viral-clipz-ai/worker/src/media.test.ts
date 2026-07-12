import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

process.env.SUPABASE_URL ??= 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY ??= 'test-service-role-key-that-is-long-enough';
process.env.TRANSCRIPTION_PROVIDER ??= 'fixture';

const execFileAsync = promisify(execFile);

test('ffprobe, audio extraction, and vertical preview work on generated media', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'viral-clipz-media-'));
  try {
    const source = path.join(directory, 'source.mp4');
    const audio = path.join(directory, 'audio.wav');
    const preview = path.join(directory, 'preview.mp4');
    const thumbnail = path.join(directory, 'thumbnail.jpg');

    await execFileAsync('ffmpeg', [
      '-y','-v','error',
      '-f','lavfi','-i','testsrc=size=1280x720:rate=30',
      '-f','lavfi','-i','sine=frequency=880:sample_rate=44100',
      '-t','6','-c:v','libx264','-pix_fmt','yuv420p','-c:a','aac','-shortest',source,
    ]);

    const { inspectMedia, extractAudio, renderVerticalPreview, extractThumbnail } = await import('./media.js');
    const info = await inspectMedia(source);
    assert.ok(info.durationSeconds >= 5.5);
    assert.equal(info.width, 1280);
    assert.equal(info.height, 720);
    assert.equal(info.hasAudio, true);

    await extractAudio(source, audio);
    await renderVerticalPreview({ inputPath: source, outputPath: preview, startSeconds: 0, durationSeconds: 4, watermarked: true });
    await extractThumbnail(source, thumbnail, 1);

    assert.ok((await stat(audio)).size > 1_000);
    assert.ok((await stat(preview)).size > 1_000);
    assert.ok((await stat(thumbnail)).size > 100);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
