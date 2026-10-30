// Incremental Sync Engine for Offline-First Multi-Device Project Synchronization
import { Project, MediaAsset } from '../../types';
import { saveProjectToStorage, saveMediaAssetBlob } from '../storage/db';
import { cloudApi } from '../cloud/api';

export interface PendingMutation {
  id: string;
  projectId: string;
  type: 'UPDATE_PROJECT' | 'ADD_ASSET' | 'UPDATE_SCENE';
  payload: unknown;
  timestamp: number;
}

export class SyncEngine {
  private syncQueue: PendingMutation[] = [];
  private isSyncing = false;

  constructor() {
    const savedQueue = localStorage.getItem('estudio_sync_queue');
    if (savedQueue) {
      try {
        this.syncQueue = JSON.parse(savedQueue);
      } catch {
        this.syncQueue = [];
      }
    }
  }

  public enqueueProjectUpdate(project: Project): void {
    const mutation: PendingMutation = {
      id: `mut_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      projectId: project.id,
      type: 'UPDATE_PROJECT',
      payload: project,
      timestamp: Date.now()
    };

    // Remove existing pending updates for the same project
    this.syncQueue = this.syncQueue.filter((m) => m.projectId !== project.id || m.type !== 'UPDATE_PROJECT');
    this.syncQueue.push(mutation);
    this.persistQueue();

    // Trigger sync attempt asynchronously
    this.processQueue().catch((err) => console.error('Sync attempt failed, will retry offline', err));
  }

  public async enqueueAssetUpload(asset: MediaAsset): Promise<void> {
    await saveMediaAssetBlob(asset);
    const mutation: PendingMutation = {
      id: `mut_asset_${asset.id}`,
      projectId: asset.provenance || 'global',
      type: 'ADD_ASSET',
      payload: { id: asset.id, name: asset.name, mimeType: asset.mimeType, sizeBytes: asset.sizeBytes },
      timestamp: Date.now()
    };
    this.syncQueue.push(mutation);
    this.persistQueue();
  }

  public async processQueue(): Promise<{ syncedCount: number; remainingCount: number }> {
    if (this.isSyncing || this.syncQueue.length === 0) {
      return { syncedCount: 0, remainingCount: this.syncQueue.length };
    }

    this.isSyncing = true;
    let syncedCount = 0;

    try {
      while (this.syncQueue.length > 0) {
        const mutation = this.syncQueue[0];

        if (mutation.type === 'UPDATE_PROJECT') {
          const project = mutation.payload as Project;
          await saveProjectToStorage(project);
          if (cloudApi.isAuthenticated()) {
            await cloudApi.syncProjectToCloud(project);
          }
        }

        // Shift successfully processed mutation
        this.syncQueue.shift();
        syncedCount++;
        this.persistQueue();
      }
    } finally {
      this.isSyncing = false;
    }

    return { syncedCount, remainingCount: this.syncQueue.length };
  }

  public getPendingMutationsCount(): number {
    return this.syncQueue.length;
  }

  private persistQueue(): void {
    localStorage.setItem('estudio_sync_queue', JSON.stringify(this.syncQueue));
  }
}

export const syncEngine = new SyncEngine();
