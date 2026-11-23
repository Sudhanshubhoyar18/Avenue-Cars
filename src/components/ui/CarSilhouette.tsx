import React from "react";

interface CarSilhouetteProps {
  makeModel: string;
  color?: string;
  className?: string;
}

export function CarSilhouette({ makeModel, color = "Black", className = "w-full h-32" }: CarSilhouetteProps) {
  const modelLower = makeModel.toLowerCase();

  // Determine car style: SUV, Offroad 4x4, or Premium Cross
  const isThar = modelLower.includes("thar");
  const isScorpio = modelLower.includes("scorpio");
  const isXuv = modelLower.includes("xuv");

  // Determine accent color theme based on car color
  let carFill = "#1E222D";
  let carGradient = ["#2B303C", "#14171E"];
  let wheelColor = "#475569";
  let glowColor = "rgba(99, 102, 241, 0.2)";

  if (color.toLowerCase().includes("blue")) {
    carGradient = ["#1E3A8A", "#0F172A"];
    glowColor = "rgba(59, 130, 246, 0.25)";
  } else if (color.toLowerCase().includes("beige")) {
    carGradient = ["#854D0E", "#451A03"];
    glowColor = "rgba(217, 119, 6, 0.25)";
  } else if (color.toLowerCase().includes("white")) {
    carGradient = ["#F1F5F9", "#CBD5E1"];
    glowColor = "rgba(255, 255, 255, 0.3)";
  }

  return (
    <div className={`relative flex items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-b from-black/[0.03] to-black/[0.08] dark:from-white/[0.02] dark:to-white/[0.05] p-3 ${className}`}>
      {/* Ambient background glow */}
      <div
        className="absolute inset-0 opacity-40 blur-xl pointer-events-none"
        style={{ background: glowColor }}
      />

      <svg
        viewBox="0 0 280 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full max-h-28 object-contain transition-transform duration-300 group-hover:scale-105"
      >
        <defs>
          <linearGradient id={`carGrad-${makeModel.replace(/\s+/g, '')}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={carGradient[0]} />
            <stop offset="100%" stopColor={carGradient[1]} />
          </linearGradient>
          <linearGradient id="glassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#93C5FD" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#1E3A8A" stopOpacity="0.2" />
          </linearGradient>
        </defs>

        {isThar ? (
          // Rugged 4x4 Silhouette (Thar Style)
          <g>
            {/* Thar Boxy Body */}
            <path
              d="M30 85 L35 55 L75 52 L95 28 L190 28 L210 52 L250 55 L255 85 Z"
              fill={`url(#carGrad-${makeModel.replace(/\s+/g, '')})`}
              stroke="#64748B"
              strokeWidth="1.5"
            />
            {/* Windows */}
            <path d="M100 34 L145 34 L145 52 L98 52 Z" fill="url(#glassGrad)" />
            <path d="M152 34 L195 34 L202 52 L152 52 Z" fill="url(#glassGrad)" />
            {/* Front Grill & Bumper */}
            <rect x="25" y="70" width="10" height="15" rx="2" fill="#334155" />
            {/* Headlights */}
            <circle cx="36" cy="66" r="4.5" fill="#FDE047" filter="drop-shadow(0 0 4px #FACC15)" />
            {/* Tail Light */}
            <rect x="250" y="62" width="4" height="10" rx="1" fill="#EF4444" />
            {/* Wheels */}
            <circle cx="70" cy="85" r="18" fill="#0F172A" stroke="#475569" strokeWidth="4" />
            <circle cx="70" cy="85" r="8" fill="#64748B" />
            <circle cx="210" cy="85" r="18" fill="#0F172A" stroke="#475569" strokeWidth="4" />
            <circle cx="210" cy="85" r="8" fill="#64748B" />
          </g>
        ) : isScorpio ? (
          // Muscular Full-size SUV (Scorpio N Style)
          <g>
            {/* Body */}
            <path
              d="M20 84 L26 62 L60 56 L105 32 L205 32 L235 54 L258 60 L260 84 Z"
              fill={`url(#carGrad-${makeModel.replace(/\s+/g, '')})`}
              stroke="#64748B"
              strokeWidth="1.5"
            />
            {/* Windows */}
            <path d="M110 38 L152 38 L152 54 L98 54 Z" fill="url(#glassGrad)" />
            <path d="M158 38 L200 38 L220 54 L158 54 Z" fill="url(#glassGrad)" />
            {/* LED Headlamp */}
            <path d="M22 66 L38 64 L34 72 Z" fill="#38BDF8" filter="drop-shadow(0 0 5px #0284C7)" />
            {/* Tail Lamp */}
            <rect x="256" y="60" width="3.5" height="14" rx="1.5" fill="#F43F5E" />
            {/* Roof Rails */}
            <rect x="120" y="29" width="70" height="2" rx="1" fill="#94A3B8" />
            {/* Wheels */}
            <circle cx="68" cy="84" r="17" fill="#0F172A" stroke="#475569" strokeWidth="3" />
            <circle cx="68" cy="84" r="7" fill="#94A3B8" />
            <circle cx="212" cy="84" r="17" fill="#0F172A" stroke="#475569" strokeWidth="3" />
            <circle cx="212" cy="84" r="7" fill="#94A3B8" />
          </g>
        ) : (
          // Sleek Premium SUV / Crossover (XUV700 & Safari Style)
          <g>
            {/* Body */}
            <path
              d="M18 82 L28 62 L70 54 L115 32 L198 32 L232 50 L260 58 L262 82 Z"
              fill={`url(#carGrad-${makeModel.replace(/\s+/g, '')})`}
              stroke="#64748B"
              strokeWidth="1.5"
            />
            {/* Windows */}
            <path d="M118 36 L154 36 L154 52 L100 52 Z" fill="url(#glassGrad)" />
            <path d="M160 36 L195 36 L218 52 L160 52 Z" fill="url(#glassGrad)" />
            {/* Headlights */}
            <path d="M20 64 L36 62 L32 70 Z" fill="#67E8F9" filter="drop-shadow(0 0 6px #06B6D4)" />
            {/* Tail Lamp */}
            <path d="M258 58 L262 60 L260 74 Z" fill="#EF4444" />
            {/* Wheels */}
            <circle cx="65" cy="82" r="16" fill="#0F172A" stroke="#64748B" strokeWidth="3" />
            <circle cx="65" cy="82" r="7" fill="#CBD5E1" />
            <circle cx="215" cy="82" r="16" fill="#0F172A" stroke="#64748B" strokeWidth="3" />
            <circle cx="215" cy="82" r="7" fill="#CBD5E1" />
          </g>
        )}
      </svg>
    </div>
  );
}

