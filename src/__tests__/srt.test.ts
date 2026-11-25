// Exportación .srt: timestamps absolutos de todas las escenas, formato SubRip y
// ventanas individuales de cada subtítulo.
import { describe, expect, it } from 'vitest';
import { createEmptyProject } from '../data/newProject';
import { Scene } from '../types';
import { buildSrt, buildSrtFileName, collectSrtCues, formatSrtTimestamp } from '../engine/srt';

function makeScene(overrides: Partial<Scene> = {}): Scene {
  return {
    id: 'scene-srt',
    title: 'Escena',
    narrationText: 'Narración',
    visualIntent: 'Prueba',
    cameraMotion: 'Static',
    transition: 'Cut',
    durationSeconds: 2,
    ...overrides,
  };
}

describe('srt', () => {
  it('formatea los tiempos como HH:MM:SS,mmm', () => {
    expect(formatSrtTimestamp(0)).toBe('00:00:00,000');
    expect(formatSrtTimestamp(1.5)).toBe('00:00:01,500');
    expect(formatSrtTimestamp(59.9996)).toBe('00:01:00,000');
    expect(formatSrtTimestamp(3661.007)).toBe('01:01:01,007');
    expect(formatSrtTimestamp(-3)).toBe('00:00:00,000');
  });

  it('usa tiempos absolutos de todas las escenas y numera los bloques', () => {
    const project = createEmptyProject('Proyecto con subtítulos');
    project.script.scenes = [
      makeScene({ durationSeconds: 2, subtitles: ['A', 'B'] }),
      makeScene({
        id: 'scene-2',
        durationSeconds: 3,
        subtitles: [{ text: 'C', startSeconds: 1, durationSeconds: 1 }],
      }),
    ];

    expect(collectSrtCues(project)).toEqual([
      { text: 'A', start: 0, end: 1 },
      { text: 'B', start: 1, end: 2 },
      { text: 'C', start: 3, end: 4 },
    ]);

    const srt = buildSrt(project);
    expect(srt).toBe(
      [
        '1',
        '00:00:00,000 --> 00:00:01,000',
        'A',
        '',
        '2',
        '00:00:01,000 --> 00:00:02,000',
        'B',
        '',
        '3',
        '00:00:03,000 --> 00:00:04,000',
        'C',
        '',
      ].join('\n')
    );
  });

  it('omite líneas vacías y ventanas sin duración', () => {
    const project = createEmptyProject('Vacío');
    project.script.scenes = [
      makeScene({
        durationSeconds: 4,
        subtitles: [
          '   ',
          { text: 'Cero', startSeconds: 1, durationSeconds: 0 },
          { text: 'Visible', startSeconds: 2, durationSeconds: 1 },
        ],
      }),
    ];

    expect(collectSrtCues(project)).toEqual([{ text: 'Visible', start: 2, end: 3 }]);
    expect(buildSrt(project)).toContain('00:00:02,000 --> 00:00:03,000');
  });

  it('aplana los saltos de línea y devuelve cadena vacía sin subtítulos', () => {
    const project = createEmptyProject('Sin subtítulos');
    expect(buildSrt(project)).toBe('');

    project.script.scenes = [
      makeScene({ subtitles: [{ text: 'Dos\nlíneas', startSeconds: 0, durationSeconds: 1 }] }),
    ];
    expect(buildSrt(project)).toContain('Dos líneas');
    expect(buildSrt(project)).not.toContain('Dos\nlíneas');
  });

  it('genera un nombre de archivo ASCII terminado en .srt', () => {
    const project = createEmptyProject('Ventanas de Subtítulos: Prueba');
    expect(buildSrtFileName(project)).toBe('ventanas-de-subtitulos-prueba-subtitulos.srt');
  });
});
