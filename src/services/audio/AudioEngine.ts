// Core Web Audio Engine for Multitrack Mixing & Video Audio Synchronization (Phase 7D)
import { Project, TimelineClip } from '../../types';
import { AudioTrackConfig } from '../../types/audio';

export class AudioEngine {
  private static instance: AudioEngine | null = null;
  private audioCtx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private destinationNode: MediaStreamAudioDestinationNode | null = null;
  private trackGainNodes: Map<string, GainNode> = new Map();
  private bufferCache: Map<string, AudioBuffer> = new Map();
  private activeSourceNodes: AudioBufferSourceNode[] = [];

  public isPlaying: boolean = false;
  public currentPlayheadMs: number = 0;
  public playbackStartedAt: number = 0;

  private constructor() {}

  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  /**
   * Initializes or resumes the singleton AudioContext to comply with browser autoplay policies.
   */
  public async initContext(): Promise<AudioContext> {
    if (!this.audioCtx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();

      // Master output gain
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.setValueAtTime(1.0, this.audioCtx.currentTime);

      // Connect master gain to hardware speakers
      this.masterGain.connect(this.audioCtx.destination);

      // MediaStream destination for real-time video export mixing
      this.destinationNode = this.audioCtx.createMediaStreamDestination();
      this.masterGain.connect(this.destinationNode);
    }

    if (this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }

    return this.audioCtx;
  }

  public getContext(): AudioContext | null {
    return this.audioCtx;
  }

  public getDestinationStream(): MediaStream | null {
    return this.destinationNode ? this.destinationNode.stream : null;
  }

  /**
   * Loads and decodes an audio buffer from URL or Blob.
   */
  public async loadBuffer(url: string, fileBlob?: Blob): Promise<AudioBuffer> {
    if (this.bufferCache.has(url)) {
      return this.bufferCache.get(url)!;
    }

    const ctx = await this.initContext();
    let arrayBuffer: ArrayBuffer;

    if (fileBlob) {
      arrayBuffer = await fileBlob.arrayBuffer();
    } else {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Error descargando audio desde ${url} (${response.status})`);
      }
      arrayBuffer = await response.arrayBuffer();
    }

    const decoded = await ctx.decodeAudioData(arrayBuffer);
    this.bufferCache.set(url, decoded);
    return decoded;
  }

  /**
   * Configures gain nodes for all audio tracks in the project.
   */
  public setupTracks(trackConfigs: AudioTrackConfig[]): void {
    if (!this.audioCtx || !this.masterGain) return;

    // Check if any track has 'solo' active
    const hasSolo = trackConfigs.some((t) => t.isSolo);

    trackConfigs.forEach((cfg) => {
      let gainNode = this.trackGainNodes.get(cfg.id);
      if (!gainNode) {
        gainNode = this.audioCtx!.createGain();
        gainNode.connect(this.masterGain!);
        this.trackGainNodes.set(cfg.id, gainNode);
      }

      // Compute effective volume
      let effectiveGain = cfg.volume;
      if (cfg.isMuted) effectiveGain = 0;
      if (hasSolo && !cfg.isSolo) effectiveGain = 0;

      gainNode.gain.setValueAtTime(effectiveGain, this.audioCtx!.currentTime);
    });
  }

  /**
   * Plays all audio clips from the project synchronized with the playhead.
   */
  public async play(project: Project, startFromMs: number = 0): Promise<void> {
    await this.initContext();
    this.stop(); // Stop any active playback

    if (!this.audioCtx) return;

    this.isPlaying = true;
    this.currentPlayheadMs = startFromMs;
    this.playbackStartedAt = this.audioCtx.currentTime;

    const audioTracks = (project.timeline?.tracks || []).filter((t) => t.type === 'audio');

    for (const track of audioTracks) {
      if (!track.isVisible || track.isMuted) continue;

      let trackGain = this.trackGainNodes.get(track.id);
      if (!trackGain) {
        trackGain = this.audioCtx.createGain();
        trackGain.connect(this.masterGain!);
        this.trackGainNodes.set(track.id, trackGain);
      }

      for (const clip of track.clips) {
        const clipStartMs = clip.startMs;
        const clipEndMs = clip.startMs + clip.durationMs;

        // Clip hasn't played yet or is currently active
        if (clipEndMs > startFromMs) {
          const delayUntilPlaySeconds = Math.max(0, (clipStartMs - startFromMs) / 1000);
          const offsetIntoClipSeconds =
            startFromMs > clipStartMs
              ? (startFromMs - clipStartMs + (clip.offsetMs || 0)) / 1000
              : (clip.offsetMs || 0) / 1000;
          const remainingDurationSeconds = Math.max(
            0.1,
            (clipEndMs - Math.max(clipStartMs, startFromMs)) / 1000
          );

          // If the clip references an asset or generated synthetic tone
          await this.scheduleClip(
            clip,
            trackGain,
            delayUntilPlaySeconds,
            offsetIntoClipSeconds,
            remainingDurationSeconds
          );
        }
      }
    }
  }

  /**
   * Schedules a buffer source or procedurally synthesized tone for a clip.
   */
  private async scheduleClip(
    clip: TimelineClip,
    targetGain: GainNode,
    delaySeconds: number,
    offsetSeconds: number,
    durationSeconds: number
  ): Promise<void> {
    if (!this.audioCtx) return;

    const startTime = this.audioCtx.currentTime + delaySeconds;

    if (clip.assetId && this.bufferCache.has(clip.assetId)) {
      const buffer = this.bufferCache.get(clip.assetId)!;
      const source = this.audioCtx.createBufferSource();
      source.buffer = buffer;
      source.playbackRate.value = clip.speed || 1.0;

      // Individual clip gain
      const clipGain = this.audioCtx.createGain();
      clipGain.gain.setValueAtTime(clip.volume !== undefined ? clip.volume : 1.0, startTime);
      source.connect(clipGain);
      clipGain.connect(targetGain);

      source.start(startTime, offsetSeconds, durationSeconds);
      this.activeSourceNodes.push(source);
    } else {
      // Procedural harmonic tone generation for clips without explicit binary assets
      const osc = this.audioCtx.createOscillator();
      const oscGain = this.audioCtx.createGain();

      // Pitch based on track type
      osc.type = clip.trackId === 'track-a2' ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(clip.trackId === 'track-a2' ? 110 : 220, startTime);

      const level = (clip.volume || 1.0) * 0.05;
      oscGain.gain.setValueAtTime(0.001, startTime);
      oscGain.gain.linearRampToValueAtTime(level, startTime + 0.05); // Fade in
      oscGain.gain.setValueAtTime(level, startTime + Math.max(0.05, durationSeconds - 0.05));
      oscGain.gain.linearRampToValueAtTime(0.001, startTime + durationSeconds); // Fade out

      osc.connect(oscGain);
      oscGain.connect(targetGain);

      osc.start(startTime);
      osc.stop(startTime + durationSeconds);
      this.activeSourceNodes.push(osc as unknown as AudioBufferSourceNode);
    }
  }

  /**
   * Stops all scheduled sound sources and resets playhead tracking.
   */
  public stop(): void {
    this.activeSourceNodes.forEach((node) => {
      try {
        node.stop();
        node.disconnect();
      } catch (_) {}
    });
    this.activeSourceNodes = [];
    this.isPlaying = false;
  }

  /**
   * Sets master audio output volume (0.0 to 1.5).
   */
  public setMasterVolume(level: number): void {
    if (!this.masterGain || !this.audioCtx) return;
    const bounded = Math.max(0, Math.min(1.5, level));
    this.masterGain.gain.setValueAtTime(bounded, this.audioCtx.currentTime);
  }

  /**
   * Resets and cleans up Web Audio nodes on application unload.
   */
  public dispose(): void {
    this.stop();
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close();
    }
    this.audioCtx = null;
    this.masterGain = null;
    this.destinationNode = null;
    this.trackGainNodes.clear();
    this.bufferCache.clear();
  }
}

export const audioEngine = AudioEngine.getInstance();
