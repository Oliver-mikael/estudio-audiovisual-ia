import { describe, it, expect } from 'vitest';
import { Project, TimelineTrack, TimelineClip, ExportProfile } from '../types';
import { EXPORT_PROFILES } from '../components/ExportProfilesModal';

describe('Auditoría y Pruebas Unitarias Fase 7B — Estudio de Producción & Modelos de Datos', () => {
  it('7B.1 Perfiles de exportación: define perfiles para 16:9, 9:16 vertical y 1:1 cuadrado', () => {
    expect(EXPORT_PROFILES.length).toBeGreaterThanOrEqual(4);

    const fullHd = EXPORT_PROFILES.find((p) => p.id === 'hd-1080p-16-9');
    expect(fullHd).toBeDefined();
    expect(fullHd?.resolution.width).toBe(1920);
    expect(fullHd?.resolution.height).toBe(1080);
    expect(fullHd?.aspectRatio).toBe('16:9');

    const vertical = EXPORT_PROFILES.find((p) => p.id === 'vertical-1080p-9-16');
    expect(vertical).toBeDefined();
    expect(vertical?.resolution.width).toBe(1080);
    expect(vertical?.resolution.height).toBe(1920);
    expect(vertical?.aspectRatio).toBe('9:16');

    const square = EXPORT_PROFILES.find((p) => p.id === 'square-720p-1-1');
    expect(square).toBeDefined();
    expect(square?.aspectRatio).toBe('1:1');
  });

  it('7B.2 Extensión de Timeline: soporta estructura multipista V1, A1 y T1 compatible hacia atrás', () => {
    const dummyClip: TimelineClip = {
      id: 'clip-01',
      name: 'Escena Inicial',
      trackId: 'track-v1',
      sceneId: 'scene-01',
      type: 'image',
      startMs: 0,
      durationMs: 15000,
      offsetMs: 0,
      volume: 1.0,
      speed: 1.0,
      opacity: 1.0,
      transform: { x: 0, y: 0, scale: 1.0, rotation: 0 },
      colorAdjustments: {
        brightness: 0,
        contrast: 1.0,
        saturation: 1.0,
        temperature: 0,
        vignette: 0.1,
      },
    };

    const dummyTrack: TimelineTrack = {
      id: 'track-v1',
      name: 'Pista de Video 1',
      type: 'video',
      order: 0,
      isMuted: false,
      isLocked: false,
      isVisible: true,
      clips: [dummyClip],
    };

    const projectWithTimeline: Project = {
      id: 'proj-7b-test',
      title: 'Proyecto con Timeline Multipista',
      description: 'Prueba de compatibilidad de estructura de tracks',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      angles: [],
      sources: [],
      script: {
        title: 'Guion Base',
        summary: 'Resumen',
        targetAudience: 'General',
        tone: 'Divulgativo',
        scenes: [],
      },
      mediaAssets: [],
      settings: {
        fps: 30,
        resolution: { width: 1280, height: 720 },
        aspectRatio: '16:9',
      },
      timeline: {
        tracks: [dummyTrack],
        activeTrackId: 'track-v1',
      },
    };

    expect(projectWithTimeline.timeline?.tracks).toHaveLength(1);
    expect(projectWithTimeline.timeline?.tracks[0].clips[0].colorAdjustments?.vignette).toBe(0.1);
    expect(projectWithTimeline.timeline?.tracks[0].clips[0].speed).toBe(1.0);
  });

  it('7B.3 SMPTE Timecode: cálculo preciso de códigos de tiempo a 30 FPS', () => {
    const formatSMPTE = (seconds: number, fps: number = 30): string => {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      const frames = Math.floor((seconds % 1) * fps);
      return `00:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}:${String(frames).padStart(2, '0')}`;
    };

    expect(formatSMPTE(0)).toBe('00:00:00:00');
    expect(formatSMPTE(85.5)).toBe('00:01:25:15'); // 1m 25s 15 frames
    expect(formatSMPTE(120)).toBe('00:02:00:00');
  });

  it('7B.4 Estimación de peso en megabytes: calcula proporcionalmente según bitrate y duración', () => {
    const calculateSizeMb = (durationSeconds: number, bitrateBps: number): number => {
      return (durationSeconds * (bitrateBps / 8)) / (1024 * 1024);
    };

    // 85 segundos a 2.5 Mbps (720p)
    const size720p = calculateSizeMb(85, 2500000);
    expect(size720p).toBeGreaterThan(20);
    expect(size720p).toBeLessThan(30);

    // 85 segundos a 5.0 Mbps (1080p)
    const size1080p = calculateSizeMb(85, 5000000);
    expect(size1080p).toBeGreaterThan(45);
    expect(size1080p).toBeLessThan(60);
  });
});
