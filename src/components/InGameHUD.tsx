import React from 'react';
import {
  CameraMode,
  AutomaticGear,
  ManualGear,
  LevelConfig,
  ParkingEvaluation,
  SteeringMode,
  TransmissionMode,
} from '../types/game';
import { SteeringWheel } from './SteeringWheel';
import {
  Camera,
  Pause,
  AlertTriangle,
  Lightbulb,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Flame,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface InGameHUDProps {
  level: LevelConfig;
  carState: {
    speedKmh: number;
    rpm: number;
    currentGear: string;
    damagePct: number;
    engineStarted: boolean;
    seatBeltBuckled: boolean;
    handbrake: boolean;
    isBraking: boolean;
    isReversing: boolean;
  };
  parkingEval: ParkingEvaluation;
  elapsedTime: number;
  coins: number;
  cameraMode: CameraMode;
  steeringMode: SteeringMode;
  transmissionMode: TransmissionMode;
  steeringValue: number;
  throttleValue: number;
  brakeValue: number;
  leftBlinker: boolean;
  rightBlinker: boolean;
  hazardLights: boolean;
  headlights: boolean;
  showRearMirror: boolean;
  isMuted: boolean;
  onSteerChange: (val: number) => void;
  onThrottleChange: (val: number) => void;
  onBrakeChange: (val: number) => void;
  onShiftAuto: (gear: AutomaticGear) => void;
  onShiftManualUp: () => void;
  onShiftManualDown: () => void;
  onToggleEngine: () => void;
  onToggleSeatbelt: () => void;
  onToggleHandbrake: () => void;
  onToggleLeftBlinker: () => void;
  onToggleRightBlinker: () => void;
  onToggleHazards: () => void;
  onToggleHeadlights: () => void;
  onCycleCamera: () => void;
  onToggleRearMirror: () => void;
  onToggleMute: () => void;
  onPause: () => void;
}

export const InGameHUD: React.FC<InGameHUDProps> = ({
  level,
  carState,
  parkingEval,
  elapsedTime,
  coins,
  cameraMode,
  steeringMode,
  transmissionMode,
  steeringValue,
  throttleValue,
  brakeValue,
  leftBlinker,
  rightBlinker,
  hazardLights,
  headlights,
  showRearMirror,
  isMuted,
  onSteerChange,
  onThrottleChange,
  onBrakeChange,
  onShiftAuto,
  onShiftManualUp,
  onShiftManualDown,
  onToggleEngine,
  onToggleSeatbelt,
  onToggleHandbrake,
  onToggleLeftBlinker,
  onToggleRightBlinker,
  onToggleHazards,
  onToggleHeadlights,
  onCycleCamera,
  onToggleRearMirror,
  onToggleMute,
  onPause,
}) => {
  // Format seconds to mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Damage color calculation
  const getDamageColor = (pct: number) => {
    if (pct > 65) return 'text-emerald-400 bg-emerald-500';
    if (pct > 30) return 'text-amber-400 bg-amber-500';
    return 'text-rose-500 bg-rose-500';
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 select-none z-10 font-sans">
      {/* 1. TOP STATUS BAR */}
      <div className="flex items-start justify-between gap-3 pointer-events-auto">
        {/* Left: Level Info & Objective */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/60 rounded-xl px-4 py-2.5 shadow-lg flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Level {level.id}
            </span>
            <span className="text-slate-400 text-xs">·</span>
            <span className="text-xs text-slate-300 font-medium">{level.environmentName}</span>
          </div>
          <h2 className="text-sm md:text-base font-semibold text-white tracking-tight">{level.name}</h2>
          <div className="flex items-center gap-3 text-xs text-slate-300 font-mono mt-0.5">
            <span>Time: {formatTime(elapsedTime)}</span>
            <span>·</span>
            <span>Par: {formatTime(level.parTime)}</span>
          </div>
        </div>

        {/* Top-Center: Digital Rearview Mirror (if active) */}
        {showRearMirror && (
          <div className="hidden sm:flex flex-col items-center bg-slate-950/90 border-2 border-slate-700 rounded-xl px-4 py-1.5 shadow-2xl">
            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono uppercase tracking-widest border-b border-slate-800 pb-0.5 w-full justify-between">
              <span>◄ REARVIEW MIRROR</span>
              <span className={carState.isReversing ? 'text-amber-400 font-bold animate-pulse' : 'text-slate-500'}>
                {carState.isReversing ? 'R CAMERA ACTIVE' : 'WIDE FIELD'}
              </span>
              <span>►</span>
            </div>
            {/* Mirror perspective visualization */}
            <div className="w-48 h-12 bg-slate-900 rounded mt-1 flex items-center justify-center relative overflow-hidden border border-slate-800">
              <div className="absolute inset-0 flex items-center justify-around opacity-30">
                <div className="w-0.5 h-full bg-emerald-500" />
                <div className="w-0.5 h-full bg-amber-500" />
                <div className="w-0.5 h-full bg-rose-500" />
              </div>
              <span className="text-[11px] text-slate-300 font-mono z-10">
                {carState.isReversing ? '◄ REVERSING ZONE CLEAR ►' : 'Rear Clearance: Safe'}
              </span>
            </div>
          </div>
        )}

        {/* Right: Coins, Damage Meter, Camera, Sound, Pause */}
        <div className="flex items-center gap-2">
          {/* Damage Meter */}
          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/60 rounded-xl px-3 py-1.5 flex flex-col gap-1 items-end">
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-300">Hull:</span>
              <span className={`font-bold ${getDamageColor(carState.damagePct).split(' ')[0]}`}>
                {Math.round(carState.damagePct)}%
              </span>
            </div>
            <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${getDamageColor(carState.damagePct).split(' ')[1]}`}
                style={{ width: `${carState.damagePct}%` }}
              />
            </div>
          </div>

          {/* Coin Badge */}
          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/60 rounded-xl px-3 py-2 flex items-center gap-1.5 text-amber-400 font-bold text-xs md:text-sm font-mono">
            <span>🪙</span>
            <span>{coins.toLocaleString()}</span>
          </div>

          {/* Camera View Switcher */}
          <button
            onClick={onCycleCamera}
            title="Switch Camera View (C)"
            className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700/60 transition-colors shadow-lg active:scale-95 flex items-center gap-1.5"
          >
            <Camera className="w-4 h-4 text-cyan-400" />
            <span className="text-[11px] font-mono uppercase hidden md:inline">{cameraMode}</span>
          </button>

          {/* Sound Mute */}
          <button
            onClick={onToggleMute}
            className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60 transition-colors shadow-lg active:scale-95"
            title="Toggle Audio"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Pause */}
          <button
            onClick={onPause}
            title="Pause Game (Esc)"
            className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700/60 transition-colors shadow-lg active:scale-95"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. DYNAMIC PARKING GUIDANCE HUD (Center-Top) */}
      <div className="flex flex-col items-center justify-center my-auto pointer-events-none">
        <div
          className={`transition-all duration-200 px-5 py-2 rounded-xl backdrop-blur-md border shadow-2xl flex flex-col items-center gap-1 text-center max-w-sm ${
            parkingEval.canComplete
              ? 'bg-emerald-950/90 border-emerald-500 text-emerald-200'
              : parkingEval.inZone
              ? 'bg-amber-950/80 border-amber-500 text-amber-200'
              : 'bg-slate-900/75 border-slate-700/80 text-slate-200'
          }`}
        >
          <div className="flex items-center gap-3 text-xs font-mono">
            <span>Distance: <strong className="text-white">{parkingEval.distance}m</strong></span>
            <span>·</span>
            <span>Angle: <strong className="text-white">{parkingEval.angleError}°</strong></span>
            <span>·</span>
            <span>Alignment: <strong className={parkingEval.accuracy > 85 ? 'text-emerald-400' : 'text-amber-400'}>{parkingEval.accuracy}%</strong></span>
          </div>

          <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden mt-0.5">
            <div
              className={`h-full transition-all duration-150 ${
                parkingEval.accuracy > 85 ? 'bg-emerald-400' : parkingEval.accuracy > 50 ? 'bg-amber-400' : 'bg-slate-500'
              }`}
              style={{ width: `${parkingEval.accuracy}%` }}
            />
          </div>

          <span className="text-xs md:text-sm font-semibold tracking-wide mt-0.5">
            {parkingEval.statusText}
          </span>
        </div>
      </div>

      {/* 3. COCKPIT INSTRUMENTS & VEHICLE CONTROLS BAR (Bottom) */}
      <div className="flex items-end justify-between gap-2 md:gap-4 pointer-events-auto">
        {/* LEFT COLUMN: Steering Wheel / Left-Right Arrows */}
        <div className="flex flex-col items-center gap-2">
          {steeringMode === 'wheel' ? (
            <SteeringWheel steerValue={steeringValue} onChange={onSteerChange} />
          ) : (
            <div className="flex items-center gap-2">
              <button
                onPointerDown={() => onSteerChange(-1)}
                onPointerUp={() => onSteerChange(0)}
                onPointerLeave={() => onSteerChange(0)}
                className="w-16 h-16 rounded-2xl bg-slate-900/90 active:bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-white shadow-xl active:scale-95"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button
                onPointerDown={() => onSteerChange(1)}
                onPointerUp={() => onSteerChange(0)}
                onPointerLeave={() => onSteerChange(0)}
                className="w-16 h-16 rounded-2xl bg-slate-900/90 active:bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-white shadow-xl active:scale-95"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </div>
          )}

          {/* Turn Signal Controls & Hazards */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-lg p-1">
            <button
              onClick={onToggleLeftBlinker}
              className={`p-1.5 rounded transition-all ${leftBlinker ? 'bg-amber-500 text-slate-950 animate-pulse' : 'text-slate-400 hover:text-white'}`}
              title="Left Turn Signal (Q)"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={onToggleHazards}
              className={`p-1.5 rounded transition-all ${hazardLights ? 'bg-rose-600 text-white animate-pulse' : 'text-slate-400 hover:text-white'}`}
              title="Hazard Lights (H)"
            >
              <AlertTriangle className="w-4 h-4" />
            </button>
            <button
              onClick={onToggleRightBlinker}
              className={`p-1.5 rounded transition-all ${rightBlinker ? 'bg-amber-500 text-slate-950 animate-pulse' : 'text-slate-400 hover:text-white'}`}
              title="Right Turn Signal (E)"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* CENTER COLUMN: Digital Dashboard Instrument Cluster */}
        <div className="flex flex-col items-center gap-2 max-w-sm">
          {/* Dashboard Cluster */}
          <div className="bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-2xl px-5 py-2.5 shadow-2xl flex items-center gap-5">
            {/* Speedometer */}
            <div className="flex flex-col items-center">
              <span className="text-3xl md:text-4xl font-extrabold text-white font-mono tracking-tighter">
                {Math.round(carState.speedKmh)}
              </span>
              <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">KM / H</span>
            </div>

            {/* Gear Indicator */}
            <div className="flex flex-col items-center justify-center border-x border-slate-800 px-4">
              <span className="text-[10px] text-slate-400 font-mono uppercase">Gear</span>
              <span className="text-2xl font-bold font-mono text-amber-400">
                {carState.currentGear}
              </span>
            </div>

            {/* RPM Gauge */}
            <div className="flex flex-col items-center">
              <span className="text-xl md:text-2xl font-bold text-slate-200 font-mono tracking-tight">
                {Math.round(carState.rpm)}
              </span>
              <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">RPM</span>
            </div>
          </div>

          {/* Interactive Vehicle Switch Panel (Engine Start, Seatbelt, Lights, Handbrake) */}
          <div className="flex items-center gap-2">
            {/* ENGINE START / STOP BUTTON */}
            <button
              onClick={onToggleEngine}
              className={`px-3 py-2 rounded-xl text-xs font-bold font-mono tracking-wider transition-all shadow-lg active:scale-95 flex items-center gap-1.5 border ${
                carState.engineStarted
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400'
                  : 'bg-rose-900/80 hover:bg-rose-800 text-rose-200 border-rose-500 animate-pulse'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>{carState.engineStarted ? 'ENGINE ON' : 'START'}</span>
            </button>

            {/* SEATBELT TOGGLE */}
            <button
              onClick={onToggleSeatbelt}
              className={`p-2 rounded-xl text-xs font-mono transition-all border ${
                carState.seatBeltBuckled
                  ? 'bg-slate-800 text-emerald-400 border-emerald-500/50'
                  : 'bg-rose-950 text-rose-400 border-rose-500 animate-pulse'
              }`}
              title="Seat Belt (B)"
            >
              <span className="font-bold">{carState.seatBeltBuckled ? 'BELTED' : 'BUCKLE'}</span>
            </button>

            {/* HEADLIGHTS */}
            <button
              onClick={onToggleHeadlights}
              className={`p-2 rounded-xl transition-all border ${
                headlights
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-400'
                  : 'bg-slate-900 text-slate-400 border-slate-700'
              }`}
              title="Headlights (L)"
            >
              <Lightbulb className="w-4 h-4" />
            </button>

            {/* HANDBRAKE TOGGLE */}
            <button
              onClick={onToggleHandbrake}
              className={`px-3 py-2 rounded-xl text-xs font-bold font-mono transition-all border ${
                carState.handbrake
                  ? 'bg-rose-600 text-white border-rose-400'
                  : 'bg-slate-900 text-slate-400 border-slate-700'
              }`}
              title="Handbrake (Space)"
            >
              <span>(P) BRAKE</span>
            </button>
          </div>

          {/* Automatic / Manual Gear Shifter Selection */}
          {transmissionMode === 'automatic' ? (
            <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 p-1 rounded-xl">
              {(['P', 'R', 'N', 'D'] as AutomaticGear[]).map((gear) => (
                <button
                  key={gear}
                  onClick={() => onShiftAuto(gear)}
                  className={`w-9 h-8 rounded-lg font-mono font-bold text-xs transition-colors ${
                    carState.currentGear === gear
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {gear}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl">
              <button
                onClick={onShiftManualDown}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs font-bold"
              >
                ▼ DOWN
              </button>
              <span className="text-amber-400 font-mono font-bold text-sm px-2">
                {carState.currentGear}
              </span>
              <button
                onClick={onShiftManualUp}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs font-bold"
              >
                ▲ UP
              </button>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Pedals (Brake & Accelerator) */}
        <div className="flex items-end gap-3">
          {/* Brake Pedal */}
          <button
            onPointerDown={() => onBrakeChange(1)}
            onPointerUp={() => onBrakeChange(0)}
            onPointerLeave={() => onBrakeChange(0)}
            className={`w-16 h-24 md:w-20 md:h-28 rounded-2xl border-2 flex flex-col items-center justify-center transition-all shadow-2xl active:scale-95 ${
              brakeValue > 0.1
                ? 'bg-rose-700 border-rose-400 text-white shadow-rose-900/50'
                : 'bg-slate-900/90 border-slate-700 text-slate-300'
            }`}
          >
            <span className="text-xs font-mono font-bold">BRAKE</span>
            <div className="w-10 h-2 bg-slate-700/60 rounded-full mt-2" />
            <div className="w-10 h-2 bg-slate-700/60 rounded-full mt-1" />
          </button>

          {/* Accelerator Pedal */}
          <button
            onPointerDown={() => onThrottleChange(1)}
            onPointerUp={() => onThrottleChange(0)}
            onPointerLeave={() => onThrottleChange(0)}
            className={`w-14 h-32 md:w-16 md:h-36 rounded-2xl border-2 flex flex-col items-center justify-center transition-all shadow-2xl active:scale-95 ${
              throttleValue > 0.1
                ? 'bg-emerald-600 border-emerald-400 text-white shadow-emerald-900/50'
                : 'bg-slate-900/90 border-slate-700 text-slate-300'
            }`}
          >
            <span className="text-xs font-mono font-bold">GAS</span>
            <div className="w-8 h-2 bg-slate-700/60 rounded-full mt-3" />
            <div className="w-8 h-2 bg-slate-700/60 rounded-full mt-1.5" />
            <div className="w-8 h-2 bg-slate-700/60 rounded-full mt-1.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
