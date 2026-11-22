// Exportador determinista: cada cuadro se renderiza y codifica con WebCodecs
// (VideoEncoder + AudioEncoder) y se empaqueta en WebM con webm-muxer.
// No se genera ningún tono sintético: la única pista de audio es la narración importada.
// Si WebCodecs no está disponible, se usa MediaRecorder con captureStream(0) + requestFrame
// como respaldo, manteniendo el audio de narración real.

import { ArrayBufferTarget, Muxer } from 'webm-muxer';
import { Project } from '../types';
import { CanvasRenderEngine } from './renderEngine';
import {
  NARRATION_CHANNELS,
  NARRATION_SAMPLE_RATE,
  PreparedNarration,
  prepareNarration,
} from './audioTrack';

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
}

/**
 * Describe el formato que producirá realmente la exportación en este navegador,
 * para poder mostrarlo antes de iniciarla (sin adivinar).
 */
export async function describeExportFormat(
  project: Project,
  hasNarration: boolean
): Promise<ExportFormatInfo> {
  const fps = project.settings.fps || 30;
  const width = Math.max(2, Math.round(project.settings.resolution.width / 2) * 2);
  const height = Math.max(2, Math.round(project.settings.resolution.height / 2) * 2);

  const plan = await planVideoCodec(width, height, fps);
  const audioOk = hasNarration ? await supportsOpusAudio() : true;

  if (plan && audioOk) {
    return {
      container: 'WebM',
      videoCodec: plan.muxerCodec === 'V_VP9' ? 'VP9' : 'VP8',
      audioCodec: hasNarration ? 'Opus' : 'sin audio',
      mode: 'cuadro por cuadro (WebCodecs)',
      usedWebCodecs: true,
    };
  }

  return {
    container: 'WebM',
    videoCodec: 'VP9/VP8',
    audioCodec: hasNarration ? 'Opus' : 'sin audio',
    mode: 'tiempo real (MediaRecorder)',
    usedWebCodecs: false,
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

    const fps = project.settings.fps || 30;
    // Los codificadores exigen dimensiones pares.
    const width = Math.max(2, Math.round(project.settings.resolution.width / 2) * 2);
    const height = Math.max(2, Math.round(project.settings.resolution.height / 2) * 2);
    const totalFrames = Math.max(1, Math.round(durationSeconds * fps));

    onProgress(0, 'Iniciando renderizado cuadro por cuadro...');

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const renderEngine = new CanvasRenderEngine(canvas);

    onProgress(2, 'Precargando imágenes del proyecto...');
    await renderEngine.preloadImages(project.script.scenes);

    onProgress(5, 'Decodificando pista de narración...');
    const narration = await prepareNarration(project, durationSeconds);

    const codecPlan = await planVideoCodec(width, height, fps);
    const canEncodeAudio = narration ? await supportsOpusAudio() : true;

    const context: ExportContext = {
      project,
      canvas,
      renderEngine,
      durationSeconds,
      totalFrames,
      fps,
      onProgress,
    };

    if (codecPlan && canEncodeAudio) {
      return VideoExporter.exportWithWebCodecs(context, codecPlan, narration);
    }

    onProgress(8, 'WebCodecs no disponible: exportando con MediaRecorder...');
    return VideoExporter.exportWithMediaRecorder(context, narration);
  }

  private static async exportWithWebCodecs(
    context: ExportContext,
    codecPlan: VideoCodecPlan,
    narration: PreparedNarration | null
  ): Promise<VideoExportResult> {
    const { project, canvas, renderEngine, durationSeconds, totalFrames, fps, onProgress } = context;

    const muxer = new Muxer({
      target: new ArrayBufferTarget(),
      video: {
        codec: codecPlan.muxerCodec,
        width: canvas.width,
        height: canvas.height,
        frameRate: fps,
      },
      ...(narration
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

    // 1. Narración real (sin tonos sintéticos), codificada en Opus.
    if (narration) {
      onProgress(10, `Codificando narración "${narration.asset.name}"...`);
      await VideoExporter.encodeNarration(muxer, narration.buffer);
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
      narrationAssetName: narration ? narration.asset.name : null,
    };
  }

  private static async encodeNarration(
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
    narration: PreparedNarration | null
  ): Promise<VideoExportResult> {
    const { project, canvas, renderEngine, durationSeconds, totalFrames, fps, onProgress } = context;

    const audioCtx = new AudioContext();
    await audioCtx.resume().catch(() => undefined);
    const destination = audioCtx.createMediaStreamDestination();
    let narrationSource: AudioBufferSourceNode | null = null;
    if (narration) {
      narrationSource = audioCtx.createBufferSource();
      narrationSource.buffer = narration.buffer;
      narrationSource.connect(destination);
    }

    const canvasStream = canvas.captureStream(0);
    const videoTrack = canvasStream.getVideoTracks()[0] as CanvasCaptureMediaStreamTrack;
    const tracks: MediaStreamTrack[] = [videoTrack];
    if (narration) tracks.push(...destination.stream.getAudioTracks());

    const stream = new MediaStream(tracks);
    const mimeType = pickRecorderMimeType(Boolean(narration));
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
    narrationSource?.start();

    const startTime = performance.now();
    for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
      const targetTime = startTime + (frameIndex / fps) * 1000;
      const wait = targetTime - performance.now();
      if (wait > 0) await sleep(wait);

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
    narrationSource?.stop();
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
      narrationAssetName: narration ? narration.asset.name : null,
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
