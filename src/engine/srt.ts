// Exportación de subtítulos en formato SubRip (.srt).
//
// Toma la lista de subtítulos de cada escena (con sus ventanas de tiempo) y la
// línea de tiempo del proyecto, y produce un .srt con timestamps absolutos, de
// modo que se pueda cargar junto al video exportado en VLC o ffmpeg.

import { Project } from '../types';
import { buildTimeline, subtitleCues } from './renderEngine';

function pad(value: number, length: number): string {
  return String(Math.floor(value)).padStart(length, '0');
}

/** Formatea segundos como `HH:MM:SS,mmm`, el formato de tiempo de SubRip. */
export function formatSrtTimestamp(seconds: number): string {
  const safe = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  const totalMs = Math.round(safe * 1000);
  const milliseconds = totalMs % 1000;
  const totalSeconds = Math.floor(totalMs / 1000);
  const secs = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const hours = Math.floor(totalSeconds / 3600);

  return `${pad(hours, 2)}:${pad(minutes, 2)}:${pad(secs, 2)},${pad(milliseconds, 3)}`;
}

/** Todas las entradas que se escribirían en el .srt, con tiempos absolutos. */
export function collectSrtCues(project: Project): { text: string; start: number; end: number }[] {
  const cues: { text: string; start: number; end: number }[] = [];

  for (const entry of buildTimeline(project)) {
    for (const cue of subtitleCues(entry.scene)) {
      const start = entry.start + cue.start;
      const end = entry.start + cue.end;
      if (end <= start) continue;
      // SubRip es una línea de texto por bloque: los saltos internos se aplanan.
      const text = cue.text.replace(/\s*\n+\s*/g, ' ').replace(/\r/g, '').trim();
      if (!text) continue;
      cues.push({ text, start, end });
    }
  }

  return cues;
}

/** Contenido completo del .srt, o cadena vacía si el proyecto no tiene subtítulos. */
export function buildSrt(project: Project): string {
  const cues = collectSrtCues(project);
  if (cues.length === 0) return '';

  const blocks = cues.map((cue, index) => {
    return [
      String(index + 1),
      `${formatSrtTimestamp(cue.start)} --> ${formatSrtTimestamp(cue.end)}`,
      cue.text,
    ].join('\n');
  });

  return `${blocks.join('\n\n')}\n`;
}

/** Nombre de archivo seguro para el .srt, derivado del título del proyecto. */
export function buildSrtFileName(project: Project): string {
  const slug =
    project.title
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'video';
  return `${slug}-subtitulos.srt`;
}
