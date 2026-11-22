// Canvas 2D Render Engine for Estudio Audiovisual Inteligente
//
// Cada escena se dibuja primero en un canvas fuera de pantalla y luego se compone
// en el canvas visible. Eso permite aplicar transiciones reales entre la escena
// anterior y la entrante (Fundido, Deslizamiento y Zoom) sin que se pisen los
// dibujos de una y otra.

import { Scene, Project } from '../types';

export interface RenderState {
  currentTime: number; // in seconds
  isPlaying: boolean;
}

interface TimelineEntry {
  scene: Scene;
  start: number;
  duration: number;
}

export const DEFAULT_TRANSITION_SECONDS = 0.5;

export class CanvasRenderEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private imageCache: Map<string, HTMLImageElement> = new Map();

  // Dos buffers: 0 = escena entrante, 1 = escena saliente.
  private buffers: [HTMLCanvasElement, HTMLCanvasElement];
  private bufferCtxs: [CanvasRenderingContext2D, CanvasRenderingContext2D];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not get 2D context from canvas');
    }
    this.ctx = context;

    this.buffers = [document.createElement('canvas'), document.createElement('canvas')];
    this.bufferCtxs = this.buffers.map((buffer) => {
      const bufferCtx = buffer.getContext('2d');
      if (!bufferCtx) throw new Error('No se pudo crear el contexto 2D del búfer de escena');
      return bufferCtx;
    }) as [CanvasRenderingContext2D, CanvasRenderingContext2D];
  }

  public async preloadImages(scenes: Scene[]): Promise<void> {
    const promises = scenes.map((scene) => {
      if (scene.imageUrl && !this.imageCache.has(scene.imageUrl)) {
        return new Promise<void>((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            this.imageCache.set(scene.imageUrl!, img);
            resolve();
          };
          img.onerror = () => {
            // Silently fallback if image fails to load
            resolve();
          };
          img.src = scene.imageUrl!;
        });
      }
      return Promise.resolve();
    });

    await Promise.all(promises);
  }

  /** Duración total del proyecto en segundos. */
  public static totalDuration(project: Project): number {
    return project.script.scenes.reduce((sum, scene) => sum + Math.max(0, scene.durationSeconds), 0);
  }

  private buildTimeline(project: Project): TimelineEntry[] {
    let cursor = 0;
    return project.script.scenes.map((scene) => {
      const duration = Math.max(0, scene.durationSeconds);
      const entry: TimelineEntry = { scene, start: cursor, duration };
      cursor += duration;
      return entry;
    });
  }

  private resolveTransitionSeconds(scene: Scene): number {
    if (scene.transition === 'Cut') return 0;
    const requested = scene.transitionDurationSeconds ?? DEFAULT_TRANSITION_SECONDS;
    if (!Number.isFinite(requested) || requested <= 0) return 0;
    // La transición nunca puede ocupar más de la mitad de la escena.
    return Math.min(requested, scene.durationSeconds / 2);
  }

  public renderFrame(project: Project, timeSeconds: number): void {
    const { width, height } = project.settings.resolution;

    // Ensure canvas dimensions match target resolution
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }

    const timeline = this.buildTimeline(project);
    if (timeline.length === 0) {
      this.drawEmptyState(width, height);
      return;
    }

    // Escena activa según el tiempo global.
    let index = timeline.findIndex(
      (entry) => timeSeconds >= entry.start && timeSeconds <= entry.start + entry.duration
    );
    if (index === -1) index = timeline.length - 1;

    const current = timeline[index];
    const localTime = Math.max(0, Math.min(timeSeconds - current.start, current.duration));

    const transitionSeconds = this.resolveTransitionSeconds(current.scene);
    const previous = index > 0 ? timeline[index - 1] : null;

    if (previous && transitionSeconds > 0 && localTime < transitionSeconds) {
      const progress = Math.min(1, localTime / transitionSeconds);
      // La escena anterior sigue reproduciéndose mientras entra la nueva.
      const previousLocalTime = Math.max(
        0,
        Math.min(previous.duration, previous.duration - transitionSeconds + localTime)
      );

      const incoming = this.buffers[0];
      const outgoing = this.buffers[1];
      this.prepareBuffer(incoming, width, height);
      this.prepareBuffer(outgoing, width, height);

      this.drawSceneInto(
        this.bufferCtxs[0],
        width,
        height,
        current.scene,
        localTime,
        current.start + localTime
      );
      this.drawSceneInto(
        this.bufferCtxs[1],
        width,
        height,
        previous.scene,
        previousLocalTime,
        previous.start + previousLocalTime
      );

      this.compositeTransition(current.scene.transition, incoming, outgoing, width, height, progress);
      return;
    }

    // Sin transición: la escena se dibuja directamente en el canvas visible.
    this.drawSceneInto(this.ctx, width, height, current.scene, localTime, current.start + localTime);
  }

  private prepareBuffer(buffer: HTMLCanvasElement, width: number, height: number): void {
    if (buffer.width !== width || buffer.height !== height) {
      buffer.width = width;
      buffer.height = height;
    }
  }

  private compositeTransition(
    transition: Scene['transition'],
    incoming: HTMLCanvasElement,
    outgoing: HTMLCanvasElement,
    width: number,
    height: number,
    progress: number
  ): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    if (transition === 'Fade') {
      // La escena anterior se queda y la nueva aparece con opacidad 0 → 1.
      ctx.drawImage(outgoing, 0, 0, width, height);
      ctx.globalAlpha = progress;
      ctx.drawImage(incoming, 0, 0, width, height);
    } else if (transition === 'Slide') {
      // Empuje horizontal: la anterior sale a la izquierda y la nueva entra desde la derecha.
      const offset = progress * width;
      ctx.drawImage(outgoing, -offset, 0, width, height);
      ctx.drawImage(incoming, width - offset, 0, width, height);
    } else if (transition === 'Zoom') {
      // La escena anterior se aleja/acerca (1.0 → 1.1) mientras se desvanece;
      // la nueva entra desde 1.1 hasta su tamaño normal.
      ctx.globalAlpha = 1 - progress;
      this.drawScaled(outgoing, width, height, 1 + 0.1 * progress);
      ctx.globalAlpha = progress;
      this.drawScaled(incoming, width, height, 1.1 - 0.1 * progress);
    } else {
      ctx.drawImage(incoming, 0, 0, width, height);
    }

    ctx.restore();
  }

  private drawScaled(source: HTMLCanvasElement, width: number, height: number, scale: number): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(scale, scale);
    ctx.drawImage(source, -width / 2, -height / 2, width, height);
    ctx.restore();
  }

  /** Dibuja una escena completa en el contexto indicado (canvas visible o búfer). */
  private drawSceneInto(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    scene: Scene,
    sceneLocalTime: number,
    absoluteTime: number
  ): void {
    const sceneProgress = scene.durationSeconds > 0 ? Math.min(1, sceneLocalTime / scene.durationSeconds) : 0;

    ctx.clearRect(0, 0, width, height);

    // 1. Draw Background & Image
    this.drawBackground(ctx, width, height, scene, sceneProgress);

    // 2. Draw Camera Motion / Overlays
    this.drawSceneVisuals(ctx, width, height, scene, sceneProgress);

    // 3. Draw Kinetic Typography / Animated Subtitles
    this.drawSubtitlesAndText(ctx, width, height, scene, sceneLocalTime);

    // 4. Draw Studio Watermark & Scene Info
    this.drawWatermark(ctx, width, height, scene.title, absoluteTime);
  }

  private drawEmptyState(width: number, height: number): void {
    this.ctx.fillStyle = '#0f172a';
    this.ctx.fillRect(0, 0, width, height);
    this.ctx.fillStyle = '#64748b';
    this.ctx.font = 'bold 32px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Sin escenas para reproducir', width / 2, height / 2);
  }

  private drawBackground(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    scene: Scene,
    progress: number
  ): void {
    const img = scene.imageUrl ? this.imageCache.get(scene.imageUrl) : null;

    if (img) {
      ctx.save();

      // Calculate camera motion transform
      let scale = 1.0;
      let dx = 0;
      let dy = 0;

      if (scene.cameraMotion === 'Zoom In') {
        scale = 1.0 + progress * 0.15;
      } else if (scene.cameraMotion === 'Zoom Out') {
        scale = 1.15 - progress * 0.15;
      } else if (scene.cameraMotion === 'Pan Left') {
        dx = -progress * 40;
      } else if (scene.cameraMotion === 'Pan Right') {
        dx = progress * 40;
      }

      ctx.translate(width / 2 + dx, height / 2 + dy);
      ctx.scale(scale, scale);

      // Draw image scaled to cover
      const imgRatio = img.width / img.height;
      const canvasRatio = width / height;
      let drawW = width;
      let drawH = height;

      if (imgRatio > canvasRatio) {
        drawW = height * imgRatio;
      } else {
        drawH = width / imgRatio;
      }

      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      // Dark overlay for readability
      ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
      ctx.fillRect(0, 0, width, height);
    } else {
      // Procedural artistic gradient background
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#090d16');
      grad.addColorStop(0.5, '#1e1b4b');
      grad.addColorStop(1, '#0f172a');

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Subtle animated particle or grid accent
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.08)';
      ctx.lineWidth = 2;
      const gridSize = 60;
      const offset = (progress * 30) % gridSize;

      for (let x = offset; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
    }
  }

  private drawSceneVisuals(
    ctx: CanvasRenderingContext2D,
    width: number,
    _height: number,
    scene: Scene,
    progress: number
  ): void {
    // Visual intent indicator banner
    ctx.fillStyle = 'rgba(99, 102, 241, 0.15)';
    ctx.fillRect(60, 60, width - 120, 6);

    ctx.fillStyle = '#818cf8';
    ctx.fillRect(60, 60, (width - 120) * progress, 6);

    // Intención narrativa
    ctx.font = '500 18px sans-serif';
    ctx.fillStyle = '#a5b4fc';
    ctx.textAlign = 'left';
    ctx.fillText(`INTENCIÓN VISUAL: ${scene.visualIntent.toUpperCase()}`, 60, 95);
  }

  private drawSubtitlesAndText(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    scene: Scene,
    sceneLocalTime: number
  ): void {
    const subtitles =
      scene.subtitles && scene.subtitles.length > 0 ? scene.subtitles : [scene.narrationText];

    const partDuration = scene.durationSeconds / subtitles.length;
    const currentSubIndex = Math.min(
      subtitles.length - 1,
      Math.max(0, Math.floor(sceneLocalTime / partDuration))
    );

    const currentText = subtitles[currentSubIndex] || scene.narrationText;

    // Draw main narration kinetic typography
    ctx.save();

    // Kinetic entry effect (fade in & slide up)
    const subLocalTime = sceneLocalTime % partDuration;
    const entryProgress = Math.min(1, subLocalTime * 3); // 0.33s fade in
    const opacity = entryProgress;
    const translateY = (1 - entryProgress) * 15;

    ctx.globalAlpha = opacity;
    ctx.translate(0, translateY);

    // Text Container Box
    const boxPaddingHorizontal = 40;
    const boxHeight = 160;
    const boxY = height - boxHeight - 80;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.beginPath();
    ctx.roundRect(60, boxY, width - 120, boxHeight, 16);
    ctx.fill();

    ctx.strokeStyle = 'rgba(99, 102, 241, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Render Subtitle Text with Wrap
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    this.wrapAndRenderText(ctx, currentText, width / 2, boxY + boxHeight / 2, width - 120 - boxPaddingHorizontal * 2, 36);

    ctx.restore();
  }

  private wrapAndRenderText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number
  ): void {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = words[0] || '';

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + ' ' + word).width;
      if (width < maxWidth) {
        currentLine += ' ' + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);

    const startY = y - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((line, index) => {
      ctx.fillText(line, x, startY + index * lineHeight);
    });
  }

  private drawWatermark(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    sceneTitle: string,
    totalTime: number
  ): void {
    // Top right badge
    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.beginPath();
    ctx.roundRect(width - 240, 24, 216, 36, 18);
    ctx.fill();

    ctx.fillStyle = '#c7d2fe';
    ctx.font = '600 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ESTUDIO AUDIOVISUAL IA', width - 132, 47);

    // Bottom left scene indicator
    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${sceneTitle} | ${totalTime.toFixed(1)}s`, 60, height - 30);
  }
}
