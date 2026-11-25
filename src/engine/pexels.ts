// Imágenes automáticas por escena con la API de Pexels.
//
// La intención visual escrita en el guion se reduce a unas palabras clave y se
// busca una foto horizontal. La imagen se descarga como blob (necesario para
// poder dibujarla en el canvas y exportarla), se guarda en la Biblioteca y se
// asigna a la escena como imagen principal. La clave es del usuario y se
// configura en los ajustes del proyecto.

import { MediaAsset, Project } from '../types';
import { saveMediaAssetBlob } from '../services/storage/db';

export const PEXELS_SEARCH_ENDPOINT = 'https://api.pexels.com/v1/search';

/** Palabras sin valor de búsqueda en una intención visual en español/inglés. */
const STOPWORDS = new Set([
  'el', 'la', 'los', 'las', 'lo', 'un', 'una', 'unos', 'unas',
  'de', 'del', 'al', 'a', 'en', 'con', 'por', 'para', 'que', 'y', 'o', 'u', 'e',
  'the', 'of', 'and', 'with', 'to', 'in', 'on', 'for', 'a', 'an',
  'sobre', 'desde', 'hasta', 'entre', 'sin', 'tras', 'muy', 'mas', 'menos',
  'como', 'donde', 'cuando', 'mientras', 'tambien', 'solo', 'todo', 'toda',
  'plano', 'planos', 'imagen', 'imagenes', 'foto', 'fotos', 'visual',
  'intencion', 'mostrar', 'muestra', 'vista', 'tipo', 'escena', 'fondo',
  'apoyo', 'ilustre', 'ilustrar', 'represente', 'representar', 'concepto',
  'que', 'se', 've', 'pantalla', 'general', 'primer', 'plano',
]);

/** Minúsculas, sin acentos y sin signos: una palabra lista para buscar. */
export function normalizeKeyword(word: string): string {
  return word
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9ñ]+/g, '');
}

/**
 * Palabras clave de una intención visual: quita artículos y palabras genéricas,
 * deduplica y conserva como máximo `maxWords`.
 */
export function visualKeywords(intent: string, maxWords = 4): string {
  const words = intent.split(/\s+/).map(normalizeKeyword).filter(Boolean);
  const seen = new Set<string>();
  const keywords: string[] = [];
  for (const word of words) {
    if (word.length < 3 || STOPWORDS.has(word) || seen.has(word)) continue;
    seen.add(word);
    keywords.push(word);
    if (keywords.length >= maxWords) break;
  }
  return keywords.join(' ');
}

export interface PexelsPhoto {
  id: number;
  pageUrl: string;
  photographer: string;
  alt: string;
  /** URL de descarga de la versión grande (≈ 1880 px de ancho). */
  downloadUrl: string;
}

interface PexelsSearchResponse {
  photos?: Array<{
    id: number;
    url?: string;
    photographer?: string;
    alt?: string;
    src?: { original?: string; large2x?: string; large?: string };
  }>;
}

function describePexelsError(status: number, detail: string): string {
  const suffix = detail ? `: ${detail}` : '';
  if (status === 401 || status === 403) {
    return `La clave de Pexels no es válida o no tiene permisos (${status})${suffix}`;
  }
  if (status === 429) return `Se agotó la cuota de Pexels (429)${suffix}`;
  if (status === 400) return `Pexels rechazó la búsqueda (400)${suffix}`;
  return `Pexels respondió con un error ${status}${suffix}`;
}

async function readPexelsError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string; message?: string };
    return body.error ?? body.message ?? '';
  } catch {
    return '';
  }
}

export interface PexelsSearchOptions {
  apiKey: string;
  orientation?: 'landscape' | 'portrait' | 'square';
  perPage?: number;
  fetchImpl?: typeof fetch;
}

/** Busca la primera foto relevante para una intención visual. */
export async function searchPexelsPhoto(
  intent: string,
  options: PexelsSearchOptions
): Promise<PexelsPhoto | null> {
  const apiKey = options.apiKey.trim();
  if (!apiKey) {
    throw new Error('Falta la clave de Pexels. Configúrala en Ajustes del proyecto.');
  }
  const query = visualKeywords(intent);
  if (!query) {
    throw new Error('La intención visual no tiene palabras clave para buscar una imagen.');
  }

  const request = options.fetchImpl ?? fetch;
  const params = new URLSearchParams({
    query,
    per_page: String(options.perPage ?? 3),
    orientation: options.orientation ?? 'landscape',
  });
  const response = await request(`${PEXELS_SEARCH_ENDPOINT}?${params.toString()}`, {
    headers: { Authorization: apiKey },
  });

  if (!response.ok) {
    throw new Error(describePexelsError(response.status, await readPexelsError(response)));
  }

  const payload = (await response.json()) as PexelsSearchResponse;
  const photo = payload.photos?.[0];
  if (!photo) return null;

  const downloadUrl = photo.src?.large2x ?? photo.src?.original ?? photo.src?.large;
  if (!downloadUrl) return null;

  return {
    id: photo.id,
    pageUrl: photo.url ?? `https://www.pexels.com/photo/${photo.id}/`,
    photographer: photo.photographer ?? 'Pexels',
    alt: photo.alt ?? query,
    downloadUrl,
  };
}

function sanitizeFileName(text: string): string {
  return (
    text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'imagen'
  );
}

export interface PexelsAssetResult {
  asset: MediaAsset;
  photo: PexelsPhoto;
}

/**
 * Busca una foto, descarga la imagen y la guarda en la Biblioteca como recurso
 * del proyecto. Devuelve el MediaAsset listo para asignar a una escena.
 */
export async function createPexelsImageAsset(
  intent: string,
  options: PexelsSearchOptions & { sceneTitle?: string }
): Promise<PexelsAssetResult> {
  const photo = await searchPexelsPhoto(intent, options);
  if (!photo) {
    throw new Error(`No se encontró ninguna imagen en Pexels para «${visualKeywords(intent)}».`);
  }

  const request = options.fetchImpl ?? fetch;
  const imageResponse = await request(photo.downloadUrl, { mode: 'cors' });
  if (!imageResponse.ok) {
    throw new Error(
      `No se pudo descargar la imagen de Pexels (${imageResponse.status}). Revisa la conexión o la clave.`
    );
  }
  const blob = await imageResponse.blob();
  if (!blob.type.startsWith('image/')) {
    throw new Error('Pexels devolvió un archivo que no es una imagen.');
  }

  const query = visualKeywords(intent);
  const asset: MediaAsset = {
    id: `asset-pexels-${photo.id}-${Date.now().toString(36)}`,
    name: `pexels-${sanitizeFileName(options.sceneTitle || query)}-${photo.id}.jpg`,
    type: 'image',
    url: URL.createObjectURL(blob),
    fileBlob: blob,
    mimeType: blob.type || 'image/jpeg',
    sizeBytes: blob.size,
    license: `Pexels License · ${photo.photographer}`,
    provenance: `Pexels · búsqueda "${query}" · foto ${photo.id} de ${photo.photographer} · ${photo.pageUrl}`,
    createdAt: Date.now(),
  };

  // Se guarda en IndexedDB para que la imagen siga disponible tras recargar.
  await saveMediaAssetBlob(asset);
  return { asset, photo };
}

/** Asigna una imagen de la biblioteca como imagen principal de una escena. */
export function assignImageAssetToScene(
  project: Project,
  sceneId: string,
  asset: MediaAsset
): Project {
  const scenes = project.script.scenes.map((scene) =>
    scene.id === sceneId
      ? { ...scene, imageAssetId: asset.id, imageUrl: asset.url }
      : scene
  );
  return {
    ...project,
    mediaAssets: [asset, ...(project.mediaAssets ?? []).filter((item) => item.id !== asset.id)],
    script: { ...project.script, scenes },
  };
}
