// Catálogo de música libre incluida en la app.
//
// Las 10 pistas se generan con `scripts/generate-music.mjs` (síntesis propia) y
// se publican como CC0 1.0: no hay samples de terceros ni atribución requerida.
// El usuario puede escucharlas antes de asignarlas y la elegida se guarda como
// recurso de audio del proyecto, igual que un MP3 importado.

export type MusicCategory = 'Épica' | 'Suave' | 'Tecnología' | 'Misterio' | 'Motivacional';

export interface MusicLibraryTrack {
  id: string;
  title: string;
  category: MusicCategory;
  description: string;
  /** Ruta pública del MP3 incluido en `public/music`. */
  url: string;
  bpm: number;
  durationSeconds: number;
  license: 'CC0 1.0';
}

export const MUSIC_CATEGORIES: MusicCategory[] = [
  'Épica',
  'Suave',
  'Tecnología',
  'Misterio',
  'Motivacional',
];

/** true si el texto guardado en los ajustes es una categoría válida. */
export function isMusicCategory(value: unknown): value is MusicCategory {
  return typeof value === 'string' && (MUSIC_CATEGORIES as string[]).includes(value);
}

const TRACK_SECONDS = 16;

export const MUSIC_LIBRARY: MusicLibraryTrack[] = [
  {
    id: 'epica-amanecer',
    title: 'Amanecer heroico',
    category: 'Épica',
    description: 'Acordes amplios y tambor lento para una apertura de gran escala.',
    url: '/music/epica-amanecer.mp3',
    bpm: 96,
    durationSeconds: TRACK_SECONDS,
    license: 'CC0 1.0',
  },
  {
    id: 'epica-marcha',
    title: 'Marcha del horizonte',
    category: 'Épica',
    description: 'Pulso marcial y melodía ascendente para momentos de avance.',
    url: '/music/epica-marcha.mp3',
    bpm: 110,
    durationSeconds: TRACK_SECONDS,
    license: 'CC0 1.0',
  },
  {
    id: 'suave-brisa',
    title: 'Brisa de piano',
    category: 'Suave',
    description: 'Arpegios cálidos y pad suave para explicaciones pausadas.',
    url: '/music/suave-brisa.mp3',
    bpm: 72,
    durationSeconds: TRACK_SECONDS,
    license: 'CC0 1.0',
  },
  {
    id: 'suave-nubes',
    title: 'Nubes lentas',
    category: 'Suave',
    description: 'Textura ambiental sin percusión, ideal bajo la voz.',
    url: '/music/suave-nubes.mp3',
    bpm: 64,
    durationSeconds: TRACK_SECONDS,
    license: 'CC0 1.0',
  },
  {
    id: 'tecnologia-circuito',
    title: 'Circuito nocturno',
    category: 'Tecnología',
    description: 'Arpegio de dieciseisavos y pulsos cortos de sintetizador.',
    url: '/music/tecnologia-circuito.mp3',
    bpm: 120,
    durationSeconds: TRACK_SECONDS,
    license: 'CC0 1.0',
  },
  {
    id: 'tecnologia-datos',
    title: 'Datos en órbita',
    category: 'Tecnología',
    description: 'Secuencia repetitiva y brillante para temas de producto o IA.',
    url: '/music/tecnologia-datos.mp3',
    bpm: 104,
    durationSeconds: TRACK_SECONDS,
    license: 'CC0 1.0',
  },
  {
    id: 'misterio-sombra',
    title: 'Sombra en el pasillo',
    category: 'Misterio',
    description: 'Drones graves y notas espaciadas para crear tensión.',
    url: '/music/misterio-sombra.mp3',
    bpm: 68,
    durationSeconds: TRACK_SECONDS,
    license: 'CC0 1.0',
  },
  {
    id: 'misterio-eco',
    title: 'Eco sin respuesta',
    category: 'Misterio',
    description: 'Intervalos ambiguos y silencios largos, sin percusión marcada.',
    url: '/music/misterio-eco.mp3',
    bpm: 60,
    durationSeconds: TRACK_SECONDS,
    license: 'CC0 1.0',
  },
  {
    id: 'motivacional-paso',
    title: 'Paso firme',
    category: 'Motivacional',
    description: 'Ritmo constante y acordes mayores para cerrar con energía.',
    url: '/music/motivacional-paso.mp3',
    bpm: 112,
    durationSeconds: TRACK_SECONDS,
    license: 'CC0 1.0',
  },
  {
    id: 'motivacional-luz',
    title: 'Luz al frente',
    category: 'Motivacional',
    description: 'Melodía optimista en crescendo para llamadas a la acción.',
    url: '/music/motivacional-luz.mp3',
    bpm: 100,
    durationSeconds: TRACK_SECONDS,
    license: 'CC0 1.0',
  },
];
