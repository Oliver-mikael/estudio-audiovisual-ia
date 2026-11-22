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
  /** Id del MediaAsset de audio usado como pista de narración al exportar. */
  narrationAssetId?: string;
  settings: {
    fps: number;
    resolution: {
      width: number;
      height: number;
    };
    aspectRatio: '16:9' | '9:16' | '1:1';
  };
}
