// Animaciones de subtítulo: fundido de entrada y salida, máquina de escribir y
// deslizamiento desde abajo. Todo se calcula a partir del tiempo local de la
// escena, para que la previsualización y la exportación dibujen lo mismo.

import { SubtitleAnimation } from '../types';

/** Entrada y salida de cada subtítulo, en segundos. */
export const SUBTITLE_FADE_SECONDS = 0.3;
/** Distancia inicial del deslizamiento, en píxeles a 1280 de ancho. */
export const SUBTITLE_SLIDE_DISTANCE_PX = 40;
/** Ventana máxima del efecto máquina de escribir (se reparte entre los caracteres). */
export const SUBTITLE_TYPEWRITER_MAX_SECONDS = 1.2;
export const SUBTITLE_TYPEWRITER_MIN_SECONDS = 0.3;

export const SUBTITLE_ANIMATIONS: { id: SubtitleAnimation; label: string }[] = [
  { id: 'Fade', label: 'Fundido' },
  { id: 'Typewriter', label: 'Máquina de escribir' },
  { id: 'SlideUp', label: 'Deslizar hacia arriba' },
];

export const DEFAULT_SUBTITLE_ANIMATION: SubtitleAnimation = 'Fade';

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function easeOutCubic(progress: number): number {
  const inverse = 1 - clamp01(progress);
  return 1 - inverse * inverse * inverse;
}

export function normalizeSubtitleAnimation(value?: string): SubtitleAnimation {
  return value === 'Typewriter' || value === 'SlideUp' ? value : DEFAULT_SUBTITLE_ANIMATION;
}

export interface SubtitleAnimationFrame {
  opacity: number;
  /** Desplazamiento vertical en píxeles (solo SlideUp). */
  translateY: number;
  /** Texto visible en este instante (máquina de escribir recorta la cadena). */
  visibleText: string;
  /** Progreso 0→1 de la entrada, para poder probarlo. */
  entryProgress: number;
}

/**
 * Estado visual de un subtítulo en un instante. `localTime` y la ventana
 * (`start`, `end`) son segundos relativos a la escena.
 */
export function subtitleAnimationFrame(
  text: string,
  localTime: number,
  start: number,
  end: number,
  animation?: string
): SubtitleAnimationFrame {
  const style = normalizeSubtitleAnimation(animation);
  const windowStart = Number.isFinite(start) ? start : 0;
  const windowEnd = Math.max(windowStart, Number.isFinite(end) ? end : windowStart);
  const time = Number.isFinite(localTime) ? localTime : windowStart;
  const elapsed = time - windowStart;
  const remaining = windowEnd - time;
  const total = windowEnd - windowStart;

  const entryProgress = clamp01(elapsed / SUBTITLE_FADE_SECONDS);
  const exitProgress = clamp01(remaining / SUBTITLE_FADE_SECONDS);
  const opacity = Math.min(entryProgress, exitProgress);

  let visibleText = text;
  if (style === 'Typewriter' && text.length > 0) {
    const typingSeconds = Math.min(
      SUBTITLE_TYPEWRITER_MAX_SECONDS,
      Math.max(SUBTITLE_TYPEWRITER_MIN_SECONDS, total - SUBTITLE_FADE_SECONDS)
    );
    const typed = Math.min(1, elapsed / typingSeconds);
    const characters = Math.max(0, Math.min(text.length, Math.ceil(typed * text.length)));
    visibleText = text.slice(0, characters);
  }

  const translateY =
    style === 'SlideUp' ? (1 - easeOutCubic(entryProgress)) * SUBTITLE_SLIDE_DISTANCE_PX : 0;

  return { opacity, translateY, visibleText, entryProgress };
}
