/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  HandbrakePreset,
  QueueItem,
  VideoSource,
  LogEntry,
} from './types/handbrake';
import { DEFAULT_PRESETS } from './data/handbrakePresets';
import { PRESET_SAMPLE_METADATA, generateSyntheticVideoBlob } from './data/sampleVideos';
import { transcoderService } from './services/videoTranscoder';
import { PlatformSwitcherBar, PlatformTarget } from './components/PlatformSwitcherBar';
import { IOSDeviceFrame } from './components/iOSDeviceFrame';
import { AndroidDeviceFrame } from './components/AndroidDeviceFrame';
import { MobileWebFrame } from './components/MobileWebFrame';
import { StudioHeader } from './components/StudioHeader';
import { IOSBottomBar, MainTabType } from './components/iOSBottomBar';
import { TranscodeTab } from './components/tabs/TranscodeTab';
import { PresetsTab } from './components/tabs/PresetsTab';
import { QueueTab } from './components/tabs/QueueTab';
import { VideoStudioTab } from './components/tabs/VideoStudioTab';
import { MetadataStudioTab } from './components/tabs/MetadataStudioTab';
import { NativeCodeTab } from './components/tabs/NativeCodeTab';
import { RemoteServerTab } from './components/tabs/RemoteServerTab';
import { PWAInstallBanner } from './components/PWAInstallBanner';

export default function App() {
  const [platform, setPlatform] = useState<PlatformTarget>('web');

  const [presets, setPresets] = useState<HandbrakePreset[]>(() => {
    try {
      const saved = localStorage.getItem('hb_custom_presets');
      if (saved) {
        const parsed = JSON.parse(saved);
        return [...DEFAULT_PRESETS, ...parsed];
      }
    } catch (e) {
      // ignore
    }
    return DEFAULT_PRESETS;
  });

  const [activePreset, setActivePreset] = useState<HandbrakePreset>(DEFAULT_PRESETS[0]);
  const [source, setSource] = useState<VideoSource | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: 'init-1',
      timestamp: '09:41:00',
      level: 'notice',
      message: 'HandBrake 1.9.0 Multi-Platform Engine initialized (iOS, Android, mweb, web)',
    },
    {
      id: 'init-2',
      timestamp: '09:41:01',
      level: 'info',
      message: 'Hardware Acceleration: Apple VideoToolbox / Android MediaCodec / WebCodecs',
    },
    {
      id: 'init-3',
      timestamp: '09:41:02',
      level: 'info',
      message: 'CoreAudio AAC, MediaMuxer and WebAssembly pipelines ready.',
    },
  ]);

  const [activeTab, setActiveTab] = useState<MainTabType>('transcode');
  const [isEncoding, setIsEncoding] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [latestEncodedUrl, setLatestEncodedUrl] = useState<string | undefined>(undefined);
  const [latestEncodedJob, setLatestEncodedJob] = useState<QueueItem | null>(null);

  // Load an initial demo sample video so user can test right away
  useEffect(() => {
    let isCancelled = false;
    const loadInitialSample = async () => {
      try {
        const meta = PRESET_SAMPLE_METADATA[0];
        const res = await generateSyntheticVideoBlob(
          'Apollo 4K Demo',
          1280,
          720,
          8,
          30
        );
        if (!isCancelled) {
          setSource({
            ...meta,
            width: 1280,
            height: 720,
            durationSeconds: 8,
            url: res.url,
            thumbnailUrl: res.thumbnailUrl,
          });
        }
      } catch (err) {
        console.warn('Initial sample video generation skipped:', err);
      }
    };
    loadInitialSample();
    return () => {
      isCancelled = true;
    };
  }, []);

  const addLog = (message: string, level: LogEntry['level'] = 'info') => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    setLogs((prev) => [
      ...prev,
      {
        id: `log-${Date.now()}-${Math.random()}`,
        timestamp: timeStr,
        level,
        message,
      },
    ]);
  };

  const handleSaveCustomPreset = (newPreset: HandbrakePreset) => {
    setPresets((prev) => {
      const updated = [...prev, newPreset];
      const customs = updated.filter((p) => p.category === 'Custom');
      localStorage.setItem('hb_custom_presets', JSON.stringify(customs));
      return updated;
    });
  };

  const handleDeleteCustomPreset = (presetId: string) => {
    setPresets((prev) => {
      const updated = prev.filter((p) => p.id !== presetId);
      const customs = updated.filter((p) => p.category === 'Custom');
      localStorage.setItem('hb_custom_presets', JSON.stringify(customs));
      return updated;
    });
    if (activePreset.id === presetId) {
      setActivePreset(DEFAULT_PRESETS[0]);
    }
  };

  const handleAddToQueue = (): QueueItem | null => {
    if (!source) return null;

    const ext = activePreset.container === 'mp4' ? '.mp4' : activePreset.container === 'mkv' ? '.mkv' : '.mov';
    const baseName = source.name.replace(/\.[^/.]+$/, '');
    const outName = `${baseName}_${activePreset.name.replace(/[^a-zA-Z0-9]/g, '_')}${ext}`;

    const newItem: QueueItem = {
      id: `job-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      source,
      preset: activePreset,
      outputName: outName,
      container: activePreset.container,
      status: 'waiting',
      progressPercent: 0,
      currentFrame: 0,
      totalFrames: Math.round(source.durationSeconds * 30),
      fps: 0,
      etaSeconds: Math.round(source.durationSeconds),
      elapsedSeconds: 0,
      pass: 1,
      totalPasses: activePreset.video.twoPass ? 2 : 1,
      outputSizeBytes: 0,
    };

    setQueue((prev) => [...prev, newItem]);
    addLog(`[queue] Added "${outName}" with preset "${activePreset.name}" to batch queue.`, 'notice');
    return newItem;
  };

  const runJob = async (job: QueueItem) => {
    setIsEncoding(true);
    setActiveJobId(job.id);

    setQueue((prev) =>
      prev.map((q) => (q.id === job.id ? { ...q, status: 'encoding' } : q))
    );

    try {
      const result = await transcoderService.transcode(job, (prog) => {
        setQueue((prev) =>
          prev.map((q) => {
            if (q.id !== job.id) return q;
            return {
              ...q,
              progressPercent: prog.percent,
              currentFrame: prog.currentFrame,
              totalFrames: prog.totalFrames,
              fps: prog.fps || q.fps,
              etaSeconds: prog.etaSeconds,
              elapsedSeconds: prog.elapsedSeconds,
            };
          })
        );

        if (prog.logEntry) {
          setLogs((l) => [...l, prog.logEntry!]);
        }
      });

      const completedJob: QueueItem = {
        ...job,
        status: 'completed',
        progressPercent: 100,
        outputSizeBytes: result.sizeBytes,
        outputBlobUrl: result.url,
        completedAt: Date.now(),
      };

      setQueue((prev) =>
        prev.map((q) => (q.id === job.id ? completedJob : q))
      );

      setLatestEncodedUrl(result.url);
      setLatestEncodedJob(completedJob);
      addLog(`[queue] Job "${job.outputName}" completed successfully! File ready for download.`, 'notice');

      // Auto-trigger browser download so user immediately gets the file
      try {
        const dlLink = document.createElement('a');
        dlLink.href = result.url;
        dlLink.download = job.outputName;
        document.body.appendChild(dlLink);
        dlLink.click();
        document.body.removeChild(dlLink);
        addLog(`[download] Automatic download started for "${job.outputName}"`, 'info');
      } catch (dlErr) {
        console.warn('Auto download note:', dlErr);
      }

      // Play completion chime
      try {
        const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.12); // A5
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
      } catch (e) {
        // audio chime optional
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Transcoding failed';
      setQueue((prev) =>
        prev.map((q) =>
          q.id === job.id
            ? { ...q, status: 'failed', errorMessage: errMsg }
            : q
        )
      );
      addLog(`[error] Transcode failure: ${errMsg}`, 'error');
    } finally {
      setIsEncoding(false);
      setActiveJobId(null);
    }
  };

  const handleStartEncodeNow = async () => {
    if (!source || isEncoding) return;
    const newJob = handleAddToQueue();
    if (newJob) {
      setActiveTab('queue');
      await runJob(newJob);
    }
  };

  const handleStartQueue = async () => {
    if (isEncoding) return;
    const waiting = queue.filter((q) => q.status === 'waiting');
    if (waiting.length > 0) {
      for (const job of waiting) {
        await runJob(job);
      }
    }
  };

  const handlePauseActive = () => {
    if (activeJobId) {
      transcoderService.pause(activeJobId);
      setQueue((prev) =>
        prev.map((q) => (q.id === activeJobId ? { ...q, status: 'paused' } : q))
      );
    }
  };

  const handleResumeActive = () => {
    if (activeJobId) {
      transcoderService.resume(activeJobId);
      setQueue((prev) =>
        prev.map((q) => (q.id === activeJobId ? { ...q, status: 'encoding' } : q))
      );
    }
  };

  const handleCancelActive = () => {
    if (activeJobId) {
      transcoderService.abort(activeJobId);
      setQueue((prev) =>
        prev.map((q) => (q.id === activeJobId ? { ...q, status: 'cancelled' } : q))
      );
      setIsEncoding(false);
      setActiveJobId(null);
    }
  };

  const handleRemoveQueueItem = (id: string) => {
    if (activeJobId === id) {
      handleCancelActive();
    }
    setQueue((prev) => prev.filter((q) => q.id !== id));
  };

  const handleClearCompleted = () => {
    setQueue((prev) => prev.filter((q) => q.status !== 'completed' && q.status !== 'cancelled'));
  };

  const handleDownloadOutput = (job: QueueItem) => {
    if (!job.outputBlobUrl) return;
    const a = document.createElement('a');
    a.href = job.outputBlobUrl;
    a.download = job.outputName;
    a.click();
  };

  const activeJob = queue.find((q) => q.id === activeJobId) || null;
  const pendingCount = queue.filter((q) => q.status === 'waiting' || q.status === 'encoding').length;

  // Active Screen Renderer
  const renderScreen = () => {
    switch (activeTab) {
      case 'transcode':
        return (
          <TranscodeTab
            source={source}
            preset={activePreset}
            onSelectSource={(src) => setSource(src)}
            onSelectPreset={(p) => setActivePreset(p)}
            onOpenPresetsModal={() => setActiveTab('presets')}
            onOpenStudioTab={() => setActiveTab('studio')}
            onStartEncodeNow={handleStartEncodeNow}
            onAddToQueue={handleAddToQueue}
            isEncoding={isEncoding}
            latestEncodedUrl={latestEncodedUrl}
            latestEncodedName={latestEncodedJob?.outputName}
            latestEncodedSizeBytes={latestEncodedJob?.outputSizeBytes}
          />
        );
      case 'presets':
        return (
          <PresetsTab
            presets={presets}
            activePresetId={activePreset.id}
            onSelectPreset={(p) => {
              setActivePreset(p);
              setActiveTab('transcode');
            }}
            onSaveCustomPreset={handleSaveCustomPreset}
            onDeleteCustomPreset={handleDeleteCustomPreset}
          />
        );
      case 'queue':
        return (
          <QueueTab
            queue={queue}
            logs={logs}
            isEncoding={isEncoding}
            onStartQueue={handleStartQueue}
            onStartSingleJob={(job) => runJob(job)}
            onPauseQueue={handlePauseActive}
            onResumeQueue={handleResumeActive}
            onRemoveItem={handleRemoveQueueItem}
            onClearCompleted={handleClearCompleted}
            onDownloadOutput={handleDownloadOutput}
          />
        );
      case 'studio':
        return (
          <VideoStudioTab
            preset={activePreset}
            source={source}
            onUpdatePreset={(updated) => setActivePreset(updated)}
          />
        );
      case 'metadata':
        return (
          <MetadataStudioTab
            source={source}
            onSelectSource={(src) => setSource(src)}
            onEnqueueLosslessExport={(blob, name) => {
              const url = URL.createObjectURL(blob);
              setSource({
                id: `lossless-${Date.now()}`,
                name,
                sizeBytes: blob.size,
                durationSeconds: source?.durationSeconds || 10,
                width: source?.width || 1920,
                height: source?.height || 1080,
                fps: source?.fps || 30,
                bitrateKbps: source?.bitrateKbps || 6000,
                codec: blob.type || 'video/mp4',
                url,
                thumbnailUrl: '',
              });
              setActiveTab('transcode');
            }}
          />
        );
      case 'code':
        return <NativeCodeTab />;
      case 'remote':
        return <RemoteServerTab />;
      default:
        return null;
    }
  };

  // Base inner content inside mobile shells
  const mobileInner = (
    <>
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {renderScreen()}
      </div>
      <IOSBottomBar
        activeTab={activeTab}
        onChangeTab={(t) => setActiveTab(t)}
        queueBadgeCount={pendingCount}
      />
    </>
  );

  return (
    <div className="min-h-screen bg-[#07080b] flex flex-col">
      {/* Top Universal Platform Selector Bar */}
      <PlatformSwitcherBar
        currentPlatform={platform}
        onSelectPlatform={(p) => setPlatform(p)}
      />

      {/* Render according to selected Platform */}
      {platform === 'ios' ? (
        <IOSDeviceFrame
          activeJob={activeJob}
          isStudioMode={false}
          onToggleMode={() => setPlatform('web')}
          onPauseJob={handlePauseActive}
          onResumeJob={handleResumeActive}
          onCancelJob={handleCancelActive}
          onViewQueue={() => setActiveTab('queue')}
        >
          {mobileInner}
        </IOSDeviceFrame>
      ) : platform === 'android' ? (
        <AndroidDeviceFrame
          activeJob={activeJob}
          onPauseJob={handlePauseActive}
          onResumeJob={handleResumeActive}
          onCancelJob={handleCancelActive}
          onViewQueue={() => setActiveTab('queue')}
          onToggleToWeb={() => setPlatform('web')}
        >
          {mobileInner}
        </AndroidDeviceFrame>
      ) : platform === 'mweb' ? (
        <MobileWebFrame onToggleToWeb={() => setPlatform('web')}>
          {mobileInner}
        </MobileWebFrame>
      ) : (
        /* Desktop Web Full Studio Suite */
        <div className="flex-1 flex flex-col bg-[#090a0f] text-slate-100">
          <PWAInstallBanner />
          <StudioHeader
            activeTab={activeTab}
            onChangeTab={(t) => setActiveTab(t)}
            onSwitchToPhoneFrame={() => setPlatform('ios')}
            onStartEncodeNow={handleStartEncodeNow}
            isEncoding={isEncoding}
          />
          <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 flex flex-col min-h-0">
            {renderScreen()}
          </main>
        </div>
      )}
    </div>
  );
}
