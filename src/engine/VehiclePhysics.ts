import * as THREE from 'three';
import {
  VehicleId,
  VehicleSpecs,
  VehicleUpgrades,
  AutomaticGear,
  ManualGear,
  TransmissionMode,
} from '../types/game';
import { VEHICLE_CONFIGS } from './VehicleData';
import { SoundEffects } from '../audio/SoundEffects';

export interface VehiclePhysicsState {
  position: THREE.Vector3;
  rotationY: number;
  speed: number; // m/s (positive = forward, negative = reverse)
  speedKmh: number;
  steeringAngle: number; // radians (-maxSteer to +maxSteer)
  rpm: number; // 800 - 7000
  rpmNormalized: number; // 0 - 1
  currentGear: string;
  damagePct: number; // 100 = brand new, 0 = totaled
  isBraking: boolean;
  isReversing: boolean;
  chassisPitch: number;
  chassisRoll: number;
  engineStarted: boolean;
  seatBeltBuckled: boolean;
  handbrake: boolean;
  collisionsCount: number;
  lastCollisionSeverity: 'none' | 'minor' | 'major';
}

export class VehiclePhysics {
  public state: VehiclePhysicsState;
  public vehicleId: VehicleId;
  public specs: VehicleSpecs;
  public upgrades: VehicleUpgrades;
  public transmissionMode: TransmissionMode;

  public autoGear: AutomaticGear = 'P';
  public manualGear: ManualGear = 'N';

  private maxSteerAngle: number = 0.58; // ~33 degrees
  private wheelBase: number;
  private length: number;
  private width: number;

  constructor(
    vehicleId: VehicleId,
    upgrades: VehicleUpgrades,
    transmissionMode: TransmissionMode,
    startPosition: [number, number, number],
    startRotation: number
  ) {
    this.vehicleId = vehicleId;
    this.specs = VEHICLE_CONFIGS[vehicleId];
    this.upgrades = upgrades;
    this.transmissionMode = transmissionMode;
    this.wheelBase = this.specs.dimensions.wheelBase;
    this.length = this.specs.dimensions.length;
    this.width = this.specs.dimensions.width;

    this.state = {
      position: new THREE.Vector3(startPosition[0], startPosition[1], startPosition[2]),
      rotationY: startRotation,
      speed: 0,
      speedKmh: 0,
      steeringAngle: 0,
      rpm: 800,
      rpmNormalized: 0,
      currentGear: transmissionMode === 'automatic' ? 'P' : 'N',
      damagePct: 100,
      isBraking: false,
      isReversing: false,
      chassisPitch: 0,
      chassisRoll: 0,
      engineStarted: false,
      seatBeltBuckled: false,
      handbrake: true, // Handbrake on initially
      collisionsCount: 0,
      lastCollisionSeverity: 'none',
    };
  }

  public setTransmissionMode(mode: TransmissionMode) {
    this.transmissionMode = mode;
    if (mode === 'automatic') {
      this.autoGear = 'P';
      this.state.currentGear = 'P';
    } else {
      this.manualGear = 'N';
      this.state.currentGear = 'N';
    }
  }

  public shiftAuto(gear: AutomaticGear) {
    // Cannot shift into P or R if moving forward fast
    if ((gear === 'P' || gear === 'R') && this.state.speed > 2.0) {
      return false;
    }
    this.autoGear = gear;
    this.state.currentGear = gear;
    SoundEffects.playGearShift();
    if (gear === 'P') {
      this.state.handbrake = true;
    }
    return true;
  }

  public shiftManualUp() {
    if (this.transmissionMode !== 'manual') return;
    const gears: ManualGear[] = ['R', 'N', '1', '2', '3', '4'];
    const idx = gears.indexOf(this.manualGear);
    if (idx < gears.length - 1) {
      this.manualGear = gears[idx + 1];
      this.state.currentGear = this.manualGear;
      SoundEffects.playGearShift();
    }
  }

  public shiftManualDown() {
    if (this.transmissionMode !== 'manual') return;
    const gears: ManualGear[] = ['R', 'N', '1', '2', '3', '4'];
    const idx = gears.indexOf(this.manualGear);
    if (idx > 0) {
      if (gears[idx - 1] === 'R' && this.state.speed > 2.0) return;
      this.manualGear = gears[idx - 1];
      this.state.currentGear = this.manualGear;
      SoundEffects.playGearShift();
    }
  }

  public toggleEngine(): boolean {
    if (this.state.engineStarted) {
      this.state.engineStarted = false;
      SoundEffects.stopEngine();
    } else {
      this.state.engineStarted = true;
      SoundEffects.startEngine();
    }
    return this.state.engineStarted;
  }

  public toggleSeatbelt(): boolean {
    this.state.seatBeltBuckled = !this.state.seatBeltBuckled;
    SoundEffects.playSeatbeltBuckle();
    return this.state.seatBeltBuckled;
  }

  public toggleHandbrake(): boolean {
    this.state.handbrake = !this.state.handbrake;
    SoundEffects.playClick();
    return this.state.handbrake;
  }

  public update(
    dt: number,
    throttleInput: number, // 0 to 1
    brakeInput: number, // 0 to 1
    steerTarget: number, // -1 (left) to +1 (right)
    obstacles: { box: THREE.Box3; type: string; radius: number; center: THREE.Vector3 }[]
  ) {
    if (dt > 0.1) dt = 0.1; // Clamp delta time spike

    // Upgrade modifiers
    const engineMod = 1 + this.upgrades.engine * 0.12;
    const brakeMod = 1 + this.upgrades.brakes * 0.15;
    const steeringMod = 1 + this.upgrades.steering * 0.1;
    const suspensionMod = 1 + this.upgrades.suspension * 0.14;
    const tireMod = 1 + this.upgrades.tires * 0.12;
    const durabilityMod = 1 - this.upgrades.durability * 0.14;

    const maxForwardSpeed = (this.specs.maxSpeed * engineMod) / 3.6; // in m/s
    const maxReverseSpeed = (this.specs.reverseSpeed * (1 + this.upgrades.transmission * 0.15)) / 3.6;
    const baseAccel = this.specs.acceleration * engineMod;
    const baseBrake = this.specs.brakingPower * brakeMod;

    // 1. STEERING CALCULATION
    const currentMaxSteer = (this.maxSteerAngle * this.specs.steeringSensitivity * steeringMod) / (1 + Math.abs(this.state.speed) * 0.08);
    const targetSteerAngle = steerTarget * currentMaxSteer;
    const steerSpeed = 4.5 * steeringMod;

    if (Math.abs(steerTarget) > 0.01) {
      this.state.steeringAngle = THREE.MathUtils.damp(
        this.state.steeringAngle,
        targetSteerAngle,
        steerSpeed,
        dt
      );
    } else {
      // Auto-center steering smoothly
      this.state.steeringAngle = THREE.MathUtils.damp(
        this.state.steeringAngle,
        0,
        5.5 * steeringMod,
        dt
      );
    }

    // Auto-ignite & release handbrake if driver hits throttle
    if (throttleInput > 0.1) {
      if (!this.state.engineStarted) {
        this.toggleEngine();
      }
      if (this.state.handbrake) {
        this.state.handbrake = false;
      }
      if (this.transmissionMode === 'automatic' && this.autoGear === 'P') {
        this.autoGear = 'D';
        this.state.currentGear = 'D';
      }
    }

    // 2. TRANSMISSION & ACCELERATION FORCES
    let accelForce = 0;
    let brakeForce = 0;
    let isReversing = false;

    if (this.state.engineStarted && !this.state.handbrake) {
      if (this.transmissionMode === 'automatic') {
        if (this.autoGear === 'D') {
          accelForce = throttleInput * baseAccel;
          brakeForce = brakeInput * baseBrake;
          isReversing = false;
        } else if (this.autoGear === 'R') {
          accelForce = -throttleInput * baseAccel * 0.75;
          brakeForce = brakeInput * baseBrake;
          isReversing = true;
        } else if (this.autoGear === 'N') {
          accelForce = 0;
          brakeForce = brakeInput * baseBrake;
        } else if (this.autoGear === 'P') {
          accelForce = 0;
          brakeForce = baseBrake * 3;
        }
      } else {
        // Manual transmission
        if (this.manualGear === 'R') {
          accelForce = -throttleInput * baseAccel * 0.75;
          brakeForce = brakeInput * baseBrake;
          isReversing = true;
        } else if (this.manualGear === '1') {
          accelForce = throttleInput * baseAccel * 1.1;
          brakeForce = brakeInput * baseBrake;
        } else if (this.manualGear === '2') {
          accelForce = throttleInput * baseAccel * 0.85;
          brakeForce = brakeInput * baseBrake;
        } else if (this.manualGear === '3') {
          accelForce = throttleInput * baseAccel * 0.65;
          brakeForce = brakeInput * baseBrake;
        } else if (this.manualGear === '4') {
          accelForce = throttleInput * baseAccel * 0.5;
          brakeForce = brakeInput * baseBrake;
        } else {
          accelForce = 0;
          brakeForce = brakeInput * baseBrake;
        }
      }
    } else {
      // Engine off or handbrake on
      if (this.state.handbrake) {
        brakeForce = baseBrake * 3.5;
      }
    }

    this.state.isBraking = brakeInput > 0.1 || this.state.handbrake;
    this.state.isReversing = isReversing || this.state.speed < -0.1;

    // Rolling resistance & natural friction
    const rollingFriction = 0.85 * tireMod;
    const airDrag = 0.05;

    // Apply acceleration
    if (Math.abs(accelForce) > 0.01) {
      this.state.speed += accelForce * dt;
    }

    // Apply braking
    if (brakeForce > 0.01) {
      if (Math.abs(this.state.speed) > 0.05) {
        const brakeDecel = Math.sign(this.state.speed) * brakeForce * dt;
        if (Math.abs(brakeDecel) > Math.abs(this.state.speed)) {
          this.state.speed = 0;
        } else {
          this.state.speed -= brakeDecel;
        }
      } else {
        this.state.speed = 0;
      }
    } else {
      // Natural coasting deceleration
      if (Math.abs(this.state.speed) > 0.02) {
        const frictionDecel = (Math.sign(this.state.speed) * rollingFriction + this.state.speed * airDrag) * dt;
        if (Math.abs(frictionDecel) > Math.abs(this.state.speed)) {
          this.state.speed = 0;
        } else {
          this.state.speed -= frictionDecel;
        }
      } else {
        this.state.speed = 0;
      }
    }

    // Clamp speed limits
    this.state.speed = THREE.MathUtils.clamp(this.state.speed, -maxReverseSpeed, maxForwardSpeed);
    this.state.speedKmh = Math.abs(this.state.speed * 3.6);

    // 3. BICYCLE KINEMATIC MODEL FOR CAR TURNING
    const deltaDistance = this.state.speed * dt;
    if (Math.abs(deltaDistance) > 0.0001) {
      // Steer > 0 (right) turns heading towards screen right (-X)
      const angularVelocity = -(this.state.speed / this.wheelBase) * Math.tan(this.state.steeringAngle);
      this.state.rotationY += angularVelocity * dt;

      // Update position along vehicle heading vector
      // Heading in Three.js where rotationY = 0 points towards +Z
      const forwardX = Math.sin(this.state.rotationY);
      const forwardZ = Math.cos(this.state.rotationY);

      this.state.position.x += forwardX * deltaDistance;
      this.state.position.z += forwardZ * deltaDistance;
    }

    // 4. SUSPENSION PITCH & ROLL SIMULATION
    const targetPitch = THREE.MathUtils.clamp(
      (brakeForce * 0.015 - accelForce * 0.01) / suspensionMod,
      -0.08,
      0.08
    );
    this.state.chassisPitch = THREE.MathUtils.damp(this.state.chassisPitch, targetPitch, 8, dt);

    const lateralG = (this.state.speed * this.state.speed * Math.sin(this.state.steeringAngle)) / (this.wheelBase * 9.8);
    const targetRoll = THREE.MathUtils.clamp((lateralG * 0.08) / suspensionMod, -0.09, 0.09);
    this.state.chassisRoll = THREE.MathUtils.damp(this.state.chassisRoll, targetRoll, 7, dt);

    // 5. RPM SIMULATION
    if (!this.state.engineStarted) {
      this.state.rpm = THREE.MathUtils.damp(this.state.rpm, 0, 8, dt);
    } else {
      let gearRatio = 1.0;
      if (this.transmissionMode === 'automatic') {
        const speedRatio = this.state.speedKmh / this.specs.maxSpeed;
        if (speedRatio < 0.25) gearRatio = 1.0;
        else if (speedRatio < 0.5) gearRatio = 0.7;
        else if (speedRatio < 0.75) gearRatio = 0.5;
        else gearRatio = 0.35;
      }
      const targetRpm = 800 + (this.state.speedKmh * 90 * gearRatio) + (throttleInput * 1800);
      this.state.rpm = THREE.MathUtils.damp(this.state.rpm, THREE.MathUtils.clamp(targetRpm, 800, 6800), 10, dt);
    }
    this.state.rpmNormalized = THREE.MathUtils.clamp((this.state.rpm - 800) / 6000, 0, 1);
    SoundEffects.updateEngineRPM(this.state.rpmNormalized, throttleInput);

    // 6. COLLISION DETECTION (7-Point Precision Hull Check)
    this.state.lastCollisionSeverity = 'none';
    const halfL = this.length * 0.48;
    const halfW = this.width * 0.48;

    const sinY = Math.sin(this.state.rotationY);
    const cosY = Math.cos(this.state.rotationY);
    const leftX = cosY;
    const leftZ = -sinY;

    const probePoints = [
      // Front Center
      new THREE.Vector3(this.state.position.x + sinY * halfL, 0.4, this.state.position.z + cosY * halfL),
      // Front Left
      new THREE.Vector3(this.state.position.x + sinY * halfL + leftX * halfW, 0.4, this.state.position.z + cosY * halfL + leftZ * halfW),
      // Front Right
      new THREE.Vector3(this.state.position.x + sinY * halfL - leftX * halfW, 0.4, this.state.position.z + cosY * halfL - leftZ * halfW),
      // Center
      new THREE.Vector3(this.state.position.x, 0.4, this.state.position.z),
      // Rear Center
      new THREE.Vector3(this.state.position.x - sinY * halfL, 0.4, this.state.position.z - cosY * halfL),
      // Rear Left
      new THREE.Vector3(this.state.position.x - sinY * halfL + leftX * halfW, 0.4, this.state.position.z - cosY * halfL + leftZ * halfW),
      // Rear Right
      new THREE.Vector3(this.state.position.x - sinY * halfL - leftX * halfW, 0.4, this.state.position.z - cosY * halfL - leftZ * halfW),
    ];

    for (const obs of obstacles) {
      // Distance check to obstacle center
      const distToCenter = obs.center.distanceTo(this.state.position);
      if (distToCenter > obs.radius + halfL + 1.5) continue;

      for (const p of probePoints) {
        if (obs.box.containsPoint(p)) {
          // COLLISION DETECTED!
          const impactSpeed = Math.abs(this.state.speed);
          const severity = impactSpeed > 2.2 ? 'major' : 'minor';
          this.state.lastCollisionSeverity = severity;
          this.state.collisionsCount++;

          // Damage deduction (modified by durability upgrade)
          const baseDamage = severity === 'major' ? 22 : 8;
          const damageAmount = baseDamage * durabilityMod;
          this.state.damagePct = Math.max(0, this.state.damagePct - damageAmount);

          // Audio
          SoundEffects.playCollision(severity);

          // Bounce back vector
          const bounceDirection = this.state.position.clone().sub(obs.center);
          bounceDirection.y = 0;
          if (bounceDirection.lengthSq() > 0.0001) {
            bounceDirection.normalize();
            this.state.position.x += bounceDirection.x * 0.4;
            this.state.position.z += bounceDirection.z * 0.4;
          }
          this.state.speed = -this.state.speed * 0.35; // rebound
          break;
        }
      }
    }
  }
}

