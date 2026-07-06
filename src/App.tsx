import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { RunStats, SaveData, Screen } from "./types";
import {
  loadSave,
  loadSaveFor,
  persistSave,
  loadFamily,
  switchActiveProfile,
  addProfile,
  removeProfile,
  todayKey,
  yesterdayKey,
} from "./utils/storage";
import { makeProfile, type FamilyData } from "./data/family";
import { sound } from "./audio/SoundEngine";
import { MISSIONS } from "./data/missions";
import { LoadingScreen } from "./screens/LoadingScreen";
import { StartScreen } from "./screens/StartScreen";
import { CharacterSelectScreen } from "./screens/CharacterSelectScreen";
import { BoardStoreScreen } from "./screens/BoardStoreScreen";
import { VenuesScreen } from "./screens/VenuesScreen";
import { CollectionScreen } from "./screens/CollectionScreen";
import { MissionsScreen } from "./screens/MissionsScreen";
import { ScriptureScreen } from "./screens/ScriptureScreen";
import { MAX_MASTERY } from "./data/challenges";
import { UpgradesScreen } from "./screens/UpgradesScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { GameScreen } from "./screens/GameScreen";
import { GameOverScreen } from "./screens/GameOverScreen";
import { RewardsScreen } from "./screens/RewardsScreen";
import { InstallScreen } from "./screens/InstallScreen";
import { CharacterProfileScreen } from "./screens/CharacterProfileScreen";
import { ParentDashboardScreen } from "./screens/ParentDashboardScreen";
import { ShoesScreen } from "./screens/ShoesScreen";
import { CosmeticShopScreen } from "./screens/CosmeticShopScreen";
import { getShoe } from "./data/shoes";
import { getBoard } from "./data/boards";
import { purchaseService, purchasesAvailable } from "./services/PurchaseService";
import { trackCosmeticEquipped } from "./services/AnalyticsService";
import { getFinishTierNumber } from "./data/finishLine";
import type { finishRewards } from "./data/finishLine";
import { RotateOverlay } from "./components/RotateOverlay";
import { CHARACTERS } from "./data/characters";
import { friendshipLevel, FRIENDSHIP_REWARDS } from "./data/friendship";

export default function App() {
  const [screen, setScreen] = useState<Screen>("loading");
  const [save, setSave] = useState<SaveData>(() => loadSave());
  const [family, setFamily] = useState<FamilyData>(() => loadFamily());
  const [lastRun, setLastRun] = useState<RunStats | null>(null);
  const [profileCharacterId, setProfileCharacterId] = useState<string>(
    () => CHARACTERS[0].id
  );
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    sound.setMuted(save.settings.muted);
    sound.setMusicEnabled(save.settings.music);
    sound.setVoiceEnabled(save.settings.voiceScriptures);
    sound.setVoiceVolume(save.settings.voiceVolume);
    sound.setVoiceGender(save.settings.voiceGender);
    persistSave(save);
  }, [save]);

  const updateSave = useCallback((patch: Partial<SaveData>) => {
    setSave((s) => ({ ...s, ...patch }));
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  const updateFriendship = useCallback(
    (charId: string, xpDelta: number, incrementRuns = false) => {
      setSave((s) => {
        const prev = s.friendship[charId] ?? { xp: 0, level: 1, runs: 0 };
        const newXp = prev.xp + xpDelta;
        const newLevel = friendshipLevel(newXp);
        const newRuns = incrementRuns ? prev.runs + 1 : prev.runs;

        // Check for milestone rewards
        let bonusCoins = 0;
        for (let lvl = prev.level; lvl < newLevel; lvl++) {
          const reward = FRIENDSHIP_REWARDS.find((r) => r.level === lvl + 1);
          if (reward) bonusCoins += reward.coins;
        }

        const charName =
          CHARACTERS.find((c) => c.id === charId)?.name ?? charId;
        showToast(`💛 +${xpDelta} XP with ${charName}!`);

        // Victory moment: warm rising chime when friendship deepens a level.
        if (newLevel > prev.level) sound.playFriendshipLevelUp();

        return {
          ...s,
          totalCoins: s.totalCoins + bonusCoins,
          friendship: {
            ...s.friendship,
            [charId]: { xp: newXp, level: newLevel, runs: newRuns },
          },
        };
      });
    },
    [showToast],
  );

  /** Phase 16.5 §2 — Real-money cosmetic purchase for isPremium shoes/boards. */
  const handlePurchasePremium = useCallback(
    async (id: string, type: "shoe" | "board"): Promise<boolean> => {
      const cosmetic = type === "shoe" ? getShoe(id) : getBoard(id);
      if (!purchasesAvailable) {
        showToast("🚧 Purchases aren't available yet in this preview.");
        return false;
      }
      const result = await purchaseService.purchaseCosmetic(id, type, cosmetic.cost);
      if (!result.success) {
        showToast(`⚠️ Purchase failed: ${result.error ?? "please try again"}`);
        return false;
      }
      sound.play("reward");
      setSave((s) => ({
        ...s,
        ownedShoes: type === "shoe" ? [...new Set([...(s.ownedShoes ?? []), id])] : s.ownedShoes,
        equippedShoe: type === "shoe" ? id : s.equippedShoe,
        ownedBoards: type === "board" ? [...new Set([...s.ownedBoards, id])] : s.ownedBoards,
        equippedBoard: type === "board" ? id : s.equippedBoard,
        cosmeticPurchases: [
          ...s.cosmeticPurchases,
          {
            cosmeticId: id,
            type,
            purchasedAt: new Date().toISOString(),
            price: cosmetic.cost,
            iapTransactionId: result.transactionId,
            currency: "USD",
          },
        ],
      }));
      trackCosmeticEquipped(id, type);
      showToast(`✨ ${cosmetic.name} unlocked!`);
      return true;
    },
    [showToast],
  );

  const handleUnlock = useCallback((id: string, cost: number) => {
    setSave((s) => {
      if (s.ownedCharacters.includes(id) || s.totalCoins < cost) return s;
      // Victory moment: celebratory chime when a new hero joins the journey.
      sound.play("achievement");
      return {
        ...s,
        totalCoins: s.totalCoins - cost,
        ownedCharacters: [...new Set([...s.ownedCharacters, id])],
        selectedCharacter: id,
      };
    });
  }, []);

  const handleRunEnd = useCallback((stats: RunStats) => {
    const charIdForRun = save.selectedCharacter;
    setLastRun(stats);
    setSave((s) => {
      const missionCoins = stats.missionsCompleted.reduce(
        (sum, id) => sum + (MISSIONS.find((m) => m.id === id)?.rewardCoins ?? 0),
        0,
      );
      // Merge per-verse "times heard" into lifetime scripture memory.
      const scriptureHeard = { ...s.scriptureHeard };
      for (const [ref, n] of Object.entries(stats.scripturesHeard)) {
        scriptureHeard[ref] = (scriptureHeard[ref] ?? 0) + n;
      }
      // Merge spaced repetition last-heard dates.
      const scriptureLastHeard = { ...s.scriptureLastHeard };
      for (const [ref, iso] of Object.entries(stats.scriptureLastHeardUpdates ?? {})) {
        scriptureLastHeard[ref] = iso;
      }
      // §6 — Scripture streak update
      const heardToday = Object.keys(stats.scripturesHeard).length > 0 || stats.scripturesSeen.length > 0;
      const today = todayKey();
      const yesterday = yesterdayKey();
      const lastStreakDate = s.scriptureStreakLastDate ?? "";
      let newStreakDays = s.scriptureStreakDays ?? 0;
      let newStreakLastDate = lastStreakDate;
      if (heardToday) {
        if (lastStreakDate === today) {
          // already counted today
        } else if (lastStreakDate === yesterday) {
          newStreakDays = newStreakDays + 1;
          newStreakLastDate = today;
        } else {
          newStreakDays = 1;
          newStreakLastDate = today;
        }
      }

      return {
        ...s,
        scriptureHeard,
        scriptureLastHeard,
        scriptureStreakDays: newStreakDays,
        scriptureStreakLastDate: newStreakLastDate,
        scriptureStreakBest: Math.max(s.scriptureStreakBest ?? 0, newStreakDays),
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
          playSeconds: (s.lifetime.playSeconds ?? 0) + Math.floor(stats.surviveSeconds),
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
    // Friendship XP: 10 base + 1 per 100 score
    const xpFromRun = 10 + Math.floor(stats.score / 100);
    updateFriendship(charIdForRun, xpFromRun, true);
  }, [updateFriendship, save.selectedCharacter]);

  const handleFinishVictory = useCallback(
    (correct: boolean, ref: string, rewards: ReturnType<typeof finishRewards>) => {
      setSave((s) => {
        const newVictories = correct ? (s.finishVictories ?? 0) + 1 : (s.finishVictories ?? 0);
        const newCorrect = correct ? (s.finishCorrectAnswers ?? 0) + 1 : (s.finishCorrectAnswers ?? 0);
        // Codex review fix (PR #3, P2) — every finish-line answer counts as
        // an attempt, correct or not, so accuracy has a real denominator.
        const newAttempts = (s.finishAttempts ?? 0) + 1;
        const newStreak = correct ? (s.finishVictoryStreak ?? 0) + 1 : 0;
        const newLongest = Math.max(s.finishLongestStreak ?? 0, newStreak);
        const newTier = getFinishTierNumber(newVictories);

        // Mastery XP for the scripture used in the encounter
        const prevMastery = s.scriptureMastery[ref] ?? 0;
        const newMastery = Math.min(MAX_MASTERY, prevMastery + rewards.masteryXp);

        return {
          ...s,
          totalCoins: s.totalCoins + rewards.coins,
          totalXp: s.totalXp + rewards.xp,
          finishVictories: newVictories,
          finishCorrectAnswers: newCorrect,
          finishAttempts: newAttempts,
          finishScriptureTier: newTier,
          finishVictoryStreak: newStreak,
          finishLongestStreak: newLongest,
          scriptureMastery: rewards.masteryXp > 0
            ? { ...s.scriptureMastery, [ref]: newMastery }
            : s.scriptureMastery,
          unlockedScriptures: [...new Set([...s.unlockedScriptures, ref])],
        };
      });
      if (correct) {
        updateFriendship(save.selectedCharacter, rewards.friendshipXp);
      }
    },
    [updateFriendship, save.selectedCharacter],
  );

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

  // ── Family profiles (Phase 14 §2) ──────────────────────────────────────────
  const handleSwitchProfile = useCallback((id: string) => {
    const next = switchActiveProfile(id);
    setFamily(next);
    // Load the newly-active profile's own save. Each profile's data is stored
    // under its own key, so nobody's progress is ever lost on switch.
    setSave(loadSaveFor(id));
  }, []);

  const handleAddChild = useCallback((name: string, avatar: string) => {
    const profile = makeProfile(name, "child", avatar);
    const next = addProfile(profile);
    setFamily(next);
  }, []);

  const handleRemoveChild = useCallback((id: string) => {
    const next = removeProfile(id);
    setFamily(next);
    // If we removed the active profile, follow storage to the new active one.
    if (next.activeProfileId !== id) setSave(loadSaveFor(next.activeProfileId));
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
              onUnlock={handleUnlock}
              onBack={() => setScreen("start")}
              onPlay={() => setScreen("game")}
              onProfile={(id) => {
                setProfileCharacterId(id);
                setScreen("profile");
              }}
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
              onPurchasePremium={(id) => handlePurchasePremium(id, "board")}
              onEquip={(id) => updateSave({ equippedBoard: id })}
              onBack={() => setScreen("start")}
            />
          )}
          {screen === "shoes" && (
            <ShoesScreen
              save={save}
              onBuy={(id, cost) =>
                setSave((s) => ({
                  ...s,
                  totalCoins: s.totalCoins - cost,
                  ownedShoes: [...new Set([...(s.ownedShoes ?? []), id])],
                  equippedShoe: id,
                }))
              }
              onPurchasePremium={(id) => handlePurchasePremium(id, "shoe")}
              onEquip={(id) => updateSave({ equippedShoe: id })}
              onBack={() => setScreen("start")}
            />
          )}
          {screen === "cosmetics" && (
            <CosmeticShopScreen
              save={save}
              onBuyCoins={(id, cost, type) =>
                setSave((s) => ({
                  ...s,
                  totalCoins: s.totalCoins - cost,
                  ownedShoes:
                    type === "shoes" ? [...new Set([...(s.ownedShoes ?? []), id])] : s.ownedShoes,
                  equippedShoe: type === "shoes" ? id : s.equippedShoe,
                  ownedBoards: type === "boards" ? [...new Set([...s.ownedBoards, id])] : s.ownedBoards,
                  equippedBoard: type === "boards" ? id : s.equippedBoard,
                }))
              }
              onPurchasePremium={(id, type) =>
                handlePurchasePremium(id, type === "shoes" ? "shoe" : "board")
              }
              onEquip={(id, type) =>
                updateSave(
                  type === "shoes" ? { equippedShoe: id } : { equippedBoard: id }
                )
              }
              onBack={() => setScreen("start")}
            />
          )}
          {screen === "venues" && (
            <VenuesScreen
              save={save}
              onSelect={(id) => updateSave({ selectedVenue: id })}
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
          {screen === "scripture" && (
            <ScriptureScreen
              save={save}
              onAnswer={(ref, coins, xp, friendshipXp) => {
                setSave((s) => {
                  const prevMastery = s.scriptureMastery[ref] ?? 0;
                  const newMastery = Math.min(MAX_MASTERY, prevMastery + 1);
                  // §7 — Award scripture badge when verse just hits MAX_MASTERY
                  const justMastered = prevMastery + 1 >= MAX_MASTERY && prevMastery < MAX_MASTERY;
                  return {
                    ...s,
                    totalCoins: s.totalCoins + coins,
                    totalXp: s.totalXp + xp,
                    scriptureMastery: {
                      ...s.scriptureMastery,
                      [ref]: newMastery,
                    },
                    scriptureBadges: justMastered ? (s.scriptureBadges ?? 0) + 1 : (s.scriptureBadges ?? 0),
                    // Practicing a verse also counts as hearing it.
                    unlockedScriptures: [...new Set([...s.unlockedScriptures, ref])],
                    // Track last practiced for spaced repetition
                    scriptureLastHeard: {
                      ...s.scriptureLastHeard,
                      [ref]: new Date().toISOString(),
                    },
                  };
                });
                updateFriendship(save.selectedCharacter, friendshipXp);
              }}
              onBack={() => setScreen("start")}
              onToggleFavorite={(ref) =>
                setSave((s) => ({
                  ...s,
                  favoriteScriptures: s.favoriteScriptures.includes(ref)
                    ? s.favoriteScriptures.filter((r) => r !== ref)
                    : [...s.favoriteScriptures, ref],
                }))
              }
              favoriteScriptures={save.favoriteScriptures}
            />
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
              onFinishVictory={(correct, ref, rewards) =>
                handleFinishVictory(correct, ref, rewards)
              }
              onQuickAnswer={(ref, coins, masteryXp, friendshipXp) => {
                setSave((s) => {
                  const prevMastery = s.scriptureMastery[ref] ?? 0;
                  const newMastery = Math.min(MAX_MASTERY, prevMastery + masteryXp);
                  const justMastered = newMastery >= MAX_MASTERY && prevMastery < MAX_MASTERY;
                  return {
                    ...s,
                    totalCoins: s.totalCoins + coins,
                    scriptureMastery: {
                      ...s.scriptureMastery,
                      [ref]: newMastery,
                    },
                    scriptureBadges: justMastered ? (s.scriptureBadges ?? 0) + 1 : (s.scriptureBadges ?? 0),
                  };
                });
                updateFriendship(save.selectedCharacter, friendshipXp);
              }}
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
          {screen === "dashboard" && (
            <ParentDashboardScreen
              save={save}
              family={family}
              onSwitchProfile={handleSwitchProfile}
              onAddChild={handleAddChild}
              onRemoveChild={handleRemoveChild}
              onBack={() => setScreen("start")}
            />
          )}
          {screen === "profile" && (
            <CharacterProfileScreen
              save={save}
              characterId={profileCharacterId}
              onBack={() => setScreen("characters")}
              onUnlock={handleUnlock}
              onSelect={(id) => updateSave({ selectedCharacter: id })}
            />
          )}
        </motion.div>
      </AnimatePresence>
      {toast && (
        <div className="pointer-events-none absolute bottom-24 left-1/2 -translate-x-1/2 rounded-full bg-black/80 px-5 py-2 text-sm font-bold text-yellow-300 shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
