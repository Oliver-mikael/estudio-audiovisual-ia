import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createEAIPackage,
  validateAndParseEAIPackage,
  restoreProjectFromEAI,
  base64ToBlob,
  blobToBase64,
  ensureStoragePersistence
} from '../services/storage/projectBackup';
import { Project, MediaAsset } from '../types';

// Mock storage state to verify non-destructive isolation
let mockProjectsDb = new Map<string, Project>();
let mockAssetsDb = new Map<string, MediaAsset>();

vi.mock('../services/storage/db', () => ({
  saveProjectToStorage: vi.fn().mockImplementation(async (project: Project) => {
    mockProjectsDb.set(project.id, { ...project, updatedAt: Date.now() });
  }),
  getProjectFromStorage: vi.fn().mockImplementation(async (id: string) => {
    return mockProjectsDb.get(id) || null;
  }),
  getAllProjectsFromStorage: vi.fn().mockImplementation(async () => {
    return Array.from(mockProjectsDb.values());
  }),
  saveMediaAssetBlob: vi.fn().mockImplementation(async (asset: MediaAsset) => {
    mockAssetsDb.set(asset.id, asset);
  }),
  getMediaAssetBlob: vi.fn().mockImplementation(async (id: string) => {
    return mockAssetsDb.get(id) || null;
  })
}));

describe('Auditoría de Integración Fase 6A — Respaldo, Integridad y Recuperación .EAI', () => {
  const dummyProject: Project = {
    id: 'proj-audit-001',
    title: 'Proyecto de Prueba de Recuperación Integral',
    description: 'Documental sobre la memoria y las redes de información',
    createdAt: 1700000000000,
    updatedAt: 1700000500000,
    angles: [
      {
        id: 'angle-01',
        title: 'Ángulo Crítico: Pérdida de Conocimiento',
        hook: '¿Por qué se pierde la información en sistemas complejos?',
        perspective: 'Tesis institucional sobre la rotación de equipos.',
        criticalQuestions: ['¿Quién conserva los datos?', '¿Cómo se evitan silos?'],
        alternativeApproach: 'Enfoque distribuido'
      }
    ],
    sources: [
      {
        id: 'src-01',
        title: 'Informe Técnico Anual 1989',
        author: 'Investigador Principal',
        evidenceType: 'Fact',
        license: 'Public Domain',
        notes: 'Verificado en archivo histórico',
        verified: true
      },
      {
        id: 'src-02',
        title: 'Entrevista Testimonial',
        evidenceType: 'Hypothesis',
        license: 'CC-BY',
        notes: 'Requiere validación cruzada',
        verified: false
      }
    ],
    script: {
      title: 'Guion Principal',
      summary: 'Resumen narrativo',
      targetAudience: 'Comunidad científica y divulgación',
      tone: 'Riguroso',
      scenes: [
        {
          id: 'scene-01',
          title: 'Escena 1: El Dilema',
          narrationText: 'En el origen, cada documento existía en un formato incompatible...',
          visualIntent: 'Esquema de nodos aislados',
          cameraMotion: 'Zoom In',
          transition: 'Fade',
          durationSeconds: 15
        },
        {
          id: 'scene-02',
          title: 'Escena 2: La Conexión',
          narrationText: 'La solución no fue un ordenador más rápido, sino un protocolo común.',
          visualIntent: 'Conexión de hipervínculos',
          cameraMotion: 'Pan Right',
          transition: 'Cut',
          durationSeconds: 20
        }
      ]
    },
    mediaAssets: [
      {
        id: 'asset-img-01',
        name: 'esquema_original.png',
        type: 'image',
        url: 'blob:test/image1',
        mimeType: 'image/png',
        sizeBytes: 1024,
        license: 'Public Domain',
        provenance: 'Archivo Digital 1989',
        createdAt: 1700000100000
      },
      {
        id: 'asset-audio-01',
        name: 'locucion_escena1.mp3',
        type: 'audio',
        url: 'blob:test/audio1',
        mimeType: 'audio/mpeg',
        sizeBytes: 2048,
        license: 'CC-BY',
        provenance: 'Estudio de Grabación',
        createdAt: 1700000200000
      }
    ],
    settings: {
      fps: 30,
      resolution: { width: 1280, height: 720 },
      aspectRatio: '16:9'
    }
  };

  beforeEach(() => {
    mockProjectsDb.clear();
    mockAssetsDb.clear();

    const fakeImgBlob = new Blob(['PNG_FAKE_DATA_BYTES'], { type: 'image/png' });
    const fakeAudioBlob = new Blob(['MP3_FAKE_DATA_BYTES'], { type: 'audio/mpeg' });

    mockAssetsDb.set(dummyProject.mediaAssets[0].id, {
      ...dummyProject.mediaAssets[0],
      fileBlob: fakeImgBlob
    });

    mockAssetsDb.set(dummyProject.mediaAssets[1].id, {
      ...dummyProject.mediaAssets[1],
      fileBlob: fakeAudioBlob
    });

    mockProjectsDb.set(dummyProject.id, dummyProject);
  });

  it('3.1 Exportación completa: serializa metadatos, escenas, fuentes, ángulos y blobs en Base64 con checksum SHA-256', async () => {
    const pkg = await createEAIPackage(dummyProject);

    expect(pkg.format).toBe('ESTUDIO_AUDIOVISUAL_INTELLIGENT_PACKAGE');
    expect(pkg.version).toBe('1.0.0');
    expect(pkg.project.id).toBe(dummyProject.id);
    expect(pkg.project.title).toBe(dummyProject.title);
    expect(pkg.project.script.scenes).toHaveLength(2);
    expect(pkg.project.sources).toHaveLength(2);
    expect(pkg.project.angles).toHaveLength(1);
    expect(pkg.bundledAssets).toHaveLength(2);

    expect(pkg.bundledAssets[0].dataBase64).toBeDefined();
    expect(typeof pkg.bundledAssets[0].dataBase64).toBe('string');
    expect(pkg.checksum).toBeDefined();
    expect(pkg.checksum?.length).toBeGreaterThan(10);
  });

  it('3.2 Importación y recuperación: detecta manipulaciones y archivos corruptos mediante SHA-256', async () => {
    const pkg = await createEAIPackage(dummyProject);
    const jsonStr = JSON.stringify(pkg);

    // Validar paquete intacto
    const validationIntact = await validateAndParseEAIPackage(jsonStr);
    expect(validationIntact.checksumValid).toBe(true);
    expect(validationIntact.singlePackage?.project.id).toBe(dummyProject.id);

    // Simular corrupción manipulando el texto de la escena
    const tampered = JSON.parse(jsonStr);
    tampered.project.script.scenes[0].narrationText = 'Texto alterado maliciosamente';
    const tamperedJson = JSON.stringify(tampered);

    const validationTampered = await validateAndParseEAIPackage(tamperedJson);
    expect(validationTampered.checksumValid).toBe(false);
  });

  it('3.2 Prevención de sobrescritura silenciosa: estrategia create_copy genera nuevo ID y título', async () => {
    const pkg = await createEAIPackage(dummyProject);

    // Restaurar con estrategia create_copy
    const restored = await restoreProjectFromEAI(pkg, 'create_copy');

    expect(restored.id).not.toBe(dummyProject.id);
    expect(restored.title).toContain('(Copia importada)');
    expect(restored.script.scenes).toHaveLength(2);
    expect(restored.sources).toHaveLength(2);

    // Verificar que el original permanece en la base de datos sin ser sobrescrito
    const originalInDB = mockProjectsDb.get(dummyProject.id);
    expect(originalInDB).toBeDefined();
    expect(originalInDB?.title).toBe(dummyProject.title);

    // Comprobar coexistencia pacífica
    expect(mockProjectsDb.size).toBe(2);
  });

  it('3.3 Integridad de Blobs y tipos MIME: reconstruye correctamente los binarios desde Base64', async () => {
    const pkg = await createEAIPackage(dummyProject);
    await restoreProjectFromEAI(pkg, 'create_copy');

    const restoredAsset0 = mockAssetsDb.get(dummyProject.mediaAssets[0].id);
    expect(restoredAsset0).toBeDefined();
    expect(restoredAsset0?.fileBlob).toBeDefined();
    expect(restoredAsset0?.fileBlob?.type).toBe('image/png');

    const restoredAsset1 = mockAssetsDb.get(dummyProject.mediaAssets[1].id);
    expect(restoredAsset1).toBeDefined();
    expect(restoredAsset1?.fileBlob).toBeDefined();
    expect(restoredAsset1?.fileBlob?.type).toBe('audio/mpeg');
  });

  it('3.4 Rendimiento y memoria: prueba con payload simulado grande (1 MB binario)', async () => {
    const largeSize = 1024 * 1024;
    const uint8 = new Uint8Array(largeSize);
    for (let i = 0; i < largeSize; i++) uint8[i] = i % 256;
    const largeBlob = new Blob([uint8], { type: 'application/octet-stream' });

    const startTime = performance.now();
    const base64 = await blobToBase64(largeBlob);
    const encodeDuration = performance.now() - startTime;

    expect(base64.length).toBeGreaterThan(largeSize);
    expect(encodeDuration).toBeLessThan(1000);

    const decodeStart = performance.now();
    const reconstructedBlob = base64ToBlob(base64, 'application/octet-stream');
    const decodeDuration = performance.now() - decodeStart;

    expect(reconstructedBlob.size).toBe(largeSize);
    expect(decodeDuration).toBeLessThan(1000);
  });

  it('4. Persistencia de Almacenamiento: ensureStoragePersistence consulta la API con fallback seguro', async () => {
    const result = await ensureStoragePersistence();
    expect(typeof result.supported).toBe('boolean');
    expect(typeof result.persisted).toBe('boolean');
  });
});
