// Plantillas de estilo de video (fase 30).
//
// Cada plantilla configura de golpe la tipografía y el color de los subtítulos,
// el gancho de la intro, la categoría de música y la transición predeterminada.
// Al aplicarla sobre un proyecto con escenas también cambia la transición de
// entrada de cada escena, para que el cambio se vea sin editar una por una.

import { Project, Scene } from '../types';
import { MusicCategory } from './musicLibrary';

export type StyleTemplateId =
  | 'youtube-educativo'
  | 'tiktok-viral'
  | 'corporativo'
  | 'cinematic';

export interface StyleTemplate {
  id: StyleTemplateId;
  name: string;
  description: string;
  /** Resumen corto de los cinco parámetros que configura. */
  summary: string;
  settings: {
    subtitleFontFamily: string;
    subtitleColor: string;
    introHookEnabled: boolean;
    musicCategory: MusicCategory;
    defaultTransition: Scene['transition'];
  };
}

export const STYLE_TEMPLATES: StyleTemplate[] = [
  {
    id: 'youtube-educativo',
    name: 'YouTube Educativo',
    description: 'Subtítulos claros y grandes con fundidos suaves para explicar paso a paso.',
    summary: 'Sans legible · blanco · gancho sí · Tecnología · Fundido',
    settings: {
      subtitleFontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", sans-serif',
      subtitleColor: '#ffffff',
      introHookEnabled: true,
      musicCategory: 'Tecnología',
      defaultTransition: 'Fade',
    },
  },
  {
    id: 'tiktok-viral',
    name: 'TikTok Viral',
    description: 'Impacto inmediato: tipografía pesada, color amarillo y cortes secos.',
    summary: 'Arial Black · amarillo · gancho sí · Motivacional · Corte',
    settings: {
      subtitleFontFamily: '"Arial Black", Impact, "Helvetica Neue", sans-serif',
      subtitleColor: '#facc15',
      introHookEnabled: true,
      musicCategory: 'Motivacional',
      defaultTransition: 'Cut',
    },
  },
  {
    id: 'corporativo',
    name: 'Corporativo',
    description: 'Tono sobrio y profesional, sin gancho agresivo ni música de alta energía.',
    summary: 'Helvetica · gris claro · gancho no · Suave · Fundido',
    settings: {
      subtitleFontFamily: '"Helvetica Neue", Arial, Helvetica, sans-serif',
      subtitleColor: '#e2e8f0',
      introHookEnabled: false,
      musicCategory: 'Suave',
      defaultTransition: 'Fade',
    },
  },
  {
    id: 'cinematic',
    name: 'Cinematic',
    description: 'Tipografía serif, transiciones de zoom y música épica para un tono de cine.',
    summary: 'Georgia serif · crema · gancho sí · Épica · Zoom',
    settings: {
      subtitleFontFamily: 'Georgia, "Times New Roman", serif',
      subtitleColor: '#fef3c7',
      introHookEnabled: true,
      musicCategory: 'Épica',
      defaultTransition: 'Zoom',
    },
  },
];

export function findStyleTemplate(id?: string | null): StyleTemplate {
  return STYLE_TEMPLATES.find((template) => template.id === id) ?? STYLE_TEMPLATES[0];
}

/**
 * Aplica una plantilla al proyecto: ajustes globales y, si ya hay escenas, su
 * transición de entrada. Los demás datos (texto, imágenes, audio) no se tocan.
 */
export function applyStyleTemplate(
  project: Project,
  templateId?: string | null
): Project {
  if (!templateId) return project;
  const template = STYLE_TEMPLATES.find((item) => item.id === templateId);
  if (!template) return project;

  return {
    ...project,
    settings: {
      ...project.settings,
      subtitleFontFamily: template.settings.subtitleFontFamily,
      subtitleColor: template.settings.subtitleColor,
      introHookEnabled: template.settings.introHookEnabled,
      musicCategory: template.settings.musicCategory,
      defaultTransition: template.settings.defaultTransition,
    },
    script: {
      ...project.script,
      scenes: project.script.scenes.map((scene) => ({
        ...scene,
        transition: template.settings.defaultTransition,
      })),
    },
  };
}
