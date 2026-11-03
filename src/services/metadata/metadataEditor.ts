import { mp4Parser } from './mp4Parser';
import { MetadataEdits, MetadataRecord } from './metadataTypes';

export class MetadataEditorService {
  /**
   * Applies metadata edits to an MP4/MOV container losslessly (0 video re-encoding).
   */
  public async apply(
    file: File | Blob,
    edits: MetadataEdits
  ): Promise<{ blob: Blob; updatedMeta: MetadataRecord }> {
    const updatedBlob = await mp4Parser.writeMetadata(file, edits);
    const updatedMeta = await mp4Parser.readMetadata(updatedBlob);
    return {
      blob: updatedBlob,
      updatedMeta,
    };
  }
}

export const MetadataEditor = new MetadataEditorService();
