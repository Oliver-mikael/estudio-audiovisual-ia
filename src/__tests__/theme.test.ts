import { describe, expect, it } from 'vitest';
import {
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
  isTheme,
  otherTheme,
  readStoredTheme,
  saveStoredTheme,
} from '../services/theme';

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
  };
}

describe('tema claro/oscuro (fase 38)', () => {
  it('arranca en oscuro cuando no hay nada guardado', () => {
    expect(DEFAULT_THEME).toBe('dark');
    expect(readStoredTheme(memoryStorage())).toBe('dark');
    expect(readStoredTheme(null)).toBe('dark');
  });

  it('lee el tema guardado y lo vuelve a guardar', () => {
    const storage = memoryStorage({ [THEME_STORAGE_KEY]: 'light' });
    expect(readStoredTheme(storage)).toBe('light');

    saveStoredTheme('dark', storage);
    expect(storage.data.get(THEME_STORAGE_KEY)).toBe('dark');
    expect(readStoredTheme(storage)).toBe('dark');
  });

  it('ignora valores que no son un tema válido', () => {
    expect(isTheme('light')).toBe(true);
    expect(isTheme('oscuro')).toBe(false);
    expect(readStoredTheme(memoryStorage({ [THEME_STORAGE_KEY]: 'auto' }))).toBe('dark');
  });

  it('alterna entre los dos temas', () => {
    expect(otherTheme('dark')).toBe('light');
    expect(otherTheme('light')).toBe('dark');
  });

  it('no falla si el almacenamiento está bloqueado', () => {
    const broken = {
      getItem: () => {
        throw new Error('bloqueado');
      },
      setItem: () => {
        throw new Error('bloqueado');
      },
    };
    expect(readStoredTheme(broken)).toBe('dark');
    expect(() => saveStoredTheme('light', broken)).not.toThrow();
  });
});
