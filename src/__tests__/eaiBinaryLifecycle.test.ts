import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Project, MediaAsset, TimelineTrack } from '../types';
import { createEAIPackage, restoreProjectFromEAI, validateAndParseEAIPackage } from '../services/storage/projectBackup';
import { MediaStore } from '../services/media/mediaStore';

describe('EAI Binary Lifecycle and Backward Compatibility Integration (Phase 7E)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exports and restores a project with real binary media, folders, and timeline clips', async () => {
    // 1. Create real binary blobs
    const imageBlob = new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46])], {
      type: 'image/jpeg',
    });
    const audioBlob = new Blob([new Uint8Array([0x49, 0x44, 0x33, 0x03, 0x00, 0x00, 0x00, 0x00])], {
      type: 'audio/mpeg',
    });
    const videoBlob = new Blob([new Uint8Array([0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70])], {
      type: 'video/mp4',
    });

    const mediaAssets: MediaAsset[] = [
      {
        id: 'asset-img-1',
        name: 'test_cern_photo.jpg',
        type: 'image',
        url: 'blob:http://localhost/mock-img',
        fileBlob: imageBlob,
        mimeType: 'image/jpeg',
        sizeBytes: imageBlob.size,
        license: 'CC-BY-4.0',
        provenance: 'CERN Document Server',
        createdAt: 1700000000000,
        width: 1920,
        height: 1080,
        aspectRatio: '16:9',
        thumbnailUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
        sha256: 'sha256-mock-img-cern-12345',
        folderId: 'folder-archive',
      },
      {
        id: 'asset-aud-1',
        name: 'cern_narration.mp3',
        type: 'audio',
        url: 'blob:http://localhost/mock-aud',
        fileBlob: audioBlob,
        mimeType: 'audio/mpeg',
        sizeBytes: audioBlob.size,
        license: 'Propiedad del usuario',
        provenance: 'Grabación de micrófono local',
        createdAt: 1700000001000,
        durationSeconds: 12.5,
        sha256: 'sha256-mock-aud-voice-67890',
        folderId: 'folder-audio',
      },
      {
        id: 'asset-vid-1',
        name: 'hypertext_demo.mp4',
        type: 'video',
        url: 'blob:http://localhost/mock-vid',
        fileBlob: videoBlob,
        mimeType: 'video/mp4',
        sizeBytes: videoBlob.size,
        license: 'Public Domain',
        provenance: 'W3C Historical Archives',
        createdAt: 1700000002000,
        width: 1280,
        height: 720,
        durationSeconds: 15.0,
        aspectRatio: '16:9',
        thumbnailUrl: 'data:image/jpeg;base64,/9j/video-thumb==',
        sha256: 'sha256-mock-vid-demo-11223',
        folderId: 'folder-archive',
      },
    ];

    const tracks: TimelineTrack[] = [
      {
        id: 'track-v1',
        name: 'Video 1',
        type: 'video',
        order: 0,
        isLocked: false,
        isMuted: false,
        isVisible: true,
        clips: [
          {
            id: 'clip-v1-1',
            trackId: 'track-v1',
            name: 'test_cern_photo.jpg',
            type: 'image',
            startMs: 0,
            durationMs: 5000,
            offsetMs: 0,
            speed: 1.0,
            volume: 1.0,
            assetId: 'asset-img-1',
          },
        ],
      },
      {
        id: 'track-v2',
        name: 'Video 2 (B-Roll)',
        type: 'video',
        order: 1,
        isLocked: false,
        isMuted: false,
        isVisible: true,
        clips: [
          {
            id: 'clip-v2-1',
            trackId: 'track-v2',
            name: 'hypertext_demo.mp4',
            type: 'video',
            startMs: 2000,
            durationMs: 6000,
            offsetMs: 1000,
            speed: 1.0,
            volume: 0.8,
            assetId: 'asset-vid-1',
          },
        ],
      },
      {
        id: 'track-a1',
        name: 'Audio 1 (Voz)',
        type: 'audio',
        order: 2,
        isLocked: false,
        isMuted: false,
        isVisible: true,
        clips: [
          {
            id: 'clip-a1-1',
            trackId: 'track-a1',
            name: 'cern_narration.mp3',
            type: 'audio',
            startMs: 0,
            durationMs: 12500,
            offsetMs: 0,
            speed: 1.0,
            volume: 1.0,
            assetId: 'asset-aud-1',
          },
        ],
      },
      {
        id: 'track-a2',
        name: 'Audio 2 (Música)',
        type: 'audio',
        order: 3,
        isLocked: false,
        isMuted: false,
        isVisible: true,
        clips: [],
      },
    ];

    const originalProject: Project = {
      id: 'proj-eai-lifecycle-test',
      title: 'Proyecto EAI Ciclo Binario y Metadatos 7E',
      description: 'Prueba de exportación e importación .eai con binarios reales y metadatos extendidos',
      createdAt: 1700000000000,
      updatedAt: 1700000005000,
      angles: [],
      sources: [],
      script: {
        title: 'Guion EAI',
        summary: 'Resumen de prueba',
        targetAudience: 'General',
        tone: 'Riguroso',
        scenes: [],
      },
      settings: {
        fps: 30,
        resolution: { width: 1280, height: 720 },
        aspectRatio: '16:9',
      },
      mediaAssets,
      folders: [
        {
          id: 'folder-archive',
          name: 'Archivos Históricos',
          createdAt: 1700000000000,
        },
        {
          id: 'folder-audio',
          name: 'Locuciones Estudio',
          createdAt: 1700000001000,
        },
      ],
      timeline: {
        tracks,
      },
    };

    // 2. Export project to .eai package
    const eaiPackage = await createEAIPackage(originalProject);
    expect(eaiPackage.version).toBe('1.0.0');
    expect(eaiPackage.format).toBe('ESTUDIO_AUDIOVISUAL_INTELLIGENT_PACKAGE');
    expect(eaiPackage.checksum).toBeDefined();
    expect(eaiPackage.bundledAssets.length).toBe(3);

    // 3. Validate and parse package
    const serializedJson = JSON.stringify(eaiPackage);
    const parsed = await validateAndParseEAIPackage(serializedJson);
    expect(parsed.checksumValid).toBe(true);
    expect(parsed.type).toBe('single');

    // 4. Import project from the exported .eai package
    const restored = await restoreProjectFromEAI(eaiPackage, 'overwrite');
    expect(restored.id).toBe(originalProject.id);
    expect(restored.title).toBe(originalProject.title);

    // 5. Validate metadata and folders
    expect(restored.folders).toBeDefined();
    expect(restored.folders?.length).toBe(2);
    expect(restored.folders?.[0].name).toBe('Archivos Históricos');

    // 6. Validate restored media assets
    expect(restored.mediaAssets.length).toBe(3);
    const restoredImg = restored.mediaAssets.find((a) => a.id === 'asset-img-1')!;
    expect(restoredImg).toBeDefined();
    expect(restoredImg.width).toBe(1920);
    expect(restoredImg.height).toBe(1080);
    expect(restoredImg.aspectRatio).toBe('16:9');
    expect(restoredImg.sha256).toBe('sha256-mock-img-cern-12345');
    expect(restoredImg.folderId).toBe('folder-archive');
    expect(restoredImg.thumbnailUrl).toBe('data:image/jpeg;base64,/9j/4AAQSkZJRg==');

    const restoredVid = restored.mediaAssets.find((a) => a.id === 'asset-vid-1')!;
    expect(restoredVid).toBeDefined();
    expect(restoredVid.durationSeconds).toBe(15.0);

    const restoredAud = restored.mediaAssets.find((a) => a.id === 'asset-aud-1')!;
    expect(restoredAud).toBeDefined();
    expect(restoredAud.durationSeconds).toBe(12.5);

    // 7. Validate restored timeline tracks and clips
    expect(restored.timeline).toBeDefined();
    expect(restored.timeline?.tracks.length).toBe(4);
    const v1Clips = restored.timeline?.tracks.find((t) => t.id === 'track-v1')?.clips;
    expect(v1Clips?.length).toBe(1);
    expect(v1Clips?.[0].assetId).toBe('asset-img-1');
    expect(v1Clips?.[0].durationMs).toBe(5000);

    const v2Clips = restored.timeline?.tracks.find((t) => t.id === 'track-v2')?.clips;
    expect(v2Clips?.length).toBe(1);
    expect(v2Clips?.[0].assetId).toBe('asset-vid-1');
    expect(v2Clips?.[0].volume).toBe(0.8);
    expect(v2Clips?.[0].offsetMs).toBe(1000);

    // 8. Verify safe deletion guard across project
    const safeDeleteAttempt = MediaStore.deleteAssetSafely(restored, 'asset-img-1');
    expect(safeDeleteAttempt.success).toBe(false);
    expect(safeDeleteAttempt.usageCount).toBe(1);

    // 9. Verify multi-project safe delete guard
    const otherProject: Project = {
      ...originalProject,
      id: 'proj-secondary-2',
      timeline: {
        tracks: [
          {
            id: 'track-v1',
            name: 'V1',
            type: 'video',
            order: 0,
            isLocked: false,
            isMuted: false,
            isVisible: true,
            clips: [
              {
                id: 'clip-shared-aud',
                trackId: 'track-v1',
                name: 'clip using aud',
                type: 'audio',
                startMs: 0,
                durationMs: 5000,
                offsetMs: 0,
                speed: 1,
                volume: 1,
                assetId: 'asset-aud-1',
              },
            ],
          },
        ],
      },
    };
    const multiProjectDelete = MediaStore.deleteAssetSafely(
      restored,
      'asset-aud-1',
      false,
      [restored, otherProject]
    );
    expect(multiProjectDelete.success).toBe(false);
    expect(multiProjectDelete.usageCount).toBe(2);
  });

  it('restores legacy .eai packages created before Phase 7E without errors', async () => {
    // Legacy package lacking folders, durationSeconds, sha256 and aspect ratio
    const legacyPackage = {
      format: 'ESTUDIO_AUDIOVISUAL_INTELLIGENT_PACKAGE' as const,
      version: '1.0.0',
      exportedAt: 1690000000000,
      project: {
        id: 'proj-legacy-v0',
        title: 'Proyecto Histórico V0',
        description: 'Proyecto antiguo',
        createdAt: 1690000000000,
        updatedAt: 1690000001000,
        angles: [],
        sources: [],
        script: {
          title: 'Guion V0',
          summary: '',
          targetAudience: 'General',
          tone: 'Divulgativo' as const,
          scenes: [],
        },
        settings: {
          fps: 30,
          resolution: { width: 1280, height: 720 },
          aspectRatio: '16:9' as const,
        },
        mediaAssets: [
          {
            id: 'asset-legacy-1',
            name: 'logo_old.png',
            type: 'image' as const,
            url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
            mimeType: 'image/png',
            sizeBytes: 68,
            license: 'Public Domain',
            provenance: 'Local file',
            createdAt: 1690000000000,
          },
        ],
      },
      bundledAssets: [],
    };

    const restored = await restoreProjectFromEAI(legacyPackage as any, 'overwrite');
    expect(restored).toBeDefined();
    expect(restored.id).toBe('proj-legacy-v0');
    expect(restored.mediaAssets.length).toBe(1);
    expect(restored.folders).toBeUndefined(); // Backwards compatible
  });
});
