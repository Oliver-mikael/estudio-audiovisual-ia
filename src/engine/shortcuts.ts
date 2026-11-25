// Atajos de teclado globales (fase 39).
//
// La lógica de qué tecla produce qué acción vive aquí, separada del componente,
// para poder probarla sin DOM. El espacio no se captura cuando se está
// escribiendo en un campo de texto.

export type ShortcutAction = 'play-pause' | 'export' | 'undo' | 'redo' | 'escape';

/** Evento que escucha el Monitor para reproducir o pausar la vista previa. */
export const PLAY_PAUSE_EVENT = 'estudio:alternar-reproduccion';

export interface KeyboardLike {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
}

/** true si el foco está en un elemento donde escribir (ahí el espacio es texto). */
export function isTypingTarget(target: EventTarget | null): boolean {
  const element = target as (HTMLElement & { tagName?: string }) | null;
  if (!element || typeof element.tagName !== 'string') return false;
  const tag = element.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
  return element.isContentEditable === true;
}

/**
 * Acción del atajo, o null si la pulsación no es ninguno de los atajos.
 * Ctrl y Cmd se tratan igual para que funcione en macOS.
 */
export function matchShortcut(
  event: KeyboardLike,
  target: EventTarget | null = null
): ShortcutAction | null {
  if (event.altKey) return null;

  if (event.key === 'Escape') return 'escape';

  const command = Boolean(event.ctrlKey || event.metaKey);
  if (command) {
    const key = event.key.toLowerCase();
    if (key === 'e' && !event.shiftKey) return 'export';
    if (key === 'z') return event.shiftKey ? 'redo' : 'undo';
    if (key === 'y' && !event.shiftKey) return 'redo';
    return null;
  }

  if ((event.key === ' ' || event.key === 'Spacebar') && !isTypingTarget(target)) {
    return 'play-pause';
  }

  return null;
}
