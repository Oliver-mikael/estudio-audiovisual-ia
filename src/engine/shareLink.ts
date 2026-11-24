// Compartir un proyecto como enlace (fase 43).
//
// El proyecto completo (texto y configuración) se serializa a JSON, se comprime
// con `deflate-raw` mediante CompressionStream y se codifica en base64url dentro
// del hash de la URL. Los recursos binarios (imágenes, audio y video) quedan
// fuera: si el proyecto tiene alguno, el enlace no se genera y se explica por qué.
//
// Formato del hash: `#project=1.<base64url>` (comprimido) o
// `#project=0.<base64url>` (sin compresión, navegadores sin CompressionStream).

import { Project } from '../types';

export const SHARE_HASH_KEY = 'project';
/** Prefijo del hash completo, listo para concatenar a una URL. */
export const SHARE_HASH_PREFIX = `#${SHARE_HASH_KEY}=`;
const COMPRESSED_FLAG = '1';
const PLAIN_FLAG = '0';

export interface ShareCheck {
  ok: boolean;
  reason?: string;
}

export interface SharedProjectSummary {
  title: string;
  sceneCount: number;
  durationSeconds: number;
  createdAt: number;
}

/** Campos de escena que apuntan a un recurso binario o a una URL temporal. */
const SCENE_ASSET_FIELDS = [
  'imageUrl',
  'imageAssetId',
  'secondaryImageUrl',
  'secondaryImageAssetId',
  'videoUrl',
  'videoAssetId',
  'audioUrl',
  'sfxAssetId',
  'narrationAssetId',
] as const;

/**
 * Solo se comparten proyectos sin recursos binarios: sin blobs en la
 * biblioteca, sin recursos asignados a escenas y sin URLs `blob:`.
 */
export function canShareProject(project: Project): ShareCheck {
  if (project.mediaAssets.length > 0) {
    return {
      ok: false,
      reason: `El proyecto tiene ${project.mediaAssets.length} recurso(s) en la Biblioteca. Los enlaces solo admiten texto y configuración.`,
    };
  }

  if (project.narrationAssetId || project.musicAssetId) {
    return {
      ok: false,
      reason: 'El proyecto usa narración o música de la Biblioteca. Los enlaces solo admiten texto y configuración.',
    };
  }

  for (const scene of project.script.scenes) {
    for (const field of SCENE_ASSET_FIELDS) {
      const value = scene[field];
      if (typeof value === 'string' && value.length > 0) {
        return {
          ok: false,
          reason: `La escena «${scene.title || scene.id}» usa un recurso binario (${field}). Los enlaces solo admiten texto y configuración.`,
        };
      }
    }
  }

  return { ok: true };
}

/** Copia del proyecto sin blobs ni referencias a recursos locales. */
export function stripProjectForShare(project: Project): Project {
  return {
    ...project,
    mediaAssets: [],
    narrationAssetId: undefined,
    musicAssetId: undefined,
    script: {
      ...project.script,
      scenes: project.script.scenes.map((scene) => {
        const clean: Project['script']['scenes'][number] = { ...scene };
        for (const field of SCENE_ASSET_FIELDS) {
          delete clean[field];
        }
        return clean;
      }),
    },
  };
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBytes(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

/** Copia con un `ArrayBuffer` propio, que es lo que acepta `Blob`. */
function toBlobPart(bytes: Uint8Array): BlobPart {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy;
}

async function deflateRaw(bytes: Uint8Array): Promise<Uint8Array | null> {
  if (typeof CompressionStream === 'undefined') return null;
  try {
    const stream = new Blob([toBlobPart(bytes)])
      .stream()
      .pipeThrough(new CompressionStream('deflate-raw'));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  } catch {
    return null;
  }
}

async function inflateRaw(bytes: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('Este navegador no puede descomprimir el enlace del proyecto.');
  }
  const stream = new Blob([toBlobPart(bytes)])
    .stream()
    .pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** Serializa el proyecto a la carga del hash (sin el `#`). */
export async function encodeProjectForShare(project: Project): Promise<string> {
  const check = canShareProject(project);
  if (!check.ok) throw new Error(check.reason);

  const json = JSON.stringify(stripProjectForShare(project));
  const bytes = new TextEncoder().encode(json);
  const compressed = await deflateRaw(bytes);
  if (compressed && compressed.length > 0) {
    return `${COMPRESSED_FLAG}.${bytesToBase64Url(compressed)}`;
  }
  return `${PLAIN_FLAG}.${bytesToBase64Url(bytes)}`;
}

/** Reconstruye el proyecto desde la carga del hash. */
export async function decodeProjectFromShare(payload: string): Promise<Project> {
  const clean = payload.trim().replace(/^#?project=/, '');
  const separator = clean.indexOf('.');
  if (separator <= 0) throw new Error('El enlace del proyecto no tiene el formato esperado.');

  const flag = clean.slice(0, separator);
  const encoded = clean.slice(separator + 1);
  if (!encoded) throw new Error('El enlace del proyecto está vacío.');

  const bytes = base64UrlToBytes(encoded);
  const decoded = flag === COMPRESSED_FLAG ? await inflateRaw(bytes) : bytes;
  let parsed: unknown;
  try {
    parsed = JSON.parse(new TextDecoder().decode(decoded));
  } catch {
    throw new Error('El enlace del proyecto no contiene un JSON válido.');
  }

  const project = parsed as Project;
  if (!project || typeof project !== 'object' || typeof project.title !== 'string') {
    throw new Error('El enlace no corresponde a un proyecto de este estudio.');
  }
  if (!project.script || !Array.isArray(project.script.scenes)) {
    throw new Error('El proyecto compartido no tiene escenas válidas.');
  }
  return project;
}

/** Carga del hash de la URL, o null si no hay ninguna. */
export function readSharePayload(hash: string): string | null {
  const clean = hash.startsWith('#') ? hash.slice(1) : hash;
  if (!clean) return null;
  const params = new URLSearchParams(clean);
  const payload = params.get(SHARE_HASH_KEY);
  return payload && payload.length > 0 ? payload : null;
}

/** URL absoluta lista para copiar, con el proyecto en el hash. */
export async function buildShareUrl(project: Project, baseUrl: string): Promise<string> {
  const payload = await encodeProjectForShare(project);
  const base = baseUrl.split('#')[0];
  return `${base}${SHARE_HASH_PREFIX}${payload}`;
}

/** Datos que se muestran antes de importar un enlace compartido. */
export function summarizeSharedProject(project: Project): SharedProjectSummary {
  return {
    title: project.title,
    sceneCount: project.script.scenes.length,
    durationSeconds: Number(
      project.script.scenes
        .reduce((sum, scene) => sum + (scene.durationSeconds || 0), 0)
        .toFixed(2)
    ),
    createdAt: project.createdAt,
  };
}
