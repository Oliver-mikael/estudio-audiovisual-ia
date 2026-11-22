// Exportador determinista: cada cuadro se renderiza y codifica con WebCodecs
// (VideoEncoder + AudioEncoder) y se empaqueta en WebM con webm-muxer.
// No se genera ningún tono sintético: la pista de audio es la mezcla de los
// archivos importados (narración, música de fondo y efectos de escena).
// Si WebCodecs no está disponible, se usa MediaRecorder con captureStream(0) + requestFrame
// como respaldo, manteniendo esa misma mezcla real.

import { ArrayBufferTarget, Muxer } from 'webm-muxer';
import { Project } from '../types';
import { CanvasRenderEngine } from './renderEngine';
import {
  NARRATION_CHANNELS,
  NARRATION_SAMPLE_RATE,
  PreparedAudio,
  prepareProjectAudio,
} from './audioTrack';
import { effectiveSettings, isLimitedForMobile } from './capabilities';
import { resolveSceneMediaUrls } from './mediaResolver';

export interface ExportProgressCallback {
  (progress: number, statusMessage: string): void;
}

export interface VideoExportResult {
  blob: Blob;
  mimeType: string;
  /** Extensión real que debe llevar el archivo descargado. */
  extension: 'webm' | 'mp4';
  durationSeconds: number;
  totalFrames: number;
  /** true = exportación cuadro por cuadro con WebCodecs; false = respaldo MediaRecorder. */
  usedWebCodecs: boolean;
  narrationAssetName: string | null;
  /** Nombre de la música de fondo mezclada, o null si no hay. */
  musicAssetName: string | null;
  /** Nombres de los efectos de sonido mezclados (uno por escena). */
  sfxAssetNames: string[];
  /** Ajustes realmente usados (pueden estar limitados en móvil). */
  width: number;
  height: number;
  fps: number;
}

interface VideoCodecPlan {
  encoderCodec: string;
  muxerCodec: 'V_VP9' | 'V_VP8';
}

const VIDEO_BITRATE = 2_500_000;
const AUDIO_BITRATE = 128_000;
const AUDIO_CHUNK_FRAMES = 960; // 20 ms @ 48 kHz

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function projectDurationSeconds(project: Project): number {
  return project.script.scenes.reduce((sum, scene) => sum + scene.durationSeconds, 0);
}

/** Deriva la extensión del archivo desde el MIME real del blob exportado. */
export function extensionForMimeType(mimeType: string): 'webm' | 'mp4' {
  return mimeType.toLowerCase().includes('mp4') ? 'mp4' : 'webm';
}

/**
 * Nombre de archivo seguro: sin acentos ni caracteres que el navegador descarta
 * (por ejemplo ":"), y siempre terminado en la extensión real del archivo.
 */
export function buildExportFileName(project: Project, extension: 'webm' | 'mp4'): string {
  const slug =
    project.title
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'video';
  return `${slug}-${project.settings.resolution.height}p.${extension}`;
}

async function planVideoCodec(width: number, height: number, fps: number): Promise<VideoCodecPlan | null> {
  if (typeof VideoEncoder === 'undefined' || typeof VideoFrame === 'undefined') return null;

  const candidates: VideoCodecPlan[] = [
    { encoderCodec: 'vp09.00.10.08', muxerCodec: 'V_VP9' },
    { encoderCodec: 'vp8', muxerCodec: 'V_VP8' },
  ];

  for (const candidate of candidates) {
    try {
      const support = await VideoEncoder.isConfigSupported({
        codec: candidate.encoderCodec,
        width,
        height,
        bitrate: VIDEO_BITRATE,
        framerate: fps,
      });
      if (support.supported) return candidate;
    } catch {
      // Probamos el siguiente códec disponible.
    }
  }
  return null;
}

async function supportsOpusAudio(): Promise<boolean> {
  if (typeof AudioEncoder === 'undefined' || typeof AudioData === 'undefined') return false;
  try {
    const support = await AudioEncoder.isConfigSupported({
      codec: 'opus',
      sampleRate: NARRATION_SAMPLE_RATE,
      numberOfChannels: NARRATION_CHANNELS,
      bitrate: AUDIO_BITRATE,
    });
    return support.supported === true;
  } catch {
    return false;
  }
}

export interface ExportFormatInfo {
  container: string;
  videoCodec: string;
  audioCodec: string;
  mode: string;
  usedWebCodecs: boolean;
  width: number;
  height: number;
  fps: number;
  /** true si el dispositivo es móvil y se han recortado los ajustes. */
  mobileLimited: boolean;
}

/**
 * Describe el formato que producirá realmente la exportación en este navegador,
 * para poder mostrarlo antes de iniciarla (sin adivinar).
 */
export async function describeExportFormat(
  project: Project,
  hasAudio: boolean
): Promise<ExportFormatInfo> {
  const settings = effectiveSettings(project);
  const fps = settings.fps || 30;
  const width = Math.max(2, Math.round(settings.resolution.width / 2) * 2);
  const height = Math.max(2, Math.round(settings.resolution.height / 2) * 2);
  const mobileLimited = isLimitedForMobile(project.settings);

  const plan = await planVideoCodec(width, height, fps);
  const audioOk = hasAudio ? await supportsOpusAudio() : true;

  if (plan && audioOk) {
    return {
      container: 'WebM',
      videoCodec: plan.muxerCodec === 'V_VP9' ? 'VP9' : 'VP8',
      audioCodec: hasAudio ? 'Opus' : 'sin audio',
      mode: 'cuadro por cuadro (WebCodecs)',
      usedWebCodecs: true,
      width,
      height,
      fps,
      mobileLimited,
    };
  }

  return {
    container: 'WebM',
    videoCodec: 'VP9/VP8',
    audioCodec: hasAudio ? 'Opus' : 'sin audio',
    mode: 'tiempo real (MediaRecorder)',
    usedWebCodecs: false,
    width,
    height,
    fps,
    mobileLimited,
  };
}

interface ExportContext {
  project: Project;
  canvas: HTMLCanvasElement;
  renderEngine: CanvasRenderEngine;
  durationSeconds: number;
  totalFrames: number;
  fps: number;
  onProgress: ExportProgressCallback;
}

export class VideoExporter {
  public static async exportProjectVideo(
    project: Project,
    onProgress: ExportProgressCallback
  ): Promise<VideoExportResult> {
    const durationSeconds = projectDurationSeconds(project);
    if (durationSeconds <= 0) {
      throw new Error('El proyecto no contiene escenas con duración válida.');
    }

    // Ajustes efectivos: en móvil se recorta a 720p/30 fps.
    const settings = effectiveSettings(project);
    const settingsProject: Project = settings === project.settings ? project : { ...project, settings };
    // Reconstruye las URLs de imagen/video de las escenas desde sus blobs.
    const exportProject = await resolveSceneMediaUrls(settingsProject);

    const fps = settings.fps || 30;
    // Los codificadores exigen dimensiones pares.
    const width = Math.max(2, Math.round(settings.resolution.width / 2) * 2);
    const height = Math.max(2, Math.round(settings.resolution.height / 2) * 2);
    const totalFrames = Math.max(1, Math.round(durationSeconds * fps));

    onProgress(0, 'Iniciando renderizado cuadro por cuadro...');

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const renderEngine = new CanvasRenderEngine(canvas);

    onProgress(2, 'Precargando imágenes y clips del proyecto...');
    await renderEngine.preloadImages(exportProject.script.scenes);
    await renderEngine.preloadVideos(exportProject.script.scenes);

    onProgress(5, 'Mezclando narración, música y efectos de sonido...');
    const audio = await prepareProjectAudio(exportProject, durationSeconds);

    const codecPlan = await planVideoCodec(width, height, fps);
    const canEncodeAudio = audio ? await supportsOpusAudio() : true;

    const context: ExportContext = {
      project: exportProject,
      canvas,
      renderEngine,
      durationSeconds,
      totalFrames,
      fps,
      onProgress,
    };

    if (codecPlan && canEncodeAudio) {
      return VideoExporter.exportWithWebCodecs(context, codecPlan, audio);
    }

    onProgress(8, 'WebCodecs no disponible: exportando con MediaRecorder...');
    return VideoExporter.exportWithMediaRecorder(context, audio);
  }

  private static async exportWithWebCodecs(
    context: ExportContext,
    codecPlan: VideoCodecPlan,
    audio: PreparedAudio | null
  ): Promise<VideoExportResult> {
    const { label: audioLabel, ...audioNames } = VideoExporter.describeMixedAudio(audio);
    const { project, canvas, renderEngine, durationSeconds, totalFrames, fps, onProgress } = context;

    const muxer = new Muxer({
      target: new ArrayBufferTarget(),
      video: {
        codec: codecPlan.muxerCodec,
        width: canvas.width,
        height: canvas.height,
        frameRate: fps,
      },
      ...(audio
        ? {
            audio: {
              codec: 'A_OPUS',
              numberOfChannels: NARRATION_CHANNELS,
              sampleRate: NARRATION_SAMPLE_RATE,
            },
          }
        : {}),
      firstTimestampBehavior: 'offset',
    });

    // 1. Mezcla real de audio (sin tonos sintéticos), codificada en Opus.
    if (audio) {
      onProgress(10, `Codificando audio: ${audioLabel}...`);
      await VideoExporter.encodeAudioBuffer(muxer, audio.buffer);
    }

    // 2. Video cuadro por cuadro: el tiempo de cada cuadro es i / fps, no el reloj de pared.
    let encoderError: Error | null = null;
    const videoEncoder = new VideoEncoder({
      output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
      error: (error) => {
        encoderError = error;
      },
    });

    videoEncoder.configure({
      codec: codecPlan.encoderCodec,
      width: canvas.width,
      height: canvas.height,
      bitrate: VIDEO_BITRATE,
      framerate: fps,
      latencyMode: 'quality',
    });

    const keyFrameInterval = Math.max(1, Math.round(fps * 2));

    for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
      if (encoderError) throw encoderError;

      const timeSeconds = frameIndex / fps;
      await renderEngine.prepareFrame(project, timeSeconds);
      renderEngine.renderFrame(project, timeSeconds);

      const frame = new VideoFrame(canvas, {
        timestamp: Math.round(timeSeconds * 1_000_000),
        duration: Math.round(1_000_000 / fps),
      });
      videoEncoder.encode(frame, { keyFrame: frameIndex % keyFrameInterval === 0 });
      frame.close();

      if (videoEncoder.encodeQueueSize > 8) {
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
      }

      const progress = 12 + Math.floor(((frameIndex + 1) / totalFrames) * 85);
      onProgress(
        Math.min(progress, 97),
        `Codificando cuadro ${frameIndex + 1} de ${totalFrames} (${timeSeconds.toFixed(2)}s / ${durationSeconds}s)...`
      );
    }

    await videoEncoder.flush();
    videoEncoder.close();
    if (encoderError) throw encoderError;

    onProgress(98, 'Empaquetando archivo WebM...');
    muxer.finalize();

    const { buffer } = muxer.target as ArrayBufferTarget;
    const mimeType = 'video/webm';
    return {
      blob: new Blob([buffer], { type: mimeType }),
      mimeType,
      extension: extensionForMimeType(mimeType),
      durationSeconds,
      totalFrames,
      usedWebCodecs: true,
      ...audioNames,
      width: canvas.width,
      height: canvas.height,
      fps,
    };
  }

  /** Nombres de los recursos que forman la pista de audio exportada. */
  private static describeMixedAudio(audio: PreparedAudio | null): {
    narrationAssetName: string | null;
    musicAssetName: string | null;
    sfxAssetNames: string[];
    label: string;
  } {
    if (!audio) {
      return { narrationAssetName: null, musicAssetName: null, sfxAssetNames: [], label: 'sin audio' };
    }
    const parts: string[] = [];
    if (audio.narrationAsset) parts.push(`narración "${audio.narrationAsset.name}"`);
    if (audio.musicAsset) parts.push(`música "${audio.musicAsset.name}"`);
    if (audio.sfxAssets.length > 0) {
      parts.push(`${audio.sfxAssets.length} efecto(s): ${audio.sfxAssets.map((a) => a.name).join(', ')}`);
    }
    return {
      narrationAssetName: audio.narrationAsset ? audio.narrationAsset.name : null,
      musicAssetName: audio.musicAsset ? audio.musicAsset.name : null,
      sfxAssetNames: audio.sfxAssets.map((asset) => asset.name),
      label: parts.length > 0 ? parts.join(' + ') : 'sin audio',
    };
  }

  private static async encodeAudioBuffer(
    muxer: Muxer<ArrayBufferTarget>,
    buffer: AudioBuffer
  ): Promise<void> {
    let encoderError: Error | null = null;
    const encoder = new AudioEncoder({
      output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
      error: (error) => {
        encoderError = error;
      },
    });

    encoder.configure({
      codec: 'opus',
      sampleRate: NARRATION_SAMPLE_RATE,
      numberOfChannels: NARRATION_CHANNELS,
      bitrate: AUDIO_BITRATE,
    });

    const channels: Float32Array[] = [];
    for (let channel = 0; channel < NARRATION_CHANNELS; channel++) {
      const sourceChannel = Math.min(channel, buffer.numberOfChannels - 1);
      channels.push(buffer.getChannelData(sourceChannel));
    }

    for (let offset = 0; offset < buffer.length; offset += AUDIO_CHUNK_FRAMES) {
      if (encoderError) throw encoderError;

      const frames = Math.min(AUDIO_CHUNK_FRAMES, buffer.length - offset);
      const planar = new Float32Array(frames * NARRATION_CHANNELS);
      channels.forEach((data, channel) => {
        planar.set(data.subarray(offset, offset + frames), channel * frames);
      });

      const audioData = new AudioData({
        format: 'f32-planar',
        sampleRate: NARRATION_SAMPLE_RATE,
        numberOfFrames: frames,
        numberOfChannels: NARRATION_CHANNELS,
        timestamp: Math.round((offset / NARRATION_SAMPLE_RATE) * 1_000_000),
        data: planar,
      });
      encoder.encode(audioData);
      audioData.close();
    }

    await encoder.flush();
    encoder.close();
    if (encoderError) throw encoderError;
  }

  /**
   * Respaldo para navegadores sin WebCodecs: captura de canvas sin reloj propio
   * (captureStream(0) + requestFrame) con la narración real por MediaStreamDestination.
   */
  private static async exportWithMediaRecorder(
    context: ExportContext,
    audio: PreparedAudio | null
  ): Promise<VideoExportResult> {
    const { project, canvas, renderEngine, durationSeconds, totalFrames, fps, onProgress } = context;
    const { label: audioLabel, ...audioNames } = VideoExporter.describeMixedAudio(audio);
    void audioLabel;

    const audioCtx = new AudioContext();
    await audioCtx.resume().catch(() => undefined);
    const destination = audioCtx.createMediaStreamDestination();
    let audioSource: AudioBufferSourceNode | null = null;
    if (audio) {
      audioSource = audioCtx.createBufferSource();
      audioSource.buffer = audio.buffer;
      audioSource.connect(destination);
    }

    const canvasStream = canvas.captureStream(0);
    const videoTrack = canvasStream.getVideoTracks()[0] as CanvasCaptureMediaStreamTrack;
    const tracks: MediaStreamTrack[] = [videoTrack];
    if (audio) tracks.push(...destination.stream.getAudioTracks());

    const stream = new MediaStream(tracks);
    const mimeType = pickRecorderMimeType(Boolean(audio));
    const recorder = new MediaRecorder(
      stream,
      mimeType ? { mimeType, videoBitsPerSecond: VIDEO_BITRATE } : { videoBitsPerSecond: VIDEO_BITRATE }
    );

    const chunks: Blob[] = [];
    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) chunks.push(event.data);
    };

    const stopped = new Promise<void>((resolve, reject) => {
      recorder.onstop = () => resolve();
      recorder.onerror = () => reject(new Error('MediaRecorder falló durante la exportación.'));
    });

    recorder.start(100);
    audioSource?.start();

    const startTime = performance.now();
    for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
      const targetTime = startTime + (frameIndex / fps) * 1000;
      const wait = targetTime - performance.now();
      if (wait > 0) await sleep(wait);

      await renderEngine.prepareFrame(project, frameIndex / fps);
      renderEngine.renderFrame(project, frameIndex / fps);
      videoTrack.requestFrame();

      const progress = 12 + Math.floor(((frameIndex + 1) / totalFrames) * 85);
      onProgress(
        Math.min(progress, 97),
        `Capturando cuadro ${frameIndex + 1} de ${totalFrames} (${(frameIndex / fps).toFixed(2)}s / ${durationSeconds}s)...`
      );
    }

    await sleep(Math.ceil(1000 / fps) + 300);
    recorder.stop();
    audioSource?.stop();
    await stopped;
    videoTrack.stop();
    await audioCtx.close();

    const actualMimeType = recorder.mimeType || mimeType || 'video/webm';
    return {
      blob: new Blob(chunks, { type: actualMimeType }),
      mimeType: actualMimeType,
      extension: extensionForMimeType(actualMimeType),
      durationSeconds,
      totalFrames,
      usedWebCodecs: false,
      ...audioNames,
      width: canvas.width,
      height: canvas.height,
      fps,
    };
  }
}

function pickRecorderMimeType(withAudio: boolean): string {
  const candidates = withAudio
    ? [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm;codecs=opus',
        'video/webm',
        'video/mp4',
      ]
    : ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'];

  for (const candidate of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(candidate)) {
      return candidate;
    }
  }
  return '';
}
