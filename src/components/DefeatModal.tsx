import React from 'react';
import { AlertOctagon, RotateCcw, Home, Wrench } from 'lucide-react';

interface DefeatModalProps {
  levelId: number;
  reason: 'wrecked' | 'timeout';
  onReplay: () => void;
  onGoToGarage: () => void;
  onMainMenu: () => void;
}

export const DefeatModal: React.FC<DefeatModalProps> = ({
  levelId,
  reason,
  onReplay,
  onGoToGarage,
  onMainMenu,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="bg-slate-900 border border-rose-500/40 rounded-3xl w-full max-w-sm p-6 shadow-2xl flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mb-3 shadow-inner">
          <AlertOctagon className="w-8 h-8" />
        </div>

        <span className="text-xs font-mono font-bold uppercase tracking-widest text-rose-400">
          Level {levelId} Failed
        </span>
        <h2 className="text-xl font-extrabold text-white tracking-tight mt-0.5">
          {reason === 'wrecked' ? 'Vehicle Totaled' : 'Time Expired'}
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-xs">
          {reason === 'wrecked'
            ? 'Excessive collisions caused critical structural damage to your vehicle. Upgrade Durability in the Showroom!'
            : 'You exceeded the allowable parking attempt window. Try a smoother approach.'}
        </p>

        <div className="flex flex-col w-full gap-2 mt-5">
          <button
            onClick={onReplay}
            className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs tracking-wider shadow-lg flex items-center justify-center gap-2 active:scale-98 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>TRY AGAIN</span>
          </button>

          <button
            onClick={onGoToGarage}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 flex items-center justify-center gap-2 transition-colors"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Garage Upgrades</span>
          </button>

          <button
            onClick={onMainMenu}
            className="w-full py-2 rounded-xl text-slate-400 hover:text-white font-medium text-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Main Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
