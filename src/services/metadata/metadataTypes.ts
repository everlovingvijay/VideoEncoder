export interface MetadataLocation {
  latitude: number;
  longitude: number;
  altitude?: number | null;
}

export interface MetadataTags {
  title?: string;
  artist?: string;
  copyright?: string;
  make?: string;
  model?: string;
  software?: string;
  lensModel?: string;
  cameraIdentifier?: string;
  focalLength35mm?: string;
  fNumber?: string;
  horizontalAccuracy?: string;
  creationDate?: Date | string;
  modifyDate?: Date | string;
  description?: string;
  comment?: string;
}

export interface TechnicalMetadata {
  durationSeconds: number;
  width: number;
  height: number;
  rotation: 0 | 90 | 180 | 270;
  timescale: number;
  codec: string;
  compressorName?: string;
  container: 'mov' | 'mp4' | 'm4v' | 'webm' | 'mkv' | 'unknown';
  fileSizeBytes: number;
  majorBrand?: string;
  compatibleBrands?: string[];
  hasAudio: boolean;
  audioCodec?: string;
}

export type ScrubPolicy = 'gps-only' | 'device-only' | 'full' | 'custom';

export interface MetadataRecord {
  technical: TechnicalMetadata;
  tags: MetadataTags;
  location: MetadataLocation | null;
  hasC2PA: boolean;
  rawAtomStructure?: { type: string; size: number; offset: number }[];
}

export interface MetadataEdits {
  tags?: Partial<MetadataTags>;
  location?: MetadataLocation | null;
  rotation?: 0 | 90 | 180 | 270;
  creationDate?: Date;
  modifyDate?: Date;
  scrubGPS?: boolean;
  scrubDevice?: boolean;
  scrubAll?: boolean;
}

export interface MetadataValidationResult {
  valid: boolean;
  issues: string[];
  details: {
    atomCount: number;
    hasMoov: boolean;
    hasMdat: boolean;
    durationMatches: boolean;
    offsetsValid: boolean;
  };
}
