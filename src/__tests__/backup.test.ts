import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createEAIPackage,
  validateAndParseEAIPackage,
  restoreProjectFromEAI,
  EAI_FORMAT_VERSION,
  blobToBase64,
  base64ToBlob
} from '../services/storage/projectBackup';
import { DEMO_PROJECT } from '../data/demoProject';
import { Project } from '../types';

// Mock IndexedDB methods
vi.mock('../services/storage/db', () => ({
  saveProjectToStorage: vi.fn().mockResolvedValue(undefined),
  getMediaAssetBlob: vi.fn().mockResolvedValue(null),
  saveMediaAssetBlob: vi.fn().mockResolvedValue(undefined),
  getAllProjectsFromStorage: vi.fn().mockResolvedValue([]),
  getProjectFromStorage: vi.fn().mockResolvedValue(null),
  deleteProjectFromStorage: vi.fn().mockResolvedValue(undefined)
}));

describe('Project Backup & EAI Package Engine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('serializes a project into a valid EAI export package structure', async () => {
    const pkg = await createEAIPackage(DEMO_PROJECT);

    expect(pkg.format).toBe('ESTUDIO_AUDIOVISUAL_INTELLIGENT_PACKAGE');
    expect(pkg.version).toBe(EAI_FORMAT_VERSION);
    expect(pkg.exportedAt).toBeGreaterThan(0);
    expect(pkg.project.id).toBe(DEMO_PROJECT.id);
    expect(pkg.project.title).toBe(DEMO_PROJECT.title);
    expect(pkg.project.script.scenes.length).toBe(DEMO_PROJECT.script.scenes.length);
  });

  it('validates and parses valid EAI JSON string correctly', () => {
    const validJson = JSON.stringify({
      format: 'ESTUDIO_AUDIOVISUAL_INTELLIGENT_PACKAGE',
      version: '1.0.0',
      exportedAt: 123456789,
      project: DEMO_PROJECT,
      bundledAssets: []
    });

    const parsed = validateAndParseEAIPackage(validJson);
    expect(parsed.project.title).toBe(DEMO_PROJECT.title);
  });

  it('rejects invalid or corrupted JSON payloads', () => {
    expect(() => validateAndParseEAIPackage('not a json')).toThrow('formato JSON válido');
    expect(() => validateAndParseEAIPackage('{"format":"OTHER"}')).toThrow('paquete válido');
    expect(() => validateAndParseEAIPackage('{"format":"ESTUDIO_AUDIOVISUAL_INTELLIGENT_PACKAGE"}')).toThrow('paquete válido');
  });

  it('rehydrates and restores projects into storage', async () => {
    const pkg = await createEAIPackage(DEMO_PROJECT);
    const restored = await restoreProjectFromEAI(pkg);

    expect(restored.id).toBe(DEMO_PROJECT.id);
    expect(restored.title).toBe(DEMO_PROJECT.title);
  });

  it('converts base64 to blob and preserves binary structure', () => {
    const originalText = 'Hola Mundo AudioVisual';
    const base64 = btoa(originalText);
    const blob = base64ToBlob(base64, 'text/plain');
    expect(blob.type).toBe('text/plain');
    expect(blob.size).toBe(originalText.length);
  });
});
