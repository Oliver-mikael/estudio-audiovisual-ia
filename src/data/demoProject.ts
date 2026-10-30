import { Project } from '../types';

export const DEMO_PROJECT: Project = {
  id: 'doc-first-web-page-001',
  title: 'La primera página web: el comienzo de algo que cambiaría el mundo',
  description: 'Proyecto documental para investigar y producir la historia de Tim Berners-Lee, el CERN y la creación de la World Wide Web en 1989-1991.',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  angles: [
    {
      id: 'ang-cern-human',
      title: 'Enfoque A: El Dilema del Científico y la Malla Olvidada',
      hook: '¿Por qué se perdía el trabajo de miles de científicos en el laboratorio informático más grande de Europa?',
      perspective: 'Conflicto humano e institucional en el CERN (1989) y la necesidad de conectar mentes sin jerarquías rígidas.',
      criticalQuestions: [
        '¿Cómo afectaba la rotación de contratos de científicos a la memoria de los experimentos?',
        '¿Por qué las carpetas jerárquicas tradicionales no servían para la ciencia del CERN?'
      ],
      alternativeApproach: 'Presentar la historia a través del desorden de sistemas incompatibles y la nota manuscrita "Vague but exciting...".'
    },
    {
      id: 'ang-cern-tech',
      title: 'Enfoque B: Los Tres Pilares de la Red Abierta',
      hook: 'Las tres ideas simples (URL, HTTP y HTML) que unificaron la informática mundial.',
      perspective: 'Análisis de la arquitectura informática minimalista que Tim Berners-Lee programó en su NeXTcube.',
      criticalQuestions: [
        '¿Por qué la extrema sencillez de HTML y HTTP permitió su adopción masiva frente a alternativas complejas?',
        '¿Qué rol jugó la estación NeXTcube de Steve Jobs en el desarrollo inicial?'
      ],
      alternativeApproach: 'Explicación didáctica paso a paso de cómo un documento en Suiza fue leído por primera vez mediante la red.'
    },
    {
      id: 'ang-cern-decision',
      title: 'Enfoque C: La Decisión de $0 Trillones',
      hook: 'El día en que la tecnología más valiosa del mundo fue regalada gratis a toda la humanidad.',
      perspective: 'La declaración histórica del CERN del 30 de abril de 1993 liberando la WWW al Dominio Público (Royalty-Free).',
      criticalQuestions: [
        '¿Qué habría ocurrido si el CERN hubiera decidido cobrar regalías por cada enlace hipertextual?',
        '¿Cómo difería la Web abierta de las redes propietarias de pago como Minitel o AOL?'
      ],
      alternativeApproach: 'Construir el clímax documental sobre la firma legal del Dominio Público en 1993.'
    }
  ],
  sources: [
    {
      id: 'src-cern-arch',
      title: 'CERN Official Archive: The birth of the Web',
      url: 'https://home.cern/science/computing/birth-web',
      author: 'CERN (European Organization for Nuclear Research)',
      license: 'Public Domain',
      evidenceType: 'Fact',
      notes: 'Documentación institucional de la propuesta de 1989, papel del servidor NeXTcube y la nota de Mike Sendall "Vague but exciting...".',
      verified: true
    },
    {
      id: 'src-w3c-prop',
      title: 'W3C History: Information Management - A Proposal (1989)',
      url: 'https://www.w3.org/History/1989/Proposal.html',
      author: 'Tim Berners-Lee / W3C',
      license: 'Public Domain',
      evidenceType: 'Fact',
      notes: 'Documento primario original de marzo de 1989 que describe la arquitectura de la malla hipertextual.',
      verified: true
    },
    {
      id: 'src-tbl-book',
      title: 'Weaving the Web: The Original Design and Ultimate Destiny',
      author: 'Tim Berners-Lee y Mark Fischetti',
      license: 'Fair Use',
      evidenceType: 'Interpretation',
      notes: 'Testimonio autobiográfico sobre la creación del programa ENQUIRE en 1980, el desarrollo en NeXTSTEP y la filosofía open source.',
      verified: true
    },
    {
      id: 'src-cern-legal',
      title: 'CERN Legal Declaration of April 30, 1993',
      url: 'https://firstwebsite.cern.ch/',
      author: 'Dirección General del CERN',
      license: 'Public Domain',
      evidenceType: 'Fact',
      notes: 'Declaración legal firmada por el CERN declarando el código de la World Wide Web en Dominio Público libre de regalías.',
      verified: true
    }
  ],
  script: {
    title: 'Guion: La primera página web',
    summary: 'Esperando la aprobación del usuario sobre el enfoque narrativo (Enfoque A + Enfoque C recomendado).',
    targetAudience: 'Audiencia general e interesados en historia de la tecnología',
    tone: 'Divulgativo',
    scenes: [
      {
        id: 'scene-init-1',
        title: 'Escena Inicial: El Caos de Información en el CERN (1989)',
        narrationText: 'Investigación editorial en progreso. Esperando aprobación del enfoque narrativo por el usuario antes de redactar el guion definitivo.',
        visualIntent: 'Fotografía o recreación del CERN en 1989 con el ordenador NeXTcube',
        cameraMotion: 'Zoom In',
        transition: 'Fade',
        durationSeconds: 10,
        subtitles: [
          'Investigación editorial completada en docs/RESEARCH_FIRST_WEBSITE.md.',
          'Esperando aprobación del enfoque narrativo para escribir el guion definitivo.'
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
