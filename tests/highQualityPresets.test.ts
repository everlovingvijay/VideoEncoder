import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_PRESETS } from '../src/data/handbrakePresets';

test('High Quality Presets are divided into two distinct professional tiers', () => {
  // Check Tier 1: Master Archival
  const masterPresets = DEFAULT_PRESETS.filter(
    (p) => p.category === 'Master Archival (High Quality)'
  );
  assert.ok(masterPresets.length >= 3, 'Must contain at least 3 Master Archival presets');

  const master4k = masterPresets.find((p) => p.name.includes('Master 4K60'));
  assert.ok(master4k, 'Must include Master 4K60 HEVC 10-bit');
  assert.equal(master4k.video.qualityMode, 'rf');
  assert.equal(master4k.video.rfValue, 14, 'Master 4K must have near-lossless CRF 14');
  assert.equal(master4k.dimensions.width, 3840);
  assert.equal(master4k.dimensions.height, 2160);
  assert.equal(master4k.video.tenBitColor, true);

  const master1080p = masterPresets.find((p) => p.name.includes('Master 1080p60'));
  assert.ok(master1080p, 'Must include Master 1080p60 AVC Pristine');
  assert.equal(master1080p.video.rfValue, 16);

  // Check Tier 2: Web & Streaming High Quality
  const webPresets = DEFAULT_PRESETS.filter(
    (p) => p.category === 'Web & Streaming (High Quality)'
  );
  assert.ok(webPresets.length >= 3, 'Must contain at least 3 Web & Streaming presets');

  const web1080p = webPresets.find((p) => p.name.includes('Web 1080p60 Ultra Stream'));
  assert.ok(web1080p, 'Must include Web 1080p60 Ultra Stream');
  assert.equal(web1080p.video.rfValue, 18, 'Web stream must have optimized CRF 18');
  assert.equal(web1080p.video.framerate, 60);

  const socialReel = webPresets.find((p) => p.name.includes('Social 9:16 High-Bitrate Reel'));
  assert.ok(socialReel, 'Must include Social 9:16 High-Bitrate Reel');
  assert.equal(socialReel.dimensions.width, 1080);
  assert.equal(socialReel.dimensions.height, 1920);
});
