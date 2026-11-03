import React, { useState, useEffect, useRef } from 'react';
import {
  VideoSource,
} from '../../types/handbrake';
import {
  MetadataRecord,
  MetadataEdits,
  MetadataLocation,
  ScrubPolicy,
} from '../../services/metadata/metadataTypes';
import { MetadataReader } from '../../services/metadata/metadataReader';
import { MetadataEditor } from '../../services/metadata/metadataEditor';
import { MetadataPrivacy } from '../../services/metadata/metadataPrivacy';
import { MetadataValidator } from '../../services/metadata/metadataValidator';
import { MetadataExport } from '../../services/metadata/metadataExport';
import { geoUtils } from '../../services/metadata/geoUtils';
import {
  Tag,
  MapPin,
  ShieldCheck,
  FileCheck,
  Sliders,
  Layers,
  Upload,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Compass,
  Camera,
  Film,
  RefreshCw,
  ExternalLink,
  Trash2,
  Info,
  ShieldAlert,
} from 'lucide-react';

interface MetadataStudioTabProps {
  source: VideoSource | null;
  onSelectSource?: (source: VideoSource) => void;
  onEnqueueLosslessExport?: (blob: Blob, name: string) => void;
}

export type MetadataSubTab = 'inspect' | 'edit' | 'geotag' | 'privacy' | 'batch' | 'export';

export const MetadataStudioTab: React.FC<MetadataStudioTabProps> = ({
  source,
  onSelectSource,
  onEnqueueLosslessExport,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<MetadataSubTab>('inspect');
  const [metaRecord, setMetaRecord] = useState<MetadataRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'info' | 'success' | 'warning' | 'error'>('info');

  // Editable Form State
  const [editTitle, setEditTitle] = useState('');
  const [editArtist, setEditArtist] = useState('');
  const [editCopyright, setEditCopyright] = useState('');
  const [editMake, setEditMake] = useState('');
  const [editModel, setEditModel] = useState('');
  const [editSoftware, setEditSoftware] = useState('');
  const [editLensModel, setEditLensModel] = useState('');
  const [editCreationDate, setEditCreationDate] = useState('');

  // Geotag Form State
  const [geoLat, setGeoLat] = useState<string>('');
  const [geoLon, setGeoLon] = useState<string>('');
  const [geoAlt, setGeoAlt] = useState<string>('');
  const [showMap, setShowMap] = useState(false);

  // Privacy Diff State
  const [privacyDiff, setPrivacyDiff] = useState<Record<string, { before: string | null; after: string | null }> | null>(null);

  // Batch State
  interface BatchFileItem {
    id: string;
    file: File;
    status: 'pending' | 'processing' | 'done' | 'error';
    error?: string;
    outputBlob?: Blob;
    outputName?: string;
  }
  const [batchItems, setBatchItems] = useState<BatchFileItem[]>([]);

  // Lossless Export Result State
  const [exportedBlob, setExportedBlob] = useState<Blob | null>(null);
  const [exportedBlobUrl, setExportedBlobUrl] = useState<string | null>(null);
  const [exportedFilename, setExportedFilename] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const batchInputRef = useRef<HTMLInputElement>(null);

  // Load and read metadata whenever active source changes
  useEffect(() => {
    let isMounted = true;
    const loadMetadata = async () => {
      if (!source) {
        setMetaRecord(null);
        return;
      }
      setIsLoading(true);
      try {
        let blobToRead: Blob;
        if (source.file) {
          blobToRead = source.file;
        } else {
          const res = await fetch(source.url);
          blobToRead = await res.blob();
        }

        const record = await MetadataReader.read(blobToRead);
        if (isMounted) {
          setMetaRecord(record);
          // Populate edit fields
          setEditTitle(record.tags.title || '');
          setEditArtist(record.tags.artist || '');
          setEditCopyright(record.tags.copyright || '');
          setEditMake(record.tags.make || '');
          setEditModel(record.tags.model || '');
          setEditSoftware(record.tags.software || '');
          setEditLensModel(record.tags.lensModel || '');
          if (record.tags.creationDate) {
            const d = record.tags.creationDate instanceof Date
              ? record.tags.creationDate
              : new Date(record.tags.creationDate);
            if (!isNaN(d.getTime())) {
              setEditCreationDate(d.toISOString().slice(0, 16));
            }
          }

          // Populate location
          if (record.location) {
            setGeoLat(record.location.latitude.toString());
            setGeoLon(record.location.longitude.toString());
            setGeoAlt(record.location.altitude !== null && record.location.altitude !== undefined ? record.location.altitude.toString() : '');
          } else {
            setGeoLat('');
            setGeoLon('');
            setGeoAlt('');
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setStatusMessage(`Metadata inspect warning: ${err.message || 'Unable to parse container'}`);
          setStatusType('warning');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadMetadata();
    return () => {
      isMounted = false;
    };
  }, [source]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onSelectSource) return;

    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = url;
    video.onloadedmetadata = () => {
      onSelectSource({
        id: `upload-${Date.now()}`,
        name: file.name,
        sizeBytes: file.size,
        durationSeconds: video.duration || 10,
        width: video.videoWidth || 1920,
        height: video.videoHeight || 1080,
        fps: 30,
        bitrateKbps: Math.round((file.size * 8) / (video.duration || 10) / 1000),
        codec: file.type || 'video/mp4',
        url,
        thumbnailUrl: '',
        file,
      });
    };
  };

  const handleApplyEdits = async () => {
    if (!source) return;
    setIsLoading(true);
    try {
      const edits: MetadataEdits = {
        tags: {
          title: editTitle,
          artist: editArtist,
          copyright: editCopyright,
          make: editMake,
          model: editModel,
          software: editSoftware,
          lensModel: editLensModel,
        },
      };

      if (editCreationDate) {
        edits.creationDate = new Date(editCreationDate);
      }

      if (geoLat && geoLon) {
        edits.location = {
          latitude: parseFloat(geoLat),
          longitude: parseFloat(geoLon),
          altitude: geoAlt ? parseFloat(geoAlt) : null,
        };
      }

      let sourceBlob: Blob;
      if (source.file) sourceBlob = source.file;
      else {
        const res = await fetch(source.url);
        sourceBlob = await res.blob();
      }

      const { blob, filename, sizeBytes } = await MetadataExport.write(sourceBlob, edits, 'lossless');
      const outUrl = URL.createObjectURL(blob);
      setExportedBlob(blob);
      setExportedBlobUrl(outUrl);
      setExportedFilename(filename);

      setStatusMessage(`Metadata updated losslessly! Export ready: ${filename} (${(sizeBytes / 1024 / 1024).toFixed(2)} MB)`);
      setStatusType('success');
      setActiveSubTab('export');
    } catch (err: any) {
      setStatusMessage(`Failed to apply metadata edits: ${err.message}`);
      setStatusType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyScrub = async (policy: ScrubPolicy) => {
    if (!source) return;
    setIsLoading(true);
    try {
      let sourceBlob: Blob;
      if (source.file) sourceBlob = source.file;
      else {
        const res = await fetch(source.url);
        sourceBlob = await res.blob();
      }

      const { blob, diff } = await MetadataPrivacy.scrub(sourceBlob, policy);
      setPrivacyDiff(diff);

      const baseName = source.name.replace(/\.[^/.]+$/, '');
      const ext = source.name.endsWith('.mov') ? '.mov' : '.mp4';
      const outName = `${baseName}_scrubbed_${policy}${ext}`;
      const outUrl = URL.createObjectURL(blob);
      setExportedBlob(blob);
      setExportedBlobUrl(outUrl);
      setExportedFilename(outName);

      setStatusMessage(`Privacy scrub (${policy}) applied losslessly! Ready for download.`);
      setStatusType('success');
    } catch (err: any) {
      setStatusMessage(`Scrub failed: ${err.message}`);
      setStatusType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearGPS = () => {
    setGeoLat('');
    setGeoLon('');
    setGeoAlt('');
    setStatusMessage('GPS coordinates cleared. Tap "Apply Changes" or Save to commit.');
    setStatusType('info');
  };

  const handleBatchUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newItems: BatchFileItem[] = Array.from(files).map((f) => ({
      id: `batch-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      file: f,
      status: 'pending',
    }));

    setBatchItems((prev) => [...prev, ...newItems]);
  };

  const handleProcessBatch = async () => {
    setIsLoading(true);
    for (let i = 0; i < batchItems.length; i++) {
      const item = batchItems[i];
      if (item.status === 'done') continue;

      setBatchItems((prev) =>
        prev.map((b) => (b.id === item.id ? { ...b, status: 'processing' } : b))
      );

      try {
        const edits: MetadataEdits = {
          tags: {
            copyright: editCopyright || undefined,
            artist: editArtist || undefined,
          },
        };
        const { blob, filename } = await MetadataExport.write(item.file, edits, 'lossless');
        setBatchItems((prev) =>
          prev.map((b) =>
            b.id === item.id
              ? { ...b, status: 'done', outputBlob: blob, outputName: filename }
              : b
          )
        );
      } catch (err: any) {
        setBatchItems((prev) =>
          prev.map((b) =>
            b.id === item.id
              ? { ...b, status: 'error', error: err.message || 'Unsupported format' }
              : b
          )
        );
      }
    }
    setIsLoading(false);
  };

  const subtabs: { id: MetadataSubTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'inspect', label: 'Inspect', icon: FileCheck },
    { id: 'edit', label: 'Edit Tags', icon: Tag },
    { id: 'geotag', label: 'Geotag & Map', icon: MapPin },
    { id: 'privacy', label: 'Privacy Scrub', icon: ShieldCheck },
    { id: 'batch', label: 'Batch Operations', icon: Layers },
    { id: 'export', label: 'Lossless Export', icon: Download },
  ];

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 text-slate-100 pb-24">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            Metadata & EXIF Studio
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
              Lossless Engine
            </span>
          </h1>
          <p className="text-xs text-slate-400">
            Privacy-First Container Tagging, QuickTime ISO 6709 Geolocation & Lossless Scrub
          </p>
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-slate-950 font-bold text-xs rounded-xl shadow-sm transition-all"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Import Video</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/quicktime,video/x-m4v"
          className="hidden"
          onChange={handleFileUpload}
        />
      </div>

      {/* Status Notice Banner */}
      {statusMessage && (
        <div
          className={`p-3 rounded-xl border flex items-center justify-between gap-2 text-xs font-medium ${
            statusType === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
              : statusType === 'warning'
              ? 'bg-amber-950/40 border-amber-500/30 text-amber-300'
              : statusType === 'error'
              ? 'bg-rose-950/40 border-rose-500/30 text-rose-300'
              : 'bg-cyan-950/40 border-cyan-500/30 text-cyan-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusType === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : statusType === 'error' ? (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            ) : (
              <Info className="w-4 h-4 shrink-0" />
            )}
            <span>{statusMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-white"
          >
            ×
          </button>
        </div>
      )}

      {/* Subtab Navigation */}
      <div className="flex overflow-x-auto p-1 bg-slate-900/90 rounded-xl border border-slate-800 gap-1 scrollbar-none">
        {subtabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* --- SUBTAB 1: INSPECT --- */}
      {activeSubTab === 'inspect' && (
        <div className="space-y-4">
          {source && metaRecord ? (
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <FileCheck className="w-3.5 h-3.5 text-cyan-400" />
                    Technical Container Properties (Read-Only)
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Derived directly from video streams and track headers
                  </p>
                </div>
                <span className="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20 uppercase">
                  {metaRecord.technical.container}
                </span>
              </div>

              {/* Technical Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-white/5">
                  <span className="text-[9px] text-slate-500 uppercase block">Duration</span>
                  <span className="text-slate-200 font-bold">{metaRecord.technical.durationSeconds.toFixed(1)}s</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-white/5">
                  <span className="text-[9px] text-slate-500 uppercase block">Resolution</span>
                  <span className="text-slate-200 font-bold">
                    {metaRecord.technical.width}×{metaRecord.technical.height}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-white/5">
                  <span className="text-[9px] text-slate-500 uppercase block">Rotation Matrix</span>
                  <span className="text-amber-400 font-bold">{metaRecord.technical.rotation}°</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-white/5">
                  <span className="text-[9px] text-slate-500 uppercase block">Video Codec</span>
                  <span className="text-emerald-400 font-bold truncate block">
                    {metaRecord.technical.codec}
                  </span>
                </div>
              </div>

              {/* User Metadata Tags Section */}
              <div className="pt-2 space-y-2 border-t border-slate-800">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5 text-cyan-400" />
                  User-Editable Metadata Tags
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-white/5 space-y-0.5">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Title</span>
                    <p className="text-slate-200 font-medium truncate">{metaRecord.tags.title || '— (No Title Tag)'}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-white/5 space-y-0.5">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Artist / Author</span>
                    <p className="text-slate-200 font-medium truncate">{metaRecord.tags.artist || '— (None)'}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-white/5 space-y-0.5">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Camera Make / Model</span>
                    <p className="text-slate-200 font-medium truncate">
                      {metaRecord.tags.make || metaRecord.tags.model
                        ? `${metaRecord.tags.make || ''} ${metaRecord.tags.model || ''}`.trim()
                        : '— (None)'}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-white/5 space-y-0.5">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Creation Timestamp</span>
                    <p className="text-slate-200 font-medium truncate">
                      {metaRecord.tags.creationDate ? String(metaRecord.tags.creationDate) : '— (None)'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Geolocation preview banner */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-cyan-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-white block">ISO 6709 Geolocation</span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {metaRecord.location
                        ? `${metaRecord.location.latitude.toFixed(4)}, ${metaRecord.location.longitude.toFixed(4)} (${geoUtils.toDMS(metaRecord.location.latitude, true)} ${geoUtils.toDMS(metaRecord.location.longitude, false)})`
                        : 'No GPS coordinates tagged in container.'}
                    </span>
                  </div>
                </div>
                {metaRecord.location && (
                  <button
                    type="button"
                    onClick={() => setActiveSubTab('geotag')}
                    className="px-2.5 py-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 rounded-lg border border-cyan-500/20 transition-colors"
                  >
                    View Map
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-2xl space-y-2">
              <Film className="w-8 h-8 mx-auto text-slate-600" />
              <p>No video selected for inspection.</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors"
              >
                Choose Local Video
              </button>
            </div>
          )}
        </div>
      )}

      {/* --- SUBTAB 2: EDIT TAGS --- */}
      {activeSubTab === 'edit' && (
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Tag className="w-3.5 h-3.5 text-cyan-400" />
                Edit Metadata Tags
              </h3>
              <p className="text-[11px] text-slate-400">
                100% Lossless — Audio and video sample data remain byte-for-byte untouched.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <label className="text-slate-300 font-medium">Title (©nam)</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="e.g. Cinematic Landscape"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-medium">Artist / Creator (©ART)</label>
              <input
                type="text"
                value={editArtist}
                onChange={(e) => setEditArtist(e.target.value)}
                placeholder="e.g. Jane Doe"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-medium">Camera Make (com.apple.quicktime.make)</label>
              <input
                type="text"
                value={editMake}
                onChange={(e) => setEditMake(e.target.value)}
                placeholder="e.g. Apple, Sony, Canon"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-medium">Camera Model (com.apple.quicktime.model)</label>
              <input
                type="text"
                value={editModel}
                onChange={(e) => setEditModel(e.target.value)}
                placeholder="e.g. iPhone 16 Pro"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-medium">Software / OS</label>
              <input
                type="text"
                value={editSoftware}
                onChange={(e) => setEditSoftware(e.target.value)}
                placeholder="e.g. iOS 18.1"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-medium">Lens Model</label>
              <input
                type="text"
                value={editLensModel}
                onChange={(e) => setEditLensModel(e.target.value)}
                placeholder="e.g. iPhone 16 Pro back camera 6.76mm f/1.78"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-slate-300 font-medium">Creation Date & Time</label>
              <input
                type="datetime-local"
                value={editCreationDate}
                onChange={(e) => setEditCreationDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              disabled={!source || isLoading}
              onClick={handleApplyEdits}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-bold text-xs rounded-xl shadow transition-all active:scale-95"
            >
              {isLoading ? 'Applying...' : 'Apply Lossless Edits'}
            </button>
          </div>
        </div>
      )}

      {/* --- SUBTAB 3: GEOTAG & MAP --- */}
      {activeSubTab === 'geotag' && (
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                QuickTime ISO 6709 Geolocation
              </h3>
              <p className="text-[11px] text-slate-400">
                View, modify, or strip geographic GPS coordinates without re-encoding video.
              </p>
            </div>
            <button
              type="button"
              onClick={handleClearGPS}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 text-xs font-semibold transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove GPS</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
            <div className="space-y-1">
              <label className="text-slate-300 font-sans font-medium">Latitude (-90 to 90)</label>
              <input
                type="number"
                step="0.0001"
                value={geoLat}
                onChange={(e) => setGeoLat(e.target.value)}
                placeholder="37.7749"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
              />
              <span className="text-[10px] text-slate-500 font-sans block">
                {geoLat ? geoUtils.toDMS(parseFloat(geoLat), true) : 'Degrees N/S'}
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-sans font-medium">Longitude (-180 to 180)</label>
              <input
                type="number"
                step="0.0001"
                value={geoLon}
                onChange={(e) => setGeoLon(e.target.value)}
                placeholder="-122.4194"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
              />
              <span className="text-[10px] text-slate-500 font-sans block">
                {geoLon ? geoUtils.toDMS(parseFloat(geoLon), false) : 'Degrees E/W'}
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-sans font-medium">Altitude (meters)</label>
              <input
                type="number"
                step="0.1"
                value={geoAlt}
                onChange={(e) => setGeoAlt(e.target.value)}
                placeholder="15.0"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
              />
              <span className="text-[10px] text-slate-500 font-sans block">
                {geoAlt ? `${geoAlt} m above sea level` : 'Optional'}
              </span>
            </div>
          </div>

          {/* ISO 6709 String Display */}
          {geoLat && geoLon && (
            <div className="p-3 rounded-xl bg-slate-950 border border-white/5 space-y-1 text-xs">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Standard QuickTime Atom Value:</span>
              <span className="text-cyan-400 font-mono font-bold">
                {geoUtils.formatISO6709(parseFloat(geoLat), parseFloat(geoLon), geoAlt ? parseFloat(geoAlt) : null)}
              </span>
            </div>
          )}

          {/* Map Preview Request */}
          <div className="pt-2">
            {!showMap ? (
              <button
                type="button"
                onClick={() => setShowMap(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition-colors"
              >
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                <span>Show Interactive Map (Loads OpenStreetMap Tiles on Request)</span>
              </button>
            ) : (
              <div className="rounded-xl overflow-hidden border border-slate-800 h-56 bg-slate-950 relative flex items-center justify-center">
                {geoLat && geoLon ? (
                  <iframe
                    title="Map Preview"
                    width="100%"
                    height="100%"
                    className="border-0"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(geoLon) - 0.02}%2C${parseFloat(geoLat) - 0.02}%2C${parseFloat(geoLon) + 0.02}%2C${parseFloat(geoLat) + 0.02}&layer=mapnik&marker=${parseFloat(geoLat)}%2C${parseFloat(geoLon)}`}
                  />
                ) : (
                  <span className="text-slate-500 text-xs">Enter valid latitude and longitude to render map</span>
                )}
              </div>
            )}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              disabled={!source || isLoading}
              onClick={handleApplyEdits}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl shadow transition-all active:scale-95"
            >
              Save Geotag Losslessly
            </button>
          </div>
        </div>
      )}

      {/* --- SUBTAB 4: PRIVACY SCRUB --- */}
      {activeSubTab === 'privacy' && (
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              Privacy & Metadata Scrub Presets
            </h3>
            <p className="text-[11px] text-slate-400">
              One-click privacy scrub presets with before/after audit verification.
            </p>
          </div>

          {/* Privacy Disclaimer Banner */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5 text-xs text-amber-300">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
            <div className="space-y-0.5 leading-relaxed">
              <span className="font-bold block">Privacy Safeguard Notice:</span>
              <p className="text-[11px] text-amber-200/80">
                Stripping container metadata removes GPS, device serials, and author tags from the file header.
                It does <strong>not</strong> remove burned-in timestamps, visual watermarks, or audio recordings of your voice.
              </p>
            </div>
          </div>

          {/* Scrub Preset Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              disabled={!source || isLoading}
              onClick={() => handleApplyScrub('gps-only')}
              className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/50 text-left transition-all group"
            >
              <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-2">
                <MapPin className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-white group-hover:text-cyan-300">GPS-Only Scrub</h4>
              <p className="text-[10px] text-slate-400 mt-1">
                Removes ISO 6709 coordinates and location tags. Preserves camera make/model and timestamps.
              </p>
            </button>

            <button
              type="button"
              disabled={!source || isLoading}
              onClick={() => handleApplyScrub('device-only')}
              className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/50 text-left transition-all group"
            >
              <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-2">
                <Camera className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-white group-hover:text-cyan-300">Device Scrub</h4>
              <p className="text-[10px] text-slate-400 mt-1">
                Removes camera make, model, lens details, and OS software tags. Keeps GPS and timestamps.
              </p>
            </button>

            <button
              type="button"
              disabled={!source || isLoading}
              onClick={() => handleApplyScrub('full')}
              className="p-3.5 rounded-xl bg-slate-950 border border-rose-500/30 hover:border-rose-500 text-left transition-all group"
            >
              <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center mb-2">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-white group-hover:text-rose-300">Full Metadata Scrub</h4>
              <p className="text-[10px] text-slate-400 mt-1">
                Strips all GPS, hardware, software, author tags, and normalizes timestamps to 1970.
              </p>
            </button>
          </div>

          {/* Audit Diff Table */}
          {privacyDiff && (
            <div className="p-3.5 rounded-xl bg-slate-950 border border-white/5 space-y-2">
              <h4 className="text-xs font-bold text-white">Before / After Scrub Audit Diff</h4>
              <div className="space-y-1.5 text-xs font-mono">
                {Object.entries(privacyDiff).map(([key, val]) => (
                  <div key={key} className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-white/5">
                    <span className="text-slate-400">{key}:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-rose-400 line-through">{val.before}</span>
                      <span>→</span>
                      <span className="text-emerald-400 font-bold">{val.after}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- SUBTAB 5: BATCH OPERATIONS --- */}
      {activeSubTab === 'batch' && (
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                Batch Metadata Editing
              </h3>
              <p className="text-[11px] text-slate-400">
                Apply copyright, author, or privacy scrub across multiple video files simultaneously.
              </p>
            </div>

            <button
              type="button"
              onClick={() => batchInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl transition-all"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Add Videos</span>
            </button>
            <input
              ref={batchInputRef}
              type="file"
              multiple
              accept="video/mp4,video/quicktime,video/x-m4v"
              className="hidden"
              onChange={handleBatchUpload}
            />
          </div>

          {/* Batch Items List */}
          <div className="space-y-2">
            {batchItems.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-slate-950 border border-white/5 flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0">
                  <p className="text-white font-medium truncate">{item.file.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {(item.file.size / 1024 / 1024).toFixed(1)} MB · Status: <span className="capitalize text-cyan-400">{item.status}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {item.status === 'done' && item.outputBlob && (
                    <a
                      href={URL.createObjectURL(item.outputBlob)}
                      download={item.outputName || 'exported.mp4'}
                      className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] rounded-lg shadow"
                    >
                      Download
                    </a>
                  )}
                  {item.status === 'error' && (
                    <span className="text-[10px] text-rose-400">{item.error}</span>
                  )}
                </div>
              </div>
            ))}

            {batchItems.length === 0 && (
              <div className="p-6 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                No batch files queued. Click "Add Videos" to queue multiple MP4/MOV files.
              </div>
            )}
          </div>

          {batchItems.length > 0 && (
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                disabled={isLoading}
                onClick={handleProcessBatch}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-bold text-xs rounded-xl shadow transition-all active:scale-95"
              >
                {isLoading ? 'Processing Batch...' : `Process All (${batchItems.length} files)`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* --- SUBTAB 6: LOSSLESS EXPORT --- */}
      {activeSubTab === 'export' && (
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                Lossless Container Export
              </h3>
              <p className="text-[11px] text-slate-400">
                100% Lossless — Generates valid MP4/MOV file with no video or audio re-encoding.
              </p>
            </div>
          </div>

          {exportedBlob && exportedBlobUrl ? (
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-white uppercase tracking-wider block">
                    Export Ready (Lossless Metadata Modified)
                  </span>
                  <p className="text-xs text-slate-300 font-mono truncate">
                    {exportedFilename} · {(exportedBlob.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap gap-2">
                <a
                  href={exportedBlobUrl}
                  download={exportedFilename}
                  className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Lossless Video ({ (exportedBlob.size / 1024 / 1024).toFixed(1) } MB)</span>
                </a>

                {onEnqueueLosslessExport && (
                  <button
                    type="button"
                    onClick={() => onEnqueueLosslessExport(exportedBlob, exportedFilename)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition-colors"
                  >
                    <span>Enqueue in Transcode Batch</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-2xl space-y-2">
              <FileCheck className="w-8 h-8 mx-auto text-slate-600" />
              <p>No export generated yet.</p>
              <p className="text-[11px] text-slate-600">
                Go to "Edit Tags", "Geotag", or "Privacy Scrub" and click Apply to generate a lossless export.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
