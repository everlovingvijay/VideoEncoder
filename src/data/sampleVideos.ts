import { VideoSource } from '../types/handbrake';

// Generates a realistic test video directly via Canvas and MediaRecorder
export function generateSyntheticVideoBlob(
  title: string,
  width = 1280,
  height = 720,
  durationSec = 6,
  fps = 30
): Promise<{ blob: Blob; url: string; thumbnailUrl: string }> {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Canvas 2D context not available');
      }

      // Audio setup for synthetic tone
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const dest = audioCtx.createMediaStreamDestination();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, audioCtx.currentTime); // 440 Hz concert A
      const gainNode = audioCtx.createGain();
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
      osc.connect(gainNode);
      gainNode.connect(dest);
      osc.start();

      const canvasStream = canvas.captureStream(fps);
      // Combine video and audio
      const combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...dest.stream.getAudioTracks(),
      ]);

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : MediaRecorder.isTypeSupported('video/webm')
        ? 'video/webm'
        : 'video/mp4';

      const recorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: 3000000,
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      let currentFrame = 0;
      const totalFrames = durationSec * fps;
      let firstThumbnail = '';

      const interval = setInterval(() => {
        const t = currentFrame / fps;
        
        // Background gradient animation
        const grad = ctx.createLinearGradient(0, 0, width, height);
        const hue1 = (t * 40) % 360;
        const hue2 = (t * 40 + 120) % 360;
        grad.addColorStop(0, `hsl(${hue1}, 65%, 15%)`);
        grad.addColorStop(1, `hsl(${hue2}, 75%, 8%)`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Grid lines (an authentic calibration card style)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        const gridSize = 64;
        for (let x = 0; x < width; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = 0; y < height; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }

        // Circular rotating radar / motion test
        const cx = width / 2;
        const cy = height / 2;
        const radius = Math.min(width, height) * 0.28;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(t * 1.5);
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(radius, 0, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Authentic Film Timecode & HandBrake Watermark
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(title, cx, cy - 80);

        const mins = Math.floor(t / 60).toString().padStart(2, '0');
        const secs = Math.floor(t % 60).toString().padStart(2, '0');
        const frames = (currentFrame % fps).toString().padStart(2, '0');
        const timecodeStr = `00:${mins}:${secs}:${frames}`;

        ctx.fillStyle = '#f59e0b';
        ctx.font = '28px "JetBrains Mono", monospace';
        ctx.fillText(timecodeStr, cx, cy - 20);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '16px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(`${width}x${height} · ${fps} FPS · BT.709 · Stereo 48kHz`, cx, cy + 30);

        // Progress bar at bottom
        const progress = currentFrame / totalFrames;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fillRect(40, height - 32, width - 80, 8);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(40, height - 32, (width - 80) * progress, 8);

        if (currentFrame === 10 && !firstThumbnail) {
          firstThumbnail = canvas.toDataURL('image/jpeg', 0.8);
        }

        currentFrame++;
        if (currentFrame >= totalFrames) {
          clearInterval(interval);
          recorder.stop();
          osc.stop();
          audioCtx.close();
        }
      }, 1000 / fps);

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        resolve({
          blob,
          url,
          thumbnailUrl: firstThumbnail || canvas.toDataURL('image/jpeg', 0.8),
        });
      };

      recorder.start();
    } catch (err) {
      reject(err);
    }
  });
}

export const PRESET_SAMPLE_METADATA: Omit<VideoSource, 'url' | 'thumbnailUrl'>[] = [
  {
    id: 'sample-cinema-4k',
    name: 'Apollo_Lunar_Surface_ProRes422_4K.mov',
    sizeBytes: 142500000,
    durationSeconds: 12.5,
    width: 3840,
    height: 2160,
    fps: 60,
    bitrateKbps: 91200,
    codec: 'ProRes 422 HQ / PCM',
    chapters: [
      { id: 'ch-1', number: 1, title: 'Lunar Orbital Insertion', timestampSeconds: 0 },
      { id: 'ch-2', number: 2, title: 'Descent Stage Ignition', timestampSeconds: 4.2 },
      { id: 'ch-3', number: 3, title: 'Surface Touchdown', timestampSeconds: 8.5 },
    ],
  },
  {
    id: 'sample-action-1080p',
    name: 'Redwood_Downhill_Speedrun_1080p60.mp4',
    sizeBytes: 48900000,
    durationSeconds: 15.0,
    width: 1920,
    height: 1080,
    fps: 60,
    bitrateKbps: 26080,
    codec: 'H.264 High / AAC',
    chapters: [
      { id: 'ch-1', number: 1, title: 'Trailhead Drop-in', timestampSeconds: 0 },
      { id: 'ch-2', number: 2, title: 'Rock Garden Section', timestampSeconds: 5.5 },
      { id: 'ch-3', number: 3, title: 'Berm Sprint Finish', timestampSeconds: 10.8 },
    ],
  },
  {
    id: 'sample-anime-720p',
    name: 'Cyberpunk_NeoTokyo_Rain_24fps.mkv',
    sizeBytes: 18400000,
    durationSeconds: 10.0,
    width: 1280,
    height: 720,
    fps: 24,
    bitrateKbps: 14720,
    codec: 'HEVC 10-bit / Opus',
    chapters: [
      { id: 'ch-1', number: 1, title: 'District 4 Neon Alley', timestampSeconds: 0 },
      { id: 'ch-2', number: 2, title: 'Highline Train Flyby', timestampSeconds: 5.0 },
    ],
  },
];
