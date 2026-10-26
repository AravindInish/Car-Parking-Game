import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  VehicleId,
  VehicleCustomization,
  VehicleUpgrades,
  PlayerProfile,
  PaintFinish,
  HeadlightTint,
} from '../types/game';
import { VEHICLE_CONFIGS, UPGRADE_CATEGORIES, getUpgradeCost } from '../engine/VehicleData';
import { Car3DBuilder, CarModelInstance } from '../models/Car3DBuilder';
import { SoundEffects } from '../audio/SoundEffects';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Wrench,
  Palette,
  Shield,
  Gauge,
  CircleDot,
  Flame,
  Disc,
  Compass,
  Activity,
  Check,
} from 'lucide-react';

interface ShowroomViewProps {
  profile: PlayerProfile;
  onUpdateProfile: (newProfile: PlayerProfile) => void;
  onBackToMenu: () => void;
}

export const ShowroomView: React.FC<ShowroomViewProps> = ({
  profile,
  onUpdateProfile,
  onBackToMenu,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleId>(profile.selectedVehicle);
  const [activeTab, setActiveTab] = useState<'specs' | 'customize' | 'upgrades'>('specs');

  // Three.js refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const turntableRef = useRef<THREE.Group | null>(null);
  const carModelRef = useRef<CarModelInstance | null>(null);
  const isDraggingRef = useRef(false);
  const prevMouseXRef = useRef(0);

  const vehicleList: VehicleId[] = ['hatchback', 'sedan', 'sport', 'suv'];
  const specs = VEHICLE_CONFIGS[selectedVehicle];
  const isOwned = profile.ownedVehicles.includes(selectedVehicle);
  const isEquipped = profile.selectedVehicle === selectedVehicle;
  const currentUpgrades = profile.upgrades[selectedVehicle];
  const currentCustom = profile.customizations[selectedVehicle];

  // Initialize Three.js Showroom Scene
  useEffect(() => {
    if (!mountRef.current) return;
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0b0f19);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 2.2, 7.5);
    camera.lookAt(0, 0.8, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Showroom Turntable Group
    const turntable = new THREE.Group();
    scene.add(turntable);
    turntableRef.current = turntable;

    // Rotating Showcase Platform
    const platformGeo = new THREE.CylinderGeometry(4.2, 4.4, 0.25, 48);
    const platformMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.8,
      roughness: 0.2,
    });
    const platformMesh = new THREE.Mesh(platformGeo, platformMat);
    platformMesh.position.y = -0.125;
    platformMesh.receiveShadow = true;
    turntable.add(platformMesh);

    // Glowing Platform Edge Ring
    const ringGeo = new THREE.TorusGeometry(4.25, 0.04, 16, 64);
    ringGeo.rotateX(Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.y = 0.01;
    turntable.add(ringMesh);

    // Studio Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfffbeb, 2.8);
    keyLight.position.set(6, 8, 8);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    fillLight.position.set(-6, 4, -4);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 1.8);
    rimLight.position.set(0, 5, -8);
    scene.add(rimLight);

    // Load initial Car Model
    const carInstance = Car3DBuilder.buildCar(selectedVehicle, currentCustom);
    turntable.add(carInstance.group);
    carModelRef.current = carInstance;
    carInstance.setHeadlights(true);

    // Render loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (!isDraggingRef.current && turntableRef.current) {
        turntableRef.current.rotation.y += 0.004; // Slow auto turntable spin
      }
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update car model whenever selected vehicle or customization changes
  useEffect(() => {
    if (!turntableRef.current) return;
    if (carModelRef.current) {
      turntableRef.current.remove(carModelRef.current.group);
    }
    const newCarInstance = Car3DBuilder.buildCar(selectedVehicle, profile.customizations[selectedVehicle]);
    turntableRef.current.add(newCarInstance.group);
    carModelRef.current = newCarInstance;
    newCarInstance.setHeadlights(true);
  }, [selectedVehicle, profile.customizations]);

  // Mouse / Touch turntable drag
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    prevMouseXRef.current = e.clientX;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || !turntableRef.current) return;
    const deltaX = e.clientX - prevMouseXRef.current;
    prevMouseXRef.current = e.clientX;
    turntableRef.current.rotation.y += deltaX * 0.01;
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  // Actions
  const handlePurchase = () => {
    if (profile.coins < specs.price) return;
    const updated: PlayerProfile = {
      ...profile,
      coins: profile.coins - specs.price,
      ownedVehicles: [...profile.ownedVehicles, selectedVehicle],
      selectedVehicle: selectedVehicle,
    };
    SoundEffects.playUpgradeSuccess();
    onUpdateProfile(updated);
  };

  const handleSelectVehicle = () => {
    const updated: PlayerProfile = {
      ...profile,
      selectedVehicle,
    };
    SoundEffects.playClick();
    onUpdateProfile(updated);
  };

  const handleBuyUpgrade = (cat: keyof VehicleUpgrades) => {
    const currentTier = currentUpgrades[cat];
    if (currentTier >= 5) return;
    const cost = getUpgradeCost(cat, currentTier);
    if (profile.coins < cost) return;

    const newUpgrades = {
      ...profile.upgrades,
      [selectedVehicle]: {
        ...currentUpgrades,
        [cat]: currentTier + 1,
      },
    };

    const updated: PlayerProfile = {
      ...profile,
      coins: profile.coins - cost,
      upgrades: newUpgrades,
    };
    SoundEffects.playUpgradeSuccess();
    onUpdateProfile(updated);
  };

  const handleCustomizationChange = (key: keyof VehicleCustomization, val: unknown) => {
    const newCustoms = {
      ...profile.customizations,
      [selectedVehicle]: {
        ...currentCustom,
        [key]: val,
      },
    };
    const updated: PlayerProfile = {
      ...profile,
      customizations: newCustoms,
    };
    SoundEffects.playClick();
    onUpdateProfile(updated);
    if (carModelRef.current) {
      carModelRef.current.updateCustomization(newCustoms[selectedVehicle]);
    }
  };

  const COLORS = [
    { label: 'Rosso Corsa', hex: '#dc2626' },
    { label: 'Midnight Blue', hex: '#1e3a8a' },
    { label: 'Alpine White', hex: '#f8fafc' },
    { label: 'Stealth Obsidian', hex: '#09090b' },
    { label: 'Emerald Green', hex: '#15803d' },
    { label: 'Sunburst Gold', hex: '#eab308' },
    { label: 'Laser Cyan', hex: '#06b6d4' },
    { label: 'Deep Purple', hex: '#7e22ce' },
  ];

  return (
    <div className="relative w-full h-screen bg-slate-950 flex flex-col overflow-hidden text-slate-100 select-none">
      {/* 3D Canvas Background */}
      <div
        ref={mountRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="absolute inset-0 cursor-grab active:cursor-grabbing z-0"
      />

      {/* TOP BAR */}
      <div className="relative z-10 flex items-center justify-between p-4 md:p-6 bg-gradient-to-b from-slate-950/80 to-transparent pointer-events-auto">
        <button
          onClick={onBackToMenu}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700/60 transition-colors shadow-lg active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-semibold">Back to Menu</span>
        </button>

        <h1 className="text-lg md:text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <span>Vehicle Showroom & Workshop</span>
        </h1>

        {/* Coin Balance */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/80 border border-slate-700/60 text-amber-400 font-mono font-bold text-sm md:text-base shadow-lg">
          <span>🪙</span>
          <span>{profile.coins.toLocaleString()} Coins</span>
        </div>
      </div>

      {/* BOTTOM CONTROL DOCK (Collapsible & Unobstructed per guidelines) */}
      <div className="relative z-10 mt-auto p-4 md:p-6 flex flex-col items-center pointer-events-auto">
        {/* VEHICLE SELECTION CAROUSEL BAR */}
        <div className="flex items-center gap-2 md:gap-4 mb-4 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-2 shadow-2xl">
          {vehicleList.map((id) => {
            const vSpec = VEHICLE_CONFIGS[id];
            const owned = profile.ownedVehicles.includes(id);
            const isSelected = selectedVehicle === id;
            return (
              <button
                key={id}
                onClick={() => {
                  setSelectedVehicle(id);
                  SoundEffects.playClick();
                }}
                className={`px-3 md:px-5 py-2.5 rounded-xl font-medium text-xs md:text-sm transition-all flex flex-col items-start ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-lg scale-105'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span>{vSpec.name}</span>
                <span className={`text-[10px] ${isSelected ? 'text-slate-900' : 'text-slate-400'}`}>
                  {owned ? '✓ Owned' : `🪙 ${vSpec.price.toLocaleString()}`}
                </span>
              </button>
            );
          })}
        </div>

        {/* WORKSHOP DETAILS DOCK (Specs, Customize, Upgrades) */}
        <div className="w-full max-w-4xl bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-2xl p-4 md:p-5 shadow-2xl flex flex-col gap-4">
          {/* Header tabs & primary action */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('specs')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === 'specs' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Specifications
              </button>
              <button
                onClick={() => setActiveTab('customize')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  activeTab === 'customize' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>Customization</span>
              </button>
              <button
                onClick={() => setActiveTab('upgrades')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  activeTab === 'upgrades' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Performance Upgrades</span>
              </button>
            </div>

            {/* Equip / Purchase Button */}
            <div>
              {isOwned ? (
                <button
                  onClick={handleSelectVehicle}
                  disabled={isEquipped}
                  className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    isEquipped
                      ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 cursor-default'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg active:scale-95'
                  }`}
                >
                  {isEquipped ? '✓ EQUIPPED' : 'DRIVE THIS CAR'}
                </button>
              ) : (
                <button
                  onClick={handlePurchase}
                  disabled={profile.coins < specs.price}
                  className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg ${
                    profile.coins >= specs.price
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 active:scale-95'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  }`}
                >
                  <span>PURCHASE FOR 🪙 {specs.price.toLocaleString()}</span>
                </button>
              )}
            </div>
          </div>

          {/* TAB 1: SPECS */}
          {activeTab === 'specs' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block mb-1">Max Speed</span>
                <span className="text-base font-bold text-white font-mono">{specs.maxSpeed} km/h</span>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block mb-1">Acceleration</span>
                <span className="text-base font-bold text-white font-mono">{specs.acceleration} m/s²</span>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block mb-1">Braking Power</span>
                <span className="text-base font-bold text-white font-mono">{specs.brakingPower} m/s²</span>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block mb-1">Turning Radius</span>
                <span className="text-base font-bold text-white font-mono">{specs.turningRadius} m</span>
              </div>
            </div>
          )}

          {/* TAB 2: CUSTOMIZE */}
          {activeTab === 'customize' && (
            <div className="flex flex-col gap-3 text-xs">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="text-slate-400 font-semibold w-24">Body Color:</span>
                <div className="flex items-center gap-2 flex-wrap">
                  {COLORS.map((c) => (
                    <button
                      key={c.hex}
                      onClick={() => handleCustomizationChange('color', c.hex)}
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${
                        currentCustom.color === c.hex ? 'scale-125 border-white shadow-lg' : 'border-transparent hover:scale-110'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-slate-400 font-semibold w-24">Paint Finish:</span>
                <div className="flex items-center gap-2">
                  {(['gloss', 'metallic', 'matte'] as PaintFinish[]).map((finish) => (
                    <button
                      key={finish}
                      onClick={() => handleCustomizationChange('finish', finish)}
                      className={`px-3 py-1.5 rounded-lg font-medium capitalize transition-colors ${
                        currentCustom.finish === finish ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300 hover:text-white'
                      }`}
                    >
                      {finish}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-slate-400 font-semibold w-24">Headlights:</span>
                <div className="flex items-center gap-2">
                  {(['pure', 'xenon', 'cyan', 'amber'] as HeadlightTint[]).map((tint) => (
                    <button
                      key={tint}
                      onClick={() => handleCustomizationChange('headlightTint', tint)}
                      className={`px-3 py-1.5 rounded-lg font-medium capitalize transition-colors ${
                        currentCustom.headlightTint === tint ? 'bg-cyan-600 text-white font-bold' : 'bg-slate-800 text-slate-300 hover:text-white'
                      }`}
                    >
                      {tint}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-slate-400 font-semibold w-24">License Plate:</span>
                <input
                  type="text"
                  maxLength={8}
                  value={currentCustom.licensePlate}
                  onChange={(e) => handleCustomizationChange('licensePlate', e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono font-bold tracking-widest uppercase w-36"
                />
              </div>
            </div>
          )}

          {/* TAB 3: UPGRADES */}
          {activeTab === 'upgrades' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto pr-1">
              {(Object.keys(UPGRADE_CATEGORIES) as (keyof VehicleUpgrades)[]).map((cat) => {
                const info = UPGRADE_CATEGORIES[cat];
                const tier = currentUpgrades[cat];
                const cost = getUpgradeCost(cat, tier);
                const isMax = tier >= 5;
                const canAfford = profile.coins >= cost;

                return (
                  <div key={cat} className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5 font-bold text-white">
                        <span>{info.name}</span>
                        <span className="text-amber-400 font-mono">Lv {tier}/5</span>
                      </div>
                      <span className="text-[11px] text-slate-400">{info.statEffect(tier + 1)}</span>
                    </div>

                    <button
                      onClick={() => handleBuyUpgrade(cat)}
                      disabled={isMax || !canAfford}
                      className={`px-3 py-1.5 rounded-lg font-mono font-bold text-xs transition-all ${
                        isMax
                          ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                          : canAfford
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 active:scale-95 shadow'
                          : 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed'
                      }`}
                    >
                      {isMax ? 'MAXED' : `🪙 ${cost.toLocaleString()}`}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
