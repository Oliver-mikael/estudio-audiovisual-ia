// Project Backup & Portable Export/Import Service (.eai format)
// Enables complete physical backups preserving metadata, scenes, sources, narrative angles and binary assets

import { Project, MediaAsset } from '../../types';
import {
  saveProjectToStorage,
  getMediaAssetBlob,
  saveMediaAssetBlob,
  getAllProjectsFromStorage
} from './db';

export const EAI_FORMAT_VERSION = '1.0.0';
export const MAX_SAFE_PACKAGE_BYTES = 250 * 1024 * 1024; // 250 MB warning threshold for mobile WebView

export interface SerializedMediaAsset extends Omit<MediaAsset, 'fileBlob'> {
  dataBase64?: string;
}

export interface EAIExportPackage {
  format: 'ESTUDIO_AUDIOVISUAL_INTELLIGENT_PACKAGE';
  version: string;
  exportedAt: number;
  project: Project;
  bundledAssets: SerializedMediaAsset[];
  checksum?: string; // SHA-256 integrity hash of payload
}

export interface EAIBatchPackage {
  format: 'ESTUDIO_AUDIOVISUAL_BATCH_PACKAGE';
  version: string;
  exportedAt: number;
  projectsCount: number;
  packages: EAIExportPackage[];
  checksum?: string;
}

export type ImportStrategy = 'create_copy' | 'overwrite' | 'skip';

/**
 * Computes SHA-256 checksum string for a text payload using Web Crypto API
 */
export async function computeSHA256(text: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback simple checksum if SubtleCrypto is not available in test env
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `fallback-${Math.abs(hash).toString(16)}`;
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
 * Serializes a project and its associated media blobs into an EAI export package with SHA-256 integrity hash
 */
export async function createEAIPackage(project: Project): Promise<EAIExportPackage> {
  const bundledAssets: SerializedMediaAsset[] = [];

  for (const asset of project.mediaAssets || []) {
    let base64Data: string | undefined;

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

  // Pre-structure without checksum to calculate stable hash
  const partialPackage: Omit<EAIExportPackage, 'checksum'> = {
    format: 'ESTUDIO_AUDIOVISUAL_INTELLIGENT_PACKAGE',
    version: EAI_FORMAT_VERSION,
    exportedAt: Date.now(),
    project,
    bundledAssets
  };

  const payloadString = JSON.stringify(partialPackage);
  const checksum = await computeSHA256(payloadString);

  return {
    ...partialPackage,
    checksum
  };
}

/**
 * Creates a batch export package containing all projects stored in IndexedDB
 */
export async function createEAIBatchPackage(): Promise<EAIBatchPackage> {
  const allProjects = await getAllProjectsFromStorage();
  const packages: EAIExportPackage[] = [];

  for (const proj of allProjects) {
    const pkg = await createEAIPackage(proj);
    packages.push(pkg);
  }

  const partialBatch: Omit<EAIBatchPackage, 'checksum'> = {
    format: 'ESTUDIO_AUDIOVISUAL_BATCH_PACKAGE',
    version: EAI_FORMAT_VERSION,
    exportedAt: Date.now(),
    projectsCount: packages.length,
    packages
  };

  const checksum = await computeSHA256(JSON.stringify(partialBatch));

  return {
    ...partialBatch,
    checksum
  };
}

/**
 * Triggers browser download of an individual EAI package file (.eai)
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
 * Triggers browser download of a full batch backup file (.eai)
 */
export async function downloadBatchEAI(): Promise<void> {
  const batchPkg = await createEAIBatchPackage();
  const jsonString = JSON.stringify(batchPkg, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const filename = `estudio-audiovisual-completo-${new Date().toISOString().split('T')[0]}.eai`;

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Validates and unpacks an EAI package or batch package from a JSON string with checksum verification
 */
export async function validateAndParseEAIPackage(
  rawJson: string
): Promise<{
  type: 'single' | 'batch';
  singlePackage?: EAIExportPackage;
  batchPackage?: EAIBatchPackage;
  checksumValid: boolean;
}> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    throw new Error('El archivo proporcionado no tiene un formato JSON válido.');
  }

  const obj = parsed as Record<string, unknown>;

  if (obj.format === 'ESTUDIO_AUDIOVISUAL_BATCH_PACKAGE') {
    const batch = parsed as EAIBatchPackage;
    if (!batch.packages || !Array.isArray(batch.packages)) {
      throw new Error('El paquete por lotes no contiene una lista válida de proyectos.');
    }

    const { checksum, ...rest } = batch;
    const computed = await computeSHA256(JSON.stringify(rest));
    const checksumValid = !checksum || checksum === computed;

    return { type: 'batch', batchPackage: batch, checksumValid };
  }

  if (obj.format === 'ESTUDIO_AUDIOVISUAL_INTELLIGENT_PACKAGE') {
    const pkg = parsed as EAIExportPackage;
    if (!pkg.project || !pkg.project.id || !pkg.project.title || !pkg.project.script) {
      throw new Error('El archivo no contiene un modelo de proyecto válido.');
    }

    const { checksum, ...rest } = pkg;
    const computed = await computeSHA256(JSON.stringify(rest));
    const checksumValid = !checksum || checksum === computed;

    return { type: 'single', singlePackage: pkg, checksumValid };
  }

  throw new Error('El archivo no es un paquete válido de Estudio Audiovisual (.eai).');
}

/**
 * Restores a project from an EAI package into IndexedDB according to the specified collision strategy
 */
export async function restoreProjectFromEAI(
  pkg: EAIExportPackage,
  strategy: ImportStrategy = 'create_copy'
): Promise<Project> {
  const { project, bundledAssets } = pkg;
  let targetProject = { ...project };

  if (strategy === 'create_copy') {
    targetProject = {
      ...project,
      id: `proj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: `${project.title} (Copia importada)`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  }

  // 1. Rehydrate and save binary media assets into IndexedDB
  for (const assetData of bundledAssets || []) {
    let restoredBlob: Blob | undefined;
    if (assetData.dataBase64) {
      try {
        restoredBlob = base64ToBlob(assetData.dataBase64, assetData.mimeType || 'application/octet-stream');
      } catch (err) {
        console.warn(`No se pudo decodificar el blob del medio ${assetData.id}:`, err);
      }
    }

    const { dataBase64, ...mediaAssetBase } = assetData;
    const mediaAsset: MediaAsset = {
      ...mediaAssetBase,
      fileBlob: restoredBlob
    };

    await saveMediaAssetBlob(mediaAsset);
  }

  // 2. Save the restored project into IndexedDB
  await saveProjectToStorage(targetProject);

  return targetProject;
}
