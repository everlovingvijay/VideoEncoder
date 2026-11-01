import { VideoAnalysisResult, VideoSource, HandbrakePreset } from '../types/handbrake';
import { DEFAULT_PRESETS } from '../data/handbrakePresets';

/**
 * Inspects source video characteristics and generates intelligent analysis and preset recommendation
 */
export function analyzeFootage(source: VideoSource): VideoAnalysisResult {
  const width = source.width || 1920;
  const height = source.height || 1080;
  const fps = source.fps || 30;
  const bitrateKbps = source.bitrateKbps || 4000;
  const duration = source.durationSeconds || 10;

  // Determine orientation
  let orientation: 'portrait' | 'landscape' | 'square' = 'landscape';
  if (height > width * 1.05) {
    orientation = 'portrait';
  } else if (Math.abs(width - height) < 20) {
    orientation = 'square';
  }

  // Calculate aspect ratio string
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(width, height);
  const ratioW = width / divisor;
  const ratioH = height / divisor;
  const aspectRatio = `${ratioW}:${ratioH}`;

  // Estimate compression quality based on bpp (bits per pixel per frame)
  const totalPixelsPerSec = width * height * fps;
  const bitsPerSec = bitrateKbps * 1000;
  const bpp = totalPixelsPerSec > 0 ? bitsPerSec / totalPixelsPerSec : 0.1;

  let compressionArtifacts: 'minimal' | 'moderate' | 'severe' = 'moderate';
  let noiseEstimate: 'low' | 'moderate' | 'high' = 'moderate';
  let dynamicRangeEstimate: 'narrow' | 'standard' | 'wide' = 'standard';
  let sharpnessScore = 70;

  if (bpp < 0.05 || width < 1280) {
    compressionArtifacts = 'severe';
    noiseEstimate = 'high';
    dynamicRangeEstimate = 'narrow';
    sharpnessScore = 45;
  } else if (bpp > 0.18 && width >= 1920) {
    compressionArtifacts = 'minimal';
    noiseEstimate = 'low';
    dynamicRangeEstimate = 'wide';
    sharpnessScore = 88;
  } else {
    compressionArtifacts = 'moderate';
    noiseEstimate = 'moderate';
    dynamicRangeEstimate = 'standard';
    sharpnessScore = 72;
  }

  // Recommend Preset
  let recommendedPreset = 'Mobile Video Enhancement';
  let recommendedReason = 'Standard resolution detected; balancing natural sharpness, color vibrance, and clean noise reduction.';

  if (orientation === 'portrait') {
    recommendedPreset = 'Social Media Optimized';
    recommendedReason = '9:16 vertical orientation detected. Optimized for high-bitrate Instagram Reels, TikTok, and YouTube Shorts.';
  } else if (width <= 1280 || compressionArtifacts === 'severe') {
    recommendedPreset = 'Low Quality Footage Recovery';
    recommendedReason = 'High compression artifacts and low source resolution detected. Applying deblocking, bilateral denoising, edge recovery, and upscaling.';
  } else if (width >= 3840 || (width >= 1920 && bpp > 0.2)) {
    recommendedPreset = 'Professional Quality Enhancement';
    recommendedReason = 'High-resolution source footage with high bit-depth. Preserving fine micro-contrast and applying high-fidelity color grading.';
  } else if (fps >= 60) {
    recommendedPreset = 'iPhone Style Enhancement';
    recommendedReason = 'High frame-rate mobile footage detected. Tuning skin-tone vibrance, smooth dynamic range, and natural optical sharpness.';
  } else {
    recommendedPreset = 'Cinematic Enhancement';
    recommendedReason = '24-30 fps footage detected. Applying film tonal curve, controlled highlight roll-off, subtle 35mm grain, and 1/48s shutter motion blur.';
  }

  return {
    width,
    height,
    aspectRatio,
    orientation,
    fps,
    durationSeconds: duration,
    bitrateKbps,
    codec: source.codec || 'H.264 / AVC',
    noiseEstimate,
    compressionArtifacts,
    dynamicRangeEstimate,
    sharpnessScore,
    recommendedPreset,
    recommendedReason,
  };
}

/**
 * Intelligent Resolution Upscaling helper
 * Computes destination width and height based on orientation and upscale options
 */
export interface UpscaleOption {
  id: string;
  label: string;
  width: number;
  height: number;
  aspectRatio: string;
  orientation: 'portrait' | 'landscape';
  factor: 'original' | '2x' | '4x' | '8x' | '1080p' | '2K' | '4K';
  estimatedScaleTimeMultiplier: number;
}

export function computeUpscaleOptions(sourceWidth: number, sourceHeight: number): UpscaleOption[] {
  const isPortrait = sourceHeight > sourceWidth;
  const options: UpscaleOption[] = [];

  // 1. Original
  options.push({
    id: 'original',
    label: `Original (${sourceWidth} × ${sourceHeight})`,
    width: sourceWidth,
    height: sourceHeight,
    aspectRatio: isPortrait ? '9:16' : '16:9',
    orientation: isPortrait ? 'portrait' : 'landscape',
    factor: 'original',
    estimatedScaleTimeMultiplier: 1.0,
  });

  if (isPortrait) {
    // 9:16 Portrait Options
    options.push(
      {
        id: 'portrait-2x',
        label: `2x Upscale (${sourceWidth * 2} × ${sourceHeight * 2})`,
        width: Math.min(3840, sourceWidth * 2),
        height: Math.min(7680, sourceHeight * 2),
        aspectRatio: '9:16',
        orientation: 'portrait',
        factor: '2x',
        estimatedScaleTimeMultiplier: 1.5,
      },
      {
        id: 'portrait-1080p',
        label: '1080p Portrait (1080 × 1920)',
        width: 1080,
        height: 1920,
        aspectRatio: '9:16',
        orientation: 'portrait',
        factor: '1080p',
        estimatedScaleTimeMultiplier: 1.3,
      },
      {
        id: 'portrait-2k',
        label: '2K Portrait (1440 × 2560)',
        width: 1440,
        height: 2560,
        aspectRatio: '9:16',
        orientation: 'portrait',
        factor: '2K',
        estimatedScaleTimeMultiplier: 1.8,
      },
      {
        id: 'portrait-4k',
        label: '4K Portrait (2160 × 3840)',
        width: 2160,
        height: 3840,
        aspectRatio: '9:16',
        orientation: 'portrait',
        factor: '4K',
        estimatedScaleTimeMultiplier: 2.6,
      }
    );
  } else {
    // 16:9 Landscape Options
    options.push(
      {
        id: 'landscape-2x',
        label: `2x Upscale (${sourceWidth * 2} × ${sourceHeight * 2})`,
        width: Math.min(7680, sourceWidth * 2),
        height: Math.min(4320, sourceHeight * 2),
        aspectRatio: '16:9',
        orientation: 'landscape',
        factor: '2x',
        estimatedScaleTimeMultiplier: 1.5,
      },
      {
        id: 'landscape-1080p',
        label: '1080p Landscape (1920 × 1080)',
        width: 1920,
        height: 1080,
        aspectRatio: '16:9',
        orientation: 'landscape',
        factor: '1080p',
        estimatedScaleTimeMultiplier: 1.2,
      },
      {
        id: 'landscape-2k',
        label: '2K Landscape (2560 × 1440)',
        width: 2560,
        height: 1440,
        aspectRatio: '16:9',
        orientation: 'landscape',
        factor: '2K',
        estimatedScaleTimeMultiplier: 1.7,
      },
      {
        id: 'landscape-4k',
        label: '4K Landscape (3840 × 2160)',
        width: 3840,
        height: 2160,
        aspectRatio: '16:9',
        orientation: 'landscape',
        factor: '4K',
        estimatedScaleTimeMultiplier: 2.5,
      }
    );
  }

  return options;
}
