// Tema claro/oscuro (fase 38).
//
// El tema se guarda en localStorage y se aplica con `data-theme` en el elemento
// raíz; las variables de color de `index.css` cambian a partir de ese atributo.
// Todo el acceso al almacenamiento está protegido: en modo privado o con el
// almacenamiento bloqueado, la aplicación sigue funcionando con el tema oscuro.

export type Theme = 'dark' | 'light';

export const THEME_STORAGE_KEY = 'estudio-tema';
export const DEFAULT_THEME: Theme = 'dark';

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function isTheme(value: unknown): value is Theme {
  return value === 'dark' || value === 'light';
}

function resolveStorage(storage?: StorageLike | null): StorageLike | null {
  if (storage !== undefined) return storage;
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

/** Tema guardado, o el oscuro si no hay nada válido guardado. */
export function readStoredTheme(storage?: StorageLike | null): Theme {
  try {
    const stored = resolveStorage(storage)?.getItem(THEME_STORAGE_KEY);
    return isTheme(stored) ? stored : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

/** Guarda el tema; si el navegador lo impide, el tema sigue activo en la sesión. */
export function saveStoredTheme(theme: Theme, storage?: StorageLike | null): void {
  try {
    resolveStorage(storage)?.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Sin cuota o con el almacenamiento bloqueado: no se pierde la sesión actual.
  }
}

/** Aplica el tema al documento (atributo `data-theme` y `color-scheme`). */
export function applyTheme(theme: Theme, root?: HTMLElement | null): void {
  const element = root ?? (typeof document === 'undefined' ? null : document.documentElement);
  if (!element) return;
  element.dataset.theme = theme;
  element.style.colorScheme = theme;
}

export function otherTheme(theme: Theme): Theme {
  return theme === 'dark' ? 'light' : 'dark';
}
