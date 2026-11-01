# 🎬 HandBrake Mobile & Web (VideoEncoder)

[![Live on GitHub Pages](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-success?style=for-the-badge&logo=github)](https://everlovingvijay.github.io/VideoEncoder/)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg?style=for-the-badge)](https://opensource.org/licenses/Apache-2.0)
[![React 19](https://img.shields.io/badge/React-19.0-61dafb?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178c6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v3%2Fv4-38bdf8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![PWA Ready](https://img.shields.io/badge/PWA-Installable-purple?style=for-the-badge&logo=pwa)](https://web.dev/progressive-web-apps/)

> **High-Performance Universal Video Transcoder & Batch Processing Studio**  
> Bringing the power and flexibility of **HandBrake** to mobile devices and modern web browsers. Transcode, compress, scale resolutions, adjust bitrates, batch queue jobs, and export production-ready native Swift & Kotlin codebases — **100% client-side with zero server uploads**.

🌐 **Live Web Application**: [https://everlovingvijay.github.io/VideoEncoder/](https://everlovingvijay.github.io/VideoEncoder/)  
⚡ **Dedicated Fast Studio Layout**: [https://everlovingvijay.github.io/VideoEncoder/studio.html](https://everlovingvijay.github.io/VideoEncoder/studio.html)

---

## 📑 Table of Contents

- [Key Features](#-key-features)
- [Universal Device Support](#-universal-device-support)
- [HandBrake Presets Engine](#-handbrake-presets-engine)
- [Transcoding Engine & Architecture](#-transcoding-engine--architecture)
- [Modules & Workspace Tabs](#-modules--workspace-tabs)
- [Native Code Generator (Swift & Kotlin)](#-native-code-generator)
- [PWA & Offline Installation](#-pwa--offline-installation)
- [Tech Stack](#-tech-stack)
- [Local Development Setup](#-local-development-setup)
- [GitHub Pages Deployment](#-github-pages-deployment)
- [Privacy & Security](#-privacy--security)
- [License](#-license)

---

## ✨ Key Features

- **🔒 100% Private & Client-Side**: All video parsing, frame compositing, scaling, audio manipulation, and encoding take place directly inside the client's browser engine using WebCodecs and Media APIs. No video data ever touches a remote server.
- **⚡ Hardware-Accelerated Performance**: Automatically routes to native hardware codecs:
  - **Apple Silicon / iOS**: Apple VideoToolbox (H.264 / HEVC hardware acceleration).
  - **Android**: Android MediaCodec & MediaMuxer pipelines.
  - **Desktop Web (Chrome / Safari / Edge / Firefox)**: WebCodecs and MediaRecorder APIs.
- **📱 Universal Multi-Platform Preview Switcher**: Test how your videos and interface look across:
  - **Apple iOS**: Simulated iPhone 16 Pro with dynamic island status indicators.
  - **Android**: Simulated Pixel 9 Pro shell.
  - **Mobile Web**: Touch-optimized compact mobile view.
  - **Desktop Web**: Full widescreen multi-column studio suite.
- **🎛️ Complete HandBrake Presets Library**: Production presets categorized across General, Web, Apple Devices, Android Devices, Production Masters, and Custom User Presets.
- **📋 Real-Time Batch Queue**: Queue multiple videos with different presets, monitor live progress percentages, elapsed time, remaining ETA, and processing FPS, with Pause, Resume, and Cancel controls.
- **🎨 Interactive Video Studio**: Real-time canvas preview, custom aspect framing (16:9, 9:16 Vertical Reels/Shorts with ambient blur, 1:1 Square), rotation, flip, and audio volume gain ($0\% \to 200\%$).
- **💻 Native Code Generation**: Export copy-pasteable native **Swift (AVFoundation / VideoToolbox)** and **Android Kotlin (MediaCodec / MediaMuxer)** codebases matching your selected transcode configuration.

---

## 📱 Universal Device Support

| Platform | Target Runtime | Acceleration API | Containers | Codecs Supported |
| :--- | :--- | :--- | :--- | :--- |
| **Apple iOS** | Safari iOS / PWA / Native Swift | VideoToolbox / AVFoundation | `.mp4`, `.mov` | H.264 (AVC), H.265 (HEVC), AAC |
| **Android** | Chrome Android / PWA / Native Kotlin | MediaCodec / MediaMuxer | `.mp4`, `.mkv` | H.264, VP8, VP9, AAC, Opus |
| **macOS** | Safari / Chrome / Edge | VideoToolbox / WebCodecs | `.mp4`, `.mov`, `.webm` | H.264, HEVC, VP9, AV1 |
| **Windows / Linux** | Chrome / Firefox / Edge | WebCodecs / MediaRecorder | `.mp4`, `.webm`, `.mkv` | H.264, VP9, VP8, Opus, AAC |

---

## 🎛️ HandBrake Presets Engine

The application includes exact replicas of HandBrake 1.9.0 presets:

### 1. General & Web Presets
- **Fast 1080p30**: Balanced high-speed H.264 encoding with AAC stereo (160 kbps).
- **HQ 1080p30**: High-quality visual fidelity with lower CRF / RF values.
- **Fast 720p30**: Optimized for bandwidth savings and quick social sharing.
- **Very Fast 480p30**: Lightweight encoding for low-bandwidth cellular environments.

### 2. Apple Device Presets
- **Apple 2160p60 4K HEVC**: 4K Ultra HD 60 FPS utilizing Apple VideoToolbox hardware HEVC encoder.
- **Apple 1080p60 HEVC**: High-frame-rate smooth playback for iPhone and iPad Retina screens.
- **Apple 1080p30 H.264**: Universal fallback profile compatible with all Apple devices from legacy to current.

### 3. Android Device Presets
- **Android 1080p30**: Tuned for Android Qualcomm Snapdragon, Google Tensor, and MediaTek MediaCodec decoders.
- **Android 720p30**: Compact profile for rapid WhatsApp, Telegram, and mobile downloads.

### 4. Target Size & Social Presets
- **WhatsApp Fast (< 16 MB)**: Auto-computes video bitrate ($R = \frac{16\text{ MB} \times 8}{T} - R_{\text{audio}}$) to ensure output strictly respects the 16MB file limit.
- **Discord Nitro Free (< 25 MB)**: Calibrated for free Discord server upload limitations.
- **Reels & Shorts (9:16 Vertical)**: Converts 16:9 widescreen videos to 9:16 vertical format with ambient frosted glass / blur background.

### 5. Custom Presets
Create, save, and manage your own custom presets directly in the browser (`localStorage` persistent):
- Container: MP4, MKV, MOV
- Video Codec: H.264, H.265 (HEVC), VP9
- Quality Rate Control: Average Bitrate (kbps) or Constant Quality (RF 18–28)
- Frame Rate: Source Match, 60 FPS, 30 FPS, 24 FPS (Cinematic)
- Audio Bitrate: 64 kbps, 128 kbps, 192 kbps, 320 kbps, or Mute

---

## 🏗️ Transcoding Engine & Architecture

```
[ Input File / Blob / Camera ]
             │
             ▼
   [ Metadata Inspector ]  ────────► Extracts duration, width, height, bitrate, FPS
             │
             ▼
  ┌────────────────────────────────────────────────────────┐
  │                 Client-Side Transcoder                  │
  │                                                        │
  │   [ HTML5 Video Element ] (Synchronous seek playback)   │
  │              │                                         │
  │              ▼                                         │
  │   [ Offscreen Canvas 2D ]                              │
  │   - Resolution Scaling (4K, 1080p, 720p, etc.)         │
  │   - Aspect Framing (Original, 9:16, 1:1, 4:5)          │
  │   - Ambient Background Blur / Letterbox                │
  │              │                                         │
  │              ▼                                         │
  │   [ canvas.captureStream(fps) ]                        │
  │              │                                         │
  │   [ Web Audio Context ]                                │
  │   - MediaElementSource -> GainNode -> StreamDest       │
  │              │                                         │
  │              ▼                                         │
  │   [ MediaRecorder / WebCodecs Pipeline ]               │
  │   - Dynamic Hardware Mime Probing                      │
  │   - Configurable VideoBitsPerSecond                    │
  │   - Configurable AudioBitsPerSecond                    │
  │              │                                         │
  └──────────────┼─────────────────────────────────────────┘
                 │
                 ▼
       [ Final Encoded Blob ] ──► Instant Preview & One-Click Download
```

---

## 🗂️ Modules & Workspace Tabs

1. **🎬 Transcode Tab**:
   - File dropzone with instant metadata chips (duration, resolution, estimated bitrate, file size).
   - Video player stage with seeking and frame inspection.
   - Active preset overview and quick actions: **"Start Transcode Now"** or **"Add to Batch Queue"**.
2. **🎛️ Presets Tab**:
   - Interactive catalog filterable by category (General, Web, Apple, Android, Production, Custom).
   - Custom preset builder with detailed parameter tuning.
3. **📋 Queue Tab**:
   - Job queue list with animated progress bars, real-time FPS counter, and time remaining (ETA).
   - Batch controls: Start Queue, Pause Active, Resume, Clear Completed.
   - Integrated live terminal log stream.
4. **🎨 Video Studio Tab**:
   - Visual video adjustment controls: Brightness, Contrast, Saturation.
   - Ambient blurred background toggles for social vertical video conversion.
   - Volume gain slider ($0\% \to 200\%$) and audio mute toggle.
5. **💻 Native Code Tab**:
   - Complete, copy-pasteable Swift and Kotlin codebases configured to match your active preset.
6. **🌐 Remote Server Tab**:
   - Instructions and templates for dispatching jobs to local or cloud headless HandBrake CLI nodes (`HandBrakeCLI`).

---

## 💻 Native Code Generator

Want to run this transcode natively inside an iOS or Android app without web wrappers? The **Swift Architecture** and **Android Architecture** tabs provide instant, zero-dependency production code:

### Native iOS (Swift + AVFoundation / VideoToolbox):
```swift
import AVFoundation

func transcodeVideo(sourceURL: URL, outputURL: URL, preset: String) async throws {
    let asset = AVAsset(url: sourceURL)
    guard let exportSession = AVAssetExportSession(
        asset: asset, 
        presetName: AVAssetExportPresetHEVC1920x1080
    ) else {
        throw TranscodeError.unsupportedPreset
    }
    exportSession.outputURL = outputURL
    exportSession.outputFileType = .mp4
    exportSession.shouldOptimizeForNetworkUse = true
    await exportSession.export()
}
```

### Native Android (Kotlin + MediaCodec / MediaMuxer):
```kotlin
val mediaExtractor = MediaExtractor().apply { setDataSource(context, sourceUri, null) }
val mediaMuxer = MediaMuxer(outputPath, MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4)
// Hardware MediaCodec encoder configuration with baseline/high profiles...
```

---

## 📲 PWA & Offline Installation

HandBrake Mobile is a fully compliant **Progressive Web App (PWA)**:
- **iPhone / iPad**: Open in Safari $\to$ tap **Share** $\to$ tap **"Add to Home Screen"**. Runs fullscreen with no Safari browser bars.
- **Android**: Tap the **"Add to Home Screen"** banner in Chrome.
- **macOS / Windows**: Click the install icon in the Chrome / Edge address bar to run as a standalone desktop app.
- **Offline Capable**: Cached by Service Worker (`sw.js`) so the transcoder runs even with zero internet connectivity.

---

## 🛠️ Tech Stack

- **Framework**: React 19, TypeScript
- **Bundler & Build Tool**: Vite 8 & esbuild
- **Styling**: Tailwind CSS (with runtime JIT compilation fallback)
- **Icons**: Lucide React
- **Animations**: Motion (Framer Motion)
- **Audio Processing**: Web Audio API (`AudioContext`, `GainNode`)
- **Video Processing**: HTML5 Canvas 2D API, `MediaStream`, `MediaRecorder`

---

## 🚀 Local Development Setup

### Prerequisites
- Node.js (v18+) or any static HTTP server (Python / Ruby)

### Running Locally
```bash
# 1. Clone the repository
git clone https://github.com/everlovingvijay/VideoEncoder.git
cd VideoEncoder

# 2. Install dependencies
npm install --legacy-peer-deps

# 3. Start development server
npm run dev

# 4. Build for production
npm run build
```

Alternatively, open [`dist/index.html`](file:///Users/vijays/.gemini/antigravity/scratch/VideoEncoder-project/dist/index.html) or [`dist/studio.html`](file:///Users/vijays/.gemini/antigravity/scratch/VideoEncoder-project/dist/studio.html) directly in any web browser!

---

## 🌐 GitHub Pages Deployment

The project is deployed to GitHub Pages on the `gh-pages` branch:

```bash
# Publish built files to gh-pages branch
git push origin `git subtree split --prefix dist main`:gh-pages --force
```

GitHub Pages configuration:
- **Source**: Deploy from a branch
- **Branch**: `gh-pages` / `/ (root)`
- **URL**: [https://everlovingvijay.github.io/VideoEncoder/](https://everlovingvijay.github.io/VideoEncoder/)

---

## 🔒 Privacy & Security

- **Zero Cloud Processing**: Videos are processed in memory inside your browser.
- **No Analytics / No Tracking**: No cookies, no session trackers, no telemetry.
- **Open Source**: Full code transparency under Apache 2.0.

---

## 📄 License

Licensed under the **Apache License 2.0**. See the [LICENSE](LICENSE) file for details.  
Inspired by the open-source **HandBrake** project (handbrake.fr).
