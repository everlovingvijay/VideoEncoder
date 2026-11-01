import React from 'react';
import { HandBrakeLogo } from './HandBrakeLogo';
import { MainTabType } from './iOSBottomBar';
import { Smartphone } from 'lucide-react';

interface StudioHeaderProps {
  activeTab: MainTabType;
  onChangeTab: (tab: MainTabType) => void;
  onSwitchToPhoneFrame: () => void;
  onStartEncodeNow?: () => void;
  isEncoding?: boolean;
}

export const StudioHeader: React.FC<StudioHeaderProps> = ({
  activeTab,
  onChangeTab,
  onSwitchToPhoneFrame,
  onStartEncodeNow,
  isEncoding,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 bg-[#0d0e15] border-b border-slate-800 shrink-0 select-none">
      {/* Zone 1: Brand Wordmark */}
      <div className="flex items-center gap-2.5 shrink-0">
        <HandBrakeLogo size={28} />
        <span className="text-base font-bold tracking-tight text-white whitespace-nowrap">
          HandBrake Mobile
        </span>
      </div>

      {/* Zone 2: 4-5 Clean single-line text nav links */}
      <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-300">
        <button
          type="button"
          onClick={() => onChangeTab('transcode')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
            activeTab === 'transcode'
              ? 'text-amber-400 font-bold border-b-2 border-amber-400'
              : ''
          }`}
        >
          Transcode
        </button>
        <button
          type="button"
          onClick={() => onChangeTab('presets')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
            activeTab === 'presets'
              ? 'text-amber-400 font-bold border-b-2 border-amber-400'
              : ''
          }`}
        >
          Presets
        </button>
        <button
          type="button"
          onClick={() => onChangeTab('queue')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
            activeTab === 'queue'
              ? 'text-amber-400 font-bold border-b-2 border-amber-400'
              : ''
          }`}
        >
          Queue
        </button>
        <button
          type="button"
          onClick={() => onChangeTab('studio')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
            activeTab === 'studio'
              ? 'text-amber-400 font-bold border-b-2 border-amber-400'
              : ''
          }`}
        >
          Studio
        </button>
        <button
          type="button"
          onClick={() => onChangeTab('code')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
            activeTab === 'code'
              ? 'text-amber-400 font-bold border-b-2 border-amber-400'
              : ''
          }`}
        >
          Swift Architecture
        </button>
      </nav>

      {/* Zone 3: 1 Primary Action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={onSwitchToPhoneFrame}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700/80 transition-colors whitespace-nowrap shrink-0"
        >
          <Smartphone className="w-3.5 h-3.5 text-amber-400" />
          <span>iPhone 16 Frame</span>
        </button>
      </div>
    </header>
  );
};
