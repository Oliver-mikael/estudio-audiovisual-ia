import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AudioEngine } from '../services/audio/AudioEngine';
import { AudioMixer } from '../services/audio/AudioMixer';
import { AudioPersistence } from '../services/audio/AudioPersistence';
import { Project, MediaAsset } from '../types';

// Mock Web Audio API
class MockGainNode {
  gain = {
    value: 1,
    setValueAtTime: vi.fn((val: number) => { this.gain.value = val; }),
    linearRampToValueAtTime: vi.fn(),
  };
  connect = vi.fn();
  disconnect = vi.fn();
}

class MockAudioBufferSourceNode {
  buffer: any = null;
  playbackRate = { value: 1 };
  connect = vi.fn();
  disconnect = vi.fn();
  start = vi.fn();
  stop = vi.fn();
  onended: (() => void) | null = null;
}

class MockOscillatorNode {
  type = 'sine';
  frequency = {
    value: 220,
    setValueAtTime: vi.fn(),
  };
  connect = vi.fn();
  disconnect = vi.fn();
  start = vi.fn();
  stop = vi.fn();
}

class MockAudioContext {
  state = 'running';
  currentTime = 0;
  createGain = vi.fn(() => new MockGainNode());
  createBufferSource = vi.fn(() => new MockAudioBufferSourceNode());
  createOscillator = vi.fn(() => new MockOscillatorNode());
  createMediaStreamDestination = vi.fn(() => ({
    stream: {
      getAudioTracks: () => [{} as any],
    },
  }));
  decodeAudioData = vi.fn(async (_buffer: ArrayBuffer) => ({
    duration: 5.0,
    numberOfChannels: 2,
    sampleRate: 44100,
    length: 220500,
  }));
  resume = vi.fn(async () => {});
  close = vi.fn(async () => {});
}

// Setup Global Mocks
beforeEach(() => {
  (global as any).window = global;
  (global as any).AudioContext = MockAudioContext;
  (global as any).webkitAudioContext = MockAudioContext;
  (global as any).indexedDB = {
    open: vi.fn(() => ({
      result: {
        transaction: vi.fn(() => ({
          objectStore: vi.fn(() => ({
            put: vi.fn((_val) => {
              const req: any = {};
              setTimeout(() => req.onsuccess && req.onsuccess(), 0);
              return req;
            }),
            get: vi.fn((_id) => {
              const req: any = {};
              setTimeout(() => req.onsuccess && req.onsuccess(), 0);
              return req;
            }),
          })),
        })),
        objectStoreNames: { contains: () => true },
      },
      set onsuccess(cb: any) {
        setTimeout(cb, 0);
      },
    })),
  };
});

describe('Phase 7D: Audio Engine & Multitrack Mixing', () => {
  it('initializes AudioEngine singleton and creates master and track gains', async () => {
    const engine = AudioEngine.getInstance();
    await engine.initContext();
    const stream = engine.getDestinationStream();

    expect(stream).toBeDefined();
    expect(stream?.getAudioTracks().length).toBe(1);

    engine.setMasterVolume(0.8);
    // Success without throwing
    expect(engine.getContext()).toBeDefined();
  });

  it('manages track configs, mute and solo through AudioMixer', () => {
    const mixer = new AudioMixer();
    const configs = mixer.getTrackConfigs();

    expect(configs.length).toBe(3);
    expect(configs[0].id).toBe('track-a1');
    expect(configs[0].volume).toBe(1.0);

    mixer.setTrackVolume('track-a1', 0.5);
    expect(mixer.getTrackConfig('track-a1')?.volume).toBe(0.5);

    mixer.toggleMute('track-a2');
    expect(mixer.getTrackConfig('track-a2')?.isMuted).toBe(true);

    mixer.toggleSolo('track-a1');
    expect(mixer.getTrackConfig('track-a1')?.isSolo).toBe(true);

    mixer.setMasterVolume(0.85);
    expect(mixer.getMasterVolume()).toBe(0.85);
  });

  it('toggles and queries auto-ducking configuration', () => {
    const mixer = new AudioMixer();
    expect(mixer.isDuckingEnabled()).toBe(true);

    mixer.setDuckingEnabled(false);
    expect(mixer.isDuckingEnabled()).toBe(false);

    mixer.setDuckingEnabled(true);
    expect(mixer.isDuckingEnabled()).toBe(true);
  });

  it('handles AudioPersistence with validation', async () => {
    const mockAsset: MediaAsset = {
      id: 'asset_audio_1',
      name: 'Voz en off',
      type: 'audio',
      url: 'blob:audio/test',
      mimeType: 'audio/webm',
      sizeBytes: 1024,
      createdAt: Date.now(),
      license: 'Propietario',
      provenance: 'Voice Recording',
    };

    await AudioPersistence.saveAudioAsset(mockAsset);

    const invalidAsset: any = {
      id: 'asset_video_1',
      name: 'Video',
      type: 'video',
      mimeType: 'video/mp4',
      license: 'Propietario',
    };

    await expect(AudioPersistence.saveAudioAsset(invalidAsset)).rejects.toThrow();

    const buffer = new Uint8Array([1, 2, 3]).buffer;
    const blob = AudioPersistence.arrayBufferToBlob(buffer, 'audio/webm');
    expect(blob.type).toBe('audio/webm');

    const convertedBuffer = await AudioPersistence.blobToArrayBuffer(blob);
    expect(convertedBuffer.byteLength).toBe(3);
  });

  it('schedules playback on AudioEngine for a project', async () => {
    const engine = AudioEngine.getInstance();
    await engine.initContext();

    const sampleProject: Project = {
      id: 'proj_test',
      title: 'Audio Playback Test',
      description: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      angles: [],
      sources: [],
      script: {
        title: 'Script',
        summary: 'Resumen',
        targetAudience: 'General',
        tone: 'Divulgativo',
        scenes: [
          {
            id: 'sc_1',
            title: 'Escena 1',
            visualIntent: 'Visual 1',
            narrationText: 'Texto narrado 1',
            durationSeconds: 3,
            cameraMotion: 'Static',
            transition: 'Fade',
          },
        ],
      },
      mediaAssets: [],
      settings: {
        resolution: { width: 1280, height: 720 },
        fps: 30,
        aspectRatio: '16:9',
      },
      timeline: {
        tracks: [
          {
            id: 'track-a1',
            name: 'A1 Audio',
            type: 'audio',
            order: 1,
            isLocked: false,
            isMuted: false,
            isVisible: true,
            clips: [
              {
                id: 'clip_a1',
                trackId: 'track-a1',
                type: 'audio',
                name: 'Audio 1',
                startMs: 0,
                durationMs: 3000,
                offsetMs: 0,
                volume: 1.0,
              },
            ],
          },
        ],
        markers: [],
      },
    };

    await engine.play(sampleProject, 0);
    expect(engine.getContext()).toBeDefined();

    engine.stop();
    // Verify cleanup
    expect(engine.getContext()?.state).toBe('running');
  });
});
