# Implementation Plan — VideoEncoder Pro
**Target Release:** Release 2.0 (Reliable Core)  
**Project:** `everlovingvijay/VideoEncoder`  
**Execution Strategy:** Incremental upgrade preserving all existing features, UI behavior, and GitHub Pages paths.  

---

## 1. Migration Overview & Strategy

This implementation plan governs the transition from the prototype transcoder pipeline to the modular, reliable, production-grade **Release 2.0 Core Architecture**.

### Safety Guarantees
- **No Rewrite from Scratch**: We upgrade existing modules in-place and introduce clean service abstractions.
- **Backward Compatibility**: Existing custom presets stored in `localStorage` remain fully valid and load without errors.
- **Continuous Deployment**: Every commit must build cleanly (`npm run build` / `esbuild`) and pass automated tests.
- **Zero Cosmetic-Only Placeholders**: Every setting in the UI corresponds to a real processing parameter.

---

## 2. Release Roadmap

| Release | Focus Area | Key Deliverables | Status |
| :--- | :--- | :--- | :--- |
| **Phase 0** | Repository Audit & Baselines | Feature audit, architecture specs, baseline benchmarks, test harness. | **IN PROGRESS** |
| **Release 2.0** | Reliable Core | Capability detection, modular frame scheduler, audio sync, bounded backpressure, export validation, dual-tier high-quality presets. | **TARGET** |
| **Release 2.1** | Fast Processing & WebGPU | WebGPU compute shader filter acceleration, Canvas/WebGL fallback, batch queue retry/cancel. | Planned |
| **Release 2.2** | Professional Enhancement | Edge-aware denoise, face protection masks, .cube 3D LUT support, histogram/waveform scopes. | Planned |
| **Release 2.3** | Creative Studio | Non-destructive trim/split/merge, multi-image photo-to-video timeline, audio waveforms. | Planned |
| **Release 2.4** | Optional AI & Motion | ONNX Runtime Web local super-resolution, motion-estimated interpolation, optical flow stabilization. | Planned |

---

## 3. Release 2.0 Implementation Breakdown

### Phase 2.0.1: Capability Detection Engine
- Create `src/services/capabilityDetector.ts`:
  - Runtime detection of `window.VideoEncoder`, `window.VideoDecoder`, `window.MediaRecorder`.
  - Comprehensive MIME type querying:
    - `video/mp4;codecs=avc1.640028` (H.264 High 4.0)
    - `video/mp4;codecs=hev1.1.6.L93.B0` (HEVC)
    - `video/webm;codecs=vp9,opus`
    - `video/webm;codecs=vp8,opus`
    - `video/webm;codecs=av01`
  - Container validation: checks whether requested container (`mp4`, `webm`, `mkv`, `mov`) is natively muxable.
  - Exposes `detectCapabilities()` and `getBestMimeType()`.

### Phase 2.0.2: Frame Scheduler & Bounded Backpressure
- Create `src/services/frameScheduler.ts`:
  - Implements bounded frame loop driven by accurate clock timestamps.
  - Ensures previous frame rendering and track capture completes before advancing video currentTime or rendering subsequent frames.
  - Graceful pause, resume, and instant abort capabilities.

### Phase 2.0.3: Audio Pipeline & Synchronization
- Create `src/services/audioPipeline.ts`:
  - Isolates Web Audio graph management from UI components.
  - Configures `MediaElementAudioSourceNode`, `GainNode` ($\pm 20\text{ dB}$), and `DynamicsCompressorNode` for DRC.
  - Provides reliable track destination management with guaranteed `audioCtx.close()` on termination.

### Phase 2.0.4: Export Validation Service
- Create `src/services/exportValidator.ts`:
  - Inspects finished `Blob` before resolving job promise:
    - Verifies file size $> 0$.
    - Verifies decodability by creating a temporary detached video element and awaiting `loadedmetadata`.
    - Compares exported duration against expected duration ($\pm 0.5\text{s}$ tolerance).
    - Verifies track counts (video track present, audio track present if source had audio).

### Phase 2.0.5: Transcoder Modular Refactor
- Update `src/services/videoTranscoder.ts`:
  - Integrate `capabilityDetector`, `frameScheduler`, `audioPipeline`, `exportValidator`, and `enhancementEngine`.
  - Provide unified transcode runner with fallback adaptability.

### Phase 2.0.6: Dual-Tier High-Quality Presets
- Update `src/data/handbrakePresets.ts`:
  - **Tier 1: Master Archive & Maximum Fidelity Presets**:
    - `Master 4K60 HEVC 10-bit (CRF 14)`
    - `Master 1080p60 AVC Pristine (CRF 16)`
    - `Cinema Master 4K24 Rec.2020 (CRF 14)`
  - **Tier 2: Web & Streaming High Quality Presets**:
    - `Web 1080p60 Ultra Stream (CRF 18)`
    - `Social 9:16 High-Bitrate Reel (CRF 19)`
    - `Web 4K30 High-Efficiency (CRF 20)`

### Phase 2.0.7: UI Integration & Preview Parity
- Update `src/components/tabs/TranscodeTab.tsx`:
  - Display capability badge (e.g. "Hardware VideoToolbox / MediaCodec Active").
  - Gated container/codec options based on detected browser capabilities.
  - Unified real-time A/B split preview using identical pixel rendering logic.

---

## 4. Verification & Testing Matrix

| Test Suite | File | Coverage |
| :--- | :--- | :--- |
| **Capability Detection** | `tests/capabilityDetector.test.ts` | MIME type resolution, codec support parsing, container fallback. |
| **Footage Analysis** | `tests/footageAnalyzer.test.ts` | Aspect ratios (16:9, 9:16, 1:1), orientation detection, bitrate bpp. |
| **Enhancement Pipeline** | `tests/enhancementEngine.test.ts` | Kelvin color temp matrix, gamma LUT, 3x3 convolution math, film grain. |
| **Export Validation** | `tests/exportValidator.test.ts` | Duration tolerance, decodability checks, empty blob rejection. |
| **Full Build & Bundle** | Production build script | Validates zero TypeScript errors and clean `dist/bundle.js` compilation. |

---

## 5. Rollback & Contingency Plan
1. Every release step is verified against the test harness before tagging or deploying.
2. If any browser exhibits instability with experimental WebCodecs paths, the capability detector automatically flags it as unsupported and routes to the stable `MediaRecorder` + Canvas pipeline.
3. Git tags will mark the completion of each release (e.g., `v2.0.0-core`) allowing immediate fast-forward or rollback if needed.
