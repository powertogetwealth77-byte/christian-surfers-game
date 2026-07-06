/**
 * Phase 14 §2 — Lightweight Family Profile architecture.
 *
 * LOCAL-ONLY. No cloud, no auth, no backend, no Supabase, no API. This module
 * is pure data + helpers (no localStorage access — that lives in storage.ts).
 * Each profile owns its OWN game-save blob under a namespaced key, so switching
 * profiles never touches or loses another profile's data.
 *
 * Future-proofing: `FamilyData.version` lets us migrate the shape later, and
 * every profile carries a stable `id` that a future cloud sync can key on.
 */

export type ProfileRole = "parent" | "child";

export interface FamilyProfile {
  id: string;
  name: string;
  role: ProfileRole;
  avatar: string; // emoji
  createdAt: string; // ISO
}

export interface FamilyData {
  version: 1;
  activeProfileId: string;
  profiles: FamilyProfile[];
}

/** The stable id for the original/legacy single-player save. */
export const DEFAULT_PROFILE_ID = "default";

/** Avatars offered when creating a child profile. */
export const PROFILE_AVATARS = [
  "🧒", "👦", "👧", "🧑", "👶", "🦸", "🧑‍🚀", "🏄", "⛪", "👑",
];

/**
 * The starting family: a single parent profile that maps to the legacy save
 * key. Existing players keep 100% of their progress — see storage.saveKeyFor.
 */
export const DEFAULT_FAMILY: FamilyData = {
  version: 1,
  activeProfileId: DEFAULT_PROFILE_ID,
  profiles: [
    {
      id: DEFAULT_PROFILE_ID,
      name: "Player 1",
      role: "parent",
      avatar: "👑",
      createdAt: "2026-01-01T00:00:00.000Z",
    },
  ],
};

/** Generate a reasonably-unique local id (no external deps). */
export function makeProfileId(): string {
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Build a fresh profile object. */
export function makeProfile(
  name: string,
  role: ProfileRole,
  avatar: string,
): FamilyProfile {
  return {
    id: makeProfileId(),
    name: name.trim().slice(0, 16) || (role === "parent" ? "Parent" : "Child"),
    role,
    avatar,
    createdAt: new Date().toISOString(),
  };
}

export function childProfiles(family: FamilyData): FamilyProfile[] {
  return family.profiles.filter((p) => p.role === "child");
}

export function getProfile(
  family: FamilyData,
  id: string,
): FamilyProfile | undefined {
  return family.profiles.find((p) => p.id === id);
}

export function activeProfile(family: FamilyData): FamilyProfile {
  return getProfile(family, family.activeProfileId) ?? family.profiles[0];
}
