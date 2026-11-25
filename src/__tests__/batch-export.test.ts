import { describe, expect, it } from 'vitest';
import JSZip from 'jszip';
import {
  BATCH_LIMIT,
  BatchExporter,
  buildBatchZipName,
  exportProjectsToZip,
  selectBatchProjects,
} from '../engine/batchExport';
import { createEmptyProject } from '../data/newProject';
import { Project } from '../types';

function projectAt(title: string, updatedAt: number): Project {
  const project = createEmptyProject(title);
  return {
    ...project,
    updatedAt,
    script: {
      ...project.script,
      scenes: [
        {
          id: `${project.id}-s1`,
          title: `Escena de ${title}`,
          narrationText: '',
          visualIntent: '',
          cameraMotion: 'Static' as const,
          transition: 'Cut' as const,
          durationSeconds: 2,
        },
      ],
    },
  };
}

const fakeExporter: BatchExporter = async (project) => ({
  blob: new Blob([`video de ${project.title}`], { type: 'video/webm' }),
  extension: 'webm',
  durationSeconds: 2,
});

describe('exportación por lotes (fase 46)', () => {
  it('ordena por más reciente y limita a 5 proyectos', () => {
    const projects = Array.from({ length: 7 }, (_, index) =>
      projectAt(`Proyecto ${index}`, 1_000_000 + index)
    );

    const selected = selectBatchProjects(projects);
    expect(selected).toHaveLength(BATCH_LIMIT);
    expect(selected.map((project) => project.title)).toEqual([
      'Proyecto 6',
      'Proyecto 5',
      'Proyecto 4',
      'Proyecto 3',
      'Proyecto 2',
    ]);
    expect(selectBatchProjects(projects, 2)).toHaveLength(2);
  });

  it('el ZIP contiene un archivo por proyecto con la extensión correcta', async () => {
    const projects = [projectAt('Primero', 3), projectAt('Segundo', 2)];
    const exporter: BatchExporter = async (project) =>
      project.title === 'Primero'
        ? { blob: new Blob(['a'], { type: 'video/webm' }), extension: 'webm', durationSeconds: 2 }
        : { blob: new Blob(['b'], { type: 'video/mp4' }), extension: 'mp4', durationSeconds: 2 };

    const result = await exportProjectsToZip(projects, { exporter, now: 1_700_000_000_000 });

    expect(result.entries).toHaveLength(2);
    expect(result.fileName).toBe(buildBatchZipName(1_700_000_000_000));
    expect(result.fileName).toMatch(/^estudio-audiovisual-\d{8}-\d{4}\.zip$/);

    const zip = await JSZip.loadAsync(await result.blob.arrayBuffer());
    const names = Object.keys(zip.files).filter((name) => !zip.files[name].dir);
    expect(names).toHaveLength(2);
    expect(names[0]).toMatch(/^01-.*\.webm$/);
    expect(names[1]).toMatch(/^02-.*\.mp4$/);
    expect(names.every((name) => /\.(webm|mp4)$/.test(name))).toBe(true);
    expect(result.failures).toEqual([]);
  });

  it('exporta en secuencia, informa del progreso y avisa de cada archivo', async () => {
    const progress: string[] = [];
    const done: string[] = [];
    const exported: string[] = [];
    const exporter: BatchExporter = async (project, onProgress) => {
      exported.push(project.title);
      onProgress(50, 'Mitad');
      return { blob: new Blob(['x']), extension: 'webm', durationSeconds: 2 };
    };

    const result = await exportProjectsToZip([projectAt('A', 2), projectAt('B', 1)], {
      exporter,
      onProgress: (step) => progress.push(`${step.index + 1}/${step.total}:${step.projectTitle}:${step.progress}`),
      onFileExported: (entry) => {
        done.push(entry.fileName);
      },
    });

    expect(exported).toEqual(['A', 'B']);
    expect(progress).toEqual(['1/2:A:0', '1/2:A:50', '2/2:B:0', '2/2:B:50']);
    expect(done).toHaveLength(2);
    expect(result.entries.map((entry) => entry.projectTitle)).toEqual(['A', 'B']);
  });

  it('si un proyecto falla, el ZIP conserva los demás y lo reporta', async () => {
    const exporter: BatchExporter = async (project) => {
      if (project.title === 'Roto') throw new Error('El proyecto no tiene escenas');
      return { blob: new Blob(['ok']), extension: 'webm', durationSeconds: 2 };
    };

    const result = await exportProjectsToZip([projectAt('Roto', 2), projectAt('Bueno', 1)], {
      exporter,
    });

    expect(result.entries).toHaveLength(1);
    expect(result.failures).toEqual([
      { projectTitle: 'Roto', message: 'El proyecto no tiene escenas' },
    ]);
    const zip = await JSZip.loadAsync(await result.blob.arrayBuffer());
    expect(Object.keys(zip.files).filter((name) => !zip.files[name].dir)).toHaveLength(1);
  });

  it('sin proyectos no genera ZIP', async () => {
    await expect(exportProjectsToZip([], { exporter: fakeExporter })).rejects.toThrow(
      'No hay proyectos guardados'
    );
  });
});
