import React from 'react';
import { PlayerProfile } from '../types/game';
import { ALL_LEVELS } from '../engine/LevelData';
import { X, Trophy, Star, Medal, Zap, Award } from 'lucide-react';

interface HighScoresModalProps {
  profile: PlayerProfile;
  onClose: () => void;
}

export const HighScoresModal: React.FC<HighScoresModalProps> = ({
  profile,
  onClose,
}) => {
  // Aggregate stats
  let totalStars = 0;
  let completedCount = 0;
  const records: { id: number; name: string; time: number; accuracy: number; stars: number }[] = [];

  ALL_LEVELS.forEach((lvl) => {
    const prog = profile.levelProgress[lvl.id];
    if (prog?.completed) {
      completedCount++;
      totalStars += prog.stars;
      records.push({
        id: lvl.id,
        name: lvl.name,
        time: prog.bestTime,
        accuracy: prog.bestAccuracy,
        stars: prog.stars,
      });
    }
  });

  const completionPct = Math.round((completedCount / 100) * 100);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl p-6 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span>Driver Career & High Scores</span>
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Global Statistics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3 flex flex-col">
            <span className="text-slate-400 text-[11px]">Stars Collected</span>
            <span className="text-lg font-bold text-amber-400 font-mono mt-1 flex items-center gap-1">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              {totalStars} / 300
            </span>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3 flex flex-col">
            <span className="text-slate-400 text-[11px]">Levels Cleared</span>
            <span className="text-lg font-bold text-emerald-400 font-mono mt-1">
              {completedCount} / 100 ({completionPct}%)
            </span>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3 flex flex-col">
            <span className="text-slate-400 text-[11px]">Gold Coins</span>
            <span className="text-lg font-bold text-amber-300 font-mono mt-1">
              🪙 {profile.coins.toLocaleString()}
            </span>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3 flex flex-col">
            <span className="text-slate-400 text-[11px]">Vehicles Owned</span>
            <span className="text-lg font-bold text-cyan-400 font-mono mt-1">
              {profile.ownedVehicles.length} / 4
            </span>
          </div>
        </div>

        {/* Completed Level Records List */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-slate-300">Level Completion Records:</span>
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl max-h-56 overflow-y-auto p-2 flex flex-col gap-1.5 text-xs">
            {records.length === 0 ? (
              <div className="p-6 text-center text-slate-500">
                No levels completed yet. Start your campaign on Level 1!
              </div>
            ) : (
              records.map((rec) => (
                <div
                  key={rec.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-800/80"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-amber-400 text-[11px] px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800">
                      #{rec.id}
                    </span>
                    <span className="font-medium text-white truncate max-w-[140px] sm:max-w-xs">
                      {rec.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 font-mono text-[11px]">
                    <span className="text-slate-400">{rec.time.toFixed(1)}s</span>
                    <span className="text-emerald-400">{rec.accuracy}% acc</span>
                    <div className="flex items-center text-amber-400">
                      {[1, 2, 3].map((s) => (
                        <Star
                          key={s}
                          className={`w-3 h-3 ${s <= rec.stars ? 'fill-amber-400 text-amber-400' : 'text-slate-700'}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};
