// Ajuste de la narración a la duración del proyecto: si el audio es más largo se
// recorta, y si es más corto se rellena con silencio hasta el último cuadro.
import { describe, expect, it } from 'vitest';
import { fitNarrationChannels, NARRATION_CHANNELS } from '../engine/audioTrack';

const SOURCE_RATE = 48000;

function decodedFrom(channels: Float32Array[]) {
  return {
    numberOfChannels: channels.length,
    length: channels[0]?.length ?? 0,
    getChannelData: (channel: number) => channels[channel],
  };
}

describe('fitNarrationChannels', () => {
  it('recorta la narración cuando es más larga que el video', () => {
    const longer = new Float32Array(SOURCE_RATE * 3).fill(0.25);
    const fitted = fitNarrationChannels(decodedFrom([longer]), SOURCE_RATE * 2);

    expect(fitted).toHaveLength(NARRATION_CHANNELS);
    expect(fitted[0]).toHaveLength(SOURCE_RATE * 2);
    expect(fitted[0][0]).toBeCloseTo(0.25, 6);
    expect(fitted[0][SOURCE_RATE * 2 - 1]).toBeCloseTo(0.25, 6);
    // Nada del audio que queda más allá del final del video.
    expect(Array.from(fitted[0]).every((value) => value === 0.25)).toBe(true);
  });

  it('rellena con silencio cuando la narración es más corta que el video', () => {
    const shorter = new Float32Array(SOURCE_RATE / 2).fill(0.5);
    const fitted = fitNarrationChannels(decodedFrom([shorter]), SOURCE_RATE);

    expect(fitted[0]).toHaveLength(SOURCE_RATE);
    expect(fitted[0][0]).toBeCloseTo(0.5, 6);
    expect(fitted[0][SOURCE_RATE / 2 - 1]).toBeCloseTo(0.5, 6);
    expect(fitted[0][SOURCE_RATE / 2]).toBe(0);
    expect(fitted[0][SOURCE_RATE - 1]).toBe(0);
    expect(fitted[0].subarray(SOURCE_RATE / 2).every((value) => value === 0)).toBe(true);
  });

  it('duplica el audio mono a los dos canales del video', () => {
    const mono = new Float32Array(1000);
    for (let index = 0; index < mono.length; index++) mono[index] = index / 1000;

    const fitted = fitNarrationChannels(decodedFrom([mono]), 2000);

    [0, 0.001, 0.002, 0.003, 0.004].forEach((expected, index) => {
      expect(fitted[0][index]).toBeCloseTo(expected, 6);
    });
    expect(Array.from(fitted[1])).toEqual(Array.from(fitted[0]));
  });

  it('mantiene separados los canales cuando la fuente ya es estéreo', () => {
    const left = new Float32Array(1000).fill(0.2);
    const right = new Float32Array(1000).fill(-0.4);

    const fitted = fitNarrationChannels(decodedFrom([left, right]), 1000);

    expect(fitted[0][999]).toBeCloseTo(0.2, 6);
    expect(fitted[1][999]).toBeCloseTo(-0.4, 6);
  });
});
