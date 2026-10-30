import { Project } from '../types';
import { DEMO_ASSETS } from './assets';

export const DEMO_PROJECT: Project = {
  id: 'demo-project-001',
  title: 'El Futuro de la Creación Audiovisual Local',
  description: 'Un micro-documental explicativo de 60 segundos sobre el procesamiento local, privacidad y autonomía creativa.',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  angles: [
    {
      id: 'ang-1',
      title: 'Soberanía Digital y Creación Local',
      hook: '¿Por qué depender de servidores de pago para crear tus videos?',
      perspective: 'Analiza la transición del software en la nube al paradigma local-first.',
      criticalQuestions: [
        '¿Es realmente necesario subir gigabytes a un servidor remoto?',
        '¿Cómo garantizamos la propiedad intelectual de nuestros guiones y recursos?'
      ],
      alternativeApproach: 'Demostrar mediante renderizado directo en el navegador cómo crear producciones profesionales de 60 segundos offline.'
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
      notes: 'Establece los 7 ideales del software local-first para retener el control de datos.',
      verified: true
    },
    {
      id: 'src-2',
      title: 'Web Media Specifications & W3C HTML Canvas Standard',
      url: 'https://www.w3.org/TR/html52/semantics-scripting.html',
      author: 'W3C',
      license: 'Public Domain',
      evidenceType: 'Fact',
      notes: 'Especificaciones estándar de renderizado en Canvas 2D y captura de MediaStream en navegadores modernos.',
      verified: true
    }
  ],
  script: {
    title: 'Guion: La Revolución del Estudio Local',
    summary: 'Micro-documental estructurado en 6 escenas continuas de 10 segundos cada una (60 segundos en total).',
    targetAudience: 'Investigadores, educadores y creadores audiovisuales independientes',
    tone: 'Divulgativo',
    scenes: [
      {
        id: 'scene-1',
        title: 'Escena 1: La Era de la Nube Concentrada',
        narrationText: 'Durante la última década, la creación de video dependía casi exclusivamente de gigantescos servidores en la nube.',
        visualIntent: 'Diagrama de centros de datos centralizados con flujo de datos masivo',
        cameraMotion: 'Zoom In',
        transition: 'Fade',
        durationSeconds: 10,
        imageUrl: DEMO_ASSETS.cloudServer,
        subtitles: [
          'Durante la última década,',
          'la creación de video dependía casi exclusivamente',
          'de gigantescos servidores en la nube.'
        ]
      },
      {
        id: 'scene-2',
        title: 'Escena 2: Latencia, Costes y Fuga de Datos',
        narrationText: 'Esta dependencia introdujo tarifas mensuales recurrentes, latencia de red y serios riesgos de privacidad.',
        visualIntent: 'Visualización de latencia de red y transferencia constante de gigabytes',
        cameraMotion: 'Pan Left',
        transition: 'Slide',
        durationSeconds: 10,
        imageUrl: DEMO_ASSETS.dataStream,
        subtitles: [
          'Esta dependencia introdujo tarifas mensuales recurrentes,',
          'latencia de red y serios riesgos',
          'de privacidad e intelectualidad.'
        ]
      },
      {
        id: 'scene-3',
        title: 'Escena 3: El Paradigma Local-First',
        narrationText: 'Pero los dispositivos modernos poseen GPU y NPU capaces de procesar gráficos y audio directamente en tu máquina.',
        visualIntent: 'Procesamiento de hardware local y soberanía de datos',
        cameraMotion: 'Zoom Out',
        transition: 'Cut',
        durationSeconds: 10,
        imageUrl: DEMO_ASSETS.localDevice,
        subtitles: [
          'Pero los dispositivos modernos poseen GPU y NPU',
          'capaces de procesar gráficos y audio',
          'directamente en tu propia máquina.'
        ]
      },
      {
        id: 'scene-4',
        title: 'Escena 4: El Motor Audiovisual Web',
        narrationText: 'Utilizando HTML5 Canvas y Web Audio API, es posible renderizar animaciones y subtítulos fotograma a fotograma.',
        visualIntent: 'Diagrama del motor de animación en tiempo real con Web Audio',
        cameraMotion: 'Pan Right',
        transition: 'Zoom',
        durationSeconds: 10,
        imageUrl: DEMO_ASSETS.canvasRender,
        subtitles: [
          'Utilizando HTML5 Canvas y Web Audio API,',
          'es posible renderizar animaciones y subtítulos',
          'fotograma a fotograma sin servidores.'
        ]
      },
      {
        id: 'scene-5',
        title: 'Escena 5: Autonomía Creativa Sin Costes',
        narrationText: 'Sin cuotas de suscripción, sin límites de renderizado y con retención total del material original.',
        visualIntent: 'Iconografía de coste cero y soberanía completa del creador',
        cameraMotion: 'Kinetic Text',
        transition: 'Fade',
        durationSeconds: 10,
        imageUrl: DEMO_ASSETS.zeroCosts,
        subtitles: [
          'Sin cuotas de suscripción,',
          'sin límites de renderizado',
          'y con retención total del material original.'
        ]
      },
      {
        id: 'scene-6',
        title: 'Escena 6: Conclusión y Futuro',
        narrationText: 'El Estudio Audiovisual Inteligente une investigación rigurosa, guion crítico y producción local bajo tu supervisión humana.',
        visualIntent: 'Cierre institucional con llamado a la creación autónoma',
        cameraMotion: 'Zoom In',
        transition: 'Slide',
        durationSeconds: 10,
        imageUrl: DEMO_ASSETS.conclusion,
        subtitles: [
          'El Estudio Audiovisual Inteligente une investigación,',
          'guion crítico y producción local',
          'siempre bajo tu supervisión humana.'
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
