// Exportación de solo audio (fase 36).
//
// Mezcla narración + música (+ efectos por escena) con el mismo
// `prepareProjectAudio` que usa el video y escribe un WAV PCM 16 bits a 48 kHz,
// sin pasar por ningún codificador de video.

import { Project } from '../types';
import { AUDIO_CHANNELS, AUDIO_SAMPLE_RATE, prepareProjectAudio } from './audioTrack';
import { projectDurationSeconds } from './exporter';

export const WAV_SAMPLE_RATE = AUDIO_SAMPLE_RATE;
export const WAV_CHANNELS = AUDIO_CHANNELS;
export const WAV_BIT_DEPTH = 16;

export interface ProjectAudioExport {
  blob: Blob;
  fileName: string;
  /** Duración real del AudioBuffer mezclado. */
  durationSeconds: number;
  sampleRate: number;
  channelCount: number;
  sizeBytes: number;
}

/** Cabecera + muestras de un WAV PCM entrelazado (16 bits por defecto). */
export function encodeWav(
  channels: Float32Array[],
  sampleRate: number = WAV_SAMPLE_RATE,
  bitDepth: number = WAV_BIT_DEPTH
): ArrayBuffer {
  const channelCount = Math.max(1, channels.length);
  const frameCount = channels.reduce((max, data) => Math.max(max, data.length), 0);
  const bytesPerSample = bitDepth / 8;
  const blockAlign = channelCount * bytesPerSample;
  const dataBytes = frameCount * blockAlign;
  const buffer = new ArrayBuffer(44 + dataBytes);
  const view = new DataView(buffer);
  const writeText = (offset: number, text: string) => {
    for (let index = 0; index < text.length; index++) {
      view.setUint8(offset + index, text.charCodeAt(index));
    }
  };

  writeText(0, 'RIFF');
  view.setUint32(4, 36 + dataBytes, true);
  writeText(8, 'WAVE');
  writeText(12, 'fmt ');
  view.setUint32(16, 16, true); // tamaño del bloque fmt
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, channelCount, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true); // bytes por segundo
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeText(36, 'data');
  view.setUint32(40, dataBytes, true);

  if (bitDepth === 16) {
    let offset = 44;
    for (let frame = 0; frame < frameCount; frame++) {
      for (let channel = 0; channel < channelCount; channel++) {
        const data = channels[channel] ?? channels[0];
        const sample = data && frame < data.length ? data[frame] : 0;
        const clamped = Math.max(-1, Math.min(1, sample));
        view.setInt16(offset, Math.round(clamped * 32767), true);
        offset += 2;
      }
    }
  } else {
    throw new Error(`Profundidad de bits no soportada: ${bitDepth}. Usa 16.`);
  }

  return buffer;
}

function sanitizeSlug(text: string): string {
  return (
    text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'proyecto'
  );
}

/** Nombre del WAV descargado, derivado del título del proyecto. */
export function buildAudioFileName(project: Project): string {
  return `${sanitizeSlug(project.title)}-mezcla.wav`;
}

/**
 * Mezcla el audio del proyecto y devuelve el WAV listo para descargar. No
 * genera video: usa un `OfflineAudioContext` a 48 kHz (dentro de
 * `prepareProjectAudio`) y escribe las muestras tal cual.
 */
export async function exportProjectAudio(project: Project): Promise<ProjectAudioExport> {
  const durationSeconds = projectDurationSeconds(project);
  if (durationSeconds <= 0) {
    throw new Error('El proyecto no tiene escenas con duración válida.');
  }

  const prepared = await prepareProjectAudio(project, durationSeconds);
  if (!prepared) {
    throw new Error(
      'El proyecto no tiene audio que exportar: asigna narración, música o un efecto de sonido.'
    );
  }

  const buffer = prepared.buffer;
  const channels = Array.from({ length: buffer.numberOfChannels }, (_, channel) =>
    buffer.getChannelData(channel)
  );
  const wav = encodeWav(channels, buffer.sampleRate);
  const blob = new Blob([wav], { type: 'audio/wav' });

  return {
    blob,
    fileName: buildAudioFileName(project),
    durationSeconds: Number(buffer.duration.toFixed(3)),
    sampleRate: buffer.sampleRate,
    channelCount: buffer.numberOfChannels,
    sizeBytes: blob.size,
  };
}
