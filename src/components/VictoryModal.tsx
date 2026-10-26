import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Star, RotateCcw, ChevronRight, Wrench, Trophy } from 'lucide-react';
import { SoundEffects } from '../audio/SoundEffects';

interface VictoryModalProps {
  levelId: number;
  levelName: string;
  timeTaken: number;
  accuracy: number;
  damageRemaining: number;
  coinsEarned: {
    base: number;
    accuracyBonus: number;
    timeBonus: number;
    damagePenalty: number;
    total: number;
  };
  stars: number;
  onNextLevel: () => void;
  onReplay: () => void;
  onGoToGarage: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  levelId,
  levelName,
  timeTaken,
  accuracy,
  damageRemaining,
  coinsEarned,
  stars,
  onNextLevel,
  onReplay,
  onGoToGarage,
}) => {
  useEffect(() => {
    SoundEffects.playVictoryFanfare();
    // Confetti celebration
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#38bdf8', '#10b981', '#ffffff'],
      });
    } catch {
      // Safe fallback
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-md p-6 shadow-2xl flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mb-3 shadow-inner">
          <Trophy className="w-7 h-7" />
        </div>

        <span className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400">
          Level {levelId} Cleared
        </span>
        <h2 className="text-2xl font-extrabold text-white tracking-tight mt-0.5">{levelName}</h2>

        {/* Stars */}
        <div className="flex items-center gap-2 my-4">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`p-2 rounded-2xl transition-transform ${
                s <= stars ? 'scale-110 text-amber-400' : 'text-slate-700'
              }`}
            >
              <Star
                className={`w-9 h-9 ${
                  s <= stars ? 'fill-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.6)]' : 'fill-slate-800'
                }`}
              />
            </div>
          ))}
        </div>

        {/* Stats Grid */}
        <div className="w-full bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex flex-col gap-2 text-xs mb-4">
          <div className="flex items-center justify-between text-slate-300">
            <span>Completion Time:</span>
            <span className="font-mono font-bold text-white">{timeTaken.toFixed(1)}s</span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span>Parking Precision:</span>
            <span className="font-mono font-bold text-emerald-400">{accuracy}%</span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span>Vehicle Condition:</span>
            <span className="font-mono font-bold text-white">{Math.round(damageRemaining)}%</span>
          </div>

          <div className="h-px bg-slate-800 my-1" />

          {/* Coins Breakdown */}
          <div className="flex items-center justify-between text-slate-400">
            <span>Base Clear Reward:</span>
            <span className="font-mono text-slate-200">+🪙 {coinsEarned.base}</span>
          </div>
          {coinsEarned.accuracyBonus > 0 && (
            <div className="flex items-center justify-between text-emerald-400">
              <span>Precision Bonus:</span>
              <span className="font-mono">+🪙 {coinsEarned.accuracyBonus}</span>
            </div>
          )}
          {coinsEarned.timeBonus > 0 && (
            <div className="flex items-center justify-between text-cyan-400">
              <span>Speed Bonus:</span>
              <span className="font-mono">+🪙 {coinsEarned.timeBonus}</span>
            </div>
          )}
          {coinsEarned.damagePenalty > 0 && (
            <div className="flex items-center justify-between text-rose-400">
              <span>Damage Penalty:</span>
              <span className="font-mono">-🪙 {coinsEarned.damagePenalty}</span>
            </div>
          )}

          <div className="flex items-center justify-between text-amber-400 font-bold text-sm border-t border-slate-800 pt-1.5 mt-1">
            <span>Total Gold Earned:</span>
            <span className="font-mono text-base">+🪙 {coinsEarned.total}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col w-full gap-2.5">
          {levelId < 100 && (
            <button
              onClick={onNextLevel}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-98 text-slate-950 font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition-all"
            >
              <span>NEXT LEVEL</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onReplay}
              className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Replay</span>
            </button>
            <button
              onClick={onGoToGarage}
              className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Showroom</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
