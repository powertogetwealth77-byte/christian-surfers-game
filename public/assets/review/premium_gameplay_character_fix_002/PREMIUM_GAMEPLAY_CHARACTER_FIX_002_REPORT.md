# Premium Gameplay Character & UI Fix — Mission Report

Mission ID: CS-PREMIUM-GAMEPLAY-CHARACTER-AND-UI-FIX-002

## Root cause

The gameplay runner was a fully **procedural canvas doodle**: per-hero hand-coded
vector functions (`drawZion`, `drawGrace`, …) built from ellipses and polylines at
`HERO = 2.7` scale. The premium 3D art shown on the character select screen
(`/assets/characters/<id>.png`) was never used in gameplay at all, so the live
runner could not carry the outfit, hair, proportions, face, or brand identity of
the selected hero. That single gap was the menu-vs-gameplay mismatch.

## The fix — Character Asset Pipeline Phase 2 (premium hero sprite path)

`src/game/render.ts` only. Inside `drawPlayer`:

1. **`heroSprite(id)`** — takes the hero's registry preview art (already loading
   via the Phase 1 cache warmer), pre-scales it **once** into a 280px-tall
   offscreen canvas (`heroSpriteCache`, high-quality smoothing), so the per-frame
   draw is a cheap same-scale blit instead of a ~1400px PNG downscale every frame.
2. **Premium render path** — when the sprite is ready, gameplay draws the *exact
   select-screen art* (all 10 heroes have verified art in dynamic run poses),
   anchored feet-on-hoverboard, and kept alive with real motion:
   - run bob (existing `bounce` in the anchor) + run-cycle rock (`±0.045 rad`
     synced to `runPhase`)
   - smoothed **lane-switch lean** (`updateHeroLean`, driven by the engine's
     fractional `laneX` so camera shake can't jitter it)
   - **jump**: back-tilt (−0.13 rad) + the existing air stretch/compression
   - **slide**: 0.7× vertical squash + forward dive tilt (0.24 rad) — the hero
     visibly ducks
   - the existing shared squash/stretch + "breath" block applies to both paths
3. **Halo/effects follow the head** — `headTop` is now computed from the sprite's
   actual scaled height (ducks with the slide), and the Scripture Boost halo was
   re-anchored to `headTop - 16` (numerically identical to the old constant for
   the procedural path).
4. **Guaranteed fallback** — art missing / still loading / failed → the full
   procedural body renders exactly as before. The hero is never invisible and
   never a broken image.

**Untouched:** `engine.ts` (hitbox, lane math, collision, scoring), hoverboard
drawing, venue rendering, Accuser chase, all power-up effects, aura/trail/shadow,
purchase gating, save data, unlock logic. The change is purely visual and
additive. No new dependencies.

## What was honestly NOT done

- **True multi-frame run-cycle atlas playback** — no real frame-by-frame art
  exists to play back, and inventing frames from one portrait is not possible.
  The registry/manifests already carry `runAtlas` + frame specs, so when real
  atlas art is produced (specs in `docs/CHARACTER_ART_PIPELINE.md`), it slots
  into this same path. The shipped result is solution hierarchy #2 from the
  mission brief: real character art with limited safe motion handling.
- **Audio changes: none.** Audited `SoundEngine`/`GameScreen`: run start, jump,
  slide, lane switch, coin streaks, perfect dodge, shield break, Breakthrough
  triple-stack (fanfare + accuserFall + chainsBreak), finish-line sequence are
  all already wired. Nothing in the audio layer was broken or obviously weak
  enough to justify destabilizing a working synth engine mid-mission — reported
  honestly instead of churning it.

## Verification (all real, screenshots in ./screenshots/)

| Check | Result |
|---|---|
| Build (`tsc -b && vite build`) | **PASS**, zero errors |
| Playwright `visual.spec.ts` (roster/Esther/no-Accuser/no broken img/gameplay/console) | **2/2 PASS** |
| Zion in gameplay = menu Zion (blue hoodie, hair, face, JOHN 3:16 board underfoot, halo on head) | **PASS** — `02` |
| Jump (back-tilt, air stretch) | **PASS** — `03` |
| Slide (duck + dive under barrier) | **PASS** — `04` |
| Grace identity (purple jacket, ponytail) | **PASS** — `05` |
| Lane-switch lean (Grace, mid-switch, Accuser-close danger state readable) | **PASS** — `06` |
| Judah identity (black/gold streetwear) | **PASS** — `07`, `11` |
| Venue regression: Living Water Cove selected & rendering with Kai | **PASS** — `08` |
| Board regression: JOHN 3:16 board renders under hero; gold blaze works | **PASS** — `02`–`10` |
| Breakthrough: fired at 15 coins (`?breakthroughTest`), Psalm 27:1 toast, Accuser pushed back, golden blaze board with hero riding it | **PASS** — `09`, `10` |
| Mobile 390×844 gameplay readable | **PASS** — `11` |
| Console errors during all QA runs | **zero** (pre-existing Google Fonts fetch excluded, unrelated) |
| Character select unchanged/premium | **PASS** — `01` |

Note on `tests/character-system.spec.ts`: still failing 4/4 — **pre-existing**
(targets a `hero-stage-card` UI that doesn't exist in this codebase; documented
in the Phase 1 report). Unrelated to this change.

## Remaining risks / next steps

- The hero art is a single premium pose animated with transforms — legs don't
  cycle frame-by-frame. It reads well at gameplay speed (bob + rock + lean sell
  the motion), but true atlas playback with real run/jump/slide frames is the
  final polish step. Everything is pre-wired for it (registry `runAtlas`,
  manifests, image cache, this render path).
- `heroSpriteCache` holds one ~280px canvas per hero ever selected in a session
  — negligible memory.
- Recommended next mission: produce real 6-frame run atlases (1152×192 spec in
  `docs/CHARACTER_ART_PIPELINE.md`) starting with Zion, wire frame playback into
  the sprite path, and retire/rebuild the stale `character-system.spec.ts`.

## Final decision: **PASS**
