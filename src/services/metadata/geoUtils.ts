import { MetadataLocation } from './metadataTypes';

/**
 * Geographic utilities for parsing, formatting and displaying ISO 6709 coordinates.
 */
export class GeoUtilsService {
  /**
   * Parses standard ISO 6709 string e.g. "+37.7749-122.4194+015.000/" or "+37.7749-122.4194/"
   */
  public parseISO6709(isoString?: string | null): MetadataLocation | null {
    if (!isoString || typeof isoString !== 'string') return null;

    const clean = isoString.trim().replace(/\/$/, '');
    const regex = /^([+-]\d+(?:\.\d+)?)([+-]\d+(?:\.\d+)?)(?:([+-]\d+(?:\.\d+)?))?$/;
    const match = clean.match(regex);

    if (match) {
      const lat = parseFloat(match[1]);
      const lon = parseFloat(match[2]);
      const alt = match[3] !== undefined ? parseFloat(match[3]) : null;

      if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
        return {
          latitude: lat,
          longitude: lon,
          altitude: alt,
        };
      }
    }
    return null;
  }

  /**
   * Formats decimal latitude and longitude into QuickTime ISO 6709 format:
   * e.g. "+37.7749-122.4194+015.000/"
   */
  public formatISO6709(lat: number, lon: number, alt?: number | null): string {
    if (lat === null || lon === null || isNaN(lat) || isNaN(lon)) return '';

    const latSign = lat >= 0 ? '+' : '-';
    const lonSign = lon >= 0 ? '+' : '-';

    const latStr = latSign + Math.abs(lat).toFixed(4).padStart(7, '0');
    const lonStr = lonSign + Math.abs(lon).toFixed(4).padStart(8, '0');

    let altStr = '';
    if (alt !== null && alt !== undefined && !isNaN(alt)) {
      const altVal = Number(alt);
      const altSign = altVal >= 0 ? '+' : '-';
      altStr = altSign + Math.abs(altVal).toFixed(3).padStart(7, '0');
    }

    return `${latStr}${lonStr}${altStr}/`;
  }

  /**
   * Converts decimal degrees to human-readable DMS string:
   * e.g. 37° 46' 29.6" N
   */
  public toDMS(deg: number, isLat: boolean): string {
    if (deg === null || isNaN(deg)) return '--';
    const absolute = Math.abs(deg);
    const degrees = Math.floor(absolute);
    const minutesNotTruncated = (absolute - degrees) * 60;
    const minutes = Math.floor(minutesNotTruncated);
    const seconds = ((minutesNotTruncated - minutes) * 60).toFixed(1);

    const direction = isLat ? (deg >= 0 ? 'N' : 'S') : deg >= 0 ? 'E' : 'W';
    return `${degrees}° ${minutes}' ${seconds}" ${direction}`;
  }

  /**
   * Formats coordinates to XMP/EXIF standard GPS representation
   */
  public toXMPGPS(lat: number, lon: number, alt?: number | null) {
    if (lat === null || lon === null || isNaN(lat) || isNaN(lon)) return null;

    const latAbs = Math.abs(lat);
    const latDeg = Math.floor(latAbs);
    const latMin = (latAbs - latDeg) * 60;
    const latRef = lat >= 0 ? 'N' : 'S';
    const latXMP = `${String(latDeg).padStart(2, '0')},${latMin.toFixed(6)}${latRef}`;

    const lonAbs = Math.abs(lon);
    const lonDeg = Math.floor(lonAbs);
    const lonMin = (lonAbs - lonDeg) * 60;
    const lonRef = lon >= 0 ? 'E' : 'W';
    const lonXMP = `${String(lonDeg).padStart(3, '0')},${lonMin.toFixed(6)}${lonRef}`;

    let altXMP: string | null = null;
    let altRef = '0';
    if (alt !== null && alt !== undefined && !isNaN(alt)) {
      const altNum = Number(alt);
      altRef = altNum < 0 ? '1' : '0';
      altXMP = `${Math.round(Math.abs(altNum) * 100)}/100`;
    }

    const coordsXMP = `${latAbs.toFixed(6)} ${latRef}, ${lonAbs.toFixed(6)} ${lonRef}`;

    return {
      latitude: latXMP,
      longitude: lonXMP,
      latitudeRef: latRef,
      longitudeRef: lonRef,
      altitude: altXMP,
      altitudeRef: altRef,
      coordinates: coordsXMP,
    };
  }
}

export const geoUtils = new GeoUtilsService();
