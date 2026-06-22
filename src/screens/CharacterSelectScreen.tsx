import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { SaveData } from "../types";
import { CHARACTERS } from "../data/characters";
import { RARITY } from "../data/rarity";
import { Button } from "../components/Button";
import { CharacterAvatar } from "../components/CharacterAvatar";
import { sound } from "../audio/SoundEngine";

export function CharacterSelectScreen({
  save,
  onEquip,
  onPurchase,
  onBack,
  onPlay,
}: {
  save: SaveData;
  onEquip: (id: string) => void;
  onPurchase: (id: string, cost: number, autoEquip?: boolean) => boolean;
  onBack: () => void;
  onPlay: () => void;
}) {
  const [focusedId, setFocusedId] = useState(save.selectedCharacter);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setFocusedId(save.selectedCharacter);
  }, [save.selectedCharacter]);

  const selected = useMemo(
    () => CHARACTERS.find((ch) => ch.id === focusedId) ?? CHARACTERS[0],
    [focusedId],
  );
  const selectedRarity = RARITY[selected.rarity];
  const owned = save.ownedCharacters.includes(selected.id);
  const equipped = save.selectedCharacter === selected.id;
  const canAfford = save.totalCoins >= selected.price;
  const equippedName =
    CHARACTERS.find((character) => character.id === save.selectedCharacter)?.name ?? "Zion";

  const handlePurchase = () => {
    if (owned) {
      setNotice(`${selected.name} is already owned.`);
      return;
    }
    if (!canAfford) {
      setNotice(`Not enough Light Coins for ${selected.name}.`);
      return;
    }
    const purchased = onPurchase(selected.id, selected.price, true);
    setNotice(
      purchased
        ? `${selected.name} joined your roster and is now equipped.`
        : `${selected.name} could not be purchased right now.`,
    );
  };

  const handleEquip = () => {
    if (!owned) {
      setNotice(`${selected.name} is locked. Purchase this runner first.`);
      return;
    }
    onEquip(selected.id);
    setNotice(`${selected.name} is now equipped.`);
  };

  return (
    <div className="safe-top safe-bottom relative flex h-full flex-col overflow-hidden bg-[radial-gradient(circle_at_50%_8%,rgba(255,225,132,0.44),transparent_22%),radial-gradient(circle_at_16%_24%,rgba(56,189,248,0.20),transparent_25%),linear-gradient(155deg,#020817_0%,#071832_35%,#102b68_68%,#241056_100%)] px-4 py-4 text-white">
      <div className="pointer-events-none absolute inset-0 opacity-55 [background-image:linear-gradient(rgba(255,255,255,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] [background-size:26px_26px]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(ellipse_at_center,rgba(255,236,170,0.30),transparent_64%)]" />
      <div className="pointer-events-none absolute -left-24 top-16 h-64 w-64 rounded-full bg-sky-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-20 h-72 w-72 rounded-full bg-gold-400/24 blur-3xl" />

      <div className="relative z-10 mb-2 flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          ← Back
        </Button>
        <div className="text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.42em] text-gold-200/85">
            Kingdom Runner Roster
          </p>
          <h2 className="font-display text-3xl leading-none text-gold-200 drop-shadow-[0_0_24px_rgba(255,211,92,0.72)]">
            CHOOSE YOUR HERO
          </h2>
          <p className="mt-1 text-[11px] font-extrabold uppercase tracking-[0.16em] text-white/58">
            Run toward the light
          </p>
        </div>
        <div className="w-16" />
      </div>

      <div className="relative z-10 mb-3 flex items-center justify-between gap-3 rounded-2xl border border-gold-200/20 bg-black/28 px-4 py-2 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-xl">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/55">Roster status</p>
          <p className="text-sm font-bold text-gold-300">💰 {save.totalCoins.toLocaleString()} Light Coins</p>
        </div>
        <div className="text-right text-xs font-bold text-white/75">
          <p>Owned: {save.ownedCharacters.length}/{CHARACTERS.length}</p>
          <p>Equipped: {equippedName}</p>
        </div>
      </div>

      <motion.div
        data-testid="hero-stage-card"
        key={selected.id}
        initial={{ y: 18, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 180, damping: 19 }}
        className="relative z-10 mx-auto flex min-h-0 w-full max-w-sm flex-1 flex-col overflow-hidden rounded-[2.15rem] border-2 border-white/22 bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(255,255,255,0.08)_42%,rgba(0,0,0,0.24))] p-4 text-center shadow-[0_30px_90px_rgba(0,0,0,0.52),inset_0_1px_0_rgba(255,255,255,0.28)] backdrop-blur-xl"
        style={{
          borderColor: `${selectedRarity.color}cc`,
          boxShadow: `0 30px 90px rgba(0,0,0,0.52), 0 0 64px ${selectedRarity.glow}`,
        }}
      >
        <div
          className="absolute inset-x-8 top-4 h-44 rounded-full blur-2xl"
          style={{ background: `${selectedRarity.color}44` }}
        />
        <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-b from-white/16 via-transparent to-black/20" />

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center">
          <motion.span
            className="mb-1 rounded-full px-4 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-night shadow-lg"
            style={{ background: selectedRarity.color }}
            animate={{
              boxShadow: [
                `0 0 12px ${selectedRarity.glow}`,
                `0 0 24px ${selectedRarity.glow}`,
                `0 0 12px ${selectedRarity.glow}`,
              ],
            }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
          >
            {selectedRarity.label}
          </motion.span>

          <div className="relative mt-1 flex h-32 w-full items-center justify-center sm:h-44">
            <div className="absolute inset-x-4 bottom-2 top-4 rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_50%_18%,rgba(255,236,170,0.26),transparent_32%),linear-gradient(180deg,rgba(10,22,52,0.26),rgba(4,8,20,0.34))]" />
            <div
              className="absolute bottom-2 h-28 w-60 rounded-full blur-2xl"
              style={{ background: `${selected.colors.secondary}40` }}
            />
            <div className="absolute bottom-3 h-7 w-44 rounded-full bg-black/35 blur-md" />
            <CharacterAvatar
              ch={selected}
              pose="victory"
              className="relative z-10 h-40 w-auto drop-shadow-[0_26px_32px_rgba(0,0,0,0.55)] sm:h-52"
            />
          </div>

          <h3 className="font-display text-3xl leading-none text-white drop-shadow-[0_3px_0_rgba(0,0,0,0.35)]">
            {selected.name}
          </h3>
          <p className="mt-1 text-sm font-black uppercase tracking-[0.22em]" style={{ color: selected.colors.secondary }}>
            {selected.title}
          </p>

          <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-[11px] font-black uppercase tracking-[0.14em]">
            <span className="rounded-full px-3 py-1 text-night" style={{ background: selectedRarity.color }}>
              {selectedRarity.label}
            </span>
            <span className={`rounded-full border px-3 py-1 ${owned ? "border-emerald-300/60 bg-emerald-400/15 text-emerald-200" : "border-white/18 bg-white/8 text-white/65"}`}>
              {owned ? "Owned" : "Locked"}
            </span>
            <span className={`rounded-full border px-3 py-1 ${equipped ? "border-gold-300/70 bg-gold-300/20 text-gold-200" : "border-white/18 bg-white/8 text-white/65"}`}>
              {equipped ? "Equipped" : "Not Equipped"}
            </span>
          </div>

          <div className="mt-2 w-full rounded-2xl border border-gold-200/20 bg-black/28 p-2.5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.10),0_12px_32px_rgba(0,0,0,0.24)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/55">Character action</p>
                <p className="text-[13px] font-extrabold leading-snug text-white">
                  {owned
                    ? equipped
                      ? `${selected.name} is ready to ride.`
                      : `Equip ${selected.name} for your next run.`
                    : `Unlock ${selected.name} for ${selected.price.toLocaleString()} coins.`}
                </p>
                <p className="mt-0.5 text-xs font-bold text-gold-100/80">
                  Price: {selected.price === 0 ? "FREE" : `${selected.price.toLocaleString()} Light Coins`}
                </p>
              </div>
              {!owned ? (
                <button
                  type="button"
                  disabled={!canAfford}
                  onClick={() => {
                    sound.unlock();
                    sound.play(canAfford ? "reward" : "click");
                    handlePurchase();
                  }}
                  className={`rounded-2xl px-4 py-2.5 text-sm font-black uppercase tracking-[0.18em] ${canAfford ? "bg-gold-300 text-night shadow-[0_0_26px_rgba(255,211,92,0.55),0_12px_24px_rgba(0,0,0,0.26)]" : "bg-white/10 text-white/45"}`}
                >
                  {canAfford ? `Purchase · ${selected.price.toLocaleString()}` : "Need More Coins"}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={equipped}
                  onClick={() => {
                    sound.unlock();
                    sound.play(equipped ? "click" : "characterSelect");
                    handleEquip();
                  }}
                  className={`rounded-2xl px-4 py-2.5 text-sm font-black uppercase tracking-[0.18em] ${equipped ? "bg-gold-300/30 text-gold-100" : "bg-gold-300 text-night shadow-[0_0_26px_rgba(255,211,92,0.55),0_12px_24px_rgba(0,0,0,0.26)]"}`}
                >
                  {equipped ? "Equipped" : "Equip"}
                </button>
              )}
            </div>
            {notice && <p className="mt-2 text-xs font-bold text-gold-100/90">{notice}</p>}
          </div>

          <p className="mt-2 max-w-[19rem] overflow-hidden text-[13px] font-bold leading-snug text-white/88 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
            {selected.bio}
          </p>

          <div className="mt-2 grid w-full gap-2 text-left">
            <InfoPill icon="✨" title={selected.ability} body={selected.abilityDesc} />
            <InfoPill icon="📖" title={selected.scripture} body={selected.voiceLine} />
          </div>
        </div>
      </motion.div>

      <div className="relative z-10 mx-auto mt-3 flex w-full max-w-md gap-2.5 overflow-x-auto px-1 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-1 [-webkit-overflow-scrolling:touch]">
        {CHARACTERS.map((ch) => {
          const active = ch.id === selected.id;
          const rarity = RARITY[ch.rarity];
          const isOwned = save.ownedCharacters.includes(ch.id);
          const isEquipped = save.selectedCharacter === ch.id;
          return (
            <motion.button
              key={ch.id}
              type="button"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => {
                sound.unlock();
                sound.play("characterSelect");
                setFocusedId(ch.id);
                setNotice(null);
              }}
              className="relative min-w-[5.15rem] rounded-2xl border p-2 text-center backdrop-blur-md transition"
              style={{
                borderColor: active ? rarity.color : "rgba(255,255,255,0.16)",
                borderWidth: active ? 2 : 1,
                background: active
                  ? `linear-gradient(180deg, ${rarity.color}34, rgba(255,255,255,0.10))`
                  : "rgba(255,255,255,0.08)",
                boxShadow: active ? `0 0 0 2px rgba(255,255,255,0.12), 0 0 28px ${rarity.glow}` : "none",
              }}
            >
              {active && (
                <motion.span
                  className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-gold-400 text-sm font-black text-night shadow-[0_0_18px_rgba(255,211,92,0.85)]"
                  animate={{ scale: [1, 1.12, 1] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                >
                  ✓
                </motion.span>
              )}
              <span className={`absolute left-1.5 top-1.5 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.16em] ${isEquipped ? "bg-gold-300 text-night" : isOwned ? "bg-emerald-400/90 text-night" : "bg-black/55 text-white/75"}`}>
                {isEquipped ? "Equipped" : isOwned ? "Owned" : "Locked"}
              </span>
              <CharacterAvatar ch={ch} animate={false} className="mx-auto h-16 w-auto drop-shadow-lg" />
              <p className="mt-1 truncate text-xs font-black text-white">{ch.name}</p>
              <p className="truncate text-[10px] font-bold text-white/55">
                {isOwned ? ch.title : `💰 ${ch.price}`}
              </p>
            </motion.button>
          );
        })}
      </div>

      <Button onClick={onPlay} shine className="relative z-10 mx-auto w-full max-w-xs py-4 text-lg shadow-[0_16px_40px_rgba(245,184,46,0.44),0_0_30px_rgba(255,211,92,0.25)]">
        ▶ RUN IN THE LIGHT
      </Button>
    </div>
  );
}

function InfoPill({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-white/16 bg-white/16 px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]">
      <div className="flex items-start gap-2">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-white/16 text-sm">{icon}</span>
        <div className="min-w-0">
          <p className="text-[12px] font-black uppercase leading-tight tracking-[0.12em] text-white">{title}</p>
          <p className="mt-0.5 text-[12px] font-semibold leading-snug text-white/78">{body}</p>
        </div>
      </div>
    </div>
  );
}
