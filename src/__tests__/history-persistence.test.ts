// Historial persistente: guarda proyecto + historial en IndexedDB, recarga el
// módulo de almacenamiento como haría una recarga de la app y comprueba que el
// historial disponible sigue deshaciendo la última acción.
import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createEmptyProject } from '../data/newProject';
import { Project, Scene } from '../types';
import {
  deleteHistoryFromStorage,
  getHistoryFromStorage,
  saveHistoryToStorage,
  saveProjectToStorage,
} from '../services/storage/db';
import {
  HISTORY_LIMIT,
  HistoryState,
  createHistory,
  pushHistory,
  undo,
} from '../services/history/history';

function makeScene(overrides: Partial<Scene> = {}): Scene {
  return {
    id: 'scene-a',
    title: 'Escena A',
    narrationText: 'Narración A.',
    visualIntent: 'Intención A',
    cameraMotion: 'Static',
    transition: 'Fade',
    durationSeconds: 3,
    subtitles: ['Subtítulo A'],
    ...overrides,
  };
}

function projectWithScenes(): Project {
  const project = createEmptyProject('Proyecto con historial persistente');
  project.script.scenes = [
    makeScene(),
    makeScene({
      id: 'scene-b',
      title: 'Escena B antes de borrar',
      narrationText: 'Contenido que debe sobrevivir al deshacer.',
      durationSeconds: 5,
      subtitles: [{ text: 'Sub B', startSeconds: 1, durationSeconds: 2 }],
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

async function clearHistory(projects: Project[]): Promise<void> {
  await Promise.all(projects.map((project) => deleteHistoryFromStorage(project.id)));
}

describe('Historial persistente en IndexedDB', () => {
  beforeEach(async () => {
    const { getAllProjectsFromStorage, deleteProjectFromStorage } = await import(
      '../services/storage/db'
    );
    const stored = await getAllProjectsFromStorage();
    await clearHistory(stored);
    await Promise.all(stored.map((project) => deleteProjectFromStorage(project.id)));
  });

  it('restaura el historial tras recargar el módulo y Ctrl+Z deshace la acción guardada', async () => {
    const project = projectWithScenes();
    await saveProjectToStorage(project);

    const beforeDelete = createHistory(project);
    const afterDelete = pushHistory(beforeDelete, deleteSceneB(project));
    // El autoguardado de la app guarda el estado con la escena ya borrada.
    await saveProjectToStorage(afterDelete.present);
    await saveHistoryToStorage(project.id, afterDelete);

    // Simula recargar la app: el módulo de almacenamiento se evalúa de nuevo.
    vi.resetModules();
    const reloadedDb = await import('../services/storage/db');
    const reloadedProject = await reloadedDb.getProjectFromStorage(project.id);
    const reloadedHistory = await reloadedDb.getHistoryFromStorage(project.id);

    expect(reloadedProject?.script.scenes).toHaveLength(1);
    expect(reloadedHistory).not.toBeNull();
    expect(reloadedHistory?.present.script.scenes.map((scene) => scene.id)).toEqual(['scene-a']);
    expect(reloadedHistory?.past).toHaveLength(1);

    // Lo que hace Ctrl+Z con ese historial restaurado.
    const restored = undo(reloadedHistory as HistoryState<Project>);
    const sceneB = restored.present.script.scenes.find((scene) => scene.id === 'scene-b');

    expect(restored.present.script.scenes).toHaveLength(2);
    expect(sceneB?.title).toBe('Escena B antes de borrar');
    expect(sceneB?.narrationText).toContain('debe sobrevivir');
    expect(sceneB?.subtitles).toEqual([{ text: 'Sub B', startSeconds: 1, durationSeconds: 2 }]);
    expect(sceneB?.sfxAssetId).toBe('asset-sfx');
  });

  it('persiste como máximo 50 pasos por lado', async () => {
    const project = createEmptyProject('Historial largo');
    project.script.scenes = [makeScene()];
    await saveProjectToStorage(project);

    // El historial real guarda proyectos; aquí se comprueba el recorte del registro.
    await saveHistoryToStorage(project.id, {
      past: Array.from({ length: 60 }, () => project),
      present: project,
      future: Array.from({ length: 60 }, () => project),
    });

    const stored = await getHistoryFromStorage(project.id);
    expect(stored?.past).toHaveLength(HISTORY_LIMIT);
    expect(stored?.future).toHaveLength(HISTORY_LIMIT);
  });

  it('borra el historial junto con el proyecto', async () => {
    const project = createEmptyProject('Proyecto borrado');
    project.script.scenes = [makeScene()];
    await saveProjectToStorage(project);
    await saveHistoryToStorage(project.id, pushHistory(createHistory(project), deleteSceneB(project)));

    expect(await getHistoryFromStorage(project.id)).not.toBeNull();
    await deleteHistoryFromStorage(project.id);
    expect(await getHistoryFromStorage(project.id)).toBeNull();
  });
});
