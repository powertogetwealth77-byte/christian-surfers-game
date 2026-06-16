import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { sound } from "../audio/SoundEngine";

interface Props {
  children: ReactNode;
  onClick: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  className?: string;
  shine?: boolean;
}

const STYLES: Record<NonNullable<Props["variant"]>, string> = {
  primary:
    "bg-gradient-to-b from-gold-300 to-gold-600 text-night shadow-lg shadow-gold-500/30",
  secondary:
    "bg-white/10 text-white border border-white/25 backdrop-blur-sm",
  ghost: "bg-transparent text-white/80 hover:text-white",
  danger: "bg-gradient-to-b from-rose-400 to-rose-700 text-white",
};

export function Button({
  children,
  onClick,
  variant = "primary",
  className = "",
  shine = false,
}: Props) {
  return (
    <motion.button
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => {
        sound.unlock();
        sound.play("click");
        onClick();
      }}
      className={`min-h-[48px] rounded-2xl px-6 py-3 font-body text-lg font-extrabold tracking-wide ${STYLES[variant]} ${shine ? "btn-shine" : ""} ${className}`}
    >
      {children}
    </motion.button>
  );
}
