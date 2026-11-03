import React, { useState, useRef, useMemo } from 'react';
import {
  VideoSource,
  HandbrakePreset,
} from '../../types/handbrake';
import {
  Upload,
  Play,
  Pause,
  SlidersHorizontal,
  PlusCircle,
  Zap,
  Film,
  Sparkles,
  Camera,
  Check,
  Split,
  ChevronRight,
  Maximize2,
  Sliders,
  Wand2,
  Smartphone,
  Layers,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { PRESET_SAMPLE_METADATA, generateSyntheticVideoBlob } from '../../data/sampleVideos';
import { DEFAULT_PRESETS } from '../../data/handbrakePresets';
import { analyzeFootage, computeUpscaleOptions } from '../../services/footageAnalyzer';
import { buildCanvasCssFilter } from '../../services/enhancementEngine';
import { capabilityDetector } from '../../services/capabilityDetector';

interface TranscodeTabProps {
  source: VideoSource | null;
  preset: HandbrakePreset;
  onSelectSource: (source: VideoSource) => void;
  onSelectPreset?: (preset: HandbrakePreset) => void;
  onOpenPresetsModal: () => void;
  onOpenStudioTab: () => void;
  onStartEncodeNow: () => void;
  onAddToQueue: () => void;
  isEncoding: boolean;
  latestEncodedUrl?: string;
}

export const TranscodeTab: React.FC<TranscodeTabProps> = ({
  source,
  preset,
  onSelectSource,
  onSelectPreset,
  onOpenPresetsModal,
  onOpenStudioTab,
  onStartEncodeNow,
  onAddToQueue,
  isEncoding,
  latestEncodedUrl,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [splitPos, setSplitPos] = useState(50); // A/B comparison slider
  const [showSplitMode, setShowSplitMode] = useState(true);
  const [isLoadingSample, setIsLoadingSample] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Analyze source video characteristics
  const analysis = useMemo(() => {
    if (!source) return null;
    return analyzeFootage(source);
  }, [source]);

  // Compute available upscaling options
  const upscaleOptions = useMemo(() => {
    if (!source) return [];
    return computeUpscaleOptions(source.width, source.height);
  }, [source]);

  // Calculate real-time CSS filter for enhanced preview
  const enhancedFilterCss = useMemo(() => {
    const filters = preset.filters;
    let css = '';
    if (filters.grayscale) css += 'grayscale(100%) ';
    if (filters.brightness !== 0) css += `brightness(${100 + filters.brightness}%) `;
    if (filters.contrast !== 0) css += `contrast(${100 + filters.contrast}%) `;
    if (filters.saturation !== 0) css += `saturate(${100 + filters.saturation}%) `;

    const customEnhancementCss = buildCanvasCssFilter(preset.enhancement, preset.deviceProfile);
    if (customEnhancementCss && customEnhancementCss !== 'none') {
      css += (css ? ' ' : '') + customEnhancementCss;
    }
    return css.trim() || 'none';
  }, [preset]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = url;
    video.onloadedmetadata = () => {
      onSelectSource({
        id: `upload-${Date.now()}`,
        name: file.name,
        sizeBytes: file.size,
        durationSeconds: video.duration || 10,
        width: video.videoWidth || 1920,
        height: video.videoHeight || 1080,
        fps: 30,
        bitrateKbps: Math.round((file.size * 8) / (video.duration || 10) / 1000),
        codec: file.type || 'video/mp4',
        url,
        thumbnailUrl: '',
        file,
      });
    };
  };

  const handleLoadSample = async (metaIndex: number) => {
    setIsLoadingSample(true);
    try {
      const meta = PRESET_SAMPLE_METADATA[metaIndex];
      const result = await generateSyntheticVideoBlob(
        meta.name.replace(/\.[^/.]+$/, ''),
        meta.width > 1920 ? 1920 : meta.width,
        meta.height > 1080 ? 1080 : meta.height,
        meta.durationSeconds > 10 ? 10 : meta.durationSeconds,
        meta.fps
      );

      onSelectSource({
        ...meta,
        url: result.url,
        thumbnailUrl: result.thumbnailUrl,
      });
    } catch (err) {
      console.error('Failed to generate sample video:', err);
    } finally {
      setIsLoadingSample(false);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  };

  const applyRecommendedPreset = () => {
    if (!analysis || !onSelectPreset) return;
    const matched = DEFAULT_PRESETS.find(
      (p) => p.name.toLowerCase() === analysis.recommendedPreset.toLowerCase()
    );
    if (matched) {
      onSelectPreset(matched);
    }
  };

  // Estimate output file size based on bitrate and duration
  const estimatedSizeBytes = source
    ? Math.round(((preset.video.qualityMode === 'bitrate' ? preset.video.bitrateKbps : 6000) * 1000 * source.durationSeconds) / 8)
    : 0;

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 text-slate-100 pb-24">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            Transcode & Enhance
            <span className="text-[10px] font-mono font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              v2.0 Core
            </span>
            <span className="hidden sm:inline-block text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              Hardware Accelerated
            </span>
          </h1>
          <p className="text-xs text-slate-400">
            Hardware Accelerated Video Enhancement & Encoding
          </p>
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-semibold text-xs rounded-xl shadow-sm transition-all"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Import</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={handleFileUpload}
        />
      </div>

      {/* Automatic Footage Inspection Banner */}
      {source && analysis && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-amber-950/30 border border-amber-500/20 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Footage Analysis & Recommendation
              </span>
            </div>
            <span className="text-[10px] font-mono text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 uppercase">
              {analysis.orientation} ({analysis.aspectRatio})
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
            <div className="p-2 rounded-lg bg-slate-950/70 border border-white/5">
              <span className="text-[9px] text-slate-400 uppercase block">Resolution</span>
              <span className="text-slate-200 font-bold">{analysis.width}×{analysis.height}</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-950/70 border border-white/5">
              <span className="text-[9px] text-slate-400 uppercase block">Framerate</span>
              <span className="text-slate-200 font-bold">{analysis.fps} FPS</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-950/70 border border-white/5">
              <span className="text-[9px] text-slate-400 uppercase block">Noise Level</span>
              <span className={`font-bold capitalize ${
                analysis.noiseEstimate === 'high' ? 'text-orange-400' : 'text-emerald-400'
              }`}>
                {analysis.noiseEstimate}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-slate-950/70 border border-white/5">
              <span className="text-[9px] text-slate-400 uppercase block">Compression</span>
              <span className={`font-bold capitalize ${
                analysis.compressionArtifacts === 'severe' ? 'text-red-400' : 'text-slate-200'
              }`}>
                {analysis.compressionArtifacts}
              </span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-amber-500/30 flex items-center justify-between gap-3">
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400">Recommended Preset:</span>
                <span className="text-xs font-bold text-amber-300 truncate">{analysis.recommendedPreset}</span>
              </div>
              <p className="text-[10px] text-slate-400 truncate leading-relaxed">
                {analysis.recommendedReason}
              </p>
            </div>
            <button
              type="button"
              onClick={applyRecommendedPreset}
              className="shrink-0 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow transition-all flex items-center gap-1"
            >
              <span>Apply Preset</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Video Preview Canvas with A/B Split Screen Comparison */}
      {source ? (
        <div className="space-y-2">
          <div className="relative rounded-2xl overflow-hidden bg-black aspect-video border border-white/10 shadow-xl group">
            {/* Base Video: Original or Before side */}
            <video
              ref={videoRef}
              src={source.url}
              playsInline
              loop
              className="w-full h-full object-contain"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />

            {/* Enhanced / After Side overlay with Real-Time Filters */}
            {showSplitMode && (
              <div
                className="absolute inset-0 overflow-hidden pointer-events-none"
                style={{ clipPath: `inset(0 0 0 ${splitPos}%)` }}
              >
                {latestEncodedUrl ? (
                  <video
                    src={latestEncodedUrl}
                    playsInline
                    loop
                    autoPlay
                    muted
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <video
                    src={source.url}
                    playsInline
                    loop
                    muted
                    autoPlay
                    className="w-full h-full object-contain"
                    style={{ filter: enhancedFilterCss }}
                  />
                )}
                <div className="absolute top-3 right-3 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-[10px] px-2.5 py-1 rounded-md shadow-md uppercase tracking-wider">
                  {latestEncodedUrl ? 'ENCODED' : 'ENHANCED PREVIEW'}
                </div>
              </div>
            )}

            {/* Draggable Split Scrubber Line */}
            {showSplitMode && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-20 cursor-ew-resize flex items-center justify-center pointer-events-auto"
                style={{ left: `${splitPos}%` }}
                onMouseDown={(e) => {
                  const parent = (e.currentTarget as HTMLElement).parentElement;
                  const moveHandler = (ev: MouseEvent) => {
                    if (parent) {
                      const rect = parent.getBoundingClientRect();
                      const pct = Math.max(0, Math.min(100, ((ev.clientX - rect.left) / rect.width) * 100));
                      setSplitPos(pct);
                    }
                  };
                  const upHandler = () => {
                    window.removeEventListener('mousemove', moveHandler);
                    window.removeEventListener('mouseup', upHandler);
                  };
                  window.addEventListener('mousemove', moveHandler);
                  window.addEventListener('mouseup', upHandler);
                }}
              >
                <div className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg border border-white/20 active:scale-110 transition-transform">
                  <Split className="w-3.5 h-3.5" />
                </div>
              </div>
            )}

            {/* Play / Pause Floating Overlay */}
            <button
              type="button"
              onClick={togglePlay}
              className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-xl hover:scale-105 active:scale-95 transition-transform">
                {isPlaying ? (
                  <Pause className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                )}
              </div>
            </button>

            {/* Before / Original Badge */}
            {showSplitMode && (
              <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md text-white font-bold text-[10px] px-2.5 py-1 rounded-md border border-white/10 uppercase tracking-wider">
                ORIGINAL
              </div>
            )}

            {/* Video Resolution & Framerate Chip */}
            <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-[11px] font-mono text-slate-300">
              <span>{source.width}×{source.height}</span>
              <span>·</span>
              <span>{source.fps} fps</span>
              <span>·</span>
              <span>{source.durationSeconds.toFixed(1)}s</span>
            </div>

            {/* A/B Split Screen Toggle Button */}
            <button
              type="button"
              onClick={() => setShowSplitMode(!showSplitMode)}
              className={`absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md ${
                showSplitMode
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-black/70 backdrop-blur-md text-white border border-white/10'
              }`}
            >
              <Split className="w-3.5 h-3.5" />
              <span>{showSplitMode ? 'Split Comparison Active' : 'Enable A/B Comparison'}</span>
            </button>
          </div>
        </div>
      ) : (
        /* Empty State with Drag-and-Drop and Sample Pickers */
        <div className="rounded-2xl border-2 border-dashed border-slate-700/80 bg-slate-900/40 p-6 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Film className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-white">No Video Selected</h3>
            <p className="text-xs text-slate-400 max-w-[280px]">
              Drop any local video file (MP4, MOV, MKV, WebM) or load a high-definition sample clip.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded-xl shadow transition-all flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              Browse Videos
            </button>
          </div>

          {/* Built-in Sample Videos for One-Click Testing */}
          <div className="w-full pt-4 border-t border-slate-800 text-left">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Instant Sample Clips
            </span>
            <div className="grid grid-cols-1 gap-2">
              {PRESET_SAMPLE_METADATA.map((sample, idx) => (
                <button
                  key={sample.id}
                  type="button"
                  disabled={isLoadingSample}
                  onClick={() => handleLoadSample(idx)}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left transition-colors group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-200 truncate group-hover:text-amber-300">
                        {sample.name}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {sample.width}x{sample.height} · {sample.fps}fps · {sample.codec}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Preset Selector Card */}
      <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">
                Active Encoding Preset
              </span>
              <h4 className="text-sm font-bold text-white">{preset.name}</h4>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenPresetsModal}
            className="px-2.5 py-1 text-xs font-medium text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg border border-amber-500/20 transition-colors"
          >
            Change Preset
          </button>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          {preset.description}
        </p>

        {/* Preset Parameter Summary Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px] font-mono">
          <div className="bg-slate-950/60 p-2 rounded-xl border border-white/5">
            <span className="text-slate-500 block text-[10px]">VIDEO CODEC</span>
            <span className="text-slate-200 truncate block">{preset.video.codec}</span>
          </div>
          <div className="bg-slate-950/60 p-2 rounded-xl border border-white/5">
            <span className="text-slate-500 block text-[10px]">QUALITY / RF</span>
            <span className="text-slate-200 block">
              {preset.video.qualityMode === 'rf'
                ? `Constant RF ${preset.video.rfValue}`
                : `${preset.video.bitrateKbps} kbps`}
            </span>
          </div>
          <div className="bg-slate-950/60 p-2 rounded-xl border border-white/5">
            <span className="text-slate-500 block text-[10px]">TARGET RESOLUTION</span>
            <span className="text-slate-200 block">
              {preset.dimensions.width}×{preset.dimensions.height}
            </span>
          </div>
          <div className="bg-slate-950/60 p-2 rounded-xl border border-white/5">
            <span className="text-slate-500 block text-[10px]">SIMULATION</span>
            <span className="text-emerald-400 truncate block">
              {preset.deviceProfile?.profile && preset.deviceProfile.profile !== 'none'
                ? preset.deviceProfile.profile
                : 'Neutral Profile'}
            </span>
          </div>
        </div>

        {/* Quick link to deep inspector */}
        <button
          type="button"
          onClick={onOpenStudioTab}
          className="w-full py-1.5 text-xs text-slate-400 hover:text-slate-200 flex items-center justify-center gap-1.5 transition-colors border-t border-slate-800/80 mt-1"
        >
          <SlidersHorizontal className="w-3 h-3 text-amber-400" />
          <span>Open HandBrake Inspector (15 Enhancement Sliders, Motion Blur, Upscaling)</span>
        </button>
      </div>

      {/* Primary Actions */}
      <div className="space-y-2 pt-1">
        <button
          type="button"
          disabled={!source || isEncoding}
          onClick={onStartEncodeNow}
          className={`w-full h-12 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
            !source || isEncoding
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none'
              : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-orange-500/20 active:scale-[0.98]'
          }`}
        >
          <Zap className="w-4 h-4 fill-current" />
          <span>{isEncoding ? 'Transcoding in Progress...' : 'Start Encode Now'}</span>
        </button>

        <button
          type="button"
          disabled={!source || isEncoding}
          onClick={onAddToQueue}
          className={`w-full h-11 rounded-2xl font-semibold text-xs flex items-center justify-center gap-2 border transition-all ${
            !source || isEncoding
              ? 'border-slate-800 text-slate-600 cursor-not-allowed'
              : 'border-slate-700 hover:border-slate-600 bg-slate-900/60 hover:bg-slate-800 text-slate-200 active:scale-[0.98]'
          }`}
        >
          <PlusCircle className="w-4 h-4 text-amber-400" />
          <span>Add to Batch Encoding Queue</span>
        </button>
      </div>

      {/* File Size Calculation Estimate */}
      {source && (
        <div className="text-center text-[11px] text-slate-500 font-mono">
          <span>Est. Output: ~{(estimatedSizeBytes / 1024 / 1024).toFixed(1)} MB</span>
          <span className="mx-1.5">·</span>
          <span>Source: {(source.sizeBytes / 1024 / 1024).toFixed(1)} MB</span>
          <span className="mx-1.5">·</span>
          <span className="text-emerald-400 font-semibold">
            {Math.max(0, Math.round((1 - estimatedSizeBytes / source.sizeBytes) * 100))}% reduction
          </span>
        </div>
      )}
    </div>
  );
};
