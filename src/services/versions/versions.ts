// Historial de versiones del proyecto (fase 44).
//
// Cada exportación de video guarda una instantánea del proyecto. Se conservan
// como máximo las cinco más recientes: al añadir la sexta se descarta la más
// antigua. La lista va de la más nueva a la más antigua.

import { Project } from '../../types';

export const VERSION_LIMIT = 5;

export interface ProjectVersion {
  id: string;
  projectId: string;
  /** Momento en que se guardó la instantánea. */
  createdAt: number;
  title: string;
  durationSeconds: number;
  sceneCount: number;
  project: Project;
}

/** Duración total del proyecto en segundos, redondeada a dos decimales. */
export function projectDurationOf(project: Project): number {
  return Number(
    project.script.scenes
      .reduce((sum, scene) => sum + (scene.durationSeconds || 0), 0)
      .toFixed(2)
  );
}

/** Crea la instantánea de un proyecto en un momento dado. */
export function createVersionSnapshot(project: Project, now: number = Date.now()): ProjectVersion {
  return {
    id: `version-${now}-${Math.random().toString(36).slice(2, 8)}`,
    projectId: project.id,
    createdAt: now,
    title: project.title,
    durationSeconds: projectDurationOf(project),
    sceneCount: project.script.scenes.length,
    project: structuredCloneSafe(project),
  };
}

/**
 * Copia profunda del proyecto sin tocar los blobs: `structuredClone` los
 * conserva y evita que una instantánea cambie al editar el proyecto actual.
 */
function structuredCloneSafe(project: Project): Project {
  if (typeof structuredClone === 'function') return structuredClone(project);
  return JSON.parse(JSON.stringify(project)) as Project;
}

/** Añade una instantánea delante y recorta a `limit` (rotan las más viejas). */
export function addVersionSnapshot(
  versions: ProjectVersion[],
  snapshot: ProjectVersion,
  limit: number = VERSION_LIMIT
): ProjectVersion[] {
  return [snapshot, ...versions].slice(0, Math.max(1, limit));
}

/** Fecha legible de la instantánea, en español. */
export function formatVersionDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' });
}
