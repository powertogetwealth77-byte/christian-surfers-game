import { readFile } from 'node:fs/promises';
import { z } from 'zod';
import { env } from './config.js';
import type { NormalizedTranscript, TranscriptSegment } from './types.js';

const deepgramSchema = z.object({
  metadata: z.object({ duration: z.number().optional() }).passthrough().optional(),
  results: z.object({
    channels: z.array(z.object({
      alternatives: z.array(z.object({
        transcript: z.string(),
        confidence: z.number().optional(),
        words: z.array(z.object({
          word: z.string(),
          punctuated_word: z.string().optional(),
          start: z.number(),
          end: z.number(),
          confidence: z.number().optional(),
          speaker: z.number().optional(),
        }).passthrough()).default([]),
      })).min(1),
    })).min(1),
  }),
});

function wordsToSegments(words: Array<{ word: string; punctuated_word?: string; start: number; end: number; confidence?: number; speaker?: number }>): TranscriptSegment[] {
  if (!words.length) return [];
  const segments: TranscriptSegment[] = [];
  let current = words.slice(0, 1);
  const pushCurrent = () => {
    if (!current.length) return;
    const first = current[0];
    const last = current[current.length - 1];
    segments.push({
      sequence: segments.length,
      startSeconds: first.start,
      endSeconds: last.end,
      text: current.map((item) => item.punctuated_word ?? item.word).join(' '),
      confidence: current.reduce((sum, item) => sum + (item.confidence ?? 0), 0) / current.length || null,
      speaker: last.speaker == null ? null : `Speaker ${last.speaker + 1}`,
      words: current.map((item) => ({ word: item.punctuated_word ?? item.word, start: item.start, end: item.end, confidence: item.confidence })),
    });
  };
  for (const word of words.slice(1)) {
    const previous = current[current.length - 1];
    const speakerChanged = word.speaker !== previous.speaker;
    const tooLong = word.end - current[0].start >= 12;
    const sentenceEnded = /[.!?]$/.test(previous.punctuated_word ?? previous.word);
    if (speakerChanged || tooLong || sentenceEnded) {
      pushCurrent();
      current = [word];
    } else current.push(word);
  }
  pushCurrent();
  return segments.filter((segment) => segment.endSeconds > segment.startSeconds && segment.text.trim());
}

async function transcribeDeepgram(audioPath: string): Promise<NormalizedTranscript> {
  const body = await readFile(audioPath);
  const response = await fetch('https://api.deepgram.com/v1/listen?model=nova-3&smart_format=true&punctuate=true&utterances=true&diarize=true', {
    method: 'POST',
    headers: {
      Authorization: `Token ${env.DEEPGRAM_API_KEY}`,
      'Content-Type': 'audio/wav',
    },
    body,
  });
  if (!response.ok) throw new Error(`TRANSCRIPTION_FAILED: Deepgram ${response.status}`);
  const parsed = deepgramSchema.parse(await response.json());
  const alternative = parsed.results.channels[0].alternatives[0];
  const segments = wordsToSegments(alternative.words);
  if (!alternative.transcript.trim() || !segments.length) throw new Error('TRANSCRIPTION_FAILED: empty transcript');
  return {
    provider: 'deepgram',
    language: null,
    confidence: alternative.confidence ?? null,
    fullText: alternative.transcript.trim(),
    durationSeconds: parsed.metadata?.duration ?? segments[segments.length - 1].endSeconds,
    segments,
  };
}

function fixtureTranscript(durationSeconds: number): NormalizedTranscript {
  const sourceText = [
    'Most content fails because the opening takes too long to reach the real promise.',
    'The stronger approach is to name the audience problem immediately and then show a specific transformation.',
    'When the viewer understands what they will gain, retention improves and the call to action feels natural.',
    'One long video can become several focused clips when each clip owns one complete idea.',
  ];
  const safeDuration = Math.max(1, durationSeconds);
  const segmentCount = Math.max(1, Math.min(sourceText.length, Math.floor(safeDuration / 3) || 1));
  const text = sourceText.slice(0, segmentCount);
  const segmentLength = safeDuration / segmentCount;
  const segments = text.map((value, index) => ({
    sequence: index,
    startSeconds: index * segmentLength,
    endSeconds: Math.max(index * segmentLength + 0.25, Math.min(safeDuration, (index + 1) * segmentLength)),
    text: value,
    confidence: 1,
    speaker: 'Fixture Speaker',
    words: [],
  }));
  return {
    provider: 'fixture',
    language: 'en',
    confidence: 1,
    fullText: text.join(' '),
    durationSeconds: safeDuration,
    segments,
  };
}

export async function transcribe(audioPath: string, durationSeconds: number): Promise<NormalizedTranscript> {
  return env.TRANSCRIPTION_PROVIDER === 'deepgram'
    ? transcribeDeepgram(audioPath)
    : fixtureTranscript(durationSeconds);
}
