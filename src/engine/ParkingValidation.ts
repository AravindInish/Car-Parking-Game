import * as THREE from 'three';
import { LevelConfig, ParkingEvaluation } from '../types/game';
import { VehiclePhysicsState } from './VehiclePhysics';

export class ParkingValidation {
  public static evaluate(
    level: LevelConfig,
    carState: VehiclePhysicsState,
    carDimensions: { length: number; width: number },
    stationaryDuration: number // accumulated stationary seconds
  ): ParkingEvaluation {
    const targetPos = new THREE.Vector2(level.targetPosition[0], level.targetPosition[2]);
    const carPos = new THREE.Vector2(carState.position.x, carState.position.z);

    // 1. Distance between vehicle center and target bay center
    const distance = carPos.distanceTo(targetPos);

    // Transform car position into target bay local coordinate space
    const targetRot = level.targetRotation;
    const dx = carPos.x - targetPos.x;
    const dz = carPos.y - targetPos.y;

    // Rotate by -targetRot to get local X and local Z offsets
    const localX = dx * Math.cos(-targetRot) - dz * Math.sin(-targetRot);
    const localZ = dx * Math.sin(-targetRot) + dz * Math.cos(-targetRot);

    const [bayWidth, bayLength] = level.targetSize;
    const xTolerance = (bayWidth - carDimensions.width * 0.75) * 0.5 + 0.35;
    const zTolerance = (bayLength - carDimensions.length * 0.75) * 0.5 + 0.45;

    const inZone = Math.abs(localX) <= Math.max(0.4, xTolerance) && Math.abs(localZ) <= Math.max(0.6, zTolerance);

    // 2. Heading alignment (normalize relative angle to 0 or PI)
    const normAngle = (rad: number) => {
      let a = rad % (Math.PI * 2);
      if (a < -Math.PI) a += Math.PI * 2;
      if (a > Math.PI) a -= Math.PI * 2;
      return a;
    };
    const angleDiff = Math.abs(normAngle(carState.rotationY - targetRot));

    // Check both forward and reverse parking alignment (players can reverse in or drive in)
    const forwardAngleError = angleDiff;
    const reverseAngleError = Math.abs(Math.PI - angleDiff);
    const minAngleErrorRad = Math.min(forwardAngleError, reverseAngleError);
    const angleErrorDeg = (minAngleErrorRad * 180) / Math.PI;

    // Accuracy scoring: 100% when perfectly centered & aligned
    const distAccuracy = Math.max(0, 100 - (distance / 4.0) * 100);
    const angleAccuracy = Math.max(0, 100 - (angleErrorDeg / 25.0) * 100);
    const totalAccuracy = Math.round(distAccuracy * 0.6 + angleAccuracy * 0.4);

    // Stationary test: speed must be below 0.15 m/s (~0.5 km/h)
    const isStopped = Math.abs(carState.speed) < 0.15;
    const isAligned = angleErrorDeg <= 14.0;
    const isCentered = inZone;

    let statusText = 'Drive to highlighted parking bay';
    let canComplete = false;

    if (!isCentered) {
      if (distance < 6.0) {
        statusText = 'Center vehicle inside the bay';
      } else {
        statusText = `Navigate to parking bay (${distance.toFixed(1)}m away)`;
      }
    } else if (!isAligned) {
      statusText = 'Straighten steering & align with bay lines';
    } else if (!isStopped) {
      statusText = 'Apply brake to come to a complete stop';
    } else {
      // Vehicle in zone, aligned, stopped! Holding confirmation timer
      const remainingHold = Math.max(0, 1.2 - stationaryDuration);
      if (remainingHold > 0) {
        statusText = `Hold stationary... ${(1.2 - remainingHold).toFixed(1)}s / 1.2s`;
      } else {
        statusText = 'PERFECTLY PARKED!';
        canComplete = true;
      }
    }

    return {
      inZone,
      distance: Math.round(distance * 10) / 10,
      angleError: Math.round(angleErrorDeg * 10) / 10,
      accuracy: THREE.MathUtils.clamp(totalAccuracy, 0, 100),
      speed: carState.speedKmh,
      isStationary: stationaryDuration,
      statusText,
      canComplete,
    };
  }
}
