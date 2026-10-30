// Client-side Video Exporter using Canvas Capture & Web Audio Synthetic TTS/Audio mix

import { Project } from '../types';
import { CanvasRenderEngine } from './renderEngine';

export interface ExportProgressCallback {
  (progress: number, statusMessage: string): void;
}

export class VideoExporter {
  public static async exportProjectVideo(
    project: Project,
    onProgress: ExportProgressCallback
  ): Promise<Blob> {
    onProgress(0, 'Iniciando motor de renderizado local...');

    const { width, height } = project.settings.resolution;
    const fps = project.settings.fps || 30;

    // Calculate total project duration
    const totalDuration = project.script.scenes.reduce(
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

    onProgress(10, 'Precargando recursos multimedia...');
    await renderEngine.preloadImages(project.script.scenes);

    // 2. Web Audio API Setup for synthesized audio track
    const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const destNode = audioCtx.createMediaStreamDestination();

    // Prepare speech synthesis or audio tones for demo narration synchronization
    const synthesisUtterances: { sceneStart: number; text: string }[] = [];
    let accumTime = 0;
    project.script.scenes.forEach((sc) => {
      synthesisUtterances.push({ sceneStart: accumTime, text: sc.narrationText });
      accumTime += sc.durationSeconds;
    });

    // 3. MediaRecorder setup with WebM/MP4 support detection
    const canvasStream = canvas.captureStream(fps);
    const combinedStream = new MediaStream([
      ...canvasStream.getVideoTracks(),
      ...destNode.stream.getAudioTracks()
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
      videoBitsPerSecond: 2500000 // 2.5 Mbps for 720p crisp video
    });

    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        recordedChunks.push(e.data);
      }
    };

    return new Promise((resolve, reject) => {
      mediaRecorder.onstop = () => {
        const finalBlob = new Blob(recordedChunks, { type: mimeType });
        audioCtx.close();
        onProgress(100, 'Exportación finalizada exitosamente.');
        resolve(finalBlob);
      };

      mediaRecorder.onerror = (err) => {
        reject(err);
      };

      // Start Recording
      mediaRecorder.start(100);

      // Trigger Web Speech API Narration if supported in browser
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        synthesisUtterances.forEach(({ sceneStart, text }) => {
          setTimeout(() => {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'es-ES';
            utterance.rate = 1.0;
            window.speechSynthesis.speak(utterance);
          }, sceneStart * 1000);
        });
      }

      // Frame rendering loop (30 FPS simulation)
      const totalFrames = Math.ceil(totalDuration * fps);
      let currentFrame = 0;
      const frameIntervalMs = 1000 / fps;

      const renderInterval = setInterval(() => {
        const currentTime = currentFrame / fps;
        renderEngine.renderFrame(project, currentTime);

        currentFrame++;
        const progressPercent = Math.min(95, Math.floor((currentFrame / totalFrames) * 85) + 10);
        onProgress(
          progressPercent,
          `Renderizando cuadro ${currentFrame} de ${totalFrames} (${currentTime.toFixed(1)}s / ${totalDuration}s)...`
        );

        if (currentFrame >= totalFrames) {
          clearInterval(renderInterval);
          if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
          }
          // Small buffer delay before stopping recorder
          setTimeout(() => {
            mediaRecorder.stop();
          }, 300);
        }
      }, frameIntervalMs);
    });
  }
}
