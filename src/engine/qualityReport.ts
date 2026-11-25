// Reporte de calidad del video antes de exportar (fase 40).
//
// Analiza el proyecto y devuelve cuatro comprobaciones con su estado: imágenes
// por escena, duración mínima, narración activa y música de fondo. Ninguna
// bloquea la exportación: son advertencias para que el autor decida.

import { Project } from '../types';
import { findMusicAsset, findNarrationAsset, sceneNarrationSlots } from './audioTrack';

/** Por debajo de esta duración el video se considera demasiado corto. */
export const MIN_DURATION_SECONDS = 10;

export type QualityCheckId = 'images' | 'duration' | 'narration' | 'music';

export interface QualityCheck {
  id: QualityCheckId;
  /** true = ✅, false = ⚠️ */
  ok: boolean;
  label: string;
  message: string;
}

export interface QualityReport {
  checks: QualityCheck[];
  warningCount: number;
  allOk: boolean;
  durationSeconds: number;
  scenesWithoutImage: number;
}

function hasVisual(scene: Project['script']['scenes'][number]): boolean {
  return Boolean(scene.imageAssetId || scene.imageUrl || scene.videoAssetId || scene.videoUrl);
}

/** Escenas que se exportarán solo con color sólido por falta de imagen o clip. */
export function scenesWithoutImage(project: Project): { id: string; title: string }[] {
  return project.script.scenes
    .filter((scene) => !hasVisual(scene))
    .map((scene) => ({ id: scene.id, title: scene.title || scene.id }));
}

function formatSeconds(seconds: number): string {
  return `${seconds.toFixed(2).replace('.', ',')} s`;
}

export function buildQualityReport(project: Project): QualityReport {
  const scenes = project.script.scenes;
  const durationSeconds = Number(
    scenes.reduce((sum, scene) => sum + (scene.durationSeconds || 0), 0).toFixed(3)
  );
  const missing = scenesWithoutImage(project);
  const narrationAsset = findNarrationAsset(project);
  const sceneNarrations = sceneNarrationSlots(project);
  const musicAsset = findMusicAsset(project);

  const checks: QualityCheck[] = [
    {
      id: 'images',
      ok: missing.length === 0 && scenes.length > 0,
      label: 'Imágenes de las escenas',
      message:
        scenes.length === 0
          ? 'El proyecto no tiene escenas todavía.'
          : missing.length === 0
            ? `Las ${scenes.length} escenas tienen imagen o clip asignado.`
            : `${missing.length} de ${scenes.length} escena(s) sin imagen: ${missing
                .map((scene) => scene.title)
                .join(', ')}.`,
    },
    {
      id: 'duration',
      ok: durationSeconds >= MIN_DURATION_SECONDS,
      label: 'Duración total',
      message:
        durationSeconds >= MIN_DURATION_SECONDS
          ? `${formatSeconds(durationSeconds)} (mínimo recomendado: ${MIN_DURATION_SECONDS} s).`
          : `${formatSeconds(durationSeconds)}, por debajo de los ${MIN_DURATION_SECONDS} s recomendados.`,
    },
    {
      id: 'narration',
      ok: Boolean(narrationAsset) || sceneNarrations.length > 0,
      label: 'Narración',
      message: sceneNarrations.length > 0
        ? `${sceneNarrations.length} voz(es) de escena asignadas.`
        : narrationAsset
          ? `Narración activa: ${narrationAsset.name}.`
          : 'No hay narración activa: el video saldrá sin voz.',
    },
    {
      id: 'music',
      ok: Boolean(musicAsset),
      label: 'Música de fondo',
      message: musicAsset
        ? `Música activa: ${musicAsset.name}.`
        : 'No hay música de fondo asignada.',
    },
  ];

  const warningCount = checks.filter((check) => !check.ok).length;

  return {
    checks,
    warningCount,
    allOk: warningCount === 0,
    durationSeconds,
    scenesWithoutImage: missing.length,
  };
}
