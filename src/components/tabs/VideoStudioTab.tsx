import React, { useState } from 'react';
import {
  HandbrakePreset,
  DimensionSettings,
  VideoSettings,
  FilterSettings,
  EnhancementSettings,
  DeviceProfileSettings,
  MotionBlurSettings,
  UpscaleSettings,
  AudioTrack,
  VideoSource,
} from '../../types/handbrake';
import {
  DEFAULT_ENHANCEMENT,
  DEFAULT_DEVICE_PROFILE,
  DEFAULT_MOTION_BLUR,
  DEFAULT_UPSCALE,
} from '../../services/enhancementEngine';
import {
  Sliders,
  Crop,
  Film,
  Volume2,
  Subtitles,
  Sparkles,
  RotateCw,
  Zap,
  Check,
  Plus,
  Trash2,
  Camera,
  Layers,
  Wand2,
  RefreshCw,
  Eye,
  Info,
  Smartphone,
  Video as VideoIcon,
  Maximize2,
  ListOrdered,
} from 'lucide-react';

interface VideoStudioTabProps {
  preset: HandbrakePreset;
  source: VideoSource | null;
  onUpdatePreset: (updated: HandbrakePreset) => void;
}

export type StudioSubTab =
  | 'summary'
  | 'dimensions'
  | 'filters'
  | 'enhancement'
  | 'device-profile'
  | 'motion-blur'
  | 'video'
  | 'audio'
  | 'subtitles'
  | 'chapters';

export const VideoStudioTab: React.FC<VideoStudioTabProps> = ({
  preset,
  source,
  onUpdatePreset,
}) => {
  const [activeTab, setActiveTab] = useState<StudioSubTab>('summary');

  const enhancement: EnhancementSettings = preset.enhancement || DEFAULT_ENHANCEMENT;
  const deviceProfile: DeviceProfileSettings = preset.deviceProfile || DEFAULT_DEVICE_PROFILE;
  const motionBlur: MotionBlurSettings = preset.motionBlur || DEFAULT_MOTION_BLUR;
  const upscale: UpscaleSettings = preset.upscale || DEFAULT_UPSCALE;

  const updateVideo = (partial: Partial<VideoSettings>) => {
    onUpdatePreset({
      ...preset,
      video: { ...preset.video, ...partial },
    });
  };

  const updateDimensions = (partial: Partial<DimensionSettings>) => {
    onUpdatePreset({
      ...preset,
      dimensions: { ...preset.dimensions, ...partial },
    });
  };

  const updateFilters = (partial: Partial<FilterSettings>) => {
    onUpdatePreset({
      ...preset,
      filters: { ...preset.filters, ...partial },
    });
  };

  const updateEnhancement = (partial: Partial<EnhancementSettings>) => {
    onUpdatePreset({
      ...preset,
      enhancement: { ...enhancement, ...partial },
    });
  };

  const resetSingleEnhancement = (key: keyof EnhancementSettings) => {
    updateEnhancement({ [key]: DEFAULT_ENHANCEMENT[key] });
  };

  const resetAllEnhancements = () => {
    onUpdatePreset({
      ...preset,
      enhancement: { ...DEFAULT_ENHANCEMENT },
    });
  };

  const updateDeviceProfile = (partial: Partial<DeviceProfileSettings>) => {
    onUpdatePreset({
      ...preset,
      deviceProfile: { ...deviceProfile, ...partial },
    });
  };

  const updateMotionBlur = (partial: Partial<MotionBlurSettings>) => {
    onUpdatePreset({
      ...preset,
      motionBlur: { ...motionBlur, ...partial },
    });
  };

  const updateUpscale = (partial: Partial<UpscaleSettings>) => {
    onUpdatePreset({
      ...preset,
      upscale: { ...upscale, ...partial },
    });
  };

  const addAudioTrack = () => {
    const newTrack: AudioTrack = {
      id: `aud-${Date.now()}`,
      name: `Track ${preset.audio.length + 1}`,
      language: 'English',
      codec: 'AAC (CoreAudio)',
      bitrateKbps: 160,
      mixdown: 'Stereo',
      gainDb: 0,
      drc: 0,
    };
    onUpdatePreset({
      ...preset,
      audio: [...preset.audio, newTrack],
    });
  };

  const removeAudioTrack = (id: string) => {
    if (preset.audio.length <= 1) return;
    onUpdatePreset({
      ...preset,
      audio: preset.audio.filter((t) => t.id !== id),
    });
  };

  const updateAudioTrack = (id: string, partial: Partial<AudioTrack>) => {
    onUpdatePreset({
      ...preset,
      audio: preset.audio.map((t) => (t.id === id ? { ...t, ...partial } : t)),
    });
  };

  const tabs: { id: StudioSubTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'summary', label: 'Summary', icon: Info },
    { id: 'dimensions', label: 'Dimensions', icon: Crop },
    { id: 'filters', label: 'Filters', icon: Sparkles },
    { id: 'enhancement', label: 'Enhancement', icon: Wand2 },
    { id: 'device-profile', label: 'Device Profile', icon: Smartphone },
    { id: 'motion-blur', label: 'Motion Blur', icon: Film },
    { id: 'video', label: 'Video', icon: VideoIcon },
    { id: 'audio', label: 'Audio', icon: Volume2 },
    { id: 'subtitles', label: 'Subtitles', icon: Subtitles },
    { id: 'chapters', label: 'Chapters', icon: ListOrdered },
  ];

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 text-slate-100 pb-24">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            HandBrake Inspector
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              v2.0 Core
            </span>
          </h1>
          <p className="text-xs text-slate-400">
            Configuring: <span className="text-amber-300 font-semibold">{preset.name}</span>
          </p>
        </div>
      </div>

      {/* HandBrake Desktop Tabs Bar */}
      <div className="flex overflow-x-auto p-1 bg-slate-900/90 rounded-xl border border-slate-800 gap-1 scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* --- TAB 1: SUMMARY --- */}
      {activeTab === 'summary' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-amber-400" />
              Preset Summary & Container
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-medium">Container Format</label>
                <select
                  value={preset.container}
                  onChange={(e) => onUpdatePreset({ ...preset, container: e.target.value as HandbrakePreset['container'] })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="mp4">MP4 (.mp4 / .m4v)</option>
                  <option value="mkv">Matroska (.mkv)</option>
                  <option value="webm">WebM (.webm)</option>
                  <option value="mov">QuickTime (.mov)</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-white/5">
                <div>
                  <span className="text-xs font-bold text-white block">Passthru Common Metadata</span>
                  <span className="text-[10px] text-slate-400">Preserve title, artist, year, and cover art tags</span>
                </div>
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-amber-500" />
              </div>
            </div>

            {/* Overview cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Video</span>
                <span className="text-xs font-bold text-slate-200 block truncate">{preset.video.codec}</span>
                <span className="text-[10px] text-amber-400">
                  {preset.video.framerate === 'same' ? 'VFR (Source FPS)' : `${preset.video.framerate} FPS`}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Dimensions</span>
                <span className="text-xs font-bold text-slate-200 block">
                  {preset.dimensions.width} × {preset.dimensions.height}
                </span>
                <span className="text-[10px] text-slate-400">{preset.dimensions.aspectRatio} Aspect</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Enhancement</span>
                <span className="text-xs font-bold text-slate-200 block">
                  {enhancement.sharpness > 0 || enhancement.noiseReduction > 0 ? 'Active Engine' : 'Neutral'}
                </span>
                <span className="text-[10px] text-emerald-400">
                  {deviceProfile.profile !== 'none' ? deviceProfile.profile : 'Standard Profile'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Audio</span>
                <span className="text-xs font-bold text-slate-200 block">{preset.audio[0]?.codec || 'AAC'}</span>
                <span className="text-[10px] text-slate-400">{preset.audio[0]?.bitrateKbps || 160} kbps</span>
              </div>
            </div>

            {/* SMPTE Color Bars / Video Frame Preview Box */}
            <div className="space-y-1.5 pt-2">
              <label className="text-xs text-slate-300 font-medium flex items-center justify-between">
                <span>Output Canvas Test Pattern & Preview</span>
                <span className="text-[10px] font-mono text-slate-500">100% Rec.709 Color Bars</span>
              </label>
              <div className="w-full h-36 rounded-xl overflow-hidden border border-slate-800 relative bg-black flex flex-col">
                <div className="flex-1 flex">
                  {['#c0c0c0', '#c0c000', '#00c0c0', '#00c000', '#c000c0', '#c00000', '#0000c0'].map((color, i) => (
                    <div key={i} className="flex-1 h-full" style={{ backgroundColor: color }} />
                  ))}
                </div>
                <div className="h-6 flex">
                  {['#0000c0', '#131313', '#c000c0', '#131313', '#00c0c0', '#131313', '#c0c0c0'].map((color, i) => (
                    <div key={i} className="flex-1 h-full" style={{ backgroundColor: color }} />
                  ))}
                </div>
                <div className="h-8 flex">
                  <div className="w-1/6 bg-[#00214c] h-full" />
                  <div className="w-1/6 bg-[#ffffff] h-full" />
                  <div className="w-1/6 bg-[#32006a] h-full" />
                  <div className="w-1/2 bg-[#131313] h-full flex items-center justify-between px-3 text-[10px] font-mono text-slate-400">
                    <span>{preset.dimensions.width}×{preset.dimensions.height}</span>
                    <span className="text-amber-400 font-bold">{preset.video.codec.split(' ')[0]}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: DIMENSIONS & SCALING --- */}
      {activeTab === 'dimensions' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Crop className="w-3.5 h-3.5 text-amber-400" />
              Source & Final Dimensions
            </h3>

            {/* Source Dimensions Banner */}
            <div className="p-3 rounded-xl bg-slate-950 border border-white/5 grid grid-cols-3 text-center">
              <div>
                <span className="text-[10px] text-slate-400 block">Storage Size</span>
                <span className="text-xs font-bold text-white">{source ? `${source.width} × ${source.height}` : '1920 × 1080'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Display Size</span>
                <span className="text-xs font-bold text-white">{source ? `${source.width} × ${source.height}` : '1920 × 1080'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Aspect Ratio</span>
                <span className="text-xs font-bold text-amber-400">
                  {source ? `${(source.width / (source.height || 1)).toFixed(2)}:1` : '16:9'}
                </span>
              </div>
            </div>

            {/* Resolution & Scaling */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-medium">Output Width</label>
                <input
                  type="number"
                  value={preset.dimensions.width}
                  onChange={(e) => updateDimensions({ width: parseInt(e.target.value, 10) || 1920 })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-medium">Output Height</label>
                <input
                  type="number"
                  value={preset.dimensions.height}
                  onChange={(e) => updateDimensions({ height: parseInt(e.target.value, 10) || 1080 })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>

            {/* Upscaling Options Section */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-amber-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Maximize2 className="w-4 h-4 text-amber-400" />
                  <div>
                    <span className="text-xs font-bold text-white block">Intelligent Resolution Upscaling</span>
                    <span className="text-[10px] text-slate-400">Lanczos & Bicubic high-fidelity interpolation</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400">Allow Upscaling</span>
                  <input
                    type="checkbox"
                    checked={upscale.allowUpscaling}
                    onChange={(e) => updateUpscale({ allowUpscaling: e.target.checked })}
                    className="w-4 h-4 accent-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { factor: 1, label: '1x (Original)' },
                  { factor: 2, label: '2x Upscale' },
                  { factor: 4, label: '4x Upscale' },
                  { factor: 8, label: '8x Extreme' },
                ].map((item) => (
                  <button
                    key={item.factor}
                    type="button"
                    onClick={() => {
                      const w = (source?.width || 1920) * item.factor;
                      const h = (source?.height || 1080) * item.factor;
                      updateUpscale({ multiplier: item.factor as UpscaleSettings['multiplier'] });
                      updateDimensions({ width: w, height: h });
                    }}
                    className={`py-2 px-2.5 rounded-lg text-xs font-semibold border transition-all ${
                      upscale.multiplier === item.factor
                        ? 'bg-amber-500/10 border-amber-500 text-amber-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-medium">Scaling Algorithm</label>
                <select
                  value={upscale.algorithm}
                  onChange={(e) => updateUpscale({ algorithm: e.target.value as UpscaleSettings['algorithm'] })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="lanczos">Lanczos-3 (Highest Sharpness & Detail Retention)</option>
                  <option value="bicubic">Bicubic (Balanced Natural Smoothness)</option>
                  <option value="bilinear">Bilinear (Fast / Resource Efficient)</option>
                </select>
              </div>
            </div>

            {/* Orientation & Cropping */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-slate-300">Orientation & Cropping</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Rotation</label>
                  <select
                    value={preset.filters.rotation}
                    onChange={(e) => updateFilters({ rotation: parseInt(e.target.value, 10) as 0 | 90 | 180 | 270 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="0">0° (None)</option>
                    <option value="90">90° Clockwise</option>
                    <option value="180">180° Inverted</option>
                    <option value="270">270° Counter-Clockwise</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-white/5">
                  <span className="text-xs text-white">Flip Horizontally</span>
                  <input
                    type="checkbox"
                    checked={preset.filters.flipHorizontal}
                    onChange={(e) => updateFilters({ flipHorizontal: e.target.checked })}
                    className="w-4 h-4 accent-amber-500"
                  />
                </div>
              </div>

              {/* Crop Margins */}
              <div className="p-3 rounded-xl bg-slate-950 border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-300">Pixel Cropping Margins</span>
                  <button
                    type="button"
                    onClick={() => updateDimensions({ cropTop: 0, cropBottom: 0, cropLeft: 0, cropRight: 0 })}
                    className="text-[10px] text-amber-400 hover:underline"
                  >
                    Clear All
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 block">Top</label>
                    <input
                      type="number"
                      value={preset.dimensions.cropTop}
                      onChange={(e) => updateDimensions({ cropTop: parseInt(e.target.value, 10) || 0 })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block">Bottom</label>
                    <input
                      type="number"
                      value={preset.dimensions.cropBottom}
                      onChange={(e) => updateDimensions({ cropBottom: parseInt(e.target.value, 10) || 0 })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block">Left</label>
                    <input
                      type="number"
                      value={preset.dimensions.cropLeft}
                      onChange={(e) => updateDimensions({ cropLeft: parseInt(e.target.value, 10) || 0 })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block">Right</label>
                    <input
                      type="number"
                      value={preset.dimensions.cropRight}
                      onChange={(e) => updateDimensions({ cropRight: parseInt(e.target.value, 10) || 0 })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 3: FILTERS (HandBrake Classic) --- */}
      {activeTab === 'filters' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Standard Video Processing Filters
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-medium">Deinterlace Filter</label>
                <select
                  value={preset.filters.deinterlace}
                  onChange={(e) => updateFilters({ deinterlace: e.target.value as FilterSettings['deinterlace'] })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="off">Off (Progressive Scan)</option>
                  <option value="decomb">Decomb (Motion Adaptive)</option>
                  <option value="yadif">Yadif (High Precision)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-medium">Classic Denoise</label>
                <select
                  value={preset.filters.denoise}
                  onChange={(e) => updateFilters({ denoise: e.target.value as FilterSettings['denoise'] })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="off">Off</option>
                  <option value="hqdn3d">hqdn3d (Spatial-Temporal 3D)</option>
                  <option value="nlmeans">NLMeans (Non-Local Means)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-medium">Denoise Strength</label>
                <select
                  value={preset.filters.denoiseStrength}
                  onChange={(e) => updateFilters({ denoiseStrength: e.target.value as FilterSettings['denoiseStrength'] })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="light">Light</option>
                  <option value="medium">Medium</option>
                  <option value="strong">Strong</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-medium">Unsharp Mask Sharpening</label>
                <select
                  value={preset.filters.sharpen}
                  onChange={(e) => updateFilters({ sharpen: e.target.value as FilterSettings['sharpen'] })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="off">Off</option>
                  <option value="unsharp">Unsharp (Classic Edge Sharpener)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-white/5">
              <div>
                <span className="text-xs font-bold text-white block">Color Grayscale</span>
                <span className="text-[10px] text-slate-400">Discard chroma channels for pure monochrome output</span>
              </div>
              <input
                type="checkbox"
                checked={preset.filters.grayscale}
                onChange={(e) => updateFilters({ grayscale: e.target.checked })}
                className="w-4 h-4 accent-amber-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 4: ADVANCED VIDEO ENHANCEMENT CONTROLS --- */}
      {activeTab === 'enhancement' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Wand2 className="w-3.5 h-3.5 text-amber-400" />
                  Advanced Video Enhancement Controls
                </h3>
                <p className="text-[11px] text-slate-400">
                  Real-time color grading, edge enhancement, and noise reduction
                </p>
              </div>
              <button
                type="button"
                onClick={resetAllEnhancements}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 text-xs font-semibold transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset All</span>
              </button>
            </div>

            {/* The 15 Parameters with Individual Sliders and Reset buttons */}
            <div className="space-y-3.5">
              {/* 1. Sharpness */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-white/5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-200">Sharpness: <span className="text-amber-400 font-mono">{enhancement.sharpness}</span></span>
                  <button
                    type="button"
                    onClick={() => resetSingleEnhancement('sharpness')}
                    className="text-[10px] text-slate-400 hover:text-white"
                  >
                    Reset (0)
                  </button>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={enhancement.sharpness}
                  onChange={(e) => updateEnhancement({ sharpness: parseInt(e.target.value, 10) })}
                  className="w-full accent-amber-500"
                />
              </div>

              {/* 2. Noise Reduction */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-white/5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-200">Noise Reduction: <span className="text-amber-400 font-mono">{enhancement.noiseReduction}</span></span>
                  <button
                    type="button"
                    onClick={() => resetSingleEnhancement('noiseReduction')}
                    className="text-[10px] text-slate-400 hover:text-white"
                  >
                    Reset (0)
                  </button>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={enhancement.noiseReduction}
                  onChange={(e) => updateEnhancement({ noiseReduction: parseInt(e.target.value, 10) })}
                  className="w-full accent-amber-500"
                />
              </div>

              {/* 3. Film Grain */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-white/5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-200">Film Grain: <span className="text-amber-400 font-mono">{enhancement.filmGrain}</span></span>
                  <button
                    type="button"
                    onClick={() => resetSingleEnhancement('filmGrain')}
                    className="text-[10px] text-slate-400 hover:text-white"
                  >
                    Reset (0)
                  </button>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={enhancement.filmGrain}
                  onChange={(e) => updateEnhancement({ filmGrain: parseInt(e.target.value, 10) })}
                  className="w-full accent-amber-500"
                />
              </div>

              {/* 4. Contrast */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-white/5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-200">Contrast: <span className="text-amber-400 font-mono">{enhancement.contrast}</span></span>
                  <button
                    type="button"
                    onClick={() => resetSingleEnhancement('contrast')}
                    className="text-[10px] text-slate-400 hover:text-white"
                  >
                    Reset (50)
                  </button>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={enhancement.contrast}
                  onChange={(e) => updateEnhancement({ contrast: parseInt(e.target.value, 10) })}
                  className="w-full accent-amber-500"
                />
              </div>

              {/* 5. Brightness */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-white/5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-200">Brightness: <span className="text-amber-400 font-mono">{enhancement.brightness}</span></span>
                  <button
                    type="button"
                    onClick={() => resetSingleEnhancement('brightness')}
                    className="text-[10px] text-slate-400 hover:text-white"
                  >
                    Reset (50)
                  </button>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={enhancement.brightness}
                  onChange={(e) => updateEnhancement({ brightness: parseInt(e.target.value, 10) })}
                  className="w-full accent-amber-500"
                />
              </div>

              {/* 6. Saturation */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-white/5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-200">Saturation: <span className="text-amber-400 font-mono">{enhancement.saturation}%</span></span>
                  <button
                    type="button"
                    onClick={() => resetSingleEnhancement('saturation')}
                    className="text-[10px] text-slate-400 hover:text-white"
                  >
                    Reset (100)
                  </button>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={enhancement.saturation}
                  onChange={(e) => updateEnhancement({ saturation: parseInt(e.target.value, 10) })}
                  className="w-full accent-amber-500"
                />
              </div>

              {/* 7. Gamma Correction */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-white/5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-200">Gamma Correction: <span className="text-amber-400 font-mono">{enhancement.gamma.toFixed(2)}</span></span>
                  <button
                    type="button"
                    onClick={() => resetSingleEnhancement('gamma')}
                    className="text-[10px] text-slate-400 hover:text-white"
                  >
                    Reset (1.00)
                  </button>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="3.0"
                  step="0.05"
                  value={enhancement.gamma}
                  onChange={(e) => updateEnhancement({ gamma: parseFloat(e.target.value) })}
                  className="w-full accent-amber-500"
                />
              </div>

              {/* 8. Exposure */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-white/5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-200">Exposure (EV): <span className="text-amber-400 font-mono">{enhancement.exposure > 0 ? `+${enhancement.exposure.toFixed(1)}` : enhancement.exposure.toFixed(1)}</span></span>
                  <button
                    type="button"
                    onClick={() => resetSingleEnhancement('exposure')}
                    className="text-[10px] text-slate-400 hover:text-white"
                  >
                    Reset (0.0)
                  </button>
                </div>
                <input
                  type="range"
                  min="-2.0"
                  max="2.0"
                  step="0.1"
                  value={enhancement.exposure}
                  onChange={(e) => updateEnhancement({ exposure: parseFloat(e.target.value) })}
                  className="w-full accent-amber-500"
                />
              </div>

              {/* 9. Clarity */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-white/5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-200">Clarity: <span className="text-amber-400 font-mono">{enhancement.clarity}</span></span>
                  <button
                    type="button"
                    onClick={() => resetSingleEnhancement('clarity')}
                    className="text-[10px] text-slate-400 hover:text-white"
                  >
                    Reset (0)
                  </button>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={enhancement.clarity}
                  onChange={(e) => updateEnhancement({ clarity: parseInt(e.target.value, 10) })}
                  className="w-full accent-amber-500"
                />
              </div>

              {/* 10. Detail Enhancement */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-white/5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-200">Detail Enhancement: <span className="text-amber-400 font-mono">{enhancement.detailEnhancement}</span></span>
                  <button
                    type="button"
                    onClick={() => resetSingleEnhancement('detailEnhancement')}
                    className="text-[10px] text-slate-400 hover:text-white"
                  >
                    Reset (0)
                  </button>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={enhancement.detailEnhancement}
                  onChange={(e) => updateEnhancement({ detailEnhancement: parseInt(e.target.value, 10) })}
                  className="w-full accent-amber-500"
                />
              </div>

              {/* 11. Color Temperature */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-white/5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-200">Color Temperature: <span className="text-amber-400 font-mono">{enhancement.colorTemperature}K</span></span>
                  <button
                    type="button"
                    onClick={() => resetSingleEnhancement('colorTemperature')}
                    className="text-[10px] text-slate-400 hover:text-white"
                  >
                    Reset (6500K)
                  </button>
                </div>
                <input
                  type="range"
                  min="2000"
                  max="10000"
                  step="100"
                  value={enhancement.colorTemperature}
                  onChange={(e) => updateEnhancement({ colorTemperature: parseInt(e.target.value, 10) })}
                  className="w-full accent-amber-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>2000K (Warm Candle)</span>
                  <span>6500K (Daylight)</span>
                  <span>10000K (Cool Sky)</span>
                </div>
              </div>

              {/* 12. White Balance Mode */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">White Balance Mode</span>
                  <span className="text-[10px] text-slate-400">Choose between Auto adaptive balance or Manual Kelvin</span>
                </div>
                <div className="flex items-center gap-2">
                  {['auto', 'manual'].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => updateEnhancement({ whiteBalanceMode: mode as 'auto' | 'manual' })}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize border ${
                        enhancement.whiteBalanceMode === mode
                          ? 'bg-amber-500 text-slate-950 font-bold border-amber-500'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* 13. Highlights */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-white/5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-200">Highlights: <span className="text-amber-400 font-mono">{enhancement.highlights > 0 ? `+${enhancement.highlights}` : enhancement.highlights}</span></span>
                  <button
                    type="button"
                    onClick={() => resetSingleEnhancement('highlights')}
                    className="text-[10px] text-slate-400 hover:text-white"
                  >
                    Reset (0)
                  </button>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={enhancement.highlights}
                  onChange={(e) => updateEnhancement({ highlights: parseInt(e.target.value, 10) })}
                  className="w-full accent-amber-500"
                />
              </div>

              {/* 14. Shadows */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-white/5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-200">Shadows: <span className="text-amber-400 font-mono">{enhancement.shadows > 0 ? `+${enhancement.shadows}` : enhancement.shadows}</span></span>
                  <button
                    type="button"
                    onClick={() => resetSingleEnhancement('shadows')}
                    className="text-[10px] text-slate-400 hover:text-white"
                  >
                    Reset (0)
                  </button>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={enhancement.shadows}
                  onChange={(e) => updateEnhancement({ shadows: parseInt(e.target.value, 10) })}
                  className="w-full accent-amber-500"
                />
              </div>

              {/* 15. Vibrance */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-white/5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-200">Vibrance: <span className="text-amber-400 font-mono">{enhancement.vibrance}%</span></span>
                  <button
                    type="button"
                    onClick={() => resetSingleEnhancement('vibrance')}
                    className="text-[10px] text-slate-400 hover:text-white"
                  >
                    Reset (100)
                  </button>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={enhancement.vibrance}
                  onChange={(e) => updateEnhancement({ vibrance: parseInt(e.target.value, 10) })}
                  className="w-full accent-amber-500"
                />
              </div>
            </div>

            {/* Additional Image Processing Options (Toggles) */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                Additional Image Processing Modules
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { key: 'aiDenoise', label: 'AI Algorithmic Denoising', desc: 'Bilateral edge-preserving noise filter' },
                  { key: 'debanding', label: 'Debanding', desc: 'Eliminates color stepping & 8-bit gradient rings' },
                  { key: 'dehazing', label: 'Dehazing', desc: 'Recovers depth contrast in foggy / hazy frames' },
                  { key: 'edgeEnhancement', label: 'Edge Enhancement', desc: 'Smart high-pass contrast on fine contours' },
                  { key: 'chromaNoiseReduction', label: 'Chroma Noise Reduction', desc: 'Suppresses colored speckle artifacts' },
                  { key: 'lumaNoiseReduction', label: 'Luma Noise Reduction', desc: 'Smooths luminance grain without blur' },
                  { key: 'colorCorrection', label: 'Color Correction', desc: 'Natural color space normalization' },
                  { key: 'motionBlurReduction', label: 'Motion Blur Reduction', desc: 'Deconvolution sharpening on motion' },
                  { key: 'filmGrainSimulation', label: 'Film Grain Simulation', desc: 'Organic 35mm photochemical texture' },
                  { key: 'artificialSharpening', label: 'Artificial Sharpening', desc: 'High-contrast edge boost' },
                ].map((item) => {
                  const isChecked = Boolean(enhancement[item.key as keyof EnhancementSettings]);
                  return (
                    <div
                      key={item.key}
                      onClick={() => updateEnhancement({ [item.key]: !isChecked })}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-2 ${
                        isChecked
                          ? 'bg-amber-500/10 border-amber-500/40 text-white'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <span className="text-xs font-bold text-white block">{item.label}</span>
                        <span className="text-[10px] text-slate-400 block">{item.desc}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="w-4 h-4 accent-amber-500 mt-0.5"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 5: RECORDING DEVICE QUALITY SIMULATION --- */}
      {activeTab === 'device-profile' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                Recording Quality Profile Simulation
              </h3>
              <p className="text-[11px] text-slate-400">
                Simulate optical, sensor, color, and dynamic range traits of different recording hardware
              </p>
            </div>

            {/* Profile Intensity Slider */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Simulation Profile Intensity</span>
                <span className="text-xs font-mono text-amber-400">{deviceProfile.intensity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={deviceProfile.intensity}
                onChange={(e) => updateDeviceProfile({ intensity: parseInt(e.target.value, 10) })}
                className="w-full accent-amber-500"
              />
            </div>

            {/* The 7 Available Profiles */}
            <div className="space-y-2.5">
              {[
                {
                  id: 'none',
                  title: 'Neutral / Passthrough',
                  desc: 'No device simulation applied. Raw source camera characteristics preserved.',
                  badge: 'Standard',
                },
                {
                  id: 'normal-hd',
                  title: 'Normal HD Recording',
                  desc: 'Simulate standard 1080p mobile or camera footage with balanced clarity and contrast.',
                  badge: '1080p Standard',
                },
                {
                  id: 'low-class-mobile',
                  title: 'Low Class Mobile Recording',
                  desc: 'Entry-level budget smartphone sensor. Reduced sharpness, visible block compression, moderate noise, crushed dynamic range, and slight motion blur.',
                  badge: 'Budget Phone',
                },
                {
                  id: 'standard-mobile',
                  title: 'Standard Mobile Recording',
                  desc: 'Average mid-range smartphone camera quality with standard digital sharpening and consumer tone curve.',
                  badge: 'Mid-Tier Mobile',
                },
                {
                  id: 'high-quality-android',
                  title: 'High Quality Android Recording',
                  desc: 'Flagship Android smartphone processing with vibrant punchy saturation, strong local HDR contrast, and vivid colors.',
                  badge: 'Flagship Android',
                },
                {
                  id: 'iphone-quality',
                  title: 'iPhone Quality',
                  desc: 'Simulate flagship iPhone video characteristics: organic sharpness, balanced contrast, realistic skin tones, smooth highlight roll-off, and zero artificial halos.',
                  badge: 'Apple iPhone',
                },
                {
                  id: 'professional-camera',
                  title: 'Professional Camera',
                  desc: 'DSLR / cinema camera emulation: soft organic micro-contrast, wide dynamic range, cinema log curve, and zero digital edge enhancement.',
                  badge: 'DSLR / Cinema',
                },
                {
                  id: 'cinematic',
                  title: 'Cinematic Recording',
                  desc: 'Kodak 2383-inspired film emulation with rich shadows, warm highlights, controlled highlight roll-off, and subtle 35mm grain.',
                  badge: '35mm Film',
                },
              ].map((p) => {
                const isSelected = deviceProfile.profile === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => updateDeviceProfile({ profile: p.id as DeviceProfileSettings['profile'] })}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500 text-white shadow-sm'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{p.title}</span>
                        <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800 text-amber-400">
                          {p.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{p.desc}</p>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected ? 'border-amber-500 bg-amber-500 text-slate-950' : 'border-slate-700'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                <strong>Notice:</strong> These are visual simulation profiles designed to simulate visual characteristics of footage recorded on various device classes. They do not alter native sensor firmware.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 6: MOTION BLUR CONTROLS --- */}
      {activeTab === 'motion-blur' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Film className="w-3.5 h-3.5 text-amber-400" />
                  Motion Blur & Shutter Speed Controls
                </h3>
                <p className="text-[11px] text-slate-400">
                  Simulate mechanical shutter angles and directional motion vectors
                </p>
              </div>

              {/* Master Toggle */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white">Enable Motion Blur</span>
                <input
                  type="checkbox"
                  checked={motionBlur.enabled}
                  onChange={(e) => updateMotionBlur({ enabled: e.target.checked })}
                  className="w-4 h-4 accent-amber-500"
                />
              </div>
            </div>

            {/* Motion Blur Intensity */}
            <div className="p-3 rounded-xl bg-slate-950/70 border border-white/5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-200">Motion Blur Intensity: <span className="text-amber-400 font-mono">{motionBlur.intensity}%</span></span>
                <button
                  type="button"
                  onClick={() => updateMotionBlur({ intensity: 40 })}
                  className="text-[10px] text-slate-400 hover:text-white"
                >
                  Reset (40%)
                </button>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={motionBlur.intensity}
                onChange={(e) => updateMotionBlur({ intensity: parseInt(e.target.value, 10) })}
                className="w-full accent-amber-500"
              />
            </div>

            {/* Motion Blur Direction */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-300 font-medium">Motion Blur Direction</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'natural', label: 'Natural Flow' },
                  { id: 'horizontal', label: 'Horizontal Pan' },
                  { id: 'vertical', label: 'Vertical Tilt' },
                  { id: 'radial', label: 'Radial Zoom' },
                ].map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => updateMotionBlur({ direction: d.id as MotionBlurSettings['direction'] })}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                      motionBlur.direction === d.id
                        ? 'bg-amber-500/10 border-amber-500 text-amber-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Shutter Speed Simulation */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-300 font-medium">Shutter Speed Simulation (180° Rule)</label>
              <select
                value={motionBlur.shutterSpeed}
                onChange={(e) => updateMotionBlur({ shutterSpeed: e.target.value as MotionBlurSettings['shutterSpeed'] })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="1/24">1/24s (Extreme Film Motion Blur / Dreamlike)</option>
                <option value="1/30">1/30s (Slow Shutter / Broadcast Blur)</option>
                <option value="1/60">1/60s (Standard 180° Shutter for 30fps)</option>
                <option value="1/120">1/120s (Fast Shutter / Crisp Action)</option>
                <option value="1/240">1/240s (Sports / Ultra Fast Shutter)</option>
              </select>
            </div>

            {/* Additional Blur Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
              <div
                onClick={() => updateMotionBlur({ motionBlurReduction: !motionBlur.motionBlurReduction })}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                  motionBlur.motionBlurReduction
                    ? 'bg-amber-500/10 border-amber-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <div>
                  <span className="text-xs font-bold block text-white">Motion Blur Reduction</span>
                  <span className="text-[10px] text-slate-400">De-blur fast motion</span>
                </div>
                <input type="checkbox" checked={motionBlur.motionBlurReduction} onChange={() => {}} className="w-4 h-4 accent-amber-500" />
              </div>

              <div
                onClick={() => updateMotionBlur({ frameInterpolation: !motionBlur.frameInterpolation })}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                  motionBlur.frameInterpolation
                    ? 'bg-amber-500/10 border-amber-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <div>
                  <span className="text-xs font-bold block text-white">Frame Interpolation</span>
                  <span className="text-[10px] text-slate-400">Synthesize intermediate frames</span>
                </div>
                <input type="checkbox" checked={motionBlur.frameInterpolation} onChange={() => {}} className="w-4 h-4 accent-amber-500" />
              </div>

              <div
                onClick={() => updateMotionBlur({ opticalFlow: !motionBlur.opticalFlow })}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                  motionBlur.opticalFlow
                    ? 'bg-amber-500/10 border-amber-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <div>
                  <span className="text-xs font-bold block text-white">Optical Flow Vectors</span>
                  <span className="text-[10px] text-slate-400">Per-object motion tracking</span>
                </div>
                <input type="checkbox" checked={motionBlur.opticalFlow} onChange={() => {}} className="w-4 h-4 accent-amber-500" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 7: VIDEO & CODEC ENCODER OPTIONS --- */}
      {activeTab === 'video' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Film className="w-3.5 h-3.5 text-amber-400" />
              Video Encoder & Compression Settings
            </h3>

            {/* Video Codec */}
            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-medium">Video Encoder</label>
              <select
                value={preset.video.codec}
                onChange={(e) => updateVideo({ codec: e.target.value as VideoSettings['codec'] })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="H.265 (HEVC 10-bit)">H.265 / HEVC 10-bit (Apple VideoToolbox / MediaCodec)</option>
                <option value="H.264 (VideoToolbox / AVC)">H.264 / AVC (Universal Compatibility)</option>
                <option value="AV1 (SVT-AV1)">AV1 (Next-Generation High Compression)</option>
                <option value="Apple ProRes 422">Apple ProRes 422 (Post-Production Master)</option>
                <option value="VP9">Google VP9 (Web & YouTube Standard)</option>
              </select>
            </div>

            {/* Framerate & Mode */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-medium">Framerate (FPS)</label>
                <select
                  value={preset.video.framerate}
                  onChange={(e) => updateVideo({ framerate: e.target.value === 'same' ? 'same' : parseInt(e.target.value, 10) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="same">Same as Source</option>
                  <option value="60">60 FPS</option>
                  <option value="50">50 FPS (PAL)</option>
                  <option value="30">30 FPS (Standard)</option>
                  <option value="25">25 FPS (PAL Standard)</option>
                  <option value="24">24 FPS (Cinematic Standard)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-medium">Framerate Mode</label>
                <div className="flex items-center gap-2 pt-1">
                  <label className="flex items-center gap-1.5 text-xs text-slate-300">
                    <input
                      type="radio"
                      name="framerateMode"
                      value="vfr"
                      checked={preset.video.framerateMode === 'vfr'}
                      onChange={() => updateVideo({ framerateMode: 'vfr' })}
                      className="accent-amber-500"
                    />
                    <span>Peak Framerate (VFR)</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-slate-300">
                    <input
                      type="radio"
                      name="framerateMode"
                      value="cfr"
                      checked={preset.video.framerateMode === 'cfr'}
                      onChange={() => updateVideo({ framerateMode: 'cfr' })}
                      className="accent-amber-500"
                    />
                    <span>Constant (CFR)</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Quality Controls: CRF vs Bitrate */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-bold text-white">
                  <input
                    type="radio"
                    name="qualityMode"
                    value="rf"
                    checked={preset.video.qualityMode === 'rf'}
                    onChange={() => updateVideo({ qualityMode: 'rf' })}
                    className="accent-amber-500"
                  />
                  <span>Constant Quality (CRF / RF)</span>
                </label>
                <span className="text-xs font-mono text-amber-400">
                  {preset.video.qualityMode === 'rf' ? `RF ${preset.video.rfValue}` : 'Disabled'}
                </span>
              </div>

              {preset.video.qualityMode === 'rf' && (
                <div className="space-y-1">
                  <input
                    type="range"
                    min="0"
                    max="51"
                    value={preset.video.rfValue}
                    onChange={(e) => updateVideo({ rfValue: parseInt(e.target.value, 10) })}
                    className="w-full accent-amber-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>RF 0 (Lossless)</span>
                    <span>RF 20 (Visually Lossless)</span>
                    <span>RF 51 (Low Quality)</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <label className="flex items-center gap-2 text-xs font-bold text-white">
                  <input
                    type="radio"
                    name="qualityMode"
                    value="bitrate"
                    checked={preset.video.qualityMode === 'bitrate'}
                    onChange={() => updateVideo({ qualityMode: 'bitrate' })}
                    className="accent-amber-500"
                  />
                  <span>Average Target Bitrate (kbps)</span>
                </label>
                {preset.video.qualityMode === 'bitrate' && (
                  <input
                    type="number"
                    value={preset.video.bitrateKbps}
                    onChange={(e) => updateVideo({ bitrateKbps: parseInt(e.target.value, 10) || 6000 })}
                    className="w-24 bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-xs text-white text-right font-mono"
                  />
                )}
              </div>

              {/* 2-Pass Encoding */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-300">Multi-Pass (2-Pass) Encoding</span>
                <input
                  type="checkbox"
                  checked={preset.video.twoPass}
                  onChange={(e) => updateVideo({ twoPass: e.target.checked })}
                  className="w-4 h-4 accent-amber-500"
                />
              </div>
            </div>

            {/* Encoder Speed Preset */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
                <span>Encoder Speed Preset</span>
                <span className="text-amber-400 capitalize font-mono">{preset.video.encoderSpeedPreset}</span>
              </div>
              <input
                type="range"
                min="0"
                max="5"
                value={['ultrafast', 'veryfast', 'faster', 'fast', 'medium', 'slow'].indexOf(preset.video.encoderSpeedPreset)}
                onChange={(e) => {
                  const presetsList = ['ultrafast', 'veryfast', 'faster', 'fast', 'medium', 'slow'] as const;
                  updateVideo({ encoderSpeedPreset: presetsList[parseInt(e.target.value, 10)] });
                }}
                className="w-full accent-amber-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>Ultrafast</span>
                <span>Fast</span>
                <span>Slow (High Compression)</span>
              </div>
            </div>

            {/* Profile & Level */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-medium">Encoder Profile</label>
                <select
                  value={preset.video.encoderProfile}
                  onChange={(e) => updateVideo({ encoderProfile: e.target.value as VideoSettings['encoderProfile'] })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="auto">Auto</option>
                  <option value="baseline">Baseline</option>
                  <option value="main">Main</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-medium">Color Space & Range</label>
                <select
                  value={preset.video.colorSpace}
                  onChange={(e) => updateVideo({ colorSpace: e.target.value as VideoSettings['colorSpace'] })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="auto">Auto (Match Source)</option>
                  <option value="bt709">BT.709 (Standard HD / SDR)</option>
                  <option value="bt2020_hdr">BT.2020 HDR (10-bit High Dynamic Range)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 8: AUDIO TRACKS --- */}
      {activeTab === 'audio' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                  Audio Tracks & Multi-Stream Muxing
                </h3>
                <p className="text-[11px] text-slate-400">Configure CoreAudio AAC, AC3 passthru, gain, and DRC</p>
              </div>
              <button
                type="button"
                onClick={addAudioTrack}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 text-xs font-bold shadow-sm"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Add Track</span>
              </button>
            </div>

            <div className="space-y-3">
              {preset.audio.map((track, idx) => (
                <div key={track.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Track #{idx + 1}: {track.name}</span>
                    {preset.audio.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeAudioTrack(track.id)}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400">Codec</label>
                      <select
                        value={track.codec}
                        onChange={(e) => updateAudioTrack(track.id, { codec: e.target.value as AudioTrack['codec'] })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white"
                      >
                        <option value="AAC (CoreAudio)">AAC (CoreAudio)</option>
                        <option value="AC3">AC3 Surround</option>
                        <option value="Opus">Opus</option>
                        <option value="MP3">MP3</option>
                        <option value="Auto Passthru">Auto Passthru</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400">Bitrate</label>
                      <select
                        value={track.bitrateKbps}
                        onChange={(e) => updateAudioTrack(track.id, { bitrateKbps: parseInt(e.target.value, 10) })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white"
                      >
                        <option value="128">128 kbps</option>
                        <option value="160">160 kbps</option>
                        <option value="192">192 kbps</option>
                        <option value="256">256 kbps</option>
                        <option value="320">320 kbps</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400">Mixdown</label>
                      <select
                        value={track.mixdown}
                        onChange={(e) => updateAudioTrack(track.id, { mixdown: e.target.value as AudioTrack['mixdown'] })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white"
                      >
                        <option value="Stereo">Stereo</option>
                        <option value="5.1 Surround">5.1 Surround</option>
                        <option value="Dolby Pro Logic II">Dolby Pro Logic II</option>
                        <option value="Mono">Mono</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400">Gain (dB)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={track.gainDb}
                        onChange={(e) => updateAudioTrack(track.id, { gainDb: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 9: SUBTITLES --- */}
      {activeTab === 'subtitles' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Subtitles className="w-3.5 h-3.5 text-amber-400" />
              Subtitle Streams & Hardcoded Burn-in
            </h3>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">Burn-in Subtitles (Hardsub)</span>
                  <span className="text-[10px] text-slate-400">Render subtitles directly into video pixels for universal display</span>
                </div>
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-amber-500" />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
              No embedded subtitle streams detected in current source file. You can import external <code>.srt</code> or <code>.vtt</code> sidecar tracks during transcoding.
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 10: CHAPTERS --- */}
      {activeTab === 'chapters' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ListOrdered className="w-3.5 h-3.5 text-amber-400" />
              Chapter Markers & Segmentation
            </h3>

            <div className="space-y-2">
              {[
                { number: 1, title: 'Introduction', timestamp: '00:00:00' },
                { number: 2, title: 'Main Demonstration', timestamp: '00:02:15' },
                { number: 3, title: 'Enhancement Comparison', timestamp: '00:05:40' },
                { number: 4, title: 'Summary & Credits', timestamp: '00:07:30' },
              ].map((chap) => (
                <div key={chap.number} className="p-3 rounded-xl bg-slate-950 border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-400 font-mono text-xs flex items-center justify-center font-bold">
                      {chap.number}
                    </span>
                    <div>
                      <span className="text-xs font-bold text-white block">{chap.title}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{chap.timestamp}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Active
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
