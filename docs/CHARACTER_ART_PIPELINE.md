# Character Art Pipeline

How new character art gets from a design tool into the game, safely.

## Status today (Phase 2 — back-view gameplay sprites live)

Every hero now has a **back-view gameplay sprite** at
`public/assets/characters/<id>/run_back.png` (registered as `backSprite` in
the registry and manifests). The chase camera sits behind the hero, so
gameplay renders ONLY back-view art — the front-facing select-screen
portrait must never be used as the runner (it reads as running the wrong
way). The sprites were generated from each hero's canonical portrait as the
identity reference (same outfit, hair, palette, premium 3D style),
background-removed to transparent PNG, and delivered through
`.github/workflows/fetch-remote-assets.yml` (see that file — the dev sandbox
cannot download from the art CDN directly; list new URLs in
`scripts/pending-assets.json` and push to trigger the relay).

Gameplay fallback order: loaded `backSprite` → procedural hand-drawn body
(also back-view). Menus/select keep using the front-facing `preview`.

## Status before (Phase 1)

Every hero already ships real, verified 3D portrait art at
`/assets/characters/<id>.png` (referenced by `CharacterDef.image` in
`src/data/characters.ts`). This pipeline formalizes that art behind a
registry — `src/game/characterAssets.ts` — and per-character manifests at
`public/assets/characters/<id>/manifest.json`, so future art (run atlases,
updated previews) has one place to register instead of touching component
or renderer code.

- **Character select / profile / finish screens** (`CharacterAvatar.tsx`):
  reads `getCharacterAsset(id).preview` first, falls back to the legacy
  `ch.image`/`portrait`/`cardArt` fields, then to the hand-drawn SVG. No
  behavior changed today — the registry preview *is* the same production PNG.
- **Live gameplay canvas** (`render.ts`): the hero body is still fully
  procedural (`drawPlayer`, `drawSignature`, per-pose limb paths, etc.). The
  renderer now warms an image cache for each hero's registry preview/atlas
  path (`ensureCharacterImagesLoading`), mirroring the existing venue
  backdrop cache pattern — but does **not** draw from it yet. See Phase 2.

## Why gameplay swap-in is deferred

The existing procedural rendering animates jump/slide/bounce poses, per-hero
signature effects, and board/trail effects around a live anchor point. The
current portrait art is a tall, standing three-quarter pose meant for
character select — not a running sprite. Drawing it as a static image in
place of the animated body would freeze the run cycle and likely misalign
with jump squash/stretch. Shipping that without a dedicated visual QA pass
would trade a working, animated hero for a frozen one. Phase 2 (below) exists
so that swap only happens once real running-pose art is produced.

## Phase 2 — wiring atlas/preview playback into gameplay (not yet built)

Once a character has a real run atlas (or a running-pose preview is
confirmed to read well as a static gameplay body), wire it into
`Renderer.drawPlayer` like this, in place of (or before) the procedural body
draw call:

```ts
import { getCharacterAsset, hasCharacterAtlas } from "./characterAssets";

// Inside drawPlayer, after this.ensureCharacterImagesLoading(ch.id):
const asset = getCharacterAsset(ch.id);

function loadedImage(src: string): HTMLImageElement | null {
  if (!src) return null;
  const img = Renderer.charImageCache.get(src); // add a getter if needed
  return img && img.complete && img.naturalWidth > 0 ? img : null;
}

const atlas = hasCharacterAtlas(ch.id) ? loadedImage(asset.runAtlas) : null;
const preview = loadedImage(asset.preview);

if (atlas) {
  // draw the current run-cycle frame from the atlas, using
  // asset.frameWidth/frameHeight/frameCount/fps and `time` to pick a frame
} else if (preview) {
  // draw the static preview image, sized/anchored to match the existing
  // procedural body's footprint
} else {
  // fall through to the existing procedural drawPlayer body — never leave
  // the hero invisible
}
```

Rules for whoever picks this up:
- Never let a failed/incomplete image result in an invisible hero — the
  procedural body is the permanent, guaranteed fallback.
- Don't touch hitbox math, lane math, camera projection, or collision.
- Verify the swap visually (screenshots, both idle and jump/slide) before
  shipping — this is exactly the class of change the "no fake QA" rule exists
  for.

## Producing new art

### Tools
- **Rive**: best for true animated run cycles exported as sprite sheets
  (see export specs below). Do not install the Rive runtime into this repo —
  export static PNG sequences instead.
- **Canva**: fast for concepting outfits, palettes, and premium polish passes.
- **Photopea**: use for cleanup — background removal, transparency, trimming,
  and re-exporting to the exact spec below.

### Style requirements
- Christian, clean, premium — no occult or new-age symbolism, no violent
  imagery. Family-safe at all times.
- Zion remains the franchise lead and visual benchmark for quality.
- The Accuser is enemy/lore art only — never a playable, sympathetic, or
  heroic presentation.
- Must read clearly at small mobile sizes (character select cards are ~128px
  tall).

### Export specs
```
Preview PNG   : 512×512, transparent background
Run atlas PNG : 1152×192 (6 frames × 192px), transparent background
Frame size    : 192×192
Frame count   : 6
FPS           : 12
Pose          : back or three-quarter-back runner (gameplay reads from behind)
Framing       : character centered in each frame, consistent scale/anchor
Readability   : must stay legible at mobile character-card size
```

### Registering new art
1. Drop the exported file(s) under `public/assets/characters/<id>/`.
2. Update that character's `public/assets/characters/<id>/manifest.json`
   (`preview`/`runAtlas` paths, `status: "production"`, frame spec).
3. Update the matching entry in `src/game/characterAssets.ts` — today it is
   derived automatically from `src/data/characters.ts` plus this manifest
   data, so in most cases only the manifest needs to change; only touch the
   registry file directly if the derivation no longer fits.
4. No code changes are needed in `CharacterAvatar.tsx` — it already reads
   from the registry.
