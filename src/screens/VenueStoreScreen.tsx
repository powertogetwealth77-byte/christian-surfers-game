import { motion } from "framer-motion";
import { useState } from "react";
import { VENUES, getVenueCardArt, getVenueHeroArt, getVenuesByTier, isVenueAssetReady } from "../data/venues";
import type { SaveData } from "../types";

interface VenueStoreScreenProps {
  save: SaveData;
  onBuyVenue: (venueId: string, cost: number) => boolean;
  onEquipVenue: (venueId: string) => void;
  onBack: () => void;
}

export default function VenueStoreScreen({ save, onBuyVenue, onEquipVenue, onBack }: VenueStoreScreenProps) {
  const [selectedVenue, setSelectedVenue] = useState<string | null>(null);
  const [unlockAnim, setUnlockAnim] = useState<string | null>(null);

  const selected = selectedVenue ? VENUES.find((v) => v.id === selectedVenue) : null;

  const ownedVenues = VENUES.filter((v) => save.ownedVenues.includes(v.id));
  const earnableVenues = getVenuesByTier("earnable").filter((v) => !save.ownedVenues.includes(v.id));
  const premiumVenues = getVenuesByTier("premium").filter((v) => !save.ownedVenues.includes(v.id));

  const handleUnlock = (venueId: string, cost: number) => {
    const success = onBuyVenue(venueId, cost);
    if (success) {
      setUnlockAnim(venueId);
      setTimeout(() => setUnlockAnim(null), 1500);
    }
  };

  const renderCard = (venue: typeof VENUES[0]) => {
    const owned = save.ownedVenues.includes(venue.id);
    const equipped = save.equippedVenue === venue.id;
    const canAfford = save.totalCoins >= venue.coinCost;
    const assetReady = isVenueAssetReady(venue);
    const cardArt = getVenueCardArt(venue);

    return (
      <motion.div
        key={venue.id}
        layoutId={`venue-${venue.id}`}
        className={`relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-300 ${
          equipped
            ? "ring-4 ring-emerald-400 shadow-emerald-500/30"
            : owned
            ? "ring-2 ring-blue-400"
            : "ring-1 ring-slate-600 hover:ring-amber-400"
        } ${venue.tier === "premium" ? "shadow-lg shadow-purple-500/20" : "shadow-md"}`}
        onClick={() => setSelectedVenue(venue.id)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Card Art */}
        <div className="relative h-40 bg-slate-800 overflow-hidden">
          {assetReady ? (
            <img src={cardArt} alt={venue.displayName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900">
              <div className="text-center p-4">
                <div className="text-4xl mb-2">🌊</div>
                <div className="text-slate-400 text-sm font-medium">Coming Soon</div>
              </div>
            </div>
          )}
          
          {/* Tier Badge */}
          <div className="absolute top-3 left-3">
            <span
              className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                venue.tier === "starter"
                  ? "bg-emerald-500 text-white"
                  : venue.tier === "earnable"
                  ? "bg-amber-500 text-slate-900"
                  : "bg-purple-500 text-white"
              }`}
            >
              {venue.tier}
            </span>
          </div>

          {/* Status Badge */}
          {equipped && (
            <div className="absolute top-3 right-3 bg-emerald-500 text-white px-2 py-1 rounded-full text-xs font-bold">
              EQUIPPED
            </div>
          )}
          {!owned && venue.tier === "premium" && (
            <div className="absolute bottom-3 right-3 bg-purple-500/90 text-white px-2 py-1 rounded-full text-xs font-bold">
              PREMIUM
            </div>
          )}
        </div>

        {/* Card Content */}
        <div className="p-4 bg-slate-800/90 backdrop-blur">
          <h3 className="font-bold text-white text-lg mb-1">{venue.displayName}</h3>
          <p className="text-slate-400 text-sm mb-3 line-clamp-2">{venue.flavorTag}</p>
          
          {!owned ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-amber-400 font-bold">
                <span>💰</span>
                <span>{venue.coinCost.toLocaleString()}</span>
              </div>
              {venue.coinCost > 0 && !canAfford && (
                <span className="text-red-400 text-xs">Need more coins</span>
              )}
            </div>
          ) : (
            <div className="text-emerald-400 text-sm font-medium">✓ Owned</div>
          )}
        </div>
      </motion.div>
    );
  };

  const renderModal = () => {
    if (!selected) return null;
    const owned = save.ownedVenues.includes(selected.id);
    const equipped = save.equippedVenue === selected.id;
    const canAfford = save.totalCoins >= selected.coinCost;
    const heroArt = getVenueHeroArt(selected);
    const assetReady = isVenueAssetReady(selected);

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={() => setSelectedVenue(null)}
      >
        <motion.div
          layoutId={`venue-${selected.id}`}
          className="bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Hero Image */}
          <div className="relative h-64 bg-slate-800 overflow-hidden rounded-t-3xl">
            {assetReady ? (
              <img src={heroArt} alt={selected.displayName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900">
                <div className="text-center p-8">
                  <div className="text-6xl mb-4">🏝️</div>
                  <div className="text-slate-400 text-lg font-medium">Venue Coming Soon</div>
                  <div className="text-slate-500 text-sm mt-2">Artwork in progress</div>
                </div>
              </div>
            )}
            
            <button
              onClick={() => setSelectedVenue(null)}
              className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="absolute bottom-4 left-4">
              <span
                className={`px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wider ${
                  selected.tier === "starter"
                    ? "bg-emerald-500 text-white"
                    : selected.tier === "earnable"
                    ? "bg-amber-500 text-slate-900"
                    : "bg-purple-500 text-white"
                }`}
              >
                {selected.tier} World
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <h2 className="text-2xl font-bold text-white mb-2">{selected.displayName}</h2>
            <p className="text-amber-400 italic mb-4">"{selected.flavorTag}"</p>
            <p className="text-slate-300 mb-6">{selected.description}</p>

            {!owned ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-800 rounded-xl">
                  <div>
                    <div className="text-slate-400 text-sm mb-1">Unlock Cost</div>
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-xl">
                      <span>💰</span>
                      <span>{selected.coinCost.toLocaleString()} coins</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-slate-400 text-sm mb-1">Your Coins</div>
                    <div className="text-emerald-400 font-bold text-xl">
                      💰 {save.totalCoins.toLocaleString()}
                    </div>
                  </div>
                </div>

                {selected.coinCost === 0 ? (
                  <button
                    onClick={() => {
                      handleUnlock(selected.id, 0);
                      setSelectedVenue(null);
                    }}
                    className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors"
                  >
                    Claim Free Venue
                  </button>
                ) : canAfford ? (
                  <button
                    onClick={() => {
                      handleUnlock(selected.id, selected.coinCost);
                      setSelectedVenue(null);
                    }}
                    className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-xl transition-colors"
                  >
                    Unlock for {selected.coinCost.toLocaleString()} Coins
                  </button>
                ) : (
                  <div className="w-full py-4 bg-slate-700 text-slate-400 font-medium rounded-xl text-center">
                    You need {(selected.coinCost - save.totalCoins).toLocaleString()} more coins
                  </div>
                )}
              </div>
            ) : equipped ? (
              <div className="py-4 bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 font-bold rounded-xl text-center">
                ✓ Currently Equipped
              </div>
            ) : (
              <button
                onClick={() => {
                  onEquipVenue(selected.id);
                  setSelectedVenue(null);
                }}
                className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl transition-colors"
              >
                Equip Venue
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-700">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <h1 className="text-2xl font-bold text-white">Venue Store</h1>
            <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-full">
              <span>💰</span>
              <span className="text-amber-400 font-bold">{save.totalCoins.toLocaleString()}</span>
            </div>
          </div>
          <p className="text-slate-400 text-sm mt-2">
            Choose Your Kingdom Run — Unlock beautiful worlds, equip your favorite venue, and run with purpose.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8 pb-24">
        {/* Featured Section */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-2xl">⭐</span> Featured Venue
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {VENUES.filter((v) => v.id === "kingdom_gate_harbor").map(renderCard)}
          </div>
        </section>

        {/* Owned Venues */}
        {ownedVenues.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-2xl">✓</span> Your Venues ({ownedVenues.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ownedVenues.map(renderCard)}
            </div>
          </section>
        )}

        {/* Earnable Venues */}
        {earnableVenues.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-2xl">🏆</span> Earnable Worlds
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {earnableVenues.map(renderCard)}
            </div>
          </section>
        )}

        {/* Premium Venues */}
        {premiumVenues.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-2xl">💎</span> Premium Worlds
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {premiumVenues.map(renderCard)}
            </div>
          </section>
        )}
      </div>

      {/* Unlock Animation Overlay */}
      {unlockAnim && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
        >
          <div className="bg-emerald-500 text-white px-8 py-4 rounded-2xl text-2xl font-bold shadow-2xl">
            🎉 Venue Unlocked!
          </div>
        </motion.div>
      )}

      {/* Modal */}
      {selectedVenue && renderModal()}
    </div>
  );
}
