import test from 'node:test';
import assert from 'node:assert/strict';
import {
  kelvinToRgbMultipliers,
  buildCanvasCssFilter,
  DEFAULT_ENHANCEMENT,
  DEFAULT_DEVICE_PROFILE,
} from '../src/services/enhancementEngine';

test('kelvinToRgbMultipliers produces accurate color balance factors', () => {
  // Daylight 6500K
  const [d65R, d65G, d65B] = kelvinToRgbMultipliers(6500);
  assert.ok(d65R > 0.8 && d65R < 1.2);
  assert.ok(d65G > 0.8 && d65G < 1.2);
  assert.ok(d65B > 0.8 && d65B < 1.2);

  // Warm candlelight 2500K -> Red higher than Blue
  const [warmR, , warmB] = kelvinToRgbMultipliers(2500);
  assert.ok(warmR > warmB, '2500K red channel must be greater than blue');

  // Cool sky 9000K -> Blue higher than Red
  const [coolR, , coolB] = kelvinToRgbMultipliers(9000);
  assert.ok(coolB > coolR, '9000K blue channel must be greater than red');
});

test('buildCanvasCssFilter formats CSS string and reflects sliders', () => {
  // Default values should result in 'none'
  const defaultFilter = buildCanvasCssFilter(DEFAULT_ENHANCEMENT, DEFAULT_DEVICE_PROFILE);
  assert.equal(defaultFilter, 'none');

  // Modified brightness & contrast
  const customFilter = buildCanvasCssFilter(
    { ...DEFAULT_ENHANCEMENT, brightness: 70, contrast: 80, saturation: 120 },
    DEFAULT_DEVICE_PROFILE
  );
  assert.ok(customFilter.includes('brightness('));
  assert.ok(customFilter.includes('contrast('));
  assert.ok(customFilter.includes('saturate('));

  // Device profile simulation adjustment
  const phoneProfile = buildCanvasCssFilter(
    DEFAULT_ENHANCEMENT,
    { profile: 'high-quality-android', intensity: 100 }
  );
  assert.ok(phoneProfile.includes('contrast('));
  assert.ok(phoneProfile.includes('saturate('));
});
