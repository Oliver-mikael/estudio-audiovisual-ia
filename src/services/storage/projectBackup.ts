// Project Backup & Portable Export/Import Service (.eai format)
// Enables complete physical backups preserving metadata, scenes, sources, narrative angles and binary assets

import { Project, MediaAsset } from '../../types';
import { saveProjectToStorage, getMediaAssetBlob, saveMediaAssetBlob } from './db';

export const EAI_FORMAT_VERSION = '1.0.0';

export interface SerializedMediaAsset extends Omit<MediaAsset, 'fileBlob'> {
  dataBase64?: string;
}

export interface EAIExportPackage {
  format: 'ESTUDIO_AUDIOVISUAL_INTELLIGENT_PACKAGE';
  version: string;
  exportedAt: number;
  project: Project;
  bundledAssets: SerializedMediaAsset[];
  checksum?: string;
}

/**
 * Checks and requests persistent storage from the browser / Android WebView
 * to prevent the OS from purging IndexedDB data during low-disk situations.
 */
export async function ensureStoragePersistence(): Promise<{
  supported: boolean;
  persisted: boolean;
  quota?: { usage: number; quota: number };
}> {
  if (typeof navigator !== 'undefined' && navigator.storage) {
    try {
      const isPersisted = await navigator.storage.persisted();
      let persisted = isPersisted;
      if (!isPersisted && navigator.storage.persist) {
        persisted = await navigator.storage.persist();
      }

      let quota: { usage: number; quota: number } | undefined;
      if (navigator.storage.estimate) {
        const est = await navigator.storage.estimate();
        quota = { usage: est.usage || 0, quota: est.quota || 0 };
      }

      return { supported: true, persisted, quota };
    } catch (err) {
      console.warn('Error checking storage persistence:', err);
      return { supported: true, persisted: false };
    }
  }
  return { supported: false, persisted: false };
}

/**
 * Converts a Blob to a Base64 string
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const res = reader.result as string;
      const base64 = res.includes(',') ? res.split(',')[1] : res;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Converts a Base64 string back into a Blob
 */
export function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteChars = atob(base64);
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteNumbers[i] = byteChars.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

/**
 * Serializes a project and its associated media blobs into an EAI export package
 */
export async function createEAIPackage(project: Project): Promise<EAIExportPackage> {
  const bundledAssets: SerializedMediaAsset[] = [];

  for (const asset of project.mediaAssets || []) {
    let base64Data: string | undefined;

    // Check if asset has a local blob stored in IndexedDB
    const storedAsset = await getMediaAssetBlob(asset.id);
    if (storedAsset && storedAsset.fileBlob) {
      try {
        base64Data = await blobToBase64(storedAsset.fileBlob);
      } catch (err) {
        console.warn(`Could not serialize blob for asset ${asset.id}:`, err);
      }
    } else if (asset.fileBlob) {
      try {
        base64Data = await blobToBase64(asset.fileBlob);
      } catch (err) {
        console.warn(`Could not serialize in-memory blob for asset ${asset.id}:`, err);
      }
    }

    const { fileBlob, ...restAsset } = asset;
    bundledAssets.push({
      ...restAsset,
      dataBase64: base64Data
    });
  }

  return {
    format: 'ESTUDIO_AUDIOVISUAL_INTELLIGENT_PACKAGE',
    version: EAI_FORMAT_VERSION,
    exportedAt: Date.now(),
    project,
    bundledAssets
  };
}

/**
 * Triggers browser download of an EAI package file (.eai)
 */
export async function downloadProjectEAI(project: Project): Promise<void> {
  const pkg = await createEAIPackage(project);
  const jsonString = JSON.stringify(pkg, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const cleanTitle = project.title
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-');
  const filename = `${cleanTitle || 'proyecto'}-backup.eai`;

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Validates and unpacks an EAI package from a JSON string or file
 */
export function validateAndParseEAIPackage(rawJson: string): EAIExportPackage {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    throw new Error('El archivo proporcionado no tiene un formato JSON válido.');
  }

  const pkg = parsed as EAIExportPackage;

  if (
    !pkg ||
    pkg.format !== 'ESTUDIO_AUDIOVISUAL_INTELLIGENT_PACKAGE' ||
    !pkg.project ||
    !pkg.project.id ||
    !pkg.project.title ||
    !pkg.project.script
  ) {
    throw new Error('El archivo no es un paquete válido de Estudio Audiovisual (.eai).');
  }

  return pkg;
}

/**
 * Restores a project from an EAI package into IndexedDB, rehydrating its binary assets
 */
export async function restoreProjectFromEAI(pkg: EAIExportPackage): Promise<Project> {
  const { project, bundledAssets } = pkg;

  // 1. Rehydrate and save binary media assets into IndexedDB
  for (const assetData of bundledAssets || []) {
    let restoredBlob: Blob | undefined;
    if (assetData.dataBase64) {
      restoredBlob = base64ToBlob(assetData.dataBase64, assetData.mimeType || 'application/octet-stream');
    }

    const { dataBase64, ...mediaAssetBase } = assetData;
    const mediaAsset: MediaAsset = {
      ...mediaAssetBase,
      fileBlob: restoredBlob
    };

    await saveMediaAssetBlob(mediaAsset);
  }

  // 2. Save the restored project in IndexedDB
  await saveProjectToStorage(project);

  return project;
}
