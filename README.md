# ✝️ Christian Surfers — Run in the Light

A faith-based 3-lane endless runner. Satan the Accuser chases you down the
Kingdom Boardwalk — run in faith, dodge the obstacles of darkness, and collect
Light Coins, Scripture Scrolls, Crowns, Keys, and Gems.

## Play it

```bash
npm install
npm run dev
```

Open **http://localhost:5173** and run.

## Controls

| Action | Desktop | Mobile |
| --- | --- | --- |
| Move left / right | ← → or A / D | Swipe left / right |
| Jump | ↑ / W / Space | Swipe up |
| Slide | ↓ / S | Swipe down |
| Revival Fire boost | E | Tap 🔥 button |
| Pause | P / Esc | Tap ⏸ button |

## Features

- **6 playable runners** — Zion, Grace, Esther, Judah, Kai, David — each with a unique
  faith-based ability that changes gameplay
- **Satan the Accuser** chases from behind with a live distance meter,
  heartbeat warnings, dark vignette, and screen shake at near-catch moments
- **5 power-ups** — Shield of Faith, Scripture Boost, Crown Magnet,
  Revival Fire, Wings of Mercy
- **Scripture reward system** — collecting scrolls pushes the Accuser back and
  shows short KJV encouragements
- **6 demo missions** that complete live during runs and pay out coins + XP
- **Upgrade shop** — spend Light Coins on permanent run boosts
- **Procedural Web Audio sound design** — no audio files, everything is
  synthesized (coins, power-ups, heartbeat warnings, worship-pad music loop)
- **Canvas-rendered Kingdom Boardwalk** — golden sunrise, ocean waves, palms,
  city skyline, heaven-light rays, scrolling planks
- Progress persists in `localStorage`

## Mobile / PWA

- **Installable PWA** — manifest, icons, and a service worker with offline
  cache; use Settings → "Add to Home Screen" for guided install on
  iPhone (Safari share sheet) or Android (Chrome install prompt)
- **Portrait-first** — manifest locks installed orientation; in the browser a
  rotate overlay appears in phone landscape
- Page scroll, rubber-banding, and double-tap zoom are fully disabled during
  play (fixed body + `touch-action` + non-passive `touchmove` guard)
- Canvas sizes off `100dvh` and `visualViewport`, so it tracks the real
  visible area as mobile browser chrome collapses
- Safe-area insets (notch / Dynamic Island / home bar) pad every screen and
  the in-game HUD
- Thumb-friendly controls: 48px pause and mute buttons, 72px boost button,
  all menu buttons ≥48px tall
- Continuous swipe chaining — one drag can register several lane changes

## Architecture

```
src/
  audio/       Web Audio API sound engine (procedural SFX + music)
  components/  Shared UI (Button)
  data/        Characters, missions, power-ups, scriptures, upgrades
  game/        Pure-TS simulation engine + canvas renderer
  hooks/       Swipe gesture detection
  screens/     Loading, Start, Characters, Missions, Upgrades, Settings,
               Game (HUD/pause), Game Over, Rewards
  types/       Shared TypeScript types
  utils/       localStorage persistence
```

The game engine (`src/game/engine.ts`) has zero DOM dependencies, so the whole
simulation can run headlessly for testing and balancing.
