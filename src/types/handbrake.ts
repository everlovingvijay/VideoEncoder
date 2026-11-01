export type VideoCodec = 'H.264 (VideoToolbox / AVC)' | 'H.265 (HEVC 10-bit)' | 'AV1 (SVT-AV1)' | 'VP9' | 'Apple ProRes 422';
export type AudioCodec = 'AAC (CoreAudio)' | 'AC3' | 'Opus' | 'MP3' | 'Auto Passthru';
export type QualityMode = 'rf' | 'bitrate';
export type FramerateMode = 'vfr' | 'cfr';
export type ContainerFormat = 'mp4' | 'mkv' | 'mov' | 'webm';

export interface VideoSettings {
  codec: VideoCodec;
  framerateMode: FramerateMode;
  framerate: number | 'same'; // 24, 25, 30, 60, or 'same'
  qualityMode: QualityMode;
  rfValue: number; // 0 - 51 (lower is higher quality, default 22)
  bitrateKbps: number; // e.g. 6000
  twoPass: boolean;
  turboFirstPass: boolean;
  encoderSpeedPreset: 'ultrafast' | 'veryfast' | 'faster' | 'fast' | 'medium' | 'slow';
  encoderProfile: 'baseline' | 'main' | 'high' | 'auto';
  hardwareAcceleration: boolean; // Apple VideoToolbox HW encoder
  tenBitColor: boolean;
  colorSpace: 'bt709' | 'bt2020_hdr' | 'auto';
}

export interface DimensionSettings {
  width: number;
  height: number;
  aspectRatio: string;
  anamorphic: 'none' | 'automatic' | 'strict';
  keepAspectRatio: boolean;
  cropMode: 'auto' | 'custom' | 'none';
  cropTop: number;
  cropBottom: number;
  cropLeft: number;
  cropRight: number;
}

export interface AudioTrack {
  id: string;
  name: string;
  language: string;
  codec: AudioCodec;
  bitrateKbps: number;
  mixdown: 'Stereo' | '5.1 Surround' | 'Dolby Pro Logic II' | 'Mono';
  gainDb: number;
  drc: number; // Dynamic range compression
}

export interface SubtitleTrack {
  id: string;
  language: string;
  title: string;
  format: 'srt' | 'vtt' | 'ass';
  burnIn: boolean; // Hardcoded into video
  forcedOnly: boolean;
  content?: string;
}

export interface FilterSettings {
  deinterlace: 'off' | 'decomb' | 'yadif';
  denoise: 'off' | 'hqdn3d' | 'nlmeans';
  denoiseStrength: 'light' | 'medium' | 'strong';
  sharpen: 'off' | 'unsharp';
  sharpenStrength: number; // 0 - 100
  rotation: 0 | 90 | 180 | 270;
  flipHorizontal: boolean;
  grayscale: boolean;
  brightness: number; // -100 to 100 (0 default)
  contrast: number; // -100 to 100 (0 default)
  saturation: number; // -100 to 100 (0 default)
}

export interface RangeSettings {
  mode: 'all' | 'seconds' | 'chapters';
  startSecond: number;
  endSecond: number;
  startChapter: number;
  endChapter: number;
}

export interface ChapterMarker {
  id: string;
  number: number;
  title: string;
  timestampSeconds: number;
}

export interface HandbrakePreset {
  id: string;
  name: string;
  category: 'Apple Devices' | 'General' | 'Web' | 'Matroska' | 'Production' | 'Custom';
  description: string;
  container: ContainerFormat;
  dimensions: DimensionSettings;
  video: VideoSettings;
  audio: AudioTrack[];
  filters: FilterSettings;
  isDefault?: boolean;
}

export interface VideoSource {
  id: string;
  name: string;
  sizeBytes: number;
  durationSeconds: number;
  width: number;
  height: number;
  fps: number;
  bitrateKbps: number;
  codec: string;
  url: string;
  thumbnailUrl: string;
  file?: File;
  chapters?: ChapterMarker[];
}

export type QueueItemStatus = 'waiting' | 'encoding' | 'paused' | 'completed' | 'failed' | 'cancelled';

export interface QueueItem {
  id: string;
  source: VideoSource;
  preset: HandbrakePreset;
  outputName: string;
  container: ContainerFormat;
  status: QueueItemStatus;
  progressPercent: number; // 0 - 100
  currentFrame: number;
  totalFrames: number;
  fps: number;
  etaSeconds: number;
  elapsedSeconds: number;
  pass: number;
  totalPasses: number;
  outputSizeBytes: number;
  outputBlobUrl?: string;
  errorMessage?: string;
  startedAt?: number;
  completedAt?: number;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'notice' | 'warning' | 'error' | 'debug';
  message: string;
}
