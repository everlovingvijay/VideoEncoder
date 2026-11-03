export interface ValidationResult {
  valid: boolean;
  sizeBytes: number;
  durationSeconds: number;
  width: number;
  height: number;
  hasVideoTrack: boolean;
  issues: string[];
}

export class ExportValidatorService {
  /**
   * Validates an exported video Blob for decodability, duration accuracy, and track presence
   */
  public async validateExport(
    blob: Blob,
    expectedDurationSeconds: number
  ): Promise<ValidationResult> {
    const issues: string[] = [];

    // 1. Basic size validation
    if (!blob || blob.size === 0) {
      issues.push('Exported file is empty (0 bytes).');
      return {
        valid: false,
        sizeBytes: 0,
        durationSeconds: 0,
        width: 0,
        height: 0,
        hasVideoTrack: false,
        issues,
      };
    }

    // 2. Browser decodability and metadata validation
    return new Promise((resolve) => {
      const url = URL.createObjectURL(blob);
      const testVideo = document.createElement('video');
      testVideo.preload = 'metadata';
      testVideo.muted = true;
      testVideo.playsInline = true;

      const timeoutId = setTimeout(() => {
        cleanup();
        issues.push('Video metadata load timed out after 5.0 seconds.');
        resolve({
          valid: false,
          sizeBytes: blob.size,
          durationSeconds: 0,
          width: 0,
          height: 0,
          hasVideoTrack: false,
          issues,
        });
      }, 5000);

      const cleanup = () => {
        clearTimeout(timeoutId);
        testVideo.src = '';
        testVideo.remove();
        URL.revokeObjectURL(url);
      };

      testVideo.onloadedmetadata = () => {
        const duration = testVideo.duration || 0;
        const width = testVideo.videoWidth || 0;
        const height = testVideo.videoHeight || 0;

        if (width === 0 || height === 0) {
          issues.push(`Invalid video dimensions detected: ${width}x${height}`);
        }

        // Compare duration with expected duration (tolerance of 1.0s to account for container slice rounding)
        const durationDelta = Math.abs(duration - expectedDurationSeconds);
        if (durationDelta > 1.0 && duration < expectedDurationSeconds * 0.7) {
          issues.push(`Duration truncated: expected ~${expectedDurationSeconds.toFixed(1)}s, got ${duration.toFixed(1)}s.`);
        }

        cleanup();
        resolve({
          valid: issues.length === 0,
          sizeBytes: blob.size,
          durationSeconds: duration,
          width,
          height,
          hasVideoTrack: width > 0 && height > 0,
          issues,
        });
      };

      testVideo.onerror = () => {
        cleanup();
        issues.push('Browser video decoder failed to parse exported container.');
        resolve({
          valid: false,
          sizeBytes: blob.size,
          durationSeconds: 0,
          width: 0,
          height: 0,
          hasVideoTrack: false,
          issues,
        });
      };

      testVideo.src = url;
    });
  }
}

export const exportValidator = new ExportValidatorService();
