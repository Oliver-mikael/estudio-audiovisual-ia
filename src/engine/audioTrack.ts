// Mezcla de audio del proyecto: narración + música de fondo (+ efectos por escena).
//
// Todo se decodifica con decodeAudioData a 48 kHz estéreo y se mezcla en un único
// AudioBuffer determinista de la duración exacta del video. La música baja de
// volumen (ducking) mientras hay voz activa en la narración: la envolvente se
// calcula muestra a muestra a partir del RMS de la voz, con ataque y liberación
// suaves para que no se oiga un escalón.

import { MediaAsset, Project } from '../types';
import { buildTimeline } from './renderEngine';
import { musicAdaptiveGain } from './musicDynamics';

export const AUDIO_SAMPLE_RATE = 48000;
export const AUDIO_CHANNELS = 2;
/** Alias histórico: la exportación sigue hablando de canales de narración. */
export const NARRATION_SAMPLE_RATE = AUDIO_SAMPLE_RATE;
export const NARRATION_CHANNELS = AUDIO_CHANNELS;

/** Ganancia de la música mientras hay narración sonando. */
export const MUSIC_DUCK_LEVEL = 0.3;
export const DEFAULT_MUSIC_VOLUME = 0.6;
export const DEFAULT_SFX_VOLUME = 0.8;
/**
 * RMS de la voz por encima del cual se considera que hay narración activa.
 * Bajo a propósito: una locución con gain staging conservador ronda 0,01–0,03.
 */
export const DUCK_THRESHOLD_RMS = 0.005;
export const DUCK_ATTACK_SECONDS = 0.12;
export const DUCK_RELEASE_SECONDS = 0.4;
const DUCK_WINDOW_SECONDS = 0.01;

export interface PreparedAudio {
  buffer: AudioBuffer;
  narrationAsset: MediaAsset | null;
  /** Voces TTS/importadas asignadas a escenas concretas. */
  sceneNarrationAssets: MediaAsset[];
  musicAsset: MediaAsset | null;
  sfxAssets: MediaAsset[];
}

/**
 * Devuelve el recurso de audio asignado como narración.
 * Si el proyecto no tiene una asignación explícita, se usa el primer audio de la
 * biblioteca que no esté marcado como música de fondo.
 */
export function findNarrationAsset(project: Project): MediaAsset | null {
  const assets = project.mediaAssets ?? [];
  if (project.narrationAssetId) {
    return assets.find((asset) => asset.id === project.narrationAssetId && asset.type === 'audio') ?? null;
  }
  // Una voz generada para una escena no es la narración global del proyecto.
  const sceneNarrationIds = new Set(
    project.script.scenes
      .map((scene) => scene.narrationAssetId)
      .filter((id): id is string => Boolean(id))
  );
  return (
    assets.find(
      (asset) =>
        asset.type === 'audio' &&
        asset.id !== project.musicAssetId &&
        !sceneNarrationIds.has(asset.id)
    ) ?? null
  );
}

/** Devuelve el audio marcado como música de fondo, si lo hay. */
export function findMusicAsset(project: Project): MediaAsset | null {
  const assets = project.mediaAssets ?? [];
  if (!project.musicAssetId) return null;
  return assets.find((asset) => asset.id === project.musicAssetId && asset.type === 'audio') ?? null;
}

/** Devuelve el efecto de sonido asignado a una escena, si lo hay. */
export interface SceneNarrationSlot {
  sceneId: string;
  asset: MediaAsset;
  /** Segundo absoluto del proyecto en el que empieza la escena. */
  start: number;
  /** Duración de la escena: la voz se recorta a esta ventana. */
  duration: number;
}

/** Audio de narración asignado a una escena concreta, si lo hay. */
export function findSceneNarrationAsset(project: Project, sceneId: string): MediaAsset | null {
  const scene = project.script.scenes.find((item) => item.id === sceneId);
  if (!scene?.narrationAssetId) return null;
  return (
    (project.mediaAssets ?? []).find(
      (asset) => asset.id === scene.narrationAssetId && asset.type === 'audio'
    ) ?? null
  );
}

/**
 * Narraciones por escena con su posición exacta en la línea de tiempo. La voz
 * de cada escena empieza al inicio de la escena y no invade la siguiente.
 */
export function sceneNarrationSlots(project: Project): SceneNarrationSlot[] {
  return buildTimeline(project).flatMap((entry) => {
    const asset = findSceneNarrationAsset(project, entry.scene.id);
    if (!asset) return [];
    return [{ sceneId: entry.scene.id, asset, start: entry.start, duration: entry.duration }];
  });
}

/** true si el proyecto tiene cualquier audio (global, por escena, música o SFX). */
export function projectHasAudio(project: Project): boolean {
  if (findNarrationAsset(project) || findMusicAsset(project)) return true;
  if (sceneNarrationSlots(project).length > 0) return true;
  return project.script.scenes.some((scene) => Boolean(scene.sfxAssetId));
}

export function findSfxAsset(project: Project, sceneId: string): MediaAsset | null {
  const scene = project.script.scenes.find((item) => item.id === sceneId);
  if (!scene?.sfxAssetId) return null;
  return (
    (project.mediaAssets ?? []).find(
      (asset) => asset.id === scene.sfxAssetId && asset.type === 'audio'
    ) ?? null
  );
}

/** Volumen general de la música (0 a 1), guardado en los ajustes del proyecto. */
export function musicVolumeFor(project: Project): number {
  const volume = project.settings.musicVolume ?? DEFAULT_MUSIC_VOLUME;
  if (!Number.isFinite(volume)) return DEFAULT_MUSIC_VOLUME;
  return Math.max(0, Math.min(1, volume));
}

/** Estructura mínima de un AudioBuffer ya decodificado. */
export interface DecodedAudioLike {
  numberOfChannels: number;
  length: number;
  getChannelData(channel: number): Float32Array;
}

/**
 * Ajusta el audio decodificado al número exacto de cuadros del proyecto:
 * recorta si es más largo y rellena con silencio si es más corto.
 * Devuelve siempre AUDIO_CHANNELS canales, duplicando el mono si hace falta.
 */
export function fitNarrationChannels(
  decoded: DecodedAudioLike,
  targetFrames: number
): Float32Array[] {
  const frames = Math.max(1, Math.round(targetFrames));
  const sourceChannels = Math.max(1, decoded.numberOfChannels);

  return Array.from({ length: AUDIO_CHANNELS }, (_, channel) => {
    const source = decoded.getChannelData(Math.min(channel, sourceChannels - 1));
    const fitted = new Float32Array(frames);
    fitted.set(source.subarray(0, Math.min(source.length, frames)));
    return fitted;
  });
}

/** Repite el audio en bucle hasta llenar exactamente `targetFrames`. */
export function loopChannels(decoded: DecodedAudioLike, targetFrames: number): Float32Array[] {
  const frames = Math.max(1, Math.round(targetFrames));
  const sourceChannels = Math.max(1, decoded.numberOfChannels);

  return Array.from({ length: AUDIO_CHANNELS }, (_, channel) => {
    const source = decoded.getChannelData(Math.min(channel, sourceChannels - 1));
    const looped = new Float32Array(frames);
    if (source.length === 0) return looped;
    for (let offset = 0; offset < frames; offset += source.length) {
      looped.set(source.subarray(0, Math.min(source.length, frames - offset)), offset);
    }
    return looped;
  });
}

/** Mezcla mono de los canales, para calcular la envolvente de la voz. */
export function monoMix(channels: Float32Array[], frames: number): Float32Array {
  const mono = new Float32Array(frames);
  const channelCount = Math.max(1, channels.length);
  channels.forEach((data) => {
    const length = Math.min(frames, data.length);
    for (let index = 0; index < length; index++) mono[index] += data[index] / channelCount;
  });
  return mono;
}

export interface DuckOptions {
  duckLevel: number;
  thresholdRms: number;
  attackSeconds: number;
  releaseSeconds: number;
  sampleRate: number;
  windowSeconds: number;
}

export const DEFAULT_DUCK_OPTIONS: DuckOptions = {
  duckLevel: MUSIC_DUCK_LEVEL,
  thresholdRms: DUCK_THRESHOLD_RMS,
  attackSeconds: DUCK_ATTACK_SECONDS,
  releaseSeconds: DUCK_RELEASE_SECONDS,
  sampleRate: AUDIO_SAMPLE_RATE,
  windowSeconds: DUCK_WINDOW_SECONDS,
};

/**
 * Ganancia de la música muestra a muestra: 1 sin voz, `duckLevel` con voz.
 * Sin narración devuelve todo unos (nunca hay ducking sin voz).
 */
export function duckGainEnvelope(
  voice: Float32Array | null,
  frames: number,
  options: Partial<DuckOptions> = {}
): Float32Array {
  const settings: DuckOptions = { ...DEFAULT_DUCK_OPTIONS, ...options };
  const total = Math.max(1, Math.round(frames));
  const gains = new Float32Array(total);
  if (!voice || voice.length === 0) {
    gains.fill(1);
    return gains;
  }

  const windowFrames = Math.max(1, Math.round(settings.sampleRate * settings.windowSeconds));
  const windowCount = Math.ceil(total / windowFrames);
  const attackAlpha = 1 - Math.exp(-settings.windowSeconds / Math.max(0.001, settings.attackSeconds));
  const releaseAlpha = 1 - Math.exp(-settings.windowSeconds / Math.max(0.001, settings.releaseSeconds));

  // 1. Ganancia objetivo por ventana (10 ms) con ataque rápido y liberación lenta.
  const windowGains = new Float32Array(windowCount);
  let current = 1;
  for (let windowIndex = 0; windowIndex < windowCount; windowIndex++) {
    const start = windowIndex * windowFrames;
    const end = Math.min(total, start + windowFrames);

    let sumSquares = 0;
    for (let index = start; index < end; index++) sumSquares += voice[index] * voice[index];
    const rms = end > start ? Math.sqrt(sumSquares / (end - start)) : 0;

    const target = rms > settings.thresholdRms ? settings.duckLevel : 1;
    const alpha = target < current ? attackAlpha : releaseAlpha;
    current += (target - current) * alpha;
    windowGains[windowIndex] = current;
  }

  // 2. Interpolación lineal dentro de cada ventana para no oír escalones.
  for (let windowIndex = 0; windowIndex < windowCount; windowIndex++) {
    const start = windowIndex * windowFrames;
    const end = Math.min(total, start + windowFrames);
    const from = windowIndex === 0 ? 1 : windowGains[windowIndex - 1];
    const to = windowGains[windowIndex];
    for (let index = start; index < end; index++) {
      const t = (index - start) / Math.max(1, end - start);
      gains[index] = from + (to - from) * t;
    }
  }

  return gains;
}

async function readAssetBlob(asset: MediaAsset): Promise<Blob> {
  if (asset.fileBlob) return asset.fileBlob;
  const response = await fetch(asset.url);
  if (!response.ok) {
    throw new Error(`No se pudo leer el archivo de audio "${asset.name}".`);
  }
  return response.blob();
}

async function decodeAsset(asset: MediaAsset): Promise<AudioBuffer> {
  const encoded = await (await readAssetBlob(asset)).arrayBuffer();
  // OfflineAudioContext no requiere gesto del usuario y decodifica a 48 kHz.
  const offlineCtx = new OfflineAudioContext(AUDIO_CHANNELS, 1, AUDIO_SAMPLE_RATE);
  try {
    return await offlineCtx.decodeAudioData(encoded);
  } catch {
    throw new Error(`No se pudo decodificar "${asset.name}". Importa el audio en MP3 o WAV.`);
  }
}

function clampSamples(channels: Float32Array[]): void {
  channels.forEach((data) => {
    for (let index = 0; index < data.length; index++) {
      if (data[index] > 1) data[index] = 1;
      else if (data[index] < -1) data[index] = -1;
    }
  });
}

/**
 * Construye la pista de audio final del video:
 * narración (recortada o con silencio), música en bucle con ducking cuando hay
 * voz y cada efecto de sonido al inicio de su escena. Devuelve null si el
 * proyecto no tiene ningún audio asignado.
 */
export async function prepareProjectAudio(
  project: Project,
  durationSeconds: number
): Promise<PreparedAudio | null> {
  const narrationAsset = findNarrationAsset(project);
  const sceneNarrations = sceneNarrationSlots(project);
  const musicAsset = findMusicAsset(project);
  const timeline = buildTimeline(project);
  const sfxEntries = timeline
    .map((entry) => ({ start: entry.start, asset: findSfxAsset(project, entry.scene.id) }))
    .filter((entry): entry is { start: number; asset: MediaAsset } => Boolean(entry.asset));

  if (!narrationAsset && sceneNarrations.length === 0 && !musicAsset && sfxEntries.length === 0) {
    return null;
  }

  const frames = Math.max(1, Math.ceil(durationSeconds * AUDIO_SAMPLE_RATE));
  const mix: Float32Array[] = [
    new Float32Array(frames),
    new Float32Array(frames),
  ];

  // La narración puede ser una pista global o una voz por escena. Si hay voces
  // por escena, cada una suena al inicio de su escena y se recorta a su duración
  // (no se solapan ni duplican la pista global).
  let voiceChannels: Float32Array[] | null = null;
  if (sceneNarrations.length > 0) {
    voiceChannels = [new Float32Array(frames), new Float32Array(frames)];
    const decodedByAsset = new Map<string, AudioBuffer>();

    for (const slot of sceneNarrations) {
      let decoded = decodedByAsset.get(slot.asset.id);
      if (!decoded) {
        decoded = await decodeAsset(slot.asset);
        decodedByAsset.set(slot.asset.id, decoded);
      }

      const startFrame = Math.max(0, Math.round(slot.start * AUDIO_SAMPLE_RATE));
      const slotFrames = Math.max(
        0,
        Math.min(Math.round(slot.duration * AUDIO_SAMPLE_RATE), frames - startFrame)
      );
      if (slotFrames === 0) continue;

      for (let channel = 0; channel < AUDIO_CHANNELS; channel++) {
        const source = decoded.getChannelData(Math.min(channel, decoded.numberOfChannels - 1));
        voiceChannels[channel].set(
          source.subarray(0, Math.min(source.length, slotFrames)),
          startFrame
        );
      }
    }

    voiceChannels.forEach((data, channel) => {
      const target = mix[channel];
      for (let index = 0; index < frames; index++) target[index] += data[index];
    });
  } else if (narrationAsset) {
    voiceChannels = fitNarrationChannels(await decodeAsset(narrationAsset), frames);
    voiceChannels.forEach((data, channel) => {
      const target = mix[channel];
      for (let index = 0; index < frames; index++) target[index] += data[index];
    });
  }

  if (musicAsset) {
    const volume = musicVolumeFor(project);
    const musicChannels = loopChannels(await decodeAsset(musicAsset), frames);
    const voice = voiceChannels ? monoMix(voiceChannels, frames) : null;
    // Curva adaptativa por timestamp: intro al 80 % subiendo, ducking con voz y
    // cierre al 100 % con fundido de salida (fase 25).
    const musicGain = musicAdaptiveGain(voice, frames, durationSeconds);
    musicChannels.forEach((data, channel) => {
      const target = mix[channel];
      for (let index = 0; index < frames; index++) {
        target[index] += data[index] * volume * musicGain[index];
      }
    });
  }

  const decodedSfx = new Map<string, AudioBuffer>();
  for (const entry of sfxEntries) {
    let decoded = decodedSfx.get(entry.asset.id);
    if (!decoded) {
      decoded = await decodeAsset(entry.asset);
      decodedSfx.set(entry.asset.id, decoded);
    }

    const startFrame = Math.max(0, Math.round(entry.start * AUDIO_SAMPLE_RATE));
    const available = Math.max(0, frames - startFrame);
    if (available === 0) continue;
    const gain = DEFAULT_SFX_VOLUME;
    for (let channel = 0; channel < AUDIO_CHANNELS; channel++) {
      const source = decoded.getChannelData(Math.min(channel, decoded.numberOfChannels - 1));
      const target = mix[channel];
      const length = Math.min(available, source.length);
      for (let index = 0; index < length; index++) {
        target[startFrame + index] += source[index] * gain;
      }
    }
  }

  clampSamples(mix);

  const offlineCtx = new OfflineAudioContext(AUDIO_CHANNELS, frames, AUDIO_SAMPLE_RATE);
  const buffer = offlineCtx.createBuffer(AUDIO_CHANNELS, frames, AUDIO_SAMPLE_RATE);
  mix.forEach((data, channel) => buffer.getChannelData(channel).set(data));

  const sceneNarrationAssets = Array.from(
    new Map(sceneNarrations.map((slot) => [slot.asset.id, slot.asset])).values()
  );

  return {
    buffer,
    narrationAsset,
    sceneNarrationAssets,
    musicAsset,
    sfxAssets: sfxEntries.map((entry) => entry.asset),
  };
}
