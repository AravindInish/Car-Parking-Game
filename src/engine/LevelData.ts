import { LevelConfig, EnvironmentTheme, ObstacleDef } from '../types/game';

const THEMES: {
  theme: EnvironmentTheme;
  title: string;
  timeOfDay: 'day' | 'sunset' | 'night';
}[] = [
  { theme: 'training', title: 'Beginner Training Lot', timeOfDay: 'day' },
  { theme: 'mall', title: 'Shopping Mall Plaza', timeOfDay: 'day' },
  { theme: 'multistorey', title: 'Multi-Storey Garage', timeOfDay: 'night' },
  { theme: 'city', title: 'City Downtown Avenue', timeOfDay: 'sunset' },
  { theme: 'office', title: 'Corporate Tech Center', timeOfDay: 'day' },
  { theme: 'airport', title: 'International Airport', timeOfDay: 'night' },
  { theme: 'residential', title: 'Suburban Highlands', timeOfDay: 'sunset' },
  { theme: 'underground', title: 'Metro Underground Vault', timeOfDay: 'night' },
  { theme: 'industrial', title: 'Port Cargo Terminal', timeOfDay: 'sunset' },
  { theme: 'arena', title: 'Master Driving Arena', timeOfDay: 'night' },
];

export function generateAllLevels(): LevelConfig[] {
  const levels: LevelConfig[] = [];

  for (let i = 1; i <= 100; i++) {
    const themeIndex = Math.floor((i - 1) / 10);
    const subLevel = ((i - 1) % 10) + 1; // 1 to 10
    const themeMeta = THEMES[themeIndex];

    const obstacles: ObstacleDef[] = [];
    const baseReward = 120 + i * 3;
    const parTime = Math.max(25, 45 - Math.floor(subLevel * 1.5) + (themeIndex >= 7 ? 15 : 0));

    // Dynamic procedural level design based on theme and sub-difficulty
    // Default: car starts at -Z facing +Z (forward towards +Z bay)
    let startPos: [number, number, number] = [0, 0, -18];
    let startRot = 0;
    let targetPos: [number, number, number] = [0, 0, 10];
    let targetRot = 0;
    let targetSize: [number, number] = [2.6, 5.2];
    let levelName = `${themeMeta.title} #${subLevel}`;

    if (themeMeta.theme === 'training') {
      // Levels 1-10: Beginner lot
      if (subLevel === 1) {
        levelName = 'Drive-In Bay 101';
        startPos = [0, 0, -14];
        targetPos = [0, 0, 6];
        targetRot = 0;
        // 4 cones marking lane
        obstacles.push(
          { type: 'cone', position: [-2.5, 0, -4] },
          { type: 'cone', position: [2.5, 0, -4] },
          { type: 'cone', position: [-2.5, 0, 4] },
          { type: 'cone', position: [2.5, 0, 4] }
        );
      } else if (subLevel === 2) {
        levelName = 'Wide Right Turn';
        startPos = [-8, 0, -16];
        targetPos = [6, 0, 6];
        targetRot = 0;
        obstacles.push(
          { type: 'barrier', position: [0, 0, -5], rotation: 0 },
          { type: 'cone', position: [-4, 0, 0] },
          { type: 'cone', position: [10, 0, 0] }
        );
      } else if (subLevel === 3) {
        levelName = 'Straight Reverse Bay';
        startPos = [0, 0, 4];
        targetPos = [0, 0, -14];
        targetRot = 0; // Reverse in
        targetSize = [2.8, 5.4];
        obstacles.push(
          { type: 'cone', position: [-3, 0, -6] },
          { type: 'cone', position: [3, 0, -6] }
        );
      } else if (subLevel <= 6) {
        levelName = `Angled Slalom ${subLevel}`;
        startPos = [-6 + (subLevel % 2) * 12, 0, -18];
        startRot = (subLevel % 2) * 0.2;
        targetPos = [0, 0, 12];
        targetRot = (subLevel % 3) * (Math.PI / 6);
        for (let c = -1; c <= 1; c++) {
          obstacles.push({
            type: 'cone',
            position: [c * 4 + ((subLevel * 2) % 3), 0, c * -6],
          });
        }
      } else {
        levelName = `Beginner Parallel ${subLevel}`;
        startPos = [-7, 0, -12];
        targetPos = [7, 0, 0];
        targetRot = 0;
        // Parked cars ahead and behind target slot
        obstacles.push(
          { type: 'car', position: [7, 0, 7], rotation: 0, color: '#3b82f6' },
          { type: 'car', position: [7, 0, -7], rotation: 0, color: '#64748b' }
        );
      }
    } else if (themeMeta.theme === 'mall') {
      // Levels 11-20: Mall parking
      targetPos = [(subLevel % 2 === 0 ? 6 : -6), 0, 8];
      targetRot = 0;
      startPos = [0, 0, -20];
      obstacles.push(
        { type: 'planter', position: [-10, 0, -4] },
        { type: 'planter', position: [10, 0, -4] },
        { type: 'car', position: [targetPos[0] - 3.2, 0, targetPos[2]], rotation: targetRot, color: '#eab308' },
        { type: 'car', position: [targetPos[0] + 3.2, 0, targetPos[2]], rotation: targetRot, color: '#475569' }
      );
      if (subLevel > 15) {
        obstacles.push({ type: 'barrier', position: [0, 0, -6], rotation: Math.PI / 2 });
      }
    } else if (themeMeta.theme === 'multistorey') {
      // Levels 21-30: Multi-storey garage with pillars
      levelName = `Pillar Grid ${subLevel}`;
      startPos = [-8, 0, -18];
      targetPos = [8, 0, 10];
      targetRot = Math.PI / 2; // 90 degree bay
      // Grid of concrete pillars
      for (let px = -10; px <= 10; px += 10) {
        for (let pz = -12; pz <= 12; pz += 12) {
          if (Math.abs(px - targetPos[0]) > 4 || Math.abs(pz - targetPos[2]) > 4) {
            obstacles.push({ type: 'pillar', position: [px, 0, pz] });
          }
        }
      }
      obstacles.push({ type: 'car', position: [8, 0, 14], rotation: Math.PI / 2, color: '#ef4444' });
    } else if (themeMeta.theme === 'city') {
      // Levels 31-40: City Street parking
      levelName = `Boulevard Parallel ${subLevel}`;
      startPos = [-4, 0, -22];
      targetPos = [5.5, 0, 2];
      targetRot = 0;
      obstacles.push(
        { type: 'car', position: [5.5, 0, 10], rotation: 0, color: '#0284c7' },
        { type: 'car', position: [5.5, 0, -6], rotation: 0, color: '#64748b' },
        { type: 'lamp', position: [7.5, 0, 0] },
        { type: 'lamp', position: [7.5, 0, -12] }
      );
    } else if (themeMeta.theme === 'office') {
      // Levels 41-50: Corporate park
      levelName = `Executive Bay ${subLevel}`;
      startPos = [10, 0, -18];
      startRot = Math.PI * 0.1;
      targetPos = [-8, 0, 6];
      targetRot = 0;
      obstacles.push(
        { type: 'planter', position: [-8, 0, -6] },
        { type: 'planter', position: [-8, 0, 16] },
        { type: 'car', position: [-4.8, 0, 6], rotation: 0, color: '#0f172a' },
        { type: 'car', position: [-11.2, 0, 6], rotation: 0, color: '#d97706' }
      );
    } else if (themeMeta.theme === 'airport') {
      // Levels 51-60: Airport terminal
      levelName = `Terminal Drop-off ${subLevel}`;
      startPos = [-12, 0, -20];
      targetPos = [12, 0, 10];
      targetRot = 0;
      obstacles.push(
        { type: 'barrier', position: [0, 0, -8], rotation: 0 },
        { type: 'barrier', position: [0, 0, 4], rotation: 0 },
        { type: 'cone', position: [6, 0, -4] },
        { type: 'cone', position: [-6, 0, -4] }
      );
    } else if (themeMeta.theme === 'residential') {
      // Levels 61-70: Suburban tight driveway
      levelName = `Driveway Approach ${subLevel}`;
      startPos = [0, 0, -20];
      targetPos = [-8, 0, 12];
      targetRot = Math.PI / 2;
      obstacles.push(
        { type: 'fence', position: [-14, 0, 12], rotation: Math.PI / 2 },
        { type: 'car', position: [-8, 0, 4], rotation: Math.PI / 2, color: '#84cc16' },
        { type: 'dumpster', position: [6, 0, -2] }
      );
    } else if (themeMeta.theme === 'underground') {
      // Levels 71-80: Narrow underground
      levelName = `Vault Chicanes ${subLevel}`;
      startPos = [0, 0, -24];
      targetPos = [6, 0, 16];
      targetRot = 0;
      obstacles.push(
        { type: 'pillar', position: [-5, 0, -10] },
        { type: 'pillar', position: [5, 0, 0] },
        { type: 'pillar', position: [-5, 0, 10] },
        { type: 'barrier', position: [0, 0, 6], rotation: Math.PI / 4 }
      );
    } else if (themeMeta.theme === 'industrial') {
      // Levels 81-90: Heavy industrial dock
      levelName = `Loading Dock ${subLevel}`;
      startPos = [14, 0, -22];
      targetPos = [-10, 0, 14];
      targetRot = 0;
      targetSize = [2.4, 5.0]; // tighter clearance
      obstacles.push(
        { type: 'barrier', position: [4, 0, -8], scale: [1.5, 1.2, 1.5] },
        { type: 'barrier', position: [-4, 0, 4], scale: [1.5, 1.2, 1.5] },
        { type: 'dumpster', position: [-14, 0, 14] },
        { type: 'car', position: [-6, 0, 14], rotation: 0, color: '#e11d48' }
      );
    } else {
      // Levels 91-100: Advanced Challenge Arena
      if (i === 100) {
        levelName = 'Championship Crown: Master 100';
      } else {
        levelName = `Apex Gauntlet ${subLevel}`;
      }
      startPos = [0, 0, -26];
      targetPos = [0, 0, 20];
      targetRot = 0;
      targetSize = [2.3, 4.9]; // extreme precision

      // Dense challenging obstacle course
      for (let s = -18; s <= 18; s += 7) {
        obstacles.push({
          type: 'cone',
          position: [Math.sin(s * 0.7) * 7, 0, s],
        });
      }
      obstacles.push(
        { type: 'barrier', position: [-7, 0, 10], rotation: 0 },
        { type: 'barrier', position: [7, 0, 10], rotation: 0 },
        { type: 'car', position: [-3.3, 0, 20], rotation: 0, color: '#f59e0b' },
        { type: 'car', position: [3.3, 0, 20], rotation: 0, color: '#9333ea' }
      );
    }

    levels.push({
      id: i,
      name: levelName,
      environment: themeMeta.theme,
      environmentName: themeMeta.title,
      description: `Maneuver and park within designated boundaries. Avoid collisions and watch your time.`,
      startPosition: startPos,
      startRotation: startRot,
      targetPosition: targetPos,
      targetRotation: targetRot,
      targetSize,
      obstacles,
      parTime,
      rewardCoins: baseReward,
      timeOfDay: themeMeta.timeOfDay,
    });
  }

  return levels;
}

export const ALL_LEVELS: LevelConfig[] = generateAllLevels();
