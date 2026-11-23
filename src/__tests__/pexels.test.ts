import 'fake-indexeddb/auto';
import { describe, expect, it, vi } from 'vitest';
import {
  assignImageAssetToScene,
  createPexelsImageAsset,
  normalizeKeyword,
  searchPexelsPhoto,
  visualKeywords,
} from '../engine/pexels';
import { Project } from '../types';

const baseProject = (): Project => ({
  id: 'p',
  title: 'Prueba',
  description: '',
  createdAt: 0,
  updatedAt: 0,
  angles: [],
  sources: [],
  mediaAssets: [],
  script: {
    title: 'g',
    summary: '',
    targetAudience: '',
    tone: 'Divulgativo',
    scenes: [
      {
        id: 's1',
        title: 'Uno',
        narrationText: 'Hola',
        visualIntent: 'mina a cielo abierto con excavadoras',
        cameraMotion: 'Static',
        transition: 'Cut',
        durationSeconds: 5,
      },
    ],
  },
  settings: { fps: 30, resolution: { width: 1280, height: 720 }, aspectRatio: '16:9' },
});

describe('pexels: palabras clave', () => {
  it('normaliza acentos y signos', () => {
    expect(normalizeKeyword('Minería,')).toBe('mineria');
    expect(normalizeKeyword('¡Teléfono!')).toBe('telefono');
  });

  it('quita artículos y palabras genéricas y deduplica', () => {
    expect(visualKeywords('Mostrar imagen de una mina a cielo abierto con excavadoras')).toBe(
      'mina cielo abierto excavadoras'
    );
    expect(visualKeywords('Plano general de la ciudad de noche')).toBe('ciudad noche');
  });

  it('limita el número de palabras clave', () => {
    expect(visualKeywords('uno dos tres cuatro cinco seis siete', 1)).toBe('uno');
    // Palabras de menos de tres letras se descartan.
    expect(visualKeywords('sol mar cielo nube', 3)).toBe('sol mar cielo');
  });
});

describe('pexels: búsqueda', () => {
  it('envía la consulta con la cabecera Authorization y elige la foto grande', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          photos: [
            {
              id: 123,
              url: 'https://www.pexels.com/photo/123/',
              photographer: 'Ana',
              alt: 'Mina',
              src: { large2x: 'https://images.pexels.com/123.jpg', original: 'https://images.pexels.com/123-o.jpg' },
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );
    const photo = await searchPexelsPhoto('mina a cielo abierto', {
      apiKey: 'clave-pexels',
      fetchImpl: fetchMock as unknown as typeof fetch,
    });
    expect(photo).toMatchObject({ id: 123, photographer: 'Ana', downloadUrl: 'https://images.pexels.com/123.jpg' });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain('https://api.pexels.com/v1/search?');
    expect(url).toContain('query=mina+cielo+abierto');
    expect((init.headers as Record<string, string>).Authorization).toBe('clave-pexels');
  });

  it('devuelve null si la búsqueda no tiene fotos', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ photos: [] }), { status: 200 }));
    await expect(
      searchPexelsPhoto('ciudad nocturna', { apiKey: 'k', fetchImpl: fetchMock as unknown as typeof fetch })
    ).resolves.toBeNull();
  });

  it('explica una clave inválida', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 }));
    await expect(
      searchPexelsPhoto('mina', { apiKey: 'k', fetchImpl: fetchMock as unknown as typeof fetch })
    ).rejects.toThrow(/clave de Pexels/);
  });

  it('descarga la imagen y crea un recurso con procedencia', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (String(url).includes('/v1/search')) {
        return new Response(
          JSON.stringify({
            photos: [
              { id: 7, url: 'https://www.pexels.com/photo/7/', photographer: 'Luis', src: { large2x: 'https://images.pexels.com/7.jpg' } },
            ],
          }),
          { status: 200 }
        );
      }
      return new Response(new Blob([new Uint8Array([1, 2, 3])], { type: 'image/jpeg' }), {
        status: 200,
        headers: { 'Content-Type': 'image/jpeg' },
      });
    });
    const { asset, photo } = await createPexelsImageAsset('mina con excavadoras', {
      apiKey: 'k',
      sceneTitle: 'El mineral',
      fetchImpl: fetchMock as unknown as typeof fetch,
    });
    expect(photo.id).toBe(7);
    expect(asset.type).toBe('image');
    expect(asset.mimeType).toBe('image/jpeg');
    expect(asset.sizeBytes).toBe(3);
    expect(asset.name).toContain('pexels-el-mineral-7');
    expect(asset.provenance).toContain('Luis');
    expect(asset.license).toContain('Pexels License');
  });
});

describe('pexels: asignación a la escena', () => {
  it('asigna la imagen y añade el recurso a la biblioteca sin duplicarlo', () => {
    const asset = {
      id: 'img-1',
      name: 'foto.jpg',
      type: 'image' as const,
      url: 'blob:1',
      mimeType: 'image/jpeg',
      sizeBytes: 1,
      license: 'Pexels License',
      provenance: 'x',
      createdAt: 0,
    };
    const once = assignImageAssetToScene(baseProject(), 's1', asset);
    const twice = assignImageAssetToScene(once, 's1', asset);
    expect(twice.script.scenes[0].imageAssetId).toBe('img-1');
    expect(twice.script.scenes[0].imageUrl).toBe('blob:1');
    expect(twice.mediaAssets).toHaveLength(1);
  });
});
