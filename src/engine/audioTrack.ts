// Pista de narración: decodifica el audio importado (MP3/WAV) con decodeAudioData
// y lo entrega como AudioBuffer estéreo de 48 kHz recortado a la duración del proyecto.

import { MediaAsset, Project } from '../types';

export const NARRATION_SAMPLE_RATE = 48000;
export const NARRATION_CHANNELS = 2;

export interface PreparedNarration {
  buffer: AudioBuffer;
  asset: MediaAsset;
}

/**
 * Devuelve el recurso de audio asignado como narración.
 * Si el proyecto no tiene una asignación explícita, se usa el primer audio de la biblioteca.
 */
export function findNarrationAsset(project: Project): MediaAsset | null {
  const assets = project.mediaAssets ?? [];
  if (project.narrationAssetId) {
    return assets.find((asset) => asset.id === project.narrationAssetId && asset.type === 'audio') ?? null;
  }
  return assets.find((asset) => asset.type === 'audio') ?? null;
}

async function readAssetBlob(asset: MediaAsset): Promise<Blob> {
  if (asset.fileBlob) return asset.fileBlob;
  const response = await fetch(asset.url);
  if (!response.ok) {
    throw new Error(`No se pudo leer el archivo de narración "${asset.name}".`);
  }
  return response.blob();
}

/**
 * Decodifica la narración y la mezcla en un AudioBuffer determinista de duración
 * exactamente igual a la del proyecto (silencio al final si el audio es más corto,
 * recorte si es más largo).
 */
export async function prepareNarration(
  project: Project,
  durationSeconds: number
): Promise<PreparedNarration | null> {
  const asset = findNarrationAsset(project);
  if (!asset) return null;

  const encoded = await (await readAssetBlob(asset)).arrayBuffer();
  const frames = Math.max(1, Math.ceil(durationSeconds * NARRATION_SAMPLE_RATE));

  // OfflineAudioContext no requiere gesto del usuario y entrega PCM exacto.
  const offlineCtx = new OfflineAudioContext(NARRATION_CHANNELS, frames, NARRATION_SAMPLE_RATE);

  let decoded: AudioBuffer;
  try {
    decoded = await offlineCtx.decodeAudioData(encoded);
  } catch {
    throw new Error(
      `No se pudo decodificar "${asset.name}". Importa la narración en MP3 o WAV.`
    );
  }

  const source = offlineCtx.createBufferSource();
  source.buffer = decoded;
  source.connect(offlineCtx.destination);
  source.start(0);

  const buffer = await offlineCtx.startRendering();
  return { buffer, asset };
}
