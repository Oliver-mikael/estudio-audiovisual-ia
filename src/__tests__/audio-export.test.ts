import { describe, expect, it } from 'vitest';
import { buildAudioFileName, encodeWav, WAV_BIT_DEPTH, WAV_SAMPLE_RATE } from '../engine/audioExport';
import { Project } from '../types';

const project = (): Project => ({
  id: 'p36',
  title: 'Mi Proyecto: Audio',
  description: '',
  createdAt: 0,
  updatedAt: 0,
  angles: [],
  sources: [],
  mediaAssets: [],
  script: {
    title: 'g',
    summary: '',
    targetAudience: '',
    tone: 'Divulgativo',
    scenes: [
      {
        id: 's1',
        title: 'Una',
        narrationText: 'Texto',
        visualIntent: 'x',
        cameraMotion: 'Static',
        transition: 'Cut',
        durationSeconds: 2,
      },
    ],
  },
  settings: { fps: 30, resolution: { width: 1280, height: 720 }, aspectRatio: '16:9' },
});

describe('exportación de audio WAV (fase 36)', () => {
  it('escribe una cabecera RIFF/WAVE PCM estéreo a 48 kHz y 16 bits', () => {
    const frames = 4800; // 0,1 s
    const left = new Float32Array(frames);
    const right = new Float32Array(frames);
    for (let index = 0; index < frames; index++) {
      left[index] = Math.sin((2 * Math.PI * 1000 * index) / WAV_SAMPLE_RATE) * 0.5;
      right[index] = 0;
    }

    const wav = encodeWav([left, right]);
    const view = new DataView(wav);
    const text = (offset: number, length: number) =>
      String.fromCharCode(...new Uint8Array(wav, offset, length));

    expect(text(0, 4)).toBe('RIFF');
    expect(text(8, 4)).toBe('WAVE');
    expect(text(12, 4)).toBe('fmt ');
    expect(text(36, 4)).toBe('data');
    expect(WAV_SAMPLE_RATE).toBe(48000);
    expect(WAV_BIT_DEPTH).toBe(16);
    expect(view.getUint16(20, true)).toBe(1); // PCM
    expect(view.getUint16(22, true)).toBe(2); // canales
    expect(view.getUint32(24, true)).toBe(48000); // sample rate
    expect(view.getUint32(28, true)).toBe(192000); // bytes por segundo
    expect(view.getUint16(32, true)).toBe(4); // block align
    expect(view.getUint16(34, true)).toBe(16); // bits
    expect(view.getUint32(40, true)).toBe(frames * 4);
    expect(view.getUint32(4, true)).toBe(wav.byteLength - 8);
    expect(wav.byteLength).toBe(44 + frames * 4);
    // 0,1 s exactos de muestras: 4800 / 48000.
    expect((wav.byteLength - 44) / 4 / 48000).toBeCloseTo(0.1, 6);

    // Primera muestra del seno a 1 kHz: sin(0) = 0, la siguiente positiva.
    expect(view.getInt16(44, true)).toBe(0);
    expect(view.getInt16(48, true)).toBeGreaterThan(0);
    // El canal derecho está en silencio.
    expect(view.getInt16(46, true)).toBe(0);
  });

  it('recorta muestras fuera de rango y rellena canales que falten', () => {
    const mono = new Float32Array([2, -2, 0.5]);
    const wav = encodeWav([mono], 48000, 16);
    const view = new DataView(wav);
    expect(view.getUint16(22, true)).toBe(1);
    expect(view.getInt16(44, true)).toBe(32767);
    expect(view.getInt16(46, true)).toBe(-32767);
    expect(view.getInt16(48, true)).toBe(Math.round(0.5 * 32767));

    const stereo = encodeWav([mono, new Float32Array([0, 0, 0, 0])]);
    const stereoView = new DataView(stereo);
    expect(stereoView.getUint32(40, true)).toBe(4 * 4); // 4 tramas estéreo
    expect(stereoView.getInt16(44 + 3 * 4 + 2, true)).toBe(0);
  });

  it('rechaza una profundidad de bits no soportada', () => {
    expect(() => encodeWav([new Float32Array(4)], 48000, 8)).toThrow(/16/);
  });

  it('nombra el archivo con el título saneado y extensión .wav', () => {
    expect(buildAudioFileName(project())).toBe('mi-proyecto-audio-mezcla.wav');
  });
});
