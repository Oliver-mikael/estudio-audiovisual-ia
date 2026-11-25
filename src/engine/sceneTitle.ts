// Título animado de la primera escena (fase 32).
//
// El título del proyecto se dibuja en el tercio inferior durante los primeros
// segundos de la escena 1, sobre un fondo negro semitransparente y con una
// entrada de deslizamiento desde abajo en 0,4 s. Es independiente del gancho de
// la intro, que sigue centrado.

import { Project, Scene } from '../types';

/** Segundos que permanece visible el título al inicio del proyecto. */
export const SCENE_TITLE_SECONDS = 4;
/** Duración de la entrada deslizando desde abajo. */
export const SCENE_TITLE_SLIDE_SECONDS = 0.4;
/** Distancia inicial del deslizamiento, en píxeles a 1280 de ancho. */
export const SCENE_TITLE_SLIDE_DISTANCE_PX = 60;
export const SCENE_TITLE_FADE_OUT_SECONDS = 0.3;

export interface SceneTitleFrame {
  text: string;
  /** 0→1 durante la entrada; 1 cuando ya está colocado. */
  slideProgress: number;
  /** Desplazamiento vertical en píxeles (positivo = más abajo). */
  translateY: number;
  opacity: number;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function easeOutCubic(progress: number): number {
  const inverse = 1 - clamp01(progress);
  return 1 - inverse * inverse * inverse;
}

/** true solo para la primera escena del proyecto. */
export function isSceneTitleScene(project: Project, scene: Scene): boolean {
  return project.script.scenes[0]?.id === scene.id;
}

/**
 * Estado del título en un instante absoluto. Devuelve null si la escena no es la
 * primera, si el proyecto no tiene título o si ya pasaron los 4 s (o la escena).
 */
export function sceneTitleFrame(
  project: Project,
  scene: Scene,
  timeSeconds: number
): SceneTitleFrame | null {
  if (!isSceneTitleScene(project, scene)) return null;
  const text = (project.title ?? '').trim();
  if (!text) return null;

  const visibleUntil = Math.min(SCENE_TITLE_SECONDS, Math.max(0, scene.durationSeconds));
  if (timeSeconds < 0 || timeSeconds >= visibleUntil) return null;

  const slideProgress = clamp01(timeSeconds / SCENE_TITLE_SLIDE_SECONDS);
  const translateY = (1 - easeOutCubic(slideProgress)) * SCENE_TITLE_SLIDE_DISTANCE_PX;
  const fadeOut = clamp01((visibleUntil - timeSeconds) / SCENE_TITLE_FADE_OUT_SECONDS);

  return {
    text,
    slideProgress,
    translateY,
    opacity: fadeOut,
  };
}
