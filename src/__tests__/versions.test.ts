import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import {
  VERSION_LIMIT,
  addVersionSnapshot,
  createVersionSnapshot,
  formatVersionDate,
  projectDurationOf,
} from '../services/versions/versions';
import {
  deleteProjectVersions,
  getProjectVersions,
  saveProjectVersions,
} from '../services/storage/db';
import { createEmptyProject } from '../data/newProject';
import { Project } from '../types';

function withScenes(title: string, durations: number[]): Project {
  const project = createEmptyProject(title);
  return {
    ...project,
    script: {
      ...project.script,
      scenes: durations.map((durationSeconds, index) => ({
        id: `s${index}`,
        title: `Escena ${index + 1}`,
        narrationText: '',
        visualIntent: '',
        cameraMotion: 'Static' as const,
        transition: 'Cut' as const,
        durationSeconds,
      })),
    },
  };
}

describe('historial de versiones (fase 44)', () => {
  it('la instantánea guarda título, fecha, duración y escenas', () => {
    const project = withScenes('Versión uno', [4, 6]);
    const snapshot = createVersionSnapshot(project, 1_700_000_000_000);

    expect(snapshot.title).toBe('Versión uno');
    expect(snapshot.durationSeconds).toBe(10);
    expect(snapshot.sceneCount).toBe(2);
    expect(snapshot.createdAt).toBe(1_700_000_000_000);
    expect(snapshot.project.title).toBe('Versión uno');
    expect(projectDurationOf(project)).toBe(10);
    expect(formatVersionDate(snapshot.createdAt)).toContain('2023');
  });

  it('es una copia: editar el proyecto después no cambia la instantánea', () => {
    const project = withScenes('Original', [2]);
    const snapshot = createVersionSnapshot(project, 1);
    project.title = 'Editado';
    project.script.scenes[0].durationSeconds = 99;

    expect(snapshot.title).toBe('Original');
    expect(snapshot.project.title).toBe('Original');
    expect(snapshot.project.script.scenes[0].durationSeconds).toBe(2);
  });

  it('acumula las más nuevas delante y rota a las más antiguas tras 5', () => {
    let versions = [] as ReturnType<typeof createVersionSnapshot>[];
    for (let index = 1; index <= 7; index += 1) {
      versions = addVersionSnapshot(versions, createVersionSnapshot(withScenes(`v${index}`, [index]), index));
    }

    expect(versions).toHaveLength(VERSION_LIMIT);
    expect(versions.map((version) => version.title)).toEqual(['v7', 'v6', 'v5', 'v4', 'v3']);
  });

  it('el límite se puede personalizar', () => {
    const first = createVersionSnapshot(withScenes('a', [1]), 1);
    const second = createVersionSnapshot(withScenes('b', [2]), 2);
    expect(addVersionSnapshot([first], second, 1)).toHaveLength(1);
    expect(addVersionSnapshot([first], second, 1)[0].title).toBe('b');
  });

  it('persiste y recupera las instantáneas en IndexedDB', async () => {
    const project = withScenes('Persistente', [3, 3]);
    const first = createVersionSnapshot(project, 10);
    const second = createVersionSnapshot(project, 20);
    const list = addVersionSnapshot([first], second);

    await saveProjectVersions(project.id, list);
    const stored = await getProjectVersions(project.id);
    expect(stored).toHaveLength(2);
    expect(stored[0].title).toBe('Persistente');
    expect(stored.map((version) => version.createdAt)).toEqual([20, 10]);

    await deleteProjectVersions(project.id);
    expect(await getProjectVersions(project.id)).toEqual([]);
  });
});
