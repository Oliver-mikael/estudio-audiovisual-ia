// Canvas 2D Render Engine for Estudio Audiovisual Inteligente
//
// Cada escena se dibuja primero en un canvas fuera de pantalla y luego se compone
// en el canvas visible. Eso permite aplicar transiciones reales entre la escena
// anterior y la entrante (Fundido, Deslizamiento y Zoom) sin que se pisen los
// dibujos de una y otra.

import { Scene, Project, SubtitleAnimation, SubtitleEntry } from '../types';
import { visualSlotAt } from './visualRhythm';
import { normalizeSubtitleAnimation, subtitleAnimationFrame } from './textAnimation';
import { introHookFrame } from './introHook';

export interface RenderState {
  currentTime: number; // in seconds
  isPlaying: boolean;
}

export interface TimelineEntry {
  scene: Scene;
  start: number;
  duration: number;
}

export interface TransitionFrameState {
  current: TimelineEntry;
  localTime: number;
  progress: number;
  previous: TimelineEntry | null;
  previousLocalTime: number;
  /** Duración efectiva de la transición de entrada de la escena actual (s). */
  transitionSeconds: number;
}

export const DEFAULT_TRANSITION_SECONDS = 0.5;

/** Línea de tiempo acumulada de las escenas del proyecto. */
export function buildTimeline(project: Project): TimelineEntry[] {
  let cursor = 0;
  return project.script.scenes.map((scene) => {
    const duration = Math.max(0, scene.durationSeconds);
    const entry: TimelineEntry = { scene, start: cursor, duration };
    cursor += duration;
    return entry;
  });
}

/** Duración real de la transición de entrada de una escena. */
export function transitionSecondsFor(scene: Scene): number {
  if (scene.transition === 'Cut') return 0;
  const requested = scene.transitionDurationSeconds ?? DEFAULT_TRANSITION_SECONDS;
  if (!Number.isFinite(requested) || requested <= 0) return 0;
  // La transición nunca puede ocupar más de la mitad de la escena.
  return Math.min(requested, scene.durationSeconds / 2);
}

/**
 * Resuelve qué se dibuja en un instante: la escena actual, la anterior durante la
 * transición y el progreso 0→1 de la mezcla. Es lógica pura (sin canvas) para poder
 * probarla y para que la exportación y la previsualización compartan el mismo cálculo.
 */
export function computeTransitionFrame(
  project: Project,
  timeSeconds: number
): TransitionFrameState | null {
  const timeline = buildTimeline(project);
  if (timeline.length === 0) return null;

  let index = timeline.findIndex(
    (entry) => timeSeconds >= entry.start && timeSeconds < entry.start + entry.duration
  );
  if (index === -1) index = timeline.length - 1;

  const current = timeline[index];
  const localTime = Math.max(0, Math.min(timeSeconds - current.start, current.duration));
  const transitionSeconds = transitionSecondsFor(current.scene);
  const candidatePrevious = index > 0 ? timeline[index - 1] : null;
  const inTransition =
    Boolean(candidatePrevious) && transitionSeconds > 0 && localTime < transitionSeconds;

  return {
    current,
    localTime,
    progress: inTransition ? Math.min(1, localTime / transitionSeconds) : 0,
    previous: inTransition ? candidatePrevious : null,
    previousLocalTime: candidatePrevious
      ? Math.max(
          0,
          Math.min(
            candidatePrevious.duration,
            candidatePrevious.duration - transitionSeconds + localTime
          )
        )
      : 0,
    transitionSeconds,
  };
}

/** Opacidad de la escena entrante en un Fundido: 0 al empezar, 1 al terminar. */
export function fadeOpacity(progress: number): number {
  return Math.max(0, Math.min(1, progress));
}

export interface SubtitleFrame {
  index: number;
  text: string;
  /** Segundo (relativo a la escena) en el que empieza a mostrarse. */
  start: number;
  /** Segundo (relativo a la escena) en el que deja de mostrarse. */
  end: number;
  /** Animación de entrada/salida elegida para esta línea (por defecto, fundido). */
  animation?: SubtitleAnimation;
}

/** Texto de una entrada de subtítulo, sea cadena (automática) u objeto con tiempos. */
export function subtitleText(entry: SubtitleEntry): string {
  return typeof entry === 'string' ? entry : entry.text ?? '';
}

function clampSeconds(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

/**
 * Inicio y duración automáticos de cada entrada, alineados con `scene.subtitles`.
 * Las líneas con texto se reparten en partes iguales de la duración de la escena;
 * las vacías no ocupan tiempo.
 */
export function subtitleSlotDefaults(scene: Scene): { start: number; duration: number }[] {
  const entries = scene.subtitles ?? [];
  const duration = Math.max(0, scene.durationSeconds);
  const visibleCount = entries.filter((entry) => subtitleText(entry).trim().length > 0).length;
  const slot = visibleCount > 0 ? duration / visibleCount : duration;

  let visibleIndex = 0;
  return entries.map((entry) => {
    if (subtitleText(entry).trim().length === 0) return { start: 0, duration: 0 };
    const start = visibleIndex * slot;
    visibleIndex += 1;
    return { start, duration: slot };
  });
}

/**
 * Subtítulos editables de una escena, en orden. Las líneas vacías se ignoran.
 * Son independientes del texto de narración: si no hay subtítulos no se dibuja
 * ninguno.
 */
export function sceneSubtitles(scene: Scene): string[] {
  return (scene.subtitles ?? [])
    .map((entry) => subtitleText(entry).trim())
    .filter((line) => line.length > 0);
}

/**
 * Todos los subtítulos de la escena con su ventana temporal resuelta. Cada línea
 * usa sus tiempos explícitos (inicio y duración) o, si no los tiene, la parte
 * igual que le corresponde. Sin tiempos explícitos el comportamiento es el de
 * las fases anteriores.
 */
export function subtitleCues(scene: Scene): SubtitleFrame[] {
  const entries = scene.subtitles ?? [];
  const defaults = subtitleSlotDefaults(scene);
  const duration = Math.max(0, scene.durationSeconds);
  const cues: SubtitleFrame[] = [];

  entries.forEach((entry, rawIndex) => {
    const text = subtitleText(entry).trim();
    if (!text) return;

    const explicit: { startSeconds?: number; durationSeconds?: number } =
      typeof entry === 'string' ? {} : entry;
    const fallback = defaults[rawIndex] ?? { start: 0, duration: 0 };
    const start = clampSeconds(
      explicit.startSeconds ?? fallback.start,
      0,
      duration
    );
    const durationValue = Math.max(0, explicit.durationSeconds ?? fallback.duration);
    const end = clampSeconds(start + durationValue, 0, duration);

    // El campo solo aparece si la línea tiene una animación explícita: las
    // escenas antiguas mantienen exactamente la misma forma de datos.
    const animation = typeof entry === 'string' ? undefined : entry.animation;
    cues.push({
      index: cues.length,
      text,
      start,
      end,
      ...(animation ? { animation: normalizeSubtitleAnimation(animation) } : {}),
    });
  });

  return cues;
}

/**
 * Subtítulo visible en un instante de la escena. Solo se dibuja dentro de su
 * ventana de tiempo: en los huecos o fuera de la escena devuelve null.
 */
export function subtitleAt(scene: Scene, localTime: number): SubtitleFrame | null {
  const cues = subtitleCues(scene);
  if (cues.length === 0) return null;

  return cues.find((cue) => localTime >= cue.start && localTime < cue.end) ?? null;
}

export class CanvasRenderEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private imageCache: Map<string, HTMLImageElement> = new Map();
  private videoCache: Map<string, HTMLVideoElement> = new Map();
  private videoReady: Map<string, Promise<void>> = new Map();

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
    // Se cargan la imagen principal y la secundaria de cada escena (B-roll).
    const urls = new Set<string>();
    scenes.forEach((scene) => {
      if (scene.imageUrl) urls.add(scene.imageUrl);
      if (scene.secondaryImageUrl) urls.add(scene.secondaryImageUrl);
    });

    await Promise.all(
      Array.from(urls)
        .filter((url) => !this.imageCache.has(url))
        .map(
          (url) =>
            new Promise<void>((resolve) => {
              const img = new Image();
              img.crossOrigin = 'anonymous';
              img.onload = () => {
                this.imageCache.set(url, img);
                resolve();
              };
              img.onerror = () => {
                // Si una imagen falla se sigue con el fondo generado.
                resolve();
              };
              img.src = url;
            })
        )
    );
  }

  /** Carga los clips de video de las escenas que los usan. */
  public async preloadVideos(scenes: Scene[]): Promise<void> {
    const urls = scenes.map((scene) => scene.videoUrl).filter((url): url is string => Boolean(url));
    await Promise.all(urls.map((url) => this.ensureVideo(url)));
  }

  private ensureVideo(url: string): Promise<void> {
    const pending = this.videoReady.get(url);
    if (pending) return pending;

    const video = document.createElement('video');
    video.src = url;
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.crossOrigin = 'anonymous';
    this.videoCache.set(url, video);

    const ready = new Promise<void>((resolve) => {
      let settled = false;
      const done = () => {
        if (settled) return;
        settled = true;
        resolve();
      };
      video.addEventListener('loadeddata', done, { once: true });
      video.addEventListener('error', done, { once: true });
      // Un video con problemas de códec no debe colgar la exportación.
      setTimeout(done, 4000);
      video.load();
    });

    this.videoReady.set(url, ready);
    return ready;
  }

  /** Tiempo del clip para un instante de la escena: repite (loop) si es más corto. */
  private videoTimeFor(scene: Scene, sceneLocalTime: number): number {
    const video = scene.videoUrl ? this.videoCache.get(scene.videoUrl) : null;
    const duration = video && Number.isFinite(video.duration) ? video.duration : 0;
    if (duration <= 0) return 0;
    return sceneLocalTime % duration;
  }

  private async seekSceneVideo(scene: Scene, sceneLocalTime: number): Promise<void> {
    if (!scene.videoUrl) return;
    const video = this.videoCache.get(scene.videoUrl);
    if (!video) return;

    await this.ensureVideo(scene.videoUrl);
    if (video.readyState < 2) return;

    const target = this.videoTimeFor(scene, sceneLocalTime);
    if (Math.abs(video.currentTime - target) < 0.002) return;

    await new Promise<void>((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        video.removeEventListener('seeked', finish);
        clearTimeout(timer);
        resolve();
      };
      const timer = setTimeout(finish, 500);
      video.addEventListener('seeked', finish, { once: true });
      try {
        video.currentTime = target;
      } catch {
        finish();
      }
    });
  }

  /**
   * Coloca cada video en el cuadro que corresponde al instante pedido.
   * La exportación llama a esto antes de renderFrame para que drawImage use
   * exactamente el frame del timestamp, y no el reloj de reproducción.
   */
  public async prepareFrame(project: Project, timeSeconds: number): Promise<void> {
    const target = computeTransitionFrame(project, timeSeconds);
    if (!target) return;

    const tasks: Promise<void>[] = [this.seekSceneVideo(target.current.scene, target.localTime)];
    if (target.previous) {
      tasks.push(this.seekSceneVideo(target.previous.scene, target.previousLocalTime));
    }
    await Promise.all(tasks);
  }

  /** Preparar y dibujar un cuadro (usado por la previsualización). */
  public async renderFrameAt(project: Project, timeSeconds: number): Promise<void> {
    await this.prepareFrame(project, timeSeconds);
    this.renderFrame(project, timeSeconds);
  }

  /** Duración total del proyecto en segundos. */
  public static totalDuration(project: Project): number {
    return project.script.scenes.reduce((sum, scene) => sum + Math.max(0, scene.durationSeconds), 0);
  }

  public renderFrame(project: Project, timeSeconds: number): void {
    const { width, height } = project.settings.resolution;

    // Ensure canvas dimensions match target resolution
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }

    const target = computeTransitionFrame(project, timeSeconds);
    if (!target) {
      this.drawEmptyState(width, height);
      return;
    }

    const { current, localTime, progress, previous, previousLocalTime } = target;

    if (previous) {
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
        current.start + localTime,
        project
      );
      this.drawSceneInto(
        this.bufferCtxs[1],
        width,
        height,
        previous.scene,
        previousLocalTime,
        previous.start + previousLocalTime,
        project
      );

      this.compositeTransition(current.scene.transition, incoming, outgoing, width, height, progress);
      return;
    }

    // Sin transición: la escena se dibuja directamente en el canvas visible.
    this.drawSceneInto(
      this.ctx,
      width,
      height,
      current.scene,
      localTime,
      current.start + localTime,
      project
    );
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
      ctx.globalAlpha = fadeOpacity(progress);
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
    absoluteTime: number,
    project: Project
  ): void {
    const sceneProgress = scene.durationSeconds > 0 ? Math.min(1, sceneLocalTime / scene.durationSeconds) : 0;

    ctx.clearRect(0, 0, width, height);

    // 1. Draw Background & Image (con cortes automáticos si toca)
    this.drawBackground(ctx, width, height, scene, sceneProgress, sceneLocalTime);

    // 2. Draw Camera Motion / Overlays
    this.drawSceneVisuals(ctx, width, height, scene, sceneProgress);

    // 3. Draw Kinetic Typography / Animated Subtitles
    this.drawSubtitlesAndText(ctx, width, height, scene, sceneLocalTime);

    // 4. Draw Studio Watermark & Scene Info
    this.drawWatermark(ctx, width, height, scene.title, absoluteTime);

    // 5. Gancho visual de la intro (solo en los primeros 3 s del primer escena)
    this.drawIntroHook(ctx, width, height, project, scene, absoluteTime);
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
    progress: number,
    sceneLocalTime: number
  ): void {
    const primaryImg = scene.imageUrl ? this.imageCache.get(scene.imageUrl) ?? null : null;
    const secondaryImg = scene.secondaryImageUrl
      ? this.imageCache.get(scene.secondaryImageUrl) ?? null
      : null;
    // Ritmo visual: si la escena dura más de 4 s y tiene secundaria, la imagen
    // cambia cada 3 s. Sin secundaria (o con los cortes desactivados) se usa la
    // principal toda la escena.
    const img =
      visualSlotAt(scene, sceneLocalTime) === 'secondary' ? secondaryImg ?? primaryImg : primaryImg;
    const video = scene.videoUrl ? this.videoCache.get(scene.videoUrl) : null;
    const videoReady = Boolean(video && video.readyState >= 2 && video.videoWidth > 0);

    // El clip de video tiene prioridad sobre la imagen; si aún no está listo se
    // usa la imagen (o el fondo generado) para no dejar el cuadro vacío.
    const source: CanvasImageSource | null = videoReady ? (video as HTMLVideoElement) : img ?? null;
    const sourceWidth = videoReady ? (video as HTMLVideoElement).videoWidth : img?.width ?? 0;
    const sourceHeight = videoReady ? (video as HTMLVideoElement).videoHeight : img?.height ?? 0;

    if (source && sourceWidth > 0 && sourceHeight > 0) {
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

      // Draw source scaled to cover
      const sourceRatio = sourceWidth / sourceHeight;
      const canvasRatio = width / height;
      let drawW = width;
      let drawH = height;

      if (sourceRatio > canvasRatio) {
        drawW = height * sourceRatio;
      } else {
        drawH = width / sourceRatio;
      }

      ctx.drawImage(source, -drawW / 2, -drawH / 2, drawW, drawH);
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
    const subtitle = subtitleAt(scene, sceneLocalTime);
    // Sin subtítulos editables no se dibuja nada: ya no se derivan del texto de narración.
    if (!subtitle) return;

    // Animación por subtítulo (fundido 0,3 s, máquina de escribir o deslizamiento).
    const frame = subtitleAnimationFrame(
      subtitle.text,
      sceneLocalTime,
      subtitle.start,
      subtitle.end,
      subtitle.animation
    );
    if (frame.opacity <= 0) return;

    ctx.save();
    ctx.globalAlpha = frame.opacity;
    ctx.translate(0, frame.translateY);

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

    const lines = this.wrapTextLines(ctx, subtitle.text, width - 120 - boxPaddingHorizontal * 2);
    this.renderTextLines(
      ctx,
      lines,
      width / 2,
      boxY + boxHeight / 2,
      36,
      frame.visibleText.length
    );

    ctx.restore();
  }

  /** Gancho visual superpuesto en los primeros 3 s (fase 27). */
  private drawIntroHook(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    project: Project,
    scene: Scene,
    absoluteTime: number
  ): void {
    if (project.script.scenes[0]?.id !== scene.id) return;
    const hook = introHookFrame(project, absoluteTime);
    if (!hook || hook.opacity <= 0) return;

    ctx.save();

    // Fondo ligeramente oscurecido para que el texto tenga contraste.
    ctx.globalAlpha = hook.darken;
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, width, height);

    // Texto grande, centrado y con zoom de entrada 110 % → 100 %.
    ctx.globalAlpha = hook.opacity;
    ctx.translate(width / 2, height * 0.44);
    ctx.scale(hook.scale, hook.scale);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `800 ${Math.round(width * 0.058)}px system-ui, -apple-system, sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 4;

    const lines = this.wrapTextLines(ctx, hook.text, width * 0.78);
    const lineHeight = Math.round(width * 0.068);
    const startY = -((lines.length - 1) * lineHeight) / 2;
    lines.forEach((line, index) => ctx.fillText(line, 0, startY + index * lineHeight));

    ctx.restore();
  }

  /** Parte el texto en líneas sin dibujarlo (mantiene estable el efecto máquina de escribir). */
  private wrapTextLines(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number
  ): string[] {
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
    return lines;
  }

  /** Dibuja las líneas ya maquetadas, opcionalmente solo los primeros caracteres. */
  private renderTextLines(
    ctx: CanvasRenderingContext2D,
    lines: string[],
    x: number,
    y: number,
    lineHeight: number,
    visibleCharacters?: number
  ): void {
    const startY = y - ((lines.length - 1) * lineHeight) / 2;
    let remaining = visibleCharacters ?? Number.POSITIVE_INFINITY;
    lines.forEach((line, index) => {
      if (remaining <= 0) return;
      const slice = line.length <= remaining ? line : line.slice(0, remaining);
      remaining -= line.length + (index < lines.length - 1 ? 1 : 0);
      ctx.fillText(slice, x, startY + index * lineHeight);
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
