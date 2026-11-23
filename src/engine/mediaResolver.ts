// Resolución de medios por escena.
//
// Los object URLs mueren al recargar la página, así que las escenas guardan el id
// del recurso (imageAssetId / videoAssetId). Aquí se reconstruye una URL válida
// desde el blob del proyecto o, si no está, desde IndexedDB.

import { Project, Scene } from '../types';
import { getMediaAssetBlob } from '../services/storage/db';

// Un object URL por recurso: se reutiliza para no crear decenas por render.
const urlCache = new Map<string, string>();

async function assetObjectUrl(project: Project, assetId: string): Promise<string | null> {
  const cached = urlCache.get(assetId);
  if (cached) return cached;

  const asset = (project.mediaAssets || []).find((item) => item.id === assetId);
  let blob = asset?.fileBlob ?? null;

  if (!blob) {
    const stored = await getMediaAssetBlob(assetId).catch(() => null);
    blob = stored?.fileBlob ?? null;
  }

  if (!blob) return null;

  const url = URL.createObjectURL(blob);
  urlCache.set(assetId, url);
  return url;
}

function needsResolution(scene: Scene): boolean {
  return Boolean(scene.imageAssetId || scene.secondaryImageAssetId || scene.videoAssetId);
}

/** Devuelve una copia del proyecto con las URLs de imagen/video de las escenas al día. */
export async function resolveSceneMediaUrls(project: Project): Promise<Project> {
  if (!project.script.scenes.some(needsResolution)) return project;

  let changed = false;

  const scenes = await Promise.all(
    project.script.scenes.map(async (scene) => {
      let next = scene;

      if (scene.imageAssetId) {
        const url = await assetObjectUrl(project, scene.imageAssetId);
        if (url && url !== scene.imageUrl) {
          next = { ...next, imageUrl: url };
          changed = true;
        }
      }

      if (scene.secondaryImageAssetId) {
        const url = await assetObjectUrl(project, scene.secondaryImageAssetId);
        if (url && url !== scene.secondaryImageUrl) {
          next = { ...next, secondaryImageUrl: url };
          changed = true;
        }
      }

      if (scene.videoAssetId) {
        const url = await assetObjectUrl(project, scene.videoAssetId);
        if (url && url !== scene.videoUrl) {
          next = { ...next, videoUrl: url };
          changed = true;
        }
      }

      return next;
    })
  );

  if (!changed) return project;
  return { ...project, script: { ...project.script, scenes } };
}
