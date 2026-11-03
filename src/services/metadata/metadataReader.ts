import { mp4Parser } from './mp4Parser';
import { MetadataRecord } from './metadataTypes';

export class MetadataReaderService {
  /**
   * Reads metadata and atom structure from an MP4/MOV/M4V file without reading full sample data.
   */
  public async read(file: File | Blob): Promise<MetadataRecord> {
    return await mp4Parser.readMetadata(file);
  }
}

export const MetadataReader = new MetadataReaderService();
