// Capacidades del dispositivo y presets de exportación.
//
// En móvil/Android la exportación se limita a 720p y 30 fps para no agotar la
// memoria del WebView al codificar cuadros grandes.

import { Project } from '../types';

export interface ResolutionPreset {
  label: '480p' | '720p' | '1080p';
  width: number;
  height: number;
}

export const RESOLUTION_PRESETS: ResolutionPreset[] = [
  { label: '480p', width: 854, height: 480 },
  { label: '720p', width: 1280, height: 720 },
  { label: '1080p', width: 1920, height: 1080 },
];

export const FPS_OPTIONS = [24, 30, 60];

export const MOBILE_LIMIT = { width: 1280, height: 720, fps: 30 };

/** Detecta Android/móvil (incluye iPadOS, que se presenta como Mac táctil). */
export function isMobileLike(): boolean {
  if (typeof navigator === 'undefined') return false;
  const userAgent = navigator.userAgent || '';
  if (/Android|iPhone|iPad|iPod|Windows Phone|Mobile/i.test(userAgent)) return true;
  return /Macintosh/i.test(userAgent) && (navigator.maxTouchPoints ?? 0) > 1;
}

/** Ajustes realmente aplicables en este dispositivo (recorta en móvil). */
export function effectiveSettings(project: Project): Project['settings'] {
  const settings = project.settings;
  if (!isMobileLike()) return settings;

  return {
    ...settings,
    fps: Math.min(settings.fps || 30, MOBILE_LIMIT.fps),
    resolution: {
      width: Math.min(settings.resolution.width, MOBILE_LIMIT.width),
      height: Math.min(settings.resolution.height, MOBILE_LIMIT.height),
    },
  };
}

export function isLimitedForMobile(settings: Project['settings']): boolean {
  return (
    isMobileLike() &&
    (settings.resolution.width > MOBILE_LIMIT.width ||
      settings.resolution.height > MOBILE_LIMIT.height ||
      (settings.fps || 30) > MOBILE_LIMIT.fps)
  );
}

export function resolutionLabel(width: number, height: number): string {
  const preset = RESOLUTION_PRESETS.find((item) => item.width === width && item.height === height);
  return preset ? `${preset.label} (${width} × ${height})` : `${width} × ${height}`;
}
