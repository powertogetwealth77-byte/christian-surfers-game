import { create } from 'zustand';
import type { AspectRatio, CaptionStyle, ClipObjective, SourceKind } from '@/types/entities';

/**
 * Draft state for the multi-step Create Project wizard.
 * Kept in a store (not per-screen state) so steps can navigate freely
 * and the review step reads one source of truth.
 */

export interface SourceDraft {
  kind: SourceKind;
  url?: string;
  fileName?: string;
  durationSec?: number;
  title: string;
}

export interface AudienceDraft {
  targetAudience: string;
  painPoint: string;
  transformation: string;
  tone: string;
  prioritizeTopics: string;
  avoidTopics: string;
}

export interface ConfigDraft {
  autoSelect: boolean;
  clipCount: number;
  minLengthSec: number;
  maxLengthSec: number;
  aspectRatio: AspectRatio;
  captionStyle: CaptionStyle;
  speakerTracking: boolean;
  emojiLevel: 'none' | 'light' | 'expressive';
  profanityFilter: boolean;
  removeFillerWords: boolean;
  removeSilence: boolean;
  autoZoom: boolean;
  brollSuggestions: boolean;
  defaultCta: string;
  brandKitId: string | null;
}

interface CreateFlowState {
  source: SourceDraft | null;
  objective: ClipObjective | null;
  audience: AudienceDraft;
  config: ConfigDraft;

  setSource(source: SourceDraft): void;
  setObjective(objective: ClipObjective): void;
  setAudience(audience: Partial<AudienceDraft>): void;
  setConfig(config: Partial<ConfigDraft>): void;
  reset(): void;
}

const initialAudience: AudienceDraft = {
  targetAudience: '',
  painPoint: '',
  transformation: '',
  tone: '',
  prioritizeTopics: '',
  avoidTopics: '',
};

const initialConfig: ConfigDraft = {
  autoSelect: true,
  clipCount: 6,
  minLengthSec: 20,
  maxLengthSec: 60,
  aspectRatio: '9:16',
  captionStyle: 'bold_pop',
  speakerTracking: true,
  emojiLevel: 'light',
  profanityFilter: true,
  removeFillerWords: true,
  removeSilence: true,
  autoZoom: true,
  brollSuggestions: true,
  defaultCta: 'Follow for more →',
  brandKitId: null,
};

export const useCreateFlowStore = create<CreateFlowState>((set) => ({
  source: null,
  objective: null,
  audience: initialAudience,
  config: initialConfig,

  setSource: (source) => set({ source }),
  setObjective: (objective) => set({ objective }),
  setAudience: (audience) => set((s) => ({ audience: { ...s.audience, ...audience } })),
  setConfig: (config) => set((s) => ({ config: { ...s.config, ...config } })),
  reset: () => set({ source: null, objective: null, audience: initialAudience, config: initialConfig }),
}));
