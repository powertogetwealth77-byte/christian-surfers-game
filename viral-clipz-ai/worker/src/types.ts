export interface ClaimedJob {
  id: string;
  project_id: string;
  attempt_count: number;
  maximum_attempts: number;
  input_payload: {
    sourceVideoId?: string;
    storagePath?: string;
  };
}

export interface MediaInfo {
  durationSeconds: number;
  width: number;
  height: number;
  frameRate: number;
  rotation: number;
  videoCodec: string;
  audioCodec: string | null;
  hasAudio: boolean;
}

export interface TranscriptSegment {
  sequence: number;
  startSeconds: number;
  endSeconds: number;
  text: string;
  confidence: number | null;
  speaker: string | null;
  words: Array<{ word: string; start: number; end: number; confidence?: number }>;
}

export interface NormalizedTranscript {
  provider: string;
  language: string | null;
  confidence: number | null;
  fullText: string;
  durationSeconds: number;
  segments: TranscriptSegment[];
}

export interface ClipCandidate {
  startSeconds: number;
  endSeconds: number;
  text: string;
  title: string;
  scores: {
    hookStrength: number;
    retentionPotential: number;
    clarity: number;
    emotionalImpact: number;
    novelty: number;
    audienceRelevance: number;
    leadPotential: number;
    authorityValue: number;
    conversionPotential: number;
    contextCompleteness: number;
    riskPenalty: number;
    overall: number;
  };
}

export interface ProjectContext {
  id: string;
  workspaceId: string;
  createdBy: string;
  objective: string;
  title: string;
  settings: Record<string, any>;
}
