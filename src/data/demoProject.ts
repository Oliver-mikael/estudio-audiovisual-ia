import { Project } from '../types';

export const DEMO_PROJECT: Project = {
  id: 'doc-first-web-page-001',
  title: 'La primera página web: el comienzo de algo que cambiaría el mundo',
  description: 'Proyecto documental para investigar y producir la historia de Tim Berners-Lee, el CERN y la creación de la World Wide Web en 1989-1991.',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  angles: [], // Ready for research & ideation approval
  sources: [], // Ready for verified evidence sources
  script: {
    title: 'Guion: La primera página web',
    summary: 'Estructura preparada para recibir el guion investigado y aprobado.',
    targetAudience: 'Audiencia general e interesados en historia de la tecnología',
    tone: 'Divulgativo',
    scenes: [
      {
        id: 'scene-init-1',
        title: 'Escena 1: Introducción al CERN (1989)',
        narrationText: 'Espacio preparado para la primera escena del documental. Introduce el contexto histórico en el CERN.',
        visualIntent: 'Fotografía o recreación histórica del computador NeXT de Tim Berners-Lee',
        cameraMotion: 'Zoom In',
        transition: 'Fade',
        durationSeconds: 10,
        subtitles: [
          'La primera página web: el comienzo de algo que cambiaría el mundo.',
          'Esperando aprobación de investigación y guion...'
        ]
      }
    ]
  },
  mediaAssets: [], // Ready for uploaded media resources
  settings: {
    fps: 30,
    resolution: {
      width: 1280,
      height: 720
    },
    aspectRatio: '16:9'
  }
};
