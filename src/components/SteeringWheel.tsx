import React, { useRef, useState, useEffect, useCallback } from 'react';

interface SteeringWheelProps {
  steerValue: number; // -1 to 1
  onChange: (value: number) => void;
  sensitivity?: number;
}

export const SteeringWheel: React.FC<SteeringWheelProps> = ({
  steerValue,
  onChange,
  sensitivity = 1.0,
}) => {
  const wheelRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [wheelAngle, setWheelAngle] = useState(0); // degrees, -270 to +270
  const dragCenterRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Sync angle from steerValue if not currently dragging
  useEffect(() => {
    if (!isDragging) {
      setWheelAngle(steerValue * 270);
    }
  }, [steerValue, isDragging]);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    if (wheelRef.current) {
      const rect = wheelRef.current.getBoundingClientRect();
      dragCenterRef.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    const center = dragCenterRef.current;
    const dx = e.clientX - center.x;
    const dy = e.clientY - center.y;

    // Calculate angle in degrees
    let angleRad = Math.atan2(dy, dx) + Math.PI / 2;
    if (angleRad > Math.PI) angleRad -= Math.PI * 2;
    let angleDeg = (angleRad * 180) / Math.PI;

    // Apply sensitivity clamp
    angleDeg = Math.max(-270, Math.min(270, angleDeg * sensitivity));
    setWheelAngle(angleDeg);

    const normalized = angleDeg / 270;
    onChange(normalized);
  }, [isDragging, sensitivity, onChange]);

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Safe ignore
    }
    // Return to center
    onChange(0);
  };

  return (
    <div className="relative flex flex-col items-center select-none touch-none">
      <div
        ref={wheelRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="w-36 h-36 md:w-44 md:h-44 rounded-full cursor-grab active:cursor-grabbing relative flex items-center justify-center transition-transform duration-75 drop-shadow-[0_12px_24px_rgba(0,0,0,0.7)]"
        style={{
          transform: `rotate(${wheelAngle}deg)`,
        }}
      >
        <svg
          viewBox="0 0 400 400"
          className="w-full h-full filter drop-shadow-lg"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Rich Walnut / Mahogany Woodgrain Gradients */}
            <linearGradient id="walnutWoodTop" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1e1008" />
              <stop offset="15%" stopColor="#452416" />
              <stop offset="30%" stopColor="#63341e" />
              <stop offset="45%" stopColor="#3d1d10" />
              <stop offset="55%" stopColor="#7a3f24" />
              <stop offset="70%" stopColor="#452416" />
              <stop offset="85%" stopColor="#693721" />
              <stop offset="100%" stopColor="#1e1008" />
            </linearGradient>

            <linearGradient id="walnutWoodBottom" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2c160e" />
              <stop offset="40%" stopColor="#5a2e1b" />
              <stop offset="60%" stopColor="#753d24" />
              <stop offset="100%" stopColor="#22110a" />
            </linearGradient>

            {/* Glossy Lacquer Sheen Overlay */}
            <linearGradient id="glossHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
              <stop offset="35%" stopColor="#ffffff" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.6" />
            </linearGradient>

            {/* Black Stitched Leather Texture */}
            <linearGradient id="leatherGrip" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2b313a" />
              <stop offset="50%" stopColor="#171b21" />
              <stop offset="100%" stopColor="#0b0d10" />
            </linearGradient>

            {/* Metallic Gold Emblem Gradient */}
            <linearGradient id="goldEmblem" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#e5c07b" />
              <stop offset="30%" stopColor="#fff3d1" />
              <stop offset="50%" stopColor="#d4af37" />
              <stop offset="75%" stopColor="#997b24" />
              <stop offset="100%" stopColor="#f3e5ab" />
            </linearGradient>

            {/* Dark Satin Metal Spoke Finish */}
            <linearGradient id="satinMetal" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#333b47" />
              <stop offset="50%" stopColor="#1e232b" />
              <stop offset="100%" stopColor="#101317" />
            </linearGradient>

            {/* Drop Shadows */}
            <filter id="hubShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#000000" floodOpacity="0.8" />
            </filter>
            <filter id="innerBevel" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#ffffff" floodOpacity="0.25" />
            </filter>
          </defs>

          {/* 1. OUTER RIM SHADOW / BACKPLATE */}
          <circle cx="200" cy="200" r="190" fill="#090a0d" />

          {/* 2. MAIN RIM BASE RING */}
          <circle
            cx="200"
            cy="200"
            r="165"
            fill="none"
            stroke="#12161c"
            strokeWidth="50"
          />

          {/* 3. TOP WOODGRAIN ARCH (From ~10 o'clock to 2 o'clock) */}
          <path
            d="M 85 110 A 165 165 0 0 1 315 110"
            fill="none"
            stroke="url(#walnutWoodTop)"
            strokeWidth="48"
            strokeLinecap="round"
          />
          {/* Top Gloss Lacquer Reflection Strip */}
          <path
            d="M 95 102 A 165 165 0 0 1 305 102"
            fill="none"
            stroke="url(#glossHighlight)"
            strokeWidth="10"
            strokeLinecap="round"
            opacity="0.8"
          />

          {/* 4. BOTTOM WOODGRAIN SPOKE ARCHES (4:30 to 7:30) */}
          <path
            d="M 108 300 A 165 165 0 0 0 292 300"
            fill="none"
            stroke="url(#walnutWoodBottom)"
            strokeWidth="46"
            strokeLinecap="round"
          />
          <path
            d="M 120 306 A 165 165 0 0 0 280 306"
            fill="none"
            stroke="url(#glossHighlight)"
            strokeWidth="8"
            opacity="0.6"
          />

          {/* 5. SIDE LEATHER GRIPS WITH ERGONOMIC THUMB RESTS */}
          {/* Left Grip (9 o'clock) */}
          <path
            d="M 82 105 A 165 165 0 0 0 112 305"
            fill="none"
            stroke="url(#leatherGrip)"
            strokeWidth="52"
            strokeLinecap="round"
          />
          {/* Left Grip Inner Seam Stitches */}
          <path
            d="M 70 120 A 160 160 0 0 0 95 290"
            fill="none"
            stroke="#475569"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />

          {/* Right Grip (3 o'clock) */}
          <path
            d="M 318 105 A 165 165 0 0 1 288 305"
            fill="none"
            stroke="url(#leatherGrip)"
            strokeWidth="52"
            strokeLinecap="round"
          />
          {/* Right Grip Inner Seam Stitches */}
          <path
            d="M 330 120 A 160 160 0 0 1 305 290"
            fill="none"
            stroke="#475569"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />

          {/* 6. SPOKE FRAMEWORK (Left, Right, Bottom) */}
          {/* Left Horizontal Spoke Support */}
          <path
            d="M 100 170 L 175 160 L 175 240 L 95 230 Z"
            fill="url(#satinMetal)"
            stroke="#0a0c0f"
            strokeWidth="3"
          />

          {/* Right Horizontal Spoke Support */}
          <path
            d="M 300 170 L 225 160 L 225 240 L 305 230 Z"
            fill="url(#satinMetal)"
            stroke="#0a0c0f"
            strokeWidth="3"
          />

          {/* Bottom Vertical Spoke */}
          <path
            d="M 170 230 L 160 330 L 240 330 L 230 230 Z"
            fill="url(#satinMetal)"
            stroke="#0a0c0f"
            strokeWidth="3"
          />
          {/* Bottom Spoke Center Vent Cutout */}
          <rect
            x="185"
            y="262"
            width="30"
            height="32"
            rx="6"
            fill="#090a0d"
            stroke="#333b47"
            strokeWidth="2"
          />

          {/* 7. MULTI-FUNCTION BUTTON CLUSTERS (Left & Right Controls) */}
          {/* Left Control Pod */}
          <g transform="translate(100, 160)">
            <rect
              x="0"
              y="0"
              width="68"
              height="80"
              rx="8"
              fill="#181c22"
              stroke="#2e3642"
              strokeWidth="2"
            />
            {/* Rocker & buttons */}
            <rect x="6" y="8" width="56" height="26" rx="4" fill="#242b35" stroke="#12151a" />
            <path d="M 22 21 L 28 15 L 34 21 Z" fill="#94a3b8" />
            <path d="M 22 21 L 28 27 L 34 21 Z" fill="#94a3b8" />
            {/* Phone & Audio Keys */}
            <rect x="6" y="38" width="26" height="16" rx="3" fill="#202630" />
            <rect x="36" y="38" width="26" height="16" rx="3" fill="#202630" />
            <rect x="6" y="58" width="56" height="16" rx="3" fill="#202630" />
            <text x="34" y="69" fill="#94a3b8" fontSize="8" fontFamily="sans-serif" textAnchor="middle">
              MODE
            </text>
          </g>

          {/* Right Control Pod */}
          <g transform="translate(232, 160)">
            <rect
              x="0"
              y="0"
              width="68"
              height="80"
              rx="8"
              fill="#181c22"
              stroke="#2e3642"
              strokeWidth="2"
            />
            {/* Cruise & Navigation Controls */}
            <rect x="6" y="8" width="56" height="26" rx="4" fill="#242b35" stroke="#12151a" />
            <circle cx="34" cy="21" r="5" fill="none" stroke="#94a3b8" strokeWidth="1.5" />
            {/* Lower Keys */}
            <rect x="6" y="38" width="26" height="16" rx="3" fill="#202630" />
            <rect x="36" y="38" width="26" height="16" rx="3" fill="#202630" />
            <rect x="6" y="58" width="56" height="16" rx="3" fill="#202630" />
            <text x="34" y="69" fill="#94a3b8" fontSize="8" fontFamily="sans-serif" textAnchor="middle">
              RES / SET
            </text>
          </g>

          {/* 8. CENTER AIRBAG HORN HUB (Elevated sculpted leather pad) */}
          <g filter="url(#hubShadow)">
            {/* Main Hub Outline */}
            <path
              d="M 145 150 
                 Q 200 135 255 150 
                 L 270 215 
                 Q 260 255 200 260 
                 Q 140 255 130 215 Z"
              fill="#1a1e24"
              stroke="#2d3440"
              strokeWidth="2.5"
            />

            {/* Hub Perimeter Double Stitched Line */}
            <path
              d="M 149 154 
                 Q 200 141 251 154 
                 L 264 213 
                 Q 254 250 200 254 
                 Q 146 250 136 213 Z"
              fill="none"
              stroke="#64748b"
              strokeWidth="1.2"
              strokeDasharray="4 2.5"
            />

            {/* Inner Horn Texture Fill */}
            <path
              d="M 154 160 
                 Q 200 148 246 160 
                 L 257 210 
                 Q 248 244 200 248 
                 Q 152 244 143 210 Z"
              fill="#14171c"
            />

            {/* GOLD METALLIC OVAL LOGO EMBLEM (Toyota / Luxury Crest Style) */}
            <g transform="translate(200, 190)">
              {/* Outer Golden Ring */}
              <ellipse
                cx="0"
                cy="0"
                rx="28"
                ry="18"
                fill="none"
                stroke="url(#goldEmblem)"
                strokeWidth="3.5"
                filter="url(#innerBevel)"
              />
              {/* Inner Overlapping Golden Loop 1 */}
              <ellipse
                cx="0"
                cy="-2"
                rx="20"
                ry="9"
                fill="none"
                stroke="url(#goldEmblem)"
                strokeWidth="3.2"
              />
              {/* Inner Overlapping Golden Loop 2 */}
              <ellipse
                cx="0"
                cy="3"
                rx="9"
                ry="14"
                fill="none"
                stroke="url(#goldEmblem)"
                strokeWidth="3.2"
              />
            </g>

            {/* "SRS AIRBAG" Debossed Lettering */}
            <text
              x="200"
              y="234"
              fill="#4b5563"
              fontSize="7"
              fontFamily="monospace"
              fontWeight="bold"
              letterSpacing="1.5"
              textAnchor="middle"
            >
              SRS AIRBAG
            </text>
          </g>

          {/* 9. BOTTOM SPORT BADGE ("GR" Racing Emblem Insert) */}
          <g transform="translate(182, 305)">
            <rect
              x="0"
              y="0"
              width="36"
              height="18"
              rx="4"
              fill="#090a0d"
              stroke="#475569"
              strokeWidth="1.5"
            />
            {/* G in Silver, R in Red */}
            <text
              x="11"
              y="13"
              fill="#e2e8f0"
              fontSize="12"
              fontFamily="sans-serif"
              fontWeight="900"
              fontStyle="italic"
              textAnchor="middle"
            >
              G
            </text>
            <text
              x="24"
              y="13"
              fill="#ef4444"
              fontSize="12"
              fontFamily="sans-serif"
              fontWeight="900"
              fontStyle="italic"
              textAnchor="middle"
            >
              R
            </text>
          </g>

          {/* 10. REALISTIC METALLIC INNER HOOP TRIM */}
          <circle
            cx="200"
            cy="200"
            r="140"
            fill="none"
            stroke="#262d38"
            strokeWidth="2"
            opacity="0.4"
          />
        </svg>
      </div>

      <span className="text-[10px] text-amber-400/90 font-mono mt-1 uppercase tracking-wider font-semibold">
        Steer: {Math.round(steerValue * 100)}%
      </span>
    </div>
  );
};
