import { supabase } from '@/lib/supabase';

export interface LocalVideoSource {
  uri?: string;
  fileName?: string;
  mimeType?: string;
  sizeBytes?: number;
}

interface PreparedUpload {
  sourceVideoId: string;
  bucket: string;
  path: string;
}

export async function uploadProjectSource(projectId: string, source: LocalVideoSource): Promise<string | null> {
  if (!supabase) return null;
  if (!source.uri) throw new Error('INVALID_SOURCE: No local video URI was provided.');

  const response = await fetch(source.uri);
  if (!response.ok) throw new Error(`UPLOAD_FAILED: Could not read selected video (${response.status}).`);
  const arrayBuffer = await response.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  const sizeBytes = source.sizeBytes ?? bytes.byteLength;
  const fileName = source.fileName ?? `source-${Date.now()}.mp4`;
  const mimeType = source.mimeType ?? response.headers.get('content-type') ?? 'video/mp4';

  const { data: prepared, error: prepareError } = await supabase.rpc('prepare_source_upload', {
    p_project_id: projectId,
    p_filename: fileName,
    p_mime_type: mimeType,
    p_byte_size: sizeBytes,
  });
  if (prepareError || !prepared) {
    throw new Error(`UPLOAD_PREPARE_FAILED: ${prepareError?.message ?? 'No upload destination returned.'}`);
  }

  const target = prepared as unknown as PreparedUpload;
  const { error: uploadError } = await supabase.storage
    .from(target.bucket)
    .upload(target.path, bytes, { contentType: mimeType, upsert: true });
  if (uploadError) throw new Error(`UPLOAD_FAILED: ${uploadError.message}`);

  const { data: jobId, error: completeError } = await supabase.rpc('complete_source_upload', {
    p_project_id: projectId,
    p_source_video_id: target.sourceVideoId,
  });
  if (completeError || !jobId) {
    throw new Error(`UPLOAD_COMPLETE_FAILED: ${completeError?.message ?? 'Processing job was not created.'}`);
  }

  return jobId as string;
}
