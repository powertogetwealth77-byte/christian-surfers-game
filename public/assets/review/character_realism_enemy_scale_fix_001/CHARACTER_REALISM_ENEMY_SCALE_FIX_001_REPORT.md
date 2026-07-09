# Character Realism + Enemy Scale Fix — 001

## 1. Repo path
`/home/user/christian-surfers-game`

## 2. Branch
`claude/christian-surfers-updates-ux0wws` (PR #5, stacked on PR #4's `feat/fresh-character-asset-pipeline-pr3`)

## 3. Starting commit
`08f1524` — feat(gameplay): landing impact, footfall dust, and slide friction cues

## 4. Files changed
- `src/game/render.ts` only (67 insertions, 36 deletions). No other file touched — DOMOS, Seer AI, scoring, collision, lane math, coin economy, unlock prices, venues, boards, Breakthrough, and the service-worker fix are all untouched by this pass.

## 5. Accuser scale — root cause
`drawSatan()` in `src/game/render.ts` computed the Accuser's size unit as
`S = 22 + Math.pow(rise, 1.5) * 80`, reaching ~102px at max proximity, with
`footY = H * 0.42 + rise * rise * (H * 0.44)` letting him close all the way
to ~0.86 of screen height. Every body part (torso, limbs, horns) and the
hellish aura (`S * 3.2` radius, `S * 6.4` fill rect) scaled off that unit, so
at high danger the combined aura + silhouette could cover most of a 390×844
viewport and sit low enough to overlap the coin lanes.

## 6. Accuser scale — fix
- `S = 18 + Math.pow(rise, 1.5) * 46` — max unit reduced from ~102px to ~64px (~37% smaller at peak danger).
- `footY = H * 0.4 + rise * rise * (H * 0.28)` — capped reach keeps him up-track behind the hero at all danger levels instead of closing to the foreground.
- Aura radius reduced `S * 3.2 → S * 2.0` and fill rect `S * 6.4 → S * 4.0`, so the glow frames him instead of blanketing the lane.
- Gameplay proximity (`engine.satan`) and its mechanics (warn threshold, soft cap, rise/relief rates) were **not** touched — this is a rendering-only change, as instructed.

## 7. Accuser body/proportion fix
Root cause: limbs were drawn with a stroked two-point polyline (`ctx.lineWidth` + `ctx.stroke()`), which reads as a thick stick figure regardless of scale.
Fix: replaced the stroke-based `limb()` helper with a filled, perpendicular-offset tapered quad per segment (thigh→shin, upper arm→forearm) plus filled joint circles to hide seams — a real capsule-like limb instead of a wireframe stick. Leg reach/width and arm reach/width were also tightened (e.g. leg width taper `S*0.26 → S*0.19 → S*0.13`, was a flat `S*0.42`) for cleaner, less exaggerated proportions. Shoulder curve softened slightly for a rounder torso. Eyes, horns, smoke, and cloak hem kept as-is (not implicated in the complaint, and already family-safe/abstract).

## 8. Hero anchoring fix
Reviewed `drawPlayer()`'s existing back-view sprite path (feet anchored at local `footY = 16` below the run-cycle translate, scale/tilt/lean transforms from PR #4 and the prior session's landing-squash work). This was already sound, so no anchor-point changes were made. Added a second, tighter/darker "contact core" shadow ellipse layered under the existing soft ambient shadow, so the feet/board read as making real contact with the ground rather than floating above a diffuse blob. Existing footfall dust, landing-impact squash, and slide friction streak (from the prior session) were left intact and re-verified working.

## 9. Hero realism fix
No sprite, scale, or motion-transform changes beyond the contact-shadow strengthening above — the existing back-view rendering, run bob, lane-lean, jump/slide transforms, and halo were already reading correctly in QA (see screenshots) and did not need rework. Front-facing portraits are confirmed never used as the gameplay runner (unchanged code path).

## 10. Shield of Faith HUD result
Unchanged and confirmed readable in every QA screenshot — pill sits to the side of the lane, never over lane center, charge pips visible, does not need repositioning.

## 11. Venues result
Sunrise Boardwalk venue rendered correctly throughout QA (background art, banners, palms, lamps all visible and unaffected — no venue files were touched).

## 12. Boards result
Hoverboard renders correctly under the hero's feet in all screenshots (see `04-hero-planted-on-board.png`); board code path untouched.

## 13. Breakthrough result
Verified via `?breakthroughTest`: "⚡ 200 COINS — BREAKTHROUGH!" toast, Psalm 27:1 verse card, Spirit of the Lord and Scripture Boost popups all fired correctly with the Accuser visible but appropriately small/contained in the background (see `06-breakthrough-still-working.png`).

## 14. Mobile result
Tested in headless Chromium at 390×844 (Zion, default hero). Confirmed:
- Accuser no longer fills the screen at medium or high danger (screenshots 02, 03)
- Accuser silhouette reads as a clean contained figure, not a stick figure
- Coins, lane lines, obstacles, board, and HUD all stayed visible with the Accuser on screen
- Hero stays planted with visible contact shadow (screenshot 04)
- No sideways scrolling; no giant text overlay
- A second-hero (Judah) UI switch was attempted via character-select automation but the click didn't register in time for a screenshot before this report — not re-verified visually this pass. This is a **known gap**, not a regression: `heroSprite()` is keyed generically off `characterId` and is unchanged by this fix, and PR #4's own QA already verified Zion/Grace/Judah back-view rendering, so there is no code path by which this pass could have broken other characters.

## 15. Console errors
Zero `pageerror` or `console.error` events across all QA runs (one unrelated `net::ERR_CONNECTION_RESET` on the Google Fonts CDN request, a sandbox network-policy artifact unrelated to app code).

## 16. Build result
`npm run build` (`tsc -b && vite build`) — **PASS**, zero errors.

## 17. Screenshots path
`public/assets/review/character_realism_enemy_scale_fix_001/screenshots/`
- `01-zion-after-fix.png`
- `02-accuser-medium-danger.png`
- `03-accuser-close-danger-not-screen-filling.png`
- `04-hero-planted-on-board.png`
- `05-shield-meter-readable.png`
- `06-breakthrough-still-working.png`

## 18. Final decision
**PASS** — the two named complaints (Accuser screen-filling scale, stick-figure body) are both fixed and visually confirmed at medium and high danger; hero contact/grounding is strengthened; all named systems (Shield of Faith, venues, boards, Breakthrough, service worker fix) confirmed still working; build clean; zero console errors.

Recorded as PASS rather than PASS WITH CAUTION because the one gap (second-hero UI re-verification) is a QA-coverage gap with no plausible causal link to the change, not an observed or suspected issue.

## 19. Recommended next mission
Re-verify back-view rendering for 2–3 more unlocked heroes (e.g. Judah, Grace) via a proper character-select automation pass or manual mobile QA, since this pass only re-confirmed Zion. After that, the true 6-frame back-view run atlas (flagged as a known limitation in PR #4) remains the next real fidelity upgrade — the current single-pose sprite with live transforms reads well at gameplay speed but doesn't cycle legs frame-by-frame.
