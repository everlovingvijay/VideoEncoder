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

export interface EnhancementSettings {
  sharpness: number; // 0 to 100 (default 0)
  noiseReduction: number; // 0 to 100 (default 0)
  filmGrain: number; // 0 to 100 (default 0)
  contrast: number; // 0 to 100 (default 50)
  brightness: number; // 0 to 100 (default 50)
  saturation: number; // 0 to 200 (default 100)
  gamma: number; // 0.1 to 3.0 (default 1.0)
  exposure: number; // -2.0 to 2.0 (default 0.0)
  clarity: number; // 0 to 100 (default 0)
  detailEnhancement: number; // 0 to 100 (default 0)
  colorTemperature: number; // 2000 to 10000 (default 6500)
  whiteBalanceMode: 'auto' | 'manual';
  highlights: number; // -100 to 100 (default 0)
  shadows: number; // -100 to 100 (default 0)
  vibrance: number; // 0 to 200 (default 100)
  // Additional image processing options
  aiDenoise: boolean;
  debanding: boolean;
  dehazing: boolean;
  edgeEnhancement: boolean;
  chromaNoiseReduction: boolean;
  lumaNoiseReduction: boolean;
  colorCorrection: boolean;
  motionBlurReduction: boolean;
  filmGrainSimulation: boolean;
  artificialSharpening: boolean;
}

export type DeviceProfileType =
  | 'none'
  | 'normal-hd'
  | 'low-class-mobile'
  | 'standard-mobile'
  | 'high-quality-android'
  | 'iphone-quality'
  | 'professional-camera'
  | 'cinematic';

export interface DeviceProfileSettings {
  profile: DeviceProfileType;
  intensity: number; // 0 to 100, default 100
}

export type MotionBlurDirection = 'horizontal' | 'vertical' | 'radial' | 'natural';
export type ShutterSpeed = '1/24' | '1/30' | '1/60' | '1/120' | '1/240';

export interface MotionBlurSettings {
  enabled: boolean;
  intensity: number; // 0 to 100, default 40
  direction: MotionBlurDirection;
  shutterSpeed: ShutterSpeed;
  motionBlurReduction: boolean;
  frameInterpolation: boolean;
  opticalFlow: boolean;
}

export type ScalingAlgorithm = 'lanczos' | 'bicubic' | 'bilinear';
export type UpscaleFactor = 'original' | '2x' | '4x' | '8x' | 'custom';

export interface UpscaleSettings {
  mode: 'auto' | 'preset' | 'multiplier';
  multiplier: 1 | 2 | 4 | 8;
  algorithm: ScalingAlgorithm;
  allowUpscaling: boolean;
  targetPresetId?: string;
}

export interface VideoAnalysisResult {
  width: number;
  height: number;
  aspectRatio: string;
  orientation: 'portrait' | 'landscape' | 'square';
  fps: number;
  durationSeconds: number;
  bitrateKbps: number;
  codec: string;
  noiseEstimate: 'low' | 'moderate' | 'high';
  compressionArtifacts: 'minimal' | 'moderate' | 'severe';
  dynamicRangeEstimate: 'narrow' | 'standard' | 'wide';
  sharpnessScore: number;
  recommendedPreset: string;
  recommendedReason: string;
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
  category: 'Enhancement Presets' | 'Apple Devices' | 'General' | 'Web' | 'Matroska' | 'Production' | 'Custom';
  description: string;
  container: ContainerFormat;
  dimensions: DimensionSettings;
  video: VideoSettings;
  audio: AudioTrack[];
  filters: FilterSettings;
  enhancement?: EnhancementSettings;
  deviceProfile?: DeviceProfileSettings;
  motionBlur?: MotionBlurSettings;
  upscale?: UpscaleSettings;
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
