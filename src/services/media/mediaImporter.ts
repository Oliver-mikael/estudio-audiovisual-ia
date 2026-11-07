// Media Importer Service with Whitelist Validation and Content Deduplication (Phase 7E)
import { MediaAsset } from '../../types';
import { MetadataExtractor } from './metadataExtractor';
import { saveMediaAssetBlob } from '../storage/db';

export interface ImportResult {
  asset: MediaAsset;
  isDuplicate: boolean;
  status: 'imported' | 'reused' | 'error';
  errorMessage?: string;
}

export const SUPPORTED_MIME_PATTERNS = [
  // Images
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  // Videos
  'video/mp4',
  'video/webm',
  'video/quicktime', // .mov
  'video/x-matroska',
  // Audio
  'audio/mpeg', // .mp3
  'audio/webm',
  'audio/wav',
  'audio/ogg',
  'audio/x-m4a',
  'audio/aac',
];

export class MediaImporter {
  /**
   * Validates if a file type or extension is supported by the audiovisual engine.
   */
  public static isSupportedFile(file: File): boolean {
    if (file.type && SUPPORTED_MIME_PATTERNS.some((p) => file.type.startsWith(p.split('/')[0]) && (file.type === p || file.type.includes(p.split('/')[1])))) {
      return true;
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    const validExtensions = [
      'jpg', 'jpeg', 'png', 'webp', 'gif', 'svg',
      'mp4', 'webm', 'mov', 'mkv',
      'mp3', 'wav', 'ogg', 'm4a', 'aac'
    ];
    return ext ? validExtensions.includes(ext) : false;
  }

  /**
   * Imports a single file with validation, duplicate detection and persistence.
   */
  public static async importFile(
    file: File,
    existingAssets: MediaAsset[],
    folderId?: string
  ): Promise<ImportResult> {
    if (!this.isSupportedFile(file)) {
      return {
        asset: {
          id: `unsupported-${Date.now()}`,
          name: file.name,
          type: 'image',
          url: '',
          mimeType: file.type || 'unknown',
          sizeBytes: file.size,
          license: 'Incompatible',
          provenance: 'Desconocida',
          createdAt: Date.now(),
        },
        isDuplicate: false,
        status: 'error',
        errorMessage: `Formato de archivo no compatible: ${file.name} (${file.type || 'desconocido'})`,
      };
    }

    try {
      // 1. Extract metadata and SHA-256 hash
      const meta = await MetadataExtractor.extractMetadata(file);

      // 2. Check for duplicate based on SHA-256
      const duplicate = existingAssets.find((a) => a.sha256 && a.sha256 === meta.sha256);
      if (duplicate) {
        return {
          asset: duplicate,
          isDuplicate: true,
          status: 'reused',
        };
      }

      // 3. Determine asset domain type
      let type: 'image' | 'video' | 'audio' = 'image';
      if (meta.mimeType.startsWith('video/')) type = 'video';
      else if (meta.mimeType.startsWith('audio/')) type = 'audio';

      const url = URL.createObjectURL(file);
      const newAsset: MediaAsset = {
        id: `asset-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: file.name,
        type,
        url,
        fileBlob: file,
        mimeType: meta.mimeType,
        sizeBytes: meta.sizeBytes,
        license: 'Propiedad del usuario / Licencia confirmada',
        provenance: 'Importado desde dispositivo local',
        createdAt: Date.now(),
        width: meta.width,
        height: meta.height,
        durationSeconds: meta.durationSeconds,
        aspectRatio: meta.aspectRatio,
        thumbnailUrl: meta.thumbnailUrl,
        sha256: meta.sha256,
        folderId,
      };

      // 4. Persist binary blob into IndexedDB
      await saveMediaAssetBlob(newAsset);

      return {
        asset: newAsset,
        isDuplicate: false,
        status: 'imported',
      };
    } catch (err: any) {
      return {
        asset: {
          id: `error-${Date.now()}`,
          name: file.name,
          type: 'image',
          url: '',
          mimeType: file.type,
          sizeBytes: file.size,
          license: 'Error',
          provenance: 'Error',
          createdAt: Date.now(),
        },
        isDuplicate: false,
        status: 'error',
        errorMessage: err.message || 'Error procesando el archivo.',
      };
    }
  }

  /**
   * Imports multiple files in sequence, tracking progress.
   */
  public static async importMultipleFiles(
    files: FileList | File[],
    existingAssets: MediaAsset[],
    onProgress?: (current: number, total: number, filename: string) => void,
    folderId?: string
  ): Promise<{ imported: MediaAsset[]; duplicatesCount: number; errors: string[] }> {
    const list = Array.from(files);
    const imported: MediaAsset[] = [];
    const errors: string[] = [];
    let duplicatesCount = 0;

    for (let i = 0; i < list.length; i++) {
      const file = list[i];
      if (onProgress) {
        onProgress(i + 1, list.length, file.name);
      }

      const res = await this.importFile(file, [...existingAssets, ...imported], folderId);
      if (res.status === 'imported') {
        imported.push(res.asset);
      } else if (res.status === 'reused') {
        duplicatesCount++;
      } else if (res.status === 'error' && res.errorMessage) {
        errors.push(res.errorMessage);
      }
    }

    return { imported, duplicatesCount, errors };
  }
}
