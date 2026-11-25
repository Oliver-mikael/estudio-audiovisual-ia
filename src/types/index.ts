// Tipos del dominio de Estudio Audiovisual Inteligente

export type ProjectId = string;

export interface SourceReference {
  id: string;
  title: string;
  url?: string;
  author?: string;
  license: 'CC-BY' | 'CC-BY-SA' | 'Public Domain' | 'Fair Use' | 'Custom / Owned' | 'Unverified';
  evidenceType: 'Fact' | 'Interpretation' | 'Hypothesis' | 'Debunked';
  notes: string;
  verified: boolean;
}

export interface NarrativeAngle {
  id: string;
  title: string;
  hook: string;
  perspective: string;
  criticalQuestions: string[];
  alternativeApproach: string;
}

/** Animación de entrada y salida de un subtítulo. */
export type SubtitleAnimation = 'Fade' | 'Typewriter' | 'SlideUp';

/** Línea de subtítulo con tiempos explícitos dentro de la escena (segundos). */
export interface SubtitleCue {
  text: string;
  /** Inicio desde el comienzo de la escena. Si falta, se reparte automáticamente. */
  startSeconds?: number;
  /** Duración visible. Si falta, se reparte automáticamente. */
  durationSeconds?: number;
  /** Animación de entrada/salida propia de esta línea (por defecto, fundido). */
  animation?: SubtitleAnimation;
}

/** Compatibilidad: las escenas antiguas guardan solo el texto y usan el reparto automático. */
export type SubtitleEntry = string | SubtitleCue;

/** Corrección de color de una escena; 1.0 es el valor neutro de cada control. */
export interface SceneColorGrade {
  brightness?: number;
  contrast?: number;
  saturation?: number;
}

export interface Scene {
  id: string;
  title: string;
  narrationText: string;
  visualIntent: string; // E.g. "Mostrar gráfico comparativo de datos"
  cameraMotion: 'Static' | 'Zoom In' | 'Zoom Out' | 'Pan Left' | 'Pan Right' | 'Kinetic Text';
  transition: 'Cut' | 'Fade' | 'Slide' | 'Zoom';
  /** Duración de la transición de entrada, en segundos (por defecto 0,5 s). */
  transitionDurationSeconds?: number;
  durationSeconds: number;
  imageUrl?: string;
  /** Id del recurso de imagen de la biblioteca (permite reconstruir la URL). */
  imageAssetId?: string;
  /** Imagen secundaria para los cortes automáticos (B-roll). */
  secondaryImageUrl?: string;
  secondaryImageAssetId?: string;
  /** Cortes automáticos cada 3 s entre imagen principal y secundaria. */
  autoCuts?: boolean;
  /** Clip de video de la biblioteca que se usa como fondo animado. */
  videoUrl?: string;
  videoAssetId?: string;
  audioUrl?: string;
  /** Efecto de sonido (audio corto de la biblioteca) que suena al iniciar la escena. */
  sfxAssetId?: string;
  /** Audio de narración propio de la escena (voz TTS o audio importado). */
  narrationAssetId?: string;
  /** Brillo, contraste y saturación aplicados al dibujar la escena. */
  colorGrade?: SceneColorGrade;
  /** Subtítulos editables de la escena, en orden. */
  subtitles?: SubtitleEntry[];
  notes?: string;
}

export interface MediaFolder {
  id: string;
  name: string;
  parentId?: string;
  createdAt: number;
}

export interface MissingMediaRef {
  assetId: string;
  expectedName: string;
  expectedType: 'image' | 'audio' | 'video';
  affectedClipsCount: number;
  expectedSizeBytes?: number;
  expectedDurationSeconds?: number;
}

export interface MediaAsset {
  id: string;
  name: string;
  type: 'image' | 'audio' | 'video';
  url: string;
  fileBlob?: Blob;
  mimeType: string;
  sizeBytes: number;
  license: string;
  provenance: string;
  createdAt: number;
  // Phase 7E - Technical metadata and organization
  width?: number;
  height?: number;
  durationSeconds?: number;
  aspectRatio?: string;
  thumbnailUrl?: string;
  sha256?: string;
  folderId?: string;
  tags?: string[];
  isMissing?: boolean;
}

export interface ScriptModel {
  title: string;
  summary: string;
  targetAudience: string;
  tone: 'Divulgativo' | 'Riguroso' | 'Dramático' | 'Crítico' | 'Minimalista';
  scenes: Scene[];
}

export interface Project {
  id: ProjectId;
  title: string;
  description: string;
  createdAt: number;
  updatedAt: number;
  angles: NarrativeAngle[];
  sources: SourceReference[];
  script: ScriptModel;
  mediaAssets: MediaAsset[];
  /** Id del MediaAsset de audio usado como pista de narración al exportar. */
  narrationAssetId?: string;
  /** Id del MediaAsset de audio usado como música de fondo (con ducking). */
  musicAssetId?: string;
  settings: {
    fps: number;
    resolution: {
      width: number;
      height: number;
    };
    aspectRatio: '16:9' | '9:16' | '1:1' | '4:5';
  };
  // Phase 7B - Multi-track timeline & professional color/audio extensions
  timeline?: {
    tracks: TimelineTrack[];
    activeTrackId?: string;
    markers?: TimelineMarker[];
  };
  // Phase 7E - Media library folders
  folders?: MediaFolder[];
}

export type TrackType = 'video' | 'audio' | 'text' | 'subtitles';

export interface TimelineClip {
  id: string;
  name: string;
  trackId: string;
  sceneId?: string; // Links to documentary scene if applicable
  assetId?: string; // Links to MediaAsset in IndexedDB
  type: 'video' | 'image' | 'audio' | 'text' | 'caption';
  startMs: number;
  durationMs: number;
  offsetMs: number; // In-point offset within media
  volume?: number; // 0.0 to 2.0
  speed?: number; // 0.25 to 4.0
  opacity?: number; // 0.0 to 1.0
  transform?: {
    x: number;
    y: number;
    scale: number;
    rotation: number;
  };
  colorAdjustments?: {
    brightness: number; // -1.0 to 1.0
    contrast: number; // 0.0 to 2.0
    saturation: number; // 0.0 to 2.0
    temperature: number; // -100 to 100
    vignette: number; // 0.0 to 1.0
  };
  filterPreset?: 'none' | 'cinematic' | 'documentary-warm' | 'noir' | 'vintage' | 'vivid';
  textPayload?: string;
  isMuted?: boolean;
  isLocked?: boolean;
  // Phase 7F - Transition and Keyframe Animations
  transition?: ClipTransition;
  animations?: ClipAnimation[];
}

// Phase 7F - Transitions & Keyframe Animations System Types
export type TransitionType =
  | 'cut'
  | 'fade'
  | 'crossfade'
  | 'slide-left'
  | 'slide-right'
  | 'slide-up'
  | 'slide-down'
  | 'zoom-in'
  | 'zoom-out'
  | 'wipe-left'
  | 'wipe-right'
  | 'fade-to-black'
  | 'fade-from-black';

export type EasingCurve = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';

export interface ClipTransition {
  id: string;
  type: TransitionType;
  durationMs: number;
  easing?: EasingCurve;
  fromClipId?: string;
  toClipId?: string;
}

export type KeyframeProperty = 'positionX' | 'positionY' | 'scale' | 'rotation' | 'opacity';

export interface AnimationKeyframe {
  id: string;
  timeOffsetMs: number;
  value: number;
  easing?: EasingCurve;
}

export interface ClipAnimation {
  property: KeyframeProperty;
  keyframes: AnimationKeyframe[];
}

export interface TimelineTrack {
  id: string;
  name: string;
  type: TrackType;
  order: number;
  isMuted: boolean;
  isLocked: boolean;
  isVisible: boolean;
  clips: TimelineClip[];
  transitions?: ClipTransition[];
}

export interface TimelineMarker {
  id: string;
  timeMs: number;
  label: string;
  color: 'indigo' | 'emerald' | 'amber' | 'rose' | 'purple';
}

export interface SubtitleCue {
  id: string;
  startMs: number;
  endMs: number;
  text: string;
  speaker?: string;
  isVerified?: boolean;
}

export interface ExportProfile {
  id: string;
  name: string;
  format: 'webm' | 'mp4';
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:5';
  resolution: { width: number; height: number };
  fps: 24 | 30 | 60;
  bitrateBps: number;
  includeAudio: boolean;
  description: string;
}
