import React, { useState } from 'react';
import { HandbrakePreset } from '../../types/handbrake';
import {
  Search,
  Check,
  Plus,
  Download,
  Upload,
  Sparkles,
  Sliders,
  Trash2,
  Apple,
  Globe,
  Film,
  HardDrive,
} from 'lucide-react';

interface PresetsTabProps {
  presets: HandbrakePreset[];
  activePresetId: string;
  onSelectPreset: (preset: HandbrakePreset) => void;
  onSaveCustomPreset: (preset: HandbrakePreset) => void;
  onDeleteCustomPreset: (presetId: string) => void;
}

export const PresetsTab: React.FC<PresetsTabProps> = ({
  presets,
  activePresetId,
  onSelectPreset,
  onSaveCustomPreset,
  onDeleteCustomPreset,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // New preset form state
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetDesc, setNewPresetDesc] = useState('');
  const [newPresetCodec, setNewPresetCodec] = useState<HandbrakePreset['video']['codec']>('H.265 (HEVC 10-bit)');
  const [newPresetRf, setNewPresetRf] = useState(22);
  const [newPresetResolution, setNewPresetResolution] = useState<'4K' | '1080p' | '720p'>('1080p');

  const categories = ['All', 'Apple Devices', 'General', 'Web', 'Matroska', 'Production', 'Custom'];

  const filteredPresets = presets.filter((p) => {
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.video.codec.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleCreatePreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;

    const width = newPresetResolution === '4K' ? 3840 : newPresetResolution === '1080p' ? 1920 : 1280;
    const height = newPresetResolution === '4K' ? 2160 : newPresetResolution === '1080p' ? 1080 : 720;

    const custom: HandbrakePreset = {
      id: `custom-${Date.now()}`,
      name: newPresetName.trim(),
      category: 'Custom',
      description: newPresetDesc.trim() || 'Custom user defined HandBrake preset',
      container: 'mp4',
      dimensions: {
        width,
        height,
        aspectRatio: '16:9',
        anamorphic: 'automatic',
        keepAspectRatio: true,
        cropMode: 'auto',
        cropTop: 0,
        cropBottom: 0,
        cropLeft: 0,
        cropRight: 0,
      },
      video: {
        codec: newPresetCodec,
        framerateMode: 'vfr',
        framerate: 30,
        qualityMode: 'rf',
        rfValue: newPresetRf,
        bitrateKbps: 5000,
        twoPass: false,
        turboFirstPass: false,
        encoderSpeedPreset: 'medium',
        encoderProfile: 'main',
        hardwareAcceleration: true,
        tenBitColor: newPresetCodec.includes('10-bit'),
        colorSpace: 'bt709',
      },
      audio: [
        {
          id: `aud-${Date.now()}`,
          name: 'Stereo Track',
          language: 'English',
          codec: 'AAC (CoreAudio)',
          bitrateKbps: 160,
          mixdown: 'Stereo',
          gainDb: 0,
          drc: 0,
        },
      ],
      filters: {
        deinterlace: 'decomb',
        denoise: 'off',
        denoiseStrength: 'light',
        sharpen: 'off',
        sharpenStrength: 0,
        rotation: 0,
        flipHorizontal: false,
        grayscale: false,
        brightness: 0,
        contrast: 0,
        saturation: 0,
      },
    };

    onSaveCustomPreset(custom);
    onSelectPreset(custom);
    setIsCreatingNew(false);
    setNewPresetName('');
    setNewPresetDesc('');
  };

  const handleExportPresets = () => {
    const jsonStr = JSON.stringify(presets, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'handbrake-ios-presets.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Apple Devices':
        return <Apple className="w-3.5 h-3.5" />;
      case 'Web':
        return <Globe className="w-3.5 h-3.5" />;
      case 'Production':
        return <Film className="w-3.5 h-3.5" />;
      case 'Matroska':
        return <HardDrive className="w-3.5 h-3.5" />;
      default:
        return <Sparkles className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 text-slate-100 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">Presets</h1>
          <p className="text-xs text-slate-400">
            HandBrake Standard & Apple Device Profiles
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleExportPresets}
            title="Export JSON"
            className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-xl transition-colors border border-slate-700/60"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setIsCreatingNew(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New</span>
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search presets by codec, resolution, or device..."
          className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
        />
      </div>

      {/* Category Pills (Horizontal Scroll) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-lg font-medium transition-colors ${
              selectedCategory === cat
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-900/70 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Presets List */}
      <div className="space-y-2.5">
        {filteredPresets.map((preset) => {
          const isActive = preset.id === activePresetId;
          return (
            <div
              key={preset.id}
              onClick={() => onSelectPreset(preset)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
                isActive
                  ? 'bg-amber-500/10 border-amber-500/40 shadow-sm'
                  : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">
                      {getCategoryIcon(preset.category)}
                    </span>
                    <h3 className="text-sm font-bold text-white truncate">
                      {preset.name}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                    {preset.description}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {preset.category === 'Custom' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteCustomPreset(preset.id);
                      }}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      title="Delete preset"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {isActive && (
                    <div className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>
              </div>

              {/* Specs Chips */}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2.5 pt-2 border-t border-white/5 text-[10px] font-mono text-slate-400">
                <span className="text-amber-400 font-semibold uppercase">{preset.container}</span>
                <span>·</span>
                <span>{preset.video.codec.split(' ')[0]}</span>
                <span>·</span>
                <span>{preset.dimensions.width}x{preset.dimensions.height}</span>
                <span>·</span>
                <span>
                  {preset.video.qualityMode === 'rf'
                    ? `RF ${preset.video.rfValue}`
                    : `${preset.video.bitrateKbps}kbps`}
                </span>
                <span>·</span>
                <span>{preset.audio[0]?.mixdown || 'Stereo'}</span>
              </div>
            </div>
          );
        })}

        {filteredPresets.length === 0 && (
          <div className="p-8 text-center text-slate-500 text-xs">
            No presets found matching "{searchQuery}".
          </div>
        )}
      </div>

      {/* Modal: Create Custom Preset */}
      {isCreatingNew && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Create Custom Preset</h3>
              <button
                type="button"
                onClick={() => setIsCreatingNew(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreatePreset} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Preset Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. My iPhone Archival 4K"
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Description</label>
                <input
                  type="text"
                  placeholder="e.g. High bitrate HEVC 10-bit for archiving"
                  value={newPresetDesc}
                  onChange={(e) => setNewPresetDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Resolution</label>
                  <select
                    value={newPresetResolution}
                    onChange={(e) => setNewPresetResolution(e.target.value as '4K' | '1080p' | '720p')}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="4K">4K UHD (3840x2160)</option>
                    <option value="1080p">1080p Full HD (1920x1080)</option>
                    <option value="720p">720p HD (1280x720)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Video Codec</label>
                  <select
                    value={newPresetCodec}
                    onChange={(e) => setNewPresetCodec(e.target.value as HandbrakePreset['video']['codec'])}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="H.265 (HEVC 10-bit)">H.265 (HEVC 10-bit)</option>
                    <option value="H.264 (VideoToolbox / AVC)">H.264 (AVC)</option>
                    <option value="AV1 (SVT-AV1)">AV1</option>
                    <option value="Apple ProRes 422">ProRes 422</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-medium">Constant Quality (RF)</label>
                  <span className="font-mono text-amber-400 font-bold">RF {newPresetRf}</span>
                </div>
                <input
                  type="range"
                  min="16"
                  max="32"
                  value={newPresetRf}
                  onChange={(e) => setNewPresetRf(parseInt(e.target.value, 10))}
                  className="w-full accent-amber-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>RF 16 (Archival)</span>
                  <span>RF 22 (Balanced)</span>
                  <span>RF 30 (Compact)</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-all"
                >
                  Save Preset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
