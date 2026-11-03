import { HandbrakePreset, LogEntry, QueueItem, VideoSource } from '../types/handbrake';
import {
  applyPixelEnhancements,
  buildCanvasCssFilter,
  DEFAULT_ENHANCEMENT,
  DEFAULT_DEVICE_PROFILE,
  DEFAULT_MOTION_BLUR,
  DEFAULT_UPSCALE,
} from './enhancementEngine';
import { capabilityDetector } from './capabilityDetector';
import { audioPipeline } from './audioPipeline';
import { exportValidator, ValidationResult } from './exportValidator';

export interface TranscodeProgressCallback {
  (progress: {
    percent: number;
    currentFrame: number;
    totalFrames: number;
    fps: number;
    etaSeconds: number;
    elapsedSeconds: number;
    logEntry?: LogEntry;
  }): void;
}

export class VideoTranscoderService {
  private activeControllers: Map<
    string,
    { abort: () => void; pause: () => void; resume: () => void }
  > = new Map();

  /**
   * Reads video metadata from an uploaded file or URL
   */
  public async inspectVideo(sourceUrl: string, file?: File): Promise<Partial<VideoSource>> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;

      const cleanup = () => {
        video.src = '';
        video.remove();
      };

      video.onloadedmetadata = () => {
        const duration = video.duration || 10;
        // Capture a clean thumbnail at 0.5s or midpoint
        video.currentTime = Math.min(0.5, duration / 2);
      };

      video.onseeked = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = Math.min(640, video.videoWidth || 640);
          canvas.height = Math.min(360, video.videoHeight || 360);
          const ctx = canvas.getContext('2d');
          let thumb = '';
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            thumb = canvas.toDataURL('image/jpeg', 0.8);
          }
          const duration = video.duration || 10;
          cleanup();
          resolve({
            durationSeconds: duration,
            width: video.videoWidth || 1920,
            height: video.videoHeight || 1080,
            fps: 30,
            bitrateKbps: file ? Math.round((file.size * 8) / duration / 1000) : 6000,
            codec: 'H.264 High / AAC',
            thumbnailUrl: thumb,
          });
        } catch (e) {
          cleanup();
          resolve({
            durationSeconds: video.duration || 10,
            width: video.videoWidth || 1920,
            height: video.videoHeight || 1080,
            fps: 30,
            bitrateKbps: 5000,
            codec: 'H.264 High / AAC',
            thumbnailUrl: '',
          });
        }
      };

      video.onerror = () => {
        cleanup();
        reject(new Error('Failed to load video metadata. Format may not be supported by browser.'));
      };

      video.src = sourceUrl;
    });
  }

  /**
   * Performs an actual client-side transcode pass with Release 2.0 architecture:
   * - Capability detection & MIME resolution
   * - Decoupled WebAudio routing with gain & DRC
   * - Bounded frame scheduling with backpressure
   * - Pixel-level enhancement pipeline
   * - Automated post-export validation
   */
  public async transcode(
    job: QueueItem,
    onProgress: TranscodeProgressCallback
  ): Promise<{ blob: Blob; url: string; sizeBytes: number; validation?: ValidationResult }> {
    return new Promise((resolve, reject) => {
      let isPaused = false;
      let isAborted = false;
      let isProcessingFrame = false;

      const video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      video.crossOrigin = 'anonymous';

      const preset = job.preset;
      const isPortrait = preset.dimensions.height > preset.dimensions.width;
      const targetWidth = isPortrait
        ? Math.min(preset.dimensions.width, 1080)
        : Math.min(preset.dimensions.width, 1920);
      const targetHeight = isPortrait
        ? Math.min(preset.dimensions.height, 1920)
        : Math.min(preset.dimensions.height, 1080);

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      if (!ctx) {
        reject(new Error('Canvas 2D context creation failed'));
        return;
      }

      const targetFps = typeof preset.video.framerate === 'number' ? preset.video.framerate : 30;
      const targetBitrate =
        preset.video.qualityMode === 'bitrate'
          ? preset.video.bitrateKbps * 1000
          : Math.max(800000, Math.round(8000000 * Math.pow(0.9, preset.video.rfValue - 18)));

      // 1. Capability Detection & MIME Resolution
      const mimeResolution = capabilityDetector.resolveOptimalMimeType(
        preset.video.codec,
        preset.container
      );
      const mimeType = mimeResolution.mimeType;

      // 2. Audio Pipeline Setup
      let audioSession: { audioTracks: MediaStreamTrack[]; cleanup: () => void } | null = null;
      try {
        audioSession = audioPipeline.setupAudioGraph(video, {
          gainDb: preset.audio[0]?.gainDb,
          drc: preset.audio[0]?.drc,
        });
      } catch (err) {
        console.warn('Audio setup deferred:', err);
      }

      const canvasStream = canvas.captureStream(targetFps);
      const outputStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...(audioSession?.audioTracks || []),
      ]);

      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(outputStream, {
          mimeType,
          videoBitsPerSecond: targetBitrate,
        });
      } catch (recErr) {
        // Fallback to default MediaRecorder without explicit mimeType
        recorder = new MediaRecorder(outputStream);
      }

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      const startTime = performance.now();
      let framesEncoded = 0;
      let totalDuration = job.source.durationSeconds || 10;
      let totalFrames = Math.max(1, Math.round(totalDuration * targetFps));

      // Register abort / pause handlers
      this.activeControllers.set(job.id, {
        abort: () => {
          isAborted = true;
          try {
            if (recorder.state !== 'inactive') recorder.stop();
            video.pause();
            video.src = '';
            audioSession?.cleanup();
          } catch (e) {
            console.error(e);
          }
          reject(new Error('Encoding aborted by user'));
        },
        pause: () => {
          isPaused = true;
          video.pause();
          if (recorder.state === 'recording') recorder.pause();
        },
        resume: () => {
          isPaused = false;
          video.play();
          if (recorder.state === 'paused') recorder.resume();
        },
      });

      // Emission log helper
      const emitLog = (msg: string, level: LogEntry['level'] = 'info') => {
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
        onProgress({
          percent: Math.min(100, Math.round((framesEncoded / totalFrames) * 100)),
          currentFrame: framesEncoded,
          totalFrames,
          fps: 0,
          etaSeconds: 0,
          elapsedSeconds: Math.round((performance.now() - startTime) / 1000),
          logEntry: {
            id: `log-${Date.now()}-${Math.random()}`,
            timestamp: timeStr,
            level,
            message: msg,
          },
        });
      };

      emitLog(`[core 2.0] Engine initialized with reliable modular pipeline`, 'notice');
      emitLog(`[core 2.0] Source: ${job.source.name} (${job.source.width}x${job.source.height}, ${job.source.fps} fps)`);
      emitLog(`[core 2.0] Active Preset: "${preset.name}" (${preset.video.codec})`);
      emitLog(`[encoder] Resolved container/MIME: ${mimeType} (target bitrate: ${Math.round(targetBitrate / 1000)} kbps)`);
      if (mimeResolution.isFallback && mimeResolution.fallbackReason) {
        emitLog(`[encoder] ${mimeResolution.fallbackReason}`, 'warning');
      }

      // Filter construction
      const filters = preset.filters;
      let filterCss = '';
      if (filters.grayscale) filterCss += 'grayscale(100%) ';
      if (filters.brightness !== 0) filterCss += `brightness(${100 + filters.brightness}%) `;
      if (filters.contrast !== 0) filterCss += `contrast(${100 + filters.contrast}%) `;
      if (filters.saturation !== 0) filterCss += `saturate(${100 + filters.saturation}%) `;

      const enhancementCss = buildCanvasCssFilter(preset.enhancement, preset.deviceProfile);
      if (enhancementCss && enhancementCss !== 'none') {
        filterCss += (filterCss ? ' ' : '') + enhancementCss;
      }

      if (preset.enhancement) {
        emitLog(
          `[enhancement] Active: Sharpness=${preset.enhancement.sharpness}, Denoise=${preset.enhancement.noiseReduction}, Temp=${preset.enhancement.colorTemperature}K, Grain=${preset.enhancement.filmGrain}`
        );
      }
      if (preset.deviceProfile && preset.deviceProfile.profile !== 'none') {
        emitLog(
          `[simulation] Quality Profile: "${preset.deviceProfile.profile}" (${preset.deviceProfile.intensity}%)`
        );
      }
      if (preset.motionBlur && preset.motionBlur.enabled) {
        emitLog(
          `[motion-blur] Direction: ${preset.motionBlur.direction}, Shutter: ${preset.motionBlur.shutterSpeed}`
        );
      }

      video.onloadeddata = () => {
        totalDuration = video.duration || totalDuration;
        totalFrames = Math.max(1, Math.round(totalDuration * targetFps));
        recorder.start(1000); // 1s slice
        video.currentTime = 0;
        video.play().catch((err) => console.warn('Autoplay caught:', err));
        drawFrame();
      };

      const drawFrame = () => {
        if (isAborted) return;
        if (isPaused) {
          requestAnimationFrame(drawFrame);
          return;
        }

        if (video.ended || video.currentTime >= totalDuration - 0.05) {
          emitLog(`[core 2.0] Transcode frame processing complete: ${framesEncoded} frames rendered.`, 'notice');
          recorder.stop();
          return;
        }

        // Bounded frame processing check to avoid overlapping heavy pixel loops
        if (isProcessingFrame) {
          requestAnimationFrame(drawFrame);
          return;
        }

        isProcessingFrame = true;

        try {
          ctx.save();
          ctx.clearRect(0, 0, targetWidth, targetHeight);

          // Rotation & Flip
          if (filters.rotation !== 0 || filters.flipHorizontal) {
            ctx.translate(targetWidth / 2, targetHeight / 2);
            if (filters.rotation !== 0) {
              ctx.rotate((filters.rotation * Math.PI) / 180);
            }
            if (filters.flipHorizontal) {
              ctx.scale(-1, 1);
            }
            ctx.translate(-targetWidth / 2, -targetHeight / 2);
          }

          if (filterCss) {
            ctx.filter = filterCss.trim();
          }

          // Sizing & Crop
          const cropT = preset.dimensions.cropTop || 0;
          const cropB = preset.dimensions.cropBottom || 0;
          const cropL = preset.dimensions.cropLeft || 0;
          const cropR = preset.dimensions.cropRight || 0;

          const srcW = Math.max(10, video.videoWidth - cropL - cropR);
          const srcH = Math.max(10, video.videoHeight - cropT - cropB);

          ctx.drawImage(video, cropL, cropT, srcW, srcH, 0, 0, targetWidth, targetHeight);
          ctx.restore();

          // Apply pixel-level enhancement passes
          applyPixelEnhancements(
            ctx,
            targetWidth,
            targetHeight,
            preset.enhancement,
            preset.deviceProfile,
            preset.motionBlur
          );

          framesEncoded++;
          const elapsed = (performance.now() - startTime) / 1000;
          const currentFps = framesEncoded / Math.max(0.1, elapsed);
          const percent = Math.min(99, Math.round((video.currentTime / totalDuration) * 100));
          const remainingFrames = Math.max(0, totalFrames - framesEncoded);
          const eta = Math.round(remainingFrames / Math.max(1, currentFps));

          if (framesEncoded % Math.round(targetFps / 2) === 0) {
            onProgress({
              percent,
              currentFrame: framesEncoded,
              totalFrames,
              fps: Math.round(currentFps * 10) / 10,
              etaSeconds: eta,
              elapsedSeconds: Math.round(elapsed),
            });
          }

          if (framesEncoded % (targetFps * 2) === 0) {
            emitLog(`[encoder] Frame ${framesEncoded}/${totalFrames} (${percent}%) - ${Math.round(currentFps)} fps - ETA: ${eta}s`);
          }
        } finally {
          isProcessingFrame = false;
        }

        requestAnimationFrame(drawFrame);
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: mimeType });
        const outputUrl = URL.createObjectURL(blob);
        this.activeControllers.delete(job.id);
        cleanup();

        // 3. Post-Export Validation Pass
        emitLog(`[validator] Validating exported container integrity & track presence...`);
        let validationResult: ValidationResult | undefined;
        try {
          validationResult = await exportValidator.validateExport(blob, totalDuration);
          if (validationResult.valid) {
            emitLog(
              `[validator] Verified: playable duration ${validationResult.durationSeconds.toFixed(1)}s, ${validationResult.width}x${validationResult.height}, decodable: true`,
              'notice'
            );
          } else {
            emitLog(`[validator] Validation warning: ${validationResult.issues.join('; ')}`, 'warning');
          }
        } catch (valErr) {
          console.warn('Export validation check non-blocking error:', valErr);
        }

        onProgress({
          percent: 100,
          currentFrame: framesEncoded,
          totalFrames,
          fps: Math.round((framesEncoded / Math.max(0.1, (performance.now() - startTime) / 1000)) * 10) / 10,
          etaSeconds: 0,
          elapsedSeconds: Math.round((performance.now() - startTime) / 1000),
          logEntry: {
            id: `log-done-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString(),
            level: 'notice',
            message: `[core 2.0] Work done! Encoded size: ${(blob.size / 1024 / 1024).toFixed(2)} MB (${Math.round((blob.size * 8) / totalDuration / 1000)} kbps)`,
          },
        });

        resolve({
          blob,
          url: outputUrl,
          sizeBytes: blob.size,
          validation: validationResult,
        });
      };

      const cleanup = () => {
        try {
          video.pause();
          video.src = '';
          audioSession?.cleanup();
        } catch (e) {
          // ignore
        }
      };

      video.onerror = () => {
        this.activeControllers.delete(job.id);
        cleanup();
        reject(new Error('Video playback error during transcoding stream.'));
      };

      video.src = job.source.url;
    });
  }

  public pause(jobId: string) {
    this.activeControllers.get(jobId)?.pause();
  }

  public resume(jobId: string) {
    this.activeControllers.get(jobId)?.resume();
  }

  public abort(jobId: string) {
    this.activeControllers.get(jobId)?.abort();
  }
}

export const transcoderService = new VideoTranscoderService();
