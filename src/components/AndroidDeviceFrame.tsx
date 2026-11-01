import React from 'react';
import { Wifi, Battery, Volume2, Shield } from 'lucide-react';
import { QueueItem } from '../types/handbrake';
import { HandBrakeLogo } from './HandBrakeLogo';

interface AndroidDeviceFrameProps {
  children: React.ReactNode;
  activeJob: QueueItem | null;
  onPauseJob?: () => void;
  onResumeJob?: () => void;
  onCancelJob?: () => void;
  onViewQueue?: () => void;
  onToggleToWeb?: () => void;
}

export const AndroidDeviceFrame: React.FC<AndroidDeviceFrameProps> = ({
  children,
  activeJob,
  onPauseJob,
  onResumeJob,
  onCancelJob,
  onViewQueue,
  onToggleToWeb,
}) => {
  return (
    <div className="min-h-screen bg-[#07080b] flex flex-col items-center justify-center p-2 sm:p-6 select-none overflow-x-hidden">
      {/* Platform Info Header */}
      <div className="w-full max-w-[420px] mb-3 flex items-center justify-between px-2 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
          <span className="font-semibold text-slate-300">Google Pixel 9 Pro (Android 15)</span>
        </div>
        <button
          type="button"
          onClick={onToggleToWeb}
          className="text-xs text-amber-400 hover:text-amber-300 font-medium transition-colors"
        >
          Expand to Web Studio →
        </button>
      </div>

      {/* Android Hardware Shell */}
      <div className="relative w-full max-w-[412px] h-[870px] max-h-[94vh] bg-[#1d1f2b] rounded-[48px] p-[10px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.12)] ring-1 ring-slate-800">
        {/* Hardware Power & Volume Keys (Right side on Pixel) */}
        <div className="absolute -right-[13px] top-[170px] w-[3px] h-[40px] bg-slate-600 rounded-r" />
        <div className="absolute -right-[13px] top-[230px] w-[3px] h-[65px] bg-slate-600 rounded-r" />

        {/* Display Inner Screen */}
        <div className="relative w-full h-full bg-[#11131c] rounded-[40px] overflow-hidden flex flex-col border border-white/5">
          {/* Android Status Bar with Centered Punch-Hole Camera */}
          <div className="relative z-40 h-9 px-6 pt-2 flex items-center justify-between text-[13px] font-medium text-slate-200 shrink-0">
            {/* Clock & Notification Pill */}
            <div className="flex items-center gap-2">
              <span className="tracking-tight font-semibold">9:41</span>
              {activeJob && (
                <div className="flex items-center gap-1 bg-amber-500/20 px-1.5 py-0.5 rounded-full text-[10px] text-amber-400 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <span>MediaCodec {activeJob.progressPercent}%</span>
                </div>
              )}
            </div>

            {/* Centered Camera Punch-Hole */}
            <div className="absolute left-1/2 -translate-x-1/2 top-2.5 w-3.5 h-3.5 bg-black rounded-full border border-slate-700/80 flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-slate-900 rounded-full" />
            </div>

            {/* Android System Icons */}
            <div className="flex items-center gap-1.5 text-slate-300">
              {/* Android signal triangle */}
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 3L2 21h20L12 3z" />
              </svg>
              <Wifi className="w-3.5 h-3.5" />
              <div className="flex items-center gap-0.5">
                <span className="text-[10px] font-mono">98%</span>
                <Battery className="w-4 h-4 fill-current" />
              </div>
            </div>
          </div>

          {/* Android Foreground Notification Banner if Encoding */}
          {activeJob && (
            <div
              onClick={onViewQueue}
              className="mx-3 mt-1 p-2.5 bg-slate-900/90 border border-amber-500/30 rounded-2xl flex items-center justify-between gap-2.5 shadow-lg select-none cursor-pointer hover:bg-slate-800 transition-colors shrink-0"
            >
              <div className="flex items-center gap-2 min-w-0">
                <HandBrakeLogo size={22} />
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-white truncate">
                      Encoding {activeJob.outputName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                    <span className="text-amber-400 font-semibold">{activeJob.progressPercent}%</span>
                    <span>·</span>
                    <span>{activeJob.fps} fps</span>
                    <span>·</span>
                    <span>ETA {activeJob.etaSeconds}s</span>
                  </div>
                </div>
              </div>

              {/* Progress Ring */}
              <div className="relative w-6 h-6 shrink-0 flex items-center justify-center">
                <svg className="w-6 h-6 -rotate-90">
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                    stroke="rgba(255,255,255,0.15)"
                    strokeWidth="3"
                    fill="none"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                    stroke="#f59e0b"
                    strokeWidth="3"
                    fill="none"
                    strokeDasharray={56.5}
                    strokeDashoffset={56.5 - (56.5 * (activeJob.progressPercent || 0)) / 100}
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          )}

          {/* Screen Body */}
          <div className="flex-1 overflow-hidden flex flex-col relative">
            {children}
          </div>

          {/* Android Gesture Bar */}
          <div className="h-4 w-full flex items-center justify-center shrink-0 bg-transparent pointer-events-none pb-1">
            <div className="w-20 h-1 bg-white/50 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};
