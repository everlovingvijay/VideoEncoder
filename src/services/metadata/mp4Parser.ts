import { geoUtils } from './geoUtils';
import { MetadataLocation, MetadataTags, TechnicalMetadata, MetadataRecord, MetadataEdits } from './metadataTypes';

// Mac/QuickTime epoch offset (Jan 1, 1904 to Jan 1, 1970 UTC in seconds)
const MAC_EPOCH_OFFSET = 2082844800;

export interface TopLevelBox {
  type: string;
  offset: number;
  size: number;
  headerSize: number;
  isC2PA?: boolean;
}

export interface ParsedBox {
  type: string;
  offset: number;
  size: number;
  headerSize: number;
  payloadOffset: number;
  payloadSize: number;
}

export class MP4ParserService {
  private readUint32(view: DataView, offset: number): number {
    return view.getUint32(offset, false);
  }

  private readUint64(view: DataView, offset: number): bigint {
    const high = view.getUint32(offset, false);
    const low = view.getUint32(offset + 4, false);
    return (BigInt(high) << 32n) + BigInt(low);
  }

  private readASCII(view: DataView, offset: number, length: number): string {
    let str = '';
    for (let i = 0; i < length; i++) {
      str += String.fromCharCode(view.getUint8(offset + i));
    }
    return str;
  }

  private writeUint32(view: DataView, offset: number, value: number) {
    view.setUint32(offset, value >>> 0, false);
  }

  private writeASCII(view: DataView, offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  public macSecondsToDate(seconds: number | bigint): Date | null {
    if (!seconds || Number(seconds) <= 0) return null;
    const unixSeconds = Number(seconds) - MAC_EPOCH_OFFSET;
    return new Date(unixSeconds * 1000);
  }

  public dateToMacSeconds(date?: Date | string | null): number {
    if (!date) return 0;
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return 0;
    const unixSeconds = Math.floor(d.getTime() / 1000);
    return unixSeconds + MAC_EPOCH_OFFSET;
  }

  public async readFileSlice(file: File | Blob, start: number, end: number): Promise<ArrayBuffer> {
    const slice = file.slice(start, end);
    return await slice.arrayBuffer();
  }

  public async scanTopLevelBoxes(file: File | Blob): Promise<TopLevelBox[]> {
    const boxes: TopLevelBox[] = [];
    let offset = 0;
    const fileSize = file.size;

    while (offset < fileSize) {
      const headerLen = Math.min(16, fileSize - offset);
      if (headerLen < 8) break;

      const buf = await this.readFileSlice(file, offset, offset + headerLen);
      const view = new DataView(buf);
      let size = this.readUint32(view, 0);
      const type = this.readASCII(view, 4, 4);
      let headerSize = 8;

      if (size === 1) {
        if (headerLen < 16) break;
        size = Number(this.readUint64(view, 8));
        headerSize = 16;
      } else if (size === 0) {
        size = fileSize - offset;
      }

      let isC2PA = false;
      if (type === 'c2pa') {
        isC2PA = true;
      } else if (type === 'uuid' && offset + headerSize + 16 <= fileSize) {
        const uuidBuf = await this.readFileSlice(file, offset + headerSize, offset + headerSize + 16);
        const u8 = new Uint8Array(uuidBuf);
        // C2PA UUID: d8fec3d3-1a3b-4834-9216-b5d43c2b1ff8
        const C2PA_UUID = [0xd8, 0xfe, 0xc3, 0xd3, 0x1a, 0x3b, 0x48, 0x34, 0x92, 0x16, 0xb5, 0xd4, 0x3c, 0x2b, 0x1f, 0xf8];
        if (u8.length >= 16 && C2PA_UUID.every((b, i) => u8[i] === b)) {
          isC2PA = true;
        }
      }

      boxes.push({ type, offset, size, headerSize, isC2PA });
      if (size <= 0) break;
      offset += size;
    }

    return boxes;
  }

  public parseBoxTree(buffer: ArrayBuffer, startOffset = 0, length = buffer.byteLength): ParsedBox[] {
    const boxes: ParsedBox[] = [];
    const view = new DataView(buffer);
    let offset = startOffset;
    const end = startOffset + length;

    while (offset + 8 <= end) {
      let size = this.readUint32(view, offset);
      const type = this.readASCII(view, offset + 4, 4);
      let headerSize = 8;

      if (size === 1) {
        if (offset + 16 > end) break;
        size = Number(this.readUint64(view, offset + 8));
        headerSize = 16;
      } else if (size === 0) {
        size = end - offset;
      }

      if (size < headerSize || offset + size > end) break;

      const payloadOffset = offset + headerSize;
      const payloadSize = size - headerSize;

      boxes.push({ type, offset, size, headerSize, payloadOffset, payloadSize });
      offset += size;
    }

    return boxes;
  }

  public extractMoovMetadata(moovBuffer: ArrayBuffer, moovBox: TopLevelBox): MetadataRecord {
    const view = new DataView(moovBuffer);
    const children = this.parseBoxTree(moovBuffer, moovBox.headerSize, moovBox.size - moovBox.headerSize);

    let durationSeconds = 0;
    let timescale = 1000;
    let width = 0;
    let height = 0;
    let rotation: 0 | 90 | 180 | 270 = 0;
    let codec = 'H.264 / AVC';
    let compressorName = 'AVC';
    let hasAudio = false;
    let audioCodec: string | undefined = undefined;

    const tags: MetadataTags = {};
    let location: MetadataLocation | null = null;

    // 1. mvhd (Movie Header Box)
    const mvhd = children.find((b) => b.type === 'mvhd');
    if (mvhd) {
      const version = view.getUint8(mvhd.payloadOffset);
      let cTime = 0;
      let mTime = 0;
      let tScale = 1000;
      let dur = 0;

      if (version === 1) {
        cTime = Number(this.readUint64(view, mvhd.payloadOffset + 4));
        mTime = Number(this.readUint64(view, mvhd.payloadOffset + 12));
        tScale = this.readUint32(view, mvhd.payloadOffset + 20);
        dur = Number(this.readUint64(view, mvhd.payloadOffset + 24));
      } else {
        cTime = this.readUint32(view, mvhd.payloadOffset + 4);
        mTime = this.readUint32(view, mvhd.payloadOffset + 8);
        tScale = this.readUint32(view, mvhd.payloadOffset + 12);
        dur = this.readUint32(view, mvhd.payloadOffset + 16);
      }

      timescale = tScale || 1000;
      durationSeconds = dur > 0 && timescale > 0 ? dur / timescale : 0;
      const creationDate = this.macSecondsToDate(cTime);
      const modifyDate = this.macSecondsToDate(mTime);
      if (creationDate) tags.creationDate = creationDate;
      if (modifyDate) tags.modifyDate = modifyDate;
    }

    // 2. trak (Tracks)
    const traks = children.filter((b) => b.type === 'trak');
    for (const trak of traks) {
      const trakChildren = this.parseBoxTree(moovBuffer, trak.payloadOffset, trak.payloadSize);
      const tkhd = trakChildren.find((b) => b.type === 'tkhd');
      const mdia = trakChildren.find((b) => b.type === 'mdia');

      let isVideo = false;
      let rawW = 0;
      let rawH = 0;
      let rot: 0 | 90 | 180 | 270 = 0;

      if (tkhd) {
        const v = view.getUint8(tkhd.payloadOffset);
        const matrixOffset = tkhd.payloadOffset + (v === 1 ? 44 : 36);
        const wOffset = matrixOffset + 36;
        const hOffset = wOffset + 4;

        rawW = this.readUint32(view, wOffset) >> 16;
        rawH = this.readUint32(view, hOffset) >> 16;

        const a = view.getInt32(matrixOffset, false) / 65536;
        const b = view.getInt32(matrixOffset + 4, false) / 65536;
        const c = view.getInt32(matrixOffset + 12, false) / 65536;
        const d = view.getInt32(matrixOffset + 16, false) / 65536;

        if (a === 0 && b === 1 && c === -1 && d === 0) rot = 90;
        else if (a === -1 && b === 0 && c === 0 && d === -1) rot = 180;
        else if (a === 0 && b === -1 && c === 1 && d === 0) rot = 270;
        else rot = 0;
      }

      if (mdia) {
        const mdiaChildren = this.parseBoxTree(moovBuffer, mdia.payloadOffset, mdia.payloadSize);
        const hdlr = mdiaChildren.find((b) => b.type === 'hdlr');
        if (hdlr) {
          const hType = this.readASCII(view, hdlr.payloadOffset + 8, 4);
          if (hType === 'vide') isVideo = true;
          if (hType === 'soun') {
            hasAudio = true;
            audioCodec = 'AAC / CoreAudio';
          }
        }

        const minf = mdiaChildren.find((b) => b.type === 'minf');
        if (minf) {
          const minfChildren = this.parseBoxTree(moovBuffer, minf.payloadOffset, minf.payloadSize);
          const stbl = minfChildren.find((b) => b.type === 'stbl');
          if (stbl) {
            const stblChildren = this.parseBoxTree(moovBuffer, stbl.payloadOffset, stbl.payloadSize);
            const stsd = stblChildren.find((b) => b.type === 'stsd');
            if (stsd && stsd.payloadSize >= 16) {
              const entryType = this.readASCII(view, stsd.payloadOffset + 12, 4);
              if (isVideo) {
                codec = entryType;
                if (entryType === 'hvc1' || entryType === 'hev1') compressorName = 'HEVC 10-bit';
                else if (entryType === 'avc1') compressorName = 'H.264 / AVC';
                else if (entryType === 'vp09') compressorName = 'VP9';
                else if (entryType === 'av01') compressorName = 'AV1';
                else compressorName = entryType.toUpperCase();
              } else {
                audioCodec = entryType.toUpperCase();
              }
            }
          }
        }
      }

      if (isVideo && width === 0 && rawW > 0 && rawH > 0) {
        width = rot === 90 || rot === 270 ? rawH : rawW;
        height = rot === 90 || rot === 270 ? rawW : rawH;
        rotation = rot;
      }
    }

    // 3. udta (User Data Box)
    const udta = children.find((b) => b.type === 'udta');
    if (udta) {
      const udtaChildren = this.parseBoxTree(moovBuffer, udta.payloadOffset, udta.payloadSize);

      // ©xyz (ISO 6709 coordinates)
      const xyz = udtaChildren.find((b) => b.type === '©xyz');
      if (xyz && xyz.payloadSize > 2) {
        const rawStr = this.readASCII(view, xyz.payloadOffset + 2, xyz.payloadSize - 2);
        location = geoUtils.parseISO6709(rawStr);
      }

      // QuickTime / iTunes ilst metadata
      const meta = udtaChildren.find((b) => b.type === 'meta');
      if (meta) {
        this.parseMetaBoxIntoTags(moovBuffer, meta, tags);
      }
    }

    // 4. moov.meta (top-level QuickTime keys)
    const metaBoxes = children.filter((b) => b.type === 'meta');
    for (const mb of metaBoxes) {
      this.parseMetaBoxIntoTags(moovBuffer, mb, tags);
    }

    return {
      technical: {
        durationSeconds: Math.round(durationSeconds * 10) / 10,
        width: width || 1920,
        height: height || 1080,
        rotation,
        timescale,
        codec,
        compressorName,
        container: 'mp4',
        fileSizeBytes: moovBuffer.byteLength,
        hasAudio,
        audioCodec,
      },
      tags,
      location,
      hasC2PA: false,
    };
  }

  private parseMetaBoxIntoTags(buffer: ArrayBuffer, metaBox: ParsedBox, tags: MetadataTags) {
    const view = new DataView(buffer);
    const hdlrOffset = metaBox.payloadOffset + 4;
    const isFullBox = metaBox.payloadSize >= 4 && view.getUint8(metaBox.payloadOffset) === 0;
    const startPayload = isFullBox ? metaBox.payloadOffset + 4 : metaBox.payloadOffset;
    const payloadLength = metaBox.size - (startPayload - metaBox.offset);

    const children = this.parseBoxTree(buffer, startPayload, payloadLength);
    const ilst = children.find((b) => b.type === 'ilst');
    if (ilst) {
      const ilstChildren = this.parseBoxTree(buffer, ilst.payloadOffset, ilst.payloadSize);
      for (const item of ilstChildren) {
        const dataBox = this.parseBoxTree(buffer, item.payloadOffset, item.payloadSize).find((b) => b.type === 'data');
        if (dataBox && dataBox.payloadSize >= 8) {
          const text = this.readASCII(view, dataBox.payloadOffset + 8, dataBox.payloadSize - 8);
          switch (item.type) {
            case '©nam': tags.title = text; break;
            case '©ART': tags.artist = text; break;
            case 'cprt': tags.copyright = text; break;
            case '©day': tags.creationDate = text; break;
            case '©des': tags.description = text; break;
            case '©cmt': tags.comment = text; break;
          }
        }
      }
    }
  }

  /**
   * Reads metadata from a file or blob
   */
  public async readMetadata(file: File | Blob): Promise<MetadataRecord> {
    const boxes = await this.scanTopLevelBoxes(file);
    const moov = boxes.find((b) => b.type === 'moov');
    const ftyp = boxes.find((b) => b.type === 'ftyp');
    const hasC2PA = boxes.some((b) => b.isC2PA);

    let container: TechnicalMetadata['container'] = 'mp4';
    if (ftyp) {
      const ftypBuf = await this.readFileSlice(file, ftyp.offset, ftyp.offset + ftyp.size);
      const dv = new DataView(ftypBuf);
      const major = this.readASCII(dv, 8, 4);
      if (major === 'qt  ') container = 'mov';
      else if (major.startsWith('mp4') || major.startsWith('isom')) container = 'mp4';
      else if (major.startsWith('M4V')) container = 'm4v';
    }

    if (!moov) {
      return {
        technical: {
          durationSeconds: 0,
          width: 0,
          height: 0,
          rotation: 0,
          timescale: 1000,
          codec: 'Unknown',
          container,
          fileSizeBytes: file.size,
          hasAudio: false,
        },
        tags: {},
        location: null,
        hasC2PA,
      };
    }

    const moovBuf = await this.readFileSlice(file, moov.offset, moov.offset + moov.size);
    const record = this.extractMoovMetadata(moovBuf, moov);
    record.technical.container = container;
    record.technical.fileSizeBytes = file.size;
    record.hasC2PA = hasC2PA;
    record.rawAtomStructure = boxes.map((b) => ({ type: b.type, size: b.size, offset: b.offset }));
    return record;
  }

  /**
   * Applies metadata edits to an MP4/MOV container losslessly (0 re-encoding, stream slicing)
   */
  public async writeMetadata(file: File | Blob, edits: MetadataEdits): Promise<Blob> {
    const boxes = await this.scanTopLevelBoxes(file);
    const moovBox = boxes.find((b) => b.type === 'moov');
    if (!moovBox) {
      throw new Error('No moov box found in container');
    }

    const moovBuf = await this.readFileSlice(file, moovBox.offset, moovBox.offset + moovBox.size);
    const newMoovBytes = new Uint8Array(moovBuf);
    const view = new DataView(newMoovBytes.buffer);

    // Apply rotation update if provided
    if (edits.rotation !== undefined) {
      const children = this.parseBoxTree(newMoovBytes.buffer, moovBox.headerSize, moovBox.size - moovBox.headerSize);
      const traks = children.filter((b) => b.type === 'trak');
      for (const trak of traks) {
        const trakChildren = this.parseBoxTree(newMoovBytes.buffer, trak.payloadOffset, trak.payloadSize);
        const tkhd = trakChildren.find((b) => b.type === 'tkhd');
        if (tkhd) {
          const v = view.getUint8(tkhd.payloadOffset);
          const matrixOffset = tkhd.payloadOffset + (v === 1 ? 44 : 36);
          // Set 3x3 identity or rotated matrix (16.16 fixed-point)
          let a = 0x00010000; let b = 0; let c = 0; let d = 0x00010000;
          if (edits.rotation === 90) { a = 0; b = 0x00010000; c = -0x00010000; d = 0; }
          else if (edits.rotation === 180) { a = -0x00010000; b = 0; c = 0; d = -0x00010000; }
          else if (edits.rotation === 270) { a = 0; b = -0x00010000; c = 0x00010000; d = 0; }

          view.setInt32(matrixOffset, a, false);
          view.setInt32(matrixOffset + 4, b, false);
          view.setInt32(matrixOffset + 12, c, false);
          view.setInt32(matrixOffset + 16, d, false);
        }
      }
    }

    // Apply creationDate / modifyDate if provided
    if (edits.creationDate || edits.modifyDate) {
      const children = this.parseBoxTree(newMoovBytes.buffer, moovBox.headerSize, moovBox.size - moovBox.headerSize);
      const mvhd = children.find((b) => b.type === 'mvhd');
      if (mvhd) {
        const v = view.getUint8(mvhd.payloadOffset);
        if (v === 0) {
          if (edits.creationDate) {
            this.writeUint32(view, mvhd.payloadOffset + 4, this.dateToMacSeconds(edits.creationDate));
          }
          if (edits.modifyDate) {
            this.writeUint32(view, mvhd.payloadOffset + 8, this.dateToMacSeconds(edits.modifyDate));
          }
        }
      }
    }

    // Assemble file slices losslessly:
    // Slices before moov + newMoovBytes + slices after moov
    const slices: BlobPart[] = [];
    if (moovBox.offset > 0) {
      slices.push(file.slice(0, moovBox.offset));
    }
    slices.push(newMoovBytes);
    const afterMoovOffset = moovBox.offset + moovBox.size;
    if (afterMoovOffset < file.size) {
      slices.push(file.slice(afterMoovOffset));
    }

    const outType = file.type || 'video/mp4';
    return new Blob(slices, { type: outType });
  }
}

export const mp4Parser = new MP4ParserService();
