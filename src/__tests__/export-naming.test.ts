// Nombre del archivo exportado: ASCII, sin caracteres inválidos y con la
// resolución y la extensión reales.
import { describe, expect, it } from 'vitest';
import { buildExportFileName, extensionForMimeType } from '../engine/exporter';
import { createEmptyProject } from '../data/newProject';
import { Project } from '../types';

function projectWithTitle(title: string, width = 1280, height = 720): Project {
  const project = createEmptyProject(title);
  project.title = title;
  project.settings.resolution = { width, height };
  return project;
}

describe('buildExportFileName', () => {
  it('elimina acentos, espacios, dos puntos y guiones raros del título', () => {
    const name = buildExportFileName(
      projectWithTitle('Ñandú: año 2026 — versión final (v2)'),
      'webm'
    );

    expect(name).toBe('nandu-ano-2026-version-final-v2-720p.webm');
    expect(name).toMatch(/^[a-z0-9-]+\.webm$/);
    expect(name).not.toMatch(/[áéíóúñÁÉÍÓÚÑ:\s()—]/);
  });

  it('usa la altura real del proyecto y la extensión pedida', () => {
    expect(buildExportFileName(projectWithTitle('Prueba', 1920, 1080), 'webm')).toBe(
      'prueba-1080p.webm'
    );
    expect(buildExportFileName(projectWithTitle('Prueba', 854, 480), 'mp4')).toBe(
      'prueba-480p.mp4'
    );
  });

  it('cae en un nombre por defecto cuando el título no deja caracteres válidos', () => {
    expect(buildExportFileName(projectWithTitle('¿¡...!?'), 'webm')).toBe('video-720p.webm');
    expect(buildExportFileName(projectWithTitle('   '), 'webm')).toBe('video-720p.webm');
  });

  it('deriva la extensión del MIME real del blob', () => {
    expect(extensionForMimeType('video/webm')).toBe('webm');
    expect(extensionForMimeType('video/mp4')).toBe('mp4');
  });
});
