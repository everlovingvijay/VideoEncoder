import React from 'react';
import { Wifi, Battery } from 'lucide-react';
import { DynamicIslandWidget } from './DynamicIslandWidget';
import { QueueItem } from '../types/handbrake';

interface IOSDeviceFrameProps {
  children: React.ReactNode;
  activeJob: QueueItem | null;
  isStudioMode: boolean;
  onToggleMode: (studio: boolean) => void;
  onPauseJob?: () => void;
  onResumeJob?: () => void;
  onCancelJob?: () => void;
  onViewQueue?: () => void;
}

export const IOSDeviceFrame: React.FC<IOSDeviceFrameProps> = ({
  children,
  activeJob,
  isStudioMode,
  onToggleMode,
  onPauseJob,
  onResumeJob,
  onCancelJob,
  onViewQueue,
}) => {
  if (isStudioMode) {
    return (
      <div className="min-h-screen flex flex-col bg-[#08090d] text-slate-100">
        {/* Dynamic Island Banner when active in studio mode */}
        {activeJob && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
            <DynamicIslandWidget
              activeJob={activeJob}
              onPause={onPauseJob}
              onResume={onResumeJob}
              onCancel={onCancelJob}
              onViewQueue={onViewQueue}
            />
          </div>
        )}
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07080b] flex flex-col items-center justify-center p-2 sm:p-6 select-none overflow-x-hidden">
      {/* Top Simulator Switcher Bar */}
      <div className="w-full max-w-[430px] mb-3 flex items-center justify-between px-2 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
          <span className="font-semibold text-slate-300">iPhone 16 Pro (Simulator)</span>
        </div>
        <button
          type="button"
          onClick={() => onToggleMode(true)}
          className="text-xs text-amber-400 hover:text-amber-300 font-medium transition-colors"
        >
          Expand to Studio View →
        </button>
      </div>

      {/* iPhone 16 Pro Hardware Shell */}
      <div className="relative w-full max-w-[420px] h-[870px] max-h-[94vh] bg-[#1a1b23] rounded-[52px] p-[10px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.15)] ring-1 ring-slate-800">
        {/* Hardware side button accents */}
        <div className="absolute -left-[13px] top-[140px] w-[3px] h-[30px] bg-slate-600 rounded-l" />
        <div className="absolute -left-[13px] top-[190px] w-[3px] h-[54px] bg-slate-600 rounded-l" />
        <div className="absolute -left-[13px] top-[260px] w-[3px] h-[54px] bg-slate-600 rounded-l" />
        <div className="absolute -right-[13px] top-[210px] w-[3px] h-[75px] bg-slate-600 rounded-r" />

        {/* Screen Bezel & Display */}
        <div className="relative w-full h-full bg-[#0d0e14] rounded-[44px] overflow-hidden flex flex-col border border-white/5">
          {/* iOS Status Bar */}
          <div className="relative z-40 h-11 px-7 pt-3 flex items-center justify-between text-xs font-semibold text-white shrink-0">
            {/* Clock */}
            <span className="text-[14px] font-medium tracking-tight">9:41</span>

            {/* Centered Dynamic Island */}
            <div className="absolute left-1/2 -translate-x-1/2 top-2">
              <DynamicIslandWidget
                activeJob={activeJob}
                onPause={onPauseJob}
                onResume={onResumeJob}
                onCancel={onCancelJob}
                onViewQueue={onViewQueue}
              />
            </div>

            {/* Status Icons */}
            <div className="flex items-center gap-1.5 text-slate-200">
              {/* Cellular signal bars */}
              <svg className="w-4 h-3 fill-current" viewBox="0 0 16 12">
                <rect x="0.5" y="8.5" width="2" height="3" rx="0.5" />
                <rect x="4.5" y="6" width="2" height="5.5" rx="0.5" />
                <rect x="8.5" y="3.5" width="2" height="8" rx="0.5" />
                <rect x="12.5" y="0.5" width="2" height="11" rx="0.5" />
              </svg>
              <Wifi className="w-3.5 h-3.5" />
              <Battery className="w-5 h-5 fill-current" />
            </div>
          </div>

          {/* iOS Screen Inner Content */}
          <div className="flex-1 overflow-hidden flex flex-col relative">
            {children}
          </div>

          {/* iOS Home Indicator Bar */}
          <div className="h-6 w-full flex items-center justify-center shrink-0 bg-transparent pointer-events-none pb-2">
            <div className="w-32 h-1 bg-white/40 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};
