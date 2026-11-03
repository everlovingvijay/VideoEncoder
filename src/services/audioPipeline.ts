export interface AudioPipelineOptions {
  gainDb?: number;
  drc?: number; // Dynamic range compression threshold/ratio
}

export interface AudioPipelineSession {
  audioTracks: MediaStreamTrack[];
  cleanup: () => void;
}

export class AudioPipelineService {
  /**
   * Initializes a Web Audio routing graph for an active video element
   */
  public setupAudioGraph(
    videoElement: HTMLVideoElement,
    options: AudioPipelineOptions = {}
  ): AudioPipelineSession {
    const AudioContextClass = typeof window !== 'undefined'
      ? (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)
      : null;

    if (!AudioContextClass) {
      return { audioTracks: [], cleanup: () => {} };
    }

    let audioCtx: AudioContext | null = null;
    let sourceNode: MediaElementAudioSourceNode | null = null;
    let gainNode: GainNode | null = null;
    let compressorNode: DynamicsCompressorNode | null = null;
    let destNode: MediaStreamAudioDestinationNode | null = null;
    let isCleanedUp = false;

    try {
      audioCtx = new AudioContextClass();
      sourceNode = audioCtx.createMediaElementSource(videoElement);

      // Gain Node: dB to linear amplitude: A = 10^(dB/20)
      gainNode = audioCtx.createGain();
      const gainVal = Math.pow(10, (options.gainDb || 0) / 20);
      gainNode.gain.setValueAtTime(gainVal, audioCtx.currentTime);

      // Dynamics Compressor Node for DRC
      compressorNode = audioCtx.createDynamicsCompressor();
      const drcFactor = Math.max(0, Math.min(3, options.drc || 0));
      compressorNode.threshold.setValueAtTime(-24 - (drcFactor * 10), audioCtx.currentTime);
      compressorNode.knee.setValueAtTime(30, audioCtx.currentTime);
      compressorNode.ratio.setValueAtTime(12 + (drcFactor * 4), audioCtx.currentTime);
      compressorNode.attack.setValueAtTime(0.003, audioCtx.currentTime);
      compressorNode.release.setValueAtTime(0.25, audioCtx.currentTime);

      // Destination
      destNode = audioCtx.createMediaStreamDestination();

      // Connect graph: Source -> Gain -> Compressor -> Destination
      sourceNode.connect(gainNode);
      gainNode.connect(compressorNode);
      compressorNode.connect(destNode);

      const audioTracks = destNode.stream.getAudioTracks();

      const cleanup = () => {
        if (isCleanedUp) return;
        isCleanedUp = true;
        try {
          audioTracks.forEach((t) => t.stop());
          sourceNode?.disconnect();
          gainNode?.disconnect();
          compressorNode?.disconnect();
          if (audioCtx && audioCtx.state !== 'closed') {
            audioCtx.close().catch(() => {});
          }
        } catch (e) {
          // ignore
        }
      };

      return { audioTracks, cleanup };
    } catch (err) {
      console.warn('[AudioPipeline] Audio graph routing fallback (silent or direct audio):', err);
      return {
        audioTracks: [],
        cleanup: () => {
          if (audioCtx && audioCtx.state !== 'closed') {
            audioCtx.close().catch(() => {});
          }
        },
      };
    }
  }
}

export const audioPipeline = new AudioPipelineService();
