import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { RunStats, SaveData, Screen } from "./types";
import { loadSave, persistSave, todayKey } from "./utils/storage";
import { sound } from "./audio/SoundEngine";
import { MISSIONS } from "./data/missions";
import { LoadingScreen } from "./screens/LoadingScreen";
import { StartScreen } from "./screens/StartScreen";
import { CharacterSelectScreen } from "./screens/CharacterSelectScreen";
import { BoardStoreScreen } from "./screens/BoardStoreScreen";
import { CollectionScreen } from "./screens/CollectionScreen";
import { MissionsScreen } from "./screens/MissionsScreen";
import { UpgradesScreen } from "./screens/UpgradesScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { GameScreen } from "./screens/GameScreen";
import { GameOverScreen } from "./screens/GameOverScreen";
import { RewardsScreen } from "./screens/RewardsScreen";
import { InstallScreen } from "./screens/InstallScreen";
import { RotateOverlay } from "./components/RotateOverlay";

export default function App() {
  const [screen, setScreen] = useState<Screen>("loading");
  const [save, setSave] = useState<SaveData>(() => loadSave());
  const [lastRun, setLastRun] = useState<RunStats | null>(null);

  useEffect(() => {
    sound.setMuted(save.settings.muted);
    sound.setMusicEnabled(save.settings.music);
    sound.setVoiceEnabled(save.settings.voiceScriptures);
    persistSave(save);
  }, [save]);

  const updateSave = useCallback((patch: Partial<SaveData>) => {
    setSave((s) => ({ ...s, ...patch }));
  }, []);

  const handleRunEnd = useCallback((stats: RunStats) => {
    setLastRun(stats);
    setSave((s) => {
      const missionCoins = stats.missionsCompleted.reduce(
        (sum, id) => sum + (MISSIONS.find((m) => m.id === id)?.rewardCoins ?? 0),
        0,
      );
      return {
        ...s,
        totalCoins: s.totalCoins + stats.coins + missionCoins,
        totalXp: s.totalXp + stats.xpEarned + Math.floor(stats.score / 100),
        bestScore: Math.max(s.bestScore, Math.floor(stats.score)),
        bestDistance: Math.max(s.bestDistance, Math.floor(stats.distance)),
        lifetime: {
          distance: s.lifetime.distance + Math.floor(stats.distance),
          coins: s.lifetime.coins + stats.coins,
          scrolls: s.lifetime.scrolls + stats.scrolls,
          runs: s.lifetime.runs + 1,
          bestCombo: Math.max(s.lifetime.bestCombo, stats.bestCombo),
          perfectDodges: s.lifetime.perfectDodges + stats.perfectDodges,
        },
        completedMissions: [
          ...new Set([...s.completedMissions, ...stats.missionsCompleted]),
        ],
        unlockedScriptures: [
          ...new Set([...s.unlockedScriptures, ...stats.scripturesSeen]),
        ],
      };
    });
    setScreen("gameover");
  }, []);

  const claimAchievement = useCallback((id: string, reward: number) => {
    setSave((s) =>
      s.claimedAchievements.includes(id)
        ? s
        : {
            ...s,
            totalCoins: s.totalCoins + reward,
            claimedAchievements: [...s.claimedAchievements, id],
          },
    );
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden bg-night">
      <RotateOverlay />
      <AnimatePresence mode="wait">
        <motion.div
          key={screen}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.28 }}
        >
          {screen === "loading" && (
            <LoadingScreen onDone={() => setScreen("start")} />
          )}
          {screen === "start" && (
            <StartScreen
              save={save}
              go={setScreen}
              onClaimDaily={(coins, nextStreak) =>
                setSave((s) => ({
                  ...s,
                  totalCoins: s.totalCoins + coins,
                  lastDailyClaim: todayKey(),
                  dailyStreak: nextStreak,
                }))
              }
            />
          )}
          {screen === "characters" && (
            <CharacterSelectScreen
              save={save}
              onSelect={(id) => updateSave({ selectedCharacter: id })}
              onBack={() => setScreen("start")}
              onPlay={() => setScreen("game")}
            />
          )}
          {screen === "boards" && (
            <BoardStoreScreen
              save={save}
              onBuy={(id, cost) =>
                setSave((s) => ({
                  ...s,
                  totalCoins: s.totalCoins - cost,
                  ownedBoards: [...new Set([...s.ownedBoards, id])],
                  equippedBoard: id,
                }))
              }
              onEquip={(id) => updateSave({ equippedBoard: id })}
              onBack={() => setScreen("start")}
            />
          )}
          {screen === "collection" && (
            <CollectionScreen
              save={save}
              onClaim={claimAchievement}
              onBack={() => setScreen("start")}
            />
          )}
          {screen === "missions" && (
            <MissionsScreen save={save} onBack={() => setScreen("start")} />
          )}
          {screen === "upgrades" && (
            <UpgradesScreen
              save={save}
              onBuy={(id, cost) =>
                setSave((s) => ({
                  ...s,
                  totalCoins: s.totalCoins - cost,
                  upgrades: { ...s.upgrades, [id]: (s.upgrades[id] ?? 0) + 1 },
                }))
              }
              onBack={() => setScreen("start")}
            />
          )}
          {screen === "settings" && (
            <SettingsScreen
              save={save}
              onChange={(settings) => updateSave({ settings })}
              onInstall={() => setScreen("install")}
              onBack={() => setScreen("start")}
            />
          )}
          {screen === "install" && (
            <InstallScreen onBack={() => setScreen("settings")} />
          )}
          {screen === "game" && (
            <GameScreen
              save={save}
              onToggleMute={() =>
                updateSave({
                  settings: { ...save.settings, muted: !save.settings.muted },
                })
              }
              onRunEnd={handleRunEnd}
              onQuit={() => setScreen("start")}
            />
          )}
          {screen === "gameover" && lastRun && (
            <GameOverScreen
              stats={lastRun}
              save={save}
              onRetry={() => setScreen("game")}
              onRewards={() => setScreen("rewards")}
              onHome={() => setScreen("start")}
            />
          )}
          {screen === "rewards" && lastRun && (
            <RewardsScreen
              stats={lastRun}
              save={save}
              onContinue={() => setScreen("start")}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
