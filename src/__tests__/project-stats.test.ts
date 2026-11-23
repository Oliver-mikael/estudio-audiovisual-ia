import { describe, expect, it } from 'vitest';
import { computeProjectStats, countWords } from '../engine/projectStats';
import { Project } from '../types';

const asset = (id: string, name: string) => ({
  id,
  name,
  type: 'audio' as const,
  url: `blob:${id}`,
  mimeType: 'audio/mpeg',
  sizeBytes: 10,
  license: 'x',
  provenance: 'x',
  createdAt: 0,
});

const project = (): Project => ({
  id: 'p35',
  title: 'Prueba estadísticas',
  description: '',
  createdAt: 0,
  updatedAt: 0,
  angles: [],
  sources: [],
  mediaAssets: [asset('a1', 'narracion.mp3'), asset('m2', 'musica.mp3'), asset('x3', 'ding.mp3')],
  narrationAssetId: 'a1',
  musicAssetId: 'm2',
  script: {
    title: 'g',
    summary: '',
    targetAudience: '',
    tone: 'Divulgativo',
    scenes: [
      {
        id: 's1',
        title: 'Una',
        narrationText: 'Hola mundo',
        visualIntent: 'x',
        cameraMotion: 'Static',
        transition: 'Cut',
        durationSeconds: 4,
        subtitles: ['Uno dos'],
      },
      {
        id: 's2',
        title: 'Dos',
        narrationText: 'Tres cuatro cinco',
        visualIntent: 'x',
        cameraMotion: 'Static',
        transition: 'Cut',
        durationSeconds: 6,
        subtitles: [{ text: 'Seis' }],
        sfxAssetId: 'x3',
      },
      {
        id: 's3',
        title: 'Tres',
        narrationText: '',
        visualIntent: 'x',
        cameraMotion: 'Static',
        transition: 'Cut',
        durationSeconds: 2,
      },
    ],
  },
  settings: { fps: 30, resolution: { width: 1280, height: 720 }, aspectRatio: '16:9' },
});

describe('estadísticas del proyecto (fase 35)', () => {
  it('cuenta palabras separadas por espacios', () => {
    expect(countWords('  Hola   mundo  ')).toBe(2);
    expect(countWords('')).toBe(0);
    expect(countWords(undefined)).toBe(0);
  });

  it('coincide con la duración, las escenas y las palabras reales del guion', () => {
    const stats = computeProjectStats(project());
    expect(stats.durationSeconds).toBe(12);
    expect(stats.sceneCount).toBe(3);
    expect(stats.wordCount).toBe(8); // 2 + 2 + 3 + 1
    expect(stats.narrationWordCount).toBe(5);
    expect(stats.subtitleLineCount).toBe(2);
  });

  it('cuenta las pistas de audio activas y la resolución de exportación', () => {
    const stats = computeProjectStats(project());
    expect(stats.audioTrackCount).toBe(3); // narración + música + efecto
    expect(stats.audioLabels).toEqual([
      'Narración: narracion.mp3',
      'Música: musica.mp3',
      'Efecto: ding.mp3',
    ]);
    expect(stats.sfxCount).toBe(1);
    expect(stats.resolution).toEqual({ width: 1280, height: 720 });
    expect(stats.fps).toBe(30);
    expect(stats.totalFrames).toBe(360);
  });

  it('usa la resolución real de la exportación cuando se conoce', () => {
    const stats = computeProjectStats(project(), { width: 640, height: 360, fps: 24 });
    expect(stats.resolution).toEqual({ width: 640, height: 360 });
    expect(stats.fps).toBe(24);
    expect(stats.totalFrames).toBe(288);
  });

  it('no inventa audio cuando el proyecto no tiene pistas', () => {
    const value = project();
    value.narrationAssetId = undefined;
    value.musicAssetId = undefined;
    value.mediaAssets = [];
    value.script.scenes[1].sfxAssetId = undefined;
    const stats = computeProjectStats(value);
    expect(stats.audioTrackCount).toBe(0);
    expect(stats.audioLabels).toEqual([]);
  });
});
