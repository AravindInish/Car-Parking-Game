import { PlayerProfile, VehicleId, VehicleUpgrades, VehicleCustomization } from '../types/game';
import { DEFAULT_CUSTOMIZATIONS, DEFAULT_UPGRADES } from './VehicleData';

const SAVE_KEY = 'ultimate_parking_sim_save_v1';

const INITIAL_PROFILE: PlayerProfile = {
  coins: 500, // Starting bonus
  selectedVehicle: 'hatchback',
  ownedVehicles: ['hatchback'],
  upgrades: {
    hatchback: { ...DEFAULT_UPGRADES },
    sedan: { ...DEFAULT_UPGRADES },
    sport: { ...DEFAULT_UPGRADES },
    suv: { ...DEFAULT_UPGRADES },
  },
  customizations: {
    hatchback: { ...DEFAULT_CUSTOMIZATIONS.hatchback },
    sedan: { ...DEFAULT_CUSTOMIZATIONS.sedan },
    sport: { ...DEFAULT_CUSTOMIZATIONS.sport },
    suv: { ...DEFAULT_CUSTOMIZATIONS.suv },
  },
  levelProgress: {
    1: {
      unlocked: true,
      completed: false,
      stars: 0,
      bestTime: 0,
      bestAccuracy: 0,
      bestScore: 0,
    },
  },
  settings: {
    steeringMode: 'wheel',
    transmissionMode: 'automatic',
    steeringSensitivity: 1.0,
    tiltSensitivity: 1.0,
    soundVolume: 0.8,
    engineVolume: 0.7,
    graphicsQuality: 'high',
    rearMirrorEnabled: true,
  },
};

export class SaveManager {
  public static load(): PlayerProfile {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return { ...INITIAL_PROFILE };
      const parsed = JSON.parse(raw);
      // Merge with default schema in case of missing keys
      return {
        ...INITIAL_PROFILE,
        ...parsed,
        upgrades: { ...INITIAL_PROFILE.upgrades, ...(parsed.upgrades || {}) },
        customizations: { ...INITIAL_PROFILE.customizations, ...(parsed.customizations || {}) },
        levelProgress: { ...INITIAL_PROFILE.levelProgress, ...(parsed.levelProgress || {}) },
        settings: { ...INITIAL_PROFILE.settings, ...(parsed.settings || {}) },
      };
    } catch (e) {
      console.warn('Failed to load save from localStorage', e);
      return { ...INITIAL_PROFILE };
    }
  }

  public static save(profile: PlayerProfile): void {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(profile));
    } catch (e) {
      console.warn('Failed to save to localStorage', e);
    }
  }

  public static unlockNextLevel(profile: PlayerProfile, currentLevel: number): PlayerProfile {
    const nextLevel = currentLevel + 1;
    if (nextLevel <= 100) {
      const existing = profile.levelProgress[nextLevel] || {
        unlocked: false,
        completed: false,
        stars: 0,
        bestTime: 0,
        bestAccuracy: 0,
        bestScore: 0,
      };
      profile.levelProgress[nextLevel] = {
        ...existing,
        unlocked: true,
      };
      this.save(profile);
    }
    return profile;
  }

  public static recordLevelResult(
    profile: PlayerProfile,
    levelId: number,
    stars: number,
    time: number,
    accuracy: number,
    score: number,
    coinsEarned: number
  ): PlayerProfile {
    const existing = profile.levelProgress[levelId] || {
      unlocked: true,
      completed: false,
      stars: 0,
      bestTime: 0,
      bestAccuracy: 0,
      bestScore: 0,
    };

    const isFirstClear = !existing.completed;

    profile.levelProgress[levelId] = {
      unlocked: true,
      completed: true,
      stars: Math.max(existing.stars, stars),
      bestTime: existing.bestTime === 0 ? time : Math.min(existing.bestTime, time),
      bestAccuracy: Math.max(existing.bestAccuracy, accuracy),
      bestScore: Math.max(existing.bestScore, score),
    };

    profile.coins += coinsEarned;
    this.unlockNextLevel(profile, levelId);
    this.save(profile);
    return profile;
  }
}
