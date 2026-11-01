import React from 'react';
import { Lock, RotateCw, Share2, MoreVertical } from 'lucide-react';
import { PWAInstallBanner } from './PWAInstallBanner';

interface MobileWebFrameProps {
  children: React.ReactNode;
  onToggleToWeb?: () => void;
}

export const MobileWebFrame: React.FC<MobileWebFrameProps> = ({
  children,
  onToggleToWeb,
}) => {
  return (
    <div className="min-h-screen bg-[#07080b] flex flex-col items-center justify-center p-2 sm:p-6 select-none overflow-x-hidden">
      {/* Mobile Web Info Header */}
      <div className="w-full max-w-[420px] mb-3 flex items-center justify-between px-2 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-cyan-400" />
          <span className="font-semibold text-slate-300">Mobile Web (Safari / Chrome mweb)</span>
        </div>
        <button
          type="button"
          onClick={onToggleToWeb}
          className="text-xs text-amber-400 hover:text-amber-300 font-medium transition-colors"
        >
          Expand to Web Studio →
        </button>
      </div>

      {/* Mobile Phone Mockup */}
      <div className="relative w-full max-w-[412px] h-[870px] max-h-[94vh] bg-[#1a1b24] rounded-[48px] p-[10px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.12)] ring-1 ring-slate-800 flex flex-col">
        {/* Screen Display */}
        <div className="relative w-full h-full bg-[#0d0e14] rounded-[40px] overflow-hidden flex flex-col border border-white/5">
          {/* Mobile Web Browser Top Bar */}
          <div className="bg-[#141620] px-3.5 py-2.5 border-b border-white/10 flex items-center justify-between gap-2 shrink-0">
            {/* Fake URL Bar */}
            <div className="flex-1 bg-black/50 border border-white/10 rounded-full py-1 px-3 flex items-center justify-between text-xs text-slate-300 font-mono">
              <div className="flex items-center gap-1.5 min-w-0">
                <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="truncate text-[11px]">handbrake.mobile/transcode</span>
              </div>
              <RotateCw className="w-3 h-3 text-slate-400 shrink-0 hover:text-white cursor-pointer" />
            </div>

            <div className="flex items-center gap-1 text-slate-400 shrink-0">
              <Share2 className="w-3.5 h-3.5 cursor-pointer hover:text-white" />
              <MoreVertical className="w-4 h-4 cursor-pointer hover:text-white" />
            </div>
          </div>

          {/* In-app PWA install strip */}
          <PWAInstallBanner />

          {/* Content */}
          <div className="flex-1 overflow-hidden flex flex-col relative">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
