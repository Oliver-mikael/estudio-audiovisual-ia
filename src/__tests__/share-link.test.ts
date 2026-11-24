import { describe, expect, it } from 'vitest';
import {
  SHARE_HASH_PREFIX,
  buildShareUrl,
  canShareProject,
  decodeProjectFromShare,
  encodeProjectForShare,
  readSharePayload,
  stripProjectForShare,
  summarizeSharedProject,
} from '../engine/shareLink';
import { createEmptyProject } from '../data/newProject';
import { Project } from '../types';

function sampleProject(): Project {
  const project = createEmptyProject('Proyecto compartido');
  return {
    ...project,
    description: 'Solo texto',
    script: {
      ...project.script,
      summary: 'Resumen del guion',
      scenes: [
        {
          id: 's1',
          title: 'Escena uno',
          narrationText: 'Hola mundo',
          visualIntent: 'Una pizarra',
          cameraMotion: 'Static',
          transition: 'Fade',
          durationSeconds: 4,
          subtitles: [{ text: 'Primera línea', startSeconds: 0.5, durationSeconds: 1.5 }],
        },
        {
          id: 's2',
          title: 'Escena dos',
          narrationText: 'Adiós',
          visualIntent: 'Un mapa',
          cameraMotion: 'Zoom In',
          transition: 'Fade',
          durationSeconds: 6,
        },
      ],
    },
  };
}

describe('compartir proyecto como URL (fase 43)', () => {
  it('el viaje de ida y vuelta conserva título, escenas y subtítulos', async () => {
    const project = sampleProject();
    const payload = await encodeProjectForShare(project);
    const restored = await decodeProjectFromShare(payload);

    expect(restored.title).toBe('Proyecto compartido');
    expect(restored.script.scenes).toHaveLength(2);
    expect(restored.script.scenes[0].title).toBe('Escena uno');
    expect(restored.script.scenes[0].subtitles).toEqual([
      { text: 'Primera línea', startSeconds: 0.5, durationSeconds: 1.5 },
    ]);
    expect(restored.description).toBe('Solo texto');
    expect(summarizeSharedProject(restored).durationSeconds).toBe(10);
  });

  it('genera una URL con el proyecto en el hash y la vuelve a leer', async () => {
    const project = sampleProject();
    const url = await buildShareUrl(project, 'https://estudio.test/editor?x=1#viejo');
    expect(url.startsWith('https://estudio.test/editor?x=1#project=')).toBe(true);
    expect(url).not.toContain('#viejo');

    const payload = readSharePayload(new URL(url).hash);
    expect(payload).not.toBeNull();
    const restored = await decodeProjectFromShare(payload as string);
    expect(restored.script.scenes).toHaveLength(2);
    expect(restored.title).toBe(project.title);
    expect(SHARE_HASH_PREFIX).toBe('#project=');
  });

  it('el base64url no necesita escapes en la URL', async () => {
    const payload = await encodeProjectForShare(sampleProject());
    expect(payload).toMatch(/^[01]\.[A-Za-z0-9_-]+$/);
  });

  it('rechaza proyectos con recursos binarios', () => {
    const project = sampleProject();
    project.mediaAssets = [
      {
        id: 'a1',
        name: 'foto.png',
        type: 'image',
        url: 'blob:local',
        mimeType: 'image/png',
        sizeBytes: 10,
        license: 'CC0',
        provenance: 'local',
        createdAt: 1,
      },
    ];
    expect(canShareProject(project).ok).toBe(false);
    expect(canShareProject(project).reason).toContain('Biblioteca');

    const withImage = sampleProject();
    withImage.script.scenes[0].imageAssetId = 'a1';
    expect(canShareProject(withImage).ok).toBe(false);

    expect(canShareProject(sampleProject()).ok).toBe(true);
  });

  it('quita blobs y referencias a recursos de la copia compartida', () => {
    const project = sampleProject();
    project.mediaAssets = [
      {
        id: 'a1',
        name: 'voz.mp3',
        type: 'audio',
        url: 'blob:local',
        mimeType: 'audio/mpeg',
        sizeBytes: 10,
        license: 'CC0',
        provenance: 'local',
        createdAt: 1,
      },
    ];
    project.musicAssetId = 'a1';
    project.script.scenes[0].imageUrl = 'blob:local';

    const clean = stripProjectForShare(project);
    expect(clean.mediaAssets).toEqual([]);
    expect(clean.musicAssetId).toBeUndefined();
    expect(clean.script.scenes[0].imageUrl).toBeUndefined();
    expect(clean.script.scenes[0].narrationText).toBe('Hola mundo');
  });

  it('rechaza cargas corruptas con un mensaje claro', async () => {
    await expect(decodeProjectFromShare('sin-punto')).rejects.toThrow(/formato/);
    await expect(decodeProjectFromShare('1.')).rejects.toThrow(/vacío/);
    await expect(decodeProjectFromShare('0.bm9zLXVuLWpzb24')).rejects.toThrow(/JSON/);
    expect(readSharePayload('#otra=cosa')).toBeNull();
    expect(readSharePayload('')).toBeNull();
  });
});
