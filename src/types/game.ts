export type VehicleId = 'hatchback' | 'sedan' | 'sport' | 'suv';

export type TransmissionMode = 'automatic' | 'manual';
export type SteeringMode = 'wheel' | 'arrows' | 'tilt';
export type CameraMode = 'chase' | 'bumper' | 'cockpit' | 'rear' | 'topdown';

export type AutomaticGear = 'P' | 'R' | 'N' | 'D';
export type ManualGear = 'R' | 'N' | '1' | '2' | '3' | '4';

export interface VehicleSpecs {
  name: string;
  category: string;
  price: number;
  description: string;
  mass: number; // kg
  maxSpeed: number; // km/h
  acceleration: number; // m/s^2
  brakingPower: number;
  steeringSensitivity: number;
  turningRadius: number;
  reverseSpeed: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
    wheelBase: number;
  };
}

export interface VehicleUpgrades {
  engine: number; // 0-5
  brakes: number; // 0-5
  steering: number; // 0-5
  suspension: number; // 0-5
  tires: number; // 0-5
  transmission: number; // 0-5
  durability: number; // 0-5
}

export type PaintFinish = 'gloss' | 'metallic' | 'matte';
export type WheelDesign = 'sport' | 'turbofan' | 'mesh' | 'classic';
export type HeadlightTint = 'xenon' | 'amber' | 'cyan' | 'pure';

export interface VehicleCustomization {
  color: string;
  finish: PaintFinish;
  wheelDesign: WheelDesign;
  wheelColor: string;
  licensePlate: string;
  headlightTint: HeadlightTint;
}

export type EnvironmentTheme =
  | 'training'
  | 'mall'
  | 'multistorey'
  | 'city'
  | 'office'
  | 'airport'
  | 'residential'
  | 'underground'
  | 'industrial'
  | 'arena';

export interface ObstacleDef {
  type: 'cone' | 'barrier' | 'pillar' | 'car' | 'lamp' | 'fence' | 'planter' | 'dumpster';
  position: [number, number, number]; // x, y, z
  rotation?: number; // Y rotation in radians
  scale?: [number, number, number];
  color?: string;
}

export interface MovingVehicleDef {
  route: [number, number, number][]; // waypoints
  speed: number;
  color?: string;
  dimensions: [number, number, number];
}

export interface LevelConfig {
  id: number;
  name: string;
  environment: EnvironmentTheme;
  environmentName: string;
  description: string;
  startPosition: [number, number, number];
  startRotation: number; // Y rotation
  targetPosition: [number, number, number];
  targetRotation: number;
  targetSize: [number, number]; // width (X), length (Z)
  obstacles: ObstacleDef[];
  movingObstacles?: MovingVehicleDef[];
  parTime: number; // seconds
  rewardCoins: number;
  isRamp?: boolean;
  timeOfDay?: 'day' | 'sunset' | 'night';
  weather?: 'clear' | 'rain';
}

export interface LevelProgress {
  unlocked: boolean;
  completed: boolean;
  stars: number; // 0-3
  bestTime: number; // seconds
  bestAccuracy: number; // %
  bestScore: number;
}

export interface PlayerProfile {
  coins: number;
  selectedVehicle: VehicleId;
  ownedVehicles: VehicleId[];
  upgrades: Record<VehicleId, VehicleUpgrades>;
  customizations: Record<VehicleId, VehicleCustomization>;
  levelProgress: Record<number, LevelProgress>;
  settings: {
    steeringMode: SteeringMode;
    transmissionMode: TransmissionMode;
    steeringSensitivity: number; // 0.5 - 2.0
    tiltSensitivity: number; // 0.5 - 2.0
    soundVolume: number; // 0 - 1
    engineVolume: number; // 0 - 1
    graphicsQuality: 'high' | 'medium' | 'low';
    rearMirrorEnabled: boolean;
  };
}

export interface ParkingEvaluation {
  inZone: boolean;
  distance: number;
  angleError: number; // degrees
  accuracy: number; // 0 - 100%
  speed: number;
  isStationary: number; // seconds held stationary in correct spot
  statusText: string;
  canComplete: boolean;
}
