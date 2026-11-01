import React, { useState } from 'react';
import {
  HandbrakePreset,
  DimensionSettings,
  VideoSettings,
  FilterSettings,
  AudioTrack,
  VideoSource,
} from '../../types/handbrake';
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
} from 'lucide-react';

interface VideoStudioTabProps {
  preset: HandbrakePreset;
  source: VideoSource | null;
  onUpdatePreset: (updated: HandbrakePreset) => void;
}

export const VideoStudioTab: React.FC<VideoStudioTabProps> = ({
  preset,
  source,
  onUpdatePreset,
}) => {
  const [activeSection, setActiveSection] = useState<'video' | 'dimensions' | 'filters' | 'audio' | 'subtitles'>('video');

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

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 text-slate-100 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          Video Studio
          <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
            Inspector
          </span>
        </h1>
        <p className="text-xs text-slate-400">
          Fine-tune encoding parameters for "{preset.name}"
        </p>
      </div>

      {/* Segmented Section Picker */}
      <div className="grid grid-cols-5 p-1 bg-slate-900 rounded-xl border border-slate-800 text-[11px] font-medium">
        {[
          { id: 'video', label: 'Video', icon: Film },
          { id: 'dimensions', label: 'Size', icon: Crop },
          { id: 'filters', label: 'Filters', icon: Sparkles },
          { id: 'audio', label: 'Audio', icon: Volume2 },
          { id: 'subtitles', label: 'Subs', icon: Subtitles },
        ].map((sec) => {
          const Icon = sec.icon;
          const isActive = activeSection === sec.id;
          return (
            <button
              key={sec.id}
              type="button"
              onClick={() => setActiveSection(sec.id as typeof activeSection)}
              className={`flex flex-col items-center justify-center py-2 rounded-lg transition-colors gap-1 ${
                isActive
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{sec.label}</span>
            </button>
          );
        })}
      </div>

      {/* Section 1: Video & Codec */}
      {activeSection === 'video' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3.5">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Film className="w-3.5 h-3.5 text-amber-400" />
              Video Codec & Hardware Engine
            </h3>

            {/* Video Codec */}
            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-medium">Video Encoder</label>
              <select
                value={preset.video.codec}
                onChange={(e) => updateVideo({ codec: e.target.value as VideoSettings['codec'] })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="H.265 (HEVC 10-bit)">H.265 / HEVC 10-bit (Apple VideoToolbox)</option>
                <option value="H.264 (VideoToolbox / AVC)">H.264 / AVC (Apple VideoToolbox)</option>
                <option value="AV1 (SVT-AV1)">AV1 (Next-Gen High Efficiency)</option>
                <option value="Apple ProRes 422">Apple ProRes 422 (Broadcast Master)</option>
                <option value="VP9">Google VP9</option>
              </select>
            </div>

            {/* Hardware Acceleration Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">Apple VideoToolbox HW</span>
                  <span className="text-[10px] text-slate-400">Uses A17 Pro / M-series Media Engine</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={preset.video.hardwareAcceleration}
                onChange={(e) => updateVideo({ hardwareAcceleration: e.target.checked })}
                className="w-4 h-4 accent-amber-500"
              />
            </div>

            {/* Framerate */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-medium">Framerate (FPS)</label>
                <select
                  value={preset.video.framerate}
                  onChange={(e) => updateVideo({ framerate: e.target.value === 'same' ? 'same' : parseInt(e.target.value, 10) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="same">Same as Source</option>
                  <option value="60">60 FPS (Smooth)</option>
                  <option value="30">30 FPS (Standard)</option>
                  <option value="24">24 FPS (Cinematic)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-medium">Framerate Mode</label>
                <select
                  value={preset.video.framerateMode}
                  onChange={(e) => updateVideo({ framerateMode: e.target.value as 'vfr' | 'cfr' })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="vfr">Peak Framerate (VFR)</option>
                  <option value="cfr">Constant Framerate (CFR)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Quality Slider Section */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Quality Tuning (Rate Control)
              </h3>
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[10px]">
                <button
                  type="button"
                  onClick={() => updateVideo({ qualityMode: 'rf' })}
                  className={`px-2 py-0.5 rounded font-medium ${
                    preset.video.qualityMode === 'rf'
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-400'
                  }`}
                >
                  Constant (RF)
                </button>
                <button
                  type="button"
                  onClick={() => updateVideo({ qualityMode: 'bitrate' })}
                  className={`px-2 py-0.5 rounded font-medium ${
                    preset.video.qualityMode === 'bitrate'
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-400'
                  }`}
                >
                  Bitrate (2-Pass)
                </button>
              </div>
            </div>

            {preset.video.qualityMode === 'rf' ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">Constant Quality Factor</span>
                  <span className="text-amber-400 font-mono font-bold text-sm">
                    RF {preset.video.rfValue}
                  </span>
                </div>
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
                  <span className="text-amber-400 font-bold">RF 20–22 (Recommended)</span>
                  <span>RF 51 (Lowest)</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">Average Bitrate</span>
                  <span className="text-amber-400 font-mono font-bold text-sm">
                    {preset.video.bitrateKbps} kbps
                  </span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="25000"
                  step="250"
                  value={preset.video.bitrateKbps}
                  onChange={(e) => updateVideo({ bitrateKbps: parseInt(e.target.value, 10) })}
                  className="w-full accent-amber-500"
                />
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <label>2-Pass Turbo First Pass</label>
                  <input
                    type="checkbox"
                    checked={preset.video.turboFirstPass}
                    onChange={(e) => updateVideo({ turboFirstPass: e.target.checked })}
                    className="w-4 h-4 accent-amber-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Section 2: Dimensions & Crop */}
      {activeSection === 'dimensions' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3.5">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Crop className="w-3.5 h-3.5 text-amber-400" />
              Resolution & Aspect Ratio
            </h3>

            {/* Quick Resolution Buttons */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              {[
                { label: '4K UHD', w: 3840, h: 2160 },
                { label: '1080p Full HD', w: 1920, h: 1080 },
                { label: '720p HD', w: 1280, h: 720 },
              ].map((res) => {
                const isSelected = preset.dimensions.width === res.w && preset.dimensions.height === res.h;
                return (
                  <button
                    key={res.label}
                    type="button"
                    onClick={() => updateDimensions({ width: res.w, height: res.h })}
                    className={`py-2 px-1 rounded-xl text-center font-medium transition-colors ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-950 text-slate-300 border border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <span className="block">{res.label}</span>
                    <span className="text-[10px] opacity-80 font-mono">{res.w}x{res.h}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Sizing Inputs */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-medium">Width (px)</label>
                <input
                  type="number"
                  value={preset.dimensions.width}
                  onChange={(e) => updateDimensions({ width: parseInt(e.target.value, 10) || 1920 })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-medium">Height (px)</label>
                <input
                  type="number"
                  value={preset.dimensions.height}
                  onChange={(e) => updateDimensions({ height: parseInt(e.target.value, 10) || 1080 })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Cropping */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3.5">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Black Bar Cropping
            </h3>
            <div className="flex items-center gap-2">
              {(['auto', 'custom', 'none'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => updateDimensions({ cropMode: mode })}
                  className={`flex-1 py-1.5 rounded-lg text-xs capitalize font-medium transition-colors ${
                    preset.dimensions.cropMode === mode
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-950 text-slate-400 border border-slate-800'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            {preset.dimensions.cropMode === 'custom' && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400">Top:</span>
                  <input
                    type="number"
                    value={preset.dimensions.cropTop}
                    onChange={(e) => updateDimensions({ cropTop: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 font-mono"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Bottom:</span>
                  <input
                    type="number"
                    value={preset.dimensions.cropBottom}
                    onChange={(e) => updateDimensions({ cropBottom: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 font-mono"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Section 3: Filters & Color */}
      {activeSection === 'filters' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3.5">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Image Processing & Transforms
            </h3>

            {/* Rotation and Flip */}
            <div className="flex items-center justify-between">
              <label className="text-xs text-slate-300 font-medium">Rotation</label>
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px]">
                {([0, 90, 180, 270] as const).map((deg) => (
                  <button
                    key={deg}
                    type="button"
                    onClick={() => updateFilters({ rotation: deg })}
                    className={`px-2 py-0.5 rounded font-mono ${
                      preset.filters.rotation === deg
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'text-slate-400'
                    }`}
                  >
                    {deg}°
                  </button>
                ))}
              </div>
            </div>

            {/* Grayscale Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-white/5">
              <span className="text-xs font-medium text-slate-200">Convert to Black & White (Grayscale)</span>
              <input
                type="checkbox"
                checked={preset.filters.grayscale}
                onChange={(e) => updateFilters({ grayscale: e.target.checked })}
                className="w-4 h-4 accent-amber-500"
              />
            </div>

            {/* Brightness / Contrast / Saturation */}
            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Brightness</span>
                  <span className="font-mono text-amber-400">{preset.filters.brightness > 0 ? `+${preset.filters.brightness}` : preset.filters.brightness}%</span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  value={preset.filters.brightness}
                  onChange={(e) => updateFilters({ brightness: parseInt(e.target.value, 10) })}
                  className="w-full accent-amber-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Contrast</span>
                  <span className="font-mono text-amber-400">{preset.filters.contrast > 0 ? `+${preset.filters.contrast}` : preset.filters.contrast}%</span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  value={preset.filters.contrast}
                  onChange={(e) => updateFilters({ contrast: parseInt(e.target.value, 10) })}
                  className="w-full accent-amber-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Saturation</span>
                  <span className="font-mono text-amber-400">{preset.filters.saturation > 0 ? `+${preset.filters.saturation}` : preset.filters.saturation}%</span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  value={preset.filters.saturation}
                  onChange={(e) => updateFilters({ saturation: parseInt(e.target.value, 10) })}
                  className="w-full accent-amber-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section 4: Audio Tracks */}
      {activeSection === 'audio' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Audio Tracks ({preset.audio.length})
            </h3>
            <button
              type="button"
              onClick={addAudioTrack}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg border border-amber-500/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Track</span>
            </button>
          </div>

          {preset.audio.map((track, i) => (
            <div key={track.id} className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white">{track.name}</span>
                </div>
                {preset.audio.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeAudioTrack(track.id)}
                    className="text-slate-500 hover:text-rose-400 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="space-y-1">
                  <label className="text-slate-400">Mixdown</label>
                  <select
                    value={track.mixdown}
                    onChange={(e) => updateAudioTrack(track.id, { mixdown: e.target.value as AudioTrack['mixdown'] })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2"
                  >
                    <option value="Stereo">Stereo</option>
                    <option value="5.1 Surround">5.1 Surround</option>
                    <option value="Mono">Mono</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400">Bitrate</label>
                  <select
                    value={track.bitrateKbps}
                    onChange={(e) => updateAudioTrack(track.id, { bitrateKbps: parseInt(e.target.value, 10) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono"
                  >
                    <option value="96">96 kbps</option>
                    <option value="128">128 kbps</option>
                    <option value="160">160 kbps</option>
                    <option value="256">256 kbps</option>
                    <option value="320">320 kbps</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Section 5: Subtitles */}
      {activeSection === 'subtitles' && (
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3.5">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Subtitles className="w-3.5 h-3.5 text-amber-400" />
            Subtitle Tracks
          </h3>

          <div className="p-4 rounded-xl bg-slate-950 border border-white/5 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">Burn-in Subtitles (Hardcode)</span>
              <input type="checkbox" className="w-4 h-4 accent-amber-500" defaultChecked />
            </div>
            <p className="text-[11px] text-slate-400">
              Permanently renders subtitle text into video frames for universal playback on devices without soft subtitle support.
            </p>
          </div>

          <div className="border border-dashed border-slate-800 rounded-xl p-4 text-center text-xs text-slate-400 space-y-2">
            <p>Upload .SRT or .VTT file to include subtitles in this encode.</p>
            <button
              type="button"
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors font-medium"
            >
              Select Subtitle File
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
