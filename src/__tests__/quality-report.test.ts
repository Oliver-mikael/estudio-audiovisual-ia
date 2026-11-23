import { describe, expect, it } from 'vitest';
import { MIN_DURATION_SECONDS, buildQualityReport, scenesWithoutImage } from '../engine/qualityReport';
import { Project } from '../types';

const asset = (id: string, name: string, type: 'audio' | 'image' = 'audio') => ({
  id,
  name,
  type,
  url: `blob:${id}`,
  mimeType: type === 'audio' ? 'audio/mpeg' : 'image/png',
  sizeBytes: 10,
  license: 'x',
  provenance: 'x',
  createdAt: 0,
});

const scene = (id: string, durationSeconds: number, extra: Record<string, unknown> = {}) => ({
  id,
  title: id.toUpperCase(),
  narrationText: 'Texto',
  visualIntent: 'x',
  cameraMotion: 'Static' as const,
  transition: 'Cut' as const,
  durationSeconds,
  ...extra,
});

const emptyProject = (): Project => ({
  id: 'p40-vacio',
  title: 'Proyecto vacío',
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
    scenes: [scene('s1', 2), scene('s2', 1.5)],
  },
  settings: { fps: 30, resolution: { width: 1280, height: 720 }, aspectRatio: '16:9' },
});

const completeProject = (): Project => ({
  ...emptyProject(),
  id: 'p40-completo',
  mediaAssets: [asset('img1', 'foto1.png', 'image'), asset('img2', 'foto2.png', 'image'), asset('voz', 'voz.mp3'), asset('mus', 'musica.mp3')],
  narrationAssetId: 'voz',
  musicAssetId: 'mus',
  script: {
    ...emptyProject().script,
    scenes: [
      scene('s1', 6, { imageAssetId: 'img1' }),
      scene('s2', 6, { imageAssetId: 'img2' }),
    ],
  },
});

describe('reporte de calidad antes de exportar (fase 40)', () => {
  it('avisa de las cuatro carencias en un proyecto vacío', () => {
    const report = buildQualityReport(emptyProject());
    expect(report.warningCount).toBe(4);
    expect(report.allOk).toBe(false);
    expect(report.checks.map((check) => `${check.id}:${check.ok}`)).toEqual([
      'images:false',
      'duration:false',
      'narration:false',
      'music:false',
    ]);
    expect(report.scenesWithoutImage).toBe(2);
    expect(report.checks.find((c) => c.id === 'duration')?.message).toMatch(/3,50 s/);
    expect(report.checks.find((c) => c.id === 'images')?.message).toMatch(/2 de 2/);
  });

  it('pasa todas las comprobaciones con imágenes, 12 s, voz y música', () => {
    const report = buildQualityReport(completeProject());
    expect(report.warningCount).toBe(0);
    expect(report.allOk).toBe(true);
    expect(report.checks.every((check) => check.ok)).toBe(true);
    expect(report.durationSeconds).toBe(12);
  });

  it('cuenta los clips de video como imagen asignada', () => {
    const value = emptyProject();
    value.script.scenes = [scene('s1', 12, { videoUrl: 'blob:clip' })];
    expect(scenesWithoutImage(value)).toEqual([]);
    const images = buildQualityReport(value).checks.find((c) => c.id === 'images');
    expect(images?.ok).toBe(true);
  });

  it('nombra las escenas a las que les falta la imagen', () => {
    const value = completeProject();
    value.script.scenes[1].imageAssetId = undefined;
    const report = buildQualityReport(value);
    expect(report.warningCount).toBe(1);
    expect(report.checks.find((c) => c.id === 'images')?.message).toContain('S2');
  });

  it('la voz de una sola escena ya cuenta como narración activa', () => {
    const value = emptyProject();
    value.mediaAssets = [asset('voz1', 'voz-escena.mp3')];
    value.script.scenes[0].narrationAssetId = 'voz1';
    const report = buildQualityReport(value);
    expect(report.checks.find((c) => c.id === 'narration')?.ok).toBe(true);
  });

  it('marca la duración justo en el mínimo recomendado', () => {
    const value = emptyProject();
    value.script.scenes = [scene('s1', MIN_DURATION_SECONDS)];
    expect(buildQualityReport(value).checks.find((c) => c.id === 'duration')?.ok).toBe(true);
  });
});
