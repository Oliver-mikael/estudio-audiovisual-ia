// Fase 26: animaciones de subtítulo. Se comprueban la entrada y salida de 0,3 s,
// el efecto máquina de escribir y el deslizamiento desde abajo.
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SUBTITLE_ANIMATION,
  SUBTITLE_SLIDE_DISTANCE_PX,
  normalizeSubtitleAnimation,
  subtitleAnimationFrame,
} from '../engine/textAnimation';

const TEXT = 'Hola mundo';
const START = 1;
const END = 2;

const frame = (time: number, animation?: string) =>
  subtitleAnimationFrame(TEXT, time, START, END, animation);

describe('animaciones de subtítulo', () => {
  it('hace fade in de 0,3 s y fade out de 0,3 s', () => {
    expect(frame(0.99).opacity).toBe(0);
    expect(frame(1).opacity).toBe(0);
    expect(frame(1.15).opacity).toBeCloseTo(0.5, 2);
    expect(frame(1.3).opacity).toBeCloseTo(1, 2);
    expect(frame(1.5).opacity).toBe(1);
    expect(frame(1.85).opacity).toBeCloseTo(0.5, 2);
    expect(frame(1.99).opacity).toBeLessThan(0.1);
    expect(frame(2).opacity).toBe(0);
  });

  it('el deslizamiento entra desde abajo y termina en su sitio', () => {
    const start = frame(1, 'SlideUp');
    const middle = frame(1.15, 'SlideUp');
    const end = frame(1.6, 'SlideUp');
    expect(start.translateY).toBeCloseTo(SUBTITLE_SLIDE_DISTANCE_PX, 1);
    expect(middle.translateY).toBeGreaterThan(0);
    expect(middle.translateY).toBeLessThan(SUBTITLE_SLIDE_DISTANCE_PX);
    expect(end.translateY).toBe(0);
  });

  it('la máquina de escribir revela el texto letra a letra', () => {
    expect(frame(1, 'Typewriter').visibleText).toBe('');
    const quarter = frame(1.175, 'Typewriter').visibleText.length;
    const half = frame(1.35, 'Typewriter').visibleText.length;
    const full = frame(1.75, 'Typewriter').visibleText;
    expect(quarter).toBeGreaterThan(0);
    expect(half).toBeGreaterThan(quarter);
    expect(half).toBeLessThan(TEXT.length);
    expect(full).toBe(TEXT);
  });

  it('el texto completo se mantiene visible el resto de la ventana', () => {
    expect(frame(1.5, 'Fade').visibleText).toBe(TEXT);
    expect(frame(1.5, 'SlideUp').visibleText).toBe(TEXT);
  });

  it('normaliza estilos desconocidos al fundido por defecto', () => {
    expect(normalizeSubtitleAnimation(undefined)).toBe(DEFAULT_SUBTITLE_ANIMATION);
    expect(normalizeSubtitleAnimation('raro')).toBe('Fade');
    expect(normalizeSubtitleAnimation('Typewriter')).toBe('Typewriter');
    expect(normalizeSubtitleAnimation('SlideUp')).toBe('SlideUp');
  });
});
