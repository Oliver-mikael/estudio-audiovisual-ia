// IndexedDB Local Storage Service for Projects and Media Blobs

import { Project, MediaAsset } from '../../types';

import { HISTORY_LIMIT } from '../history/history';
import type { ProjectVersion } from '../versions/versions';

const DB_NAME = 'EstudioAudiovisualDB';
const DB_VERSION = 4;
const STORE_PROJECTS = 'projects';
const STORE_ASSETS = 'assets';
const STORE_HISTORY = 'history';
const STORE_VERSIONS = 'versions';
const STORE_METRICS = 'metrics';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
        db.createObjectStore(STORE_PROJECTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_ASSETS)) {
        db.createObjectStore(STORE_ASSETS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_HISTORY)) {
        db.createObjectStore(STORE_HISTORY, { keyPath: 'projectId' });
      }
      if (!db.objectStoreNames.contains(STORE_VERSIONS)) {
        db.createObjectStore(STORE_VERSIONS, { keyPath: 'projectId' });
      }
      if (!db.objectStoreNames.contains(STORE_METRICS)) {
        db.createObjectStore(STORE_METRICS, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveProjectToStorage(project: Project): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PROJECTS, 'readwrite');
    const store = tx.objectStore(STORE_PROJECTS);
    const request = store.put({ ...project, updatedAt: Date.now() });
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getProjectFromStorage(id: string): Promise<Project | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PROJECTS, 'readonly');
    const store = tx.objectStore(STORE_PROJECTS);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function getAllProjectsFromStorage(): Promise<Project[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PROJECTS, 'readonly');
    const store = tx.objectStore(STORE_PROJECTS);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

/** Historial de deshacer/rehacer guardado junto al proyecto. */
export interface StoredHistory {
  projectId: string;
  past: Project[];
  present: Project;
  future: Project[];
  updatedAt: number;
}

/**
 * Persiste el historial de un proyecto (máximo HISTORY_LIMIT estados por lado).
 * Se guarda como un único registro para que IndexedDB comparta los blobs de los
 * recursos entre instantáneas, en lugar de duplicarlos por paso.
 */
export async function saveHistoryToStorage(
  projectId: string,
  history: { past: Project[]; present: Project; future: Project[] }
): Promise<void> {
  const db = await openDB();
  const snapshot: StoredHistory = {
    projectId,
    past: history.past.slice(Math.max(0, history.past.length - HISTORY_LIMIT)),
    present: history.present,
    future: history.future.slice(0, HISTORY_LIMIT),
    updatedAt: Date.now(),
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_HISTORY, 'readwrite');
    const store = tx.objectStore(STORE_HISTORY);
    const request = store.put(snapshot);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getHistoryFromStorage(projectId: string): Promise<StoredHistory | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_HISTORY, 'readonly');
    const store = tx.objectStore(STORE_HISTORY);
    const request = store.get(projectId);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteHistoryFromStorage(projectId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_HISTORY, 'readwrite');
    const store = tx.objectStore(STORE_HISTORY);
    const request = store.delete(projectId);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/** Instantáneas de versiones guardadas por proyecto (máximo 5 en la UI). */
export interface StoredVersions {
  projectId: string;
  snapshots: ProjectVersion[];
  updatedAt: number;
}

export async function saveProjectVersions(
  projectId: string,
  snapshots: ProjectVersion[]
): Promise<void> {
  const db = await openDB();
  const record: StoredVersions = { projectId, snapshots, updatedAt: Date.now() };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_VERSIONS, 'readwrite');
    const store = tx.objectStore(STORE_VERSIONS);
    const request = store.put(record);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getProjectVersions(projectId: string): Promise<ProjectVersion[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_VERSIONS, 'readonly');
    const store = tx.objectStore(STORE_VERSIONS);
    const request = store.get(projectId);
    request.onsuccess = () => {
      const record = request.result as StoredVersions | undefined;
      resolve(record?.snapshots ?? []);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function deleteProjectVersions(projectId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_VERSIONS, 'readwrite');
    const store = tx.objectStore(STORE_VERSIONS);
    const request = store.delete(projectId);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/** Métricas de uso locales (fase 47): un único registro con id «usage». */
export interface StoredUsageMetrics {
  id: string;
  exportedVideos: number;
  exportedSeconds: number;
  firstUseAt: number | null;
  lastUseAt: number | null;
}

export async function saveUsageMetricsRecord(record: StoredUsageMetrics): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_METRICS, 'readwrite');
    const store = tx.objectStore(STORE_METRICS);
    const request = store.put(record);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getUsageMetricsRecord(id: string): Promise<StoredUsageMetrics | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_METRICS, 'readonly');
    const store = tx.objectStore(STORE_METRICS);
    const request = store.get(id);
    request.onsuccess = () => resolve((request.result as StoredUsageMetrics | undefined) ?? null);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteProjectFromStorage(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PROJECTS, 'readwrite');
    const store = tx.objectStore(STORE_PROJECTS);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function saveMediaAssetBlob(asset: MediaAsset): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_ASSETS, 'readwrite');
    const store = tx.objectStore(STORE_ASSETS);
    const request = store.put(asset);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteMediaAssetBlob(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_ASSETS, 'readwrite');
    const store = tx.objectStore(STORE_ASSETS);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getMediaAssetBlob(id: string): Promise<MediaAsset | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_ASSETS, 'readonly');
    const store = tx.objectStore(STORE_ASSETS);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}
