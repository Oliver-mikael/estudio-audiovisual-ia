// Música adaptativa: la ganancia de la música no es un valor fijo, sino una
// curva calculada muestra a muestra a partir del timestamp.
//
// - Intro (primeros 3 s): empieza al 80 % del volumen configurado y sube
//   gradualmente hasta el 100 %.
// - Durante la narración: ducking al 30 % (misma envolvente de la fase 13).
// - Cierre (últimos 3 s): la música recupera el 100 % aunque haya voz y hace
//   un fundido de salida suave en el último segundo.
//
// La curva se multiplica por el volumen general del proyecto en `prepareProjectAudio`.

import { AUDIO_SAMPLE_RATE, DuckOptions, duckGainEnvelope } from './audioTrack';

/** Duración de la intro en la que la música sube desde el 80 %. */
export const MUSIC_INTRO_SECONDS = 3;
/** Nivel inicial de la música al empezar el video (80 % del volumen general). */
export const MUSIC_INTRO_START_LEVEL = 0.8;
/** Los últimos 3 s son el cierre: la música vuelve al 100 %. */
export const MUSIC_OUTRO_SECONDS = 3;
/** Tiempo que tarda la música en recuperarse del ducking al entrar el cierre. */
export const MUSIC_OUTRO_RAMP_SECONDS = 0.6;
/** Fundido de salida suave al final del video. */
export const MUSIC_FADE_OUT_SECONDS = 1;

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

/** Curva de ganancia adaptativa de la música, muestra a muestra (0 a 1). */
export function musicAdaptiveGain(
  voice: Float32Array | null,
  frames: number,
  durationSeconds: number,
  options: Partial<DuckOptions> = {}
): Float32Array {
  const total = Math.max(1, Math.round(frames));
  const sampleRate = options.sampleRate ?? AUDIO_SAMPLE_RATE;
  const duration = Math.max(0.001, durationSeconds);
  const duck = duckGainEnvelope(voice, total, options);
  const gains = new Float32Array(total);

  const outroStart = duration - MUSIC_OUTRO_SECONDS;
  const fadeStart = duration - MUSIC_FADE_OUT_SECONDS;

  for (let index = 0; index < total; index++) {
    const time = index / sampleRate;

    // 1. Intro: 80 % → 100 % durante los primeros 3 s.
    const intro =
      time < MUSIC_INTRO_SECONDS
        ? MUSIC_INTRO_START_LEVEL +
          (1 - MUSIC_INTRO_START_LEVEL) * clamp01(time / MUSIC_INTRO_SECONDS)
        : 1;

    // 2. Narración: ducking; en el cierre se desvanece hasta el 100 %.
    let duckLevel = duck[index];
    if (time >= outroStart) {
      const blend = clamp01((time - outroStart) / MUSIC_OUTRO_RAMP_SECONDS);
      duckLevel = duckLevel * (1 - blend) + blend;
    }

    // 3. Cierre: fundido de salida suave en el último segundo.
    let fade = 1;
    if (time >= fadeStart) {
      const progress = clamp01((time - fadeStart) / MUSIC_FADE_OUT_SECONDS);
      fade = 1 - progress * progress * (3 - 2 * progress);
    }

    gains[index] = intro * duckLevel * fade;
  }

  return gains;
}
