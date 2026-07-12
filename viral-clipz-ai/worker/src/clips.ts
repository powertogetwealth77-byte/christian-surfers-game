import type { ClipCandidate, NormalizedTranscript } from './types.js';

const weightProfiles: Record<string, Partial<Record<keyof ClipCandidate['scores'], number>>> = {
  maximize_reach: { hookStrength: 0.24, retentionPotential: 0.22, novelty: 0.18, emotionalImpact: 0.16, clarity: 0.1, contextCompleteness: 0.1 },
  generate_leads: { audienceRelevance: 0.22, leadPotential: 0.24, authorityValue: 0.18, conversionPotential: 0.16, clarity: 0.1, contextCompleteness: 0.1 },
  sell_offer: { conversionPotential: 0.28, audienceRelevance: 0.18, clarity: 0.14, authorityValue: 0.14, contextCompleteness: 0.14, hookStrength: 0.12 },
  build_authority: { authorityValue: 0.28, clarity: 0.2, contextCompleteness: 0.18, audienceRelevance: 0.14, retentionPotential: 0.1, hookStrength: 0.1 },
  drive_comments: { emotionalImpact: 0.22, novelty: 0.2, hookStrength: 0.2, retentionPotential: 0.16, audienceRelevance: 0.12, clarity: 0.1 },
  promote_event: { conversionPotential: 0.24, emotionalImpact: 0.2, audienceRelevance: 0.2, hookStrength: 0.14, clarity: 0.12, contextCompleteness: 0.1 },
  teach_idea: { clarity: 0.27, contextCompleteness: 0.23, authorityValue: 0.18, retentionPotential: 0.12, audienceRelevance: 0.1, hookStrength: 0.1 },
  inspire: { emotionalImpact: 0.28, retentionPotential: 0.18, hookStrength: 0.16, audienceRelevance: 0.14, novelty: 0.12, contextCompleteness: 0.12 },
  podcast_highlights: { hookStrength: 0.2, retentionPotential: 0.2, emotionalImpact: 0.18, novelty: 0.16, contextCompleteness: 0.14, clarity: 0.12 },
};

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

function textSignals(text: string) {
  const lower = text.toLowerCase();
  const words = text.trim().split(/\s+/).filter(Boolean);
  const hasQuestion = /\?/.test(text);
  const hasNumber = /\b\d+\b/.test(text);
  const hasPromise = /\b(how|why|secret|mistake|truth|best|worst|never|always|can|will|transform|improve|increase|save|grow)\b/.test(lower);
  const hasPain = /\b(problem|fails?|struggle|pain|cost|lose|waste|mistake|risk)\b/.test(lower);
  const hasAction = /\b(do|start|stop|use|build|create|follow|download|book|buy|join)\b/.test(lower);
  const hasSpecificity = hasNumber || /\b(because|when|instead|first|second|one|three|five)\b/.test(lower);
  return { words, hasQuestion, hasNumber, hasPromise, hasPain, hasAction, hasSpecificity };
}

function scoreCandidate(text: string, duration: number, objective: string): ClipCandidate['scores'] {
  const s = textSignals(text);
  const lengthScore = clamp(100 - Math.abs(duration - 38) * 1.6);
  const hookStrength = clamp(48 + (s.hasQuestion ? 16 : 0) + (s.hasPromise ? 18 : 0) + (s.hasPain ? 10 : 0));
  const retentionPotential = clamp(lengthScore * 0.55 + hookStrength * 0.45);
  const clarity = clamp(55 + (s.hasSpecificity ? 18 : 0) + (s.words.length >= 15 && s.words.length <= 120 ? 14 : 0));
  const emotionalImpact = clamp(42 + (s.hasPain ? 20 : 0) + (s.hasPromise ? 14 : 0) + (s.hasQuestion ? 8 : 0));
  const novelty = clamp(45 + (s.hasNumber ? 16 : 0) + (s.hasQuestion ? 12 : 0) + (/\b(instead|truth|secret|contrary|actually)\b/i.test(text) ? 18 : 0));
  const audienceRelevance = clamp(52 + (s.hasPain ? 18 : 0) + (s.hasPromise ? 16 : 0));
  const leadPotential = clamp(40 + (s.hasAction ? 24 : 0) + (s.hasPain ? 18 : 0) + (s.hasPromise ? 12 : 0));
  const authorityValue = clamp(50 + (s.hasSpecificity ? 20 : 0) + (/\b(because|therefore|means|example|result)\b/i.test(text) ? 14 : 0));
  const conversionPotential = clamp(38 + (s.hasAction ? 26 : 0) + (s.hasPromise ? 18 : 0) + (s.hasPain ? 12 : 0));
  const contextCompleteness = clamp(54 + (/[.!?]$/.test(text.trim()) ? 18 : 0) + (s.words.length >= 25 ? 12 : 0));
  const riskPenalty = clamp((s.words.length < 12 ? 25 : 0) + (duration < 12 ? 20 : 0));
  const base = { hookStrength, retentionPotential, clarity, emotionalImpact, novelty, audienceRelevance, leadPotential, authorityValue, conversionPotential, contextCompleteness, riskPenalty, overall: 0 };
  const weights = weightProfiles[objective] ?? weightProfiles.maximize_reach;
  const weighted = Object.entries(weights).reduce((sum, [key, weight]) => sum + Number(base[key as keyof typeof base]) * Number(weight), 0);
  base.overall = clamp(weighted - riskPenalty * 0.35);
  return base;
}

function titleFrom(text: string): string {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  const first = cleaned.split(/[.!?]/)[0].trim();
  return first.length <= 72 ? first : `${first.slice(0, 69).trim()}…`;
}

export function generateCandidates(transcript: NormalizedTranscript, objective: string, minSeconds = 20, maxSeconds = 60): ClipCandidate[] {
  const candidates: ClipCandidate[] = [];
  for (let startIndex = 0; startIndex < transcript.segments.length; startIndex++) {
    let text = '';
    for (let endIndex = startIndex; endIndex < transcript.segments.length; endIndex++) {
      const start = transcript.segments[startIndex].startSeconds;
      const end = transcript.segments[endIndex].endSeconds;
      const duration = end - start;
      if (duration > maxSeconds) break;
      text = `${text} ${transcript.segments[endIndex].text}`.trim();
      if (duration >= minSeconds) {
        candidates.push({ startSeconds: start, endSeconds: end, text, title: titleFrom(text), scores: scoreCandidate(text, duration, objective) });
      }
    }
  }
  if (!candidates.length && transcript.segments.length) {
    const first = transcript.segments[0];
    const last = transcript.segments[Math.min(transcript.segments.length - 1, 3)];
    const text = transcript.segments.slice(0, 4).map((segment) => segment.text).join(' ');
    candidates.push({ startSeconds: first.startSeconds, endSeconds: last.endSeconds, text, title: titleFrom(text), scores: scoreCandidate(text, last.endSeconds - first.startSeconds, objective) });
  }
  return candidates.sort((a, b) => b.scores.overall - a.scores.overall);
}

function overlapRatio(a: ClipCandidate, b: ClipCandidate): number {
  const overlap = Math.max(0, Math.min(a.endSeconds, b.endSeconds) - Math.max(a.startSeconds, b.startSeconds));
  return overlap / Math.min(a.endSeconds - a.startSeconds, b.endSeconds - b.startSeconds);
}

export function selectDiverseCandidates(candidates: ClipCandidate[], desiredCount: number): ClipCandidate[] {
  const selected: ClipCandidate[] = [];
  for (const candidate of candidates) {
    if (selected.every((existing) => overlapRatio(existing, candidate) < 0.45 && existing.title !== candidate.title)) {
      selected.push(candidate);
    }
    if (selected.length >= desiredCount) break;
  }
  if (!selected.length && candidates.length) selected.push(candidates[0]);
  return selected;
}

export function weightProfileFor(objective: string) {
  return weightProfiles[objective] ?? weightProfiles.maximize_reach;
}
