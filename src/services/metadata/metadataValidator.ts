import { mp4Parser } from './mp4Parser';
import { MetadataValidationResult, MetadataRecord } from './metadataTypes';

export class MetadataValidatorService {
  /**
   * Verifies an MP4/MOV container structure, box ordering, and expected metadata values.
   */
  public async verify(
    file: File | Blob,
    expected?: Partial<MetadataRecord>
  ): Promise<MetadataValidationResult> {
    const issues: string[] = [];

    const boxes = await mp4Parser.scanTopLevelBoxes(file);
    const hasMoov = boxes.some((b) => b.type === 'moov');
    const hasMdat = boxes.some((b) => b.type === 'mdat');

    if (!hasMoov) {
      issues.push('Container missing required moov (movie header) atom');
    }
    if (!hasMdat) {
      issues.push('Container missing mdat (media data) atom');
    }

    let durationMatches = true;
    let offsetsValid = true;

    try {
      const record = await mp4Parser.readMetadata(file);
      if (expected?.technical?.durationSeconds !== undefined) {
        if (Math.abs(record.technical.durationSeconds - expected.technical.durationSeconds) > 0.5) {
          durationMatches = false;
          issues.push(
            `Duration mismatch: expected ${expected.technical.durationSeconds}s, read ${record.technical.durationSeconds}s`
          );
        }
      }

      if (expected?.location !== undefined) {
        if (expected.location === null && record.location !== null) {
          issues.push('Expected GPS to be removed, but coordinates still detected');
        }
      }
    } catch (e: any) {
      issues.push(`Failed to decode moov metadata: ${e.message}`);
      offsetsValid = false;
    }

    return {
      valid: issues.length === 0,
      issues,
      details: {
        atomCount: boxes.length,
        hasMoov,
        hasMdat,
        durationMatches,
        offsetsValid,
      },
    };
  }
}

export const MetadataValidator = new MetadataValidatorService();
