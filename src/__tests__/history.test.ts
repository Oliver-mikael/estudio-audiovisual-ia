// Historial de deshacer/rehacer: deshacer un borrado de escena devuelve la
// escena con su contenido original, rehacer lo vuelve a quitar y el historial
// se queda en 50 pasos.
import { describe, expect, it } from 'vitest';
import {
  HISTORY_LIMIT,
  canRedo,
  canUndo,
  createHistory,
  pushHistory,
  redo,
  undo,
} from '../services/history/history';
import { createEmptyProject } from '../data/newProject';
import { Project, Scene } from '../types';

function makeScene(overrides: Partial<Scene> = {}): Scene {
  return {
    id: 'scene-a',
    title: 'Escena A',
    narrationText: 'Narración de la escena A.',
    visualIntent: 'Intención visual A',
    cameraMotion: 'Static',
    transition: 'Fade',
    durationSeconds: 3,
    subtitles: ['Subtítulo A'],
    ...overrides,
  };
}

function projectWithScenes(): Project {
  const project = createEmptyProject('Proyecto con historial');
  project.script.scenes = [
    makeScene(),
    makeScene({
      id: 'scene-b',
      title: 'Escena B original',
      narrationText: 'Texto que no debe perderse al deshacer el borrado.',
      durationSeconds: 5,
      transition: 'Slide',
      subtitles: ['Primer subtítulo de B', 'Segundo subtítulo de B'],
      sfxAssetId: 'asset-sfx',
    }),
  ];
  return project;
}

function deleteSceneB(project: Project): Project {
  return {
    ...project,
    script: {
      ...project.script,
      scenes: project.script.scenes.filter((scene) => scene.id !== 'scene-b'),
    },
  };
}

describe('historial de deshacer/rehacer', () => {
  it('deshacer un borrado de escena la restaura con su contenido original', () => {
    const original = projectWithScenes();
    const originalB = original.script.scenes[1];

    let history = pushHistory(createHistory(original), deleteSceneB(original));
    expect(history.present.script.scenes.map((scene) => scene.id)).toEqual(['scene-a']);
    expect(canUndo(history)).toBe(true);

    history = undo(history);

    const restored = history.present.script.scenes.find((scene) => scene.id === 'scene-b');
    expect(restored).toEqual(originalB);
    expect(restored?.title).toBe('Escena B original');
    expect(restored?.narrationText).toContain('no debe perderse');
    expect(restored?.subtitles).toEqual(['Primer subtítulo de B', 'Segundo subtítulo de B']);
    expect(history.present.script.scenes).toHaveLength(2);
    expect(canUndo(history)).toBe(false);
    expect(canRedo(history)).toBe(true);
  });

  it('rehacer vuelve a aplicar el borrado', () => {
    const original = projectWithScenes();
    let history = pushHistory(createHistory(original), deleteSceneB(original));
    history = undo(history);
    history = redo(history);

    expect(history.present.script.scenes.map((scene) => scene.id)).toEqual(['scene-a']);
    expect(canUndo(history)).toBe(true);
    expect(canRedo(history)).toBe(false);
  });

  it('guarda como máximo 50 pasos', () => {
    let history = createHistory(0);
    for (let value = 1; value <= 60; value++) history = pushHistory(history, value);

    expect(history.past).toHaveLength(HISTORY_LIMIT);
    expect(history.present).toBe(60);

    for (let step = 0; step < HISTORY_LIMIT; step++) history = undo(history);
    expect(history.present).toBe(10);
    expect(history.past).toHaveLength(0);
  });

  it('una acción nueva descarta los rehaceres pendientes', () => {
    let history = pushHistory(createHistory('a'), 'b');
    history = pushHistory(history, 'c');
    history = undo(history);
    expect(canRedo(history)).toBe(true);

    history = pushHistory(history, 'd');
    expect(history.present).toBe('d');
    expect(canRedo(history)).toBe(false);
  });

  it('deshacer sin historial no cambia el estado', () => {
    const history = createHistory('único');
    expect(undo(history)).toBe(history);
    expect(redo(history)).toBe(history);
  });
});
