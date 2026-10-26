import React, { useState } from 'react';
import { PlayerProfile, LevelConfig } from '../types/game';
import { ALL_LEVELS } from '../engine/LevelData';
import { SoundEffects } from '../audio/SoundEffects';
import { X, Lock, Star, Trophy, ChevronRight } from 'lucide-react';

interface LevelSelectModalProps {
  profile: PlayerProfile;
  onSelectLevel: (levelId: number) => void;
  onClose: () => void;
}

export const LevelSelectModal: React.FC<LevelSelectModalProps> = ({
  profile,
  onSelectLevel,
  onClose,
}) => {
  const [selectedTier, setSelectedTier] = useState<number>(0); // 0 to 9 (10 tiers of 10 levels each)

  const TIER_NAMES = [
    '1–10: Training Lot',
    '11–20: Shopping Mall',
    '21–30: Multi-Storey Garage',
    '31–40: City Downtown',
    '41–50: Office Complex',
    '51–60: Airport Terminal',
    '61–70: Residential Area',
    '71–80: Narrow Underground',
    '81–90: Industrial Dock',
    '91–100: Championship Arena',
  ];

  const currentTierLevels = ALL_LEVELS.slice(selectedTier * 10, (selectedTier + 1) * 10);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 md:p-6 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-800">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span>Select Parking Level</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">100 progressively challenging levels across 10 unique environments</p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tier Selector Pills */}
        <div className="flex items-center gap-1.5 p-3 md:p-4 border-b border-slate-800 overflow-x-auto no-scrollbar">
          {TIER_NAMES.map((name, idx) => (
            <button
              key={name}
              onClick={() => {
                setSelectedTier(idx);
                SoundEffects.playClick();
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedTier === idx
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {name}
            </button>
          ))}
        </div>

        {/* Level Cards Grid */}
        <div className="p-4 md:p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 overflow-y-auto max-h-[60vh]">
          {currentTierLevels.map((lvl) => {
            const progress = profile.levelProgress[lvl.id];
            const isUnlocked = lvl.id === 1 || progress?.unlocked;
            const stars = progress?.stars || 0;

            return (
              <button
                key={lvl.id}
                disabled={!isUnlocked}
                onClick={() => {
                  if (isUnlocked) {
                    SoundEffects.playClick();
                    onSelectLevel(lvl.id);
                  }
                }}
                className={`relative rounded-2xl p-3.5 flex flex-col justify-between h-32 text-left transition-all border ${
                  isUnlocked
                    ? 'bg-slate-800/90 hover:bg-slate-750 border-slate-700 hover:border-amber-500/60 shadow-lg hover:scale-[1.02] cursor-pointer'
                    : 'bg-slate-950/40 border-slate-800/50 opacity-60 cursor-not-allowed'
                }`}
              >
                {/* Level Number & Lock / Stars */}
                <div className="flex items-start justify-between w-full">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700/80 text-slate-300">
                    #{lvl.id}
                  </span>

                  {isUnlocked ? (
                    <div className="flex items-center gap-0.5 text-amber-400">
                      {[1, 2, 3].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= stars ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                          }`}
                        />
                      ))}
                    </div>
                  ) : (
                    <Lock className="w-4 h-4 text-slate-600" />
                  )}
                </div>

                {/* Level Title */}
                <div>
                  <h4 className="text-xs font-bold text-white line-clamp-1">{lvl.name}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Par: {lvl.parTime}s</p>
                </div>

                {/* Best Record / Status */}
                <div className="text-[10px] text-slate-400 font-mono border-t border-slate-700/40 pt-1 flex items-center justify-between">
                  {progress?.completed ? (
                    <span className="text-emerald-400 font-semibold">{progress.bestTime.toFixed(1)}s</span>
                  ) : isUnlocked ? (
                    <span className="text-amber-400">Play Now</span>
                  ) : (
                    <span className="text-slate-500">Locked</span>
                  )}
                  <span className="text-amber-300">🪙 {lvl.rewardCoins}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
