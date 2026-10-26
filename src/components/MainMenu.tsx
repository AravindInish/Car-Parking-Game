import React from 'react';
import { PlayerProfile } from '../types/game';
import { VEHICLE_CONFIGS } from '../engine/VehicleData';
import { SoundEffects } from '../audio/SoundEffects';
import {
  Play,
  Grid,
  Wrench,
  Trophy,
  Settings,
  Star,
  ShieldCheck,
  ChevronRight,
  Car,
} from 'lucide-react';

interface MainMenuProps {
  profile: PlayerProfile;
  onContinue: () => void;
  onOpenLevelSelect: () => void;
  onOpenShowroom: () => void;
  onOpenHighScores: () => void;
  onOpenSettings: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  profile,
  onContinue,
  onOpenLevelSelect,
  onOpenShowroom,
  onOpenHighScores,
  onOpenSettings,
}) => {
  const currentVehicleSpec = VEHICLE_CONFIGS[profile.selectedVehicle];

  // Calculate highest unlocked level and stats
  let totalStars = 0;
  let completedCount = 0;
  let latestUnlockedLevel = 1;

  for (let i = 1; i <= 100; i++) {
    const prog = profile.levelProgress[i];
    if (prog?.unlocked) latestUnlockedLevel = i;
    if (prog?.completed) {
      completedCount++;
      totalStars += prog.stars;
    }
  }

  return (
    <div className="relative w-full h-screen bg-slate-950 flex flex-col items-center justify-between p-6 select-none overflow-hidden text-slate-100">
      {/* Background Graphic Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-950/20 via-slate-950 to-slate-950 -z-10" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] -z-10" />

      {/* TOP BAR */}
      <div className="w-full max-w-5xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold font-mono text-sm shadow-inner">
            3D
          </div>
          <span className="text-xs font-mono uppercase tracking-widest text-slate-400">
            Real Driving Simulation
          </span>
        </div>

        {/* Coin Balance Pill */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900/90 border border-slate-800 text-amber-400 font-mono font-bold text-sm shadow-xl">
          <span>🪙</span>
          <span>{profile.coins.toLocaleString()} Coins</span>
        </div>
      </div>

      {/* CENTER: HERO BRANDING & GAME MENU */}
      <div className="flex flex-col items-center text-center max-w-xl my-auto">
        <span className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400 mb-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
          Mobile & Desktop 3D Experience
        </span>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight uppercase drop-shadow-md">
          Ultimate <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500">Parking</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-2 font-medium">
          100 progressively challenging levels · Realistic vehicle physics · Showroom upgrades
        </p>

        {/* Selected Vehicle Card */}
        <div className="mt-5 mb-7 px-4 py-2 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-3 shadow-lg">
          <Car className="w-4 h-4 text-amber-400" />
          <div className="text-left text-xs">
            <span className="text-slate-400 block text-[10px]">Current Ride:</span>
            <span className="font-bold text-white">{currentVehicleSpec.name}</span>
          </div>
          <button
            onClick={() => {
              SoundEffects.playClick();
              onOpenShowroom();
            }}
            className="ml-2 text-[11px] font-bold text-amber-400 hover:text-amber-300 underline underline-offset-4"
          >
            Change
          </button>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex flex-col w-full max-w-xs gap-3">
          {/* CONTINUE / PLAY */}
          <button
            onClick={() => {
              SoundEffects.playClick();
              onContinue();
            }}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-extrabold text-base tracking-wider uppercase shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2.5 active:scale-98 transition-all"
          >
            <Play className="w-5 h-5 fill-slate-950" />
            <span>Continue (Lv {latestUnlockedLevel})</span>
          </button>

          {/* LEVEL SELECT */}
          <button
            onClick={() => {
              SoundEffects.playClick();
              onOpenLevelSelect();
            }}
            className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-850 active:scale-98 text-white font-bold text-sm tracking-wide border border-slate-800 hover:border-slate-700 shadow-lg flex items-center justify-center gap-2 transition-all"
          >
            <Grid className="w-4 h-4 text-cyan-400" />
            <span>100 Levels Campaign</span>
          </button>

          {/* SHOWROOM & GARAGE */}
          <button
            onClick={() => {
              SoundEffects.playClick();
              onOpenShowroom();
            }}
            className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-850 active:scale-98 text-white font-bold text-sm tracking-wide border border-slate-800 hover:border-slate-700 shadow-lg flex items-center justify-center gap-2 transition-all"
          >
            <Wrench className="w-4 h-4 text-amber-400" />
            <span>Showroom & Upgrades</span>
          </button>

          {/* SECONDARY ROW: HIGH SCORES & SETTINGS */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => {
                SoundEffects.playClick();
                onOpenHighScores();
              }}
              className="py-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 active:scale-98 text-slate-300 hover:text-white font-semibold text-xs border border-slate-800 flex items-center justify-center gap-2 transition-all"
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Career Stats</span>
            </button>
            <button
              onClick={() => {
                SoundEffects.playClick();
                onOpenSettings();
              }}
              className="py-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 active:scale-98 text-slate-300 hover:text-white font-semibold text-xs border border-slate-800 flex items-center justify-center gap-2 transition-all"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span>Settings</span>
            </button>
          </div>
        </div>
      </div>

      {/* FOOTER STATS & CONTROLS BANNER */}
      <div className="w-full max-w-4xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 border-t border-slate-900 pt-4">
        <div className="flex items-center gap-4 font-mono text-[11px]">
          <span>Levels: <strong className="text-white">{completedCount}/100</strong></span>
          <span>·</span>
          <span>Stars: <strong className="text-amber-400">{totalStars}/300</strong></span>
          <span>·</span>
          <span>Cars: <strong className="text-cyan-400">{profile.ownedVehicles.length}/4</strong></span>
        </div>

        <div className="text-[11px] text-slate-500 font-mono">
          Keyboard: [W, A, S, D / Arrows] to Drive · [Space] Handbrake · [C] Camera · [E] Ignition
        </div>
      </div>
    </div>
  );
};
