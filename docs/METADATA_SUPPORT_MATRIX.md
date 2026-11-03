# Video Metadata Support Matrix

## 1. Container & Codec Compatibility

| Container | Extension | Lossless Metadata Read | Lossless Metadata Write | Transcode + Metadata Embedding | Notes |
|---|---|---|---|---|---|
| **QuickTime File Format** | `.mov` | Yes | Yes | Yes | Native Apple `mdta` keys, `udta`, ISO 6709 `©xyz` |
| **MPEG-4 Part 14** | `.mp4` | Yes | Yes | Yes | Standard `moov.udta.meta.ilst` and `keys` |
| **M4V Video** | `.m4v` | Yes | Yes | Yes | Identical structure to MP4 |
| **Matroska** | `.mkv` | Technical inspection | Read-only in v2.0 | Re-encoding to MP4/WebM supported | EBML parser planned for Release 2.3 |
| **WebM** | `.webm` | Technical inspection | Read-only in v2.0 | Native browser encoding supported | WebM Vorbis/Opus tags supported |

---

## 2. Supported Metadata Tags & Atom Locations

| Field Name | QuickTime / MP4 Atom Path | Editable | Privacy Scrub Target | Description |
|---|---|---|---|---|
| **Creation Date** | `moov.mvhd` / `tkhd` / `mdhd` / `keys:creationdate` | Yes | Yes (Reset to epoch/now) | Mac 1904 UTC timestamp and ISO 8601 string |
| **Modification Date**| `moov.mvhd` / `tkhd` / `mdhd` | Yes | Yes | QuickTime 1904 epoch timestamp |
| **Title / Video Name**| `moov.udta.meta.ilst.©nam` | Yes | Yes | Display title |
| **Artist / Author** | `moov.udta.meta.ilst.©ART` | Yes | Yes | Creator / author information |
| **Copyright** | `moov.udta.meta.ilst.cprt` | Yes | Yes | Copyright statement |
| **Camera Make** | `moov.meta.keys:com.apple.quicktime.make` | Yes | Yes (Device scrub) | e.g. `Apple`, `Sony`, `Canon` |
| **Camera Model** | `moov.meta.keys:com.apple.quicktime.model` | Yes | Yes (Device scrub) | e.g. `iPhone 16 Pro`, `A7S III` |
| **Software / OS** | `moov.meta.keys:com.apple.quicktime.software` | Yes | Yes (Device scrub) | e.g. `iOS 18.1`, `VideoEncoder 2.0` |
| **Lens Model** | `moov.meta.keys:com.apple.quicktime.lens-model` | Yes | Yes (Device scrub) | Camera lens specification |
| **ISO 6709 Geotag** | `moov.udta.©xyz` / `moov.meta.keys:location.ISO6709` | Yes | Yes (GPS scrub) | `±DD.DDDD±DDD.DDDD+AAA.AAA/` |
| **Track Rotation** | `moov.trak.tkhd.matrix` | Yes (0°, 90°, 180°, 270°) | No (Visual property) | 16.16 fixed-point affine transformation |
| **Duration / Timescale** | `moov.mvhd` | Read-only (Derived) | No | Technical stream timing |
| **Codec / Compressor** | `moov.trak.mdia.minf.stbl.stsd` | Read-only (Derived) | No | FourCC (`avc1`, `hvc1`, `vp09`, `av01`) |
| **C2PA Credentials** | `uuid:d8fec3d3-1a3b-4834-9216-b5d43c2b1ff8` | Read / Strip / Opt-in | Yes (Full scrub) | JUMBF provenance box |

---

## 3. Privacy Presets & Verification

1. **GPS-Only Scrub**:
   - Removes `©xyz` from `udta` and all `location.ISO6709` entries from `meta.keys` and `ilst`.
   - Leaves device make, model, timestamps, and video streams untouched.
2. **Creator & Device Scrub**:
   - Removes camera make, model, software, lens model, and author tags.
   - Clears serial numbers and unique hardware identifiers.
3. **Full Privacy Scrub**:
   - Strips GPS, device metadata, creation software, and custom `udta`/`meta` keys.
   - Resets creation and modification timestamps to epoch (1970-01-01 UTC) or user-specified baseline.
   - Removes any embedded C2PA provenance UUID boxes.
