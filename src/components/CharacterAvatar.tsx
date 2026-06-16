import { useState } from "react";
import { motion } from "framer-motion";
import type { CharacterDef } from "../types";

type Pose = "idle" | "victory";

/** Per-character, per-pose arm geometry: [leftPts, rightPts, leftHand, rightHand]. */
function armPaths(id: string, pose: Pose): [string, string, [number, number], [number, number]] {
  if (pose === "victory") {
    switch (id) {
      case "grace": // arms raised, open and joyful
        return ["24,42 14,32 10,20", "56,42 66,32 70,20", [10, 18], [70, 18]];
      case "judah": // both fists thrown up wide and strong
        return ["24,42 16,30 14,17", "56,42 64,30 66,17", [14, 15], [66, 15]];
      case "kai": // one shaka punched high, surfer joy
        return ["24,42 18,54 15,64", "56,42 62,28 64,15", [15, 65], [64, 13]];
      default: // zion — triumphant double fist pump
        return ["24,42 20,30 22,17", "56,42 60,30 58,17", [22, 15], [58, 15]];
    }
  }
  // idle stances
  switch (id) {
    case "grace": // open, welcoming hands
      return ["24,42 14,52 9,60", "56,42 66,52 71,60", [9, 62], [71, 62]];
    case "judah": // arms crossed over the chest — strong and bold
      return ["24,42 35,52 48,57", "56,42 45,52 32,57", [48, 57], [32, 57]];
    case "kai": // relaxed, one hand throwing a shaka by the head
      return ["24,42 18,56 15,66", "56,42 62,34 60,25", [15, 66], [60, 23]];
    default: // zion — a confident raised fist
      return ["24,42 18,56 15,66", "56,42 60,32 59,21", [15, 66], [59, 19]];
  }
}

function Hair({ ch }: { ch: CharacterDef }) {
  const c = ch.colors;
  switch (ch.id) {
    case "grace":
      return (
        <>
          {/* soft hair cap + ponytail */}
          <path d="M27 18 A 13 13 0 0 1 53 17 Q50 6 40 6 Q30 6 27 18 Z" fill="#7a4a24" />
          <ellipse cx="55" cy="26" rx="5" ry="9" fill="#7a4a24" />
          <ellipse cx="56" cy="34" rx="3.5" ry="5" fill="#6b4020" />
          <circle cx="40" cy="7" r="2" fill={c.secondary} />
        </>
      );
    case "judah":
      return (
        <>
          <path d="M28 18 A 12.5 12.5 0 0 1 52 17 Q49 7 40 7 Q31 7 28 18 Z" fill="#2a1a0f" />
          {/* gold crown */}
          <path d="M30 8 L30 3 L36 6 L40 1 L44 6 L50 3 L50 8 Z" fill={c.secondary} stroke="#b8860b" strokeWidth="0.6" />
          <circle cx="40" cy="3" r="1.3" fill="#fffbe8" />
        </>
      );
    case "kai":
      return (
        <>
          {/* tousled wavy surfer hair + teal headband */}
          <path d="M27 17 Q30 6 40 6 Q50 6 53 17 Q49 12 44 15 Q40 9 36 15 Q31 12 27 17 Z" fill="#a0654f" />
          <rect x="27" y="15" width="26" height="3.5" rx="1.5" fill={c.secondary} />
        </>
      );
    default: // zion — clean rounded cap
      return <path d="M27.5 17 A 12.8 12.8 0 0 1 52.5 16 Q50 7 40 6.5 Q30 7 27.5 17 Z" fill="#3a2415" />;
  }
}

function Mouth({ id }: { id: string }) {
  switch (id) {
    case "grace": // gentle wide smile
      return <path d="M35 25.5 Q40 30 45 25.5" fill="none" stroke="#1c1c28" strokeWidth="1.6" strokeLinecap="round" />;
    case "judah": // bold grin
      return <path d="M35 25 Q40 30 45 25 Q40 27 35 25 Z" fill="#1c1c28" />;
    case "kai": // open happy
      return <ellipse cx="40" cy="26" rx="2.6" ry="2.2" fill="#1c1c28" />;
    default: // zion — confident smile
      return <path d="M36 25.5 Q40 29 44 25.5" fill="none" stroke="#1c1c28" strokeWidth="1.7" strokeLinecap="round" />;
  }
}

/**
 * Stylized, expressive character avatar with a holy halo, per-character hair,
 * expression and stance, plus idle/victory poses. Identifiable at thumbnail size.
 */
export function CharacterAvatar({
  ch,
  pose = "idle",
  className = "h-28 w-auto drop-shadow-lg",
  animate = true,
}: {
  ch: CharacterDef;
  pose?: Pose;
  className?: string;
  animate?: boolean;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const c = ch.colors;
  const [lArm, rArm, lHand, rHand] = armPaths(ch.id, pose);
  const gid = `glow-${ch.id}`;

  const idleAnim = animate
    ? pose === "victory"
      ? { y: [0, -10, 0] }
      : { y: [0, -3, 0] }
    : undefined;
  const idleTrans = pose === "victory"
    ? { duration: 0.5, repeat: Infinity, ease: "easeInOut" as const }
    : { duration: 2.6, repeat: Infinity, ease: "easeInOut" as const };

  if (!imgFailed) {
    const filename = ch.id === "the_accuser" ? "accuser.png" : `${ch.id}.png`;
    return (
      <motion.img
        src={`/assets/characters/${filename}`}
        alt={ch.name}
        className={className}
        animate={idleAnim}
        transition={idleTrans}
        onError={() => setImgFailed(true)}
      />
    );
  }

  return (
    <motion.svg viewBox="0 0 80 112" className={className} animate={idleAnim} transition={idleTrans}>
      <defs>
        <radialGradient id={gid} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fffbe8" stopOpacity="0.95" />
          <stop offset="60%" stopColor="#ffe39a" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#ffe39a" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Holy light above the head */}
      <ellipse cx="40" cy="3" rx="22" ry="14" fill={`url(#${gid})`} />
      <ellipse cx="40" cy="2.5" rx="11" ry="3.6" fill="none" stroke="#ffe9a8" strokeWidth="1.6" opacity="0.95" />
      <circle cx="26" cy="6" r="1" fill="#fff6d6" opacity="0.9" />
      <circle cx="55" cy="5" r="1.2" fill="#fff6d6" opacity="0.9" />

      {/* legs */}
      <polyline points="34,80 30,92 27,103" fill="none" stroke="#5566a0" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="46,80 50,92 53,103" fill="none" stroke="#5566a0" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      <ellipse cx="27" cy="105" rx="8" ry="4.5" fill="#f5f5f5" />
      <ellipse cx="53" cy="105" rx="8" ry="4.5" fill="#f5f5f5" />
      <rect x="20" y="107" width="15" height="2.5" rx="1" fill={c.accent} />
      <rect x="45" y="107" width="15" height="2.5" rx="1" fill={c.accent} />

      {/* torso */}
      <path
        d="M23 38 Q40 32 57 38 Q59 58 53 80 Q40 85 27 80 Q21 58 23 38 Z"
        fill={c.primary}
        stroke={c.secondary}
        strokeWidth="2"
      />
      <path d="M25 46 Q40 51 55 46" fill="none" stroke={c.accent} strokeWidth="3" />
      <text x="40" y="64" textAnchor="middle" fontSize="6.5" fontWeight="900" fill={c.secondary} fontFamily="Nunito, sans-serif">
        {ch.clothingText}
      </text>

      {/* arms (per character + pose) */}
      <polyline points={lArm} fill="none" stroke={c.primary} strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={rArm} fill="none" stroke={c.primary} strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lHand[0]} cy={lHand[1]} r="4" fill={c.skin} />
      <circle cx={rHand[0]} cy={rHand[1]} r="4" fill={c.skin} />

      {/* neck + head */}
      <rect x="36.5" y="28" width="7" height="8" fill={c.skin} />
      <circle cx="40" cy="19" r="12.5" fill={c.skin} />

      <Hair ch={ch} />

      {/* eyes — larger & stylized for a premium, friendly read */}
      <ellipse cx="35" cy="20" rx="2.3" ry="3.1" fill="#1c1c28" />
      <ellipse cx="45" cy="20" rx="2.3" ry="3.1" fill="#1c1c28" />
      <circle cx="35.8" cy="18.8" r="0.9" fill="#fff" />
      <circle cx="45.8" cy="18.8" r="0.9" fill="#fff" />
      <Mouth id={ch.id} />
    </motion.svg>
  );
}
