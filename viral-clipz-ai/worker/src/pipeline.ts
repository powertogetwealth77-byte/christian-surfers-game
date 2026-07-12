import { mkdir, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import type { SupabaseClient } from '@supabase/supabase-js';
import { env } from './config.js';
import { generateCandidates, selectDiverseCandidates, weightProfileFor } from './clips.js';
import { downloadSource, extractAudio, extractThumbnail, inspectMedia, renderVerticalPreview } from './media.js';
import { transcribe } from './transcription.js';
import type { ClaimedJob, ClipCandidate, ProjectContext } from './types.js';

async function heartbeat(db: SupabaseClient, jobId: string, stage: string, progress: number, message: string) {
  const { data, error } = await db.rpc('heartbeat_processing_job', {
    p_job_id: jobId,
    p_worker_id: env.WORKER_ID,
    p_stage: stage,
    p_progress: progress,
    p_message: message,
  });
  if (error) throw error;
  if (!data) throw new Error('JOB_CLAIM_LOST');
}

async function loadContext(db: SupabaseClient, job: ClaimedJob) {
  const sourceId = job.input_payload?.sourceVideoId;
  if (!sourceId) throw new Error('INVALID_SOURCE');
  const [{ data: project, error: projectError }, { data: source, error: sourceError }] = await Promise.all([
    db.from('projects').select('*').eq('id', job.project_id).single(),
    db.from('source_videos').select('*').eq('id', sourceId).eq('project_id', job.project_id).single(),
  ]);
  if (projectError || !project) throw new Error(`PROJECT_NOT_FOUND: ${projectError?.message ?? ''}`);
  if (sourceError || !source?.storage_path) throw new Error(`INVALID_SOURCE: ${sourceError?.message ?? ''}`);
  const context: ProjectContext = {
    id: project.id,
    workspaceId: project.workspace_id,
    objective: project.objective,
    title: project.title,
    settings: project.processing_settings ?? {},
  };
  return { context, source };
}

async function persistTranscript(db: SupabaseClient, sourceVideoId: string, normalized: Awaited<ReturnType<typeof transcribe>>) {
  const { data: transcript, error } = await db.from('transcripts').upsert({
    source_video_id: sourceVideoId,
    provider: normalized.provider,
    detected_language: normalized.language,
    full_text: normalized.fullText,
    confidence: normalized.confidence,
    word_count: normalized.fullText.split(/\s+/).filter(Boolean).length,
    duration_seconds: normalized.durationSeconds,
  }, { onConflict: 'source_video_id' }).select('id').single();
  if (error || !transcript) throw new Error(`TRANSCRIPT_PERSIST_FAILED: ${error?.message ?? ''}`);
  const { error: deleteError } = await db.from('transcript_segments').delete().eq('transcript_id', transcript.id);
  if (deleteError) throw deleteError;
  const rows = normalized.segments.map((segment) => ({
    transcript_id: transcript.id,
    sequence_number: segment.sequence,
    start_seconds: segment.startSeconds,
    end_seconds: segment.endSeconds,
    speaker_label: segment.speaker,
    text: segment.text,
    confidence: segment.confidence,
    words_json: segment.words,
  }));
  if (rows.length) {
    const { error: segmentError } = await db.from('transcript_segments').insert(rows);
    if (segmentError) throw new Error(`SEGMENT_PERSIST_FAILED: ${segmentError.message}`);
  }
  return transcript.id;
}

function strategyFor(candidate: ClipCandidate, platform: string) {
  return {
    hookAnalysis: `The opening earns attention through a ${candidate.scores.hookStrength >= 75 ? 'strong' : 'clear'} promise or tension point.`,
    audienceRelevance: `The selected moment stays focused on one viewer problem and one useful takeaway.`,
    emotionalTrigger: candidate.scores.emotionalImpact >= 70 ? 'Tension followed by a practical transformation.' : 'Clarity and usefulness.',
    curiosityMechanism: 'The clip introduces an unresolved idea and pays it off within the same segment.',
    retentionRisk: candidate.scores.contextCompleteness < 65 ? 'May need one sentence of setup in the editor.' : 'Low; the thought is substantially self-contained.',
    bestPlatform: platform,
    postingAngle: 'Lead with the strongest sentence as on-screen text, then deliver the explanation without a long introduction.',
    suggestedCta: 'Follow for more practical breakdowns.',
    improvement: 'Trim pauses before the first meaningful sentence and emphasize the key phrase in captions.',
  };
}

function copyPackage(candidate: ClipCandidate) {
  const excerpt = candidate.text.replace(/\s+/g, ' ').trim();
  const short = excerpt.length > 170 ? `${excerpt.slice(0, 167).trim()}…` : excerpt;
  return {
    hooks: [candidate.title, `The mistake most people make: ${candidate.title.toLowerCase()}`, `Here is the better way to think about it.`],
    titles: [candidate.title, `Why this idea matters`, `The faster path to a better result`],
    captions: [short, `${short}\n\nSave this and share it with someone who needs it.`],
    ctas: ['Follow for more practical insights.', 'Save this for your next content session.', 'Comment “CLIP” if this helped.'],
    hashtags: {
      instagram_reels: ['#contentcreator','#videomarketing','#shortformvideo'],
      tiktok: ['#creatortips','#contentstrategy','#videotips'],
      youtube_shorts: ['#shorts','#contentmarketing','#creator'],
    },
    thumbnails: [candidate.title.slice(0, 42), 'STOP DOING THIS', 'THE BETTER WAY'],
    strategy: { text: 'Post the strongest version first, then test a second hook against the same core clip.', postingTime: null },
  };
}

async function persistClips(db: SupabaseClient, context: ProjectContext, sourceVideoId: string, selected: ClipCandidate[]) {
  const { error: deleteError } = await db.from('clips').delete().eq('project_id', context.id);
  if (deleteError) throw deleteError;
  const inserted: Array<{ id: string; candidate: ClipCandidate; platform: string }> = [];
  for (let index = 0; index < selected.length; index++) {
    const candidate = selected[index];
    const platform = context.objective === 'build_authority' ? 'linkedin' : context.objective === 'podcast_highlights' ? 'youtube_shorts' : 'instagram_reels';
    const { data: clip, error } = await db.from('clips').insert({
      project_id: context.id,
      source_video_id: sourceVideoId,
      title: candidate.title || `Clip ${index + 1}`,
      start_seconds: candidate.startSeconds,
      end_seconds: candidate.endSeconds,
      status: index === 0 ? 'recommended' : 'alternative',
      rank: index + 1,
      objective: context.objective,
      recommended_platform: platform,
      aspect_ratio: context.settings?.config?.aspectRatio ?? '9:16',
      transcript_excerpt: candidate.text,
      ai_summary: `Selected for ${context.objective.replaceAll('_',' ')} with an objective score of ${candidate.scores.overall}.`,
      edit_settings: context.settings?.config ?? {},
    }).select('id').single();
    if (error || !clip) throw new Error(`CLIP_PERSIST_FAILED: ${error?.message ?? ''}`);
    const scores = candidate.scores;
    const { error: scoreError } = await db.from('clip_scores').insert({
      clip_id: clip.id,
      overall_score: scores.overall,
      hook_strength: scores.hookStrength,
      retention_potential: scores.retentionPotential,
      clarity: scores.clarity,
      emotional_impact: scores.emotionalImpact,
      novelty: scores.novelty,
      audience_relevance: scores.audienceRelevance,
      lead_potential: scores.leadPotential,
      authority_value: scores.authorityValue,
      conversion_potential: scores.conversionPotential,
      context_completeness: scores.contextCompleteness,
      risk_penalty: scores.riskPenalty,
      explanation: `Objective-weighted deterministic score for ${context.objective.replaceAll('_',' ')}.`,
      strategy: strategyFor(candidate, platform),
      scoring_version: 'deterministic-v1',
      weight_profile: weightProfileFor(context.objective),
    });
    if (scoreError) throw scoreError;
    const copy = copyPackage(candidate);
    const copyRows = Object.entries(copy).map(([contentType, content]) => ({
      clip_id: clip.id,
      content_type: contentType,
      platform: contentType === 'hashtags' ? 'multi' : null,
      content,
      variation_number: 1,
    }));
    const { error: copyError } = await db.from('generated_copy').insert(copyRows);
    if (copyError) throw copyError;
    inserted.push({ id: clip.id, candidate, platform });
  }
  return inserted;
}

async function uploadFile(db: SupabaseClient, bucket: string, storagePath: string, localPath: string, contentType: string) {
  const body = await readFile(localPath);
  const { error } = await db.storage.from(bucket).upload(storagePath, body, { contentType, upsert: true });
  if (error) throw new Error(`OUTPUT_UPLOAD_FAILED: ${error.message}`);
}

export async function executePipeline(db: SupabaseClient, job: ClaimedJob) {
  const jobDir = path.join(env.TEMP_DIRECTORY, job.id);
  await mkdir(jobDir, { recursive: true });
  const { context, source } = await loadContext(db, job);
  try {
    await db.from('projects').update({ status: 'processing', error_code: null, error_message: null }).eq('id', context.id);
    await heartbeat(db, job.id, 'validate_source', 4, 'Validating private source video');
    const sourcePath = await downloadSource(db, source.storage_path, jobDir);

    await heartbeat(db, job.id, 'inspect_media', 12, 'Inspecting video and audio streams');
    const media = await inspectMedia(sourcePath);
    const { error: mediaError } = await db.from('source_videos').update({
      duration_seconds: media.durationSeconds,
      width: media.width,
      height: media.height,
      frame_rate: media.frameRate,
      rotation: media.rotation,
      codec: media.videoCodec,
      ingestion_status: 'validated',
      metadata: { audioCodec: media.audioCodec, hasAudio: media.hasAudio },
    }).eq('id', source.id);
    if (mediaError) throw mediaError;

    await heartbeat(db, job.id, 'extract_audio', 22, 'Extracting clean transcription audio');
    const audioPath = path.join(jobDir, 'audio.wav');
    await extractAudio(sourcePath, audioPath);

    await heartbeat(db, job.id, 'transcribe', 38, `Transcribing with ${env.TRANSCRIPTION_PROVIDER}`);
    const normalized = await transcribe(audioPath, media.durationSeconds);

    await heartbeat(db, job.id, 'normalize_transcript', 48, 'Persisting timestamped transcript');
    await persistTranscript(db, source.id, normalized);

    const config = context.settings?.config ?? {};
    await heartbeat(db, job.id, 'generate_candidates', 58, 'Finding complete clip-worthy moments');
    const candidates = generateCandidates(normalized, context.objective, Number(config.minLengthSec ?? 20), Number(config.maxLengthSec ?? 60));
    if (!candidates.length) throw new Error('ANALYSIS_FAILED: no valid clip candidates');

    await heartbeat(db, job.id, 'score_candidates', 72, `Scoring candidates for ${context.objective.replaceAll('_',' ')}`);
    const desired = Math.max(1, Math.min(10, Number(config.clipCount ?? 3)));
    const selected = selectDiverseCandidates(candidates, desired);

    await heartbeat(db, job.id, 'select_candidates', 82, `Selected ${selected.length} diverse clips`);
    const clips = await persistClips(db, context, source.id, selected);

    await heartbeat(db, job.id, 'render_previews', 90, 'Rendering vertical previews');
    for (const [index, clip] of clips.slice(0, 3).entries()) {
      const previewLocal = path.join(jobDir, `preview-${index + 1}.mp4`);
      const thumbLocal = path.join(jobDir, `thumb-${index + 1}.jpg`);
      const previewStorage = `${context.workspaceId}/${context.id}/${clip.id}/preview.mp4`;
      const thumbStorage = `${context.workspaceId}/${context.id}/${clip.id}/thumbnail.jpg`;
      await renderVerticalPreview({
        inputPath: sourcePath,
        outputPath: previewLocal,
        startSeconds: clip.candidate.startSeconds,
        durationSeconds: clip.candidate.endSeconds - clip.candidate.startSeconds,
        watermarked: true,
      });
      await extractThumbnail(sourcePath, thumbLocal, clip.candidate.startSeconds + 1);
      await Promise.all([
        uploadFile(db, env.OUTPUT_BUCKET, previewStorage, previewLocal, 'video/mp4'),
        uploadFile(db, env.OUTPUT_BUCKET, thumbStorage, thumbLocal, 'image/jpeg'),
      ]);
      const { error: clipUpdateError } = await db.from('clips').update({
        preview_storage_path: previewStorage,
        output_storage_path: previewStorage,
        thumbnail_storage_path: thumbStorage,
      }).eq('id', clip.id);
      if (clipUpdateError) throw clipUpdateError;
      const { error: assetError } = await db.from('clip_assets').upsert([
        { clip_id: clip.id, asset_type: 'render_720p', storage_path: previewStorage, mime_type: 'video/mp4', width: 720, height: 1280, duration_seconds: clip.candidate.endSeconds - clip.candidate.startSeconds, metadata: { watermarked: true } },
        { clip_id: clip.id, asset_type: 'thumbnail', storage_path: thumbStorage, mime_type: 'image/jpeg', width: 720, metadata: {} },
      ], { onConflict: 'clip_id,asset_type' });
      if (assetError) throw assetError;
    }

    await heartbeat(db, job.id, 'generate_copy', 96, 'Finalizing grounded content packages');
    const minutes = Math.max(1, Math.ceil(media.durationSeconds / 60));
    const { error: usageError } = await db.from('usage_ledger').upsert({
      workspace_id: context.workspaceId,
      project_id: context.id,
      usage_type: 'processing_minutes',
      quantity: minutes,
      unit: 'minute',
      direction: 'debit',
      status: 'settled',
      idempotency_key: `settle:${context.id}`,
      reference_id: job.id,
      metadata: { verifiedDurationSeconds: media.durationSeconds },
    }, { onConflict: 'idempotency_key', ignoreDuplicates: true });
    if (usageError) throw usageError;

    await heartbeat(db, job.id, 'finalize_assets', 99, 'Publishing results to your workspace');
    const completedAt = new Date().toISOString();
    const { error: jobError } = await db.from('processing_jobs').update({
      status: 'completed', current_stage: 'complete', progress_percent: 100,
      completed_at: completedAt, heartbeat_at: completedAt,
      output_payload: { message: 'processing complete', mode: env.TRANSCRIPTION_PROVIDER, clipCount: clips.length },
    }).eq('id', job.id).eq('claimed_by', env.WORKER_ID);
    if (jobError) throw jobError;
    const { error: projectError } = await db.from('projects').update({ status: 'review_ready', completed_at: completedAt }).eq('id', context.id);
    if (projectError) throw projectError;
    await db.from('notifications').insert({
      user_id: source.created_by ?? null,
      workspace_id: context.workspaceId,
      type: 'processing_complete',
      title: 'Your clips are ready',
      body: `${clips.length} ranked clips were created from ${context.title}.`,
      metadata: { projectId: context.id },
    }).then(() => undefined);
    return { projectId: context.id, clipCount: clips.length, provider: normalized.provider };
  } finally {
    await rm(jobDir, { recursive: true, force: true });
  }
}
