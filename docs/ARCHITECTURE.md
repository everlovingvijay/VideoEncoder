# Architecture Specification — VideoEncoder Pro
**Release Target:** 2.0 (Reliable Core) & Beyond  
**Project:** `everlovingvijay/VideoEncoder`  
**Status:** Approved Architecture Blueprint  

---

## 1. Architectural Philosophy

VideoEncoder Pro is architected around four non-negotiable principles:
1. **Privacy & Locality**: Zero remote compute; all bytes stay strictly inside the client browser.
2. **Modular Decoupling**: Separate analysis, capability probing, rendering, audio routing, encoding, and job management into distinct, testable services.
3. **Hardware Acceleration with Graceful Degradation**: Probe and leverage WebCodecs (`VideoEncoder`) and hardware-accelerated `MediaRecorder` where present, falling back cleanly to standard browser codecs without crashing.
4. **Export Integrity**: Never report a transcode as successful until an automated validation pass confirms container decodability, duration match, and track presence.

---

## 2. System Architecture Diagram

```mermaid
graph TD
    UI[React 19 User Interface\nTranscodeTab | VideoStudioTab | QueueTab] --> JM[Job Manager\nsrc/services/jobManager.ts]
    
    subgraph Core Engine Services
        CD[Capability Detector\nsrc/services/capabilityDetector.ts]
        FA[Footage Analyzer\nsrc/services/footageAnalyzer.ts]
        FS[Frame Scheduler\nsrc/services/frameScheduler.ts]
        FR[Frame Renderer\nsrc/services/frameRenderer.ts]
        AP[Audio Pipeline\nsrc/services/audioPipeline.ts]
        EE[Encoder Engine\nsrc/services/encoderEngine.ts]
        EV[Export Validator\nsrc/services/exportValidator.ts]
    end

    JM -->|1. Probe browser support| CD
    JM -->|2. Inspect source video| FA
    JM -->|3. Initialize frame loop| FS
    FS -->|4. Request rendered frame| FR
    FS -->|5. Sync audio clock| AP
    FR -->|6. Canvas VideoTrack| EE
    AP -->|7. WebAudio AudioTrack| EE
    EE -->|8. Encoded Blob| EV
    EV -->|9. Verified Output| JM
    JM -->|10. Download / Queue update| UI
```

---

## 3. Module Responsibilities & Interfaces

### 3.1. Capability Detector (`capabilityDetector.ts`)
- **Role**: Discovers what media APIs, codecs, and hardware capabilities the host browser genuinely supports at runtime.
- **Methods**:
  - `detectCapabilities(): Promise<BrowserCapabilities>`
  - `isCodecSupported(codec: VideoCodec, container: ContainerFormat): boolean`
  - `getBestMimeType(preferredCodec: VideoCodec, preferredContainer: ContainerFormat): string`
  - `hasWebCodecsSupport(): boolean`
  - `hasHardwareAcceleration(): boolean`
- **Guarantees**: Never allows the UI or transcode pipeline to attempt an unsupported codec or container combination without transparent fallback notification.

### 3.2. Footage Analyzer (`footageAnalyzer.ts`)
- **Role**: Analyzes source video geometry, framerate, duration, estimated noise, and compression severity.
- **Methods**:
  - `analyzeFootage(source: VideoSource): VideoAnalysisResult`
  - `computeUpscaleOptions(sourceWidth, sourceHeight): UpscaleOption[]`
  - `recommendPreset(analysis: VideoAnalysisResult): HandbrakePreset`

### 3.3. Frame Scheduler (`frameScheduler.ts`)
- **Role**: Orchestrates frame-by-frame timing with bounded backpressure, ensuring smooth playback cadence without memory bloat.
- **Methods**:
  - `start(onFrame: (timestampUs: number, frameIndex: number) => Promise<void>): void`
  - `pause(): void`
  - `resume(): void`
  - `cancel(): void`
- **Guarantees**: Bounded execution queue; will not draw frame $N+1$ until frame $N$ has been processed by the renderer and consumed by the encoder track.

### 3.4. Frame Renderer (`frameRenderer.ts` & `enhancementEngine.ts`)
- **Role**: Unified graphics pipeline applying spatial transformations (crop, rotation, horizontal flip), color grading, gamma LUTs, 3x3 unsharp convolution, film grain synthesis, and device simulation profiles.
- **Methods**:
  - `renderFrame(sourceVideo, targetCanvas, preset): void`
  - `applyPixelEnhancements(ctx, width, height, enhancement, deviceProfile, motionBlur): void`
  - `buildCanvasCssFilter(enhancement, deviceProfile): string`
- **Guarantees**: Shared configuration between real-time A/B preview and export pipeline to eliminate preview/export visual disparity.

### 3.5. Audio Pipeline (`audioPipeline.ts`)
- **Role**: Web Audio routing, gain adjustment ($\pm 20\text{ dB}$), dynamic range compression (DRC), and drift-free synchronization with the video clock.
- **Methods**:
  - `setupAudioGraph(videoElement: HTMLVideoElement, gainDb: number, drc: number): AudioGraphHandle`
  - `getAudioTrack(): MediaStreamTrack | null`
  - `cleanup(): void`

### 3.6. Encoder Engine (`encoderEngine.ts`)
- **Role**: Encapsulates `MediaRecorder` and `WebCodecs` encoding tracks with lifecycle hooks, progress emission, and memory-safe chunk accumulation.
- **Methods**:
  - `startRecording(stream: MediaStream, mimeType: string, targetBitrate: number): void`
  - `stopRecording(): Promise<Blob>`
  - `pause(): void`
  - `resume(): void`
  - `abort(): void`
- **Guarantees**: Safely closes streams, detaches tracks, and discards resources on error or cancellation.

### 3.7. Export Validator (`exportValidator.ts`)
- **Role**: Performs post-export validation before a job is declared complete.
- **Methods**:
  - `validateExport(blob: Blob, expectedDuration: number): Promise<ValidationResult>`
- **Validation Criteria**:
  1. `sizeBytes > 0`: File contains actual encoded bytes.
  2. `decodable`: Browser can load the video blob and fire `loadedmetadata`.
  3. `durationCheck`: Exported duration matches expected duration within $\pm 0.5\text{s}$.
  4. `trackPresence`: Validates presence of video track (and audio track when source had audio).

### 3.8. Job Manager (`jobManager.ts`)
- **Role**: Coordinates the entire transcode process, queue states (`waiting`, `encoding`, `paused`, `completed`, `failed`), progress calculation, ETA estimates, and log streaming.

---

## 4. High-Quality Preset Stratification

To satisfy professional archival needs and social/streaming delivery, presets are structured into two distinct high-quality tiers:

### Tier 1: Master Archive & Maximum Fidelity
- **Target Audience**: Video editors, archival storage, high-end cinema and broadcast masters.
- **Settings**:
  - Constant Quality CRF: `14 - 16`
  - Bitrate Cap: `25,000 - 50,000 kbps`
  - 10-Bit Color Depth: `Rec.709` / `BT.2020 HDR`
  - Framerate: `60 FPS` / `24 FPS Cinema`
  - Scaling: Lanczos-3 with strict aspect retention
  - Audio: AAC 320 kbps / AC3 5.1 Surround Passthru

### Tier 2: Web & Streaming High Quality
- **Target Audience**: YouTube, Vimeo, Instagram Reels, TikTok, Web embedding.
- **Settings**:
  - Constant Quality CRF: `18 - 20`
  - Bitrate Range: `8,000 - 15,000 kbps`
  - Codec: H.264 High Profile / H.265 Main (universal hardware decoding)
  - Framerate: `60 FPS` (smooth action) or `30 FPS`
  - Audio: AAC CoreAudio 192 kbps Stereo with loudness normalization
  - Fast Start / Moov atom prioritization

---

## 5. Security & Memory Boundaries

1. **Local Object URLs**: All generated `blob:` URLs are tracked and explicitly revoked with `URL.revokeObjectURL()` once discarded.
2. **AudioContext Recycling**: Every transcode job closes its AudioContext on completion or abort, avoiding the browser limit of 6 simultaneous active AudioContexts.
3. **Canvas Cleanup**: Frame contexts are cleared with `clearRect()` and dimension allocations are capped to system limits ($1920\times 1080$ default, $3840\times 2160$ in 4K mode) to prevent GPU texture exhaustion.
