import { MetadataReader } from './metadataReader';
import { MetadataEditor } from './metadataEditor';
import { ScrubPolicy, MetadataEdits } from './metadataTypes';

export class MetadataPrivacyService {
  /**
   * Scrubs sensitive metadata according to policy and returns output blob plus audit diff.
   */
  public async scrub(
    file: File | Blob,
    policy: ScrubPolicy
  ): Promise<{
    blob: Blob;
    diff: Record<string, { before: string | null; after: string | null }>;
  }> {
    const beforeMeta = await MetadataReader.read(file);
    const diff: Record<string, { before: string | null; after: string | null }> = {};

    const edits: MetadataEdits = {};

    if (policy === 'gps-only') {
      edits.scrubGPS = true;
      edits.location = null;
      diff['GPS Location'] = {
        before: beforeMeta.location
          ? `${beforeMeta.location.latitude.toFixed(4)}, ${beforeMeta.location.longitude.toFixed(4)}`
          : 'None',
        after: 'Removed (Lossless)',
      };
    } else if (policy === 'device-only') {
      edits.scrubDevice = true;
      edits.tags = {
        make: '',
        model: '',
        software: '',
        lensModel: '',
        cameraIdentifier: '',
      };
      diff['Camera Hardware'] = {
        before: `${beforeMeta.tags.make || ''} ${beforeMeta.tags.model || ''}`.trim() || 'None',
        after: 'Removed',
      };
      diff['Software / OS'] = {
        before: beforeMeta.tags.software || 'None',
        after: 'Removed',
      };
    } else if (policy === 'full') {
      edits.scrubAll = true;
      edits.location = null;
      edits.creationDate = new Date('1970-01-01T00:00:00Z');
      edits.modifyDate = new Date('1970-01-01T00:00:00Z');
      edits.tags = {
        title: '',
        artist: '',
        copyright: '',
        make: '',
        model: '',
        software: '',
        lensModel: '',
        cameraIdentifier: '',
      };
      diff['GPS Location'] = {
        before: beforeMeta.location
          ? `${beforeMeta.location.latitude.toFixed(4)}, ${beforeMeta.location.longitude.toFixed(4)}`
          : 'None',
        after: 'Scrubbed',
      };
      diff['Device & Software'] = {
        before: `${beforeMeta.tags.make || ''} ${beforeMeta.tags.model || ''}`.trim() || 'None',
        after: 'Scrubbed',
      };
      diff['Creation Timestamp'] = {
        before: beforeMeta.tags.creationDate ? String(beforeMeta.tags.creationDate) : 'Present',
        after: 'Normalized to Epoch (1970)',
      };
    }

    const { blob } = await MetadataEditor.apply(file, edits);
    return { blob, diff };
  }
}

export const MetadataPrivacy = new MetadataPrivacyService();
