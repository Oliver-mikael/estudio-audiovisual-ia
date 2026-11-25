// Onboarding para el primer uso (fase 41).
//
// La pantalla de bienvenida se muestra solo cuando no hay ningún proyecto
// guardado y el usuario no la ha visto antes. El «visto» se guarda en
// localStorage para que no vuelva a aparecer en la siguiente sesión.

export const ONBOARDING_STORAGE_KEY = 'estudio-onboarding-visto';
export const ONBOARDING_VERSION = 1;

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'claves',
    title: 'Configura tus claves de API',
    description:
      'En Ajustes puedes guardar las claves de Gemini, Google Cloud TTS, ElevenLabs y Pexels. Son opcionales: sin ellas el editor funciona con guiones manuales.',
  },
  {
    id: 'proyecto',
    title: 'Crea tu primer proyecto',
    description:
      'Ponle un nombre y elige una plantilla de estilo. Todo se guarda en este navegador, sin cuenta ni servidor.',
  },
  {
    id: 'guion',
    title: 'Genera el guion con IA',
    description:
      'Desde el Taller de guion puedes pedir un guion completo con Gemini o escribirlo escena a escena y exportarlo a WebM, MP4 o WAV.',
  },
];

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function resolveStorage(storage?: StorageLike | null): StorageLike | null {
  if (storage !== undefined) return storage;
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

/** ¿El usuario ya cerró la bienvenida en este navegador? */
export function hasSeenOnboarding(storage?: StorageLike | null): boolean {
  try {
    return resolveStorage(storage)?.getItem(ONBOARDING_STORAGE_KEY) === String(ONBOARDING_VERSION);
  } catch {
    return false;
  }
}

/** Marca la bienvenida como vista; si el almacenamiento falla, no hay error. */
export function markOnboardingSeen(storage?: StorageLike | null): void {
  try {
    resolveStorage(storage)?.setItem(ONBOARDING_STORAGE_KEY, String(ONBOARDING_VERSION));
  } catch {
    // Modo privado o almacenamiento bloqueado: solo afecta a esta sesión.
  }
}

export interface OnboardingVisibility {
  /** La lista de proyectos ya se leyó de IndexedDB. */
  projectsLoaded: boolean;
  projectCount: number;
  alreadySeen: boolean;
}

/**
 * La bienvenida solo aparece en el primer uso: sin proyectos guardados, sin
 * marca previa y con la lista de IndexedDB ya cargada (para no parpadear).
 */
export function shouldShowOnboarding({
  projectsLoaded,
  projectCount,
  alreadySeen,
}: OnboardingVisibility): boolean {
  return projectsLoaded && projectCount === 0 && !alreadySeen;
}
