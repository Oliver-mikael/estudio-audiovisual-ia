// Fábrica de proyectos vacíos: cada proyecto nuevo empieza sin escenas,
// sin recursos y con los ajustes por defecto de exportación.
import { Project } from '../types';

export const DEFAULT_SETTINGS: Project['settings'] = {
  fps: 30,
  resolution: { width: 1280, height: 720 },
  aspectRatio: '16:9',
  musicVolume: 0.6,
};

export function createEmptyProject(title: string): Project {
  const now = Date.now();
  const cleanTitle = title.trim() || 'Proyecto sin título';

  return {
    id: `project-${now}-${Math.random().toString(36).slice(2, 8)}`,
    title: cleanTitle,
    description: '',
    createdAt: now,
    updatedAt: now,
    angles: [],
    sources: [],
    script: {
      title: `Guion: ${cleanTitle}`,
      summary: '',
      targetAudience: '',
      tone: 'Divulgativo',
      scenes: [],
    },
    mediaAssets: [],
    settings: {
      ...DEFAULT_SETTINGS,
      resolution: { ...DEFAULT_SETTINGS.resolution },
    },
  };
}
