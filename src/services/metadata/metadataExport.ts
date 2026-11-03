import { mp4Parser } from './mp4Parser';
import { MetadataEdits } from './metadataTypes';

export class MetadataExportService {
  /**
   * Generates exported file blob with metadata applied.
   */
  public async write(
    file: File | Blob,
    edits: MetadataEdits,
    mode: 'lossless' | 'transcode' = 'lossless'
  ): Promise<{ blob: Blob; filename: string; sizeBytes: number }> {
    const outputBlob = await mp4Parser.writeMetadata(file, edits);
    const originalName = file instanceof File ? file.name : 'video.mp4';
    const baseName = originalName.replace(/\.[^/.]+$/, '');
    const ext = originalName.endsWith('.mov') ? '.mov' : '.mp4';
    const tagSuffix = mode === 'lossless' ? '_metadata' : '_encoded';
    const filename = `${baseName}${tagSuffix}${ext}`;

    return {
      blob: outputBlob,
      filename,
      sizeBytes: outputBlob.size,
    };
  }
}

export const MetadataExport = new MetadataExportService();
