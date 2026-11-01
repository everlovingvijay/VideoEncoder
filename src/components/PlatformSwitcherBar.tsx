import React from 'react';
import { Apple, Smartphone, Globe, Monitor, Laptop, Check } from 'lucide-react';

export type PlatformTarget = 'ios' | 'android' | 'mweb' | 'web';

interface PlatformSwitcherBarProps {
  currentPlatform: PlatformTarget;
  onSelectPlatform: (platform: PlatformTarget) => void;
}

export const PlatformSwitcherBar: React.FC<PlatformSwitcherBarProps> = ({
  currentPlatform,
  onSelectPlatform,
}) => {
  const platforms: {
    id: PlatformTarget;
    label: string;
    sublabel: string;
    icon: React.ComponentType<{ className?: string }>;
    accentClass: string;
  }[] = [
    {
      id: 'ios',
      label: 'Apple iOS',
      sublabel: 'iPhone 16 Pro / VideoToolbox',
      icon: Apple,
      accentClass: 'text-amber-400',
    },
    {
      id: 'android',
      label: 'Android',
      sublabel: 'Pixel 9 Pro / MediaCodec',
      icon: Smartphone,
      accentClass: 'text-emerald-400',
    },
    {
      id: 'mweb',
      label: 'Mobile Web',
      sublabel: 'Safari & Chrome Touch / PWA',
      icon: Globe,
      accentClass: 'text-cyan-400',
    },
    {
      id: 'web',
      label: 'Desktop Web',
      sublabel: 'Full Widescreen Studio Suite',
      icon: Monitor,
      accentClass: 'text-indigo-400',
    },
  ];

  return (
    <div className="w-full bg-[#0a0b12] border-b border-white/10 px-3 py-2 z-50 select-none">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5 shrink-0 text-xs font-semibold text-slate-400 mr-2">
          <span>Target Platform:</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {platforms.map((p) => {
            const Icon = p.icon;
            const isSelected = currentPlatform === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelectPlatform(p.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-amber-500/15 border border-amber-500/40 text-white shadow-sm'
                    : 'bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? p.accentClass : 'text-slate-500'}`} />
                <div className="text-left">
                  <div className="flex items-center gap-1">
                    <span className={`font-bold ${isSelected ? 'text-white' : ''}`}>
                      {p.label}
                    </span>
                    {isSelected && <Check className="w-3 h-3 text-amber-400" />}
                  </div>
                  <span className="text-[10px] text-slate-500 block hidden sm:inline">
                    {p.sublabel}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
