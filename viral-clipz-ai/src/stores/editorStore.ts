import { create } from 'zustand';
import type { AspectRatio, CaptionStyle } from '@/types/entities';

/**
 * Clip editor state with undo/redo history.
 * The editor is a shell today: state changes are real and undoable, while
 * actual media re-rendering happens server-side after export (Prompt 2).
 */

export interface EditorSnapshot {
  trimStartMs: number;
  trimEndMs: number;
  captionText: string;
  captionStyle: CaptionStyle;
  captionFont: string;
  captionColor: string;
  captionPosition: 'top' | 'middle' | 'bottom';
  highlightKeywords: boolean;
  emojiEnabled: boolean;
  framingPreset: 'auto_track' | 'center' | 'split' | 'grid';
  aspectRatio: AspectRatio;
  logoOverlay: boolean;
  ctaEndCard: boolean;
  musicTrack: string | null;
}

interface EditorState {
  clipId: string | null;
  snapshot: EditorSnapshot;
  past: EditorSnapshot[];
  future: EditorSnapshot[];
  dirty: boolean;

  load(clipId: string, initial: Partial<EditorSnapshot>): void;
  apply(change: Partial<EditorSnapshot>): void;
  undo(): void;
  redo(): void;
  markSaved(): void;
}

const defaults: EditorSnapshot = {
  trimStartMs: 0,
  trimEndMs: 42_000,
  captionText: '',
  captionStyle: 'bold_pop',
  captionFont: 'Inter Black',
  captionColor: '#FFFFFF',
  captionPosition: 'bottom',
  highlightKeywords: true,
  emojiEnabled: true,
  framingPreset: 'auto_track',
  aspectRatio: '9:16',
  logoOverlay: true,
  ctaEndCard: true,
  musicTrack: null,
};

const HISTORY_LIMIT = 50;

export const useEditorStore = create<EditorState>((set, get) => ({
  clipId: null,
  snapshot: defaults,
  past: [],
  future: [],
  dirty: false,

  load(clipId, initial) {
    set({ clipId, snapshot: { ...defaults, ...initial }, past: [], future: [], dirty: false });
  },

  apply(change) {
    const { snapshot, past } = get();
    set({
      snapshot: { ...snapshot, ...change },
      past: [...past.slice(-HISTORY_LIMIT + 1), snapshot],
      future: [],
      dirty: true,
    });
  },

  undo() {
    const { past, future, snapshot } = get();
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    set({ snapshot: previous, past: past.slice(0, -1), future: [snapshot, ...future], dirty: true });
  },

  redo() {
    const { past, future, snapshot } = get();
    if (future.length === 0) return;
    const [next, ...rest] = future;
    set({ snapshot: next, past: [...past, snapshot], future: rest, dirty: true });
  },

  markSaved() {
    set({ dirty: false });
  },
}));
