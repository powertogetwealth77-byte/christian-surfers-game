import type { BoardDef, CharacterDef } from "../types";
import type { Collectible, GameEngine, Obstacle, PowerUpPickup } from "./engine";
import { MAX_SPEED, SPAWN_Z } from "./constants";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

interface Projection {
  x: number;
  y: number;
  scale: number;
}

interface Floater {
  x: number;
  y: number;
  life: number;
  maxLife: number;
  text: string;
  color: string;
  size: number;
}

/** Canvas renderer for the Kingdom Boardwalk environment. */
export class Renderer {
  private particles: Particle[] = [];
  private floaters: Floater[] = [];
  private waveFlash = 0; // Living Water wave effect 0..1
  private screenFlash = 0; // Full-screen flash 0..1
  private screenFlashColor = "#ffffff"; // Flash color
  // Accusation scrolls the Accuser hurls at the player (cosmetic projectiles).
  private satanScrolls: { x: number; y: number; vx: number; vy: number; life: number; rot: number }[] = [];
  private satanThrow = 0; // throw cooldown timer
  private camX = 0; // live camera offset
  private camY = 0;
  private board: BoardDef | null = null; // equipped scripture board
  private punchT = 0; // transient camera zoom punch 0..1
  shake = 0;

  private charImages: Record<string, HTMLImageElement> = {};

  private getCharImage(id: string): HTMLImageElement {
    if (!this.charImages[id]) {
      const img = new Image();
      const filename = id === "the_accuser" ? "accuser.png" : `${id}.png`;
      img.src = `/assets/characters/${filename}`;
      this.charImages[id] = img;
    }
    return this.charImages[id];
  }

  /** Set the equipped board so its colors, scripture and trail show in play. */
  setBoard(board: BoardDef) {
    this.board = board;
  }

  addShake(amount: number) {
    this.shake = Math.min(18, this.shake + amount);
  }

  /** A quick cinematic zoom punch — power-up activations, big landings. */
  punch(amount = 1) {
    this.punchT = Math.min(1, this.punchT + amount);
  }

  /** Flash the Living Water wave across the lane. */
  triggerWaveFlash() {
    this.waveFlash = 1;
  }

  /** Trigger a full-screen flash with the given color (used for combos, rewards, power-ups). */
  triggerScreenFlash(color: string, intensity = 1) {
    this.screenFlash = Math.max(this.screenFlash, intensity);
    this.screenFlashColor = color;
  }

  /** Pop celebratory text above the player (PERFECT!, combo milestones…). */
  floatText(
    engine: GameEngine,
    W: number,
    H: number,
    text: string,
    color: string,
    size = 22,
  ) {
    const p = this.project(engine.laneX, 0, W, H);
    this.floaters.push({
      x: p.x + (Math.random() - 0.5) * 24,
      y: p.y - 132,
      life: 0,
      maxLife: 1.1,
      text,
      color,
      size,
    });
  }

  burstAtPlayer(engine: GameEngine, W: number, H: number, color: string, count = 14) {
    const p = this.project(engine.laneX, 0.5, W, H);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 60 + Math.random() * 220;
      this.particles.push({
        x: p.x,
        y: p.y - 40,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 80,
        life: 0,
        maxLife: 0.5 + Math.random() * 0.4,
        size: 3 + Math.random() * 5,
        color,
      });
    }
  }

  /** Create a directional burst (horizontal spray) for coins and collectibles. */
  sprayCoins(engine: GameEngine, W: number, H: number, count = 8) {
    const p = this.project(engine.laneX, 0.5, W, H);
    for (let i = 0; i < count; i++) {
      const a = (Math.random() - 0.5) * Math.PI * 0.8; // Mostly forward
      const sp = 120 + Math.random() * 280;
      this.particles.push({
        x: p.x,
        y: p.y - 20,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 140,
        life: 0,
        maxLife: 0.8 + Math.random() * 0.3,
        size: 2 + Math.random() * 3,
        color: "#ffd700",
      });
    }
  }

  /** Create a ring burst for power-ups (radial explosion). */
  ringBurst(engine: GameEngine, W: number, H: number, color: string, count = 16) {
    const p = this.project(engine.laneX, 0.5, W, H);
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const sp = 200 + Math.random() * 150;
      this.particles.push({
        x: p.x,
        y: p.y - 30,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 40,
        life: 0,
        maxLife: 0.6 + Math.random() * 0.3,
        size: 4 + Math.random() * 3,
        color,
      });
    }
  }

  private project(laneX: number, z: number, W: number, H: number): Projection {
    const horizonY = H * 0.36;
    const playerY = H * 0.84;
    const t = Math.max(0, Math.min(1, 1 - z / SPAWN_Z));
    const p = Math.pow(t, 2.6);
    const y = horizonY + (playerY - horizonY) * p;
    const halfRoad = (W * 0.03 + W * 0.45 * p);
    const x = W / 2 + (laneX - 1) * halfRoad * 0.62;
    return { x, y, scale: 0.05 + 0.95 * p };
  }

  draw(
    ctx: CanvasRenderingContext2D,
    engine: GameEngine,
    character: CharacterDef,
    W: number,
    H: number,
    dt: number,
    time: number,
  ) {
    // ---- Living camera: idle sway, acceleration lean, lane parallax,
    //      Satan-pressure tremble, plus impact shake. ----
    const spd = Math.min(1, engine.speed / MAX_SPEED);
    const prox = engine.satan;
    const pressure = Math.max(0, (prox - 0.6) / 0.4); // 0..1 when the Accuser is close
    const swayX = Math.sin(time * 1.3) * 3 + Math.sin(time * 0.7) * 1.5;
    const swayY = Math.cos(time * 1.9) * 2 + Math.sin(time * 5) * spd * 1.5;
    const laneLean = (engine.laneX - 1) * 9; // parallax toward current lane
    const targetX = swayX + laneLean + pressure * (Math.random() - 0.5) * 5;
    const targetY = swayY + spd * 4 + pressure * (Math.random() - 0.5) * 5;
    const ease = Math.min(1, dt * 6);
    this.camX += (targetX - this.camX) * ease;
    this.camY += (targetY - this.camY) * ease;

    let sx = this.camX;
    let sy = this.camY;
    if (this.shake > 0.2) {
      sx += (Math.random() - 0.5) * this.shake;
      sy += (Math.random() - 0.5) * this.shake;
      this.shake *= Math.pow(0.0015, dt); // rapid decay
    } else {
      this.shake = 0;
    }

    ctx.save();
    // Camera tightens (zooms) and trembles to a heartbeat as the Accuser closes
    // in, then eases back out as the player gains ground and light returns.
    const danger = Math.max(0, (engine.satan - 0.5) / 0.5); // 0..1
    if (this.punchT > 0.001) this.punchT = Math.max(0, this.punchT - dt * 4);
    const zoom =
      1 +
      danger * 0.12 +
      (danger > 0.4 ? danger * 0.02 * Math.sin(time * 8) : 0) +
      this.punchT * 0.05;
    if (zoom !== 1) {
      ctx.translate(W / 2, H / 2);
      ctx.scale(zoom, zoom);
      ctx.translate(-W / 2, -H / 2);
    }
    ctx.translate(sx, sy);

    this.drawSky(ctx, W, H, time, engine.satan);
    this.drawSea(ctx, W, H, time, engine.stats.distance);
    this.drawBoats(ctx, W, H, time);
    this.drawSkyline(ctx, W, H, time);
    this.drawFlock(ctx, W, H, time);
    this.drawBoardwalk(ctx, W, H, engine.stats.distance, engine);
    this.drawPalms(ctx, W, H, engine.stats.distance);
    this.drawBanners(ctx, W, H, engine.stats.distance);

    // Depth-sorted world objects (far first).
    const drawables: { z: number; fn: () => void }[] = [];
    for (const ob of engine.obstacles) {
      if (ob.z > SPAWN_Z || ob.z < -1) continue;
      drawables.push({ z: ob.z, fn: () => this.drawObstacle(ctx, ob, W, H, time) });
    }
    for (const c of engine.collectibles) {
      if (c.z > SPAWN_Z || c.z < -1) continue;
      drawables.push({ z: c.z, fn: () => this.drawCollectible(ctx, c, W, H, time) });
    }
    for (const p of engine.pickups) {
      if (p.z > SPAWN_Z || p.z < -1) continue;
      drawables.push({ z: p.z, fn: () => this.drawPickup(ctx, p, W, H, time) });
    }
    drawables.sort((a, b) => b.z - a.z);
    for (const d of drawables) d.fn();

    // The Accuser looms right behind the hero — drawn just before the player
    // so the hero stays in front, with the giant runner bearing down behind.
    this.drawSatan(ctx, engine, W, H, time, dt);

    this.drawPlayer(ctx, engine, character, W, H, time);
    this.drawMotes(ctx, W, H, time);
    this.drawParticles(ctx, dt);
    this.drawFloaters(ctx, dt);
    this.drawWaveFlash(ctx, engine, W, H, dt);
    this.drawMotionBlur(ctx, engine, W, H);
    this.drawScreenFlash(ctx, W, H, dt);
    this.drawSpeedLines(ctx, engine, W, H, time);
    this.drawVignette(ctx, engine, W, H, time);

    ctx.restore();
  }

  // ---- Environment -------------------------------------------------------

  private drawSky(ctx: CanvasRenderingContext2D, W: number, H: number, time: number, satanProx: number) {
    const horizon = H * 0.36;
    // Sky shifts from dawn-gold to blood-red as Satan closes in
    const danger = Math.max(0, satanProx - 0.5) * 2; // 0..1
    const top = danger > 0 ? `rgb(${Math.round(30 + danger * 80)},${Math.round(42 - danger * 20)},${Math.round(120 - danger * 60)})` : "#1e2a78";
    const mid = danger > 0 ? `rgb(${Math.round(122 + danger * 80)},${Math.round(79 - danger * 40)},${Math.round(176 - danger * 80)})` : "#7a4fb0";
    const sky = ctx.createLinearGradient(0, 0, 0, horizon * 1.3);
    sky.addColorStop(0, top);
    sky.addColorStop(0.45, mid);
    sky.addColorStop(0.78, "#f08a4b");
    sky.addColorStop(1, "#ffd166");
    ctx.fillStyle = sky;
    // Overdraw above the top edge so a living camera never reveals a gap.
    ctx.fillRect(-40, -40, W + 80, horizon * 1.35 + 40);

    // Rising sun.
    const sunX = W / 2;
    const sunY = horizon * 0.96;
    const glow = ctx.createRadialGradient(sunX, sunY, 4, sunX, sunY, W * 0.32);
    glow.addColorStop(0, "rgba(255,244,200,0.95)");
    glow.addColorStop(0.25, "rgba(255,214,120,0.55)");
    glow.addColorStop(1, "rgba(255,214,120,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, horizon * 1.4);
    ctx.fillStyle = "#fff3c4";
    ctx.beginPath();
    ctx.arc(sunX, sunY, W * 0.055, 0, Math.PI * 2);
    ctx.fill();

    // Drifting clouds catching the dawn light.
    for (let i = 0; i < 4; i++) {
      const cx = ((time * 6 + i * 137) % (W * 1.3)) - W * 0.15;
      const cy = horizon * (0.22 + (i % 3) * 0.18);
      const cs = W * (0.05 + (i % 2) * 0.025);
      ctx.fillStyle = `rgba(255,230,210,${0.22 - i * 0.03})`;
      for (const [ox, oy, rr] of [[-0.9, 0.1, 0.6], [0, 0, 1], [0.9, 0.15, 0.7]] as const) {
        ctx.beginPath();
        ctx.ellipse(cx + ox * cs, cy + oy * cs, cs * rr, cs * rr * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Heaven-light rays sweeping slowly.
    ctx.save();
    ctx.translate(sunX, sunY);
    ctx.globalAlpha = 0.1;
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i - 2) * 0.42 + Math.sin(time * 0.18 + i) * 0.05;
      ctx.save();
      ctx.rotate(a);
      const ray = ctx.createLinearGradient(0, 0, 0, -H);
      ray.addColorStop(0, "rgba(255,250,220,0.9)");
      ray.addColorStop(1, "rgba(255,250,220,0)");
      ctx.fillStyle = ray;
      ctx.beginPath();
      ctx.moveTo(-W * 0.015, 0);
      ctx.lineTo(W * 0.015, 0);
      ctx.lineTo(W * 0.09, -H);
      ctx.lineTo(-W * 0.09, -H);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  private drawSea(
    ctx: CanvasRenderingContext2D,
    W: number,
    H: number,
    time: number,
    dist: number,
  ) {
    const horizon = H * 0.36;
    const sea = ctx.createLinearGradient(0, horizon, 0, H);
    sea.addColorStop(0, "#f2a65a");
    sea.addColorStop(0.18, "#1f7ba6");
    sea.addColorStop(1, "#0c3a5e");
    ctx.fillStyle = sea;
    ctx.fillRect(-40, horizon, W + 80, H - horizon + 40);

    // Rolling wave foam lines.
    ctx.strokeStyle = "rgba(255,255,255,0.28)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      const phase = (dist * 0.04 + i * 0.55) % 3;
      const y = horizon + 14 + Math.pow(phase / 3, 2) * (H - horizon) * 0.95;
      const amp = 3 + (phase / 3) * 10;
      ctx.beginPath();
      for (let x = 0; x <= W; x += 14) {
        const wy = y + Math.sin(x * 0.035 + time * 1.6 + i * 2) * amp;
        if (x === 0) ctx.moveTo(x, wy);
        else ctx.lineTo(x, wy);
      }
      ctx.stroke();
    }

    // Sun reflection shimmer down the middle.
    ctx.save();
    ctx.globalAlpha = 0.22;
    const shimmer = ctx.createLinearGradient(0, horizon, 0, H);
    shimmer.addColorStop(0, "#ffe9a8");
    shimmer.addColorStop(1, "rgba(255,233,168,0)");
    ctx.fillStyle = shimmer;
    ctx.beginPath();
    ctx.moveTo(W * 0.46, horizon);
    ctx.lineTo(W * 0.54, horizon);
    ctx.lineTo(W * 0.68, H);
    ctx.lineTo(W * 0.32, H);
    ctx.closePath();
    ctx.fill();

    // Water light caustics (subtle ripple patterns)
    ctx.globalAlpha = 0.08;
    for (let i = 0; i < 4; i++) {
      const cx = W / 2 + Math.cos(time * 0.5 + i) * W * 0.2;
      const cy = H * 0.7 + Math.sin(time * 0.4 + i * 0.5) * H * 0.15;
      const causticsGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, W * 0.3);
      causticsGrad.addColorStop(0, "#ffffff");
      causticsGrad.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = causticsGrad;
      ctx.fillRect(0, horizon, W, H - horizon);
    }

    ctx.restore();
  }

  private drawSkyline(ctx: CanvasRenderingContext2D, W: number, H: number, time: number) {
    const horizon = H * 0.36;
    ctx.fillStyle = "#1b2647";
    const seed = [0.05, 0.12, 0.2, 0.66, 0.74, 0.82, 0.9];
    for (let i = 0; i < seed.length; i++) {
      const bx = seed[i] * W;
      const bw = W * 0.05;
      const bh = H * (0.045 + ((i * 37) % 13) / 220);
      ctx.fillRect(bx, horizon - bh, bw, bh);
      // Twinkling windows.
      ctx.fillStyle = `rgba(255,220,130,${0.5 + 0.3 * Math.sin(time * 2 + i * 3)})`;
      for (let wy = 0; wy < 3; wy++) {
        for (let wx = 0; wx < 2; wx++) {
          ctx.fillRect(
            bx + 4 + wx * (bw / 2),
            horizon - bh + 6 + wy * (bh / 3.4),
            3,
            4,
          );
        }
      }
      ctx.fillStyle = "#1b2647";
    }

    // Seagulls flying in the distance
    ctx.save();
    ctx.globalAlpha = 0.6;
    for (let i = 0; i < 3; i++) {
      const bx = (time * 12 + i * W / 1.5) % (W * 1.3) - W * 0.15;
      const by = horizon * (0.15 + i * 0.12);
      ctx.fillStyle = "#d0d0d0";
      // Simple V-wing seagull
      ctx.beginPath();
      ctx.moveTo(bx - 4, by);
      ctx.lineTo(bx - 8, by - 3);
      ctx.lineTo(bx - 4, by + 1);
      ctx.lineTo(bx, by);
      ctx.lineTo(bx + 4, by + 1);
      ctx.lineTo(bx + 8, by - 3);
      ctx.lineTo(bx + 4, by);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  /** Distant sailboats drifting across the bay near the horizon. */
  private drawBoats(ctx: CanvasRenderingContext2D, W: number, H: number, time: number) {
    const horizon = H * 0.36;
    const boats = [
      { speed: 7, y: horizon + 18, s: 1, hue: "#f8fafc" },
      { speed: -5, y: horizon + 34, s: 1.3, hue: "#fde68a" },
    ];
    for (let i = 0; i < boats.length; i++) {
      const b = boats[i];
      const span = W * 1.4;
      const bx = ((time * b.speed + i * 600) % span + span) % span - W * 0.2;
      const bob = Math.sin(time * 1.5 + i) * 1.5;
      const y = b.y + bob;
      const s = b.s;
      ctx.save();
      ctx.globalAlpha = 0.85;
      // hull
      ctx.fillStyle = "#26415e";
      ctx.beginPath();
      ctx.moveTo(bx - 9 * s, y);
      ctx.lineTo(bx + 9 * s, y);
      ctx.lineTo(bx + 5 * s, y + 4 * s);
      ctx.lineTo(bx - 5 * s, y + 4 * s);
      ctx.closePath();
      ctx.fill();
      // sail
      ctx.fillStyle = b.hue;
      ctx.beginPath();
      ctx.moveTo(bx, y - 14 * s);
      ctx.lineTo(bx + 7 * s, y - 1 * s);
      ctx.lineTo(bx, y - 1 * s);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(bx, y - 14 * s);
      ctx.lineTo(bx - 6 * s, y - 1 * s);
      ctx.lineTo(bx, y - 1 * s);
      ctx.closePath();
      ctx.fill();
      // reflection
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = b.hue;
      ctx.fillRect(bx - 6 * s, y + 5 * s, 12 * s, 5 * s);
      ctx.restore();
    }
  }

  /** A small V-formation flock gliding across the dawn sky. */
  private drawFlock(ctx: CanvasRenderingContext2D, W: number, H: number, time: number) {
    const horizon = H * 0.36;
    const span = W * 1.5;
    const fx = ((time * 22) % span + span) % span - W * 0.25;
    const fy = horizon * 0.5 + Math.sin(time * 0.6) * 10;
    ctx.save();
    ctx.strokeStyle = "rgba(40,40,55,0.55)";
    ctx.lineWidth = 1.6;
    const flap = 2 + Math.sin(time * 6) * 1.6;
    for (let i = 0; i < 5; i++) {
      const row = i < 3 ? i : i - 2; // two wings
      const side = i < 3 ? -1 : 1;
      const bx = fx + (i < 3 ? -row * 12 : row * 12) * 1;
      const by = fy + (i === 0 ? 0 : Math.abs(side) * row * 7);
      ctx.beginPath();
      ctx.moveTo(bx - 5, by + flap);
      ctx.quadraticCurveTo(bx, by - flap, bx + 5, by + flap);
      ctx.stroke();
    }
    ctx.restore();
  }

  /** Floating scripture banners on poles scrolling past along the boardwalk. */
  private drawBanners(ctx: CanvasRenderingContext2D, W: number, H: number, dist: number) {
    const words = ["HOPE", "FAITH", "GRACE", "VICTORY", "LIGHT", "JOY"];
    for (let z = 16 - (dist % 32); z < SPAWN_Z; z += 32) {
      for (const side of [-2.9, 4.9]) {
        const p = this.project(side, z, W, H);
        const s = p.scale;
        if (s < 0.12) continue;
        const w = 56 * s;
        const h = 26 * s;
        const topY = p.y - 150 * s;
        const sway = Math.sin(dist * 0.03 + z) * 3 * s;
        // pole
        ctx.strokeStyle = "rgba(90,70,45,0.7)";
        ctx.lineWidth = 2.5 * s;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x, topY);
        ctx.stroke();
        // banner
        const idx = Math.abs(Math.round(z)) % words.length;
        ctx.fillStyle = "rgba(124,58,237,0.85)";
        ctx.beginPath();
        ctx.moveTo(p.x + sway, topY);
        ctx.lineTo(p.x + sway + w, topY + 2 * s);
        ctx.lineTo(p.x + sway + w, topY + h);
        ctx.lineTo(p.x + sway + w / 2, topY + h - 6 * s);
        ctx.lineTo(p.x + sway, topY + h);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "rgba(255,224,138,0.9)";
        ctx.lineWidth = 1.5 * s;
        ctx.stroke();
        if (s > 0.3) {
          ctx.fillStyle = "#ffe08a";
          ctx.font = `800 ${Math.round(11 * s)}px Nunito, sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(words[idx], p.x + sway + w / 2, topY + h / 2);
        }
      }
    }
  }

  /** Slow golden atmospheric light motes drifting upward over the scene. */
  private drawMotes(ctx: CanvasRenderingContext2D, W: number, H: number, time: number) {
    ctx.save();
    for (let i = 0; i < 14; i++) {
      const seed = i * 97.3;
      const x = (seed * 13 % W + Math.sin(time * 0.4 + i) * 24 + W) % W;
      const cycle = (time * (8 + (i % 4) * 3) + seed) % H;
      const y = H - cycle;
      const a = 0.12 + 0.12 * Math.sin(time * 2 + i);
      ctx.fillStyle = `rgba(255,240,190,${a})`;
      ctx.beginPath();
      ctx.arc(x, y, 1.3 + (i % 3) * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private drawBoardwalk(ctx: CanvasRenderingContext2D, W: number, H: number, dist: number, engine: GameEngine) {
    const horizon = H * 0.36;
    const danger = Math.max(0, engine.satan - 0.5) * 2;

    // Road body — warm teak, darker as Satan encroaches.
    const left0 = this.project(-1.65, SPAWN_Z, W, H);
    const right0 = this.project(3.65, SPAWN_Z, W, H);
    const leftN = this.project(-1.65, 0, W, H);
    const rightN = this.project(3.65, 0, W, H);
    const deckLight = danger > 0
      ? `rgb(${Math.round(138 - danger * 40)},${Math.round(90 - danger * 30)},${Math.round(51 - danger * 20)})`
      : "#8a5a33";
    const deckDark = danger > 0
      ? `rgb(${Math.round(176 - danger * 50)},${Math.round(122 - danger * 40)},${Math.round(69 - danger * 25)})`
      : "#b07a45";
    const deck = ctx.createLinearGradient(0, horizon, 0, H);
    deck.addColorStop(0, deckLight);
    deck.addColorStop(1, deckDark);
    ctx.fillStyle = deck;
    ctx.beginPath();
    ctx.moveTo(left0.x, left0.y);
    ctx.lineTo(right0.x, right0.y);
    ctx.lineTo(rightN.x + W * 0.45, H + 40);
    ctx.lineTo(leftN.x - W * 0.45, H + 40);
    ctx.closePath();
    ctx.fill();

    // Sun sheen — golden center stripe catching the sunrise light.
    const sheen = ctx.createLinearGradient(0, horizon, 0, H);
    sheen.addColorStop(0, "rgba(255,214,90,0.06)");
    sheen.addColorStop(0.5, "rgba(255,214,90,0.12)");
    sheen.addColorStop(1, "rgba(255,214,90,0.04)");
    ctx.fillStyle = sheen;
    ctx.beginPath();
    ctx.moveTo(W * 0.44, horizon);
    ctx.lineTo(W * 0.56, horizon);
    ctx.lineTo(W * 0.62, H);
    ctx.lineTo(W * 0.38, H);
    ctx.closePath();
    ctx.fill();

    // Plank seams scrolling toward camera.
    ctx.strokeStyle = "rgba(60,35,15,0.5)";
    for (let z = 4 - (dist % 4); z < SPAWN_Z; z += 4) {
      const l = this.project(-1.65, z, W, H);
      const r = this.project(3.65, z, W, H);
      ctx.lineWidth = Math.max(1, 3.5 * l.scale);
      ctx.beginPath();
      ctx.moveTo(l.x, l.y);
      ctx.lineTo(r.x, r.y);
      ctx.stroke();
      // Every 8th plank: brighter highlight plank — sells depth.
      if (Math.round(z + dist) % 8 < 1) {
        ctx.strokeStyle = "rgba(200,150,80,0.2)";
        ctx.lineWidth = Math.max(1, 2.5 * l.scale);
        ctx.beginPath();
        ctx.moveTo(l.x, l.y - 1);
        ctx.lineTo(r.x, r.y - 1);
        ctx.stroke();
        ctx.strokeStyle = "rgba(60,35,15,0.5)";
      }
    }

    // Lane divider lines — glow more intensely under Holy Sprint / Kingdom Surge.
    const rushing = engine.sprintTimer > 0 || engine.surgeTimer > 0;
    const edgeAlpha = rushing ? 0.95 : 0.75;
    const midAlpha = rushing ? 0.55 : 0.28;
    for (const laneEdge of [-0.5, 0.5, 1.5, 2.5]) {
      ctx.beginPath();
      const far = this.project(laneEdge, SPAWN_Z, W, H);
      ctx.moveTo(far.x, far.y);
      for (let z = SPAWN_Z; z >= 0; z -= 4) {
        const pt = this.project(laneEdge, z, W, H);
        ctx.lineTo(pt.x, pt.y);
      }
      ctx.strokeStyle =
        laneEdge === -0.5 || laneEdge === 2.5
          ? `rgba(255,214,102,${edgeAlpha})`
          : `rgba(255,240,200,${midAlpha})`;
      ctx.lineWidth = laneEdge === -0.5 || laneEdge === 2.5 ? 3 : 2;
      ctx.stroke();
    }
  }

  private drawPalms(ctx: CanvasRenderingContext2D, W: number, H: number, dist: number) {
    const horizon = H * 0.36;
    for (let z = 10 - (dist % 20); z < SPAWN_Z; z += 20) {
      for (const side of [-2.6, 4.6]) {
        const p = this.project(side, z, W, H);
        const s = p.scale;
        if (s < 0.07) continue;
        const trunkH = 95 * s;

        // Draw palm tree (with detail and shadow)
        ctx.save();
        ctx.shadowBlur = 8 * s;
        ctx.shadowColor = "rgba(0,0,0,0.3)";

        ctx.strokeStyle = "#6b4226";
        ctx.lineWidth = 7 * s;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.quadraticCurveTo(
          p.x + (side < 0 ? 14 : -14) * s,
          p.y - trunkH * 0.6,
          p.x + (side < 0 ? 22 : -22) * s,
          p.y - trunkH,
        );
        ctx.stroke();

        // Fronds with wind animation
        const topX = p.x + (side < 0 ? 22 : -22) * s;
        const topY = p.y - trunkH;
        ctx.strokeStyle = "#2e8b57";
        ctx.lineWidth = 4 * s;
        for (let f = 0; f < 6; f++) {
          const a = (f / 5) * Math.PI - Math.PI * 0.05;
          const windSway = Math.sin(dist * 0.02 + f) * 0.15;
          ctx.beginPath();
          ctx.moveTo(topX, topY);
          ctx.quadraticCurveTo(
            topX + Math.cos(a + windSway) * 34 * s,
            topY - Math.sin(a + windSway) * 16 * s,
            topX + Math.cos(a + windSway) * 52 * s,
            topY - Math.sin(a + windSway) * 8 * s + 14 * s,
          );
          ctx.stroke();
        }

        // Water reflection of palm
        if (p.y < H * 0.95) {
          ctx.globalAlpha = 0.15;
          ctx.strokeStyle = "#2e8b57";
          ctx.lineWidth = 2 * s;
          const reflectY = H - (p.y - horizon) + horizon;
          for (let f = 0; f < 6; f++) {
            const a = (f / 5) * Math.PI - Math.PI * 0.05;
            const windSway = Math.sin(dist * 0.02 + f) * 0.15;
            ctx.beginPath();
            ctx.moveTo(topX, reflectY);
            ctx.quadraticCurveTo(
              topX + Math.cos(a + windSway) * 34 * s,
              reflectY + Math.sin(a + windSway) * 16 * s,
              topX + Math.cos(a + windSway) * 52 * s,
              reflectY + Math.sin(a + windSway) * 8 * s - 14 * s,
            );
            ctx.stroke();
          }
        }

        ctx.restore();
      }
    }
  }

  // ---- World objects -----------------------------------------------------

  private drawObstacle(
    ctx: CanvasRenderingContext2D,
    ob: Obstacle,
    W: number,
    H: number,
    time: number,
  ) {
    const p = this.project(ob.lane, ob.z, W, H);
    const s = p.scale;
    if (s < 0.06) return;
    const u = 110 * s; // base unit size

    if (ob.burned) {
      ctx.fillStyle = `rgba(255,${120 + Math.sin(time * 20) * 60},40,0.5)`;
      ctx.beginPath();
      ctx.arc(p.x, p.y - u * 0.3, u * 0.35, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    ctx.save();
    // Grounding drop shadow — sells depth for every obstacle.
    ctx.fillStyle = `rgba(0,0,0,${0.3 * Math.min(1, s * 1.4)})`;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + u * 0.04, u * 0.5, u * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();
    switch (ob.kind) {
      case "fallenCrate":
        ctx.fillStyle = "#7a5230";
        ctx.fillRect(p.x - u * 0.45, p.y - u * 0.5, u * 0.9, u * 0.5);
        ctx.strokeStyle = "#4d3018";
        ctx.lineWidth = 3 * s;
        ctx.strokeRect(p.x - u * 0.45, p.y - u * 0.5, u * 0.9, u * 0.5);
        ctx.beginPath();
        ctx.moveTo(p.x - u * 0.45, p.y - u * 0.5);
        ctx.lineTo(p.x + u * 0.45, p.y);
        ctx.moveTo(p.x + u * 0.45, p.y - u * 0.5);
        ctx.lineTo(p.x - u * 0.45, p.y);
        ctx.stroke();
        break;
      case "pitCrack":
        ctx.fillStyle = "#120a18";
        ctx.beginPath();
        ctx.ellipse(p.x, p.y - u * 0.06, u * 0.5, u * 0.16, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(168,85,247,0.6)";
        ctx.lineWidth = 2.5 * s;
        ctx.stroke();
        break;
      case "brokenSign":
        ctx.strokeStyle = "#5b4226";
        ctx.lineWidth = 6 * s;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + u * 0.1, p.y - u * 0.55);
        ctx.stroke();
        ctx.save();
        ctx.translate(p.x + u * 0.1, p.y - u * 0.6);
        ctx.rotate(-0.28);
        ctx.fillStyle = "#caa15a";
        ctx.fillRect(-u * 0.4, -u * 0.18, u * 0.8, u * 0.34);
        ctx.strokeStyle = "#7a5a2a";
        ctx.lineWidth = 2.5 * s;
        ctx.strokeRect(-u * 0.4, -u * 0.18, u * 0.8, u * 0.34);
        ctx.restore();
        break;
      case "darkChains":
        ctx.strokeStyle = "#3a3a4a";
        ctx.lineWidth = 5 * s;
        for (let c = -1; c <= 1; c++) {
          ctx.beginPath();
          ctx.moveTo(p.x + c * u * 0.3 - u * 0.1, p.y);
          ctx.quadraticCurveTo(
            p.x + c * u * 0.3,
            p.y - u * 0.45,
            p.x + c * u * 0.3 + u * 0.1,
            p.y,
          );
          ctx.stroke();
        }
        ctx.fillStyle = "#23232f";
        ctx.fillRect(p.x - u * 0.5, p.y - u * 0.12, u, u * 0.12);
        break;
      case "distractionDrone": {
        const bob = Math.sin(time * 5 + ob.id) * 6 * s;
        const dy = p.y - u * 0.95 + bob;
        ctx.fillStyle = "#3f3f54";
        ctx.beginPath();
        ctx.ellipse(p.x, dy, u * 0.34, u * 0.16, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#8a8aa8";
        ctx.lineWidth = 3 * s;
        for (const rx of [-0.4, 0.4]) {
          ctx.beginPath();
          ctx.ellipse(p.x + rx * u, dy - u * 0.08, u * 0.16, u * 0.045, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.fillStyle = `rgba(255,60,60,${0.6 + 0.4 * Math.sin(time * 8)})`;
        ctx.beginPath();
        ctx.arc(p.x, dy + u * 0.05, u * 0.05, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case "accusationScroll": {
        const dy = p.y - u * 0.95;
        ctx.fillStyle = "#d8c9a3";
        ctx.fillRect(p.x - u * 0.38, dy - u * 0.22, u * 0.76, u * 0.44);
        ctx.fillStyle = "#5b4a85";
        ctx.fillRect(p.x - u * 0.44, dy - u * 0.26, u * 0.08, u * 0.52);
        ctx.fillRect(p.x + u * 0.36, dy - u * 0.26, u * 0.08, u * 0.52);
        ctx.strokeStyle = "#8a2030";
        ctx.lineWidth = 2.5 * s;
        for (let l = 0; l < 3; l++) {
          ctx.beginPath();
          ctx.moveTo(p.x - u * 0.28, dy - u * 0.1 + l * u * 0.12);
          ctx.lineTo(p.x + u * 0.28, dy - u * 0.1 + l * u * 0.12);
          ctx.stroke();
        }
        break;
      }
      case "fearFog": {
        const dy = p.y - u * 0.85;
        for (let f = 0; f < 4; f++) {
          ctx.fillStyle = `rgba(90,90,120,${0.4 - f * 0.07})`;
          ctx.beginPath();
          ctx.arc(
            p.x + Math.sin(time * 1.8 + f * 2) * u * 0.16 + (f - 1.5) * u * 0.16,
            dy + Math.cos(time * 1.4 + f) * u * 0.07,
            u * (0.26 - f * 0.03),
            0,
            Math.PI * 2,
          );
          ctx.fill();
        }
        break;
      }
      case "shadowGate": {
        const gh = u * 1.5;
        const grad = ctx.createLinearGradient(p.x, p.y - gh, p.x, p.y);
        grad.addColorStop(0, "#1a1030");
        grad.addColorStop(1, "#34204f");
        ctx.fillStyle = grad;
        ctx.fillRect(p.x - u * 0.5, p.y - gh, u, gh);
        ctx.strokeStyle = `rgba(168,85,247,${0.55 + 0.3 * Math.sin(time * 4 + ob.id)})`;
        ctx.lineWidth = 3.5 * s;
        ctx.strokeRect(p.x - u * 0.5, p.y - gh, u, gh);
        ctx.beginPath();
        ctx.arc(p.x, p.y - gh, u * 0.5, Math.PI, 0);
        ctx.stroke();
        break;
      }
      case "movingBarrier": {
        const sway = Math.sin(time * 3 + ob.id) * u * 0.08;
        const bh = u * 1.4;
        ctx.fillStyle = "#2b2b3d";
        ctx.fillRect(p.x - u * 0.5 + sway, p.y - bh, u, bh);
        for (let st = 0; st < 4; st++) {
          ctx.fillStyle = st % 2 ? "#f5b82e" : "#1c1c28";
          ctx.fillRect(p.x - u * 0.5 + sway, p.y - bh + st * (bh / 4), u, bh / 8);
        }
        break;
      }
    }
    ctx.restore();
  }

  private drawCollectible(
    ctx: CanvasRenderingContext2D,
    c: Collectible,
    W: number,
    H: number,
    time: number,
  ) {
    const p = this.project(c.laneX, c.z, W, H);
    const s = p.scale;
    if (s < 0.06) return;
    const bob = Math.sin(time * 4 + c.id) * 5 * s;
    const y = p.y - 46 * s + bob;
    const r = 17 * s;
    ctx.save();
    // Soft contact shadow beneath floating collectibles.
    ctx.fillStyle = `rgba(0,0,0,${0.18 * Math.min(1, s * 1.4)})`;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + 2 * s, r * 0.8, r * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();
    switch (c.kind) {
      case "coin": {
        const glow = ctx.createRadialGradient(p.x, y, r * 0.2, p.x, y, r * 2.2);
        glow.addColorStop(0, "rgba(255,214,90,0.55)");
        glow.addColorStop(1, "rgba(255,214,90,0)");
        ctx.fillStyle = glow;
        ctx.fillRect(p.x - r * 2.2, y - r * 2.2, r * 4.4, r * 4.4);
        ctx.fillStyle = "#ffd35c";
        ctx.beginPath();
        ctx.arc(p.x, y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#b8860b";
        ctx.lineWidth = 2 * s;
        ctx.stroke();
        // Cross emblem.
        ctx.strokeStyle = "#9a6d00";
        ctx.lineWidth = 3 * s;
        ctx.beginPath();
        ctx.moveTo(p.x, y - r * 0.55);
        ctx.lineTo(p.x, y + r * 0.55);
        ctx.moveTo(p.x - r * 0.38, y - r * 0.15);
        ctx.lineTo(p.x + r * 0.38, y - r * 0.15);
        ctx.stroke();
        break;
      }
      case "scroll":
        ctx.fillStyle = "#f5ecd0";
        ctx.fillRect(p.x - r, y - r * 0.7, r * 2, r * 1.4);
        ctx.fillStyle = "#caa15a";
        ctx.fillRect(p.x - r * 1.2, y - r * 0.85, r * 0.4, r * 1.7);
        ctx.fillRect(p.x + r * 0.8, y - r * 0.85, r * 0.4, r * 1.7);
        ctx.strokeStyle = "#8a6d3b";
        ctx.lineWidth = 1.5 * s;
        ctx.beginPath();
        ctx.moveTo(p.x - r * 0.6, y - r * 0.2);
        ctx.lineTo(p.x + r * 0.6, y - r * 0.2);
        ctx.moveTo(p.x - r * 0.6, y + r * 0.2);
        ctx.lineTo(p.x + r * 0.6, y + r * 0.2);
        ctx.stroke();
        break;
      case "crown":
        ctx.fillStyle = "#ffd35c";
        ctx.beginPath();
        ctx.moveTo(p.x - r, y + r * 0.5);
        ctx.lineTo(p.x - r, y - r * 0.3);
        ctx.lineTo(p.x - r * 0.5, y + r * 0.1);
        ctx.lineTo(p.x, y - r * 0.7);
        ctx.lineTo(p.x + r * 0.5, y + r * 0.1);
        ctx.lineTo(p.x + r, y - r * 0.3);
        ctx.lineTo(p.x + r, y + r * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#e0356a";
        ctx.beginPath();
        ctx.arc(p.x, y + r * 0.1, r * 0.18, 0, Math.PI * 2);
        ctx.fill();
        break;
      case "key":
        ctx.strokeStyle = "#ffd35c";
        ctx.lineWidth = 4 * s;
        ctx.beginPath();
        ctx.arc(p.x, y - r * 0.4, r * 0.45, 0, Math.PI * 2);
        ctx.moveTo(p.x, y + r * 0.05);
        ctx.lineTo(p.x, y + r * 0.9);
        ctx.moveTo(p.x, y + r * 0.6);
        ctx.lineTo(p.x + r * 0.4, y + r * 0.6);
        ctx.stroke();
        break;
      case "gem":
        ctx.fillStyle = "#67e8f9";
        ctx.beginPath();
        ctx.moveTo(p.x, y - r);
        ctx.lineTo(p.x + r * 0.85, y - r * 0.2);
        ctx.lineTo(p.x, y + r);
        ctx.lineTo(p.x - r * 0.85, y - r * 0.2);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "#22d3ee";
        ctx.lineWidth = 2 * s;
        ctx.stroke();
        break;
    }
    ctx.restore();
  }

  private drawPickup(
    ctx: CanvasRenderingContext2D,
    p_: PowerUpPickup,
    W: number,
    H: number,
    time: number,
  ) {
    const p = this.project(p_.lane, p_.z, W, H);
    const s = p.scale;
    if (s < 0.06) return;
    const y = p.y - 50 * s + Math.sin(time * 3 + p_.id) * 6 * s;
    const r = 26 * s;
    const colors: Record<string, string> = {
      shield: "#f5b82e",
      scriptureBoost: "#a78bfa",
      magnet: "#38bdf8",
      revivalFire: "#fb7185",
      wings: "#f9fafb",
      holySprint: "#fbbf24",
      angelDash: "#60a5fa",
      livingWater: "#22d3ee",
      armorGod: "#a78bfa",
      kingdomSurge: "#34d399",
    };
    const premium =
      p_.kind === "holySprint" ||
      p_.kind === "angelDash" ||
      p_.kind === "livingWater" ||
      p_.kind === "armorGod" ||
      p_.kind === "kingdomSurge";
    const color = colors[p_.kind];
    const glow = ctx.createRadialGradient(p.x, y, r * 0.2, p.x, y, r * (premium ? 2.6 : 2));
    glow.addColorStop(0, color + "cc");
    glow.addColorStop(1, color + "00");
    ctx.fillStyle = glow;
    ctx.fillRect(p.x - r * 2.6, y - r * 2.6, r * 5.2, r * 5.2);
    ctx.fillStyle = "rgba(10,16,36,0.85)";
    ctx.beginPath();
    ctx.arc(p.x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3.5 * s;
    ctx.stroke();
    // Premium pickups spin a second halo ring so they read as special.
    if (premium) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2 * s;
      ctx.globalAlpha = 0.55 + 0.35 * Math.sin(time * 6 + p_.id);
      ctx.beginPath();
      ctx.ellipse(p.x, y, r * 1.5, r * 0.55, time * 1.8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    const icons: Record<string, string> = {
      shield: "🛡",
      scriptureBoost: "📖",
      magnet: "👑",
      revivalFire: "🔥",
      wings: "🕊",
      holySprint: "⚡",
      angelDash: "💨",
      livingWater: "🌊",
      armorGod: "⚔️",
      kingdomSurge: "👑",
    };
    ctx.font = `${Math.round(26 * s)}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(icons[p_.kind], p.x, y + 1);
  }

  // ---- Player (AAA Stylized Characters with Personality) ----

  private drawPlayer(
    ctx: CanvasRenderingContext2D,
    engine: GameEngine,
    ch: CharacterDef,
    W: number,
    H: number,
    time: number,
  ) {
    const p = this.project(engine.laneX, 0, W, H);
    const jumpPx = engine.y * H * 0.055;
    const baseY = p.y - jumpPx;
    const slide = engine.sliding > 0;
    const airborne = engine.y > 0.2;
    const runPhase = engine.stats.distance * 1.9;
    const bounce = airborne || slide ? 0 : Math.abs(Math.sin(runPhase)) * 3;

    ctx.save();

    // ---- Holy light: a bright golden-white aura marks the child of God as
    // radiant and set apart — the visual opposite of the dark Accuser. ----
    const auraY = baseY - 58;
    const auraGlow = ctx.createRadialGradient(p.x, auraY, 8, p.x, auraY, 110);
    auraGlow.addColorStop(0, "rgba(255,252,236,0.55)");
    auraGlow.addColorStop(0.4, "rgba(255,230,160,0.28)");
    auraGlow.addColorStop(1, "rgba(255,226,150,0)");
    ctx.fillStyle = auraGlow;
    ctx.beginPath();
    ctx.arc(p.x, auraY, 110, 0, Math.PI * 2);
    ctx.fill();

    // Bright body-core backlight so the hero always reads as light, never dark.
    const core = ctx.createRadialGradient(p.x, baseY - 50, 4, p.x, baseY - 50, 56);
    core.addColorStop(0, "rgba(255,255,250,0.5)");
    core.addColorStop(1, "rgba(255,255,250,0)");
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(p.x, baseY - 50, 56, 0, Math.PI * 2);
    ctx.fill();

    // Motion trail streaking back from the hero — tinted by the equipped board.
    const trail = this.board ? this.rgba(this.board.trail, 1).slice(5, -1).split(",").slice(0, 3).join(",") : "255,244,210";
    for (let i = 1; i <= 5; i++) {
      const a = 0.18 * (1 - i / 6);
      ctx.fillStyle = `rgba(${trail},${a})`;
      ctx.beginPath();
      ctx.ellipse(p.x, baseY - 40 + i * 6, 22 - i * 2, 40 - i * 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Per-character signature effect — a unique, recognizable flourish.
    this.drawSignature(ctx, ch, p.x, baseY, time);

    // Big grounding drop shadow on the deck (drawn first, under the board).
    ctx.fillStyle = `rgba(0,0,0,${0.4 - Math.min(0.3, engine.y * 0.08)})`;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + 10, 64 - engine.y * 5, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Draw the premium scripture hoverboard beneath the hero's feet.
    this.drawHoverboard(ctx, p.x, baseY + 22, ch, time, engine);

    // Holy Sprint: golden flame wake behind the runner.
    if (engine.sprintTimer > 0) {
      for (let f = 0; f < 7; f++) {
        const fy = baseY - 30 + f * 11 + Math.sin(time * 18 + f * 3) * 4;
        ctx.fillStyle = `rgba(255,${200 - f * 18},60,${0.42 - f * 0.05})`;
        ctx.beginPath();
        ctx.arc(p.x + Math.sin(time * 16 + f) * 6, fy + 30, 15 - f * 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Kingdom Surge: radiant emerald-gold mantle with sweeping rays.
    if (engine.surgeTimer > 0) {
      const sg = ctx.createRadialGradient(p.x, baseY - 52, 8, p.x, baseY - 52, 90);
      sg.addColorStop(0, "rgba(52,211,153,0.35)");
      sg.addColorStop(0.6, "rgba(255,214,90,0.18)");
      sg.addColorStop(1, "rgba(52,211,153,0)");
      ctx.fillStyle = sg;
      ctx.beginPath();
      ctx.arc(p.x, baseY - 52, 92, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `rgba(52,211,153,${0.5 + 0.3 * Math.sin(time * 10)})`;
      ctx.lineWidth = 2.5;
      for (let r = 0; r < 6; r++) {
        const a = time * 2.4 + (r / 6) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(p.x + Math.cos(a) * 50, baseY - 52 + Math.sin(a) * 50);
        ctx.lineTo(p.x + Math.cos(a) * 78, baseY - 52 + Math.sin(a) * 78);
        ctx.stroke();
      }
    }

    // Angel Dash: ghostly after-images trailing behind.
    if (engine.invincibleTimer > 0) {
      for (let g = 3; g >= 1; g--) {
        ctx.fillStyle = `rgba(147,197,253,${0.12 * g})`;
        ctx.beginPath();
        ctx.ellipse(p.x, baseY - 52 + g * 14, 26, 50, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Wings of Mercy.
    if (engine.wingsTimer > 0) {
      const flap = Math.sin(time * 9) * 0.25;
      ctx.fillStyle = "rgba(255,250,235,0.85)";
      for (const dir of [-1, 1]) {
        ctx.save();
        ctx.translate(p.x, baseY - 62);
        ctx.rotate(dir * (0.5 + flap));
        ctx.beginPath();
        ctx.ellipse(dir * 34, 0, 36, 13, dir * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // Revival Fire trail.
    if (engine.revivalTimer > 0) {
      for (let f = 0; f < 6; f++) {
        const fy = baseY + 8 + f * 9;
        ctx.fillStyle = `rgba(255,${130 - f * 14},40,${0.5 - f * 0.07})`;
        ctx.beginPath();
        ctx.arc(p.x + Math.sin(time * 14 + f * 2) * 7, fy, 13 - f * 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // ---- Draw character body with unique personality ----
    // HERO SCALE: the runner is a proper hero, occupying real screen space.
    // Feet stay planted as the body grows (anchor at local foot y ≈ 13).
    const HERO = 2.7;
    ctx.translate(p.x, baseY - bounce);
    ctx.translate(0, 13 * (1 - HERO));
    ctx.rotate(slide ? 0 : -0.06);
    ctx.lineCap = "round";

    // Squash and stretch animation
    let scaleX = 1;
    let scaleY = 1;
    if (airborne) {
      // Anticipation: compress before jump, stretch in air
      const jumpPhase = Math.min(1, bounce / 60); // normalized 0..1
      if (jumpPhase < 0.3) {
        // Compression phase (first 30% of jump)
        scaleY = 1 - (0.3 - jumpPhase) * 0.15; // compress to 0.85
        scaleX = 1 + (0.3 - jumpPhase) * 0.1;  // stretch horizontally
      } else {
        // Air phase
        scaleY = 1.05;
        scaleX = 0.95;
      }
    } else if (slide) {
      // Slide: compress vertically, stretch horizontally
      scaleY = 0.7;
      scaleX = 1.25;
    } else {
      // Running: subtle squash/stretch with running cycle
      const stretchFactor = Math.abs(Math.sin(runPhase) * 0.08);
      scaleY = 1 - stretchFactor * 0.5;
      scaleX = 1 + stretchFactor * 0.3;
    }

    ctx.scale(scaleX * HERO, scaleY * HERO);

    // Call character-specific renderer
    const img = this.getCharImage(ch.id);
    if (img.complete && img.naturalWidth > 0) {
      const height = 48;
      const width = height * (img.naturalWidth / img.naturalHeight);
      ctx.drawImage(img, -width / 2, -35, width, height);
    } else {
      switch (ch.id) {
        case "zion":
          this.drawZion(ctx, ch, time, runPhase, airborne, slide);
          break;
        case "grace":
          this.drawGrace(ctx, ch, time, runPhase, airborne, slide);
          break;
        case "judah":
          this.drawJudah(ctx, ch, time, runPhase, airborne, slide);
          break;
        case "kai":
          this.drawKai(ctx, ch, time, runPhase, airborne, slide);
          break;
        default:
          this.drawZion(ctx, ch, time, runPhase, airborne, slide);
      }
    }

    ctx.restore();
    ctx.save();

    // ---- Holy light above the head: a reverent halo ring, a soft glow,
    // and gentle light particles rising upward. ----
    const headTop = baseY - 96;
    // Soft glow behind the halo.
    const hg = ctx.createRadialGradient(p.x, headTop, 2, p.x, headTop, 34);
    hg.addColorStop(0, `rgba(255,252,235,${0.6 + 0.15 * Math.sin(time * 3)})`);
    hg.addColorStop(1, "rgba(255,236,170,0)");
    ctx.fillStyle = hg;
    ctx.beginPath();
    ctx.arc(p.x, headTop, 34, 0, Math.PI * 2);
    ctx.fill();
    // Halo ring (a thin tilted ellipse of light, not a costume prop).
    ctx.strokeStyle = `rgba(255,240,180,${0.7 + 0.2 * Math.sin(time * 3)})`;
    ctx.lineWidth = 3;
    ctx.shadowBlur = 10;
    ctx.shadowColor = "rgba(255,236,170,0.9)";
    ctx.beginPath();
    ctx.ellipse(p.x, headTop, 17, 6, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
    // Rising light particles + scripture sparkles.
    for (let i = 0; i < 5; i++) {
      const ph = (time * 0.8 + i * 0.37) % 1;
      const py2 = headTop - ph * 46;
      const px2 = p.x + Math.sin(time * 2 + i * 2) * 12;
      const a = (1 - ph) * 0.85;
      ctx.fillStyle = `rgba(255,247,214,${a})`;
      ctx.beginPath();
      ctx.arc(px2, py2, 2.2 - ph * 1.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Shield of Faith aura (double ring when Armor of God is up).
    if (engine.shieldCharges > 0) {
      const pulse = 1 + Math.sin(time * 6) * 0.06;
      for (let ring = 0; ring < engine.shieldCharges; ring++) {
        const rad = (66 + ring * 12) * pulse;
        const sg = ctx.createRadialGradient(
          p.x, baseY - 50, 10,
          p.x, baseY - 50, rad,
        );
        sg.addColorStop(0, "rgba(255,214,90,0)");
        sg.addColorStop(0.75, "rgba(255,214,90,0.1)");
        sg.addColorStop(0.95, `rgba(255,214,90,${0.5 - ring * 0.15})`);
        sg.addColorStop(1, "rgba(255,214,90,0)");
        ctx.fillStyle = sg;
        ctx.beginPath();
        ctx.arc(p.x, baseY - 50, rad + 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Angel Dash: bright holy outline flicker.
    if (engine.invincibleTimer > 0) {
      ctx.strokeStyle = `rgba(191,219,254,${0.55 + 0.35 * Math.sin(time * 20)})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(p.x, baseY - 50, 30, 56, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Scripture Boost halo.
    if (engine.boostTimer > 0) {
      ctx.strokeStyle = `rgba(167,139,250,${0.5 + 0.3 * Math.sin(time * 8)})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(p.x, baseY - 112, 16, 5, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  /** A unique signature flourish per character — recognizable at a glance. */
  private drawSignature(
    ctx: CanvasRenderingContext2D,
    ch: CharacterDef,
    x: number,
    baseY: number,
    time: number,
  ) {
    const cy = baseY - 52;
    ctx.save();
    switch (ch.id) {
      case "zion": {
        // Hope sparks — blue & gold motes orbiting steadily.
        for (let i = 0; i < 5; i++) {
          const a = time * 2 + (i / 5) * Math.PI * 2;
          const r = 40 + Math.sin(time * 3 + i) * 5;
          const sx = x + Math.cos(a) * r;
          const sy = cy + Math.sin(a) * r * 0.5;
          ctx.fillStyle = i % 2 ? "rgba(96,165,250,0.8)" : "rgba(245,184,46,0.85)";
          ctx.beginPath();
          ctx.arc(sx, sy, 2.6, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }
      case "grace": {
        // Gentle violet petals drifting upward.
        for (let i = 0; i < 5; i++) {
          const ph = (time * 0.7 + i * 0.4) % 1;
          const sy = cy + 30 - ph * 70;
          const sx = x + Math.sin(time * 2 + i * 2) * 22;
          ctx.globalAlpha = (1 - ph) * 0.8;
          ctx.fillStyle = i % 2 ? "rgba(196,181,253,0.9)" : "rgba(244,241,255,0.9)";
          ctx.beginPath();
          ctx.ellipse(sx, sy, 3, 4.5, Math.sin(time + i), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        break;
      }
      case "judah": {
        // Rising gold embers + a faint roar ring pulse.
        const pulse = (time * 0.8) % 1;
        ctx.strokeStyle = `rgba(245,184,46,${(1 - pulse) * 0.5})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(x, cy + 6, 30 + pulse * 36, 12 + pulse * 14, 0, 0, Math.PI * 2);
        ctx.stroke();
        for (let i = 0; i < 5; i++) {
          const ph = (time * 1.1 + i * 0.45) % 1;
          const sy = cy + 26 - ph * 64;
          const sx = x + Math.sin(time * 3 + i * 2) * 16;
          ctx.globalAlpha = (1 - ph) * 0.85;
          ctx.fillStyle = "rgba(255,196,70,0.95)";
          ctx.beginPath();
          ctx.arc(sx, sy, 2.4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        break;
      }
      case "kai": {
        // Teal water droplets flicking off the board, surfer-style.
        for (let i = 0; i < 6; i++) {
          const ph = (time * 1.4 + i * 0.3) % 1;
          const side = i % 2 ? 1 : -1;
          const sx = x + side * (18 + ph * 30);
          const sy = cy + 28 - ph * 30 + ph * ph * 30;
          ctx.globalAlpha = (1 - ph) * 0.8;
          ctx.fillStyle = i % 2 ? "rgba(20,184,166,0.9)" : "rgba(165,243,252,0.9)";
          ctx.beginPath();
          ctx.arc(sx, sy, 2.6, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        break;
      }
    }
    ctx.restore();
  }

  private boardName(ch: CharacterDef): string {
    switch (ch.id) {
      case "zion": return "JOHN 3:16";
      case "grace": return "LIVING WATER";
      case "judah": return "LION OF JUDAH";
      case "kai": return "ARMOR OF GOD";
      default: return ch.clothingText.split(" ")[0];
    }
  }

  private drawHoverboard(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    ch: CharacterDef,
    time: number,
    engine: GameEngine,
  ) {
    // Premium pseudo-3D scripture hoverboard — glowing edges, rotating shimmer,
    // particle trail, and the equipped board's scripture printed across the deck.
    const boardW = 118;   // big enough to ground the hero
    const boardH = 30;
    const thickness = 9;  // pseudo-3D side height
    // Use the equipped board's look; Kingdom Surge always blazes emerald.
    const deckColor = this.board ? this.board.color : ch.colors.primary;
    const deckEdge = this.board ? this.board.edge : ch.colors.secondary;
    const deckText = this.board ? this.board.text : this.boardName(ch);
    const boardColor = engine.surgeTimer > 0 ? "#34d399" : deckColor;
    const edge = engine.surgeTimer > 0 ? "#a7f3d0" : deckEdge;
    const hover = Math.sin(time * 4) * 2; // gentle hover bob
    const cy = y + hover;

    ctx.save();

    // Hover glow pool on the deck below the board.
    const pool = ctx.createRadialGradient(x, cy + thickness + 6, 4, x, cy + thickness + 6, boardW * 0.7);
    pool.addColorStop(0, this.rgba(edge, 0.45));
    pool.addColorStop(1, this.rgba(edge, 0));
    ctx.fillStyle = pool;
    ctx.beginPath();
    ctx.ellipse(x, cy + thickness + 6, boardW * 0.62, boardH * 0.9, 0, 0, Math.PI * 2);
    ctx.fill();

    // Particle trail streaking off the tail.
    for (let i = 0; i < 6; i++) {
      const tt = (time * 2 + i * 0.5) % 1;
      const tx = x - boardW * 0.45 - tt * 46;
      const ta = (1 - tt) * 0.5;
      ctx.fillStyle = this.rgba(edge, ta);
      ctx.beginPath();
      ctx.ellipse(tx, cy + (Math.sin(time * 9 + i) * 3), 7 * (1 - tt) + 2, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Pseudo-3D side (thickness) — darker underside.
    ctx.fillStyle = this.darken(boardColor);
    ctx.beginPath();
    ctx.ellipse(x, cy + thickness, boardW / 2, boardH / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Deck top with lengthwise gradient.
    const grad = ctx.createLinearGradient(x - boardW / 2, cy, x + boardW / 2, cy);
    grad.addColorStop(0, this.darken(boardColor));
    grad.addColorStop(0.5, this.lighten(boardColor));
    grad.addColorStop(1, this.darken(boardColor));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(x, cy, boardW / 2, boardH / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Glowing rotating shimmer sweeping along the deck.
    const sweep = (Math.sin(time * 2.2) * 0.5 + 0.5);
    const shimX = x - boardW * 0.4 + sweep * boardW * 0.8;
    const sg = ctx.createRadialGradient(shimX, cy - 3, 0, shimX, cy - 3, boardW * 0.32);
    sg.addColorStop(0, "rgba(255,255,255,0.55)");
    sg.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = sg;
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(x, cy, boardW / 2, boardH / 2, 0, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillRect(x - boardW / 2, cy - boardH / 2, boardW, boardH);
    ctx.restore();

    // Bright glowing edge.
    ctx.shadowBlur = 12;
    ctx.shadowColor = edge;
    ctx.strokeStyle = edge;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(x, cy, boardW / 2, boardH / 2, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Scripture text across the deck.
    ctx.fillStyle = "#ffffff";
    ctx.font = `800 12px Nunito, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowBlur = 6;
    ctx.shadowColor = edge;
    ctx.fillText(deckText, x, cy);
    ctx.shadowBlur = 0;

    ctx.restore();
  }

  /** Convert a #rrggbb hex to an rgba() string with the given alpha. */
  private rgba(hex: string, a: number): string {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  }

  // ---- Character-specific renderers ----

  private drawZion(
    ctx: CanvasRenderingContext2D,
    ch: CharacterDef,
    _time: number,
    runPhase: number,
    airborne: boolean,
    slide: boolean,
  ) {
    // Zion: athletic, confident, blue/gold, runs with authority
    const skin = ch.colors.skin;
    const blue = ch.colors.primary;
    const gold = ch.colors.secondary;

    if (slide) {
      // Diving slide
      ctx.rotate(-0.3);
      ctx.fillStyle = blue;
      ctx.fillRect(-14, -8, 28, 16);
      ctx.fillStyle = skin;
      ctx.beginPath();
      ctx.arc(12, -12, 9, 0, Math.PI * 2);
      ctx.fill();
    } else if (airborne) {
      // Jump tuck
      ctx.fillStyle = blue;
      ctx.fillRect(-10, -20, 20, 28);
      ctx.fillStyle = skin;
      ctx.arc(0, -22, 8.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Running pose
      const swing = Math.sin(runPhase) * 14;
      const lift = Math.max(0, -Math.cos(runPhase)) * 8;

      // Legs: thighs + shins
      ctx.strokeStyle = "#5566a0";
      ctx.lineWidth = 9;
      for (const dir of [1, -1]) {
        ctx.beginPath();
        ctx.moveTo(dir * 6, -18);
        ctx.lineTo(dir * 6 + swing * 0.6, -6 - lift);
        ctx.lineTo(dir * 6 + swing, 8);
        ctx.stroke();
      }

      // Shoes with gold accents
      ctx.fillStyle = "#f5f5f5";
      ctx.beginPath();
      ctx.ellipse(-8 + swing, 9, 7, 4, -0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(8 + swing, 9, 7, 4, 0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = gold;
      ctx.fillRect(-14 + swing, 10, 7, 2);
      ctx.fillRect(7 + swing, 10, 7, 2);

      // Torso: blue hoodie
      ctx.fillStyle = blue;
      ctx.beginPath();
      ctx.moveTo(-16, -8);
      ctx.quadraticCurveTo(0, -14, 16, -8);
      ctx.quadraticCurveTo(18, 8, 12, 18);
      ctx.quadraticCurveTo(0, 22, -12, 18);
      ctx.quadraticCurveTo(-18, 8, -16, -8);
      ctx.closePath();
      ctx.fill();

      // Gold chest stripe
      ctx.strokeStyle = gold;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 4, 7, 0, Math.PI * 2);
      ctx.stroke();

      // Arms: pumping
      ctx.strokeStyle = blue;
      ctx.lineWidth = 7;
      for (const dir of [1, -1]) {
        const armSwing = Math.sin(runPhase + (dir > 0 ? Math.PI : 0)) * 10;
        ctx.beginPath();
        ctx.moveTo(dir * 14, -6);
        ctx.lineTo(dir * 16 + armSwing * 0.4, 8 + armSwing);
        ctx.stroke();
        // Fist
        ctx.fillStyle = skin;
        ctx.beginPath();
        ctx.arc(dir * 16 + armSwing * 0.4, 14 + armSwing, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Head: confident expression
      ctx.fillStyle = skin;
      ctx.beginPath();
      ctx.arc(0, -24, 10, 0, Math.PI * 2);
      ctx.fill();

      // Hair: clean, rounded short cap (bright & wholesome — never spiky).
      ctx.fillStyle = "#3a2415";
      ctx.beginPath();
      ctx.arc(0, -25, 10.5, Math.PI, 0);
      ctx.quadraticCurveTo(8, -22, 0, -22.5);
      ctx.quadraticCurveTo(-8, -22, -10.5, -25);
      ctx.closePath();
      ctx.fill();

      // Eyes: confident
      ctx.fillStyle = "#1c1c28";
      ctx.beginPath();
      ctx.ellipse(-3, -26, 1.8, 2.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(3, -26, 1.8, 2.2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Smile: confident smirk
      ctx.strokeStyle = "#1c1c28";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, -21, 4, 0, Math.PI);
      ctx.stroke();
    }
  }

  private drawGrace(
    ctx: CanvasRenderingContext2D,
    ch: CharacterDef,
    _time: number,
    runPhase: number,
    airborne: boolean,
    slide: boolean,
  ) {
    // Grace: athletic female, elegant, white/purple, graceful movement
    const skin = ch.colors.skin;
    const white = ch.colors.primary;
    const purple = ch.colors.secondary;

    if (slide) {
      // Sliding gracefully
      ctx.rotate(-0.25);
      ctx.fillStyle = white;
      ctx.fillRect(-14, -8, 28, 16);
      ctx.fillStyle = skin;
      ctx.beginPath();
      ctx.arc(12, -12, 8.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (airborne) {
      // Graceful jump
      ctx.fillStyle = white;
      ctx.fillRect(-10, -24, 20, 32);
      ctx.fillStyle = skin;
      ctx.arc(0, -26, 8, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Running: smooth, flowing
      const swing = Math.sin(runPhase) * 15;
      const lift = Math.max(0, -Math.cos(runPhase)) * 9;

      // Legs: athletic
      ctx.strokeStyle = "#5566a0";
      ctx.lineWidth = 8;
      for (const dir of [1, -1]) {
        ctx.beginPath();
        ctx.moveTo(dir * 5, -20);
        ctx.lineTo(dir * 5 + swing * 0.5, -8 - lift);
        ctx.lineTo(dir * 5 + swing, 10);
        ctx.stroke();
      }

      // Shoes: sleek
      ctx.fillStyle = white;
      ctx.beginPath();
      ctx.ellipse(-7 + swing, 11, 6, 3.5, -0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(7 + swing, 11, 6, 3.5, 0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = purple;
      ctx.fillRect(-12 + swing, 12, 6, 1.5);
      ctx.fillRect(6 + swing, 12, 6, 1.5);

      // Torso: white and purple outfit
      ctx.fillStyle = white;
      ctx.beginPath();
      ctx.moveTo(-15, -10);
      ctx.quadraticCurveTo(0, -16, 15, -10);
      ctx.quadraticCurveTo(17, 6, 10, 18);
      ctx.quadraticCurveTo(0, 21, -10, 18);
      ctx.quadraticCurveTo(-17, 6, -15, -10);
      ctx.closePath();
      ctx.fill();

      // Purple accent stripe
      ctx.fillStyle = purple;
      ctx.fillRect(-2, -8, 4, 18);

      // Arms: graceful pump
      ctx.strokeStyle = white;
      ctx.lineWidth = 6.5;
      for (const dir of [1, -1]) {
        const armSwing = Math.sin(runPhase + (dir > 0 ? Math.PI : 0)) * 11;
        ctx.beginPath();
        ctx.moveTo(dir * 13, -8);
        ctx.lineTo(dir * 15 + armSwing * 0.5, 10 + armSwing);
        ctx.stroke();
        // Wrist glow
        ctx.fillStyle = `rgba(167,139,250,0.3)`;
        ctx.beginPath();
        ctx.arc(dir * 15 + armSwing * 0.5, 16 + armSwing, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Head: friendly, expressive
      ctx.fillStyle = skin;
      ctx.beginPath();
      ctx.arc(0, -26, 9.5, 0, Math.PI * 2);
      ctx.fill();

      // Hair: long ponytail with secondary motion (swing)
      ctx.fillStyle = "#8B4513";
      const ponytailWave = Math.sin(runPhase) * 4; // Secondary motion
      ctx.beginPath();
      ctx.moveTo(-9 + ponytailWave, -22);
      ctx.quadraticCurveTo(-8 + ponytailWave, -10, -6 + ponytailWave, 8);
      ctx.quadraticCurveTo(-4 + ponytailWave, 12, 0 + ponytailWave, 14);
      ctx.quadraticCurveTo(4 + ponytailWave, 12, 6 + ponytailWave, 8);
      ctx.quadraticCurveTo(8 + ponytailWave, -10, 9 + ponytailWave, -22);
      ctx.closePath();
      ctx.fill();

      // Eyes: friendly and kind
      ctx.fillStyle = "#6B4423";
      ctx.beginPath();
      ctx.ellipse(-3, -27, 2, 2.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(3, -27, 2, 2.4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Kind smile
      ctx.strokeStyle = "#6B4423";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(0, -22, 3.5, 0, Math.PI);
      ctx.stroke();
    }
  }

  private drawJudah(
    ctx: CanvasRenderingContext2D,
    ch: CharacterDef,
    _time: number,
    runPhase: number,
    airborne: boolean,
    slide: boolean,
  ) {
    // Judah: bold, strong, lion symbolism, black/gold, powerful
    const skin = ch.colors.skin;
    const black = ch.colors.primary;
    const gold = ch.colors.secondary;

    if (slide) {
      ctx.rotate(-0.2);
      ctx.fillStyle = black;
      ctx.fillRect(-15, -9, 30, 18);
      ctx.fillStyle = skin;
      ctx.beginPath();
      ctx.arc(13, -13, 9, 0, Math.PI * 2);
      ctx.fill();
    } else if (airborne) {
      ctx.fillStyle = black;
      ctx.fillRect(-11, -22, 22, 30);
      ctx.fillStyle = skin;
      ctx.arc(0, -24, 9, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const swing = Math.sin(runPhase) * 13;
      const lift = Math.max(0, -Math.cos(runPhase)) * 8;

      // Legs: powerful stride
      ctx.strokeStyle = "#5566a0";
      ctx.lineWidth = 10;
      for (const dir of [1, -1]) {
        ctx.beginPath();
        ctx.moveTo(dir * 8, -16);
        ctx.lineTo(dir * 8 + swing * 0.7, -4 - lift);
        ctx.lineTo(dir * 8 + swing, 12);
        ctx.stroke();
      }

      // Boots with gold trim
      ctx.fillStyle = "#1a1a1a";
      ctx.beginPath();
      ctx.ellipse(-9 + swing, 13, 8, 4.5, -0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(9 + swing, 13, 8, 4.5, 0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = gold;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(-9 + swing, 13, 8, 4.5, -0.15, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(9 + swing, 13, 8, 4.5, 0.15, 0, Math.PI * 2);
      ctx.stroke();

      // Torso: black with gold accents
      ctx.fillStyle = black;
      ctx.beginPath();
      ctx.moveTo(-17, -6);
      ctx.quadraticCurveTo(0, -13, 17, -6);
      ctx.quadraticCurveTo(19, 8, 12, 20);
      ctx.quadraticCurveTo(0, 24, -12, 20);
      ctx.quadraticCurveTo(-19, 8, -17, -6);
      ctx.closePath();
      ctx.fill();

      // Gold lion logo on chest
      ctx.fillStyle = gold;
      ctx.beginPath();
      ctx.arc(0, 4, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = black;
      ctx.font = `900 8px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("🦁", 0, 5);

      // Arms: powerful pump
      ctx.strokeStyle = black;
      ctx.lineWidth = 8;
      for (const dir of [1, -1]) {
        const armSwing = Math.sin(runPhase + (dir > 0 ? Math.PI : 0)) * 9;
        ctx.beginPath();
        ctx.moveTo(dir * 15, -4);
        ctx.lineTo(dir * 18 + armSwing * 0.5, 12 + armSwing);
        ctx.stroke();
      }

      // Head: strong, determined
      ctx.fillStyle = skin;
      ctx.beginPath();
      ctx.arc(0, -25, 10, 0, Math.PI * 2);
      ctx.fill();

      // Hair: clean rounded short cap (no spikes).
      ctx.fillStyle = "#2a1a0f";
      ctx.beginPath();
      ctx.arc(0, -25, 10.5, Math.PI, 0);
      ctx.quadraticCurveTo(8, -22, 0, -22.5);
      ctx.quadraticCurveTo(-8, -22, -10.5, -25);
      ctx.closePath();
      ctx.fill();

      // Gold crown accent — the Lion of Judah reigns.
      ctx.fillStyle = gold;
      ctx.beginPath();
      ctx.moveTo(-9, -32);
      ctx.lineTo(-9, -36);
      ctx.lineTo(-4.5, -33);
      ctx.lineTo(0, -38);
      ctx.lineTo(4.5, -33);
      ctx.lineTo(9, -36);
      ctx.lineTo(9, -32);
      ctx.closePath();
      ctx.fill();

      // Eyes: bright and confident.
      ctx.fillStyle = "#1c1c28";
      ctx.beginPath();
      ctx.ellipse(-3, -26, 1.9, 2.3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(3, -26, 1.9, 2.3, 0, 0, Math.PI * 2);
      ctx.fill();

      // Confident smile.
      ctx.strokeStyle = "#1c1c28";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(0, -21, 4, 0.15, Math.PI - 0.15);
      ctx.stroke();
    }
  }

  private drawKai(
    ctx: CanvasRenderingContext2D,
    ch: CharacterDef,
    time: number,
    runPhase: number,
    airborne: boolean,
    slide: boolean,
  ) {
    // Kai: surfer, free-spirited, orange/teal, flowing movement
    const skin = ch.colors.skin;
    const orange = ch.colors.primary;
    const teal = ch.colors.secondary;

    if (slide) {
      ctx.rotate(-0.28);
      ctx.fillStyle = orange;
      ctx.fillRect(-13, -9, 26, 18);
      ctx.fillStyle = skin;
      ctx.beginPath();
      ctx.arc(11, -13, 8.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (airborne) {
      // Aerial trick
      ctx.rotate(Math.sin(time * 8) * 0.15);
      ctx.fillStyle = orange;
      ctx.fillRect(-10, -23, 20, 31);
      ctx.fillStyle = skin;
      ctx.arc(0, -25, 8, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const swing = Math.sin(runPhase) * 16;
      const lift = Math.max(0, -Math.cos(runPhase)) * 10;

      // Legs: flexible and dynamic
      ctx.strokeStyle = "#5566a0";
      ctx.lineWidth = 8.5;
      for (const dir of [1, -1]) {
        ctx.beginPath();
        ctx.moveTo(dir * 7, -19);
        ctx.lineTo(dir * 7 + swing * 0.6, -6 - lift);
        ctx.lineTo(dir * 7 + swing, 11);
        ctx.stroke();
      }

      // Board shorts / shoes: teal accents
      ctx.fillStyle = "#f5f5f5";
      ctx.beginPath();
      ctx.ellipse(-8 + swing, 12, 7, 4, -0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(8 + swing, 12, 7, 4, 0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = teal;
      ctx.fillRect(-13 + swing, 13, 8, 1.8);
      ctx.fillRect(5 + swing, 13, 8, 1.8);

      // Torso: orange shirt with teal wave
      ctx.fillStyle = orange;
      ctx.beginPath();
      ctx.moveTo(-16, -8);
      ctx.quadraticCurveTo(0, -15, 16, -8);
      ctx.quadraticCurveTo(18, 7, 11, 19);
      ctx.quadraticCurveTo(0, 23, -11, 19);
      ctx.quadraticCurveTo(-18, 7, -16, -8);
      ctx.closePath();
      ctx.fill();

      // Teal wave on chest
      ctx.strokeStyle = teal;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-8, 2);
      ctx.quadraticCurveTo(0, 8, 8, 2);
      ctx.stroke();

      // Arms: flowing
      ctx.strokeStyle = orange;
      ctx.lineWidth = 7;
      for (const dir of [1, -1]) {
        const armSwing = Math.sin(runPhase + (dir > 0 ? Math.PI : 0)) * 12;
        ctx.beginPath();
        ctx.moveTo(dir * 14, -7);
        ctx.lineTo(dir * 17 + armSwing * 0.6, 9 + armSwing);
        ctx.stroke();
      }

      // Head: friendly, approachable
      ctx.fillStyle = skin;
      ctx.beginPath();
      ctx.arc(0, -24, 9, 0, Math.PI * 2);
      ctx.fill();

      // Hair: wavy, surfer style with secondary motion
      ctx.fillStyle = "#A0654F";
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI - Math.PI * 0.4;
        const wave = Math.sin(time * 2 + i) * 0.5 + Math.sin(runPhase + i) * 2;
        ctx.beginPath();
        ctx.arc(
          Math.cos(a) * 8 + wave,
          -24 + Math.sin(a) * 8,
          3.8,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }

      // Eyes: happy and carefree
      ctx.fillStyle = "#6B4423";
      ctx.beginPath();
      ctx.ellipse(-3, -25, 1.9, 2.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(3, -25, 1.9, 2.2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Bright smile
      ctx.strokeStyle = "#6B4423";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(0, -19.5, 4, 0.2, Math.PI - 0.2);
      ctx.stroke();
    }
  }

  // ---- Satan the Accuser (ICONIC MENACING PRESENCE) ----

  private drawSatan(
    ctx: CanvasRenderingContext2D,
    engine: GameEngine,
    W: number,
    H: number,
    time: number,
    dt: number,
  ) {
    // THE ACCUSER — a giant shadow runner pounding down the boardwalk behind
    // the hero. He rises and grows as he closes the gap (player mistakes),
    // and falls back / shrinks when the player gains ground (power-ups).
    const prox = engine.satan;
    const rise = Math.max(0.15, Math.min(1, prox)); // always at least a looming hint
    // He stays a smaller, distant figure UP the track until he genuinely
    // closes in (quadratic ramp), so he never merges with the bright hero.
    const S = 22 + Math.pow(rise, 1.5) * 80; // far: ~22px unit; close: ~102px
    const cx = W / 2 + Math.sin(time * 1.05) * W * 0.05;
    const footY = H * 0.42 + rise * rise * (H * 0.44); // far: up-track; close: at hero

    const runC = time * (5 + rise * 5); // strides quicken as he closes
    const legSwing = Math.sin(runC);
    const bob = Math.abs(Math.cos(runC)) * S * 0.1;
    const hipY = footY - S * 1.5 - bob;
    const shoulderY = hipY - S * 1.05;
    const headY = shoulderY - S * 0.5;

    const black = "rgba(12,6,20,0.97)";
    const midY = (shoulderY + hipY) / 2;

    ctx.save();

    // Hellish aura behind the figure.
    const aura = ctx.createRadialGradient(cx, midY, S * 0.2, cx, midY, S * 3.2);
    aura.addColorStop(0, `rgba(190,20,30,${0.2 * rise})`);
    aura.addColorStop(0.5, `rgba(120,10,40,${0.11 * rise})`);
    aura.addColorStop(1, "rgba(80,0,30,0)");
    ctx.fillStyle = aura;
    ctx.fillRect(cx - S * 3.2, midY - S * 3.2, S * 6.4, S * 6.4);

    // Ground shadow at his feet.
    ctx.fillStyle = `rgba(0,0,0,${0.32 * rise})`;
    ctx.beginPath();
    ctx.ellipse(cx, footY + S * 0.1, S * 1.25, S * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();

    // Smoke kicked up as he runs.
    for (let i = 0; i < 7; i++) {
      const ph = (time * 1.6 + i * 0.9) % 2;
      const sa = Math.max(0, 1 - ph / 2) * 0.4 * rise;
      if (sa <= 0) continue;
      ctx.fillStyle = `rgba(30,16,42,${sa})`;
      ctx.beginPath();
      ctx.arc(
        cx + (i - 3) * S * 0.24 + Math.sin(time + i) * 6,
        footY - ph * S * 0.5,
        S * (0.24 + ph * 0.22),
        0, Math.PI * 2,
      );
      ctx.fill();
    }

    // Tapered two-segment limb helper.
    const limb = (
      x0: number, y0: number, x1: number, y1: number,
      x2: number, y2: number, w: number,
    ) => {
      ctx.strokeStyle = black;
      ctx.lineWidth = w;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    };

    // Legs — full run cycle.
    for (const d of [-1, 1]) {
      const p = d > 0 ? legSwing : -legSwing;
      const hipX = cx + d * S * 0.18;
      const kneeX = hipX + p * S * 0.45;
      const kneeY = hipY + S * 0.72;
      const lift = Math.max(0, -p) * S * 0.32;
      const footX = kneeX + p * S * 0.32;
      const fY = footY - lift;
      limb(hipX, hipY, kneeX, kneeY, footX, fY, S * 0.42);
      // Clawed foot.
      ctx.fillStyle = black;
      ctx.beginPath();
      ctx.ellipse(footX + p * S * 0.12, fY, S * 0.22, S * 0.12, p * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Torso silhouette.
    ctx.fillStyle = black;
    ctx.beginPath();
    ctx.moveTo(cx - S * 0.55, shoulderY + S * 0.1);
    ctx.quadraticCurveTo(cx - S * 0.72, midY, cx - S * 0.4, hipY + S * 0.1);
    ctx.quadraticCurveTo(cx, hipY + S * 0.3, cx + S * 0.4, hipY + S * 0.1);
    ctx.quadraticCurveTo(cx + S * 0.72, midY, cx + S * 0.55, shoulderY + S * 0.1);
    ctx.quadraticCurveTo(cx, shoulderY - S * 0.28, cx - S * 0.55, shoulderY + S * 0.1);
    ctx.closePath();
    ctx.fill();

    // Tattered cloak hem flicking with motion.
    ctx.fillStyle = "rgba(10,5,18,0.92)";
    for (let i = 0; i < 5; i++) {
      const fx = cx - S * 0.5 + i * S * 0.25;
      const flick = Math.sin(time * 8 + i) * S * 0.12;
      ctx.beginPath();
      ctx.moveTo(fx, hipY);
      ctx.lineTo(fx - S * 0.1, hipY + S * 0.55 + flick);
      ctx.lineTo(fx + S * 0.12, hipY + S * 0.38);
      ctx.closePath();
      ctx.fill();
    }

    // Arms — swing opposite the legs; the right arm rears back to hurl scrolls.
    const throwActive = this.satanThrow > 1.15;
    for (const d of [-1, 1]) {
      const p = d > 0 ? -legSwing : legSwing;
      const shX = cx + d * S * 0.5;
      let elbowX = shX + d * S * 0.3 + p * S * 0.2;
      let elbowY = shoulderY + S * 0.5;
      let handX = elbowX + d * S * 0.2 + p * S * 0.3;
      let handY = elbowY + S * 0.45;
      if (d > 0 && throwActive) {
        elbowX = shX + S * 0.3;
        elbowY = shoulderY - S * 0.1;
        handX = shX + S * 0.55;
        handY = shoulderY - S * 0.6;
      }
      limb(shX, shoulderY + S * 0.05, elbowX, elbowY, handX, handY, S * 0.34);
      ctx.fillStyle = black;
      ctx.beginPath();
      ctx.arc(handX, handY, S * 0.14, 0, Math.PI * 2);
      ctx.fill();
    }

    // Head + hood.
    ctx.fillStyle = black;
    ctx.beginPath();
    ctx.arc(cx, headY, S * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx - S * 0.55, headY + S * 0.1);
    ctx.quadraticCurveTo(cx, headY - S * 0.95, cx + S * 0.55, headY + S * 0.1);
    ctx.quadraticCurveTo(cx, headY + S * 0.22, cx - S * 0.55, headY + S * 0.1);
    ctx.closePath();
    ctx.fill();

    // Horns.
    for (const d of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(cx + d * S * 0.3, headY - S * 0.35);
      ctx.quadraticCurveTo(cx + d * S * 0.78, headY - S * 0.95, cx + d * S * 0.5, headY - S * 1.18);
      ctx.quadraticCurveTo(cx + d * S * 0.5, headY - S * 0.7, cx + d * S * 0.22, headY - S * 0.45);
      ctx.closePath();
      ctx.fill();
    }

    // Glowing red eyes with a heartbeat pulse.
    const eyeY = headY - S * 0.02;
    const beat = 0.6 + 0.4 * Math.sin(time * 6);
    for (const d of [-1, 1]) {
      const ex = cx + d * S * 0.2;
      const g = ctx.createRadialGradient(ex, eyeY, 1, ex, eyeY, S * 0.32);
      g.addColorStop(0, `rgba(255,130,90,${beat})`);
      g.addColorStop(0.4, `rgba(230,40,30,${beat * 0.6})`);
      g.addColorStop(1, "rgba(200,20,20,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(ex, eyeY, S * 0.32, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(255,225,190,${beat})`;
      ctx.beginPath();
      ctx.arc(ex, eyeY, S * 0.08, 0, Math.PI * 2);
      ctx.fill();
    }

    // Red rim light to separate the silhouette from the sky.
    ctx.strokeStyle = `rgba(220,40,60,${0.45 + 0.3 * Math.sin(time * 6)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, headY, S * 0.5, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();

    ctx.restore();

    // Hurl accusation scrolls toward the hero when he's close.
    this.satanThrow -= dt;
    if (rise > 0.4 && this.satanThrow <= 0) {
      this.satanThrow = 1.4;
      const handX = cx + S * 0.55;
      const handY = shoulderY - S * 0.6;
      const px = W / 2;
      const py = H * 0.8;
      const ang = Math.atan2(py - handY, px - handX);
      const speed = 360 + rise * 240;
      this.satanScrolls.push({
        x: handX, y: handY,
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed,
        life: 1.2, rot: 0,
      });
    }

    // Update + draw the flying scrolls.
    ctx.save();
    for (const s of this.satanScrolls) {
      s.life -= dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vy += 130 * dt;
      s.rot += dt * 10;
      const a = Math.max(0, Math.min(1, s.life));
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.rot);
      ctx.shadowBlur = 12;
      ctx.shadowColor = "rgba(255,60,60,0.8)";
      ctx.fillStyle = `rgba(180,30,40,${a})`;
      ctx.fillRect(-7, -12, 14, 24);
      ctx.fillStyle = `rgba(240,220,190,${a})`;
      ctx.fillRect(-7, -12, 14, 4);
      ctx.fillRect(-7, 8, 14, 4);
      ctx.restore();
    }
    ctx.shadowBlur = 0;
    ctx.restore();
    this.satanScrolls = this.satanScrolls.filter((s) => s.life > 0 && s.y < H + 40);
  }

  // ---- Effects -------------------------------------------------------------

  private drawMotionBlur(ctx: CanvasRenderingContext2D, engine: GameEngine, W: number, H: number) {
    const rushing = engine.sprintTimer > 0 || engine.surgeTimer > 0;
    const blurIntensity = rushing ? 0.35 : Math.max(0, (engine.speed / MAX_SPEED - 0.7) * 1.8);
    if (blurIntensity <= 0.05) return;

    ctx.globalAlpha = blurIntensity * 0.18;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
  }

  private drawScreenFlash(ctx: CanvasRenderingContext2D, W: number, H: number, dt: number) {
    if (this.screenFlash <= 0.01) return;
    this.screenFlash = Math.max(0, this.screenFlash - dt * 3.5);
    ctx.globalAlpha = this.screenFlash * 0.4;
    ctx.fillStyle = this.screenFlashColor;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
  }

  private drawParticles(ctx: CanvasRenderingContext2D, dt: number) {
    for (const pt of this.particles) {
      pt.life += dt;
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vy += 320 * dt;
      const a = 1 - pt.life / pt.maxLife;
      if (a <= 0) continue;
      ctx.globalAlpha = a;
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size * a, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    this.particles = this.particles.filter((pt) => pt.life < pt.maxLife);
  }

  private drawFloaters(ctx: CanvasRenderingContext2D, dt: number) {
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const f of this.floaters) {
      f.life += dt;
      f.y -= 55 * dt;
      const t = f.life / f.maxLife;
      const a = t < 0.15 ? t / 0.15 : 1 - Math.max(0, (t - 0.6) / 0.4);
      if (a <= 0) continue;
      const pop = t < 0.18 ? 0.7 + (t / 0.18) * 0.3 : 1;
      ctx.globalAlpha = a;
      ctx.font = `900 ${Math.round(f.size * pop)}px Nunito, sans-serif`;
      ctx.strokeStyle = "rgba(0,0,0,0.75)";
      ctx.lineWidth = 4;
      ctx.strokeText(f.text, f.x, f.y);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;
    this.floaters = this.floaters.filter((f) => f.life < f.maxLife);
  }

  private drawWaveFlash(
    ctx: CanvasRenderingContext2D,
    engine: GameEngine,
    W: number,
    H: number,
    dt: number,
  ) {
    if (this.waveFlash <= 0) return;
    this.waveFlash = Math.max(0, this.waveFlash - dt * 2.2);

    // Living Water: a cyan surge sweeps down the player's lane.
    const p = this.project(engine.laneX, 0, W, H);
    const t = 1 - this.waveFlash; // 0=start, 1=done
    const waveX = p.x + (t - 0.5) * W * 0.8;
    const wg = ctx.createRadialGradient(waveX, H * 0.6, 0, waveX, H * 0.6, W * 0.6);
    wg.addColorStop(0, `rgba(34,211,238,${0.55 * this.waveFlash})`);
    wg.addColorStop(0.5, `rgba(14,165,233,${0.3 * this.waveFlash})`);
    wg.addColorStop(1, "rgba(14,165,233,0)");
    ctx.fillStyle = wg;
    ctx.fillRect(0, 0, W, H);

    // Foam crest sweeping across the road.
    ctx.strokeStyle = `rgba(255,255,255,${0.7 * this.waveFlash})`;
    ctx.lineWidth = 8;
    ctx.beginPath();
    for (let x = 0; x <= W; x += 10) {
      const wy = H * 0.7 + Math.sin(x * 0.06 + t * 18) * 12;
      if (x === 0) ctx.moveTo(x, wy);
      else ctx.lineTo(x, wy);
    }
    ctx.stroke();
  }

  private drawSpeedLines(
    ctx: CanvasRenderingContext2D,
    engine: GameEngine,
    W: number,
    H: number,
    time: number,
  ) {
    const rushing = engine.sprintTimer > 0 || engine.surgeTimer > 0;
    let intensity = Math.max(0, (engine.speed / MAX_SPEED - 0.55) * 2.2);
    if (rushing) intensity = Math.max(intensity, 1) + 0.6;
    if (intensity <= 0) return;
    ctx.strokeStyle = rushing
      ? `rgba(255,222,120,${0.18 * Math.min(1.6, intensity)})`
      : `rgba(255,255,255,${0.12 * intensity})`;
    ctx.lineWidth = 2;
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + time * 0.4;
      const cx = W / 2;
      const cy = H * 0.42;
      const inner = Math.max(W, H) * 0.34;
      const outer = inner + ((time * 900 + i * 137) % (Math.max(W, H) * 0.32)) * intensity;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
      ctx.lineTo(cx + Math.cos(a) * outer, cy + Math.sin(a) * outer);
      ctx.stroke();
    }
  }

  private drawVignette(
    ctx: CanvasRenderingContext2D,
    engine: GameEngine,
    W: number,
    H: number,
    time: number,
  ) {
    const danger = Math.max(0, (engine.satan - 0.55) / 0.45);
    if (danger <= 0.02) return;
    const pulse = danger > 0.6 ? 0.85 + 0.15 * Math.sin(time * 7) : 1;
    // Environment corruption: a low dark-red wash creeps over everything as the
    // Accuser closes, then lifts the instant the player gains ground.
    ctx.fillStyle = `rgba(28,2,10,${0.28 * danger * pulse})`;
    ctx.fillRect(0, 0, W, H);
    const vg = ctx.createRadialGradient(
      W / 2, H / 2, Math.min(W, H) * 0.32,
      W / 2, H / 2, Math.max(W, H) * 0.75,
    );
    vg.addColorStop(0, "rgba(20,4,8,0)");
    vg.addColorStop(1, `rgba(35,4,10,${0.62 * danger * pulse})`);
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
  }

  // ---- Helpers ---------------------------------------------------------------

  private darken(hex: string): string {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.max(0, ((n >> 16) & 255) - 60);
    const g = Math.max(0, ((n >> 8) & 255) - 60);
    const b = Math.max(0, (n & 255) - 60);
    return `rgb(${r},${g},${b})`;
  }

  private lighten(hex: string): string {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.min(255, ((n >> 16) & 255) + 45);
    const g = Math.min(255, ((n >> 8) & 255) + 45);
    const b = Math.min(255, (n & 255) + 45);
    return `rgb(${r},${g},${b})`;
  }
}
