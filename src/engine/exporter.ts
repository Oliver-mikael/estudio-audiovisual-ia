// Client-side Video Exporter using Canvas Capture & Web Audio Multitrack Engine (Phase 7D)
import { Project } from '../types';
import { CanvasRenderEngine } from './renderEngine';
import { audioEngine } from '../services/audio/AudioEngine';
import { TimelineEngine } from '../services/timeline/timelineEngine';

export interface ExportProgressCallback {
  (progress: number, statusMessage: string): void;
}

export class VideoExporter {
  public static async exportProjectVideo(
    project: Project,
    onProgress: ExportProgressCallback
  ): Promise<Blob> {
    onProgress(0, 'Iniciando motor de renderizado y mezcla de audio...');

    const initializedProject = TimelineEngine.ensureTimeline(project);
    const { width, height } = initializedProject.settings.resolution;
    const fps = initializedProject.settings.fps || 30;

    // Calculate total project duration
    const totalDuration = initializedProject.script.scenes.reduce(
      (sum, scene) => sum + scene.durationSeconds,
      0
    );

    if (totalDuration <= 0) {
      throw new Error('El proyecto no contiene escenas con duración válida.');
    }

    // 1. Offscreen Canvas creation for precise frame rendering
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const renderEngine = new CanvasRenderEngine(canvas);

    onProgress(10, 'Precargando recursos visuales...');
    await renderEngine.preloadImages(initializedProject.script.scenes);

    // 2. Initialize Web Audio Engine for Multitrack Destination Mixing
    onProgress(20, 'Configurando motor de audio multicanal...');
    await audioEngine.initContext();
    const audioStream = audioEngine.getDestinationStream();

    if (!audioStream) {
      throw new Error('No se pudo inicializar el flujo de destino de audio Web Audio API');
    }

    // 3. MediaRecorder setup with WebM/MP4 support detection
    const canvasStream = canvas.captureStream(fps);
    const combinedStream = new MediaStream([
      ...canvasStream.getVideoTracks(),
      ...audioStream.getAudioTracks(),
    ]);

    let mimeType = 'video/webm;codecs=vp9,opus';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm;codecs=vp8,opus';
    }
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm';
    }
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/mp4';
    }

    const recordedChunks: Blob[] = [];
    const mediaRecorder = new MediaRecorder(combinedStream, {
      mimeType,
      videoBitsPerSecond: 2500000, // 2.5 Mbps for 720p crisp video
    });

    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        recordedChunks.push(e.data);
      }
    };

    return new Promise((resolve, reject) => {
      mediaRecorder.onstop = () => {
        try {
          audioEngine.stop();
        } catch (_) {}
        const finalBlob = new Blob(recordedChunks, { type: mimeType });
        onProgress(100, 'Exportación finalizada exitosamente.');
        resolve(finalBlob);
      };

      mediaRecorder.onerror = (err) => {
        reject(err);
      };

      // Start Recording
      mediaRecorder.start(100);

      // Trigger Web Audio playback synchronized with export
      audioEngine.play(initializedProject, 0);

      // Frame rendering loop (30 FPS simulation)
      const totalFrames = Math.ceil(totalDuration * fps);
      let currentFrame = 0;
      const frameIntervalMs = 1000 / fps;

      const renderInterval = setInterval(() => {
        const currentTime = currentFrame / fps;
        renderEngine.renderFrame(initializedProject, currentTime);

        currentFrame++;
        const progressPercent = Math.min(95, Math.floor((currentFrame / totalFrames) * 75) + 20);
        onProgress(
          progressPercent,
          `Renderizando cuadro ${currentFrame} de ${totalFrames} (${currentTime.toFixed(1)}s / ${totalDuration}s)...`
        );

        if (currentFrame >= totalFrames) {
          clearInterval(renderInterval);
          audioEngine.stop();
          // Small buffer delay before stopping recorder
          setTimeout(() => {
            mediaRecorder.stop();
          }, 300);
        }
      }, frameIntervalMs);
    });
  }
}
