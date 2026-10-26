import * as THREE from 'three';
import { VehicleId, VehicleCustomization } from '../types/game';
import { VEHICLE_CONFIGS } from '../engine/VehicleData';

export interface CarModelInstance {
  group: THREE.Group;
  bodyMesh: THREE.Mesh;
  frontLeftWheel: THREE.Group;
  frontRightWheel: THREE.Group;
  rearLeftWheel: THREE.Group;
  rearRightWheel: THREE.Group;
  cockpitSteeringWheel: THREE.Mesh;
  headlightLenses: THREE.Mesh[];
  headlightSpots: THREE.SpotLight[];
  brakeLights: THREE.Mesh[];
  reverseLights: THREE.Mesh[];
  leftTurnLights: THREE.Mesh[];
  rightTurnLights: THREE.Mesh[];
  licensePlateMesh: THREE.Mesh;
  updateSteering: (steerRad: number) => void;
  updateWheelRoll: (deltaDistance: number) => void;
  setHeadlights: (on: boolean) => void;
  setBrakeLights: (on: boolean) => void;
  setReverseLights: (on: boolean) => void;
  setBlinkers: (left: boolean, right: boolean) => void;
  updateCustomization: (custom: VehicleCustomization) => void;
}

export class Car3DBuilder {
  public static createLicensePlateTexture(text: string): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Plate background
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, 256, 64);
      // Border
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 6;
      ctx.strokeRect(4, 4, 248, 56);
      // Inner blue strip
      ctx.fillStyle = '#1d4ed8';
      ctx.fillRect(6, 6, 32, 52);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('PRK', 22, 32);

      // Plate text
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 32px "Courier New", monospace, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(text.toUpperCase(), 145, 34);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  public static buildCar(
    vehicleId: VehicleId,
    custom: VehicleCustomization
  ): CarModelInstance {
    const specs = VEHICLE_CONFIGS[vehicleId];
    const { length, width, height } = specs.dimensions;

    const group = new THREE.Group();
    group.name = `car_${vehicleId}`;

    // Paint Finish Material
    let roughness = 0.2;
    let metalness = 0.7;
    if (custom.finish === 'matte') {
      roughness = 0.85;
      metalness = 0.1;
    } else if (custom.finish === 'gloss') {
      roughness = 0.1;
      metalness = 0.2;
    }

    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: custom.color,
      roughness,
      metalness,
      envMapIntensity: 1.2,
    });

    const trimMaterial = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.7,
      metalness: 0.2,
    });

    const chromeMaterial = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.1,
      metalness: 0.95,
      envMapIntensity: 1.5,
    });

    const glassMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.05,
      metalness: 0.9,
      transparent: true,
      opacity: 0.65,
    });

    const wheelRubberMaterial = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.9,
      metalness: 0.05,
    });

    const rimMaterial = new THREE.MeshStandardMaterial({
      color: custom.wheelColor || '#94a3b8',
      roughness: 0.25,
      metalness: 0.8,
    });

    const headlightOffColor = custom.headlightTint === 'xenon' ? 0x93c5fd : custom.headlightTint === 'cyan' ? 0x22d3ee : custom.headlightTint === 'amber' ? 0xf59e0b : 0xffffff;

    const headlightMaterial = new THREE.MeshStandardMaterial({
      color: headlightOffColor,
      emissive: 0x000000,
      roughness: 0.1,
      metalness: 0.2,
    });

    const brakeLightMaterial = new THREE.MeshStandardMaterial({
      color: 0x7f1d1d,
      emissive: 0x330000,
      roughness: 0.2,
      metalness: 0.1,
    });

    const reverseLightMaterial = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      emissive: 0x000000,
      roughness: 0.2,
    });

    const turnLightLeftMaterial = new THREE.MeshStandardMaterial({
      color: 0x78350f,
      emissive: 0x000000,
      roughness: 0.2,
    });

    const turnLightRightMaterial = new THREE.MeshStandardMaterial({
      color: 0x78350f,
      emissive: 0x000000,
      roughness: 0.2,
    });

    // 1. CHASSIS / LOWER BODY
    const wheelRadius = height * 0.22;
    const chassisY = wheelRadius * 0.95;
    const bodyHeight = height * 0.55;

    // Main lower hull
    const lowerBodyGeo = new THREE.BoxGeometry(width, bodyHeight, length);
    const bodyMesh = new THREE.Mesh(lowerBodyGeo, bodyMaterial);
    bodyMesh.position.y = chassisY + bodyHeight * 0.5;
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    group.add(bodyMesh);

    // Front Bumper with Grille
    const bumperGeo = new THREE.BoxGeometry(width * 1.02, bodyHeight * 0.5, length * 0.12);
    const frontBumper = new THREE.Mesh(bumperGeo, trimMaterial);
    frontBumper.position.set(0, chassisY + bodyHeight * 0.25, length * 0.48);
    frontBumper.castShadow = true;
    group.add(frontBumper);

    // Rear Bumper
    const rearBumper = new THREE.Mesh(bumperGeo, trimMaterial);
    rearBumper.position.set(0, chassisY + bodyHeight * 0.25, -length * 0.48);
    rearBumper.castShadow = true;
    group.add(rearBumper);

    // Side Skirts
    const skirtGeo = new THREE.BoxGeometry(width * 1.03, bodyHeight * 0.2, length * 0.7);
    const sideSkirts = new THREE.Mesh(skirtGeo, trimMaterial);
    sideSkirts.position.set(0, chassisY + bodyHeight * 0.1, 0);
    group.add(sideSkirts);

    // 2. CABIN / ROOF / GREENHOUSE
    let cabinLength = length * 0.58;
    let cabinZOffset = -length * 0.04;
    let cabinWidth = width * 0.88;
    const cabinHeight = height * 0.46;

    if (vehicleId === 'hatchback') {
      cabinLength = length * 0.65;
      cabinZOffset = -length * 0.08;
    } else if (vehicleId === 'sport') {
      cabinLength = length * 0.48;
      cabinZOffset = -length * 0.08;
      cabinWidth = width * 0.82;
    } else if (vehicleId === 'suv') {
      cabinLength = length * 0.75;
      cabinZOffset = -length * 0.05;
      cabinWidth = width * 0.92;
    }

    const cabinGeo = new THREE.BoxGeometry(cabinWidth, cabinHeight, cabinLength);
    const cabinMesh = new THREE.Mesh(cabinGeo, glassMaterial);
    cabinMesh.position.set(0, chassisY + bodyHeight + cabinHeight * 0.5 - 0.02, cabinZOffset);
    cabinMesh.castShadow = true;
    group.add(cabinMesh);

    // Roof Top Shell
    const roofGeo = new THREE.BoxGeometry(cabinWidth * 0.96, 0.06, cabinLength * 0.95);
    const roofMesh = new THREE.Mesh(roofGeo, bodyMaterial);
    roofMesh.position.set(0, chassisY + bodyHeight + cabinHeight, cabinZOffset);
    roofMesh.castShadow = true;
    group.add(roofMesh);

    // 3. INTERIOR & DASHBOARD & COCKPIT STEERING WHEEL
    const dashGeo = new THREE.BoxGeometry(cabinWidth * 0.9, 0.25, 0.5);
    const dashMesh = new THREE.Mesh(dashGeo, trimMaterial);
    dashMesh.position.set(0, chassisY + bodyHeight + 0.15, cabinZOffset + cabinLength * 0.35);
    group.add(dashMesh);

    // Cockpit Steering Wheel (Rotates with steer input, styled to match reference)
    const steerTorusGeo = new THREE.TorusGeometry(0.18, 0.025, 8, 24);
    const cockpitSteeringWheel = new THREE.Mesh(steerTorusGeo, trimMaterial);
    cockpitSteeringWheel.position.set(cabinWidth * 0.25, chassisY + bodyHeight + 0.28, cabinZOffset + cabinLength * 0.25);
    cockpitSteeringWheel.rotation.x = -Math.PI / 4;

    // Wood & Gold accent materials
    const woodTrimMaterial = new THREE.MeshStandardMaterial({
      color: 0x5a2e1b,
      roughness: 0.2,
      metalness: 0.1,
    });
    const goldEmblemMaterial = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.2,
      metalness: 0.9,
    });

    // Top Wood Rim Arch
    const woodArchGeo = new THREE.TorusGeometry(0.18, 0.026, 8, 16, Math.PI * 0.7);
    const woodArch = new THREE.Mesh(woodArchGeo, woodTrimMaterial);
    woodArch.rotation.z = Math.PI * 0.15;
    cockpitSteeringWheel.add(woodArch);

    // Center Airbag Hub & Golden Emblem
    const hubGeo = new THREE.CylinderGeometry(0.065, 0.075, 0.04, 16);
    hubGeo.rotateX(Math.PI / 2);
    const hubMesh = new THREE.Mesh(hubGeo, trimMaterial);
    cockpitSteeringWheel.add(hubMesh);

    const emblemGeo = new THREE.TorusGeometry(0.024, 0.005, 8, 16);
    const emblemMesh = new THREE.Mesh(emblemGeo, goldEmblemMaterial);
    emblemMesh.position.z = 0.022;
    cockpitSteeringWheel.add(emblemMesh);

    group.add(cockpitSteeringWheel);

    // Cockpit Seats
    const seatGeo = new THREE.BoxGeometry(0.45, 0.6, 0.45);
    const driverSeat = new THREE.Mesh(seatGeo, trimMaterial);
    driverSeat.position.set(cabinWidth * 0.25, chassisY + bodyHeight + 0.2, cabinZOffset - 0.1);
    group.add(driverSeat);

    const passSeat = new THREE.Mesh(seatGeo, trimMaterial);
    passSeat.position.set(-cabinWidth * 0.25, chassisY + bodyHeight + 0.2, cabinZOffset - 0.1);
    group.add(passSeat);

    // 4. SIDE MIRRORS
    const mirrorGeo = new THREE.BoxGeometry(0.18, 0.1, 0.2);
    const leftMirror = new THREE.Mesh(mirrorGeo, bodyMaterial);
    leftMirror.position.set(width * 0.55, chassisY + bodyHeight + 0.15, cabinZOffset + cabinLength * 0.35);
    group.add(leftMirror);

    const rightMirror = new THREE.Mesh(mirrorGeo, bodyMaterial);
    rightMirror.position.set(-width * 0.55, chassisY + bodyHeight + 0.15, cabinZOffset + cabinLength * 0.35);
    group.add(rightMirror);

    // 5. LIGHTING: HEADLIGHTS, BRAKE LIGHTS, REVERSE, TURN SIGNALS
    const headlightGeo = new THREE.BoxGeometry(width * 0.18, bodyHeight * 0.25, 0.06);
    const headlightLenses: THREE.Mesh[] = [];
    const headlightSpots: THREE.SpotLight[] = [];

    // Left Headlight
    const hlLeft = new THREE.Mesh(headlightGeo, headlightMaterial);
    hlLeft.position.set(width * 0.38, chassisY + bodyHeight * 0.7, length * 0.5);
    group.add(hlLeft);
    headlightLenses.push(hlLeft);

    // Right Headlight
    const hlRight = new THREE.Mesh(headlightGeo, headlightMaterial);
    hlRight.position.set(-width * 0.38, chassisY + bodyHeight * 0.7, length * 0.5);
    group.add(hlRight);
    headlightLenses.push(hlRight);

    // Spotlights for nighttime driving
    const spotLeft = new THREE.SpotLight(headlightOffColor, 0, 30, Math.PI / 6, 0.3, 1.0);
    spotLeft.position.set(width * 0.38, chassisY + bodyHeight * 0.7, length * 0.5);
    const spotLeftTarget = new THREE.Object3D();
    spotLeftTarget.position.set(width * 0.38, 0, length * 0.5 + 15);
    group.add(spotLeftTarget);
    spotLeft.target = spotLeftTarget;
    group.add(spotLeft);
    headlightSpots.push(spotLeft);

    const spotRight = new THREE.SpotLight(headlightOffColor, 0, 30, Math.PI / 6, 0.3, 1.0);
    spotRight.position.set(-width * 0.38, chassisY + bodyHeight * 0.7, length * 0.5);
    const spotRightTarget = new THREE.Object3D();
    spotRightTarget.position.set(-width * 0.38, 0, length * 0.5 + 15);
    group.add(spotRightTarget);
    spotRight.target = spotRightTarget;
    group.add(spotRight);
    headlightSpots.push(spotRight);

    // Brake Lights (Red)
    const brakeGeo = new THREE.BoxGeometry(width * 0.2, bodyHeight * 0.22, 0.06);
    const brakeLights: THREE.Mesh[] = [];

    const blLeft = new THREE.Mesh(brakeGeo, brakeLightMaterial);
    blLeft.position.set(width * 0.36, chassisY + bodyHeight * 0.7, -length * 0.5);
    group.add(blLeft);
    brakeLights.push(blLeft);

    const blRight = new THREE.Mesh(brakeGeo, brakeLightMaterial);
    blRight.position.set(-width * 0.36, chassisY + bodyHeight * 0.7, -length * 0.5);
    group.add(blRight);
    brakeLights.push(blRight);

    // Reverse Lights (White)
    const revGeo = new THREE.BoxGeometry(width * 0.12, bodyHeight * 0.12, 0.06);
    const reverseLights: THREE.Mesh[] = [];

    const revLeft = new THREE.Mesh(revGeo, reverseLightMaterial);
    revLeft.position.set(width * 0.2, chassisY + bodyHeight * 0.7, -length * 0.5);
    group.add(revLeft);
    reverseLights.push(revLeft);

    const revRight = new THREE.Mesh(revGeo, reverseLightMaterial);
    revRight.position.set(-width * 0.2, chassisY + bodyHeight * 0.7, -length * 0.5);
    group.add(revRight);
    reverseLights.push(revRight);

    // Turn Indicators (Amber, front corners + rear corners)
    const turnGeo = new THREE.BoxGeometry(width * 0.08, bodyHeight * 0.12, 0.07);
    const leftTurnLights: THREE.Mesh[] = [];
    const rightTurnLights: THREE.Mesh[] = [];

    // Left Indicators (front + rear + mirror)
    const tlFront = new THREE.Mesh(turnGeo, turnLightLeftMaterial);
    tlFront.position.set(width * 0.48, chassisY + bodyHeight * 0.7, length * 0.49);
    group.add(tlFront);
    leftTurnLights.push(tlFront);

    const tlRear = new THREE.Mesh(turnGeo, turnLightLeftMaterial);
    tlRear.position.set(width * 0.48, chassisY + bodyHeight * 0.7, -length * 0.49);
    group.add(tlRear);
    leftTurnLights.push(tlRear);

    // Right Indicators (front + rear + mirror)
    const trFront = new THREE.Mesh(turnGeo, turnLightRightMaterial);
    trFront.position.set(-width * 0.48, chassisY + bodyHeight * 0.7, length * 0.49);
    group.add(trFront);
    rightTurnLights.push(trFront);

    const trRear = new THREE.Mesh(turnGeo, turnLightRightMaterial);
    trRear.position.set(-width * 0.48, chassisY + bodyHeight * 0.7, -length * 0.49);
    group.add(trRear);
    rightTurnLights.push(trRear);

    // 6. LICENSE PLATES
    const plateGeo = new THREE.BoxGeometry(0.65, 0.22, 0.04);
    const plateTex = this.createLicensePlateTexture(custom.licensePlate);
    const plateMat = new THREE.MeshBasicMaterial({ map: plateTex });

    const frontPlate = new THREE.Mesh(plateGeo, plateMat);
    frontPlate.position.set(0, chassisY + bodyHeight * 0.2, length * 0.54);
    group.add(frontPlate);

    const rearPlate = new THREE.Mesh(plateGeo, plateMat);
    rearPlate.position.set(0, chassisY + bodyHeight * 0.25, -length * 0.54);
    rearPlate.rotation.y = Math.PI;
    group.add(rearPlate);

    // 7. WHEEL ASSEMBLIES (Detailed Tires + Rims)
    const wheelThickness = width * 0.16;
    const tireGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelThickness, 24);
    tireGeo.rotateZ(Math.PI / 2);

    const rimGeo = new THREE.CylinderGeometry(wheelRadius * 0.65, wheelRadius * 0.65, wheelThickness * 1.02, 16);
    rimGeo.rotateZ(Math.PI / 2);

    const spokeGeo = new THREE.BoxGeometry(wheelThickness * 1.05, wheelRadius * 1.2, 0.05);

    function createWheelAssembly(): THREE.Group {
      const wheelAssembly = new THREE.Group();

      const tire = new THREE.Mesh(tireGeo, wheelRubberMaterial);
      tire.castShadow = true;
      wheelAssembly.add(tire);

      const rim = new THREE.Mesh(rimGeo, rimMaterial);
      wheelAssembly.add(rim);

      // Spokes for visual rotation read
      for (let s = 0; s < 3; s++) {
        const spoke = new THREE.Mesh(spokeGeo, rimMaterial);
        spoke.rotation.x = (s * Math.PI) / 3;
        wheelAssembly.add(spoke);
      }

      // Center cap
      const capGeo = new THREE.CylinderGeometry(wheelRadius * 0.2, wheelRadius * 0.2, wheelThickness * 1.08, 12);
      capGeo.rotateZ(Math.PI / 2);
      const cap = new THREE.Mesh(capGeo, chromeMaterial);
      wheelAssembly.add(cap);

      return wheelAssembly;
    }

    const halfTrack = width * 0.48;
    const halfBase = specs.dimensions.wheelBase * 0.5;

    // Front Wheels are in pivot groups for steering
    const frontLeftWheel = new THREE.Group();
    frontLeftWheel.position.set(halfTrack, wheelRadius, halfBase);
    const flMesh = createWheelAssembly();
    frontLeftWheel.add(flMesh);
    group.add(frontLeftWheel);

    const frontRightWheel = new THREE.Group();
    frontRightWheel.position.set(-halfTrack, wheelRadius, halfBase);
    const frMesh = createWheelAssembly();
    frontRightWheel.add(frMesh);
    group.add(frontRightWheel);

    // Rear Wheels
    const rearLeftWheel = new THREE.Group();
    rearLeftWheel.position.set(halfTrack, wheelRadius, -halfBase);
    const rlMesh = createWheelAssembly();
    rearLeftWheel.add(rlMesh);
    group.add(rearLeftWheel);

    const rearRightWheel = new THREE.Group();
    rearRightWheel.position.set(-halfTrack, wheelRadius, -halfBase);
    const rrMesh = createWheelAssembly();
    rearRightWheel.add(rrMesh);
    group.add(rearRightWheel);

    // Shadow ground contact decal
    const shadowGeo = new THREE.PlaneGeometry(width * 1.25, length * 1.15);
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const sctx = shadowCanvas.getContext('2d');
    if (sctx) {
      const radGrad = sctx.createRadialGradient(64, 64, 20, 64, 64, 60);
      radGrad.addColorStop(0, 'rgba(0,0,0,0.7)');
      radGrad.addColorStop(0.7, 'rgba(0,0,0,0.3)');
      radGrad.addColorStop(1, 'rgba(0,0,0,0)');
      sctx.fillStyle = radGrad;
      sctx.fillRect(0, 0, 128, 128);
    }
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
    });
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = 0.02; // Ground offset
    group.add(shadowPlane);

    // --- INTERACTION METHODS ---
    const updateSteering = (steerRad: number) => {
      frontLeftWheel.rotation.y = -steerRad;
      frontRightWheel.rotation.y = -steerRad;
      cockpitSteeringWheel.rotation.z = -steerRad * 2.5; // Turn interior wheel
    };

    let totalRoll = 0;
    const updateWheelRoll = (deltaDistance: number) => {
      const rollDelta = deltaDistance / wheelRadius;
      totalRoll += rollDelta;
      flMesh.rotation.x = totalRoll;
      frMesh.rotation.x = totalRoll;
      rlMesh.rotation.x = totalRoll;
      rrMesh.rotation.x = totalRoll;
    };

    const setHeadlights = (on: boolean) => {
      headlightLenses.forEach((mesh) => {
        (mesh.material as THREE.MeshStandardMaterial).emissive.setHex(on ? headlightOffColor : 0x000000);
      });
      headlightSpots.forEach((spot) => {
        spot.intensity = on ? 4.5 : 0;
      });
    };

    const setBrakeLights = (on: boolean) => {
      brakeLights.forEach((mesh) => {
        (mesh.material as THREE.MeshStandardMaterial).emissive.setHex(on ? 0xff0000 : 0x330000);
        (mesh.material as THREE.MeshStandardMaterial).color.setHex(on ? 0xff2222 : 0x7f1d1d);
      });
    };

    const setReverseLights = (on: boolean) => {
      reverseLights.forEach((mesh) => {
        (mesh.material as THREE.MeshStandardMaterial).emissive.setHex(on ? 0xffffff : 0x000000);
      });
    };

    const setBlinkers = (left: boolean, right: boolean) => {
      leftTurnLights.forEach((mesh) => {
        (mesh.material as THREE.MeshStandardMaterial).emissive.setHex(left ? 0xf59e0b : 0x000000);
      });
      rightTurnLights.forEach((mesh) => {
        (mesh.material as THREE.MeshStandardMaterial).emissive.setHex(right ? 0xf59e0b : 0x000000);
      });
    };

    const updateCustomization = (newCustom: VehicleCustomization) => {
      bodyMaterial.color.set(newCustom.color);
      let r = 0.2;
      let m = 0.7;
      if (newCustom.finish === 'matte') {
        r = 0.85;
        m = 0.1;
      } else if (newCustom.finish === 'gloss') {
        r = 0.1;
        m = 0.2;
      }
      bodyMaterial.roughness = r;
      bodyMaterial.metalness = m;

      rimMaterial.color.set(newCustom.wheelColor);

      // Update plate texture
      const newPlateTex = Car3DBuilder.createLicensePlateTexture(newCustom.licensePlate);
      (frontPlate.material as THREE.MeshBasicMaterial).map = newPlateTex;
      (frontPlate.material as THREE.MeshBasicMaterial).needsUpdate = true;
      (rearPlate.material as THREE.MeshBasicMaterial).map = newPlateTex;
      (rearPlate.material as THREE.MeshBasicMaterial).needsUpdate = true;
    };

    return {
      group,
      bodyMesh,
      frontLeftWheel,
      frontRightWheel,
      rearLeftWheel,
      rearRightWheel,
      cockpitSteeringWheel,
      headlightLenses,
      headlightSpots,
      brakeLights,
      reverseLights,
      leftTurnLights,
      rightTurnLights,
      licensePlateMesh: rearPlate,
      updateSteering,
      updateWheelRoll,
      setHeadlights,
      setBrakeLights,
      setReverseLights,
      setBlinkers,
      updateCustomization,
    };
  }
}
