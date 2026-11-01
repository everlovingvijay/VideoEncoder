import React, { useState } from 'react';
import { QueueItem } from '../types/handbrake';
import { HandBrakeLogo } from './HandBrakeLogo';
import { Pause, Play, X, Zap } from 'lucide-react';

interface DynamicIslandProps {
  activeJob: QueueItem | null;
  onPause?: () => void;
  onResume?: () => void;
  onCancel?: () => void;
  onViewQueue?: () => void;
}

export const DynamicIslandWidget: React.FC<DynamicIslandProps> = ({
  activeJob,
  onPause,
  onResume,
  onCancel,
  onViewQueue,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const isEncoding = activeJob && activeJob.status === 'encoding';
  const isPaused = activeJob && activeJob.status === 'paused';

  return (
    <div className="relative flex justify-center w-full z-50 pointer-events-auto">
      <div
        onClick={() => {
          if (activeJob) {
            setIsExpanded(!isExpanded);
          }
        }}
        className={`transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] bg-black text-white shadow-2xl border border-white/10 select-none cursor-pointer ${
          isExpanded
            ? 'w-[92%] max-w-[370px] rounded-[34px] p-4 mt-2'
            : activeJob
            ? 'h-[36px] px-3 rounded-full mt-2 flex items-center justify-between gap-3 min-w-[210px] hover:scale-105 active:scale-95'
            : 'h-[30px] w-[124px] rounded-full mt-2 flex items-center justify-center'
        }`}
      >
        {!activeJob ? (
          /* Idle Dynamic Island */
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-slate-900 border border-slate-700/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#111] border border-blue-950/40" />
          </div>
        ) : !isExpanded ? (
          /* Compact Active Encoding State */
          <>
            <div className="flex items-center gap-2 min-w-0">
              <HandBrakeLogo size={20} />
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-[11px] font-semibold text-amber-400 truncate max-w-[90px]">
                  {activeJob.outputName}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Circular mini progress ring */}
              <div className="relative w-5 h-5 flex items-center justify-center">
                <svg className="w-5 h-5 -rotate-90">
                  <circle
                    cx="10"
                    cy="10"
                    r="7.5"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="2.5"
                    fill="none"
                  />
                  <circle
                    cx="10"
                    cy="10"
                    r="7.5"
                    stroke="#f59e0b"
                    strokeWidth="2.5"
                    fill="none"
                    strokeDasharray={47}
                    strokeDashoffset={47 - (47 * (activeJob.progressPercent || 0)) / 100}
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <span className="text-[11px] font-mono font-medium text-amber-400">
                {activeJob.progressPercent}%
              </span>
            </div>
          </>
        ) : (
          /* Expanded Live Activity Sheet */
          <div
            className="flex flex-col gap-3 w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HandBrakeLogo size={24} />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-100">HandBrake Live</span>
                    <span className="text-[10px] text-amber-400/90 font-mono flex items-center gap-0.5">
                      <Zap className="w-2.5 h-2.5 text-amber-400" />
                      VideoToolbox
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate max-w-[200px]">
                    {activeJob.outputName}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono font-bold text-amber-400">
                  {activeJob.progressPercent}%
                </span>
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.max(3, activeJob.progressPercent)}%` }}
              />
            </div>

            {/* Telemetry info */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>{activeJob.fps ? `${activeJob.fps} fps` : 'Starting...'}</span>
              <span>
                {activeJob.etaSeconds ? `ETA: ${activeJob.etaSeconds}s` : 'Calculating...'}
              </span>
              <span>
                {activeJob.currentFrame}/{activeJob.totalFrames} frames
              </span>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between pt-1 border-t border-white/10">
              <div className="flex items-center gap-2">
                {isEncoding ? (
                  <button
                    type="button"
                    onClick={onPause}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-200 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <Pause className="w-3 h-3" />
                    Pause
                  </button>
                ) : isPaused ? (
                  <button
                    type="button"
                    onClick={onResume}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-amber-600 hover:bg-amber-500 rounded-lg transition-colors"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    Resume
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={onCancel}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsExpanded(false);
                  onViewQueue?.();
                }}
                className="text-xs text-amber-400 hover:text-amber-300 font-medium underline underline-offset-2"
              >
                Open Queue
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
