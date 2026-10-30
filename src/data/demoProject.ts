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
    title: 'Guion: Capítulo 1 - El problema invisible',
    summary: 'Guion del Capítulo 1 estructurado en 5 escenas dinámicas (80 segundos totales).',
    targetAudience: 'Audiencia general e interesados en historia de la tecnología',
    tone: 'Divulgativo',
    scenes: [
      {
        id: 'c1-scene-1',
        title: 'Escena 1: La paradoja del CERN',
        narrationText: 'Ginebra, 1989. Miles de los mejores físicos e ingenieros del planeta trabajan en el CERN para desentrañar los secretos del universo. Sin embargo, dentro de los pasillos del laboratorio, existe un obstáculo silencioso: los ordenadores no se entienden entre sí.',
        visualIntent: 'Fotografía de archivo histórico del CERN a finales de los años 80',
        cameraMotion: 'Zoom Out',
        transition: 'Fade',
        durationSeconds: 15,
        imageUrl: DEMO_ASSETS.cloudServer,
        subtitles: [
          'Ginebra, 1989. Miles de los mejores físicos del planeta',
          'trabajan en el CERN para desentrañar el universo.',
          'Sin embargo, los ordenadores no se entienden entre sí.'
        ]
      },
      {
        id: 'c1-scene-2',
        title: 'Escena 2: La torre de Babel informática',
        narrationText: 'Cada equipo utiliza sistemas totalmente incompatibles. Archivos guardados en ordenadores VMS no pueden abrirse en máquinas Unix; los documentos de Apple Mac son ilegibles para los terminales MS-DOS. Para consultar un dato, un investigador debe aprender un programa diferente en cada máquina.',
        visualIntent: 'Diagrama gráfico vectorial de terminales incompatibles (VMS, Unix, Mac, MS-DOS)',
        cameraMotion: 'Pan Left',
        transition: 'Slide',
        durationSeconds: 18,
        imageUrl: DEMO_ASSETS.dataStream,
        subtitles: [
          'Cada equipo utiliza sistemas incompatibles.',
          'Archivos de VMS no abren en Unix; Mac es ilegible en MS-DOS.',
          'Para cada máquina, se requiere un programa distinto.'
        ]
      },
      {
        id: 'c1-scene-3',
        title: 'Escena 3: La fragmentación del conocimiento',
        narrationText: 'A esto se suma un problema humano: los científicos llegan al CERN con contratos temporales de dos o tres años. Cuando regresan a sus países, el conocimiento de cómo construyeron un programa o un detector se queda atrapado en documentos inaccesibles.',
        visualIntent: 'Fotografía de archivo de científicos e ingenieros en la sala de control del CERN',
        cameraMotion: 'Zoom In',
        transition: 'Cut',
        durationSeconds: 15,
        imageUrl: DEMO_ASSETS.localDevice,
        subtitles: [
          'Los científicos llegan con contratos de dos o tres años.',
          'Al regresar a sus países, el conocimiento sobre sus proyectos',
          'se queda atrapado en documentos inaccesibles.'
        ]
      },
      {
        id: 'c1-scene-4',
        title: 'Escena 4: El concepto de la red asociativa',
        narrationText: 'Las carpetas de archivos tradicionales obligaban a organizar todo en estructuras rígidas de árbol. Pero el cerebro humano no piensa de forma jerárquica: piensa por asociación. Para conectar ideas dispersas, hacía falta una red que no dependiera de ningún ordenador central.',
        visualIntent: 'Animación gráfica comparando estructura jerárquica rígida vs malla asociativa flexible',
        cameraMotion: 'Kinetic Text',
        transition: 'Zoom',
        durationSeconds: 17,
        imageUrl: DEMO_ASSETS.canvasRender,
        subtitles: [
          'Las carpetas tradicionales obligaban a usar árboles rígidos.',
          'Pero el cerebro humano piensa por asociación.',
          'Hacía falta una red sin ordenador central.'
        ]
      },
      {
        id: 'c1-scene-5',
        title: 'Escena 5: Transición hacia el Capítulo 2',
        narrationText: 'En marzo de 1989, un programador británico de 33 años decide poner por escrito una solución a este caos. Un documento de apenas unas páginas que cambiaría la historia... si alguien se tomaba el tiempo de leerlo.',
        visualIntent: 'Fotografía histórica de la portada de "Information Management: A Proposal"',
        cameraMotion: 'Zoom In',
        transition: 'Fade',
        durationSeconds: 15,
        imageUrl: DEMO_ASSETS.conclusion,
        subtitles: [
          'En marzo de 1989, un programador británico de 33 años',
          'decide poner por escrito una solución a este caos.',
          'Un documento que cambiaría la historia... si alguien lo leía.'
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
