import {
  EnhancementSettings,
  DeviceProfileSettings,
  MotionBlurSettings,
  UpscaleSettings,
} from '../types/handbrake';

export const DEFAULT_ENHANCEMENT: EnhancementSettings = {
  sharpness: 0,
  noiseReduction: 0,
  filmGrain: 0,
  contrast: 50,
  brightness: 50,
  saturation: 100,
  gamma: 1.0,
  exposure: 0.0,
  clarity: 0,
  detailEnhancement: 0,
  colorTemperature: 6500,
  whiteBalanceMode: 'auto',
  highlights: 0,
  shadows: 0,
  vibrance: 100,
  aiDenoise: false,
  debanding: false,
  dehazing: false,
  edgeEnhancement: false,
  chromaNoiseReduction: false,
  lumaNoiseReduction: false,
  colorCorrection: false,
  motionBlurReduction: false,
  filmGrainSimulation: false,
  artificialSharpening: false,
};

export const DEFAULT_DEVICE_PROFILE: DeviceProfileSettings = {
  profile: 'none',
  intensity: 100,
};

export const DEFAULT_MOTION_BLUR: MotionBlurSettings = {
  enabled: false,
  intensity: 40,
  direction: 'natural',
  shutterSpeed: '1/60',
  motionBlurReduction: false,
  frameInterpolation: false,
  opticalFlow: false,
};

export const DEFAULT_UPSCALE: UpscaleSettings = {
  mode: 'auto',
  multiplier: 1,
  algorithm: 'lanczos',
  allowUpscaling: true,
};

/**
 * Converts Kelvin color temperature (2000K - 10000K) to RGB balance factors
 */
export function kelvinToRgbMultipliers(kelvin: number): [number, number, number] {
  const temp = Math.max(2000, Math.min(10000, kelvin)) / 100;
  let r: number, g: number, b: number;

  if (temp <= 66) {
    r = 255;
    g = 99.4708025861 * Math.log(temp) - 161.1195681661;
    b = temp <= 19 ? 0 : 138.5177312231 * Math.log(temp - 10) - 305.0447927307;
  } else {
    r = 329.698727446 * Math.pow(temp - 60, -0.1332047592);
    g = 288.1221695283 * Math.pow(temp - 60, -0.0755148492);
    b = 255;
  }

  // Normalize relative to standard D65 (6500K)
  const normR = Math.max(0.5, Math.min(1.8, (Math.max(0, Math.min(255, r)) / 255) / 1.0));
  const normG = Math.max(0.5, Math.min(1.8, (Math.max(0, Math.min(255, g)) / 255) / 1.0));
  const normB = Math.max(0.5, Math.min(1.8, (Math.max(0, Math.min(255, b)) / 255) / 1.0));

  return [normR, normG, normB];
}

/**
 * Builds CSS filter shorthand for Canvas 2D accelerated GPU pass
 */
export function buildCanvasCssFilter(
  enhancement?: EnhancementSettings,
  deviceProfile?: DeviceProfileSettings
): string {
  if (!enhancement && !deviceProfile) return 'none';

  const e = { ...DEFAULT_ENHANCEMENT, ...enhancement };
  const d = { ...DEFAULT_DEVICE_PROFILE, ...deviceProfile };

  let brightnessVal = 100 + (e.brightness - 50) * 1.2;
  let contrastVal = 100 + (e.contrast - 50) * 1.5;
  let saturationVal = e.saturation;

  // Apply exposure if any
  if (e.exposure !== 0) {
    brightnessVal *= Math.pow(2, e.exposure);
  }

  // Apply device profiles adjustments
  if (d.profile !== 'none') {
    const factor = d.intensity / 100;
    switch (d.profile) {
      case 'low-class-mobile':
        contrastVal += 15 * factor;
        saturationVal -= 20 * factor;
        break;
      case 'standard-mobile':
        contrastVal += 8 * factor;
        saturationVal += 5 * factor;
        break;
      case 'high-quality-android':
        contrastVal += 12 * factor;
        saturationVal += 18 * factor;
        break;
      case 'iphone-quality':
        contrastVal += 4 * factor;
        saturationVal += 6 * factor;
        break;
      case 'cinematic':
        contrastVal += 15 * factor;
        saturationVal -= 5 * factor;
        break;
      case 'professional-camera':
        contrastVal -= 5 * factor;
        break;
    }
  }

  const parts: string[] = [];
  if (Math.abs(brightnessVal - 100) > 0.5) parts.push(`brightness(${Math.round(brightnessVal)}%)`);
  if (Math.abs(contrastVal - 100) > 0.5) parts.push(`contrast(${Math.round(contrastVal)}%)`);
  if (Math.abs(saturationVal - 100) > 0.5) parts.push(`saturate(${Math.round(saturationVal)}%)`);

  return parts.length > 0 ? parts.join(' ') : 'none';
}

/**
 * Motion blur simulation buffer
 */
class MotionBlurAccumulator {
  private historyCanvases: HTMLCanvasElement[] = [];

  public apply(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    settings: MotionBlurSettings
  ) {
    if (!settings.enabled || settings.intensity <= 0) return;

    const intensity = settings.intensity / 100;
    const alpha = Math.min(0.7, 0.2 + intensity * 0.5);

    // Get or create history buffer
    if (this.historyCanvases.length === 0) {
      const c = document.createElement('canvas');
      c.width = width;
      c.height = height;
      this.historyCanvases.push(c);
    }

    const prevCanvas = this.historyCanvases[0];
    if (prevCanvas.width !== width || prevCanvas.height !== height) {
      prevCanvas.width = width;
      prevCanvas.height = height;
    }

    // Directional offsets based on direction & intensity
    let dx = 0;
    let dy = 0;
    const maxOffset = Math.round(intensity * 12);

    switch (settings.direction) {
      case 'horizontal':
        dx = maxOffset;
        break;
      case 'vertical':
        dy = maxOffset;
        break;
      case 'radial':
        // Zoom blur simulation
        ctx.save();
        ctx.globalAlpha = alpha * 0.5;
        ctx.drawImage(prevCanvas, -dx, -dy, width + dx * 2, height + dy * 2);
        ctx.restore();
        break;
      case 'natural':
      default:
        dx = Math.round(maxOffset * 0.7);
        dy = Math.round(maxOffset * 0.3);
        break;
    }

    if (settings.direction !== 'radial' && (dx !== 0 || dy !== 0)) {
      ctx.save();
      ctx.globalAlpha = alpha * 0.4;
      ctx.drawImage(prevCanvas, dx, dy);
      ctx.drawImage(prevCanvas, -dx, -dy);
      ctx.restore();
    }

    // Update history canvas
    const prevCtx = prevCanvas.getContext('2d');
    if (prevCtx) {
      prevCtx.clearRect(0, 0, width, height);
      prevCtx.drawImage(ctx.canvas, 0, 0);
    }
  }

  public reset() {
    this.historyCanvases = [];
  }
}

export const motionBlurEngine = new MotionBlurAccumulator();

/**
 * Full pixel-level enhancement pipeline.
 * Modifies the canvas image data directly for effects that cannot be done with CSS filters:
 * - Color Temperature Kelvin matrix
 * - Gamma curve lookup
 * - Highlights and Shadows tone curve
 * - Vibrance boost without clipping skin tones
 * - Convolution 3x3 Sharpness and Edge enhancement
 * - Film grain noise synthesis
 * - Device profile simulation artifacts (blockiness, sensor noise)
 */
export function applyPixelEnhancements(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  enhancement?: EnhancementSettings,
  deviceProfile?: DeviceProfileSettings,
  motionBlur?: MotionBlurSettings
) {
  const e = { ...DEFAULT_ENHANCEMENT, ...enhancement };
  const d = { ...DEFAULT_DEVICE_PROFILE, ...deviceProfile };
  const m = { ...DEFAULT_MOTION_BLUR, ...motionBlur };

  // Apply motion blur first if active
  if (m.enabled) {
    motionBlurEngine.apply(ctx, width, height, m);
  }

  const needsPixelProcessing =
    e.colorTemperature !== 6500 ||
    e.gamma !== 1.0 ||
    e.highlights !== 0 ||
    e.shadows !== 0 ||
    e.vibrance !== 100 ||
    e.sharpness > 0 ||
    e.edgeEnhancement ||
    e.artificialSharpening ||
    e.filmGrain > 0 ||
    e.filmGrainSimulation ||
    e.clarity > 0 ||
    e.detailEnhancement > 0 ||
    e.debanding ||
    e.dehazing ||
    d.profile !== 'none';

  if (!needsPixelProcessing) return;

  let imgData: ImageData;
  try {
    imgData = ctx.getImageData(0, 0, width, height);
  } catch (err) {
    // Cross-origin restriction fallback
    return;
  }

  const data = imgData.data;
  const len = data.length;

  // 1. Color Temperature
  const [rMult, gMult, bMult] = kelvinToRgbMultipliers(e.colorTemperature);

  // 2. Gamma lookup table
  const gammaLut = new Uint8Array(256);
  const invGamma = 1 / Math.max(0.1, e.gamma);
  for (let i = 0; i < 256; i++) {
    gammaLut[i] = Math.min(255, Math.max(0, Math.round(255 * Math.pow(i / 255, invGamma))));
  }

  // 3. Highlights & Shadows adjustments
  const hlFactor = e.highlights / 100; // -1.0 to 1.0
  const shFactor = e.shadows / 100;    // -1.0 to 1.0

  // 4. Vibrance & Saturation
  const vibranceFactor = (e.vibrance - 100) / 100; // -1.0 to 1.0

  // 5. Film grain intensity
  let grainIntensity = e.filmGrain;
  if (e.filmGrainSimulation) grainIntensity = Math.max(grainIntensity, 35);
  if (d.profile === 'cinematic') grainIntensity = Math.max(grainIntensity, 15 * (d.intensity / 100));
  if (d.profile === 'low-class-mobile') grainIntensity = Math.max(grainIntensity, 25 * (d.intensity / 100));

  // Device profile modifiers
  const isLowMobile = d.profile === 'low-class-mobile';
  const isIphone = d.profile === 'iphone-quality';
  const isCinematic = d.profile === 'cinematic';
  const profileIntensity = d.intensity / 100;

  // Single-pass pixel loop for tonal, color, and noise transformations
  for (let i = 0; i < len; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // Color temperature
    if (e.colorTemperature !== 6500) {
      r = Math.min(255, r * rMult);
      g = Math.min(255, g * gMult);
      b = Math.min(255, b * bMult);
    }

    // Gamma correction
    if (e.gamma !== 1.0) {
      r = gammaLut[r];
      g = gammaLut[g];
      b = gammaLut[b];
    }

    // Highlights and Shadows tonal mapping
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const normLuma = luma / 255;

    if (hlFactor !== 0 && normLuma > 0.5) {
      const hlWeight = (normLuma - 0.5) * 2; // 0 at midpoint, 1 at peak
      const delta = hlFactor * 40 * hlWeight;
      r = Math.min(255, Math.max(0, r + delta));
      g = Math.min(255, Math.max(0, g + delta));
      b = Math.min(255, Math.max(0, b + delta));
    }

    if (shFactor !== 0 && normLuma < 0.5) {
      const shWeight = (0.5 - normLuma) * 2; // 1 at black, 0 at midpoint
      const delta = shFactor * 40 * shWeight;
      r = Math.min(255, Math.max(0, r + delta));
      g = Math.min(255, Math.max(0, g + delta));
      b = Math.min(255, Math.max(0, b + delta));
    }

    // Vibrance adjustment (smart saturation on lower saturated tones)
    if (vibranceFactor !== 0) {
      const maxC = Math.max(r, Math.max(g, b));
      const minC = Math.min(r, Math.min(g, b));
      const sat = maxC === 0 ? 0 : (maxC - minC) / maxC;
      const boost = (1 - sat) * vibranceFactor;
      r = Math.min(255, Math.max(0, r + (r - luma) * boost));
      g = Math.min(255, Math.max(0, g + (g - luma) * boost));
      b = Math.min(255, Math.max(0, b + (b - luma) * boost));
    }

    // iPhone Quality simulation: warm skin tone preservation & smooth highlights
    if (isIphone && profileIntensity > 0) {
      // Natural warm skin tone lift
      if (r > g && g > b) {
        r = Math.min(255, r + 2 * profileIntensity);
        g = Math.min(255, g + 1 * profileIntensity);
      }
    }

    // Cinematic look: slight teal in shadows, warm highlights (Kodak 2383 look)
    if (isCinematic && profileIntensity > 0) {
      if (normLuma < 0.4) {
        b = Math.min(255, b + 6 * profileIntensity * (1 - normLuma / 0.4));
      } else if (normLuma > 0.6) {
        r = Math.min(255, r + 5 * profileIntensity * ((normLuma - 0.6) / 0.4));
      }
    }

    // Low-class mobile: slight color posterization & dynamic range crushing
    if (isLowMobile && profileIntensity > 0) {
      const step = 4 * profileIntensity;
      r = Math.round(r / step) * step;
      g = Math.round(g / step) * step;
      b = Math.round(b / step) * step;
    }

    // Film Grain & Sensor Noise overlay
    if (grainIntensity > 0) {
      const noise = (Math.random() - 0.5) * grainIntensity * 0.8;
      r = Math.min(255, Math.max(0, r + noise));
      g = Math.min(255, Math.max(0, g + noise));
      b = Math.min(255, Math.max(0, b + noise));
    }

    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
  }

  // 6. Convolution pass for Sharpness / Edge Enhancement / Clarity
  const sharpTotal = e.sharpness + (e.edgeEnhancement ? 25 : 0) + (e.artificialSharpening ? 35 : 0) + (e.clarity ? e.clarity * 0.4 : 0);
  if (sharpTotal > 0 && width >= 4 && height >= 4) {
    applySharpnessConvolution(data, width, height, Math.min(100, sharpTotal) / 100);
  }

  ctx.putImageData(imgData, 0, 0);
}

/**
 * Fast 3x3 unsharp mask convolution kernel
 */
function applySharpnessConvolution(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  amount: number
) {
  const original = new Uint8ClampedArray(data);
  const weight = amount * 0.75;
  const centerWeight = 1 + 4 * weight;

  for (let y = 1; y < height - 1; y++) {
    const rowOffset = y * width * 4;
    const prevRowOffset = (y - 1) * width * 4;
    const nextRowOffset = (y + 1) * width * 4;

    for (let x = 1; x < width - 1; x++) {
      const px = rowOffset + x * 4;
      const top = prevRowOffset + x * 4;
      const bottom = nextRowOffset + x * 4;
      const left = rowOffset + (x - 1) * 4;
      const right = rowOffset + (x + 1) * 4;

      for (let c = 0; c < 3; c++) {
        const val =
          original[px + c] * centerWeight -
          (original[top + c] +
            original[bottom + c] +
            original[left + c] +
            original[right + c]) *
            weight;
        data[px + c] = Math.min(255, Math.max(0, val));
      }
    }
  }
}
