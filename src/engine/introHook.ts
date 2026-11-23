// Gancho visual de la intro: durante los primeros 3 segundos del video se
// superpone el texto del gancho en grande, con zoom de entrada de 110 % a 100 %
// y un fondo oscurecido para legibilidad. Se puede desactivar por proyecto.

import { Project } from '../types';

export const INTRO_HOOK_SECONDS = 3;
export const INTRO_HOOK_ZOOM_SECONDS = 0.5;
export const INTRO_HOOK_FADE_IN_SECONDS = 0.15;
export const INTRO_HOOK_FADE_OUT_SECONDS = 0.3;
/** Opacidad del velo oscuro detrás del texto. */
export const INTRO_HOOK_DARKEN = 0.34;

export interface IntroHookFrame {
  text: string;
  /** Escala del texto: 1,10 al empezar y 1,00 a los 0,5 s. */
  scale: number;
  opacity: number;
  /** Opacidad del velo oscuro de fondo, ya multiplicada por `opacity`. */
  darken: number;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function easeOutCubic(progress: number): number {
  const inverse = 1 - clamp01(progress);
  return 1 - inverse * inverse * inverse;
}

/** El gancho está activo salvo que el proyecto lo desactive explícitamente. */
export function isIntroHookEnabled(project: Project): boolean {
  return project.settings.introHookEnabled !== false;
}

/** Texto del gancho: el escrito en Ajustes o, si está vacío, el título de la primera escena. */
export function introHookText(project: Project): string {
  const configured = (project.settings.introHookText ?? '').trim();
  if (configured) return configured;
  return (project.script.scenes[0]?.title ?? '').trim();
}

/**
 * Estado del gancho en un instante absoluto del proyecto. Devuelve null si está
 * desactivado, si no hay texto o si ya pasaron los primeros 3 s.
 */
export function introHookFrame(project: Project, timeSeconds: number): IntroHookFrame | null {
  if (!isIntroHookEnabled(project)) return null;
  const text = introHookText(project);
  if (!text) return null;
  if (timeSeconds < 0 || timeSeconds >= INTRO_HOOK_SECONDS) return null;

  const zoomProgress = clamp01(timeSeconds / INTRO_HOOK_ZOOM_SECONDS);
  const scale = 1.1 - 0.1 * easeOutCubic(zoomProgress);

  const fadeIn = clamp01(timeSeconds / INTRO_HOOK_FADE_IN_SECONDS);
  const fadeOut = clamp01((INTRO_HOOK_SECONDS - timeSeconds) / INTRO_HOOK_FADE_OUT_SECONDS);
  const opacity = Math.min(fadeIn, fadeOut);

  return {
    text,
    scale,
    opacity,
    darken: INTRO_HOOK_DARKEN * opacity,
  };
}
