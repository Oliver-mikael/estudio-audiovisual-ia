import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MediaImporter } from '../services/media/mediaImporter';
import { MediaStore } from '../services/media/mediaStore';
import { MetadataExtractor } from '../services/media/metadataExtractor';
import { MissingMediaManager } from '../services/media/missingMediaManager';
import { TimelineEngine } from '../services/timeline/timelineEngine';
import { Project, MediaAsset } from '../types';

beforeEach(() => {
  (global as any).window = global;
  (global as any).URL = {
    createObjectURL: vi.fn(() => 'blob:mock-asset-url'),
    revokeObjectURL: vi.fn(),
  };
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

describe('FASE 7E: Biblioteca Multimedia Profesional', () => {
  const sampleProject: Project = {
    id: 'proj_media_test',
    title: 'Proyecto con Medios',
    description: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    angles: [],
    sources: [],
    script: {
      title: 'Guion',
      summary: '',
      targetAudience: 'General',
      tone: 'Divulgativo',
      scenes: [],
    },
    mediaAssets: [
      {
        id: 'asset_1',
        name: 'foto_antigua.png',
        type: 'image',
        url: 'blob:foto1',
        mimeType: 'image/png',
        sizeBytes: 1024 * 100,
        license: 'CC-BY',
        provenance: 'Local',
        createdAt: 1000,
        width: 1920,
        height: 1080,
        sha256: 'hash_abc_1',
      },
      {
        id: 'asset_2',
        name: 'audio_entrevista.mp3',
        type: 'audio',
        url: 'blob:audio1',
        mimeType: 'audio/mpeg',
        sizeBytes: 1024 * 500,
        license: 'CC-BY',
        provenance: 'Micrófono local',
        createdAt: 2000,
        durationSeconds: 15.5,
        sha256: 'hash_abc_2',
      },
    ],
    settings: {
      fps: 30,
      resolution: { width: 1280, height: 720 },
      aspectRatio: '16:9',
    },
    timeline: {
      tracks: [
        {
          id: 'track-v1',
          name: 'Video 1',
          type: 'video',
          order: 0,
          isMuted: false,
          isLocked: false,
          isVisible: true,
          clips: [
            {
              id: 'clip_v1',
              trackId: 'track-v1',
              assetId: 'asset_1',
              name: 'foto_antigua.png',
              type: 'image',
              startMs: 0,
              durationMs: 5000,
              offsetMs: 0,
            },
          ],
        },
      ],
      markers: [],
    },
  };

  it('1. Valida soporte de extensiones y MIME types en MediaImporter', () => {
    const validImg = new File(['img'], 'test.png', { type: 'image/png' });
    const validVid = new File(['vid'], 'clip.mp4', { type: 'video/mp4' });
    const validAud = new File(['aud'], 'track.mp3', { type: 'audio/mpeg' });
    const invalidFile = new File(['bad'], 'script.exe', { type: 'application/x-msdownload' });

    expect(MediaImporter.isSupportedFile(validImg)).toBe(true);
    expect(MediaImporter.isSupportedFile(validVid)).toBe(true);
    expect(MediaImporter.isSupportedFile(validAud)).toBe(true);
    expect(MediaImporter.isSupportedFile(invalidFile)).toBe(false);
  });

  it('2. Detecta archivos no compatibles e informa con error legible', async () => {
    const badFile = new File(['bad'], 'document.pdf', { type: 'application/pdf' });
    const res = await MediaImporter.importFile(badFile, []);

    expect(res.status).toBe('error');
    expect(res.errorMessage).toContain('no compatible');
  });

  it('3. Extrae metadatos y calcula SHA-256 para desduplicación', async () => {
    const file = new File(['dummy binary data for image'], 'sample.jpg', { type: 'image/jpeg' });
    const meta = await MetadataExtractor.extractMetadata(file);

    expect(meta.mimeType).toBe('image/jpeg');
    expect(meta.sizeBytes).toBe(file.size);
    expect(meta.sha256).toBeDefined();
    expect(meta.sha256?.length).toBeGreaterThan(0);
  });

  it('4. Detecta duplicados por hash SHA-256 reutilizando el recurso existente', async () => {
    const file = new File(['same bytes'], 'duplicado.png', { type: 'image/png' });
    const hash = await MetadataExtractor.computeFileHash(file);

    const existing: MediaAsset[] = [
      {
        id: 'existing_asset',
        name: 'original.png',
        type: 'image',
        url: 'blob:orig',
        mimeType: 'image/png',
        sizeBytes: file.size,
        license: 'CC',
        provenance: 'Local',
        createdAt: Date.now(),
        sha256: hash,
      },
    ];

    const res = await MediaImporter.importFile(file, existing);
    expect(res.status).toBe('reused');
    expect(res.isDuplicate).toBe(true);
    expect(res.asset.id).toBe('existing_asset');
  });

  it('5. Importa múltiples archivos en lote con tracking de progreso', async () => {
    const f1 = new File(['content1'], 'a.png', { type: 'image/png' });
    const f2 = new File(['content2'], 'b.mp3', { type: 'audio/mpeg' });

    const progressCalls: number[] = [];
    const { imported, duplicatesCount } = await MediaImporter.importMultipleFiles(
      [f1, f2],
      [],
      (cur) => progressCalls.push(cur)
    );

    expect(imported.length).toBe(2);
    expect(duplicatesCount).toBe(0);
    expect(progressCalls).toEqual([1, 2]);
  });

  it('6. Calcula el uso de recursos en la timeline y bloquea eliminación accidental', () => {
    // asset_1 está en uso en clip_v1
    const usage = MediaStore.getAssetUsageCount(sampleProject, 'asset_1');
    expect(usage).toBe(1);

    const safeDelRes = MediaStore.deleteAssetSafely(sampleProject, 'asset_1', false);
    expect(safeDelRes.success).toBe(false);
    expect(safeDelRes.usageCount).toBe(1);

    // Con forzado (force=true) sí elimina
    const forcedDelRes = MediaStore.deleteAssetSafely(sampleProject, 'asset_1', true);
    expect(forcedDelRes.success).toBe(true);
    expect(forcedDelRes.updatedProject?.mediaAssets.length).toBe(1);
  });

  it('7. Renombra recursos en la biblioteca de forma segura', () => {
    const updated = MediaStore.renameAsset(sampleProject, 'asset_2', 'entrevista_editada.mp3');
    const asset = updated.mediaAssets.find((a) => a.id === 'asset_2');
    expect(asset?.name).toBe('entrevista_editada.mp3');
  });

  it('8. Crea carpetas y organiza recursos dentro de carpetas', () => {
    const { project: pWithFolder, folder } = MediaStore.createFolder(sampleProject, 'B-Roll CERN');
    expect(pWithFolder.folders?.length).toBe(1);
    expect(pWithFolder.folders?.[0].name).toBe('B-Roll CERN');

    const pMoved = MediaStore.moveAssetToFolder(pWithFolder, 'asset_1', folder.id);
    const movedAsset = pMoved.mediaAssets.find((a) => a.id === 'asset_1');
    expect(movedAsset?.folderId).toBe(folder.id);
  });

  it('9. Filtra y ordena recursos por criterios combinados (tipo, nombre, tamaño)', () => {
    // Filtro por tipo audio
    const audios = MediaStore.filterAndSortAssets(
      sampleProject.mediaAssets,
      'audio',
      '',
      'date-desc'
    );
    expect(audios.length).toBe(1);
    expect(audios[0].id).toBe('asset_2');

    // Filtro por búsqueda
    const searchRes = MediaStore.filterAndSortAssets(
      sampleProject.mediaAssets,
      'all',
      'antigua',
      'name-asc'
    );
    expect(searchRes.length).toBe(1);
    expect(searchRes[0].id).toBe('asset_1');

    // Ordenamiento por tamaño descendente
    const sortedSize = MediaStore.filterAndSortAssets(
      sampleProject.mediaAssets,
      'all',
      '',
      'size-desc'
    );
    expect(sortedSize[0].sizeBytes).toBeGreaterThanOrEqual(sortedSize[1].sizeBytes);
  });

  it('10. Detecta referencias rotas o medios ausentes en la timeline', () => {
    // Proyecto con clip huérfano
    const brokenProject: Project = {
      ...sampleProject,
      mediaAssets: [], // Lista vacía, pero timeline tiene clip_v1 que busca 'asset_1'
    };

    const missing = MissingMediaManager.detectMissingMedia(brokenProject);
    expect(missing.length).toBe(1);
    expect(missing[0].assetId).toBe('asset_1');
    expect(missing[0].affectedClipsCount).toBe(1);
  });

  it('11. Reconecta medios ausentes con un nuevo archivo validando tipo de medio', async () => {
    const brokenProject: Project = {
      ...sampleProject,
      mediaAssets: [],
    };

    const newImgFile = new File(['new image content'], 'foto_reemplazo.png', { type: 'image/png' });
    const reconnRes = await MissingMediaManager.reconnectAsset(brokenProject, 'asset_1', newImgFile);

    expect(reconnRes.success).toBe(true);
    expect(reconnRes.updatedProject.mediaAssets.length).toBe(1);
    expect(reconnRes.updatedProject.mediaAssets[0].id).toBe('asset_1');
    expect(reconnRes.updatedProject.mediaAssets[0].isMissing).toBe(false);
  });

  it('12. Inserta medios importados directamente como clips en la timeline', () => {
    const newMedia: MediaAsset = {
      id: 'asset_video_new',
      name: 'broll_superficie.mp4',
      type: 'video',
      url: 'blob:vid',
      mimeType: 'video/mp4',
      sizeBytes: 1024 * 1024 * 5,
      license: 'Propiedad',
      provenance: 'Local',
      createdAt: Date.now(),
      durationSeconds: 8,
    };

    const updated = TimelineEngine.insertMediaAssetAsClip(sampleProject, newMedia, 'track-v1', 5000);
    const v1Clips = updated.timeline?.tracks.find((t) => t.id === 'track-v1')?.clips || [];

    expect(v1Clips.length).toBe(2);
    expect(v1Clips[1].assetId).toBe('asset_video_new');
    expect(v1Clips[1].startMs).toBe(5000);
    expect(v1Clips[1].durationMs).toBe(8000);
  });
});
