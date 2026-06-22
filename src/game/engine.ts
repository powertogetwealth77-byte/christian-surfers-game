import type {
  CharacterDef,
  CollectibleKind,
  Lane,
  ObstacleKind,
  ObstacleProfile,
  PowerUpKind,
  RunStats,
  SaveData,
} from "../types";
import { MISSIONS, missionProgress } from "../data/missions";
import { SCRIPTURES } from "../data/scriptures";
import { COMMON_POWER_UPS, PREMIUM_POWER_UPS } from "../data/powerups";
import {
  BASE_SPEED,
  COMBO_MAX_BONUS,
  COMBO_STEP,
  COMBO_TIMEOUT,
  GRAVITY,
  HIT_Z,
  JUMP_VELOCITY,
  LANE_SWITCH_SPEED,
  MAX_SPEED,
  SATAN_PASSIVE_RISE,
  SATAN_REVIVAL_PUSH,
  SATAN_SCROLL_RELIEF,
  SATAN_SOFT_CAP,
  SATAN_START,
  SATAN_WARN_AT,
  SCORE_COIN,
  SCORE_CROWN,
  SCORE_GEM,
  SCORE_KEY,
  SCORE_PERFECT_DODGE,
  SCORE_SCROLL,
  SLIDE_TIME,
  SPAWN_Z,
  SPEED_RAMP,
} from "./constants";

export interface Obstacle {
  id: number;
  kind: ObstacleKind;
  profile: ObstacleProfile;
  lane: Lane;
  z: number;
  passed: boolean;
  burned: boolean;
}

export interface Collectible {
  id: number;
  kind: CollectibleKind;
  lane: Lane;
  laneX: number; // fractional lane position, drifts under magnet
  z: number;
  taken: boolean;
}

export interface PowerUpPickup {
  id: number;
  kind: PowerUpKind;
  lane: Lane;
  z: number;
  taken: boolean;
}

export type GameEvent =
  | { type: "coin" }
  | { type: "collect"; kind: CollectibleKind }
  | { type: "scripture"; ref: string; text: string }
  | { type: "jump" }
  | { type: "slide" }
  | { type: "laneSwitch" }
  | { type: "shieldBreak" }
  | { type: "stumble" }
  | { type: "caught" }
  | { type: "powerUp"; kind: PowerUpKind }
  | { type: "satanWarning" }
  | { type: "missionComplete"; title: string }
  | { type: "combo"; count: number }
  | { type: "perfectDodge"; streak: number }
  | { type: "faithStreak"; count: number };

interface AbilityMods {
  startShield: boolean;
  durationMult: number;
  revivalPushMult: number;
  jumpMult: number;
  gravityMult: number;
  royalFavorChance: number;
  obstacleScoreMult: number;
}

function abilityMods(character: CharacterDef): AbilityMods {
  return {
    startShield: character.id === "zion",
    durationMult: character.id === "grace" ? 1.25 : 1,
    revivalPushMult: character.id === "judah" ? 2 : 1,
    jumpMult: character.id === "kai" ? 1.18 : 1,
    gravityMult: character.id === "kai" ? 0.88 : 1,
    royalFavorChance: character.id === "esther" ? 0.22 : 0,
    obstacleScoreMult: character.id === "david" ? 1.5 : 1,
  };
}

const OBSTACLE_DEFEAT_SCORE = 90;

const OBSTACLE_TABLE: { kind: ObstacleKind; profile: ObstacleProfile }[] = [
  { kind: "fallenCrate", profile: "jump" },
  { kind: "pitCrack", profile: "jump" },
  { kind: "brokenSign", profile: "jump" },
  { kind: "darkChains", profile: "jump" },
  { kind: "distractionDrone", profile: "slide" },
  { kind: "accusationScroll", profile: "slide" },
  { kind: "fearFog", profile: "slide" },
  { kind: "shadowGate", profile: "dodge" },
  { kind: "movingBarrier", profile: "dodge" },
];

let nextId = 1;

export class GameEngine {
  // Player
  lane: Lane = 1;
  laneX = 1; // smooth visual lane position
  y = 0; // jump height (m)
  vy = 0;
  sliding = 0; // seconds remaining
  alive = true;
  finished = false;

  // World
  speed = BASE_SPEED;
  elapsed = 0;
  obstacles: Obstacle[] = [];
  collectibles: Collectible[] = [];
  pickups: PowerUpPickup[] = [];
  private spawnCursor = 26; // distance at which the next chunk spawns

  // Satan
  satan = SATAN_START; // 0..1 proximity
  private warned = false;

  // Power-ups
  shieldCharges = 0;
  boostTimer = 0;
  magnetTimer = 0;
  revivalTimer = 0;
  wingsTimer = 0;
  sprintTimer = 0; // Holy Sprint
  surgeTimer = 0; // Kingdom Surge
  invincibleTimer = 0; // Angel Dash
  revivalCharges = 1; // manual boost button

  // Streaks
  combo = 0;
  comboTimer = 0;
  dodgeStreak = 0;
  faithStreak = 0;

  get shield(): boolean {
    return this.shieldCharges > 0;
  }

  get magnetActive(): boolean {
    return this.magnetTimer > 0 || this.surgeTimer > 0;
  }

  /** Current score multiplier from boosts and combo streak. */
  get scoreMult(): number {
    const boost = this.boostTimer > 0 ? 2 : 1;
    const surge = this.surgeTimer > 0 ? 3 : 1;
    const comboBonus = 1 + Math.min(COMBO_MAX_BONUS, this.combo * COMBO_STEP);
    return boost * surge * comboBonus;
  }

  // Stats
  stats: RunStats = {
    score: 0,
    distance: 0,
    coins: 0,
    scrolls: 0,
    crowns: 0,
    keys: 0,
    gems: 0,
    dodges: 0,
    perfectDodges: 0,
    bestCombo: 0,
    shieldsUsed: 0,
    surviveSeconds: 0,
    scripturesSeen: [],
    missionsCompleted: [],
    xpEarned: 0,
  };

  events: GameEvent[] = [];

  private mods: AbilityMods;
  private coinValueMult: number;
  private satanRiseMult: number;
  private extraDuration: number;
  private scriptureIdx = 0;
  private completedBefore: Set<string>;
  private royalFavorUsed = false;

  constructor(character: CharacterDef, save: SaveData) {
    this.mods = abilityMods(character);
    const up = save.upgrades;
    this.coinValueMult = 1 + 0.2 * (up.coinValue ?? 0);
    this.satanRiseMult = 1 - 0.18 * (up.graceWindow ?? 0);
    this.extraDuration = 1.5 * (up.powerDuration ?? 0);
    this.completedBefore = new Set(save.completedMissions);
    if (this.mods.startShield) this.shieldCharges = 1;
    else if (Math.random() < 0.33 * (up.shieldStart ?? 0)) this.shieldCharges = 1;
    this.scriptureIdx = Math.floor(Math.random() * SCRIPTURES.length);
  }

  private duration(base: number): number {
    return (base + this.extraDuration) * this.mods.durationMult;
  }

  // ---- Input -------------------------------------------------------------

  moveLeft() {
    if (!this.alive) return;
    if (this.lane > 0) {
      this.lane = (this.lane - 1) as Lane;
      this.events.push({ type: "laneSwitch" });
    }
  }

  moveRight() {
    if (!this.alive) return;
    if (this.lane < 2) {
      this.lane = (this.lane + 1) as Lane;
      this.events.push({ type: "laneSwitch" });
    }
  }

  jump() {
    if (!this.alive) return;
    if (this.y <= 0.01) {
      this.vy = JUMP_VELOCITY * this.mods.jumpMult * (this.wingsTimer > 0 ? 1.25 : 1);
      this.sliding = 0;
      this.events.push({ type: "jump" });
    }
  }

  slide() {
    if (!this.alive) return;
    if (this.y > 0.5) {
      // Slam down from a jump.
      this.vy = -GRAVITY;
    }
    this.sliding = SLIDE_TIME;
    this.events.push({ type: "slide" });
  }

  /** Manual boost button: unleash a stored Revival Fire. */
  useRevival(): boolean {
    if (!this.alive || this.revivalCharges <= 0 || this.revivalTimer > 0) {
      return false;
    }
    this.revivalCharges--;
    this.activate("revivalFire");
    return true;
  }

  // ---- Simulation --------------------------------------------------------

  update(dt: number) {
    if (!this.alive || this.finished) return;
    this.elapsed += dt;
    this.stats.surviveSeconds += dt;

    // Speed ramps up over time; fire, sprint, and surge stack on top.
    this.speed = Math.min(MAX_SPEED, BASE_SPEED + this.elapsed * SPEED_RAMP);
    let speedMult = this.revivalTimer > 0 ? 1.15 : 1;
    if (this.sprintTimer > 0) speedMult *= 1.4;
    if (this.surgeTimer > 0) speedMult *= 1.25;
    const effSpeed = this.speed * speedMult;

    const dDist = effSpeed * dt;
    this.stats.distance += dDist;
    this.stats.score += dDist * this.scoreMult;

    // Smooth lane movement.
    const dl = this.lane - this.laneX;
    const maxStep = LANE_SWITCH_SPEED * dt;
    this.laneX += Math.abs(dl) <= maxStep ? dl : Math.sign(dl) * maxStep;

    // Vertical physics with Wings hover.
    if (this.y > 0 || this.vy > 0) {
      const g = GRAVITY * this.mods.gravityMult * (this.wingsTimer > 0 ? 0.55 : 1);
      this.vy -= g * dt;
      this.y = Math.max(0, this.y + this.vy * dt);
      if (this.y === 0) this.vy = 0;
    }
    if (this.sliding > 0) this.sliding = Math.max(0, this.sliding - dt);

    // Power-up timers.
    this.boostTimer = Math.max(0, this.boostTimer - dt);
    this.magnetTimer = Math.max(0, this.magnetTimer - dt);
    this.revivalTimer = Math.max(0, this.revivalTimer - dt);
    this.wingsTimer = Math.max(0, this.wingsTimer - dt);
    this.sprintTimer = Math.max(0, this.sprintTimer - dt);
    this.surgeTimer = Math.max(0, this.surgeTimer - dt);
    this.invincibleTimer = Math.max(0, this.invincibleTimer - dt);

    // Combo streak fizzles if you stop collecting.
    if (this.combo > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.combo = 0;
    }

    // Satan creeps closer; faster the longer you run.
    // He can't keep pace while you sprint or surge.
    const outrunning = this.sprintTimer > 0 || this.surgeTimer > 0;
    if (this.satan < SATAN_SOFT_CAP && !outrunning) {
      this.satan = Math.min(
        SATAN_SOFT_CAP,
        this.satan +
          SATAN_PASSIVE_RISE * this.satanRiseMult * (1 + this.elapsed / 90) * dt,
      );
    } else if (outrunning) {
      this.satan = Math.max(0.05, this.satan - 0.04 * dt);
    }
    if (this.satan >= SATAN_WARN_AT && !this.warned) {
      this.warned = true;
      this.events.push({ type: "satanWarning" });
    }
    if (this.satan < SATAN_WARN_AT - 0.1) this.warned = false;

    this.spawn();
    this.advance(dDist);
    this.checkMissions();
  }

  private spawn() {
    while (this.stats.distance + SPAWN_Z > this.spawnCursor) {
      const at = this.spawnCursor - this.stats.distance;
      this.spawnChunk(Math.max(at, SPAWN_Z - 12));
      // Chunks tighten as speed rises.
      const gap = 18 - Math.min(8, this.elapsed / 12);
      this.spawnCursor += gap + Math.random() * 8;
    }
  }

  private spawnChunk(z: number) {
    const lanes: Lane[] = [0, 1, 2];
    const difficulty = Math.min(1, this.elapsed / 75);
    const obstacleLanes = lanes.filter(
      () => Math.random() < 0.38 + difficulty * 0.3,
    );
    // Never wall off all three lanes.
    if (obstacleLanes.length === 3) obstacleLanes.pop();

    const freeLanes = lanes.filter((l) => !obstacleLanes.includes(l));

    for (const lane of obstacleLanes) {
      const pick = OBSTACLE_TABLE[Math.floor(Math.random() * OBSTACLE_TABLE.length)];
      this.obstacles.push({
        id: nextId++,
        kind: pick.kind,
        profile: pick.profile,
        lane,
        z: z + Math.random() * 4,
        passed: false,
        burned: false,
      });
    }

    // Coin trail down a free lane.
    const coinLane = freeLanes[Math.floor(Math.random() * freeLanes.length)] ?? 1;
    const coins = 4 + Math.floor(Math.random() * 4);
    for (let i = 0; i < coins; i++) {
      this.collectibles.push({
        id: nextId++,
        kind: "coin",
        lane: coinLane,
        laneX: coinLane,
        z: z + i * 2,
        taken: false,
      });
    }

    // Special collectibles.
    const roll = Math.random();
    if (roll < 0.22) {
      this.pushCollectible("scroll", freeLanes, z + coins * 2 + 3);
    } else if (roll < 0.34) {
      this.pushCollectible("crown", freeLanes, z + coins * 2 + 3);
    } else if (roll < 0.42) {
      this.pushCollectible("key", freeLanes, z + coins * 2 + 3);
    } else if (roll < 0.52) {
      this.pushCollectible("gem", freeLanes, z + coins * 2 + 3);
    }

    // Occasional power-up pickup; premium tier is rarer but game-changing.
    const pRoll = Math.random();
    if (pRoll < 0.21) {
      const premium = pRoll < 0.06;
      const pool: PowerUpKind[] = premium ? PREMIUM_POWER_UPS : COMMON_POWER_UPS;
      this.pickups.push({
        id: nextId++,
        kind: pool[Math.floor(Math.random() * pool.length)],
        lane: freeLanes[Math.floor(Math.random() * freeLanes.length)] ?? 1,
        z: z + coins * 2 + 6,
        taken: false,
      });
    }
  }

  private pushCollectible(kind: CollectibleKind, freeLanes: Lane[], z: number) {
    const lane = freeLanes[Math.floor(Math.random() * freeLanes.length)] ?? 1;
    this.collectibles.push({ id: nextId++, kind, lane, laneX: lane, z, taken: false });
  }

  private advance(dDist: number) {
    // Obstacles.
    for (const ob of this.obstacles) {
      ob.z -= dDist;
      if (ob.burned) continue;
      if (this.revivalTimer > 0 && ob.z < 8 && ob.lane === this.lane) {
        ob.burned = true;
        this.stats.dodges++;
        this.awardObstacleDefeat();
        continue;
      }
      // Angel Dash phases straight through danger.
      if (this.invincibleTimer > 0 && ob.z < HIT_Z && ob.lane === this.lane) {
        ob.burned = true;
        this.stats.dodges++;
        this.awardObstacleDefeat();
        continue;
      }
      if (!ob.passed && ob.z < HIT_Z && ob.z > -0.5) {
        if (Math.round(this.laneX) === ob.lane && this.hits(ob)) {
          ob.passed = true;
          this.crash();
        }
      }
      if (!ob.passed && ob.z <= -0.5) {
        ob.passed = true;
        this.stats.dodges++;
        this.awardObstacleDefeat();
        // Perfect dodge: cleared an obstacle in your own lane by
        // jumping over or sliding under it at the last moment.
        if (this.alive && Math.abs(this.laneX - ob.lane) < 0.6) {
          this.dodgeStreak++;
          this.stats.perfectDodges++;
          this.stats.score +=
            SCORE_PERFECT_DODGE * Math.min(5, this.dodgeStreak) * this.scoreMult;
          this.events.push({ type: "perfectDodge", streak: this.dodgeStreak });
        }
      }
    }
    this.obstacles = this.obstacles.filter((o) => o.z > -6);

    // Collectibles with magnet drift.
    for (const c of this.collectibles) {
      c.z -= dDist;
      if (
        this.magnetActive &&
        !c.taken &&
        c.z < 14 &&
        (c.kind === "coin" || c.kind === "crown")
      ) {
        c.laneX += (this.laneX - c.laneX) * Math.min(1, 6 * (dDist / this.speed) * 10);
      }
      if (!c.taken && c.z < HIT_Z && c.z > -0.5) {
        const close = Math.abs(this.laneX - c.laneX) < 0.55;
        const magnetGrab =
          this.magnetActive && (c.kind === "coin" || c.kind === "crown");
        if (close || magnetGrab) {
          c.taken = true;
          this.collect(c.kind);
        }
      }
    }
    this.collectibles = this.collectibles.filter((c) => c.z > -4 && !c.taken);

    // Power-up pickups.
    for (const p of this.pickups) {
      p.z -= dDist;
      if (!p.taken && p.z < HIT_Z && p.z > -0.5 && Math.round(this.laneX) === p.lane) {
        p.taken = true;
        this.activate(p.kind);
      }
    }
    this.pickups = this.pickups.filter((p) => p.z > -4 && !p.taken);
  }

  private hits(ob: Obstacle): boolean {
    switch (ob.profile) {
      case "jump":
        return this.y < 0.9; // cleared if airborne
      case "slide":
        return this.sliding <= 0 && this.y < 1.4; // duck under, or leap clean over
      case "dodge":
        return true; // must change lanes
    }
  }

  private crash() {
    if (
      this.mods.royalFavorChance > 0 &&
      !this.royalFavorUsed &&
      Math.random() < this.mods.royalFavorChance
    ) {
      this.royalFavorUsed = true;
      this.satan = Math.min(SATAN_SOFT_CAP, this.satan + 0.08);
      this.events.push({ type: "stumble" });
      return;
    }
    // Any hit breaks your streaks.
    this.combo = 0;
    this.dodgeStreak = 0;
    this.faithStreak = 0;
    if (this.shieldCharges > 0) {
      this.shieldCharges--;
      this.stats.shieldsUsed++;
      this.satan = Math.min(SATAN_SOFT_CAP, this.satan + 0.12);
      this.events.push({ type: "shieldBreak" });
      return;
    }
    this.alive = false;
    this.satan = 1;
    this.events.push({ type: "caught" });
  }

  private bumpCombo() {
    this.combo++;
    this.comboTimer = COMBO_TIMEOUT;
    if (this.combo > this.stats.bestCombo) this.stats.bestCombo = this.combo;
    if (this.combo > 0 && this.combo % 10 === 0) {
      this.events.push({ type: "combo", count: this.combo });
    }
  }

  private awardObstacleDefeat(multiplier = 1) {
    this.stats.score +=
      OBSTACLE_DEFEAT_SCORE * this.mods.obstacleScoreMult * multiplier * this.scoreMult;
  }

  private collect(kind: CollectibleKind) {
    this.bumpCombo();
    const mult = this.scoreMult;
    switch (kind) {
      case "coin":
        this.stats.coins++;
        this.stats.score += SCORE_COIN * this.coinValueMult * mult;
        this.events.push({ type: "coin" });
        break;
      case "scroll": {
        this.stats.scrolls++;
        this.stats.score += SCORE_SCROLL * mult;
        this.satan = Math.max(0.05, this.satan - SATAN_SCROLL_RELIEF);
        this.faithStreak++;
        if (this.faithStreak >= 2) {
          this.events.push({ type: "faithStreak", count: this.faithStreak });
        }
        const s = SCRIPTURES[this.scriptureIdx % SCRIPTURES.length];
        this.scriptureIdx++;
        if (!this.stats.scripturesSeen.includes(s.ref)) {
          this.stats.scripturesSeen.push(s.ref);
        }
        this.events.push({ type: "scripture", ref: s.ref, text: s.text });
        break;
      }
      case "crown":
        this.stats.crowns++;
        this.stats.score += SCORE_CROWN * mult;
        this.events.push({ type: "collect", kind });
        break;
      case "key":
        this.stats.keys++;
        this.stats.score += SCORE_KEY * mult;
        this.events.push({ type: "collect", kind });
        break;
      case "gem":
        this.stats.gems++;
        this.stats.score += SCORE_GEM * mult;
        this.events.push({ type: "collect", kind });
        break;
    }
  }

  private activate(kind: PowerUpKind) {
    switch (kind) {
      case "shield":
        this.shieldCharges = Math.max(this.shieldCharges, 1);
        break;
      case "scriptureBoost":
        this.boostTimer = this.duration(10);
        break;
      case "magnet":
        this.magnetTimer = this.duration(8);
        break;
      case "revivalFire":
        this.revivalTimer = this.duration(8);
        this.satan = Math.max(
          0.05,
          this.satan - SATAN_REVIVAL_PUSH * this.mods.revivalPushMult,
        );
        break;
      case "wings":
        this.wingsTimer = this.duration(8);
        break;
      case "holySprint":
        this.sprintTimer = this.duration(6);
        this.satan = Math.max(0.05, this.satan - 0.28);
        break;
      case "angelDash":
        this.invincibleTimer = this.duration(3);
        this.satan = Math.max(0.05, this.satan - 0.12);
        break;
      case "livingWater":
        // A wave washes every obstacle out of your current lane.
        for (const ob of this.obstacles) {
          if (!ob.burned && !ob.passed && ob.lane === this.lane && ob.z > 0) {
            ob.burned = true;
            this.stats.dodges++;
            this.awardObstacleDefeat();
          }
        }
        break;
      case "armorGod":
        this.shieldCharges = Math.max(this.shieldCharges, 2);
        break;
      case "kingdomSurge":
        this.surgeTimer = this.duration(10);
        this.satan = Math.max(0.05, this.satan - 0.35);
        break;
    }
    this.events.push({ type: "powerUp", kind });
  }

  private checkMissions() {
    for (const m of MISSIONS) {
      if (this.completedBefore.has(m.id)) continue;
      if (this.stats.missionsCompleted.includes(m.id)) continue;
      if (missionProgress(m, this.stats) >= m.target) {
        this.stats.missionsCompleted.push(m.id);
        this.stats.xpEarned += m.rewardXp;
        this.events.push({ type: "missionComplete", title: m.title });
      }
    }
  }

  /** Current mission to surface in the HUD. */
  currentMission() {
    return MISSIONS.find(
      (m) =>
        !this.completedBefore.has(m.id) &&
        !this.stats.missionsCompleted.includes(m.id),
    );
  }

  drainEvents(): GameEvent[] {
    const out = this.events;
    this.events = [];
    return out;
  }
}
