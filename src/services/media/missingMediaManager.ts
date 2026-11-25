// Missing Media Detection and Relink Manager (Phase 7E)
// Identifies unreferenced, disconnected or missing assets in timeline clips and reconnects them safely.
import { Project, MediaAsset, MissingMediaRef } from '../../types';
import { MetadataExtractor } from './metadataExtractor';
import { saveMediaAssetBlob, saveProjectToStorage } from '../storage/db';

export class MissingMediaManager {
  /**
   * Scans the project for any clips referencing an assetId that does not exist in mediaAssets
   * or marked with isMissing: true.
   */
  public static detectMissingMedia(project: Project): MissingMediaRef[] {
    const assetMap = new Map<string, MediaAsset>();
    (project.mediaAssets || []).forEach((a) => assetMap.set(a.id, a));

    const missingMap = new Map<string, MissingMediaRef>();

    // 1. Check timeline tracks
    (project.timeline?.tracks || []).forEach((track) => {
      track.clips.forEach((clip) => {
        if (clip.assetId) {
          const asset = assetMap.get(clip.assetId);
          if (!asset || asset.isMissing) {
            const existing = missingMap.get(clip.assetId);
            if (existing) {
              existing.affectedClipsCount++;
            } else {
              missingMap.set(clip.assetId, {
                assetId: clip.assetId,
                expectedName: asset?.name || clip.name,
                expectedType: (clip.type === 'image' ? 'image' : clip.type === 'video' ? 'video' : 'audio'),
                affectedClipsCount: 1,
                expectedSizeBytes: asset?.sizeBytes,
                expectedDurationSeconds: asset?.durationSeconds,
              });
            }
          }
        }
      });
    });

    // 2. Also check mediaAssets list marked explicitly as missing
    (project.mediaAssets || []).forEach((asset) => {
      if (asset.isMissing && !missingMap.has(asset.id)) {
        missingMap.set(asset.id, {
          assetId: asset.id,
          expectedName: asset.name,
          expectedType: asset.type,
          affectedClipsCount: 0,
          expectedSizeBytes: asset.sizeBytes,
          expectedDurationSeconds: asset.durationSeconds,
        });
      }
    });

    return Array.from(missingMap.values());
  }

  /**
   * Reconnects a missing asset with a newly provided physical file, verifying metadata compatibility.
   */
  public static async reconnectAsset(
    project: Project,
    missingAssetId: string,
    newFile: File
  ): Promise<{ success: boolean; updatedProject: Project; error?: string }> {
    const meta = await MetadataExtractor.extractMetadata(newFile);
    let targetType: 'image' | 'video' | 'audio' = 'image';
    if (meta.mimeType.startsWith('video/')) targetType = 'video';
    else if (meta.mimeType.startsWith('audio/')) targetType = 'audio';

    const existingAsset = (project.mediaAssets || []).find((a) => a.id === missingAssetId);
    if (existingAsset && existingAsset.type !== targetType) {
      return {
        success: false,
        updatedProject: project,
        error: `Tipo de medio incompatible: se esperaba '${existingAsset.type}' pero se seleccionó '${targetType}'.`,
      };
    }

    const newUrl = URL.createObjectURL(newFile);
    const updatedAsset: MediaAsset = {
      id: missingAssetId,
      name: newFile.name,
      type: targetType,
      url: newUrl,
      fileBlob: newFile,
      mimeType: meta.mimeType,
      sizeBytes: meta.sizeBytes,
      license: existingAsset?.license || 'Propiedad del usuario / Reconectado',
      provenance: 'Reconectado desde archivo local',
      createdAt: existingAsset?.createdAt || Date.now(),
      width: meta.width,
      height: meta.height,
      durationSeconds: meta.durationSeconds,
      aspectRatio: meta.aspectRatio,
      thumbnailUrl: meta.thumbnailUrl,
      sha256: meta.sha256,
      folderId: existingAsset?.folderId,
      isMissing: false,
    };

    // 1. Save binary file to IndexedDB
    await saveMediaAssetBlob(updatedAsset);

    // 2. Update project mediaAssets array
    const updatedMediaAssets = (project.mediaAssets || []).map((a) =>
      a.id === missingAssetId ? updatedAsset : a
    );
    if (!existingAsset) {
      updatedMediaAssets.push(updatedAsset);
    }

    // 3. Update timeline clips while strictly preserving:
    // startMs, durationMs, offsetMs, trackId, volume, speed, filterPreset, and color adjustments
    const updatedTracks = (project.timeline?.tracks || []).map((track) => ({
      ...track,
      clips: track.clips.map((clip) => {
        if (clip.assetId === missingAssetId) {
          return {
            ...clip,
            name: clip.name === existingAsset?.name ? newFile.name : clip.name,
          };
        }
        return clip;
      }),
    }));

    const updatedProject: Project = {
      ...project,
      mediaAssets: updatedMediaAssets,
      timeline: project.timeline ? { ...project.timeline, tracks: updatedTracks } : undefined,
      updatedAt: Date.now(),
    };

    await saveProjectToStorage(updatedProject);
    return { success: true, updatedProject };
  }
}
