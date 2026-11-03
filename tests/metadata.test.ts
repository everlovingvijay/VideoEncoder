import test from 'node:test';
import assert from 'node:assert';
import { geoUtils } from '../src/services/metadata/geoUtils';
import { MetadataValidator } from '../src/services/metadata/metadataValidator';
import { MetadataPrivacy } from '../src/services/metadata/metadataPrivacy';
import { MetadataExport } from '../src/services/metadata/metadataExport';
import { mp4Parser } from '../src/services/metadata/mp4Parser';

test('GeoUtils accurately parses and formats ISO 6709 coordinates', () => {
  const parsed = geoUtils.parseISO6709('+37.7749-122.4194+015.000/');
  assert.ok(parsed !== null);
  assert.ok(Math.abs(parsed.latitude - 37.7749) < 0.0001);
  assert.ok(Math.abs(parsed.longitude - (-122.4194)) < 0.0001);
  assert.ok(Math.abs((parsed.altitude || 0) - 15.0) < 0.0001);

  const formatted = geoUtils.formatISO6709(37.7749, -122.4194, 15.0);
  assert.ok(formatted.startsWith('+37.7749-122.4194'));
  assert.ok(formatted.endsWith('/'));

  const dmsLat = geoUtils.toDMS(37.7749, true);
  assert.ok(dmsLat.includes('37°') && dmsLat.includes('N'));

  const xmp = geoUtils.toXMPGPS(37.7749, -122.4194, 15.0);
  assert.ok(xmp !== null);
  assert.strictEqual(xmp.latitudeRef, 'N');
  assert.strictEqual(xmp.longitudeRef, 'W');
});

test('MP4Parser handles synthetic ISO BMFF box scan and metadata', async () => {
  // Construct a minimal valid MP4 container (ftyp + moov + mdat)
  function createBox(type: string, payload: Uint8Array): Uint8Array {
    const size = 8 + payload.length;
    const buf = new Uint8Array(size);
    const dv = new DataView(buf.buffer);
    dv.setUint32(0, size, false);
    for (let i = 0; i < 4; i++) {
      dv.setUint8(4 + i, type.charCodeAt(i));
    }
    buf.set(payload, 8);
    return buf;
  }

  // 1. ftyp box
  const ftypPayload = new Uint8Array(8);
  const ftypDv = new DataView(ftypPayload.buffer);
  ftypDv.setUint8(0, 'm'.charCodeAt(0));
  ftypDv.setUint8(1, 'p'.charCodeAt(0));
  ftypDv.setUint8(2, '4'.charCodeAt(0));
  ftypDv.setUint8(3, '2'.charCodeAt(0));
  const ftypBox = createBox('ftyp', ftypPayload);

  // 2. mvhd box inside moov
  const mvhdPayload = new Uint8Array(100);
  const mvhdDv = new DataView(mvhdPayload.buffer);
  mvhdDv.setUint8(0, 0); // version 0
  mvhdDv.setUint32(4, 3800000000, false); // creation time
  mvhdDv.setUint32(8, 3800000000, false); // modify time
  mvhdDv.setUint32(12, 1000, false); // timescale 1000
  mvhdDv.setUint32(16, 5000, false); // duration 5000 (5.0s)
  const mvhdBox = createBox('mvhd', mvhdPayload);

  // moov box
  const moovBox = createBox('moov', mvhdBox);

  // mdat box
  const mdatBox = createBox('mdat', new Uint8Array(64));

  // Combine into single buffer
  const totalLength = ftypBox.length + moovBox.length + mdatBox.length;
  const container = new Uint8Array(totalLength);
  container.set(ftypBox, 0);
  container.set(moovBox, ftypBox.length);
  container.set(mdatBox, ftypBox.length + moovBox.length);

  const blob = new Blob([container], { type: 'video/mp4' });

  // Scan boxes
  const boxes = await mp4Parser.scanTopLevelBoxes(blob);
  assert.strictEqual(boxes.length, 3);
  assert.strictEqual(boxes[0].type, 'ftyp');
  assert.strictEqual(boxes[1].type, 'moov');
  assert.strictEqual(boxes[2].type, 'mdat');

  // Read metadata
  const meta = await mp4Parser.readMetadata(blob);
  assert.strictEqual(meta.technical.durationSeconds, 5);
  assert.strictEqual(meta.technical.timescale, 1000);

  // Validate container
  const val = await MetadataValidator.verify(blob);
  assert.strictEqual(val.valid, true);
  assert.strictEqual(val.details.hasMoov, true);
  assert.strictEqual(val.details.hasMdat, true);
});

test('MetadataPrivacy produces audit diff and applies lossless scrub', async () => {
  // Construct minimal test blob
  function createBox(type: string, payload: Uint8Array): Uint8Array {
    const size = 8 + payload.length;
    const buf = new Uint8Array(size);
    const dv = new DataView(buf.buffer);
    dv.setUint32(0, size, false);
    for (let i = 0; i < 4; i++) dv.setUint8(4 + i, type.charCodeAt(i));
    buf.set(payload, 8);
    return buf;
  }

  const ftyp = createBox('ftyp', new Uint8Array(8));
  const mvhd = createBox('mvhd', new Uint8Array(100));
  const moov = createBox('moov', mvhd);
  const mdat = createBox('mdat', new Uint8Array(32));

  const total = new Uint8Array(ftyp.length + moov.length + mdat.length);
  total.set(ftyp, 0);
  total.set(moov, ftyp.length);
  total.set(mdat, ftyp.length + moov.length);

  const file = new Blob([total], { type: 'video/mp4' });

  const { blob, diff } = await MetadataPrivacy.scrub(file, 'full');
  assert.ok(blob.size > 0);
  assert.ok(diff['GPS Location'] !== undefined);
  assert.ok(diff['Device & Software'] !== undefined);

  const exportResult = await MetadataExport.write(file, { rotation: 90 }, 'lossless');
  assert.ok(exportResult.filename.includes('_metadata.mp4'));
  assert.ok(exportResult.sizeBytes > 0);
});
