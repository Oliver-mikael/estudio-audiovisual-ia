// Domain Core Types for Estudio Audiovisual Inteligente

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
  /** Subtítulos editables de la escena, en orden. */
  subtitles?: SubtitleEntry[];
  notes?: string;
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
    aspectRatio: '16:9' | '9:16' | '1:1';
    /** Volumen general de la música de fondo, de 0 a 1 (por defecto 0,6). */
    musicVolume?: number;
    /** Clave de la API de Gemini para generar guiones. Solo se guarda en este proyecto. */
    geminiApiKey?: string;
    /** Modelo de Gemini a usar (por defecto gemini-2.5-flash). */
    geminiModel?: string;
    /** Clave de Google Cloud Text-to-Speech para generar voces. */
    ttsApiKey?: string;
    /** Voz de Google Cloud TTS elegida (femenina o masculina). */
    ttsVoice?: string;
    /** Clave de la API de Pexels para buscar imágenes de escena. */
    pexelsApiKey?: string;
    /** Gancho visual superpuesto en los primeros 3 s (activado por defecto). */
    introHookEnabled?: boolean;
    /** Texto del gancho; si está vacío se usa el título de la primera escena. */
    introHookText?: string;
  };
}
