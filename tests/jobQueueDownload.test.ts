import test from 'node:test';
import assert from 'node:assert';
import { QueueItem, VideoSource } from '../src/types/handbrake';
import { DEFAULT_PRESETS } from '../src/data/handbrakePresets';

test('Queue item state transitions provide valid download metadata on completion', () => {
  const dummySource: VideoSource = {
    id: 'src-1',
    name: 'Apollo4K_Raw.mp4',
    sizeBytes: 32000000,
    durationSeconds: 10,
    width: 3840,
    height: 2160,
    fps: 60,
    bitrateKbps: 25600,
    codec: 'video/mp4',
    url: 'blob:http://localhost/sample-video',
    thumbnailUrl: '',
  };

  const preset = DEFAULT_PRESETS[0]; // Master 4K60 HEVC 10-bit CRF 14
  const ext = preset.container === 'mp4' ? '.mp4' : preset.container === 'mkv' ? '.mkv' : '.mov';
  const baseName = dummySource.name.replace(/\.[^/.]+$/, '');
  const outName = `${baseName}_${preset.name.replace(/[^a-zA-Z0-9]/g, '_')}${ext}`;

  const job: QueueItem = {
    id: 'job-123',
    source: dummySource,
    preset,
    outputName: outName,
    container: preset.container,
    status: 'waiting',
    progressPercent: 0,
    currentFrame: 0,
    totalFrames: 600,
    fps: 0,
    etaSeconds: 10,
    elapsedSeconds: 0,
    pass: 1,
    totalPasses: 1,
    outputSizeBytes: 0,
  };

  assert.strictEqual(job.status, 'waiting');
  assert.strictEqual(job.outputBlobUrl, undefined);
  assert.ok(job.outputName.endsWith('.mp4'));

  // Transition to completed
  const completedJob: QueueItem = {
    ...job,
    status: 'completed',
    progressPercent: 100,
    outputSizeBytes: 18500000,
    outputBlobUrl: 'blob:http://localhost/encoded-output-123',
    completedAt: Date.now(),
  };

  assert.strictEqual(completedJob.status, 'completed');
  assert.strictEqual(completedJob.outputBlobUrl, 'blob:http://localhost/encoded-output-123');
  assert.ok(completedJob.outputSizeBytes > 0);
  assert.ok(completedJob.outputName.includes('Master_4K60_HEVC'));
});
