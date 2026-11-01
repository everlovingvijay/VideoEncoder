import React from 'react';

interface HandBrakeLogoProps {
  className?: string;
  size?: number;
}

export const HandBrakeLogo: React.FC<HandBrakeLogoProps> = ({
  className = '',
  size = 40,
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
      title="HandBrake"
    >
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md"
      >
        <defs>
          <linearGradient id="hb-glass" x1="16" y1="20" x2="48" y2="58" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fde047" stopOpacity="0.9" />
            <stop offset="0.4" stopColor="#fb923c" stopOpacity="0.85" />
            <stop offset="0.8" stopColor="#e11d48" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="hb-pine" x1="32" y1="4" x2="56" y2="34" gradientUnits="userSpaceOnUse">
            <stop stopColor="#f59e0b" />
            <stop offset="1" stopColor="#b45309" />
          </linearGradient>
          <linearGradient id="hb-leaves" x1="40" y1="2" x2="58" y2="18" gradientUnits="userSpaceOnUse">
            <stop stopColor="#4ade80" />
            <stop offset="1" stopColor="#15803d" />
          </linearGradient>
          <linearGradient id="hb-umbrella" x1="12" y1="8" x2="34" y2="28" gradientUnits="userSpaceOnUse">
            <stop stopColor="#38bdf8" />
            <stop offset="0.5" stopColor="#ec4899" />
            <stop offset="1" stopColor="#facc15" />
          </linearGradient>
        </defs>

        {/* Squircle App Icon Base */}
        <rect
          x="2"
          y="2"
          width="60"
          height="60"
          rx="14"
          fill="#13151f"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="1.5"
        />

        {/* Cocktail Glass Stem & Base */}
        <path
          d="M26 54H38M32 44V54"
          stroke="#e2e8f0"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Hurricane / Cocktail Glass Body */}
        <path
          d="M20 22C20 22 22 34 26 38C29 41 35 41 38 38C42 34 44 22 44 22H20Z"
          fill="url(#hb-glass)"
          stroke="#ffffff"
          strokeWidth="1.5"
        />

        {/* Liquid highlight line */}
        <path
          d="M22 26C24 28 40 28 42 26"
          stroke="rgba(255,255,255,0.4)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/* Pineapple Slice on Rim */}
        <path
          d="M38 18C42 12 50 14 54 20C55 22 53 26 49 26C45 26 40 23 38 18Z"
          fill="url(#hb-pine)"
          stroke="#fef08a"
          strokeWidth="1"
        />
        {/* Pineapple skin texture notches */}
        <circle cx="46" cy="18" r="1.5" fill="#78350f" opacity="0.6" />
        <circle cx="49" cy="22" r="1.2" fill="#78350f" opacity="0.6" />

        {/* Green Crown Leaves */}
        <path
          d="M44 14C45 8 50 6 52 8C54 10 52 14 50 15C52 11 58 11 58 14C58 17 52 19 48 18"
          fill="url(#hb-leaves)"
        />

        {/* Cocktail Umbrella Toothpick & Canopy */}
        <line x1="28" y1="26" x2="16" y2="8" stroke="#f1f5f9" strokeWidth="1.5" strokeLinecap="round" />
        <path
          d="M8 12C12 7 24 7 28 14C23 15 19 14 16 16C13 14 10 14 8 12Z"
          fill="url(#hb-umbrella)"
        />

        {/* Tropical Red Hibiscus Flower Accent */}
        <circle cx="23" cy="22" r="3.5" fill="#f43f5e" />
        <circle cx="23" cy="22" r="1.2" fill="#fef08a" />
      </svg>
    </div>
  );
};
