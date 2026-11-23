// Fase 29: corrección de color por escena. Los tres controles son neutros en
// 1.0, se limitan a 0–2 y se convierten en el filtro del canvas.
import { describe, expect, it } from 'vitest';
import {
  COLOR_GRADE_MAX,
  COLOR_GRADE_MIN,
  colorGradeCss,
  colorGradeFor,
  isNeutralColorGrade,
  normalizeColorGrade,
} from '../engine/colorGrade';
import { Scene } from '../types';

function sceneWithGrade(grade?: Scene['colorGrade']): Scene {
  return {
    id: 's1',
    title: 'Escena',
    narrationText: '',
    visualIntent: '',
    cameraMotion: 'Static',
    transition: 'Cut',
    durationSeconds: 2,
    colorGrade: grade,
  };
}

describe('corrección de color por escena', () => {
  it('usa 1.0 como valor neutro y no genera filtro', () => {
    expect(normalizeColorGrade()).toEqual({ brightness: 1, contrast: 1, saturation: 1 });
    expect(isNeutralColorGrade()).toBe(true);
    expect(colorGradeCss()).toBe('none');
    expect(colorGradeCss({ brightness: 1, contrast: 1, saturation: 1 })).toBe('none');
  });

  it('construye el filtro con los tres controles', () => {
    expect(colorGradeCss({ brightness: 1.3, contrast: 1.15, saturation: 0.7 })).toBe(
      'brightness(1.3) contrast(1.15) saturate(0.7)'
    );
  });

  it('rellena los valores ausentes con 1 y limita el rango', () => {
    expect(normalizeColorGrade({ brightness: 3 })).toEqual({
      brightness: COLOR_GRADE_MAX,
      contrast: 1,
      saturation: 1,
    });
    expect(normalizeColorGrade({ saturation: -2 })).toEqual({
      brightness: 1,
      contrast: 1,
      saturation: COLOR_GRADE_MIN,
    });
    expect(normalizeColorGrade({ contrast: Number.NaN })).toEqual({
      brightness: 1,
      contrast: 1,
      saturation: 1,
    });
  });

  it('devuelve el filtro de la escena y none si no tiene corrección', () => {
    expect(colorGradeFor(sceneWithGrade())).toBe('none');
    expect(colorGradeFor(sceneWithGrade({ brightness: 1.4 }))).toBe(
      'brightness(1.4) contrast(1) saturate(1)'
    );
  });
});
