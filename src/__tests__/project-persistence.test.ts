// Persistencia real: crea un proyecto con una escena, lo guarda en IndexedDB
// (implementación en memoria de fake-indexeddb), recarga el módulo de
// almacenamiento como haría una recarga de la app y lo recupera.
import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createEmptyProject } from '../data/newProject';
import { Project, Scene } from '../types';
import {
  deleteProjectFromStorage,
  getAllProjectsFromStorage,
  getProjectFromStorage,
  saveProjectToStorage,
} from '../services/storage/db';

function makeScene(overrides: Partial<Scene> = {}): Scene {
  return {
    id: 'scene-persist-1',
    title: 'Escena persistente',
    narrationText: 'Esta escena comprueba la persistencia real en IndexedDB.',
    visualIntent: 'Gráfico de prueba',
    cameraMotion: 'Static',
    transition: 'Fade',
    durationSeconds: 4,
    subtitles: ['Esta escena comprueba la persistencia real en IndexedDB.'],
    ...overrides,
  };
}

async function clearProjects(): Promise<void> {
  const stored: Project[] = await getAllProjectsFromStorage();
  await Promise.all(stored.map((project) => deleteProjectFromStorage(project.id)));
}

describe('Persistencia de proyectos en IndexedDB', () => {
  beforeEach(async () => {
    await clearProjects();
  });

  it('guarda un proyecto con su escena y lo recupera tras recargar el módulo', async () => {
    const project = createEmptyProject('Proyecto persistente');
    project.script.scenes.push(makeScene());
    await saveProjectToStorage(project);

    // Simula recargar la app: el módulo de almacenamiento se evalúa de nuevo.
    vi.resetModules();
    const reloadedDb = await import('../services/storage/db');
    const reloaded = await reloadedDb.getProjectFromStorage(project.id);

    expect(reloaded).not.toBeNull();
    expect(reloaded?.id).toBe(project.id);
    expect(reloaded?.title).toBe('Proyecto persistente');
    expect(reloaded?.script.scenes).toHaveLength(1);
    expect(reloaded?.script.scenes[0].title).toBe('Escena persistente');
    expect(reloaded?.script.scenes[0].narrationText).toContain('persistencia real');
    expect(reloaded?.script.scenes[0].durationSeconds).toBe(4);
    expect(reloaded?.updatedAt).toBeGreaterThanOrEqual(project.createdAt);
  });

  it('mantiene varias escenas y su orden al guardar y volver a leer', async () => {
    const project = createEmptyProject('Proyecto con varias escenas');
    project.script.scenes.push(
      makeScene({ id: 'a', title: 'Primera', durationSeconds: 3 }),
      makeScene({ id: 'b', title: 'Segunda', durationSeconds: 2, transition: 'Cut' })
    );
    await saveProjectToStorage(project);

    const reloaded = await getProjectFromStorage(project.id);

    expect(reloaded?.script.scenes.map((scene) => scene.title)).toEqual(['Primera', 'Segunda']);
    expect(reloaded?.script.scenes.map((scene) => scene.durationSeconds)).toEqual([3, 2]);
  });
});
