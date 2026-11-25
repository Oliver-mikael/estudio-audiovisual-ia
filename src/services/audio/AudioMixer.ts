// Multitrack Audio Mixer Service (Phase 7D)
// Controls track volume faders, solo, mute, ducking and master output levels.
import { AudioTrackConfig } from '../../types/audio';
import { audioEngine } from './AudioEngine';

export class AudioMixer {
  private trackConfigs: Map<string, AudioTrackConfig> = new Map();
  private masterVolume: number = 1.0;
  private duckingEnabled: boolean = true;

  constructor() {
    this.initDefaultTracks();
  }

  private initDefaultTracks(): void {
    const defaults: AudioTrackConfig[] = [
      {
        id: 'track-a1',
        name: 'A1: Locución Principal',
        volume: 1.0,
        isMuted: false,
        isSolo: false,
        pan: 0,
        duckingAmount: 0,
      },
      {
        id: 'track-a2',
        name: 'A2: Música de Fondo',
        volume: 0.25,
        isMuted: false,
        isSolo: false,
        pan: 0,
        duckingAmount: 0.6, // Ducks by 60% during voiceover
      },
      {
        id: 'track-a3',
        name: 'A3: Efectos Sonoros (SFX)',
        volume: 0.7,
        isMuted: false,
        isSolo: false,
        pan: 0,
        duckingAmount: 0,
      },
    ];

    defaults.forEach((t) => this.trackConfigs.set(t.id, t));
  }

  public getTrackConfigs(): AudioTrackConfig[] {
    return Array.from(this.trackConfigs.values());
  }

  public getTrackConfig(trackId: string): AudioTrackConfig | undefined {
    return this.trackConfigs.get(trackId);
  }

  public setTrackVolume(trackId: string, volume: number): void {
    const cfg = this.trackConfigs.get(trackId);
    if (!cfg) return;

    cfg.volume = Math.max(0, Math.min(1.5, volume));
    this.syncWithEngine();
  }

  public toggleMute(trackId: string): void {
    const cfg = this.trackConfigs.get(trackId);
    if (!cfg) return;

    cfg.isMuted = !cfg.isMuted;
    this.syncWithEngine();
  }

  public toggleSolo(trackId: string): void {
    const cfg = this.trackConfigs.get(trackId);
    if (!cfg) return;

    cfg.isSolo = !cfg.isSolo;
    this.syncWithEngine();
  }

  public setMasterVolume(level: number): void {
    this.masterVolume = Math.max(0, Math.min(1.5, level));
    audioEngine.setMasterVolume(this.masterVolume);
  }

  public getMasterVolume(): number {
    return this.masterVolume;
  }

  public setDuckingEnabled(enabled: boolean): void {
    this.duckingEnabled = enabled;
  }

  public isDuckingEnabled(): boolean {
    return this.duckingEnabled;
  }

  private syncWithEngine(): void {
    audioEngine.setupTracks(this.getTrackConfigs());
  }
}

export const audioMixer = new AudioMixer();
