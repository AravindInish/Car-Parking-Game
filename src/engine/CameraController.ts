import * as THREE from 'three';
import { CameraMode } from '../types/game';
import { VehiclePhysicsState } from './VehiclePhysics';

export class CameraController {
  public camera: THREE.PerspectiveCamera;
  public rearCamera: THREE.PerspectiveCamera;
  public mode: CameraMode = 'chase';

  private currentLookAt: THREE.Vector3 = new THREE.Vector3();
  private currentCamPos: THREE.Vector3 = new THREE.Vector3();
  private baseFov: number = 60;

  constructor(aspect: number) {
    this.camera = new THREE.PerspectiveCamera(this.baseFov, aspect, 0.1, 300);
    this.camera.position.set(0, 5, -10);

    // Dedicated rear-facing camera for mirrors & reversing assistance
    this.rearCamera = new THREE.PerspectiveCamera(65, 2.5, 0.1, 100);
  }

  public setAspect(aspect: number) {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  public setMode(mode: CameraMode) {
    this.mode = mode;
  }

  public cycleMode(): CameraMode {
    const modes: CameraMode[] = ['chase', 'cockpit', 'bumper', 'rear', 'topdown'];
    const idx = modes.indexOf(this.mode);
    this.mode = modes[(idx + 1) % modes.length];
    return this.mode;
  }

  public update(carState: VehiclePhysicsState, dt: number, carDimensions: { length: number; width: number; height: number }) {
    if (dt > 0.1) dt = 0.1;

    const carPos = carState.position;
    const rotY = carState.rotationY;
    const sinY = Math.sin(rotY);
    const cosY = Math.cos(rotY);

    // Heading vectors: forward is (+sinY, 0, +cosY)
    const forward = new THREE.Vector3(sinY, 0, cosY);
    const up = new THREE.Vector3(0, 1, 0);

    let targetCamPos = new THREE.Vector3();
    let targetLookAt = new THREE.Vector3();
    let smoothRate = 6.0;

    // FOV expands slightly during forward acceleration for speed sensation
    const speedRatio = Math.min(1.0, carState.speedKmh / 60.0);
    this.camera.fov = THREE.MathUtils.damp(this.camera.fov, this.baseFov + speedRatio * 8, 4, dt);
    this.camera.updateProjectionMatrix();

    switch (this.mode) {
      case 'chase': {
        // Position behind car (-forward * distance + elevation)
        const chaseDistance = carDimensions.length * 1.5 + 2.5;
        const chaseHeight = carDimensions.height * 1.2 + 1.6;
        targetCamPos.copy(carPos)
          .sub(forward.clone().multiplyScalar(chaseDistance))
          .add(new THREE.Vector3(0, chaseHeight, 0));

        targetLookAt.copy(carPos).add(new THREE.Vector3(0, carDimensions.height * 0.7, 0)).add(forward.clone().multiplyScalar(2.0));
        smoothRate = 6.5;
        break;
      }

      case 'cockpit': {
        // Inside cabin at driver eye level
        const eyeOffset = new THREE.Vector3(-carDimensions.width * 0.25, carDimensions.height * 0.85, carDimensions.length * 0.05);
        eyeOffset.applyAxisAngle(up, rotY);
        targetCamPos.copy(carPos).add(eyeOffset);

        targetLookAt.copy(targetCamPos).add(forward.clone().multiplyScalar(10.0)).add(new THREE.Vector3(0, -0.2, 0));
        smoothRate = 22.0; // Snappy tracking for cockpit
        break;
      }

      case 'bumper': {
        // Low on front bumper
        const bumperOffset = new THREE.Vector3(0, 0.45, carDimensions.length * 0.52);
        bumperOffset.applyAxisAngle(up, rotY);
        targetCamPos.copy(carPos).add(bumperOffset);

        targetLookAt.copy(targetCamPos).add(forward.clone().multiplyScalar(12.0));
        smoothRate = 18.0;
        break;
      }

      case 'rear': {
        // Mounted on rear bumper looking backwards
        const rearOffset = new THREE.Vector3(0, carDimensions.height * 0.8, -carDimensions.length * 0.55);
        rearOffset.applyAxisAngle(up, rotY);
        targetCamPos.copy(carPos).add(rearOffset);

        targetLookAt.copy(targetCamPos).sub(forward.clone().multiplyScalar(12.0)).add(new THREE.Vector3(0, -0.4, 0));
        smoothRate = 18.0;
        break;
      }

      case 'topdown': {
        // Bird's eye directly above car
        targetCamPos.copy(carPos).add(new THREE.Vector3(0, 14.0, 0));
        targetLookAt.copy(carPos);
        smoothRate = 7.0;
        break;
      }
    }

    // Smoothly interpolate camera position and look target
    if (this.currentCamPos.lengthSq() === 0) {
      this.currentCamPos.copy(targetCamPos);
      this.currentLookAt.copy(targetLookAt);
    } else {
      this.currentCamPos.lerp(targetCamPos, Math.min(1.0, smoothRate * dt));
      this.currentLookAt.lerp(targetLookAt, Math.min(1.0, smoothRate * dt));
    }

    this.camera.position.copy(this.currentCamPos);
    this.camera.lookAt(this.currentLookAt);

    // Update rear camera for virtual mirrors / backup view
    const rearMountPos = carPos.clone().add(new THREE.Vector3(0, carDimensions.height * 0.9, -carDimensions.length * 0.5).applyAxisAngle(up, rotY));
    this.rearCamera.position.copy(rearMountPos);
    this.rearCamera.lookAt(rearMountPos.clone().sub(forward.clone().multiplyScalar(10.0)).add(new THREE.Vector3(0, -0.2, 0)));
  }
}
