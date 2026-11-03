export interface FrameSchedulerCallback {
  (frameIndex: number, currentTimeSeconds: number): Promise<void> | void;
}

export interface FrameSchedulerOptions {
  targetFps: number;
  totalDurationSeconds: number;
}

export class FrameScheduler {
  private isRunning = false;
  private isPaused = false;
  private isAborted = false;
  private frameIndex = 0;
  private animFrameId: number | null = null;
  private isProcessingFrame = false;

  public async start(
    videoElement: HTMLVideoElement,
    options: FrameSchedulerOptions,
    onFrame: FrameSchedulerCallback,
    onComplete: () => void
  ): Promise<void> {
    this.isRunning = true;
    this.isPaused = false;
    this.isAborted = false;
    this.frameIndex = 0;
    this.isProcessingFrame = false;

    const totalDuration = options.totalDurationSeconds || 10;

    const tick = async () => {
      if (this.isAborted || !this.isRunning) return;

      if (this.isPaused) {
        this.animFrameId = requestAnimationFrame(tick);
        return;
      }

      // Check if finished
      if (videoElement.ended || videoElement.currentTime >= totalDuration - 0.05) {
        this.isRunning = false;
        onComplete();
        return;
      }

      // Bounded backpressure: skip tick if previous frame is still rendering/processing
      if (!this.isProcessingFrame) {
        this.isProcessingFrame = true;
        try {
          await onFrame(this.frameIndex, videoElement.currentTime);
          this.frameIndex++;
        } catch (err) {
          console.error('[FrameScheduler] Frame processing error:', err);
        } finally {
          this.isProcessingFrame = false;
        }
      }

      this.animFrameId = requestAnimationFrame(tick);
    };

    this.animFrameId = requestAnimationFrame(tick);
  }

  public pause(): void {
    this.isPaused = true;
  }

  public resume(): void {
    this.isPaused = false;
  }

  public abort(): void {
    this.isAborted = true;
    this.isRunning = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  public get currentFrame(): number {
    return this.frameIndex;
  }
}
