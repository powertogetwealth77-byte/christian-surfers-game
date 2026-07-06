import { useId } from "react";
import type { Rarity } from "../types";
import { RARITY } from "../data/rarity";

/**
 * Phase 16.6 — Premium 3D holographic skateboard.
 *
 * Replaces the old "hoverboard ellipse" preview. This renders an actual
 * popsicle skateboard deck (kicktail nose + tail, trucks, four wheels)
 * tilted into a 3D tabletop pose via CSS perspective, wrapped in an
 * animated iridescent holographic foil that shifts hue like real chrome
 * vinyl. Every board keeps its own identity color while reading as a
 * premium holo collectible. Reduced-motion players get a still board
 * (animations disabled in index.css).
 */
export function HolographicSkateboard({
  color,
  edge,
  trail,
  rarity,
  text,
  showText = true,
  className = "",
}: {
  color: string;
  edge: string;
  trail: string;
  rarity: Rarity;
  text: string;
  showText?: boolean;
  className?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const glow = RARITY[rarity].glow;
  const isRadiant = rarity === "legendary" || rarity === "kingdom";

  // Classic popsicle deck silhouette with a subtle waist.
  const DECK =
    "M80,16 C108,16 128,42 128,78 C128,128 122,150 122,190 " +
    "C122,230 128,252 128,302 C128,338 108,364 80,364 " +
    "C52,364 32,338 32,302 C32,252 38,230 38,190 " +
    "C38,150 32,128 32,78 C32,42 52,16 80,16 Z";

  return (
    <div className={`holo-board-stage relative flex items-center justify-center ${className}`}>
      {/* Floor glow pool so the deck reads as floating. */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-1 mx-auto h-6 w-4/5 rounded-[50%] blur-md"
        style={{ background: `radial-gradient(closest-side, ${glow}, transparent)` }}
      />

      <div className="holo-board-deck relative">
        <svg viewBox="0 0 160 380" className="h-full w-full overflow-visible">
          <defs>
            {/* Base deck color — lengthwise so the board has form. */}
            <linearGradient id={`deck-${uid}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.95" />
              <stop offset="48%" stopColor={edge} stopOpacity="0.9" />
              <stop offset="100%" stopColor={color} stopOpacity="0.95" />
            </linearGradient>

            {/* Iridescent holographic foil — full spectrum, blended over deck. */}
            <linearGradient id={`foil-${uid}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ff5f6d" />
              <stop offset="20%" stopColor="#ffc371" />
              <stop offset="40%" stopColor="#3cffd0" />
              <stop offset="60%" stopColor="#38a3ff" />
              <stop offset="80%" stopColor="#b06bff" />
              <stop offset="100%" stopColor="#ff5f6d" />
            </linearGradient>

            {/* Moving specular sheen band. */}
            <linearGradient id={`sheen-${uid}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>

            <clipPath id={`clip-${uid}`}>
              <path d={DECK} />
            </clipPath>

            <filter id={`edgeglow-${uid}`} x="-40%" y="-40%" width="180%" height="180%">
              <feDropShadow dx="0" dy="0" stdDeviation={isRadiant ? 6 : 3.5} floodColor={edge} floodOpacity="0.9" />
            </filter>
          </defs>

          {/* Trucks (metal axle bars) + wheels peeking under the deck. */}
          <g opacity="0.95">
            <rect x="52" y="86" width="56" height="7" rx="3.5" fill="#c8cdd6" />
            <rect x="52" y="288" width="56" height="7" rx="3.5" fill="#c8cdd6" />
            {[
              [30, 92],
              [130, 92],
              [30, 294],
              [130, 294],
            ].map(([wx, wy], i) => (
              <ellipse key={i} cx={wx} cy={wy} rx="10" ry="13" fill={trail} stroke="#1a1020" strokeWidth="1.5" />
            ))}
          </g>

          {/* Deck body. */}
          <g filter={`url(#edgeglow-${uid})`}>
            <path d={DECK} fill={`url(#deck-${uid})`} stroke={edge} strokeWidth="2.5" />
          </g>

          {/* Everything below is clipped to the deck shape. */}
          <g clipPath={`url(#clip-${uid})`}>
            {/* Holographic foil layer — hue-rotates over time. */}
            <rect
              className="holo-board-foil"
              x="-40"
              y="-40"
              width="240"
              height="460"
              fill={`url(#foil-${uid})`}
              opacity={isRadiant ? 0.5 : 0.38}
            />
            {/* Grip-tape speckle for texture. */}
            <g opacity="0.18" fill="#05060a">
              {Array.from({ length: 42 }).map((_, i) => {
                const gx = 34 + ((i * 37) % 92);
                const gy = 26 + ((i * 53) % 330);
                return <circle key={i} cx={gx} cy={gy} r="1.3" />;
              })}
            </g>
            {/* Center spine highlight. */}
            <rect x="76" y="16" width="8" height="348" fill="#ffffff" opacity="0.12" />
            {/* Sweeping specular sheen. */}
            <rect
              className="holo-board-sheen"
              x="10"
              y="-40"
              width="60"
              height="460"
              fill={`url(#sheen-${uid})`}
              opacity="0.7"
            />
          </g>

          {/* Scripture stamped across the deck. */}
          {showText && (
            <text
              x="80"
              y="192"
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="20"
              fontWeight="900"
              fill="#ffffff"
              style={{ paintOrder: "stroke", letterSpacing: "0.5px" }}
              stroke="#0a1024"
              strokeWidth="3"
            >
              {text}
            </text>
          )}
        </svg>
      </div>
    </div>
  );
}
