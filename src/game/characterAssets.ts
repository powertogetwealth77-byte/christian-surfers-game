/**
 * Character Asset Pipeline Registry (Phase 1 — preview art only).
 *
 * Single source of truth for per-character preview art and (future) run-atlas
 * sprite sheets. Mirrors the on-disk manifests under
 * `public/assets/characters/<id>/manifest.json` (see docs/CHARACTER_ART_PIPELINE.md).
 *
 * Every hero already has verified 3D portrait art shipping in production at
 * `/assets/characters/<id>.png` (referenced by `CharacterDef.image` and used
 * by `CharacterAvatar`). This registry reuses those exact files as `preview`
 * rather than duplicating the binaries — no new art was invented here.
 *
 * `runAtlas` is intentionally empty for every entry: no verified sprite atlas
 * exists yet. Atlas playback in `render.ts` is documented as Phase 2 — this
 * registry only describes where an atlas *would* live once produced.
 */
import { CHARACTERS, getCharacterAvatarGlyph } from "../data/characters";

export type CharacterAssetRole = "hero" | "enemy";
export type CharacterAssetStatus = "production" | "placeholder" | "needs-art" | "lore-only";

export interface CharacterAssetConfig {
  id: string;
  displayName: string;
  role: CharacterAssetRole;
  playable: boolean;
  status: CharacterAssetStatus;
  preview: string;
  runAtlas: string;
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
  fps: number;
  fallbackGlyph: string;
  accent: string;
  introLine: string;
}

const DEFAULT_ATLAS_SPEC = { frameWidth: 192, frameHeight: 192, frameCount: 6, fps: 12 };

const HERO_ASSETS: CharacterAssetConfig[] = CHARACTERS.map((ch) => ({
  id: ch.id,
  displayName: ch.name,
  role: "hero",
  playable: true,
  status: "production",
  preview: ch.image ?? "",
  runAtlas: "",
  ...DEFAULT_ATLAS_SPEC,
  fallbackGlyph: getCharacterAvatarGlyph(ch),
  accent: ch.colors.secondary,
  introLine: ch.voiceLine,
}));

const ACCUSER_ASSET: CharacterAssetConfig = {
  id: "the_accuser",
  displayName: "The Accuser",
  role: "enemy",
  playable: false,
  status: "lore-only",
  preview: "/assets/characters/accuser/accuser_portrait.png",
  runAtlas: "",
  frameWidth: 0,
  frameHeight: 0,
  frameCount: 0,
  fps: 0,
  fallbackGlyph: "⚠️",
  accent: "#1c1c28",
  introLine: "",
};

/** Every registry entry — heroes plus the enemy/lore-only Accuser. Never mutate. */
export const CHARACTER_ASSETS: CharacterAssetConfig[] = [...HERO_ASSETS, ACCUSER_ASSET];

const ASSET_BY_ID = new Map(CHARACTER_ASSETS.map((a) => [a.id, a]));

const UNKNOWN_ASSET: CharacterAssetConfig = {
  id: "unknown",
  displayName: "Unknown",
  role: "hero",
  playable: false,
  status: "needs-art",
  preview: "",
  runAtlas: "",
  ...DEFAULT_ATLAS_SPEC,
  fallbackGlyph: "🏃",
  accent: "gold",
  introLine: "",
};

/** Looks up a registry entry by id. Never throws; unknown ids get a safe fallback. */
export function getCharacterAsset(characterId: string): CharacterAssetConfig {
  return ASSET_BY_ID.get(characterId) ?? UNKNOWN_ASSET;
}

/** Same as `getCharacterAsset`, but returns null for anything not playable (e.g. the Accuser). */
export function getPlayableCharacterAsset(characterId: string): CharacterAssetConfig | null {
  const asset = ASSET_BY_ID.get(characterId);
  return asset && asset.playable ? asset : null;
}

/** Safe glyph fallback for a character id, always renderable (never crashes on unknown ids). */
export function getCharacterFallback(characterId: string): string {
  return getCharacterAsset(characterId).fallbackGlyph;
}

/** Spoken/printed intro line for a character id, or "" if none is defined. */
export function getCharacterIntroLine(characterId: string): string {
  return getCharacterAsset(characterId).introLine;
}

/** True only for heroes explicitly marked playable — the Accuser is always false. */
export function isPlayableCharacterAsset(characterId: string): boolean {
  return ASSET_BY_ID.get(characterId)?.playable === true;
}

/**
 * True only when the registry config declares a non-empty atlas path with a
 * valid frame spec. This does NOT check whether the image can actually load
 * at runtime — callers rendering an atlas must still verify the loaded
 * `HTMLImageElement` (see `Renderer`'s image-cache pattern) before drawing.
 */
export function hasCharacterAtlas(characterId: string): boolean {
  const asset = getCharacterAsset(characterId);
  return !!asset.runAtlas && asset.frameWidth > 0 && asset.frameHeight > 0 && asset.frameCount > 0;
}
