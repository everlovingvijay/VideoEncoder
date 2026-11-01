import React, { useState } from 'react';
import { SWIFT_PROJECT_FILES, SwiftFile } from '../../data/swiftCodebase';
import { ANDROID_PROJECT_FILES, AndroidFile } from '../../data/androidCodebase';
import {
  Code2,
  Copy,
  Check,
  Download,
  FileCode,
  Cpu,
  Layers,
  Apple,
  Smartphone,
  Globe,
  ExternalLink,
} from 'lucide-react';

export const WEB_PROJECT_FILES = [
  {
    filename: 'manifest.json',
    path: 'public/manifest.json',
    description: 'PWA Web App Manifest for mobile and desktop standalone installation',
    language: 'json' as const,
    code: `{
  "id": "/",
  "name": "HandBrake Mobile - Multi-Platform Video Transcoder",
  "short_name": "HandBrake",
  "description": "High-performance video transcoder and batch encoder running on iOS, Android, Mobile Web and Desktop Web.",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "background_color": "#090a0f",
  "theme_color": "#f59e0b",
  "orientation": "any",
  "icons": [
    {
      "src": "/icon.svg",
      "sizes": "192x192 512x512",
      "type": "image/svg+xml",
      "purpose": "any"
    }
  ]
}`,
  },
  {
    filename: 'sw.js',
    path: 'public/sw.js',
    description: 'Service worker for offline assets and video cache management',
    language: 'javascript' as const,
    code: `const CACHE_NAME = 'handbrake-cache-v1';
const STATIC_ASSETS = ['/', '/index.html', '/icon.svg', '/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
  )));
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});`,
  },
  {
    filename: 'WebCodecsPipeline.ts',
    path: 'src/services/WebCodecsPipeline.ts',
    description: 'Hardware accelerated in-browser VideoEncoder & VideoDecoder pipeline',
    language: 'typescript' as const,
    code: `// WebCodecs High Performance Browser Transcoding Pipeline
export class WebCodecsPipeline {
  private encoder: VideoEncoder;
  private decoder: VideoDecoder;

  constructor(onChunk: (chunk: EncodedVideoChunk) => void) {
    this.encoder = new VideoEncoder({
      output: onChunk,
      error: (e) => console.error('Encoder error:', e),
    });

    this.decoder = new VideoDecoder({
      output: (frame) => this.processFrame(frame),
      error: (e) => console.error('Decoder error:', e),
    });
  }

  public configure(width: number, height: number, bitrate: number, codec = 'avc1.640028') {
    this.encoder.configure({
      codec,
      width,
      height,
      bitrate,
      framerate: 30,
      hardwareAcceleration: 'prefer-hardware',
    });
  }

  private processFrame(frame: VideoFrame) {
    // Process color adjustments or filters, then encode
    this.encoder.encode(frame);
    frame.close();
  }
}`,
  },
];

export const NativeCodeTab: React.FC = () => {
  const [activePlatform, setActivePlatform] = useState<'ios' | 'android' | 'web'>('ios');
  const [selectedFileIdx, setSelectedFileIdx] = useState(0);
  const [copied, setCopied] = useState(false);

  const getFiles = () => {
    switch (activePlatform) {
      case 'ios':
        return SWIFT_PROJECT_FILES;
      case 'android':
        return ANDROID_PROJECT_FILES;
      case 'web':
        return WEB_PROJECT_FILES;
    }
  };

  const files = getFiles();
  const currentFile = files[selectedFileIdx] || files[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = (f: { filename: string; code: string }) => {
    const blob = new Blob([f.code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = f.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadAll = () => {
    files.forEach((f, idx) => {
      setTimeout(() => handleDownloadFile(f), idx * 200);
    });
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 text-slate-100 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            Multi-Platform Code
          </h1>
          <p className="text-xs text-slate-400">
            Native Swift (iOS), Kotlin (Android), and PWA Web pipelines
          </p>
        </div>

        <button
          type="button"
          onClick={handleDownloadAll}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow transition-all"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export {activePlatform.toUpperCase()} Bundle</span>
        </button>
      </div>

      {/* Platform Architecture Selector Tabs */}
      <div className="grid grid-cols-3 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs font-semibold">
        <button
          type="button"
          onClick={() => {
            setActivePlatform('ios');
            setSelectedFileIdx(0);
          }}
          className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition-colors ${
            activePlatform === 'ios'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Apple className="w-4 h-4" />
          <span>Apple iOS (Swift)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActivePlatform('android');
            setSelectedFileIdx(0);
          }}
          className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition-colors ${
            activePlatform === 'android'
              ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>Android (Kotlin)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActivePlatform('web');
            setSelectedFileIdx(0);
          }}
          className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition-colors ${
            activePlatform === 'web'
              ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Web & PWA</span>
        </button>
      </div>

      {/* Platform Highlights */}
      <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs flex items-start gap-2.5">
        <Cpu className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-white">
            {activePlatform === 'ios' && 'Apple VideoToolbox (VTCompressionSession)'}
            {activePlatform === 'android' && 'Android MediaCodec & MediaMuxer Pipeline'}
            {activePlatform === 'web' && 'WebCodecs & MediaRecorder Hardware Acceleration'}
          </strong>
          <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
            {activePlatform === 'ios' &&
              'Native Apple Silicon hardware acceleration with BackgroundTasks BGProcessingTask for screen-off encodes and Dynamic Island Live Activities.'}
            {activePlatform === 'android' &&
              'Direct integration with Snapdragon, Google Tensor, and Exynos hardware encoders via MediaCodec with WorkManager for resilient background batch queues.'}
            {activePlatform === 'web' &&
              'Progressive Web App with Service Worker offline caching, WebCodecs low-latency hardware acceleration, and installable standalone display on all mobile and desktop browsers.'}
          </p>
        </div>
      </div>

      {/* File Selector Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar text-xs">
        {files.map((file, idx) => (
          <button
            key={file.filename}
            type="button"
            onClick={() => setSelectedFileIdx(idx)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-lg font-mono text-[11px] flex items-center gap-1.5 transition-colors ${
              selectedFileIdx === idx
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <FileCode className="w-3 h-3" />
            <span>{file.filename}</span>
          </button>
        ))}
      </div>

      {/* Code Editor Frame */}
      <div className="rounded-2xl bg-black border border-slate-800 overflow-hidden shadow-2xl">
        {/* Editor Top Bar */}
        <div className="px-3.5 py-2.5 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
            </div>
            <span className="text-[11px] font-mono text-slate-400 ml-2">
              {currentFile.path}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1 px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[11px] font-mono transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleDownloadFile(currentFile)}
              className="p-1.5 text-slate-400 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              title="Download File"
            >
              <Download className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Code Content View */}
        <pre className="p-4 text-[11px] font-mono leading-relaxed text-slate-200 overflow-x-auto max-h-[380px] bg-[#0c0d12] select-text">
          <code>{currentFile.code}</code>
        </pre>
      </div>

      {/* Official GitHub HandBrake Reference Link */}
      <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-center justify-between text-xs">
        <div className="space-y-0.5">
          <span className="font-bold text-white block">Official HandBrake Core</span>
          <span className="text-[11px] text-slate-400">github.com/handbrake/handbrake</span>
        </div>
        <a
          href="https://github.com/handbrake/handbrake"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl transition-colors font-medium text-xs"
        >
          <span>Repository</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};
