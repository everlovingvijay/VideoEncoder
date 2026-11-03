import { VideoCodec, ContainerFormat } from '../types/handbrake';

export interface CodecMimeMatch {
  mimeType: string;
  codec: string;
  container: ContainerFormat;
  isHardwareAccelerated: boolean;
}

export interface BrowserCapabilities {
  hasWebCodecs: boolean;
  hasMediaRecorder: boolean;
  hasWebAudio: boolean;
  hasCanvasCaptureStream: boolean;
  supportedMimeTypes: string[];
  supportedContainers: ContainerFormat[];
  bestMp4MimeType: string | null;
  bestWebmMimeType: string | null;
  hardwareAccelerationDetected: boolean;
}

export class CapabilityDetectorService {
  private cachedCapabilities: BrowserCapabilities | null = null;

  /**
   * Probes the runtime environment for video/audio codecs and container support
   */
  public detectCapabilities(): BrowserCapabilities {
    if (this.cachedCapabilities) {
      return this.cachedCapabilities;
    }

    const hasMediaRecorder = typeof window !== 'undefined' && typeof window.MediaRecorder !== 'undefined';
    const hasWebCodecs = typeof window !== 'undefined' && 'VideoEncoder' in window && 'VideoDecoder' in window;
    const hasWebAudio = typeof window !== 'undefined' && ('AudioContext' in window || 'webkitAudioContext' in window);
    const hasCanvasCaptureStream = typeof document !== 'undefined' &&
      typeof document.createElement('canvas').captureStream === 'function';

    const testMimeTypes = [
      'video/mp4;codecs=avc1.640028',     // H.264 High 4.0
      'video/mp4;codecs=avc1.4d401f',     // H.264 Main 3.1
      'video/mp4;codecs=avc1.42e01e',     // H.264 Baseline
      'video/mp4;codecs=hev1.1.6.L93.B0', // H.265 / HEVC Main 10
      'video/mp4;codecs=hvc1.1.6.L93.B0', // H.265 / HEVC Alternative
      'video/mp4',
      'video/webm;codecs=vp9,opus',       // VP9 + Opus
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8,opus',       // VP8 + Opus
      'video/webm;codecs=vp8',
      'video/webm;codecs=av01',           // AV1
      'video/webm;codecs=h264',
      'video/webm',
    ];

    const supportedMimeTypes: string[] = [];
    if (hasMediaRecorder) {
      for (const mime of testMimeTypes) {
        try {
          if (MediaRecorder.isTypeSupported(mime)) {
            supportedMimeTypes.push(mime);
          }
        } catch (e) {
          // ignore parsing error
        }
      }
    }

    const supportedContainers: ContainerFormat[] = [];
    if (supportedMimeTypes.some((m) => m.startsWith('video/mp4'))) {
      supportedContainers.push('mp4', 'mov');
    }
    if (supportedMimeTypes.some((m) => m.startsWith('video/webm'))) {
      supportedContainers.push('webm', 'mkv');
    }
    if (supportedContainers.length === 0) {
      supportedContainers.push('webm');
    }

    // Find best MIME types
    const bestMp4 = supportedMimeTypes.find((m) => m.includes('avc1') || m.includes('hvc1') || m.includes('hev1')) ||
      (supportedMimeTypes.includes('video/mp4') ? 'video/mp4' : null);

    const bestWebm = supportedMimeTypes.find((m) => m.includes('vp9')) ||
      supportedMimeTypes.find((m) => m.includes('vp8')) ||
      (supportedMimeTypes.includes('video/webm') ? 'video/webm' : null);

    // Hardware acceleration heuristic: Apple Silicon / Chrome HW AVC1 support
    const isApplePlatform = typeof navigator !== 'undefined' &&
      /Mac|iPhone|iPad|iPod/.test(navigator.userAgent || '');
    const hardwareAccelerationDetected = hasWebCodecs || (isApplePlatform && Boolean(bestMp4));

    this.cachedCapabilities = {
      hasWebCodecs,
      hasMediaRecorder,
      hasWebAudio,
      hasCanvasCaptureStream,
      supportedMimeTypes,
      supportedContainers,
      bestMp4MimeType: bestMp4,
      bestWebmMimeType: bestWebm,
      hardwareAccelerationDetected,
    };

    return this.cachedCapabilities;
  }

  /**
   * Resolves the optimal MIME type for a requested codec and container format
   */
  public resolveOptimalMimeType(
    codec: VideoCodec,
    container: ContainerFormat
  ): { mimeType: string; isFallback: boolean; fallbackReason?: string } {
    const caps = this.detectCapabilities();

    // 1. Requested MP4 / MOV container
    if (container === 'mp4' || container === 'mov') {
      if (caps.bestMp4MimeType) {
        return { mimeType: caps.bestMp4MimeType, isFallback: false };
      }
      // MP4 not supported natively by MediaRecorder (e.g. Firefox), fallback to WebM
      if (caps.bestWebmMimeType) {
        return {
          mimeType: caps.bestWebmMimeType,
          isFallback: true,
          fallbackReason: 'Browser lacks native MP4 MediaRecorder muxing; adapting to high-quality WebM container.',
        };
      }
    }

    // 2. Requested WebM / MKV container
    if (container === 'webm' || container === 'mkv') {
      if (caps.bestWebmMimeType) {
        return { mimeType: caps.bestWebmMimeType, isFallback: false };
      }
      if (caps.bestMp4MimeType) {
        return {
          mimeType: caps.bestMp4MimeType,
          isFallback: true,
          fallbackReason: 'Browser lacks native WebM encoder; falling back to MP4 AVC.',
        };
      }
    }

    // 3. Fallback to any supported MIME type
    if (caps.supportedMimeTypes.length > 0) {
      return {
        mimeType: caps.supportedMimeTypes[0],
        isFallback: true,
        fallbackReason: 'Using standard browser default recording MIME type.',
      };
    }

    // Default universal fallback
    return { mimeType: 'video/webm', isFallback: true, fallbackReason: 'Universal webm fallback' };
  }

  /**
   * Validates if the selected container and codec configuration can be exported
   */
  public validateConfiguration(
    codec: VideoCodec,
    container: ContainerFormat
  ): { valid: boolean; recommendedContainer: ContainerFormat; warning?: string } {
    const caps = this.detectCapabilities();

    if (container === 'mp4' && !caps.bestMp4MimeType) {
      return {
        valid: false,
        recommendedContainer: 'webm',
        warning: 'Native MP4 recording is not supported in this browser. Output will be muxed as WebM.',
      };
    }

    if (container === 'webm' && !caps.bestWebmMimeType && caps.bestMp4MimeType) {
      return {
        valid: false,
        recommendedContainer: 'mp4',
        warning: 'Native WebM recording is limited; output will be muxed as MP4.',
      };
    }

    return { valid: true, recommendedContainer: container };
  }
}

export const capabilityDetector = new CapabilityDetectorService();
