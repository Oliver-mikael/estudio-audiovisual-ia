// Fase 30: plantillas de estilo. Cada plantilla debe cambiar al menos cuatro
// parámetros medibles del proyecto: tipografía, color, gancho, categoría de
// música, transición predeterminada y la transición de las escenas existentes.
import { describe, expect, it } from 'vitest';
import { createEmptyProject } from '../data/newProject';
import { STYLE_TEMPLATES, applyStyleTemplate } from '../data/styleTemplates';

function projectWithScenes() {
  const project = createEmptyProject('Plantillas');
  project.script.scenes = [
    {
      id: 's1',
      title: 'Uno',
      narrationText: '',
      visualIntent: '',
      cameraMotion: 'Static',
      transition: 'Cut',
      durationSeconds: 2,
    },
    {
      id: 's2',
      title: 'Dos',
      narrationText: '',
      visualIntent: '',
      cameraMotion: 'Static',
      transition: 'Cut',
      durationSeconds: 2,
    },
  ];
  return project;
}

describe('plantillas de estilo', () => {
  it('ofrece las cuatro plantillas pedidas con ajustes distintos', () => {
    expect(STYLE_TEMPLATES.map((template) => template.id)).toEqual([
      'youtube-educativo',
      'tiktok-viral',
      'corporativo',
      'cinematic',
    ]);
    expect(new Set(STYLE_TEMPLATES.map((t) => t.settings.subtitleFontFamily)).size).toBe(4);
    expect(new Set(STYLE_TEMPLATES.map((t) => t.settings.subtitleColor)).size).toBe(4);
    expect(new Set(STYLE_TEMPLATES.map((t) => t.settings.musicCategory)).size).toBe(4);
  });

  it.each(STYLE_TEMPLATES.map((template) => [template.name, template.id] as const))(
    '%s cambia al menos cuatro parámetros medibles',
    (_name, id) => {
      const before = projectWithScenes();
      const after = applyStyleTemplate(before, id);

      const changed = [
        before.settings.subtitleFontFamily !== after.settings.subtitleFontFamily,
        before.settings.subtitleColor !== after.settings.subtitleColor,
        before.settings.introHookEnabled !== after.settings.introHookEnabled,
        before.settings.musicCategory !== after.settings.musicCategory,
        before.settings.defaultTransition !== after.settings.defaultTransition,
        before.script.scenes[0].transition !== after.script.scenes[0].transition,
      ].filter(Boolean);

      expect(changed.length).toBeGreaterThanOrEqual(4);
      expect(after.script.scenes.every((scene) => scene.transition === after.settings.defaultTransition)).toBe(
        true
      );
    }
  );

  it('crea el proyecto ya configurado y no toca nada sin plantilla', () => {
    const created = createEmptyProject('Con plantilla', 'tiktok-viral');
    expect(created.settings.subtitleColor).toBe('#facc15');
    expect(created.settings.musicCategory).toBe('Motivacional');
    expect(created.settings.defaultTransition).toBe('Cut');

    const plain = createEmptyProject('Sin plantilla');
    expect(plain.settings.subtitleFontFamily).toBeUndefined();
    expect(plain.settings.subtitleColor).toBeUndefined();
    expect(plain.settings.defaultTransition).toBeUndefined();
  });
});
