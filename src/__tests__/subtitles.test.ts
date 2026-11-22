// Subtítulos editables: cada escena tiene su propia lista, independiente del
// texto de narración. Cada línea puede tener su propio inicio y duración; si no
// los tiene, se reparte en partes iguales de la escena.
import { describe, expect, it } from 'vitest';
import { Scene } from '../types';
import { sceneSubtitles, subtitleAt, subtitleCues, subtitleSlotDefaults } from '../engine/renderEngine';

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
  it('reparte los subtítulos sin tiempos en partes iguales de la duración', () => {
    const scene = makeScene({ durationSeconds: 6, subtitles: ['Primero', 'Segundo', 'Tercero'] });

    expect(subtitleAt(scene, 0)?.text).toBe('Primero');
    expect(subtitleAt(scene, 1.2)?.text).toBe('Primero');
    expect(subtitleAt(scene, 2.5)?.text).toBe('Segundo');
    expect(subtitleAt(scene, 5.9)?.text).toBe('Tercero');
  });

  it('da el inicio y el fin de cada subtítulo en segundos de la escena', () => {
    const scene = makeScene({ subtitles: ['A', 'B'] });

    expect(subtitleAt(scene, 0.5)).toEqual({ index: 0, text: 'A', start: 0, end: 2 });
    expect(subtitleAt(scene, 2.5)).toEqual({ index: 1, text: 'B', start: 2, end: 4 });
  });

  it('muestra cada subtítulo solo en su ventana de tiempo', () => {
    const scene = makeScene({
      subtitles: [
        { text: 'Entrada', startSeconds: 0.5, durationSeconds: 1 },
        { text: 'Cierre', startSeconds: 2.5, durationSeconds: 1.5 },
      ],
    });

    expect(subtitleAt(scene, 0.2)).toBeNull();
    expect(subtitleAt(scene, 0.5)).toEqual({ index: 0, text: 'Entrada', start: 0.5, end: 1.5 });
    expect(subtitleAt(scene, 1.49)?.text).toBe('Entrada');
    // Hueco entre las dos ventanas: no se dibuja nada.
    expect(subtitleAt(scene, 2)).toBeNull();
    expect(subtitleAt(scene, 2.5)).toEqual({ index: 1, text: 'Cierre', start: 2.5, end: 4 });
    // Fuera de la escena tampoco.
    expect(subtitleAt(scene, 4.2)).toBeNull();
  });

  it('recorta a la duración de la escena los tiempos que se salen', () => {
    const scene = makeScene({
      durationSeconds: 3,
      subtitles: [{ text: 'Larga', startSeconds: 2, durationSeconds: 10 }],
    });

    expect(subtitleCues(scene)[0]).toEqual({ index: 0, text: 'Larga', start: 2, end: 3 });
    expect(subtitleAt(scene, 2.9)?.text).toBe('Larga');
  });

  it('mezcla líneas automáticas y líneas con tiempos propios', () => {
    const scene = makeScene({
      durationSeconds: 6,
      subtitles: ['Automática 1', { text: 'Fija', startSeconds: 4, durationSeconds: 1 }, 'Automática 2'],
    });

    // Las automáticas usan el reparto igual; la fija conserva sus tiempos.
    expect(subtitleSlotDefaults(scene).map((slot) => slot.start)).toEqual([0, 2, 4]);
    expect(subtitleCues(scene).map((cue) => [cue.text, cue.start, cue.end])).toEqual([
      ['Automática 1', 0, 2],
      ['Fija', 4, 5],
      ['Automática 2', 4, 6],
    ]);
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

  it('no muestra nada con una escena de duración cero', () => {
    const scene = makeScene({ durationSeconds: 0, subtitles: ['Único'] });
    expect(subtitleAt(scene, 0)).toBeNull();
    expect(subtitleCues(scene)).toEqual([{ index: 0, text: 'Único', start: 0, end: 0 }]);
  });
});
