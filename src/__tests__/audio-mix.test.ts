// Mezcla de música con ducking: la música baja al 30 % mientras hay voz y vuelve
// a su volumen cuando la narración calla. También se comprueba el bucle de la
// música y el volumen general guardado en los ajustes.
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_MUSIC_VOLUME,
  MUSIC_DUCK_LEVEL,
  duckGainEnvelope,
  loopChannels,
  monoMix,
  musicVolumeFor,
} from '../engine/audioTrack';
import { createEmptyProject } from '../data/newProject';

const SAMPLE_RATE = 48000;

function voiceWithSilence(): Float32Array {
  const frames = Math.round(SAMPLE_RATE * 1.5);
  const voice = new Float32Array(frames);
  // 0,4 s de voz y luego silencio.
  for (let index = 0; index < Math.round(SAMPLE_RATE * 0.4); index++) {
    voice[index] = 0.3 * Math.sin((2 * Math.PI * 1000 * index) / SAMPLE_RATE);
  }
  return voice;
}

describe('duckGainEnvelope', () => {
  it('baja la música al 30 % con voz y la recupera en el silencio', () => {
    const gains = duckGainEnvelope(voiceWithSilence(), Math.round(SAMPLE_RATE * 1.5));

    expect(gains).toHaveLength(Math.round(SAMPLE_RATE * 1.5));
    // 0,3 s de voz sostenida: ya está atenuada.
    expect(gains[Math.round(SAMPLE_RATE * 0.3)]).toBeLessThan(0.4);
    expect(gains[Math.round(SAMPLE_RATE * 0.3)]).toBeGreaterThan(MUSIC_DUCK_LEVEL - 0.02);
    // 1,4 s: un segundo sin voz, la ganancia vuelve casi a 1.
    expect(gains[Math.round(SAMPLE_RATE * 1.4)]).toBeGreaterThan(0.9);
    // Nunca pasa de 1 ni baja del nivel de ducking.
    expect(Math.max(...Array.from(gains))).toBeLessThanOrEqual(1);
    expect(Math.min(...Array.from(gains))).toBeGreaterThanOrEqual(MUSIC_DUCK_LEVEL - 0.02);
  });

  it('sin narración no hay ducking: la música suena a ganancia 1', () => {
    const gains = duckGainEnvelope(null, 1000);
    expect(Array.from(gains).every((value) => value === 1)).toBe(true);
  });
});

describe('loopChannels', () => {
  it('repite el audio corto hasta llenar la duración del video', () => {
    const music = new Float32Array([0.1, 0.2, 0.3]);
    const looped = loopChannels(
      { numberOfChannels: 1, length: music.length, getChannelData: () => music },
      8
    );

    expect(looped[0]).toHaveLength(8);
    expect(Array.from(looped[0]).map((value) => Number(value.toFixed(2)))).toEqual([
      0.1, 0.2, 0.3, 0.1, 0.2, 0.3, 0.1, 0.2,
    ]);
    expect(Array.from(looped[1])).toEqual(Array.from(looped[0]));
  });
});

describe('musicVolumeFor', () => {
  it('usa el volumen de los ajustes y recorta fuera de rango', () => {
    const project = createEmptyProject('Volumen');
    expect(musicVolumeFor(project)).toBe(DEFAULT_MUSIC_VOLUME);

    project.settings.musicVolume = 0.25;
    expect(musicVolumeFor(project)).toBe(0.25);

    project.settings.musicVolume = 2;
    expect(musicVolumeFor(project)).toBe(1);

    project.settings.musicVolume = Number.NaN;
    expect(musicVolumeFor(project)).toBe(DEFAULT_MUSIC_VOLUME);
  });
});

describe('monoMix', () => {
  it('promedia los canales de la voz', () => {
    const mono = monoMix([new Float32Array([1, 0]), new Float32Array([0, 1])], 2);
    expect(mono[0]).toBeCloseTo(0.5, 6);
    expect(mono[1]).toBeCloseTo(0.5, 6);
  });
});
