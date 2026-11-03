# VideoEncoder Pro & EXIF Studio: Integration Audit

## 1. Architectural Mapping

### 1.1 VideoEncoder Processing Pipeline
- **Media Ingestion**: HTMLMediaElement / WebCodecs metadata inspection via `VideoTranscoderService.inspectVideo`.
- **Capability Detection**: Runtime probe of supported MIME types (`video/mp4`, `video/webm`), hardware acceleration detection (`Apple VideoToolbox`, `MediaCodec`), and WebCodecs presence.
- **Frame Scheduler & Audio Pipeline**: Decoupled Web Audio routing (`GainNode`, `DynamicsCompressorNode`) synchronized with `canvas.captureStream()` and `MediaRecorder`.
- **Validation**: `ExportValidator` verifies duration, decodability, dimensions, and audio track presence post-export.

### 1.2 EXIF Studio Architecture (`exif-studio-video`)
- **Binary Box Parser (`mp4-parser.js`)**:
  - Parses ISO BMFF atoms (`ftyp`, `moov`, `mvhd`, `trak`, `tkhd`, `mdia`, `mdhd`, `hdlr`, `minf`, `stbl`, `stsd`, `stco`, `co64`, `udta`, `meta`, `ilst`, `keys`).
  - Slices files into headers and media data payloads, avoiding full in-memory loading of multi-gigabyte video files.
  - Updates 32-bit (`stco`) and 64-bit (`co64`) chunk offset tables when `moov` header size expands or contracts.
  - Formats and writes Apple QuickTime keys (`com.apple.quicktime.make`, `model`, `software`, `creationdate`) and standard iTunes metadata items (`©nam`, `©ART`, `©day`, `cprt`, `©xyz`).
- **Geolocation Engine (`geo-utils.js`)**:
  - Parses and serializes ISO 6709 geolocation strings (`±DD.DDDD±DDD.DDDD[±AAA.AAA]/`).
  - Formats coordinates into degrees-minutes-seconds (DMS) and XMP RDF metadata.
- **C2PA Engine (`c2pa-engine.js`)**:
  - Reads and inspects C2PA JUMBF UUID boxes (`d8fec3d3-1a3b-4834-9216-b5d43c2b1ff8`).
  - Audited status: Plain copyright strings are distinct from cryptographically signed C2PA manifests.

---

## 2. Integration Gap & Risk Analysis

| Risk Area | Existing Implementation | Integration Remedy |
|---|---|---|
| **Memory Risk (Large Files)** | Reading entire file into ArrayBuffer crashes browser tab on >2GB videos | Stream-slice architecture: only parse `moov` and `ftyp` into memory; stream `mdat` sample payload directly as Blob slices. |
| **Chunk Offset Corruption (`stco`/`co64`)** | Modifying `moov` size without shifting `stco`/`co64` invalidates audio/video sample pointers | Recalculate $\Delta \text{size}$ of `moov` and adjust all chunk offset entries before assembling output Blob. |
| **Track Matrix Distortion** | Hardcoded rotation matrices can invert aspect ratios or distort portrait footage | Read source `tkhd` matrix and display dimensions; update translation vector accordingly when modifying orientation. |
| **Black Screen / Codec Corruption** | Injecting Dolby Vision `dvvC` or invalid `stsd` entries into H.264 streams causes decoder failure | Strict isolation: preserve existing sample descriptions byte-for-byte; reject incompatible box injections. |
| **Lossless vs Re-encode Guarantee** | Users must understand difference between metadata edit and video transcode | Metadata-only export is 100% lossless (no video re-encoding). Re-encoded outputs apply metadata post-mux. |
| **Privacy Disclosure** | Metadata scrub does not remove burned-in subtitles, watermarks, or external cloud copies | Explicit disclosure banners in Privacy tab explaining container vs pixel data. |

---

## 3. Modular Shared Architecture Plan
The integration exposes five independently testable interfaces under `src/services/metadata/`:
1. `MetadataReader.read(file: File | Blob)`: Extract technical and user metadata.
2. `MetadataEditor.apply(file: File | Blob, edits: MetadataEdits)`: Lossless container modification.
3. `MetadataPrivacy.scrub(file: File | Blob, policy: ScrubPolicy)`: GPS-only, device-only, or full scrub.
4. `MetadataValidator.verify(file: File | Blob, expected: Partial<MetadataRecord>)`: Atom structure verification.
5. `MetadataExport.write(file: File | Blob, edits: MetadataEdits, mode: 'lossless' | 'transcode')`: Output file generation.
