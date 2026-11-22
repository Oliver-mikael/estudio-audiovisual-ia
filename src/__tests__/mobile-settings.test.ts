// Límite móvil de exportación: con un user agent de Android, cualquier petición
// superior se recorta a 1280 × 720 y 30 fps.
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  MOBILE_LIMIT,
  effectiveSettings,
  isLimitedForMobile,
  isMobileLike,
} from '../engine/capabilities';
import { createEmptyProject } from '../data/newProject';

const ANDROID_UA =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36';
const DESKTOP_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

function projectAt(width: number, height: number, fps: number) {
  const project = createEmptyProject('Ajustes de exportación');
  project.settings.resolution = { width, height };
  project.settings.fps = fps;
  return project;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('effectiveSettings', () => {
  it('recorta 1080p/60 a 720p/30 cuando isMobile es verdadero', () => {
    vi.stubGlobal('navigator', { userAgent: ANDROID_UA, maxTouchPoints: 5 });

    expect(isMobileLike()).toBe(true);

    const project = projectAt(1920, 1080, 60);
    const settings = effectiveSettings(project);

    expect(settings.resolution).toEqual({ width: MOBILE_LIMIT.width, height: MOBILE_LIMIT.height });
    expect(settings.fps).toBe(MOBILE_LIMIT.fps);
    expect(isLimitedForMobile(project.settings)).toBe(true);
  });

  it('no recorta ajustes que ya caben en el límite móvil', () => {
    vi.stubGlobal('navigator', { userAgent: ANDROID_UA, maxTouchPoints: 5 });

    const project = projectAt(1280, 720, 24);
    const settings = effectiveSettings(project);

    expect(settings.resolution).toEqual({ width: 1280, height: 720 });
    expect(settings.fps).toBe(24);
    expect(isLimitedForMobile(project.settings)).toBe(false);
  });

  it('respeta 1080p/60 en escritorio', () => {
    vi.stubGlobal('navigator', { userAgent: DESKTOP_UA, maxTouchPoints: 0 });

    expect(isMobileLike()).toBe(false);

    const project = projectAt(1920, 1080, 60);
    const settings = effectiveSettings(project);

    expect(settings.resolution).toEqual({ width: 1920, height: 1080 });
    expect(settings.fps).toBe(60);
    expect(isLimitedForMobile(project.settings)).toBe(false);
  });
});
