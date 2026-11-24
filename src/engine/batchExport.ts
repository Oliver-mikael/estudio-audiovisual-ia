// Exportación por lotes a un ZIP (fase 46).
//
// Cada proyecto se exporta en secuencia con el mismo exportador de siempre y
// el resultado se empaqueta en un ZIP. Se procesan como máximo BATCH_LIMIT
// proyectos (los más recientes). Un proyecto que falle no cancela el lote: sus
// datos se devuelven en `failures` y el ZIP contiene los que sí se exportaron.

import { Project } from '../types';
import { ExportContainer, buildExportFileName } from './exporter';
import { resolveSceneMediaUrls } from './mediaResolver';

export const BATCH_LIMIT = 5;

export interface BatchFileResult {
  blob: Blob;
  extension: 'webm' | 'mp4';
  durationSeconds: number;
}

export type BatchExporter = (
  project: Project,
  onProgress: (progress: number, message: string) => void
) => Promise<BatchFileResult>;

export interface BatchProgress {
  /** Índice dentro del lote, empezando en 0. */
  index: number;
  total: number;
  projectTitle: string;
  progress: number;
  message: string;
}

export interface BatchEntry {
  projectId: string;
  projectTitle: string;
  fileName: string;
  extension: 'webm' | 'mp4';
  durationSeconds: number;
}

export interface BatchFailure {
  projectTitle: string;
  message: string;
}

export interface BatchExportResult {
  blob: Blob;
  fileName: string;
  entries: BatchEntry[];
  failures: BatchFailure[];
}

export interface BatchExportOptions {
  limit?: number;
  container?: ExportContainer;
  exporter?: BatchExporter;
  onProgress?: (progress: BatchProgress) => void;
  /** Se llama tras añadir cada archivo al ZIP (para registrar métricas, por ejemplo). */
  onFileExported?: (entry: BatchEntry) => void | Promise<void>;
  now?: number;
}

/** Los proyectos más recientes, como máximo `limit` (5 por defecto). */
export function selectBatchProjects(projects: Project[], limit: number = BATCH_LIMIT): Project[] {
  return [...projects]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, Math.max(1, limit));
}

/** Nombre del ZIP con la fecha y hora local, sin caracteres problemáticos. */
export function buildBatchZipName(now: number = Date.now()): string {
  const date = new Date(now);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `estudio-audiovisual-${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(
    date.getHours()
  )}${pad(date.getMinutes())}.zip`;
}

/** Exportador real: carga el módulo de video solo cuando hace falta. */
function createDefaultExporter(container: ExportContainer): BatchExporter {
  return async (project, onProgress) => {
    const { VideoExporter } = await import('./exporter');
    return VideoExporter.exportProjectVideo(project, onProgress, { container });
  };
}

/**
 * Exporta hasta 5 proyectos en secuencia y devuelve un ZIP con los archivos.
 * Los nombres llevan un prefijo numérico para conservar el orden y evitar
 * colisiones entre proyectos con el mismo título.
 */
export async function exportProjectsToZip(
  projects: Project[],
  options: BatchExportOptions = {}
): Promise<BatchExportResult> {
  const {
    limit = BATCH_LIMIT,
    container = 'webm',
    onProgress,
    onFileExported,
    now = Date.now(),
    exporter = createDefaultExporter(container),
  } = options;

  const selected = selectBatchProjects(projects, limit);
  if (selected.length === 0) {
    throw new Error('No hay proyectos guardados que exportar.');
  }

  // JSZip se carga solo al exportar un lote: no pesa en el arranque de la app.
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  const entries: BatchEntry[] = [];
  const failures: BatchFailure[] = [];
  const total = selected.length;

  for (let index = 0; index < selected.length; index += 1) {
    const project = await resolveSceneMediaUrls(selected[index]);
    const report = (progress: number, message: string) =>
      onProgress?.({ index, total, projectTitle: project.title, progress, message });

    report(0, 'Preparando exportación...');

    try {
      const result = await exporter(project, report);
      const fileName = `${String(index + 1).padStart(2, '0')}-${buildExportFileName(
        project,
        result.extension
      )}`;
      zip.file(fileName, result.blob);

      const entry: BatchEntry = {
        projectId: project.id,
        projectTitle: project.title,
        fileName,
        extension: result.extension,
        durationSeconds: result.durationSeconds,
      };
      entries.push(entry);
      await onFileExported?.(entry);
    } catch (error) {
      failures.push({
        projectTitle: project.title,
        message: error instanceof Error ? error.message : 'Error desconocido al exportar.',
      });
    }
  }

  if (entries.length === 0) {
    const reason = failures[0]?.message ?? 'Ningún proyecto se pudo exportar.';
    throw new Error(`El lote no produjo ningún archivo: ${reason}`);
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  return { blob, fileName: buildBatchZipName(now), entries, failures };
}
