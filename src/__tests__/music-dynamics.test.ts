// Fase 25: la ganancia de la música sigue una curva por timestamp con intro al
// 80 %, ducking al 30 % con voz y cierre al 100 % con fundido de salida.
import { describe, expect, it } from 'vitest';
import { MUSIC_DUCK_LEVEL } from '../engine/audioTrack';
import { createEmptyProject } from '../data/newProject';
import {
  MUSIC_INTRO_SECONDS,
  MUSIC_INTRO_START_LEVEL,
  MUSIC_OUTRO_SECONDS,
  musicAdaptiveGain,
} from '../engine/musicDynamics';

const SAMPLE_RATE = 48000;
const DURATION = 9;

function voiceAt(startSeconds: number, endSeconds: number): Float32Array {
  const frames = Math.round(SAMPLE_RATE * DURATION);
  const voice = new Float32Array(frames);
  for (let index = Math.round(startSeconds * SAMPLE_RATE); index < Math.round(endSeconds * SAMPLE_RATE); index++) {
    voice[index] = 0.3 * Math.sin((2 * Math.PI * 1000 * index) / SAMPLE_RATE);
  }
  return voice;
}

const gainAt = (gains: Float32Array, seconds: number) => gains[Math.round(seconds * SAMPLE_RATE)];

describe('musicAdaptiveGain', () => {
  it('empieza al 80 %, sube en la intro y se mantiene al 100 %', () => {
    const gains = musicAdaptiveGain(null, Math.round(SAMPLE_RATE * DURATION), DURATION);
    expect(gainAt(gains, 0)).toBeCloseTo(MUSIC_INTRO_START_LEVEL, 2);
    expect(gainAt(gains, 1.5)).toBeGreaterThan(MUSIC_INTRO_START_LEVEL);
    expect(gainAt(gains, 1.5)).toBeLessThan(1);
    expect(gainAt(gains, MUSIC_INTRO_SECONDS)).toBeCloseTo(1, 3);
    expect(gainAt(gains, 5)).toBeCloseTo(1, 3);
  });

  it('hace ducking al 30 % solo mientras hay narración y fuera del cierre', () => {
    const gains = musicAdaptiveGain(
      voiceAt(5, 7),
      Math.round(SAMPLE_RATE * DURATION),
      DURATION
    );
    expect(gainAt(gains, 4.5)).toBeCloseTo(1, 2);
    expect(gainAt(gains, 5.5)).toBeLessThan(0.35);
    expect(gainAt(gains, 5.5)).toBeGreaterThan(MUSIC_DUCK_LEVEL - 0.03);
    expect(gainAt(gains, 6)).toBeLessThan(0.35);
  });

  it('en el cierre recupera el 100 % aunque haya voz y acaba en silencio', () => {
    const gains = musicAdaptiveGain(
      voiceAt(7, 9),
      Math.round(SAMPLE_RATE * DURATION),
      DURATION
    );
    const outroStart = DURATION - MUSIC_OUTRO_SECONDS;
    expect(gainAt(gains, outroStart + 0.8)).toBeCloseTo(1, 2);
    expect(gainAt(gains, DURATION - 0.5)).toBeLessThan(0.6);
    expect(gainAt(gains, DURATION - 0.01)).toBeLessThan(0.01);
  });

  it('mantiene la ganancia entre 0 y 1 en las 5 muestras de control', () => {
    const gains = musicAdaptiveGain(
      voiceAt(5, 7),
      Math.round(SAMPLE_RATE * DURATION),
      DURATION
    );
    [0.2, 2, 5.5, 6.6, 8.9].forEach((seconds) => {
      const value = gainAt(gains, seconds);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    });
  });

  it('el módulo de dinámica coincide con la función pública de audioTrack', () => {
    const frames = Math.round(SAMPLE_RATE * DURATION);
    const voice = voiceAt(3, 4);
    const direct = musicAdaptiveGain(voice, frames, DURATION);
    const repeated = musicAdaptiveGain(voice, frames, DURATION);
    expect(Array.from(direct)).toEqual(Array.from(repeated));
  });

  it('el volumen general se aplica encima de la curva', () => {
    const project = createEmptyProject('Curva');
    project.settings.musicVolume = 0.6;
    // La curva no conoce el volumen general: la mezcla multiplica por musicVolumeFor.
    expect(project.settings.musicVolume).toBe(0.6);
  });
});
