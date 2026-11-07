// Canvas 2D Render Engine for Estudio Audiovisual Inteligente

import { Scene, Project, TimelineClip } from '../types';
import { KeyframeEngine } from '../services/animation/keyframeEngine';
import { TransitionEngine } from '../services/animation/transitionEngine';

export interface RenderState {
  currentTime: number; // in seconds
  isPlaying: boolean;
}

export class CanvasRenderEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private imageCache: Map<string, HTMLImageElement> = new Map();
  private scratchCanvasA: HTMLCanvasElement | null = null;
  private scratchCanvasB: HTMLCanvasElement | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not get 2D context from canvas');
    }
    this.ctx = context;
  }

  private getScratchCanvases(width: number, height: number): [HTMLCanvasElement, HTMLCanvasElement] {
    if (!this.scratchCanvasA) {
      this.scratchCanvasA = document.createElement('canvas');
    }
    if (!this.scratchCanvasB) {
      this.scratchCanvasB = document.createElement('canvas');
    }
    if (this.scratchCanvasA.width !== width || this.scratchCanvasA.height !== height) {
      this.scratchCanvasA.width = width;
      this.scratchCanvasA.height = height;
    }
    if (this.scratchCanvasB.width !== width || this.scratchCanvasB.height !== height) {
      this.scratchCanvasB.width = width;
      this.scratchCanvasB.height = height;
    }
    return [this.scratchCanvasA, this.scratchCanvasB];
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

  public renderFrame(project: Project, timeSeconds: number): void {
    const { width, height } = project.settings.resolution;

    // Ensure canvas dimensions match target resolution
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }

    // Check if timeline model is present and has video tracks
    const v1Track = project.timeline?.tracks.find((t) => t.id === 'track-v1');
    const isV1Visible = v1Track ? v1Track.isVisible : true;

    const scenes = project.script.scenes;
    if (!scenes || scenes.length === 0) {
      this.drawEmptyState(width, height);
      return;
    }

    // If V1 track is explicitly hidden, draw blackout
    if (!isV1Visible) {
      this.ctx.fillStyle = '#05070e';
      this.ctx.fillRect(0, 0, width, height);
      this.drawWatermark(width, height, '(Pista V1 Oculta)', timeSeconds);
      return;
    }

    // Calculate total project duration & current scene index
    let accumulatedTime = 0;
    let currentScene: Scene | null = null;
    let previousScene: Scene | null = null;
    let currentSceneIndex = 0;
    let sceneStartTime = 0;

    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      if (timeSeconds >= accumulatedTime && timeSeconds <= accumulatedTime + scene.durationSeconds) {
        currentScene = scene;
        currentSceneIndex = i;
        previousScene = i > 0 ? scenes[i - 1] : null;
        sceneStartTime = accumulatedTime;
        break;
      }
      accumulatedTime += scene.durationSeconds;
    }

    // If time is past the end, pin to last scene
    if (!currentScene && scenes.length > 0) {
      currentSceneIndex = scenes.length - 1;
      currentScene = scenes[currentSceneIndex];
      previousScene = currentSceneIndex > 0 ? scenes[currentSceneIndex - 1] : null;
      sceneStartTime = accumulatedTime - currentScene.durationSeconds;
    }

    if (!currentScene) {
      this.drawEmptyState(width, height);
      return;
    }

    const sceneLocalTime = Math.max(0, timeSeconds - sceneStartTime);
    const sceneProgress = Math.min(1, sceneLocalTime / currentScene.durationSeconds);

    // Check if timeline V1 has an active clip at this time
    const timeMs = timeSeconds * 1000;
    const v1ClipIndex = v1Track?.clips.findIndex(
      (c) => timeMs >= c.startMs && timeMs < c.startMs + c.durationMs
    ) ?? -1;
    const v1Clip = v1ClipIndex >= 0 ? v1Track!.clips[v1ClipIndex] : undefined;
    const prevV1Clip = v1ClipIndex > 0 ? v1Track!.clips[v1ClipIndex - 1] : undefined;

    const clipOffsetMs = v1Clip ? timeMs - v1Clip.startMs + v1Clip.offsetMs : sceneLocalTime * 1000;

    // Check if there is an active transition (either on clip or scene)
    const clipTransition = v1Clip?.transition;
    const transDurationMs = clipTransition?.durationMs || 1000;
    const transDurationSec = transDurationMs / 1000;
    const isTransitionActive = clipTransition && v1Clip && clipOffsetMs < transDurationMs;

    if (isTransitionActive && (previousScene || prevV1Clip)) {
      // Offscreen multi-buffer rendering for seamless transition blend
      const [canvasFrom, canvasTo] = this.getScratchCanvases(width, height);
      const ctxFrom = canvasFrom.getContext('2d');
      const ctxTo = canvasTo.getContext('2d');

      if (ctxFrom && ctxTo) {
        // Draw Outgoing (From) Frame onto canvasFrom
        const origCtx = this.ctx;
        this.ctx = ctxFrom;
        this.ctx.clearRect(0, 0, width, height);
        const fromScene = previousScene || currentScene;
        this.drawBackground(width, height, fromScene, 1.0, prevV1Clip, prevV1Clip ? prevV1Clip.durationMs : fromScene.durationSeconds * 1000);

        // Draw Incoming (To) Frame onto canvasTo
        this.ctx = ctxTo;
        this.ctx.clearRect(0, 0, width, height);
        this.drawBackground(width, height, currentScene, sceneProgress, v1Clip, clipOffsetMs);

        // Restore primary context and render transition
        this.ctx = origCtx;
        this.ctx.clearRect(0, 0, width, height);

        const rawProgress = Math.max(0, Math.min(1, clipOffsetMs / transDurationMs));
        TransitionEngine.renderTransition(
          this.ctx,
          width,
          height,
          canvasFrom,
          canvasTo,
          clipTransition.type,
          rawProgress,
          clipTransition.easing || 'ease-in-out'
        );
      } else {
        this.drawBackground(width, height, currentScene, sceneProgress, v1Clip, clipOffsetMs);
      }
    } else {
      // 1. Draw Background & Image (with keyframe transform if available)
      this.drawBackground(width, height, currentScene, sceneProgress, v1Clip, clipOffsetMs);
    }

    // 2. Draw Camera Motion / Overlays
    this.drawSceneVisuals(width, height, currentScene, sceneProgress);

    // 3. Draw Kinetic Typography / Animated Subtitles (only if T1 track is visible)
    const t1Track = project.timeline?.tracks.find((t) => t.id === 'track-t1');
    const isT1Visible = t1Track ? t1Track.isVisible : true;
    if (isT1Visible) {
      this.drawSubtitlesAndText(width, height, currentScene, sceneLocalTime);
    }

    // 4. Draw Studio Watermark & Scene Info
    this.drawWatermark(width, height, currentScene.title, timeSeconds);
  }

  private drawEmptyState(width: number, height: number): void {
    this.ctx.fillStyle = '#0f172a';
    this.ctx.fillRect(0, 0, width, height);
    this.ctx.fillStyle = '#64748b';
    this.ctx.font = 'bold 32px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Sin escenas para reproducir', width / 2, height / 2);
  }

  private drawBackground(width: number, height: number, scene: Scene, progress: number, activeClip?: TimelineClip, clipTimeMs?: number): void {
    const img = scene.imageUrl ? this.imageCache.get(scene.imageUrl) : null;

    if (img) {
      this.ctx.save();

      // Calculate camera motion transform (or interpolated keyframes if clip has animations)
      let scale = 1.0;
      let dx = 0;
      let dy = 0;
      let rotation = 0;
      let opacity = 1.0;

      if (activeClip?.animations && activeClip.animations.length > 0 && clipTimeMs !== undefined) {
        const keyframeTransform = KeyframeEngine.interpolateClipTransform(
          activeClip.animations,
          clipTimeMs,
          activeClip.transform,
          activeClip.opacity
        );
        dx = keyframeTransform.positionX;
        dy = keyframeTransform.positionY;
        scale = keyframeTransform.scale;
        rotation = keyframeTransform.rotation;
        opacity = keyframeTransform.opacity;
      } else {
        // Fallback procedural camera motion
        if (scene.cameraMotion === 'Zoom In') {
          scale = 1.0 + progress * 0.15;
        } else if (scene.cameraMotion === 'Zoom Out') {
          scale = 1.15 - progress * 0.15;
        } else if (scene.cameraMotion === 'Pan Left') {
          dx = -progress * 40;
        } else if (scene.cameraMotion === 'Pan Right') {
          dx = progress * 40;
        }
      }

      this.ctx.translate(width / 2 + dx, height / 2 + dy);
      if (rotation !== 0) {
        this.ctx.rotate((rotation * Math.PI) / 180);
      }
      this.ctx.scale(scale, scale);
      this.ctx.globalAlpha = opacity;

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

      this.ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      this.ctx.restore();

      // Dark overlay for readability
      this.ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
      this.ctx.fillRect(0, 0, width, height);
    } else {
      // Procedural artistic gradient background
      const grad = this.ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#090d16');
      grad.addColorStop(0.5, '#1e1b4b');
      grad.addColorStop(1, '#0f172a');

      this.ctx.fillStyle = grad;
      this.ctx.fillRect(0, 0, width, height);

      // Subtle animated particle or grid accent
      this.ctx.strokeStyle = 'rgba(99, 102, 241, 0.08)';
      this.ctx.lineWidth = 2;
      const gridSize = 60;
      const offset = (progress * 30) % gridSize;

      for (let x = offset; x < width; x += gridSize) {
        this.ctx.beginPath();
        this.ctx.moveTo(x, 0);
        this.ctx.lineTo(x, height);
        this.ctx.stroke();
      }
    }
  }

  private drawSceneVisuals(width: number, _height: number, scene: Scene, progress: number): void {
    // Visual intent indicator banner
    this.ctx.fillStyle = 'rgba(99, 102, 241, 0.15)';
    this.ctx.fillRect(60, 60, width - 120, 6);

    this.ctx.fillStyle = '#818cf8';
    this.ctx.fillRect(60, 60, (width - 120) * progress, 6);

    // Intención narrativa
    this.ctx.font = '500 18px sans-serif';
    this.ctx.fillStyle = '#a5b4fc';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`INTENCIÓN VISUAL: ${scene.visualIntent.toUpperCase()}`, 60, 95);
  }

  private drawSubtitlesAndText(width: number, height: number, scene: Scene, sceneLocalTime: number): void {
    const subtitles = scene.subtitles && scene.subtitles.length > 0
      ? scene.subtitles
      : [scene.narrationText];

    const partDuration = scene.durationSeconds / subtitles.length;
    const currentSubIndex = Math.min(
      subtitles.length - 1,
      Math.floor(sceneLocalTime / partDuration)
    );

    const currentText = subtitles[currentSubIndex] || scene.narrationText;

    // Draw main narration kinetic typography
    this.ctx.save();

    // Kinetic entry effect (fade in & slide up)
    const subLocalTime = sceneLocalTime % partDuration;
    const entryProgress = Math.min(1, subLocalTime * 3); // 0.33s fade in
    const opacity = entryProgress;
    const translateY = (1 - entryProgress) * 15;

    this.ctx.globalAlpha = opacity;
    this.ctx.translate(0, translateY);

    // Text Container Box
    const boxPaddingHorizontal = 40;
    const boxHeight = 160;
    const boxY = height - boxHeight - 80;

    this.ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    this.ctx.beginPath();
    this.ctx.roundRect(60, boxY, width - 120, boxHeight, 16);
    this.ctx.fill();

    this.ctx.strokeStyle = 'rgba(99, 102, 241, 0.3)';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    // Render Subtitle Text with Wrap
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '600 28px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    this.wrapAndRenderText(currentText, width / 2, boxY + boxHeight / 2, width - 120 - boxPaddingHorizontal * 2, 36);

    this.ctx.restore();
  }

  private wrapAndRenderText(text: string, x: number, y: number, maxWidth: number, lineHeight: number): void {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = words[0] || '';

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = this.ctx.measureText(currentLine + ' ' + word).width;
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
      this.ctx.fillText(line, x, startY + index * lineHeight);
    });
  }

  private drawWatermark(width: number, height: number, sceneTitle: string, totalTime: number): void {
    // Top right badge
    this.ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    this.ctx.beginPath();
    this.ctx.roundRect(width - 240, 24, 216, 36, 18);
    this.ctx.fill();

    this.ctx.fillStyle = '#c7d2fe';
    this.ctx.font = '600 13px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('ESTUDIO AUDIOVISUAL IA', width - 132, 47);

    // Bottom left scene indicator
    this.ctx.fillStyle = '#94a3b8';
    this.ctx.font = '500 14px sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`${sceneTitle} | ${totalTime.toFixed(1)}s`, 60, height - 30);
  }
}
