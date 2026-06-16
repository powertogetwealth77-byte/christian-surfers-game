import { useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Button } from "../components/Button";
import { canPromptInstall, isIOS, isStandalone, promptInstall } from "../utils/pwa";
import { sound } from "../audio/SoundEngine";

function Step({ n, children }: { n: number; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-white/15 bg-white/5 p-4">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold-400 font-extrabold text-night">
        {n}
      </span>
      <p className="pt-1 text-white/85">{children}</p>
    </div>
  );
}

export function InstallScreen({ onBack }: { onBack: () => void }) {
  const [installed, setInstalled] = useState(isStandalone());
  const ios = isIOS();

  return (
    <div className="safe-top safe-bottom flex h-full flex-col bg-gradient-to-b from-night via-[#16204a] to-[#321a4a] px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          ← Back
        </Button>
        <h2 className="font-display text-xl text-gold-400 sm:text-2xl">
          GET THE APP
        </h2>
        <div className="w-16" />
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto pb-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="rounded-3xl border border-gold-400/40 bg-gold-400/10 p-5 text-center"
        >
          <img
            src="icons/icon-192.png"
            alt="Christian Surfers app icon"
            className="mx-auto h-20 w-20 rounded-2xl shadow-lg shadow-gold-500/30"
          />
          <p className="mt-3 font-display text-lg text-gold-300">
            CHRISTIAN SURFERS
          </p>
          <p className="text-sm text-white/70">
            Add it to your home screen and play full-screen, even offline.
          </p>
        </motion.div>

        {installed ? (
          <div className="rounded-2xl border border-emerald-400/40 bg-emerald-400/10 p-4 text-center font-extrabold text-emerald-300">
            ✅ You're playing the installed app. Enjoy the run!
          </div>
        ) : canPromptInstall() ? (
          <Button
            shine
            className="w-full py-4 text-xl"
            onClick={() => {
              void promptInstall().then((ok) => {
                if (ok) {
                  sound.play("reward");
                  setInstalled(true);
                }
              });
            }}
          >
            📲 INSTALL NOW
          </Button>
        ) : ios ? (
          <>
            <p className="px-1 font-extrabold text-white/80">On iPhone / iPad (Safari):</p>
            <Step n={1}>
              Tap the <strong>Share</strong> button{" "}
              <span className="text-ocean-400">⎋</span> at the bottom of Safari
            </Step>
            <Step n={2}>
              Scroll down and tap <strong>"Add to Home Screen"</strong> ➕
            </Step>
            <Step n={3}>
              Tap <strong>Add</strong> — then launch Christian Surfers from your
              home screen ✝️
            </Step>
          </>
        ) : (
          <>
            <p className="px-1 font-extrabold text-white/80">On Android (Chrome):</p>
            <Step n={1}>
              Tap the <strong>⋮ menu</strong> in the top-right corner of Chrome
            </Step>
            <Step n={2}>
              Tap <strong>"Add to Home screen"</strong> (or{" "}
              <strong>"Install app"</strong>)
            </Step>
            <Step n={3}>
              Confirm — then launch Christian Surfers from your home screen ✝️
            </Step>
          </>
        )}

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center text-sm text-white/60">
          Installed, the game runs full-screen in portrait with no browser bars
          — just you, the boardwalk, and the light.
        </div>
      </div>
    </div>
  );
}
