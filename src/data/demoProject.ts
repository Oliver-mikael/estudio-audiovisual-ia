import { Project } from '../types';
import { DEMO_ASSETS } from './assets';

export const DEMO_PROJECT: Project = {
  id: 'doc-first-web-page-001',
  title: 'La primera página web: el comienzo de algo que cambiaría el mundo',
  description: 'Proyecto documental para investigar y producir la historia de Tim Berners-Lee, el CERN y la creación de la World Wide Web en 1989-1991.',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  angles: [
    {
      id: 'ang-cern-human',
      title: 'Enfoque Principal (A): El Problema de Información en el CERN',
      hook: '¿Por qué el centro científico más avanzado del mundo perdía el conocimiento de sus experimentos?',
      perspective: 'Conflicto humano e institucional en el CERN (1989) y la necesidad de conectar mentes sin jerarquías rígidas.',
      criticalQuestions: [
        '¿Cómo afectaba la rotación de contratos de científicos a la memoria de los experimentos?',
        '¿Por qué las carpetas jerárquicas tradicionales no servían para la ciencia del CERN?'
      ],
      alternativeApproach: 'Presentar la historia a través del desorden de sistemas incompatibles y la nota manuscrita "Vague but exciting...".'
    },
    {
      id: 'ang-cern-decision',
      title: 'Enfoque Secundario (C): La Decisión del Dominio Público (1993)',
      hook: 'El día en que la tecnología más valiosa del mundo fue regalada gratis a toda la humanidad.',
      perspective: 'La declaración histórica firmada por Walter Hoogland y Helmut Weber el 30 de abril de 1993.',
      criticalQuestions: [
        '¿Qué habría ocurrido si el CERN hubiera decidido cobrar regalías por cada enlace hipertextual?',
        '¿Cómo difería la Web abierta de redes cerradas como Minitel o AOL?'
      ],
      alternativeApproach: 'Construir el clímax documental sobre la firma legal del Dominio Público en 1993.'
    },
    {
      id: 'ang-cern-tech',
      title: 'Enfoque Integrado (B): La Arquitectura Simple (URL, HTTP, HTML)',
      hook: 'Las tres ideas simples que unificaron la informática mundial.',
      perspective: 'Análisis de la arquitectura informática minimalista que Tim Berners-Lee programó en su NeXTcube.',
      criticalQuestions: [
        '¿Por qué la extrema sencillez de HTML y HTTP permitió su adopción masiva frente a alternativas complejas?',
        '¿Qué rol jugó la función dual de navegador y editor en NeXTSTEP?'
      ],
      alternativeApproach: 'Explicación didáctica paso a paso de cómo un documento en Suiza fue leído por primera vez mediante la red.'
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
      notes: 'Documentación institucional de la propuesta de 1989, papel del servidor NeXTcube y los firmantes Walter Hoogland y Helmut Weber.',
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
      notes: 'Testimonio autobiográfico sobre la creación del programa ENQUIRE en 1980, la dualidad navegador/editor y la aceleración tras la tarifa de Gopher.',
      verified: true
    },
    {
      id: 'src-cern-legal',
      title: 'CERN Legal Declaration of April 30, 1993',
      url: 'https://firstwebsite.cern.ch/',
      author: 'Dirección General del CERN (W. Hoogland & H. Weber)',
      license: 'Public Domain',
      evidenceType: 'Fact',
      notes: 'Declaración legal firmada declarando el código de la World Wide Web en Dominio Público libre de regalías.',
      verified: true
    }
  ],
  script: {
    title: 'Guion: Capítulo 2 - Una idea que parecía demasiado ambiciosa',
    summary: 'Guion del Capítulo 2 estructurado en 5 escenas dinámicas (85 segundos totales) sobre ENQUIRE, la propuesta de 1989, Mike Sendall, Robert Cailliau y la transición técnica.',
    targetAudience: 'Audiencia general e interesados en historia de la tecnología',
    tone: 'Divulgativo',
    scenes: [
      {
        id: 'c2-scene-1',
        title: 'Escena 1: El antecedente — ENQUIRE (1980)',
        narrationText: 'Nueve años antes, en 1980, durante su primera estancia como consultor en el CERN, Tim Berners-Lee escribió un pequeño programa privado llamado ENQUIRE. No era una red de ordenadores ni tenía gráficos, sino un sistema personal para recordar las conexiones entre personas, proyectos y programas en el laboratorio.',
        visualIntent: 'Esquema gráfico de tarjetas de notas interconectadas por enlaces asociativos',
        cameraMotion: 'Zoom In',
        transition: 'Fade',
        durationSeconds: 16,
        imageUrl: DEMO_ASSETS.cloudServer,
        subtitles: [
          'En 1980, Berners-Lee escribió ENQUIRE:',
          'un sistema personal para recordar conexiones',
          'entre proyectos y personas en el CERN.'
        ]
      },
      {
        id: 'c2-scene-2',
        title: 'Escena 2: La propuesta de marzo de 1989',
        narrationText: 'Al regresar al CERN con un contrato de tres años, Berners-Lee comprendió que el hipertexto debía combinarse con Internet. En marzo de 1989 redactó "Information Management: A Proposal", planteando una malla de datos donde los documentos pudieran vincularse sin importar en qué servidor estuvieran guardados.',
        visualIntent: 'Fotografía histórica del documento impreso original con el diagrama de malla',
        cameraMotion: 'Pan Left',
        transition: 'Cut',
        durationSeconds: 18,
        imageUrl: DEMO_ASSETS.dataStream,
        subtitles: [
          'En marzo de 1989 redactó "Information Management: A Proposal"',
          'planteando una malla de datos donde los documentos pudieran vincularse',
          'sin importar el servidor donde estuvieran guardados.'
        ]
      },
      {
        id: 'c2-scene-3',
        title: 'Escena 3: "Vague but exciting..."',
        narrationText: 'El documento llegó a manos de su supervisor, Mike Sendall. Aunque el proyecto no encajaba en ninguna línea oficial de investigación en física de partículas, Sendall no lo rechazó. Escribió en la portada un comentario célebre: "Vague but exciting..." — Vago pero emocionante.',
        visualIntent: 'Plano de detalle manuscrito con la anotación en lápiz de Mike Sendall',
        cameraMotion: 'Zoom In',
        transition: 'Slide',
        durationSeconds: 17,
        imageUrl: DEMO_ASSETS.localDevice,
        subtitles: [
          'Su supervisor Mike Sendall no lo rechazó.',
          'Escribió en la portada el célebre comentario:',
          '"Vague but exciting..." (Vago pero emocionante).'
        ]
      },
      {
        id: 'c2-scene-4',
        title: 'Escena 4: El aliado clave — Robert Cailliau',
        narrationText: 'Ninguna revolución tecnológica ocurre en solitario. En 1990, el ingeniero belga Robert Cailliau se convirtió en el principal aliado de la propuesta. Juntos reescribieron el proyecto para conseguir presupuesto y convencer a la dirección de que el hipertexto transformaría el laboratorio.',
        visualIntent: 'Fotografía histórica de archivo de Tim Berners-Lee y Robert Cailliau en el CERN',
        cameraMotion: 'Pan Right',
        transition: 'Zoom',
        durationSeconds: 18,
        imageUrl: DEMO_ASSETS.canvasRender,
        subtitles: [
          'El ingeniero belga Robert Cailliau se convirtió en su aliado clave.',
          'Juntos reescribieron el proyecto para obtener presupuesto',
          'e impulso institucional en el CERN.'
        ]
      },
      {
        id: 'c2-scene-5',
        title: 'Escena 5: La transición técnica',
        narrationText: 'Pero una propuesta en papel no hace funcionar una red. Para convertir esta idea abstracta en realidad, era necesario inventar un código de marcado, un protocolo de comunicación y construir el primer servidor en un ordenador de última generación.',
        visualIntent: 'Composición gráfica pasando del documento impreso a líneas de código y servidor',
        cameraMotion: 'Kinetic Text',
        transition: 'Fade',
        durationSeconds: 16,
        imageUrl: DEMO_ASSETS.conclusion,
        subtitles: [
          'Para convertir la propuesta abstracta en realidad,',
          'hacían falta tres estándares técnicos',
          'y el primer servidor web de la historia.'
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
