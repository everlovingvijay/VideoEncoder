import React, { useState } from 'react';
import { QueueItem, LogEntry } from '../../types/handbrake';
import {
  Play,
  Pause,
  Trash2,
  Download,
  Terminal,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  FileVideo,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from 'lucide-react';

interface QueueTabProps {
  queue: QueueItem[];
  logs: LogEntry[];
  isEncoding: boolean;
  onStartQueue: () => void;
  onStartSingleJob?: (job: QueueItem) => void;
  onPauseQueue: () => void;
  onResumeQueue: () => void;
  onRemoveItem: (id: string) => void;
  onClearCompleted: () => void;
  onDownloadOutput: (job: QueueItem) => void;
}

export const QueueTab: React.FC<QueueTabProps> = ({
  queue,
  logs,
  isEncoding,
  onStartQueue,
  onStartSingleJob,
  onPauseQueue,
  onResumeQueue,
  onRemoveItem,
  onClearCompleted,
  onDownloadOutput,
}) => {
  const [showLogs, setShowLogs] = useState(false);
  const [logFilter, setLogFilter] = useState<'all' | 'notice' | 'warning' | 'error'>('all');

  const pendingItems = queue.filter((q) => q.status === 'waiting' || q.status === 'encoding' || q.status === 'paused');
  const completedItems = queue.filter((q) => q.status === 'completed');
  const activeJob = queue.find((q) => q.status === 'encoding' || q.status === 'paused');

  const filteredLogs = logs.filter((l) => {
    if (logFilter === 'all') return true;
    return l.level === logFilter;
  });

  const handleExportLogs = () => {
    const text = logs.map((l) => `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.message}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `handbrake-activity-${Date.now()}.log`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 text-slate-100 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            Queue
            {queue.length > 0 && (
              <span className="text-xs font-mono font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                {pendingItems.length} active
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-400">
            Batch Encoding & VideoToolbox Pipeline
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2">
          {isEncoding ? (
            <button
              type="button"
              onClick={onPauseQueue}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs rounded-xl border border-slate-700 transition-colors"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Pause</span>
            </button>
          ) : pendingItems.length > 0 ? (
            <button
              type="button"
              onClick={onStartQueue}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-orange-500/20 transition-all hover:scale-[1.02] active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start Batch Queue ({pendingItems.length})</span>
            </button>
          ) : null}

          {completedItems.length > 0 && (
            <button
              type="button"
              onClick={onClearCompleted}
              className="p-2 text-slate-400 hover:text-rose-400 bg-slate-800/80 rounded-xl transition-colors border border-slate-700/60"
              title="Clear completed jobs"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Queue Items List */}
      <div className="space-y-3">
        {queue.map((job) => {
          const isCurrent = job.status === 'encoding' || job.status === 'paused';
          return (
            <div
              key={job.id}
              className={`p-3.5 rounded-2xl border transition-all ${
                isCurrent
                  ? 'bg-amber-500/10 border-amber-500/40 shadow-md'
                  : job.status === 'completed'
                  ? 'bg-emerald-950/20 border-emerald-500/30'
                  : 'bg-slate-900/70 border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      job.status === 'completed'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : isCurrent
                        ? 'bg-amber-500/20 text-amber-400'
                        : job.status === 'failed'
                        ? 'bg-rose-500/20 text-rose-400'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {job.status === 'completed' ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : job.status === 'encoding' ? (
                      <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                    ) : job.status === 'paused' ? (
                      <Pause className="w-4 h-4" />
                    ) : job.status === 'failed' ? (
                      <AlertCircle className="w-4 h-4" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <h3 className="text-xs font-bold text-white truncate max-w-[210px] sm:max-w-md">
                      {job.outputName}
                    </h3>
                    <p className="text-[11px] text-slate-400 truncate">
                      {job.preset.name} · {job.preset.video.codec.split(' ')[0]}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
                      <span>Source: {(job.source.sizeBytes / 1024 / 1024).toFixed(1)} MB</span>
                      {job.outputSizeBytes > 0 && (
                        <>
                          <span>·</span>
                          <span className="text-emerald-400 font-semibold">
                            Output: {(job.outputSizeBytes / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </>
                      )}
                      <span className="capitalize px-1.5 py-0.2 rounded bg-white/5 text-slate-400">
                        {job.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Action buttons */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Status: Waiting -> Start Encode button */}
                  {job.status === 'waiting' && (
                    <button
                      type="button"
                      disabled={isEncoding}
                      onClick={() => (onStartSingleJob ? onStartSingleJob(job) : onStartQueue())}
                      className={`flex items-center gap-1.5 px-3 py-1.5 font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 ${
                        isEncoding
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950'
                      }`}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Start Encode</span>
                    </button>
                  )}

                  {/* Status: Completed -> Download Video button */}
                  {job.status === 'completed' && job.outputBlobUrl && (
                    <a
                      href={job.outputBlobUrl}
                      download={job.outputName}
                      onClick={() => onDownloadOutput(job)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Video</span>
                    </a>
                  )}

                  {/* Status: Encoding -> Pause button */}
                  {job.status === 'encoding' && (
                    <button
                      type="button"
                      onClick={onPauseQueue}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-xl border border-slate-700 transition-colors"
                    >
                      <Pause className="w-3.5 h-3.5" />
                      <span>Pause</span>
                    </button>
                  )}

                  {/* Status: Paused -> Resume button */}
                  {job.status === 'paused' && (
                    <button
                      type="button"
                      onClick={onResumeQueue}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow transition-colors"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Resume</span>
                    </button>
                  )}

                  {/* Status: Failed -> Retry button */}
                  {job.status === 'failed' && (
                    <button
                      type="button"
                      onClick={() => (onStartSingleJob ? onStartSingleJob(job) : onStartQueue())}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30 font-semibold text-xs rounded-xl transition-all"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Retry</span>
                    </button>
                  )}

                  {/* Cancel / Remove Button */}
                  <button
                    type="button"
                    onClick={() => onRemoveItem(job.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                    title="Remove from queue"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Progress bar for encoding items */}
              {isCurrent && (
                <div className="mt-3 space-y-1.5 pt-2 border-t border-white/5">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-amber-400 font-bold">
                      {job.progressPercent}% ({job.currentFrame}/{job.totalFrames} frames)
                    </span>
                    <span className="text-slate-400">
                      {job.fps} fps · ETA {job.etaSeconds}s
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-white/5">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${job.progressPercent}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Explicit Download Banner for Completed Job */}
              {job.status === 'completed' && job.outputBlobUrl && (
                <div className="mt-2.5 pt-2 border-t border-emerald-500/20 flex flex-wrap items-center justify-between gap-2 bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-500/30">
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div className="text-[11px] truncate">
                      <span className="font-semibold text-emerald-300">Ready for Download: </span>
                      <span className="text-slate-300 font-mono">
                        {(job.outputSizeBytes / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                  </div>
                  <a
                    href={job.outputBlobUrl}
                    download={job.outputName}
                    onClick={() => onDownloadOutput(job)}
                    className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] rounded-lg shadow transition-transform active:scale-95"
                  >
                    <Download className="w-3 h-3" />
                    <span>Save to Disk</span>
                  </a>
                </div>
              )}

              {/* Error message if failed */}
              {job.status === 'failed' && job.errorMessage && (
                <div className="mt-2 text-[11px] text-rose-400 font-mono bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
                  Error: {job.errorMessage}
                </div>
              )}
            </div>
          );
        })}

        {queue.length === 0 && (
          <div className="p-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-2xl space-y-2">
            <FileVideo className="w-8 h-8 mx-auto text-slate-600" />
            <p>Queue is empty.</p>
            <p className="text-[11px] text-slate-600">
              Select a video in the Transcode tab and tap "Add to Batch Encoding Queue".
            </p>
          </div>
        )}
      </div>

      {/* HandBrake Activity Log Drawer / Console */}
      <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden mt-4">
        <button
          type="button"
          onClick={() => setShowLogs(!showLogs)}
          className="w-full px-4 py-3 flex items-center justify-between bg-slate-900/60 hover:bg-slate-900 transition-colors text-left"
        >
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-white">HandBrake Activity Log</span>
            <span className="text-[10px] font-mono text-slate-400">
              ({logs.length} entries)
            </span>
          </div>
          {showLogs ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {showLogs && (
          <div className="p-3 space-y-2 border-t border-slate-800">
            {/* Filter buttons & export */}
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1">
                {(['all', 'notice', 'warning', 'error'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setLogFilter(lvl)}
                    className={`px-2 py-0.5 rounded capitalize font-mono ${
                      logFilter === lvl
                        ? 'bg-amber-500 text-black font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleExportLogs}
                className="flex items-center gap-1 text-amber-400 hover:text-amber-300 font-mono"
              >
                <Download className="w-3 h-3" />
                <span>Export .log</span>
              </button>
            </div>

            {/* Terminal log output */}
            <div className="h-44 overflow-y-auto bg-black rounded-xl p-2.5 font-mono text-[10px] space-y-1 text-slate-300 select-text">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className={`leading-relaxed break-all ${
                    log.level === 'error'
                      ? 'text-rose-400'
                      : log.level === 'warning'
                      ? 'text-amber-300'
                      : log.level === 'notice'
                      ? 'text-cyan-300'
                      : 'text-slate-300'
                  }`}
                >
                  <span className="text-slate-600 mr-1.5">[{log.timestamp}]</span>
                  <span>{log.message}</span>
                </div>
              ))}
              {filteredLogs.length === 0 && (
                <span className="text-slate-600">No logs for this filter.</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
