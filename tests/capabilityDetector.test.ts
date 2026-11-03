import test from 'node:test';
import assert from 'node:assert/strict';
import { capabilityDetector } from '../src/services/capabilityDetector';

test('CapabilityDetector resolves MIME types and handles fallback gracefully', () => {
  const caps = capabilityDetector.detectCapabilities();
  assert.ok(caps !== null);
  assert.ok(Array.isArray(caps.supportedContainers));

  // Test MP4 resolution
  const mp4Res = capabilityDetector.resolveOptimalMimeType('H.264 (VideoToolbox / AVC)', 'mp4');
  assert.ok(typeof mp4Res.mimeType === 'string');
  assert.ok(mp4Res.mimeType.length > 0);

  // Test WebM resolution
  const webmRes = capabilityDetector.resolveOptimalMimeType('VP9', 'webm');
  assert.ok(typeof webmRes.mimeType === 'string');
  assert.ok(webmRes.mimeType.length > 0);

  // Validate configuration check
  const val = capabilityDetector.validateConfiguration('H.264 (VideoToolbox / AVC)', 'mp4');
  assert.ok(typeof val.valid === 'boolean');
});
