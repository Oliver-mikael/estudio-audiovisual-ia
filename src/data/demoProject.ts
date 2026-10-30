import { Project } from '../types';

export const DEMO_PROJECT: Project = {
  id: 'demo-project-001',
  title: 'El Futuro de la Inteligencia Artificial Local',
  description: 'Un micro-documental explicativo sobre la importancia del procesamiento local y la privacidad.',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  angles: [
    {
      id: 'ang-1',
      title: 'Privacidad y Soberanía Digital',
      hook: '¿Por qué enviar todos tus pensamientos a un servidor centralizado?',
      perspective: 'Analiza el impacto del cómputo local frente a la nube en términos de privacidad personal y autonomía.',
      criticalQuestions: [
        '¿Es realmente más lento ejecutar modelos en local?',
        '¿Qué coste energético oculta la nube de IA?'
      ],
      alternativeApproach: 'Centrar la narrativa en un desarrollador que crea contenido sin conexión a internet.'
    }
  ],
  sources: [
    {
      id: 'src-1',
      title: 'Local First Software Architecture (Ink & Switch)',
      url: 'https://inkandswitch.com/local-first',
      author: 'Peter van Hardenberg et al.',
      license: 'CC-BY',
      evidenceType: 'Fact',
      notes: 'Establece los 7 ideales del software local-first.',
      verified: true
    }
  ],
  script: {
    title: 'Guion: IA en tu dispositivo',
    summary: 'Explicación concisa en 3 escenas del poder de procesar video y texto en local.',
    targetAudience: 'Creadores de contenido y entusiastas tecnológicos',
    tone: 'Divulgativo',
    scenes: [
      {
        id: 'scene-1',
        title: 'Escena 1: La Nube Concentrada',
        narrationText: 'Durante años nos dijeron que la inteligencia artificial solo podía existir en gigantescos centros de datos.',
        visualIntent: 'Fondo abstracto tecnológico con texto dinámico enfático',
        cameraMotion: 'Zoom In',
        transition: 'Fade',
        durationSeconds: 10,
        subtitles: [
          'Durante años nos dijeron',
          'que la inteligencia artificial',
          'solo podía existir en gigantescos centros de datos.'
        ]
      },
      {
        id: 'scene-2',
        title: 'Escena 2: La Revolución Local',
        narrationText: 'Pero la tecnología ha cambiado. Hoy es posible investigar, escribir y renderizar producciones completas en tu propia máquina.',
        visualIntent: 'Demostración de procesamiento local en tiempo real con cinética',
        cameraMotion: 'Pan Left',
        transition: 'Slide',
        durationSeconds: 10,
        subtitles: [
          'Pero la tecnología ha cambiado.',
          'Hoy es posible investigar, escribir y renderizar',
          'producciones completas en tu propia máquina.'
        ]
      },
      {
        id: 'scene-3',
        title: 'Escena 3: Control Total',
        narrationText: 'Sin suscripciones obligatorias, sin filtrar tus datos y con total autonomía creativa.',
        visualIntent: 'Cierre con llamado a la acción y tipografía cinética de alto contraste',
        cameraMotion: 'Zoom Out',
        transition: 'Fade',
        durationSeconds: 10,
        subtitles: [
          'Sin suscripciones obligatorias,',
          'sin filtrar tus datos',
          'y con total autonomía creativa.'
        ]
      }
    ]
  },
  mediaAssets: [],
  settings: {
    fps: 30,
    resolution: {
      width: 1280,
      height: 720
    },
    aspectRatio: '16:9'
  }
};
