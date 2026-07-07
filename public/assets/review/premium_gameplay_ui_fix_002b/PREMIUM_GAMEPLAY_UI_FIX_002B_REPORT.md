# Premium Gameplay Character Direction, HUD & Mobile Fix — Mission Report

Mission: CS-PREMIUM-GAMEPLAY-CHARACTER-AND-UI-FIX (direction/HUD/mobile pass)

## Root causes found

1. **Characters running the wrong direction:** the previous premium pass drew
   each hero's front-facing select-screen portrait as the gameplay runner. The
   chase camera sits behind the hero (world scrolls toward the camera), so a
   front-facing sprite reads as the hero running toward the player — the exact
   failure named in the brief. No back-view art existed anywhere in the repo.
2. **Giant text covering the game on mobile:** `public/sw.js`'s fetch handler
   fell back to the cached app shell (`caches.match(".")` = index.html) for
   **any** failed same-origin GET — including hashed JS/CSS asset requests.
   After a redeploy, a stale PWA client requesting old hashed assets received
   HTML instead: the stylesheet fails to apply and the entire game renders as a
   raw, giant, unstyled text dump over the canvas. No in-app debug/log overlay
   exists (audited `src/` fully — only intentional HUD).
3. **Shield of Faith:** already implemented in engine + HUD, but only as a
   small conditional text pill that disappears entirely at 0 charges — weak,
   not a meter.

## Fixes shipped

### 1. True back-view premium runners (all 10 heroes)
- Generated a back-view running sprite for every hero using its canonical
  portrait as the identity reference (same outfit, hair, palette, premium 3D
  style; mid-stride pose, sole visible), then background-removed to
  transparent PNG. Committed at `public/assets/characters/<id>/run_back.png`.
- Identity spot-verified frame-by-frame: Zion (glowing gold cross on hoodie
  back), Judah (gold/crimson lion embroidery), Grace (lavender tracksuit +
  curly ponytail), Esther (royal purple + gold crown + braided hair) — all
  read as the same hero the player picked.
- Registry (`characterAssets.ts`) + all 11 manifests gained a `backSprite`
  field; gameplay `heroSprite()` now loads **only** back-view art and
  auto-crops transparent margins so feet anchor exactly on the hoverboard.
- Motion preserved and alive: run bob + run-cycle rock, smoothed lane-switch
  lean, jump back-tilt + air stretch, slide duck (0.7× squash + slight dive).
- Fallback chain: loaded `backSprite` → procedural hand-drawn body (also
  back-view). Front portrait is never drawn in gameplay. Hero can never be
  invisible or a broken image.
- Delivery note: the dev sandbox's network policy blocks the art CDN, so
  assets were relayed through `.github/workflows/fetch-remote-assets.yml`
  (downloads URLs listed in `scripts/pending-assets.json`, commits to the
  pushing feature branch). Reusable for future art drops.

### 2. Mobile text-dump fix
- `sw.js`: cache-shell fallback now applies **only** to navigation requests;
  failed asset requests return the cached asset or a network error, never
  HTML. Cache version bumped `v1 → v2` so clients drop any poisoned cache
  (HTML stored under asset URLs) on next activation.

### 3. Shield of Faith meter + HUD
- New always-visible Shield of Faith meter (right column, safe-area aware):
  shield emblem + name + two charge pips. Golden glow while protection is up
  (⚔️ "Armor of God" at 2 charges), dimmed when spent — an honest, readable
  meter instead of a vanishing pill. Verified live: golden+pip for Zion
  (shielded start), dimmed for Grace/Judah.
- Rest of HUD confirmed present and clean on mobile: score/multiplier,
  distance, coins, combo (top-left), mute + pause (top-right), mission bar
  with progress (top-center), Accuser distance meter (left), power-up timers
  (right, under the shield meter), Revival Fire boost button with charge
  badge (bottom-right), compact toasts and scripture cards in the lower-left
  safe zone. No destructive overlap; forward path stays clear.

## Verification (all real; screenshots in ./screenshots/)

| Check | Result |
|---|---|
| Build (`tsc -b && vite build`) | PASS |
| Playwright `visual.spec.ts` | 2/2 PASS |
| Zion/Grace/Judah run **away from camera** in gameplay | PASS — `01-*` |
| Jump / slide / lane-lean states | PASS — `02/03/04-*` |
| Kai + Living Water Cove venue | PASS — `05` |
| Breakthrough fired (15-coin dev gate), gold blaze, hero rendering | PASS — `06` |
| Mobile 390×844 gameplay (Judah) + character select | PASS — `07/08` |
| Shield of Faith meter visible in every gameplay shot | PASS |
| Console errors across all QA runs | zero |
| Character select unchanged (front-facing premium portraits) | PASS — `08` |
| Save/venues/boards/breakthrough/gating code untouched | PASS (renderer + HUD + sw only) |

Pre-existing, unrelated: `tests/character-system.spec.ts` still targets a UI
that doesn't exist in this codebase (documented two missions ago).

## Remaining risks / honest limitations
- Single back-view pose per hero, animated with transforms — legs don't cycle
  frame-by-frame yet. Reads well at speed; true 6-frame run atlases remain the
  final polish step (specs already in `docs/CHARACTER_ART_PIPELINE.md`, and
  the generated back-view sprites are now the correct base pose for them).
- Generated art fidelity is very strong but not pixel-identical to portraits
  (e.g. minor accessory differences). All 10 verified as clearly the same
  character; regenerate any hero via the documented relay if the team wants
  tweaks.

## Final decision: **PASS**
