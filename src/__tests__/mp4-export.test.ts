import { describe, expect, it } from 'vitest';
import {
  MP4_VIDEO_CODEC,
  buildExportFileName,
  describeExportFormat,
} from '../engine/exporter';
import { Project } from '../types';

const project = (): Project => ({
  id: 'p34',
  title: 'Prueba MP4',
  description: '',
  createdAt: 0,
  updatedAt: 0,
  angles: [],
  sources: [],
  mediaAssets: [],
  script: {
    title: 'g',
    summary: '',
    targetAudience: '',
    tone: 'Divulgativo',
    scenes: [
      {
        id: 's1',
        title: 'Una',
        narrationText: 'Texto',
        visualIntent: 'x',
        cameraMotion: 'Static',
        transition: 'Cut',
        durationSeconds: 2,
      },
    ],
  },
  settings: { fps: 30, resolution: { width: 1280, height: 720 }, aspectRatio: '16:9' },
});

describe('exportación MP4/H.264', () => {
  it('pide el perfil avc1.42E01E y nombra el archivo con .mp4', () => {
    expect(MP4_VIDEO_CODEC).toBe('avc1.42E01E');
    expect(buildExportFileName(project(), 'mp4')).toBe('prueba-mp4-720p.mp4');
  });

  it('explica que falta H.264 en WebCodecs cuando el navegador no lo soporta', async () => {
    // En Node no existen VideoEncoder/AudioEncoder: el mismo camino que un navegador sin H.264.
    const mp4 = await describeExportFormat(project(), false, 'mp4');
    expect(mp4.container).toBe('MP4');
    expect(mp4.requestedContainer).toBe('mp4');
    expect(mp4.supported).toBe(false);
    expect(mp4.usedWebCodecs).toBe(false);
    expect(mp4.message).toMatch(/H\.264/);
    expect(mp4.message).toMatch(/WebM/);
  });

  it('mantiene WebM como respaldo con MediaRecorder', async () => {
    const webm = await describeExportFormat(project(), false, 'webm');
    expect(webm.container).toBe('WebM');
    expect(webm.supported).toBe(true);
    expect(webm.usedWebCodecs).toBe(false);
    expect(webm.mode).toMatch(/MediaRecorder/);
    expect(webm.message).toBeNull();
  });
});
