import React, { useState, useEffect } from 'react';
import { PlayerProfile, LevelConfig } from './types/game';
import { SaveManager } from './engine/SaveManager';
import { ALL_LEVELS } from './engine/LevelData';
import { MainMenu } from './components/MainMenu';
import { GameScene } from './components/GameScene';
import { ShowroomView } from './components/ShowroomView';
import { LevelSelectModal } from './components/LevelSelectModal';
import { PauseModal } from './components/PauseModal';
import { VictoryModal } from './components/VictoryModal';
import { DefeatModal } from './components/DefeatModal';
import { SettingsModal } from './components/SettingsModal';
import { HighScoresModal } from './components/HighScoresModal';
import { SoundEffects } from './audio/SoundEffects';

type ScreenState = 'menu' | 'playing' | 'showroom';

export default function App() {
  const [profile, setProfile] = useState<PlayerProfile>(() => SaveManager.load());
  const [screen, setScreen] = useState<ScreenState>('menu');
  const [currentLevelId, setCurrentLevelId] = useState<number>(1);
  const [attemptId, setAttemptId] = useState<number>(1);

  // Modals state
  const [showLevelSelect, setShowLevelSelect] = useState<boolean>(false);
  const [showPauseModal, setShowPauseModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showHighScoresModal, setShowHighScoresModal] = useState<boolean>(false);

  // Level End Results state
  const [victoryData, setVictoryData] = useState<{
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
  } | null>(null);

  const [defeatData, setDefeatData] = useState<{
    levelId: number;
    reason: 'wrecked' | 'timeout';
  } | null>(null);

  // Initialize sound volumes from loaded profile
  useEffect(() => {
    SoundEffects.setVolumes(profile.settings.soundVolume, profile.settings.engineVolume);
  }, []);

  // Save profile helper
  const handleUpdateProfile = (newProfile: PlayerProfile) => {
    setProfile(newProfile);
    SaveManager.save(newProfile);
  };

  const handleStartLevel = (levelId: number) => {
    setCurrentLevelId(levelId);
    setAttemptId((prev) => prev + 1);
    setShowLevelSelect(false);
    setShowPauseModal(false);
    setVictoryData(null);
    setDefeatData(null);
    setScreen('playing');
  };

  const handleContinue = () => {
    // Find latest unlocked level
    let targetLevel = 1;
    for (let i = 1; i <= 100; i++) {
      if (profile.levelProgress[i]?.unlocked) {
        targetLevel = i;
      }
    }
    handleStartLevel(targetLevel);
  };

  const handleLevelComplete = (
    stars: number,
    time: number,
    accuracy: number,
    damageRemaining: number,
    coinsEarned: {
      base: number;
      accuracyBonus: number;
      timeBonus: number;
      damagePenalty: number;
      total: number;
    }
  ) => {
    const currentLevel = ALL_LEVELS.find((l) => l.id === currentLevelId) || ALL_LEVELS[0];

    // Persist completion and coins
    const updatedProfile = SaveManager.recordLevelResult(
      profile,
      currentLevelId,
      stars,
      time,
      accuracy,
      Math.round(accuracy * 10 - time * 2),
      coinsEarned.total
    );
    setProfile(updatedProfile);

    // Show victory modal
    setVictoryData({
      levelId: currentLevelId,
      levelName: currentLevel.name,
      timeTaken: time,
      accuracy,
      damageRemaining,
      coinsEarned,
      stars,
    });
  };

  const handleLevelFail = (reason: 'wrecked' | 'timeout') => {
    setDefeatData({
      levelId: currentLevelId,
      reason,
    });
  };

  const currentLevelConfig = ALL_LEVELS.find((l) => l.id === currentLevelId) || ALL_LEVELS[0];

  return (
    <div className="w-full h-screen bg-slate-950 overflow-hidden font-sans select-none text-slate-100">
      {/* SCREEN 1: MAIN MENU */}
      {screen === 'menu' && (
        <MainMenu
          profile={profile}
          onContinue={handleContinue}
          onOpenLevelSelect={() => setShowLevelSelect(true)}
          onOpenShowroom={() => setScreen('showroom')}
          onOpenHighScores={() => setShowHighScoresModal(true)}
          onOpenSettings={() => setShowSettingsModal(true)}
        />
      )}

      {/* SCREEN 2: 3D SHOWROOM & UPGRADES */}
      {screen === 'showroom' && (
        <ShowroomView
          profile={profile}
          onUpdateProfile={handleUpdateProfile}
          onBackToMenu={() => setScreen('menu')}
        />
      )}

      {/* SCREEN 3: 3D PLAYING GAMEPLAY */}
      {screen === 'playing' && (
        <GameScene
          key={`level_${currentLevelId}_attempt_${attemptId}_car_${profile.selectedVehicle}`}
          level={currentLevelConfig}
          profile={profile}
          onLevelComplete={handleLevelComplete}
          onLevelFail={handleLevelFail}
          onPause={() => setShowPauseModal(true)}
        />
      )}

      {/* MODALS */}
      {showLevelSelect && (
        <LevelSelectModal
          profile={profile}
          onSelectLevel={handleStartLevel}
          onClose={() => setShowLevelSelect(false)}
        />
      )}

      {showPauseModal && (
        <PauseModal
          onResume={() => setShowPauseModal(false)}
          onRestart={() => handleStartLevel(currentLevelId)}
          onOpenSettings={() => setShowSettingsModal(true)}
          onMainMenu={() => {
            setShowPauseModal(false);
            setScreen('menu');
          }}
        />
      )}

      {showSettingsModal && (
        <SettingsModal
          settings={profile.settings}
          onUpdateSettings={(newSettings) => {
            handleUpdateProfile({
              ...profile,
              settings: newSettings,
            });
          }}
          onClose={() => setShowSettingsModal(false)}
        />
      )}

      {showHighScoresModal && (
        <HighScoresModal
          profile={profile}
          onClose={() => setShowHighScoresModal(false)}
        />
      )}

      {victoryData && (
        <VictoryModal
          levelId={victoryData.levelId}
          levelName={victoryData.levelName}
          timeTaken={victoryData.timeTaken}
          accuracy={victoryData.accuracy}
          damageRemaining={victoryData.damageRemaining}
          coinsEarned={victoryData.coinsEarned}
          stars={victoryData.stars}
          onNextLevel={() => handleStartLevel(victoryData.levelId + 1)}
          onReplay={() => handleStartLevel(victoryData.levelId)}
          onGoToGarage={() => {
            setVictoryData(null);
            setScreen('showroom');
          }}
        />
      )}

      {defeatData && (
        <DefeatModal
          levelId={defeatData.levelId}
          reason={defeatData.reason}
          onReplay={() => handleStartLevel(defeatData.levelId)}
          onGoToGarage={() => {
            setDefeatData(null);
            setScreen('showroom');
          }}
          onMainMenu={() => {
            setDefeatData(null);
            setScreen('menu');
          }}
        />
      )}
    </div>
  );
}
