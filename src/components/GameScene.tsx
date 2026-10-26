import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import {
  LevelConfig,
  PlayerProfile,
  CameraMode,
  AutomaticGear,
  ManualGear,
  ParkingEvaluation,
} from '../types/game';
import { Environment3DBuilder, EnvironmentScene } from '../models/Environment3DBuilder';
import { Car3DBuilder, CarModelInstance } from '../models/Car3DBuilder';
import { VehiclePhysics } from '../engine/VehiclePhysics';
import { CameraController } from '../engine/CameraController';
import { ParkingValidation } from '../engine/ParkingValidation';
import { VEHICLE_CONFIGS } from '../engine/VehicleData';
import { InGameHUD } from './InGameHUD';
import { SoundEffects } from '../audio/SoundEffects';

interface GameSceneProps {
  level: LevelConfig;
  profile: PlayerProfile;
  onLevelComplete: (
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
  ) => void;
  onLevelFail: (reason: 'wrecked' | 'timeout') => void;
  onPause: () => void;
}

export const GameScene: React.FC<GameSceneProps> = ({
  level,
  profile,
  onLevelComplete,
  onLevelFail,
  onPause,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // Input states
  const [steeringValue, setSteeringValue] = useState<number>(0);
  const [throttleValue, setThrottleValue] = useState<number>(0);
  const [brakeValue, setBrakeValue] = useState<number>(0);

  // Vehicle states for HUD
  const [hudCarState, setHudCarState] = useState({
    speedKmh: 0,
    rpm: 800,
    currentGear: 'P',
    damagePct: 100,
    engineStarted: false,
    seatBeltBuckled: false,
    handbrake: true,
    isBraking: false,
    isReversing: false,
  });

  const [parkingEval, setParkingEval] = useState<ParkingEvaluation>({
    inZone: false,
    distance: 0,
    angleError: 0,
    accuracy: 0,
    speed: 0,
    isStationary: 0,
    statusText: 'Drive to highlighted parking bay',
    canComplete: false,
  });

  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [cameraMode, setCameraMode] = useState<CameraMode>('chase');
  const [leftBlinker, setLeftBlinker] = useState<boolean>(false);
  const [rightBlinker, setRightBlinker] = useState<boolean>(false);
  const [hazardLights, setHazardLights] = useState<boolean>(false);
  const [headlights, setHeadlights] = useState<boolean>(false);
  const [showRearMirror, setShowRearMirror] = useState<boolean>(profile.settings.rearMirrorEnabled);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Mutable refs for game loop to avoid re-renders
  const inputsRef = useRef({
    throttle: 0,
    brake: 0,
    steer: 0,
    keys: {
      up: false,
      down: false,
      left: false,
      right: false,
      space: false,
    },
  });

  const physicsRef = useRef<VehiclePhysics | null>(null);
  const cameraControllerRef = useRef<CameraController | null>(null);
  const carModelRef = useRef<CarModelInstance | null>(null);
  const envSceneRef = useRef<EnvironmentScene | null>(null);
  const stationaryDurationRef = useRef<number>(0);
  const isFinishedRef = useRef<boolean>(false);

  // Initialize Three.js Game Scene & Physics
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. SCENE SETUP
    const scene = new THREE.Scene();
    scene.name = 'ParkingGameScene';

    // Sky & Fog based on time of day
    let skyColor = 0x0f172a; // Night / default
    let fogColor = 0x0f172a;
    let keyLightIntensity = 1.6;

    if (level.timeOfDay === 'day') {
      skyColor = 0x38bdf8;
      fogColor = 0x93c5fd;
      keyLightIntensity = 2.4;
    } else if (level.timeOfDay === 'sunset') {
      skyColor = 0x431407;
      fogColor = 0x7c2d12;
      keyLightIntensity = 2.0;
    }
    scene.background = new THREE.Color(skyColor);
    scene.fog = new THREE.FogExp2(fogColor, 0.012);

    // 2. RENDERER SETUP
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // 3. CAMERA SETUP
    const cameraController = new CameraController(width / height);
    cameraControllerRef.current = cameraController;

    // 4. LIGHTING RIG
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x1e293b, 1.2);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfffbeb, keyLightIntensity);
    dirLight.position.set(25, 40, 25);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 120;
    dirLight.shadow.camera.left = -45;
    dirLight.shadow.camera.right = 45;
    dirLight.shadow.camera.top = 45;
    dirLight.shadow.camera.bottom = -45;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);

    // 5. BUILD ENVIRONMENT & TARGET BAY
    const envScene = Environment3DBuilder.buildEnvironment(level);
    scene.add(envScene.group);
    envSceneRef.current = envScene;

    // 6. BUILD VEHICLE
    const vehicleId = profile.selectedVehicle;
    const vehicleSpecs = VEHICLE_CONFIGS[vehicleId];
    const carModel = Car3DBuilder.buildCar(vehicleId, profile.customizations[vehicleId]);
    scene.add(carModel.group);
    carModelRef.current = carModel;

    // 7. INITIALIZE PHYSICS
    const physics = new VehiclePhysics(
      vehicleId,
      profile.upgrades[vehicleId],
      profile.settings.transmissionMode,
      level.startPosition,
      level.startRotation
    );
    physicsRef.current = physics;

    // Position vehicle initially
    carModel.group.position.set(level.startPosition[0], level.startPosition[1], level.startPosition[2]);
    carModel.group.rotation.y = level.startRotation;

    // Clock
    const clock = new THREE.Clock();
    let animId: number;
    let blinkerTimer = 0;
    let blinkerState = false;

    // 8. ANIMATION LOOP
    const tick = () => {
      animId = requestAnimationFrame(tick);
      const dt = clock.getDelta();

      if (isFinishedRef.current) {
        renderer.render(scene, cameraController.camera);
        return;
      }

      // Gather combined inputs (keyboard + UI touch pedals)
      const inputs = inputsRef.current;
      let effectiveThrottle = inputs.throttle;
      let effectiveBrake = inputs.brake;
      let effectiveSteer = inputs.steer;

      if (inputs.keys.up) effectiveThrottle = 1.0;
      if (inputs.keys.down) effectiveBrake = 1.0;
      if (inputs.keys.left) effectiveSteer = -1.0;
      if (inputs.keys.right) effectiveSteer = 1.0;
      if (inputs.keys.space) physics.state.handbrake = true;

      // Update physics simulation
      physics.update(
        dt,
        effectiveThrottle,
        effectiveBrake,
        effectiveSteer,
        envScene.obstacleColliders
      );

      // Sync 3D Car Model transforms
      carModel.group.position.copy(physics.state.position);
      carModel.group.rotation.y = physics.state.rotationY;
      carModel.bodyMesh.rotation.x = physics.state.chassisPitch;
      carModel.bodyMesh.rotation.z = physics.state.chassisRoll;

      // Wheel visuals
      carModel.updateSteering(physics.state.steeringAngle);
      carModel.updateWheelRoll(physics.state.speed * dt);
      carModel.setBrakeLights(physics.state.isBraking);
      carModel.setReverseLights(physics.state.isReversing);

      // Blinker light flash cycle (every 350ms)
      blinkerTimer += dt;
      if (blinkerTimer > 0.35) {
        blinkerTimer = 0;
        blinkerState = !blinkerState;
        if (hazardLights) {
          carModel.setBlinkers(blinkerState, blinkerState);
          SoundEffects.playBlinkerClick(blinkerState);
        } else {
          carModel.setBlinkers(leftBlinker && blinkerState, rightBlinker && blinkerState);
          if ((leftBlinker || rightBlinker) && blinkerState) {
            SoundEffects.playBlinkerClick(true);
          }
        }
      }

      // Update Camera tracking
      cameraController.update(physics.state, dt, vehicleSpecs.dimensions);

      // 9. PARKING EVALUATION
      const isStopped = Math.abs(physics.state.speed) < 0.15;
      if (isStopped && parkingEvalRef.current.inZone && parkingEvalRef.current.angleError <= 14.0) {
        stationaryDurationRef.current += dt;
      } else {
        stationaryDurationRef.current = 0;
      }

      const evaluation = ParkingValidation.evaluate(
        level,
        physics.state,
        vehicleSpecs.dimensions,
        stationaryDurationRef.current
      );
      parkingEvalRef.current = evaluation;
      setParkingEval(evaluation);

      // Update parking bay visual shader color (yellow -> green)
      envScene.updateTargetState(evaluation.accuracy, evaluation.inZone);

      // Check Victory Condition
      if (evaluation.canComplete && !isFinishedRef.current) {
        isFinishedRef.current = true;
        physics.state.speed = 0;

        // Calculate Stars (1-3)
        let stars = 1;
        if (evaluation.accuracy >= 85 && physics.state.damagePct >= 80) {
          stars = 3;
        } else if (evaluation.accuracy >= 70 && physics.state.damagePct >= 50) {
          stars = 2;
        }

        // Calculate Coins Breakdown
        const base = level.rewardCoins;
        const accuracyBonus = Math.round(evaluation.accuracy * 0.8);
        const timeBonus = clock.getElapsedTime() < level.parTime ? 50 : 0;
        const damagePenalty = Math.round((100 - physics.state.damagePct) * 0.5);
        const totalCoins = Math.max(50, base + accuracyBonus + timeBonus - damagePenalty);

        onLevelComplete(stars, clock.getElapsedTime(), evaluation.accuracy, physics.state.damagePct, {
          base,
          accuracyBonus,
          timeBonus,
          damagePenalty,
          total: totalCoins,
        });
      }

      // Check Defeat Condition (Wrecked)
      if (physics.state.damagePct <= 0 && !isFinishedRef.current) {
        isFinishedRef.current = true;
        onLevelFail('wrecked');
      }

      // Update HUD info
      setElapsedTime(clock.getElapsedTime());
      setHudCarState({
        speedKmh: physics.state.speedKmh,
        rpm: physics.state.rpm,
        currentGear: physics.state.currentGear,
        damagePct: physics.state.damagePct,
        engineStarted: physics.state.engineStarted,
        seatBeltBuckled: physics.state.seatBeltBuckled,
        handbrake: physics.state.handbrake,
        isBraking: physics.state.isBraking,
        isReversing: physics.state.isReversing,
      });

      // Render Scene
      renderer.render(scene, cameraController.camera);
    };

    const parkingEvalRef = { current: parkingEval };
    tick();

    // Window Resize Handler
    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      cameraController.setAspect(w / h);
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      SoundEffects.stopEngine();
      envScene.dispose();
      renderer.dispose();
      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [level]);

  // Tilt Sensor Controls (Accelerometer support)
  useEffect(() => {
    if (profile.settings.steeringMode !== 'tilt') return;
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma !== null && e.gamma !== undefined) {
        // gamma is left-to-right tilt in degrees (-90 to +90)
        const steer = THREE.MathUtils.clamp((e.gamma / 25) * profile.settings.tiltSensitivity, -1, 1);
        handleSteerChange(steer);
      }
    };
    window.addEventListener('deviceorientation', handleOrientation);
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [profile.settings.steeringMode, profile.settings.tiltSensitivity]);

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const k = e.key.toLowerCase();

      if (k === 'arrowup' || k === 'w') {
        inputsRef.current.keys.up = true;
        setThrottleValue(1);
        if (physicsRef.current && !physicsRef.current.state.engineStarted) {
          physicsRef.current.toggleEngine();
          physicsRef.current.state.handbrake = false;
          physicsRef.current.shiftAuto('D');
        }
      } else if (k === 'arrowdown' || k === 's') {
        inputsRef.current.keys.down = true;
        setBrakeValue(1);
      } else if (k === 'arrowleft' || k === 'a') {
        inputsRef.current.keys.left = true;
        setSteeringValue(-1);
      } else if (k === 'arrowright' || k === 'd') {
        inputsRef.current.keys.right = true;
        setSteeringValue(1);
      } else if (k === ' ') {
        inputsRef.current.keys.space = true;
        physicsRef.current?.toggleHandbrake();
      } else if (k === 'c') {
        // Cycle Camera
        if (cameraControllerRef.current) {
          const next = cameraControllerRef.current.cycleMode();
          setCameraMode(next);
          SoundEffects.playClick();
        }
      } else if (k === 'e') {
        // Engine
        physicsRef.current?.toggleEngine();
      } else if (k === 'b') {
        // Seatbelt
        physicsRef.current?.toggleSeatbelt();
      } else if (k === 'l') {
        // Headlights
        setHeadlights((prev) => {
          const next = !prev;
          carModelRef.current?.setHeadlights(next);
          SoundEffects.playClick();
          return next;
        });
      } else if (k === 'q' || k === 'z') {
        // Left Blinker
        setLeftBlinker((prev) => !prev);
      } else if (k === 'x') {
        // Right Blinker
        setRightBlinker((prev) => !prev);
      } else if (k === 'h') {
        // Hazards
        setHazardLights((prev) => !prev);
      } else if (k === 'escape' || k === 'p') {
        onPause();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'arrowup' || k === 'w') {
        inputsRef.current.keys.up = false;
        setThrottleValue(0);
      } else if (k === 'arrowdown' || k === 's') {
        inputsRef.current.keys.down = false;
        setBrakeValue(0);
      } else if (k === 'arrowleft' || k === 'a') {
        inputsRef.current.keys.left = false;
        setSteeringValue(0);
      } else if (k === 'arrowright' || k === 'd') {
        inputsRef.current.keys.right = false;
        setSteeringValue(0);
      } else if (k === ' ') {
        inputsRef.current.keys.space = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onPause]);

  // Touch and UI Handlers
  const handleSteerChange = useCallback((val: number) => {
    setSteeringValue(val);
    inputsRef.current.steer = val;
  }, []);

  const handleThrottleChange = useCallback((val: number) => {
    setThrottleValue(val);
    inputsRef.current.throttle = val;
    if (val > 0.1 && physicsRef.current && !physicsRef.current.state.engineStarted) {
      physicsRef.current.toggleEngine();
      physicsRef.current.state.handbrake = false;
      physicsRef.current.shiftAuto('D');
    }
  }, []);

  const handleBrakeChange = useCallback((val: number) => {
    setBrakeValue(val);
    inputsRef.current.brake = val;
  }, []);

  const handleShiftAuto = useCallback((gear: AutomaticGear) => {
    physicsRef.current?.shiftAuto(gear);
  }, []);

  const handleShiftManualUp = useCallback(() => {
    physicsRef.current?.shiftManualUp();
  }, []);

  const handleShiftManualDown = useCallback(() => {
    physicsRef.current?.shiftManualDown();
  }, []);

  const handleToggleEngine = useCallback(() => {
    physicsRef.current?.toggleEngine();
  }, []);

  const handleToggleSeatbelt = useCallback(() => {
    physicsRef.current?.toggleSeatbelt();
  }, []);

  const handleToggleHandbrake = useCallback(() => {
    physicsRef.current?.toggleHandbrake();
  }, []);

  const handleToggleLeftBlinker = useCallback(() => {
    setLeftBlinker((prev) => !prev);
    setHazardLights(false);
  }, []);

  const handleToggleRightBlinker = useCallback(() => {
    setRightBlinker((prev) => !prev);
    setHazardLights(false);
  }, []);

  const handleToggleHazards = useCallback(() => {
    setHazardLights((prev) => !prev);
    setLeftBlinker(false);
    setRightBlinker(false);
  }, []);

  const handleToggleHeadlights = useCallback(() => {
    setHeadlights((prev) => {
      const next = !prev;
      carModelRef.current?.setHeadlights(next);
      SoundEffects.playClick();
      return next;
    });
  }, []);

  const handleCycleCamera = useCallback(() => {
    if (cameraControllerRef.current) {
      const next = cameraControllerRef.current.cycleMode();
      setCameraMode(next);
      SoundEffects.playClick();
    }
  }, []);

  const handleToggleRearMirror = useCallback(() => {
    setShowRearMirror((prev) => !prev);
    SoundEffects.playClick();
  }, []);

  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      SoundEffects.toggleMute(next);
      return next;
    });
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-950 select-none">
      {/* 3D WebGL Canvas */}
      <div ref={mountRef} className="absolute inset-0 z-0" />

      {/* Floating In-Game HUD Overlay */}
      <InGameHUD
        level={level}
        carState={hudCarState}
        parkingEval={parkingEval}
        elapsedTime={elapsedTime}
        coins={profile.coins}
        cameraMode={cameraMode}
        steeringMode={profile.settings.steeringMode}
        transmissionMode={profile.settings.transmissionMode}
        steeringValue={steeringValue}
        throttleValue={throttleValue}
        brakeValue={brakeValue}
        leftBlinker={leftBlinker}
        rightBlinker={rightBlinker}
        hazardLights={hazardLights}
        headlights={headlights}
        showRearMirror={showRearMirror}
        isMuted={isMuted}
        onSteerChange={handleSteerChange}
        onThrottleChange={handleThrottleChange}
        onBrakeChange={handleBrakeChange}
        onShiftAuto={handleShiftAuto}
        onShiftManualUp={handleShiftManualUp}
        onShiftManualDown={handleShiftManualDown}
        onToggleEngine={handleToggleEngine}
        onToggleSeatbelt={handleToggleSeatbelt}
        onToggleHandbrake={handleToggleHandbrake}
        onToggleLeftBlinker={handleToggleLeftBlinker}
        onToggleRightBlinker={handleToggleRightBlinker}
        onToggleHazards={handleToggleHazards}
        onToggleHeadlights={handleToggleHeadlights}
        onCycleCamera={handleCycleCamera}
        onToggleRearMirror={handleToggleRearMirror}
        onToggleMute={handleToggleMute}
        onPause={onPause}
      />
    </div>
  );
};
