// Media Store Operations Service (Phase 7E)
// Pure helper functions for safe asset deletion, folder organization, search, sorting and timeline linkage
import { Project, MediaAsset, MediaFolder } from '../../types';
import { saveProjectToStorage } from '../storage/db';

export type MediaSortOption = 'date-desc' | 'date-asc' | 'name-asc' | 'name-desc' | 'size-desc' | 'duration-desc';

export class MediaStore {
  /**
   * Checks if an asset is currently in use by any clip in the given project (or all projects).
   */
  public static getAssetUsageCount(
    targetProjectOrProjects: Project | Project[],
    assetId: string
  ): number {
    const projects = Array.isArray(targetProjectOrProjects)
      ? targetProjectOrProjects
      : [targetProjectOrProjects];

    let totalCount = 0;

    for (const proj of projects) {
      // Check timeline tracks
      const tracks = proj.timeline?.tracks || [];
      tracks.forEach((track) => {
        track.clips.forEach((clip) => {
          if (clip.assetId === assetId) {
            totalCount++;
          }
        });
      });

      // Check script scenes
      const scenes = proj.script?.scenes || [];
      const asset = (proj.mediaAssets || []).find((a) => a.id === assetId);
      if (asset) {
        scenes.forEach((sc) => {
          if (sc.imageUrl && (sc.imageUrl === asset.url || sc.imageUrl === asset.id)) totalCount++;
          if (sc.audioUrl && (sc.audioUrl === asset.url || sc.audioUrl === asset.id)) totalCount++;
        });
      }
    }

    return totalCount;
  }

  /**
   * Safely deletes an asset from project.
   * If allProjects is provided, verifies that NO project in the workspace is using this asset.
   * Returns false if asset is locked by timeline clips or scenes.
   */
  public static deleteAssetSafely(
    project: Project,
    assetId: string,
    force: boolean = false,
    allProjects?: Project[]
  ): { success: boolean; usageCount: number; updatedProject?: Project } {
    const scope = allProjects && allProjects.length > 0 ? allProjects : project;
    const usageCount = this.getAssetUsageCount(scope, assetId);
    if (usageCount > 0 && !force) {
      return { success: false, usageCount };
    }

    const updatedAssets = (project.mediaAssets || []).filter((a) => a.id !== assetId);
    const updatedProject: Project = {
      ...project,
      mediaAssets: updatedAssets,
      updatedAt: Date.now(),
    };

    saveProjectToStorage(updatedProject);
    return { success: true, usageCount, updatedProject };
  }

  /**
   * Renames an asset safely in place.
   */
  public static renameAsset(
    project: Project,
    assetId: string,
    newName: string
  ): Project {
    const trimmed = newName.trim();
    if (!trimmed) return project;

    const updatedAssets = project.mediaAssets.map((a) =>
      a.id === assetId ? { ...a, name: trimmed } : a
    );

    const updatedProject: Project = {
      ...project,
      mediaAssets: updatedAssets,
      updatedAt: Date.now(),
    };

    saveProjectToStorage(updatedProject);
    return updatedProject;
  }

  /**
   * Creates a new organization folder in project.
   */
  public static createFolder(
    project: Project,
    name: string,
    parentId?: string
  ): { project: Project; folder: MediaFolder } {
    const folder: MediaFolder = {
      id: `folder-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: name.trim() || 'Nueva Carpeta',
      parentId,
      createdAt: Date.now(),
    };

    const existingFolders = project.folders || [];
    const updatedProject: Project = {
      ...project,
      folders: [...existingFolders, folder],
      updatedAt: Date.now(),
    };

    saveProjectToStorage(updatedProject);
    return { project: updatedProject, folder };
  }

  /**
   * Moves an asset into a specified folder (or root if undefined).
   */
  public static moveAssetToFolder(
    project: Project,
    assetId: string,
    folderId?: string
  ): Project {
    const updatedAssets = project.mediaAssets.map((a) =>
      a.id === assetId ? { ...a, folderId } : a
    );

    const updatedProject: Project = {
      ...project,
      mediaAssets: updatedAssets,
      updatedAt: Date.now(),
    };

    saveProjectToStorage(updatedProject);
    return updatedProject;
  }

  /**
   * Filters and sorts assets based on criteria.
   */
  public static filterAndSortAssets(
    assets: MediaAsset[],
    filterType: 'all' | 'image' | 'video' | 'audio' | 'voice',
    searchQuery: string,
    sortBy: MediaSortOption,
    folderId?: string
  ): MediaAsset[] {
    let result = assets.slice();

    // 1. Folder filter
    if (folderId !== undefined) {
      result = result.filter((a) => (folderId === 'all' ? true : a.folderId === folderId));
    }

    // 2. Type filter
    if (filterType !== 'all') {
      if (filterType === 'voice') {
        result = result.filter((a) => a.type === 'audio' && (a.provenance.includes('Micrófono') || a.name.toLowerCase().includes('locución') || a.name.toLowerCase().includes('voz')));
      } else {
        result = result.filter((a) => a.type === filterType);
      }
    }

    // 3. Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          (a.tags && a.tags.some((t) => t.toLowerCase().includes(q))) ||
          a.provenance.toLowerCase().includes(q)
      );
    }

    // 4. Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return b.createdAt - a.createdAt;
        case 'date-asc':
          return a.createdAt - b.createdAt;
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'size-desc':
          return b.sizeBytes - a.sizeBytes;
        case 'duration-desc':
          return (b.durationSeconds || 0) - (a.durationSeconds || 0);
        default:
          return 0;
      }
    });

    return result;
  }
}
