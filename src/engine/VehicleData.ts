import { VehicleId, VehicleSpecs, VehicleCustomization, VehicleUpgrades } from '../types/game';

export const VEHICLE_CONFIGS: Record<VehicleId, VehicleSpecs> = {
  hatchback: {
    name: 'Compact Hatchback',
    category: 'Starter City Car',
    price: 0,
    description: 'Agile and compact with an ultra-tight turning radius. Ideal for beginners mastering parking basics.',
    mass: 1100,
    maxSpeed: 45, // km/h (calibrated for parking simulator)
    acceleration: 4.2,
    brakingPower: 8.5,
    steeringSensitivity: 1.25,
    turningRadius: 4.8,
    reverseSpeed: 22,
    dimensions: {
      length: 3.6,
      width: 1.65,
      height: 1.45,
      wheelBase: 2.3,
    },
  },
  sedan: {
    name: 'Executive Sedan',
    category: 'Premium Sedan',
    price: 2000,
    description: 'Smooth suspension and balanced handling. The gold standard for everyday parking confidence.',
    mass: 1550,
    maxSpeed: 55,
    acceleration: 5.4,
    brakingPower: 9.8,
    steeringSensitivity: 1.1,
    turningRadius: 5.6,
    reverseSpeed: 26,
    dimensions: {
      length: 4.6,
      width: 1.82,
      height: 1.45,
      wheelBase: 2.75,
    },
  },
  sport: {
    name: 'GT Coupe V8',
    category: 'High Performance Sports Car',
    price: 5000,
    description: 'Blistering acceleration, aerodynamic wide stance, and ultra-sharp steering for skilled parking masters.',
    mass: 1380,
    maxSpeed: 70,
    acceleration: 7.2,
    brakingPower: 12.0,
    steeringSensitivity: 1.35,
    turningRadius: 5.9,
    reverseSpeed: 32,
    dimensions: {
      length: 4.5,
      width: 1.95,
      height: 1.28,
      wheelBase: 2.65,
    },
  },
  suv: {
    name: 'Apex Grand SUV',
    category: 'Luxury All-Terrain SUV',
    price: 8000,
    description: 'Commanding high driving position, heavy mass, and wide profile. Demands precision in tight garages.',
    mass: 2350,
    maxSpeed: 52,
    acceleration: 5.0,
    brakingPower: 11.2,
    steeringSensitivity: 0.95,
    turningRadius: 6.5,
    reverseSpeed: 24,
    dimensions: {
      length: 4.95,
      width: 2.05,
      height: 1.85,
      wheelBase: 2.95,
    },
  },
};

export const DEFAULT_CUSTOMIZATIONS: Record<VehicleId, VehicleCustomization> = {
  hatchback: {
    color: '#0284c7', // Sky Blue
    finish: 'gloss',
    wheelDesign: 'classic',
    wheelColor: '#94a3b8',
    licensePlate: 'PRK-101',
    headlightTint: 'pure',
  },
  sedan: {
    color: '#1e293b', // Midnight Obsidian
    finish: 'metallic',
    wheelDesign: 'sport',
    wheelColor: '#cbd5e1',
    licensePlate: 'LUX-888',
    headlightTint: 'xenon',
  },
  sport: {
    color: '#dc2626', // Rosso Racing Red
    finish: 'metallic',
    wheelDesign: 'turbofan',
    wheelColor: '#0f172a',
    licensePlate: 'V8-DRIFT',
    headlightTint: 'cyan',
  },
  suv: {
    color: '#15803d', // British Racing Green / Emerald
    finish: 'gloss',
    wheelDesign: 'mesh',
    wheelColor: '#64748b',
    licensePlate: 'APEX-4X4',
    headlightTint: 'amber',
  },
};

export const DEFAULT_UPGRADES: VehicleUpgrades = {
  engine: 0,
  brakes: 0,
  steering: 0,
  suspension: 0,
  tires: 0,
  transmission: 0,
  durability: 0,
};

export interface UpgradeTierInfo {
  name: string;
  description: string;
  icon: string;
  baseCost: number;
  costMultiplier: number;
  statEffect: (tier: number) => string;
}

export const UPGRADE_CATEGORIES: Record<keyof VehicleUpgrades, UpgradeTierInfo> = {
  engine: {
    name: 'Engine Tuning',
    description: 'Increases engine power, responsiveness, and top speed.',
    icon: 'Flame',
    baseCost: 250,
    costMultiplier: 1.6,
    statEffect: (tier) => `+${tier * 12}% Acceleration & Top Speed`,
  },
  brakes: {
    name: 'High-Performance Brakes',
    description: 'Improves stopping power and decreases braking distance.',
    icon: 'Disc',
    baseCost: 200,
    costMultiplier: 1.5,
    statEffect: (tier) => `+${tier * 15}% Stopping Power`,
  },
  steering: {
    name: 'Precision Power Steering',
    description: 'Heightens steering responsiveness and sharpens turning response.',
    icon: 'Compass',
    baseCost: 180,
    costMultiplier: 1.5,
    statEffect: (tier) => `+${tier * 10}% Steering Responsiveness`,
  },
  suspension: {
    name: 'Active Suspension',
    description: 'Reduces body roll and stabilizes pitch during sudden stops and ramps.',
    icon: 'Activity',
    baseCost: 220,
    costMultiplier: 1.55,
    statEffect: (tier) => `+${tier * 14}% Chassis Stability`,
  },
  tires: {
    name: 'High-Grip Radial Tires',
    description: 'Improves traction, reduces wheel slip, and aids low-speed maneuvers.',
    icon: 'CircleDot',
    baseCost: 200,
    costMultiplier: 1.5,
    statEffect: (tier) => `+${tier * 12}% Tire Traction`,
  },
  transmission: {
    name: 'Sport Transmission',
    description: 'Reduces gear change lag and provides smoother power delivery.',
    icon: 'Gauge',
    baseCost: 240,
    costMultiplier: 1.6,
    statEffect: (tier) => `+${tier * 15}% Shift Speed & Reverse Torque`,
  },
  durability: {
    name: 'Reinforced Chassis',
    description: 'Absorbs impacts, drastically reducing collision damage and score penalties.',
    icon: 'Shield',
    baseCost: 300,
    costMultiplier: 1.7,
    statEffect: (tier) => `-${tier * 14}% Collision Damage`,
  },
};

export function getUpgradeCost(category: keyof VehicleUpgrades, currentTier: number): number {
  if (currentTier >= 5) return 0;
  const info = UPGRADE_CATEGORIES[category];
  return Math.round(info.baseCost * Math.pow(info.costMultiplier, currentTier));
}
