// Domain Core Types for Audio Engine, Multitrack Mixer & Voice Recorder (Phase 7D)

export interface AudioPlaybackState {
  isPlaying: boolean;
  currentTimeMs: number;
  durationMs: number;
  playbackRate: number;
}

export interface AudioTrackConfig {
  id: string; // e.g. 'track-a1', 'track-a2', 'track-a3'
  name: string; // e.g. 'A1: Locución Principal', 'A2: Música', 'A3: Efectos'
  volume: number; // 0.0 to 1.5 (default 1.0)
  isMuted: boolean;
  isSolo: boolean;
  pan: number; // -1.0 (left) to 1.0 (right)
  duckingAmount?: number; // 0.0 to 1.0 (gain reduction during voiceover)
}

export interface AudioBufferMetadata {
  id: string;
  assetId?: string;
  name: string;
  durationSeconds: number;
  sampleRate: number;
  numberOfChannels: number;
  url: string;
}

export interface VoiceRecordingSession {
  isRecording: boolean;
  isPaused: boolean;
  durationMs: number;
  audioBlob?: Blob;
  audioUrl?: string;
  mimeType: string;
  errorMessage?: string;
}

export interface AudioFaderLevels {
  masterLevel: number; // 0.0 to 1.0
  trackLevels: Record<string, number>; // trackId -> peak level (0.0 to 1.0)
}

export interface AudioExportOptions {
  includeAudio: boolean;
  masterVolume: number;
  duckingEnabled: boolean;
}
