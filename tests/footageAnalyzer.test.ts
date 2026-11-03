import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeFootage, computeUpscaleOptions } from '../src/services/footageAnalyzer';
import { VideoSource } from '../src/types/handbrake';

test('FootageAnalyzer detects orientation and recommends appropriate presets', () => {
  // Test Landscape source
  const landscapeSource: VideoSource = {
    id: 'test-landscape',
    name: 'test.mp4',
    sizeBytes: 5000000,
    durationSeconds: 10,
    width: 1920,
    height: 1080,
    fps: 30,
    bitrateKbps: 4000,
    codec: 'H.264',
    url: '',
    thumbnailUrl: '',
  };

  const landscapeAnalysis = analyzeFootage(landscapeSource);
  assert.equal(landscapeAnalysis.orientation, 'landscape');
  assert.equal(landscapeAnalysis.width, 1920);
  assert.equal(landscapeAnalysis.height, 1080);
  assert.ok(landscapeAnalysis.recommendedPreset.length > 0);

  // Test Portrait source (9:16 vertical video)
  const portraitSource: VideoSource = {
    id: 'test-portrait',
    name: 'vertical.mp4',
    sizeBytes: 4000000,
    durationSeconds: 10,
    width: 1080,
    height: 1920,
    fps: 60,
    bitrateKbps: 5000,
    codec: 'H.264',
    url: '',
    thumbnailUrl: '',
  };

  const portraitAnalysis = analyzeFootage(portraitSource);
  assert.equal(portraitAnalysis.orientation, 'portrait');
  assert.equal(portraitAnalysis.recommendedPreset, 'Social Media Optimized');

  // Test Low Resolution / Highly Compressed source
  const lowResSource: VideoSource = {
    id: 'test-lowres',
    name: 'lowres.mp4',
    sizeBytes: 500000,
    durationSeconds: 10,
    width: 640,
    height: 360,
    fps: 24,
    bitrateKbps: 400,
    codec: 'H.264',
    url: '',
    thumbnailUrl: '',
  };

  const lowResAnalysis = analyzeFootage(lowResSource);
  assert.equal(lowResAnalysis.recommendedPreset, 'Low Quality Footage Recovery');
});

test('computeUpscaleOptions calculates correct resolutions for landscape and portrait', () => {
  // Landscape upscale options
  const landscapeOptions = computeUpscaleOptions(1920, 1080);
  assert.ok(landscapeOptions.length > 0);
  const l2x = landscapeOptions.find((o) => o.factor === '2x');
  assert.ok(l2x);
  assert.equal(l2x.width, 3840);
  assert.equal(l2x.height, 2160);

  // Portrait upscale options
  const portraitOptions = computeUpscaleOptions(1080, 1920);
  assert.ok(portraitOptions.length > 0);
  const p1080 = portraitOptions.find((o) => o.factor === '1080p');
  assert.ok(p1080);
  assert.equal(p1080.width, 1080);
  assert.equal(p1080.height, 1920);
});
