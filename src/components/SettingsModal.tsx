import React from 'react';
import { PlayerProfile, SteeringMode, TransmissionMode } from '../types/game';
import { SoundEffects } from '../audio/SoundEffects';
import { X, Volume2, Gamepad2, Settings2, Sliders } from 'lucide-react';

interface SettingsModalProps {
  settings: PlayerProfile['settings'];
  onUpdateSettings: (newSettings: PlayerProfile['settings']) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
}) => {
  const handleSteeringChange = (mode: SteeringMode) => {
    onUpdateSettings({ ...settings, steeringMode: mode });
    SoundEffects.playClick();
  };

  const handleTransmissionChange = (mode: TransmissionMode) => {
    onUpdateSettings({ ...settings, transmissionMode: mode });
    SoundEffects.playClick();
  };

  const handleSoundVolume = (val: number) => {
    const updated = { ...settings, soundVolume: val };
    onUpdateSettings(updated);
    SoundEffects.setVolumes(val, settings.engineVolume);
  };

  const handleEngineVolume = (val: number) => {
    const updated = { ...settings, engineVolume: val };
    onUpdateSettings(updated);
    SoundEffects.setVolumes(settings.soundVolume, val);
  };

  const handleSensitivity = (val: number) => {
    onUpdateSettings({ ...settings, steeringSensitivity: val });
  };

  const handleMirrorToggle = () => {
    onUpdateSettings({ ...settings, rearMirrorEnabled: !settings.rearMirrorEnabled });
    SoundEffects.playClick();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-amber-400" />
            <span>Game Settings</span>
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col gap-4 text-xs">
          {/* Steering Mode */}
          <div className="flex flex-col gap-1.5">
            <span className="font-semibold text-slate-300">Steering Method:</span>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'wheel', label: 'Virtual Wheel' },
                { id: 'arrows', label: 'Arrow Buttons' },
                { id: 'tilt', label: 'Tilt Sensor' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleSteeringChange(opt.id as SteeringMode)}
                  className={`py-2 px-2.5 rounded-xl text-center font-medium transition-all ${
                    settings.steeringMode === opt.id
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {settings.steeringMode === 'tilt' && (
              <span className="text-[11px] text-amber-400/90 italic">
                Tilt mode uses device accelerometer on mobile tablets/phones.
              </span>
            )}
          </div>

          {/* Transmission Mode */}
          <div className="flex flex-col gap-1.5">
            <span className="font-semibold text-slate-300">Transmission Mode:</span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'automatic', label: 'Automatic (P-R-N-D)' },
                { id: 'manual', label: 'Manual (1-4, N, R)' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleTransmissionChange(opt.id as TransmissionMode)}
                  className={`py-2 px-3 rounded-xl text-center font-medium transition-all ${
                    settings.transmissionMode === opt.id
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Steering Sensitivity Slider */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-slate-300">
              <span>Steering Sensitivity:</span>
              <span className="font-mono font-bold text-amber-400">
                {settings.steeringSensitivity.toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={settings.steeringSensitivity}
              onChange={(e) => handleSensitivity(parseFloat(e.target.value))}
              className="w-full accent-amber-500 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Master Sound Volume */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-slate-300">
              <span>Sound Effects Volume:</span>
              <span className="font-mono font-bold text-amber-400">
                {Math.round(settings.soundVolume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.soundVolume}
              onChange={(e) => handleSoundVolume(parseFloat(e.target.value))}
              className="w-full accent-amber-500 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Engine Audio Volume */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-slate-300">
              <span>Engine Rumble Volume:</span>
              <span className="font-mono font-bold text-amber-400">
                {Math.round(settings.engineVolume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.engineVolume}
              onChange={(e) => handleEngineVolume(parseFloat(e.target.value))}
              className="w-full accent-amber-500 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Rearview Mirror Toggle */}
          <div className="flex items-center justify-between py-1 border-t border-slate-800 pt-2">
            <div>
              <span className="font-semibold text-slate-300 block">Digital Rearview Mirror:</span>
              <span className="text-[11px] text-slate-400">Display top-mounted reversing perspective</span>
            </div>
            <button
              onClick={handleMirrorToggle}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                settings.rearMirrorEnabled ? 'bg-amber-500' : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.rearMirrorEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider mt-2 shadow-lg"
        >
          Save & Return
        </button>
      </div>
    </div>
  );
};
