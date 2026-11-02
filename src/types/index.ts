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

export interface Scene {
  id: string;
  title: string;
  narrationText: string;
  visualIntent: string; // E.g. "Mostrar gráfico comparativo de datos"
  cameraMotion: 'Static' | 'Zoom In' | 'Zoom Out' | 'Pan Left' | 'Pan Right' | 'Kinetic Text';
  transition: 'Cut' | 'Fade' | 'Slide' | 'Zoom';
  durationSeconds: number;
  imageUrl?: string;
  audioUrl?: string;
  subtitles?: string[];
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
