// Subtítulos editables: cada escena tiene su propia lista, independiente del
// texto de narración, y cada subtítulo ocupa una parte igual de la escena.
import { describe, expect, it } from 'vitest';
import { Scene } from '../types';
import { sceneSubtitles, subtitleAt } from '../engine/renderEngine';

function makeScene(overrides: Partial<Scene> = {}): Scene {
  return {
    id: 'scene-sub',
    title: 'Escena con subtítulos',
    narrationText: 'Narración que no debe generar subtítulos automáticos.',
    visualIntent: 'Prueba',
    cameraMotion: 'Static',
    transition: 'Cut',
    durationSeconds: 4,
    ...overrides,
  };
}

describe('subtitles', () => {
  it('reparte los subtítulos en partes iguales de la duración', () => {
    const scene = makeScene({ subtitles: ['Primero', 'Segundo', 'Tercero'] });

    expect(subtitleAt(scene, 0)?.text).toBe('Primero');
    expect(subtitleAt(scene, 1.2)?.text).toBe('Primero');
    expect(subtitleAt(scene, 1.5)?.text).toBe('Segundo');
    expect(subtitleAt(scene, 3.9)?.text).toBe('Tercero');
    expect(subtitleAt(scene, 5)?.text).toBe('Tercero');
  });

  it('da el inicio y el fin de cada subtítulo en segundos de la escena', () => {
    const scene = makeScene({ subtitles: ['A', 'B'] });

    expect(subtitleAt(scene, 0.5)).toEqual({ index: 0, text: 'A', start: 0, end: 2 });
    expect(subtitleAt(scene, 2.5)).toEqual({ index: 1, text: 'B', start: 2, end: 4 });
  });

  it('no inventa subtítulos a partir de la narración', () => {
    const scene = makeScene({ subtitles: undefined });
    expect(sceneSubtitles(scene)).toEqual([]);
    expect(subtitleAt(scene, 1)).toBeNull();
  });

  it('ignora las líneas vacías o con solo espacios', () => {
    const scene = makeScene({ subtitles: ['Uno', '   ', '', 'Dos'] });
    expect(sceneSubtitles(scene)).toEqual(['Uno', 'Dos']);
    expect(subtitleAt(scene, 3)?.text).toBe('Dos');
  });

  it('no falla con una escena de duración cero', () => {
    const scene = makeScene({ durationSeconds: 0, subtitles: ['Único'] });
    expect(subtitleAt(scene, 0)).toEqual({ index: 0, text: 'Único', start: 0, end: 0 });
  });
});
