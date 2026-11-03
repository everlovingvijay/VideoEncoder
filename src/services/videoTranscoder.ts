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
        video.onerror = null;
        video.onloadedmetadata = null;
        video.onseeked = null;
        video.pause();
        video.removeAttribute('src');
        video.load();
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

      // Handle fresh blob recreation if File object exists
      let freshBlobUrl: string | null = null;
      let srcUrl = job.source.url;
      if (job.source.file) {
        try {
          freshBlobUrl = URL.createObjectURL(job.source.file);
          srcUrl = freshBlobUrl;
        } catch (e) {
          srcUrl = job.source.url;
        }
      }

      const video = document.createElement('video');
      video.muted = true;
      video.defaultMuted = true;
      video.setAttribute('muted', '');
      video.setAttribute('playsinline', '');
      video.playsInline = true;
      video.preload = 'auto';

      // Attach offscreen to document.body so Chromium/WebKit does not throttle or freeze video clock
      if (typeof document !== 'undefined' && document.body) {
        video.style.position = 'fixed';
        video.style.top = '-9999px';
        video.style.left = '-9999px';
        video.style.width = '1px';
        video.style.height = '1px';
        video.style.opacity = '0';
        video.style.pointerEvents = 'none';
        video.tabIndex = -1;
        document.body.appendChild(video);
      }

      // DO NOT set crossOrigin for blob: or data: URLs to avoid browser CORS errors
      if (srcUrl.startsWith('http://') || srcUrl.startsWith('https://')) {
        try {
          const urlObj = new URL(srcUrl, typeof window !== 'undefined' ? window.location.href : undefined);
          if (typeof window !== 'undefined' && urlObj.origin !== window.location.origin) {
            video.crossOrigin = 'anonymous';
          }
        } catch (e) {
          // ignore
        }
      }

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
        if (freshBlobUrl) URL.revokeObjectURL(freshBlobUrl);
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

      const canvasStream = canvas.captureStream(targetFps);

      let recorder: MediaRecorder | null = null;
      let audioSession: { audioTracks: MediaStreamTrack[]; cleanup: () => void } | null = null;
      const chunks: Blob[] = [];

      const startTime = performance.now();
      let framesEncoded = 0;
      let totalDuration = job.source.durationSeconds || 10;
      let totalFrames = Math.max(1, Math.round(totalDuration * targetFps));

      // Register abort / pause handlers
      this.activeControllers.set(job.id, {
        abort: () => {
          isAborted = true;
          try {
            if (recorder && recorder.state !== 'inactive') recorder.stop();
            video.onerror = null;
            video.onloadeddata = null;
            video.oncanplay = null;
            video.onloadedmetadata = null;
            video.pause();
            video.removeAttribute('src');
            video.load();
            if (video.parentNode) {
              video.parentNode.removeChild(video);
            }
            audioSession?.cleanup();
            if (freshBlobUrl) URL.revokeObjectURL(freshBlobUrl);
          } catch (e) {
            console.error(e);
          }
          reject(new Error('Encoding aborted by user'));
        },
        pause: () => {
          isPaused = true;
          video.pause();
          if (recorder && recorder.state === 'recording') recorder.pause();
        },
        resume: () => {
          isPaused = false;
          video.play().catch(() => {});
          if (recorder && recorder.state === 'paused') recorder.resume();
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

      let hasStarted = false;
      const startEncoding = () => {
        if (hasStarted || isAborted) return;
        hasStarted = true;
        totalDuration = video.duration || totalDuration;
        totalFrames = Math.max(1, Math.round(totalDuration * targetFps));

        // Draw initial frame to canvas so captureStream has valid buffer dimensions
        try {
          ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
        } catch (drawErr) {
          console.warn('Initial frame draw note:', drawErr);
        }

        // Setup Audio Pipeline after video has loaded metadata
        try {
          audioSession = audioPipeline.setupAudioGraph(video, {
            gainDb: preset.audio[0]?.gainDb,
            drc: preset.audio[0]?.drc,
          });
        } catch (err) {
          console.warn('Audio setup deferred or skipped:', err);
        }

        const outputStream = new MediaStream([
          ...canvasStream.getVideoTracks(),
          ...(audioSession?.audioTracks || []),
        ]);

        try {
          recorder = new MediaRecorder(outputStream, {
            mimeType,
            videoBitsPerSecond: targetBitrate,
          });
        } catch (recErr) {
          recorder = new MediaRecorder(outputStream);
        }

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = handleRecorderStop;

        try {
          if (recorder.state === 'inactive') {
            recorder.start(1000); // 1s slice
          }
        } catch (err) {
          console.warn('Recorder start notice:', err);
        }

        video.currentTime = 0;
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn('Video play notice:', err);
          });
        }
        drawFrame();
      };

      const handleRecorderStop = async () => {
        const blob = new Blob(chunks, { type: mimeType });
        const outputUrl = URL.createObjectURL(blob);
        this.activeControllers.delete(job.id);
        cleanup();

        // Post-Export Validation Pass
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

      video.onloadedmetadata = () => {
        totalDuration = video.duration || totalDuration;
      };

      video.onloadeddata = startEncoding;
      video.oncanplay = startEncoding;
      if (video.readyState >= 2) {
        startEncoding();
      }

      let lastTime = -1;
      let stalledCount = 0;

      const drawFrame = () => {
        if (isAborted) return;
        if (isPaused) {
          requestAnimationFrame(drawFrame);
          return;
        }

        // Hard completion checks: video finished OR duration exceeded OR all expected frames processed
        if (
          video.ended ||
          (video.currentTime > 0 && video.currentTime >= totalDuration - 0.05) ||
          framesEncoded >= totalFrames
        ) {
          emitLog(`[core 2.0] Transcode frame processing complete: ${framesEncoded} frames rendered.`, 'notice');
          if (recorder && recorder.state !== 'inactive') {
            recorder.stop();
          }
          return;
        }

        // Playback stall watchdog: if currentTime is not advancing, nudge it forward
        if (lastTime === video.currentTime) {
          stalledCount++;
          if (stalledCount > 10) {
            const step = 1 / targetFps;
            video.currentTime = Math.min(totalDuration, video.currentTime + step);
            stalledCount = 0;
          }
        } else {
          lastTime = video.currentTime;
          stalledCount = 0;
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

      const cleanup = () => {
        try {
          // Remove event listeners FIRST so resetting src never triggers false errors
          video.onerror = null;
          video.onloadeddata = null;
          video.oncanplay = null;
          video.onloadedmetadata = null;
          video.pause();
          video.removeAttribute('src');
          video.load();

          if (video.parentNode) {
            video.parentNode.removeChild(video);
          }

          audioSession?.cleanup();
          if (freshBlobUrl) {
            URL.revokeObjectURL(freshBlobUrl);
          }
        } catch (e) {
          // ignore
        }
      };

      video.onerror = () => {
        // Ignore if already aborted or encoding has completed
        if (isAborted || (hasStarted && framesEncoded >= totalFrames)) return;
        const err = video.error;
        let codeStr = 'Unknown';
        if (err) {
          switch (err.code) {
            case 1: codeStr = 'MEDIA_ERR_ABORTED'; break;
            case 2: codeStr = 'MEDIA_ERR_NETWORK'; break;
            case 3: codeStr = 'MEDIA_ERR_DECODE'; break;
            case 4: codeStr = 'MEDIA_ERR_SRC_NOT_SUPPORTED'; break;
            default: codeStr = `CODE_${err.code}`;
          }
        }
        const errorMsg = `Video playback error (${codeStr}): ${err?.message || 'Format or codec not supported by browser'}`;
        emitLog(`[error] ${errorMsg}`, 'error');
        this.activeControllers.delete(job.id);
        cleanup();
        reject(new Error(errorMsg));
      };

      video.src = srcUrl;
      try {
        video.load();
      } catch (loadErr) {
        console.warn('video.load() notice:', loadErr);
      }
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
