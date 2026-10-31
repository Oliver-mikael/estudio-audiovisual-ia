import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createEAIPackage,
  validateAndParseEAIPackage,
  restoreProjectFromEAI,
  EAI_FORMAT_VERSION,
  base64ToBlob,
  computeSHA256,
  createEAIBatchPackage
} from '../services/storage/projectBackup';
import { DEMO_PROJECT } from '../data/demoProject';

// Mock IndexedDB methods
vi.mock('../services/storage/db', () => {
  return {
    saveProjectToStorage: vi.fn().mockResolvedValue(undefined),
    getMediaAssetBlob: vi.fn().mockResolvedValue(null),
    saveMediaAssetBlob: vi.fn().mockResolvedValue(undefined),
    getAllProjectsFromStorage: vi.fn().mockImplementation(async () => [
      {
        id: 'mock-proj-1',
        title: 'Mock Project',
        description: 'Test',
        createdAt: 1000,
        updatedAt: 1000,
        angles: [],
        sources: [],
        script: { title: 'T', summary: 'S', targetAudience: 'A', tone: 'Riguroso', scenes: [] },
        mediaAssets: [],
        settings: { fps: 30, resolution: { width: 1280, height: 720 }, aspectRatio: '16:9' }
      }
    ]),
    getProjectFromStorage: vi.fn().mockResolvedValue(null),
    deleteProjectFromStorage: vi.fn().mockResolvedValue(undefined)
  };
});

describe('Project Backup & EAI Package Engine (Phase 6A & 6B)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('serializes a project into a valid EAI export package structure with SHA-256', async () => {
    const pkg = await createEAIPackage(DEMO_PROJECT);

    expect(pkg.format).toBe('ESTUDIO_AUDIOVISUAL_INTELLIGENT_PACKAGE');
    expect(pkg.version).toBe(EAI_FORMAT_VERSION);
    expect(pkg.exportedAt).toBeGreaterThan(0);
    expect(pkg.project.id).toBe(DEMO_PROJECT.id);
    expect(pkg.project.title).toBe(DEMO_PROJECT.title);
    expect(pkg.checksum).toBeDefined();
    expect(typeof pkg.checksum).toBe('string');
  });

  it('validates and parses valid EAI JSON string correctly with valid checksum', async () => {
    const pkg = await createEAIPackage(DEMO_PROJECT);
    const validJson = JSON.stringify(pkg);

    const parsed = await validateAndParseEAIPackage(validJson);
    expect(parsed.type).toBe('single');
    expect(parsed.singlePackage?.project.title).toBe(DEMO_PROJECT.title);
    expect(parsed.checksumValid).toBe(true);
  });

  it('detects tampered packages with altered content', async () => {
    const pkg = await createEAIPackage(DEMO_PROJECT);
    // Alter the title without recalculating checksum
    pkg.project.title = 'Título Modificado Ilegítimamente';
    const tamperedJson = JSON.stringify(pkg);

    const parsed = await validateAndParseEAIPackage(tamperedJson);
    expect(parsed.checksumValid).toBe(false);
  });

  it('rejects invalid or corrupted JSON payloads', async () => {
    await expect(validateAndParseEAIPackage('not a json')).rejects.toThrow('formato JSON válido');
    await expect(validateAndParseEAIPackage('{"format":"OTHER"}')).rejects.toThrow('paquete válido');
  });

  it('creates and parses batch backup package correctly', async () => {
    const batchPkg = await createEAIBatchPackage();
    expect(batchPkg.format).toBe('ESTUDIO_AUDIOVISUAL_BATCH_PACKAGE');
    expect(batchPkg.projectsCount).toBe(1);

    const batchJson = JSON.stringify(batchPkg);
    const parsed = await validateAndParseEAIPackage(batchJson);
    expect(parsed.type).toBe('batch');
    expect(parsed.batchPackage?.projectsCount).toBe(1);
    expect(parsed.checksumValid).toBe(true);
  });

  it('supports collision strategy: create_copy generates a new project ID', async () => {
    const pkg = await createEAIPackage(DEMO_PROJECT);
    const restored = await restoreProjectFromEAI(pkg, 'create_copy');

    expect(restored.id).not.toBe(DEMO_PROJECT.id);
    expect(restored.title).toContain('(Copia importada)');
  });

  it('supports collision strategy: overwrite maintains original project ID', async () => {
    const pkg = await createEAIPackage(DEMO_PROJECT);
    const restored = await restoreProjectFromEAI(pkg, 'overwrite');

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

  it('computes deterministic SHA-256 hashes', async () => {
    const hash1 = await computeSHA256('Test String 123');
    const hash2 = await computeSHA256('Test String 123');
    const hash3 = await computeSHA256('Different');

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
  });
});
