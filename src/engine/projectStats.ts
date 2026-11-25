// Estadísticas del proyecto para el resumen previo a la exportación (fase 35).
//
// Todos los valores se calculan con los datos reales del proyecto: duración de
// las escenas, palabras del guion (narración y subtítulos), pistas de audio
// activas y la resolución efectiva que usará la exportación en este dispositivo.

import { Project } from '../types';
import { effectiveSettings, isLimitedForMobile } from './capabilities';
import { findMusicAsset, findNarrationAsset, findSfxAsset, sceneNarrationSlots } from './audioTrack';

export interface ProjectStats {
  sceneCount: number;
  durationSeconds: number;
  /** Palabras del guion: narración de las escenas + líneas de subtítulo. */
  wordCount: number;
  narrationWordCount: number;
  subtitleLineCount: number;
  /** Pistas de audio que se mezclarán: voces + música + efectos. */
  audioTrackCount: number;
  audioLabels: string[];
  sceneNarrationCount: number;
  sfxCount: number;
  resolution: { width: number; height: number };
  fps: number;
  totalFrames: number;
  mobileLimited: boolean;
}

export interface ProjectStatsFormat {
  width: number;
  height: number;
  fps: number;
}

/** Cuenta palabras separadas por espacios; ignora espacios sobrantes. */
export function countWords(text: string | undefined | null): number {
  if (!text) return 0;
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

function subtitleTextOf(entry: { text?: string } | string): string {
  return typeof entry === 'string' ? entry : entry.text ?? '';
}

/**
 * Resumen del proyecto. Sin `format` usa los ajustes efectivos del dispositivo
 * (por ejemplo, el recorte a 720p/30 en móvil).
 */
export function computeProjectStats(
  project: Project,
  format?: ProjectStatsFormat
): ProjectStats {
  const scenes = project.script.scenes;
  const settings = effectiveSettings(project);
  const resolution = format
    ? { width: format.width, height: format.height }
    : { width: settings.resolution.width, height: settings.resolution.height };
  const fps = format ? format.fps : settings.fps || 30;

  const durationSeconds = Number(
    scenes.reduce((sum, scene) => sum + (scene.durationSeconds || 0), 0).toFixed(3)
  );

  const narrationWordCount = scenes.reduce(
    (sum, scene) => sum + countWords(scene.narrationText),
    0
  );
  const subtitleWords = scenes.reduce(
    (sum, scene) =>
      sum + (scene.subtitles ?? []).reduce((count, entry) => count + countWords(subtitleTextOf(entry as never)), 0),
    0
  );
  const subtitleLineCount = scenes.reduce((count, scene) => count + (scene.subtitles?.length ?? 0), 0);

  const narrationAsset = findNarrationAsset(project);
  const sceneSlots = sceneNarrationSlots(project);
  const musicAsset = findMusicAsset(project);
  const sfxAssets = scenes
    .map((scene) => ({ scene, asset: findSfxAsset(project, scene.id) }))
    .flatMap((entry) => (entry.asset ? [entry.asset] : []));

  const audioLabels: string[] = [];
  if (sceneSlots.length > 0) {
    sceneSlots.forEach((slot, index) => {
      audioLabels.push(`Voz de la escena ${index + 1}: ${slot.asset.name}`);
    });
  } else if (narrationAsset) {
    audioLabels.push(`Narración: ${narrationAsset.name}`);
  }
  if (musicAsset) audioLabels.push(`Música: ${musicAsset.name}`);
  sfxAssets.forEach((asset) => audioLabels.push(`Efecto: ${asset.name}`));

  return {
    sceneCount: scenes.length,
    durationSeconds,
    wordCount: narrationWordCount + subtitleWords,
    narrationWordCount,
    subtitleLineCount,
    audioTrackCount: audioLabels.length,
    audioLabels,
    sceneNarrationCount: sceneSlots.length,
    sfxCount: sfxAssets.length,
    resolution,
    fps,
    totalFrames: Math.max(0, Math.round(durationSeconds * fps)),
    mobileLimited: isLimitedForMobile(project.settings),
  };
}
