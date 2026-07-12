import test from 'node:test';
import assert from 'node:assert/strict';
import { generateCandidates, selectDiverseCandidates } from './clips.js';
import type { NormalizedTranscript } from './types.js';

const transcript: NormalizedTranscript = {
  provider: 'fixture',
  language: 'en',
  confidence: 1,
  durationSeconds: 80,
  fullText: 'fixture',
  segments: [
    { sequence: 0, startSeconds: 0, endSeconds: 12, text: 'Most businesses lose leads because they wait too long to follow up.', confidence: 1, speaker: null, words: [] },
    { sequence: 1, startSeconds: 12, endSeconds: 25, text: 'The better approach is to answer immediately and give the prospect one clear next step.', confidence: 1, speaker: null, words: [] },
    { sequence: 2, startSeconds: 25, endSeconds: 39, text: 'That change can save time, reduce missed opportunities, and create a stronger customer experience.', confidence: 1, speaker: null, words: [] },
    { sequence: 3, startSeconds: 39, endSeconds: 54, text: 'Here is the truth: one focused system usually beats five disconnected tools.', confidence: 1, speaker: null, words: [] },
    { sequence: 4, startSeconds: 54, endSeconds: 68, text: 'Start by fixing the first response, then measure how many qualified conversations become appointments.', confidence: 1, speaker: null, words: [] },
  ],
};

test('objective changes can alter candidate ranking', () => {
  const reach = generateCandidates(transcript, 'maximize_reach', 20, 45);
  const leads = generateCandidates(transcript, 'generate_leads', 20, 45);
  assert.ok(reach.length >= 2);
  assert.ok(leads.length >= 2);
  const reachScores = reach.map((candidate) => candidate.scores.overall);
  const leadScores = leads.map((candidate) => candidate.scores.overall);
  assert.notDeepEqual(reachScores, leadScores);
});

test('selected clips avoid heavy timestamp overlap', () => {
  const candidates = generateCandidates(transcript, 'generate_leads', 20, 45);
  const selected = selectDiverseCandidates(candidates, 3);
  assert.ok(selected.length >= 2);
  for (let i = 0; i < selected.length; i++) {
    for (let j = i + 1; j < selected.length; j++) {
      const overlap = Math.max(0, Math.min(selected[i].endSeconds, selected[j].endSeconds) - Math.max(selected[i].startSeconds, selected[j].startSeconds));
      const smaller = Math.min(selected[i].endSeconds - selected[i].startSeconds, selected[j].endSeconds - selected[j].startSeconds);
      assert.ok(overlap / smaller < 0.45);
    }
  }
});

test('candidate boundaries remain within transcript duration', () => {
  const candidates = generateCandidates(transcript, 'teach_idea', 20, 45);
  assert.ok(candidates.every((candidate) => candidate.startSeconds >= 0));
  assert.ok(candidates.every((candidate) => candidate.endSeconds <= transcript.durationSeconds));
  assert.ok(candidates.every((candidate) => candidate.endSeconds > candidate.startSeconds));
});
