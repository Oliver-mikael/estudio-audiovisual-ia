// Corrección de color por escena (fase 29).
//
// Los tres ajustes se guardan por escena y se aplican con `ctx.filter` en el
// canvas antes de exportar, de modo que la previsualización y el WebM usan
// exactamente el mismo filtro. El valor neutro es 1.0 en los tres controles.

import { Scene, SceneColorGrade } from '../types';

export const COLOR_GRADE_MIN = 0;
export const COLOR_GRADE_MAX = 2;

export const DEFAULT_COLOR_GRADE: Required<SceneColorGrade> = {
  brightness: 1,
  contrast: 1,
  saturation: 1,
};

function clampGradeValue(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 1;
  return Math.round(Math.min(COLOR_GRADE_MAX, Math.max(COLOR_GRADE_MIN, value)) * 100) / 100;
}

/** Rellena los valores ausentes con 1.0 (neutro) y limita el rango 0–2. */
export function normalizeColorGrade(grade?: SceneColorGrade | null): Required<SceneColorGrade> {
  return {
    brightness: clampGradeValue(grade?.brightness),
    contrast: clampGradeValue(grade?.contrast),
    saturation: clampGradeValue(grade?.saturation),
  };
}

/** true cuando los tres controles están en 1.0 y no hace falta filtrar. */
export function isNeutralColorGrade(grade?: SceneColorGrade | null): boolean {
  const normalized = normalizeColorGrade(grade);
  return (
    normalized.brightness === 1 && normalized.contrast === 1 && normalized.saturation === 1
  );
}

/**
 * Cadena para `ctx.filter`. Con valores neutros devuelve `none`, que deja el
 * lienzo exactamente como antes de esta fase.
 */
export function colorGradeCss(grade?: SceneColorGrade | null): string {
  if (isNeutralColorGrade(grade)) return 'none';
  const { brightness, contrast, saturation } = normalizeColorGrade(grade);
  return `brightness(${brightness}) contrast(${contrast}) saturate(${saturation})`;
}

/** Filtro efectivo de una escena (vacío si no tiene corrección). */
export function colorGradeFor(scene: Scene): string {
  return colorGradeCss(scene.colorGrade);
}
