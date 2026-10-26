import * as THREE from 'three';
import { EnvironmentTheme, ObstacleDef, LevelConfig } from '../types/game';

export interface EnvironmentScene {
  group: THREE.Group;
  targetBayMesh: THREE.Group;
  targetOutline: THREE.LineSegments;
  targetArrows: THREE.Group;
  obstacleColliders: {
    type: string;
    box: THREE.Box3;
    mesh: THREE.Object3D;
    radius: number;
    center: THREE.Vector3;
  }[];
  updateTargetState: (alignmentPct: number, inZone: boolean) => void;
  dispose: () => void;
}

export class Environment3DBuilder {
  public static createRoadTexture(theme: EnvironmentTheme): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      if (theme === 'mall' || theme === 'office') {
        // Paver stone tiles
        ctx.fillStyle = '#334155';
        ctx.fillRect(0, 0, 512, 512);
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 4;
        for (let x = 0; x <= 512; x += 64) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, 512);
          ctx.stroke();
        }
        for (let y = 0; y <= 512; y += 64) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(512, y);
          ctx.stroke();
        }
      } else if (theme === 'multistorey' || theme === 'underground') {
        // Smooth industrial concrete with expansion joints
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, 512, 512);
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 3;
        ctx.strokeRect(0, 0, 512, 512);
      } else {
        // Realistic Asphalt
        ctx.fillStyle = '#18181b';
        ctx.fillRect(0, 0, 512, 512);
        // Subtle noise
        for (let i = 0; i < 4000; i++) {
          const nx = Math.random() * 512;
          const ny = Math.random() * 512;
          ctx.fillStyle = Math.random() > 0.5 ? '#27272a' : '#09090b';
          ctx.fillRect(nx, ny, 2, 2);
        }
      }
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(16, 16);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  public static buildEnvironment(level: LevelConfig): EnvironmentScene {
    const group = new THREE.Group();
    group.name = `env_${level.environment}_level_${level.id}`;

    const roadTex = this.createRoadTexture(level.environment);

    // 1. GROUND PLANE (Asphalt / Floor)
    const floorGeo = new THREE.PlaneGeometry(120, 120);
    const floorMat = new THREE.MeshStandardMaterial({
      map: roadTex,
      roughness: level.environment === 'underground' || level.environment === 'multistorey' ? 0.35 : 0.85,
      metalness: 0.1,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = true;
    group.add(floorMesh);

    // 2. PARKING LOT LINES & LANE MARKINGS
    const markingMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.7,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });

    const yellowMarkingMat = new THREE.MeshBasicMaterial({
      color: 0xfacc15,
      transparent: true,
      opacity: 0.8,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });

    // Draw regular bay lines along left and right flanks
    const lineGeo = new THREE.PlaneGeometry(0.15, 5.0);
    for (let side = -1; side <= 1; side += 2) {
      for (let z = -30; z <= 30; z += 3.5) {
        const lineMesh = new THREE.Mesh(lineGeo, markingMat);
        lineMesh.rotation.x = -Math.PI / 2;
        lineMesh.position.set(side * 10, 0.02, z);
        group.add(lineMesh);
      }
    }

    // Yellow Center Divider Line
    const centerLineGeo = new THREE.PlaneGeometry(0.2, 70);
    const centerLine = new THREE.Mesh(centerLineGeo, yellowMarkingMat);
    centerLine.rotation.x = -Math.PI / 2;
    centerLine.position.set(0, 0.02, 0);
    group.add(centerLine);

    // 3. PERIMETER BOUNDARIES / WALLS
    const wallGeo = new THREE.BoxGeometry(100, 2.5, 0.8);
    const wallMat = new THREE.MeshStandardMaterial({
      color: level.environment === 'underground' ? 0x334155 : 0x475569,
      roughness: 0.9,
    });

    // North Wall
    const nWall = new THREE.Mesh(wallGeo, wallMat);
    nWall.position.set(0, 1.25, -45);
    nWall.castShadow = true;
    nWall.receiveShadow = true;
    group.add(nWall);

    // South Wall
    const sWall = new THREE.Mesh(wallGeo, wallMat);
    sWall.position.set(0, 1.25, 45);
    sWall.castShadow = true;
    sWall.receiveShadow = true;
    group.add(sWall);

    // East/West Walls
    const sideWallGeo = new THREE.BoxGeometry(0.8, 2.5, 90);
    const eWall = new THREE.Mesh(sideWallGeo, wallMat);
    eWall.position.set(35, 1.25, 0);
    eWall.castShadow = true;
    group.add(eWall);

    const wWall = new THREE.Mesh(sideWallGeo, wallMat);
    wWall.position.set(-35, 1.25, 0);
    wWall.castShadow = true;
    group.add(wWall);

    // 4. THEME SPECIFIC PROPS & CEILING (if garage)
    if (level.environment === 'multistorey' || level.environment === 'underground') {
      // Concrete Ceiling Slab
      const ceilingGeo = new THREE.PlaneGeometry(80, 90);
      const ceilingMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        roughness: 0.9,
      });
      const ceilingMesh = new THREE.Mesh(ceilingGeo, ceilingMat);
      ceilingMesh.rotation.x = Math.PI / 2;
      ceilingMesh.position.set(0, 5.5, 0);
      group.add(ceilingMesh);

      // Fluorescent Lights overhead
      for (let fz = -30; fz <= 30; fz += 15) {
        const lightGeo = new THREE.BoxGeometry(0.3, 0.1, 4.0);
        const lightMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe });
        const stripMesh = new THREE.Mesh(lightGeo, lightMat);
        stripMesh.position.set(0, 5.4, fz);
        group.add(stripMesh);

        const pointLight = new THREE.PointLight(0xe0f2fe, 1.5, 18);
        pointLight.position.set(0, 5.0, fz);
        group.add(pointLight);
      }
    } else if (level.environment === 'city' || level.environment === 'office') {
      // Background City Skyline Buildings
      const bldgGeo = new THREE.BoxGeometry(16, 28, 16);
      const bldgMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 });
      for (let bx = -48; bx <= 48; bx += 24) {
        const bldg = new THREE.Mesh(bldgGeo, bldgMat);
        bldg.position.set(bx, 14, -56);
        group.add(bldg);
      }
    }

    // 5. OBSTACLES & COLLIDERS
    const obstacleColliders: EnvironmentScene['obstacleColliders'] = [];

    // Add perimeter boundaries to colliders
    [
      { box: new THREE.Box3(new THREE.Vector3(-50, 0, -46), new THREE.Vector3(50, 4, -44)), name: 'North Wall' },
      { box: new THREE.Box3(new THREE.Vector3(-50, 0, 44), new THREE.Vector3(50, 4, 46)), name: 'South Wall' },
      { box: new THREE.Box3(new THREE.Vector3(34, 0, -45), new THREE.Vector3(36, 4, 45)), name: 'East Wall' },
      { box: new THREE.Box3(new THREE.Vector3(-36, 0, -45), new THREE.Vector3(-34, 4, 45)), name: 'West Wall' },
    ].forEach((b) => {
      const center = new THREE.Vector3();
      b.box.getCenter(center);
      obstacleColliders.push({
        type: 'wall',
        box: b.box,
        mesh: nWall,
        radius: 65,
        center,
      });
    });

    level.obstacles.forEach((obs, idx) => {
      const obsGroup = new THREE.Group();
      obsGroup.position.set(obs.position[0], obs.position[1], obs.position[2]);
      if (obs.rotation) obsGroup.rotation.y = obs.rotation;
      if (obs.scale) obsGroup.scale.set(obs.scale[0], obs.scale[1], obs.scale[2]);

      let colliderRadius = 1.0;
      let colliderBox = new THREE.Box3();

      if (obs.type === 'cone') {
        // High visibility orange traffic cone with reflective white collar
        const coneGeo = new THREE.ConeGeometry(0.28, 0.75, 12);
        const coneMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.4 });
        const coneMesh = new THREE.Mesh(coneGeo, coneMat);
        coneMesh.position.y = 0.375;
        coneMesh.castShadow = true;
        obsGroup.add(coneMesh);

        // Cone Base
        const baseGeo = new THREE.BoxGeometry(0.55, 0.06, 0.55);
        const baseMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.8 });
        const baseMesh = new THREE.Mesh(baseGeo, baseMat);
        baseMesh.position.y = 0.03;
        obsGroup.add(baseMesh);

        // Reflective band
        const bandGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.16, 12);
        const bandMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const bandMesh = new THREE.Mesh(bandGeo, bandMat);
        bandMesh.position.y = 0.38;
        obsGroup.add(bandMesh);

        colliderRadius = 0.4;
        colliderBox.setFromCenterAndSize(
          new THREE.Vector3(obs.position[0], 0.375, obs.position[2]),
          new THREE.Vector3(0.6, 0.8, 0.6)
        );
      } else if (obs.type === 'barrier') {
        // Concrete Jersey Barrier with red/white caution stripes
        const barrierGeo = new THREE.BoxGeometry(2.4, 0.85, 0.65);
        const barrierMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.7 });
        const barrierMesh = new THREE.Mesh(barrierGeo, barrierMat);
        barrierMesh.position.y = 0.425;
        barrierMesh.castShadow = true;
        barrierMesh.receiveShadow = true;
        obsGroup.add(barrierMesh);

        // Hazard chevron stripe
        const stripeGeo = new THREE.BoxGeometry(2.42, 0.2, 0.66);
        const stripeMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.5 });
        const stripeMesh = new THREE.Mesh(stripeGeo, stripeMat);
        stripeMesh.position.y = 0.55;
        obsGroup.add(stripeMesh);

        colliderRadius = 1.3;
        colliderBox.setFromCenterAndSize(
          new THREE.Vector3(obs.position[0], 0.425, obs.position[2]),
          new THREE.Vector3(2.5, 0.9, 0.8)
        );
      } else if (obs.type === 'pillar') {
        // Heavy Concrete Column with yellow warning base
        const pillarGeo = new THREE.CylinderGeometry(0.6, 0.6, 4.5, 16);
        const pillarMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.8 });
        const pillarMesh = new THREE.Mesh(pillarGeo, pillarMat);
        pillarMesh.position.y = 2.25;
        pillarMesh.castShadow = true;
        obsGroup.add(pillarMesh);

        // Yellow warning base
        const pBaseGeo = new THREE.CylinderGeometry(0.64, 0.64, 0.9, 16);
        const pBaseMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.5 });
        const pBaseMesh = new THREE.Mesh(pBaseGeo, pBaseMat);
        pBaseMesh.position.y = 0.45;
        obsGroup.add(pBaseMesh);

        colliderRadius = 0.7;
        colliderBox.setFromCenterAndSize(
          new THREE.Vector3(obs.position[0], 2.25, obs.position[2]),
          new THREE.Vector3(1.3, 4.5, 1.3)
        );
      } else if (obs.type === 'car') {
        // Stationary parked AI vehicle
        const carHullGeo = new THREE.BoxGeometry(1.8, 1.3, 4.4);
        const carColor = obs.color || '#3b82f6';
        const carMat = new THREE.MeshStandardMaterial({
          color: carColor,
          roughness: 0.2,
          metalness: 0.6,
        });
        const carMesh = new THREE.Mesh(carHullGeo, carMat);
        carMesh.position.y = 0.75;
        carMesh.castShadow = true;
        carMesh.receiveShadow = true;
        obsGroup.add(carMesh);

        // Windows
        const cabinGeo = new THREE.BoxGeometry(1.6, 0.65, 2.4);
        const glassMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1 });
        const cabin = new THREE.Mesh(cabinGeo, glassMat);
        cabin.position.set(0, 1.45, -0.2);
        obsGroup.add(cabin);

        // 4 wheels
        const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.25, 12);
        wheelGeo.rotateZ(Math.PI / 2);
        const wMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
        [[-0.9, 1.3], [0.9, 1.3], [-0.9, -1.3], [0.9, -1.3]].forEach(([wx, wz]) => {
          const w = new THREE.Mesh(wheelGeo, wMat);
          w.position.set(wx, 0.35, wz);
          obsGroup.add(w);
        });

        colliderRadius = 2.4;
        colliderBox.setFromCenterAndSize(
          new THREE.Vector3(obs.position[0], 0.75, obs.position[2]),
          new THREE.Vector3(2.0, 1.5, 4.6)
        );
      } else {
        // Generic box / planter / dumpster
        const boxGeo = new THREE.BoxGeometry(1.6, 1.0, 1.6);
        const boxMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.7 });
        const boxMesh = new THREE.Mesh(boxGeo, boxMat);
        boxMesh.position.y = 0.5;
        boxMesh.castShadow = true;
        obsGroup.add(boxMesh);

        colliderRadius = 1.0;
        colliderBox.setFromCenterAndSize(
          new THREE.Vector3(obs.position[0], 0.5, obs.position[2]),
          new THREE.Vector3(1.7, 1.1, 1.7)
        );
      }

      group.add(obsGroup);

      obstacleColliders.push({
        type: obs.type,
        box: colliderBox,
        mesh: obsGroup,
        radius: colliderRadius,
        center: new THREE.Vector3(obs.position[0], 0.5, obs.position[2]),
      });
    });

    // 6. TARGET PARKING BAY
    const targetBayGroup = new THREE.Group();
    targetBayGroup.position.set(level.targetPosition[0], 0.05, level.targetPosition[2]);
    targetBayGroup.rotation.y = level.targetRotation;

    const [tWidth, tLength] = level.targetSize;

    // Glowing Hologram Floor Zone
    const zoneGeo = new THREE.PlaneGeometry(tWidth, tLength);
    const zoneMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b, // Amber initially
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const zoneMesh = new THREE.Mesh(zoneGeo, zoneMat);
    zoneMesh.rotation.x = -Math.PI / 2;
    targetBayGroup.add(zoneMesh);

    // Glowing Neon Bounding Box Outline
    const outlineGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(tWidth, 0.5, tLength));
    const outlineMat = new THREE.LineBasicMaterial({
      color: 0xf59e0b,
      linewidth: 3,
    });
    const targetOutline = new THREE.LineSegments(outlineGeo, outlineMat);
    targetOutline.position.y = 0.25;
    targetBayGroup.add(targetOutline);

    // Directional Chevrons / Arrow
    const targetArrows = new THREE.Group();
    const arrowGeo = new THREE.ConeGeometry(0.6, 1.2, 3);
    const arrowMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.85 });
    const arrowMesh = new THREE.Mesh(arrowGeo, arrowMat);
    arrowMesh.rotation.x = Math.PI / 2;
    arrowMesh.rotation.z = 0; // Point towards +Z (bay depth)
    arrowMesh.position.set(0, 0.1, 0);
    targetArrows.add(arrowMesh);

    // Flanking parking curb markers
    const curbGeo = new THREE.BoxGeometry(0.15, 0.15, tLength);
    const curbMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 });
    const leftCurb = new THREE.Mesh(curbGeo, curbMat);
    leftCurb.position.set(-tWidth * 0.5, 0.08, 0);
    targetBayGroup.add(leftCurb);

    const rightCurb = new THREE.Mesh(curbGeo, curbMat);
    rightCurb.position.set(tWidth * 0.5, 0.08, 0);
    targetBayGroup.add(rightCurb);

    const backCurbGeo = new THREE.BoxGeometry(tWidth, 0.15, 0.15);
    const backCurb = new THREE.Mesh(backCurbGeo, curbMat);
    backCurb.position.set(0, 0.08, tLength * 0.5);
    targetBayGroup.add(backCurb);

    targetBayGroup.add(targetArrows);
    group.add(targetBayGroup);

    // UPDATE TARGET STATUS (Color shift: Yellow -> Green when aligned & in zone)
    const updateTargetState = (alignmentPct: number, inZone: boolean) => {
      let targetColor = 0xf59e0b; // Amber default
      if (inZone && alignmentPct > 85) {
        targetColor = 0x22c55e; // Bright Green when perfectly positioned
      } else if (inZone) {
        targetColor = 0xeab308; // Yellow when inside but adjusting
      }

      zoneMat.color.setHex(targetColor);
      outlineMat.color.setHex(targetColor);
      arrowMat.color.setHex(targetColor);

      // Subtle float oscillation of arrow
      targetArrows.position.y = 0.05 + Math.sin(Date.now() * 0.005) * 0.05;
    };

    const dispose = () => {
      floorGeo.dispose();
      floorMat.dispose();
      roadTex.dispose();
      wallGeo.dispose();
      wallMat.dispose();
      zoneGeo.dispose();
      zoneMat.dispose();
      outlineGeo.dispose();
      outlineMat.dispose();
    };

    return {
      group,
      targetBayMesh: targetBayGroup,
      targetOutline,
      targetArrows,
      obstacleColliders,
      updateTargetState,
      dispose,
    };
  }
}
