import { describe, expect, it } from 'vitest';
import {
  ONBOARDING_STORAGE_KEY,
  ONBOARDING_STEPS,
  hasSeenOnboarding,
  markOnboardingSeen,
  shouldShowOnboarding,
} from '../services/onboarding';

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

describe('onboarding del primer uso (fase 41)', () => {
  it('muestra los tres pasos pedidos', () => {
    expect(ONBOARDING_STEPS).toHaveLength(3);
    expect(ONBOARDING_STEPS.map((step) => step.id)).toEqual(['claves', 'proyecto', 'guion']);
  });

  it('aparece en un navegador nuevo sin proyectos', () => {
    expect(hasSeenOnboarding(memoryStorage())).toBe(false);
    expect(
      shouldShowOnboarding({ projectsLoaded: true, projectCount: 0, alreadySeen: false })
    ).toBe(true);
  });

  it('no aparece si ya hay proyectos guardados', () => {
    expect(
      shouldShowOnboarding({ projectsLoaded: true, projectCount: 1, alreadySeen: false })
    ).toBe(false);
  });

  it('no aparece antes de terminar de leer IndexedDB ni si ya se vio', () => {
    expect(
      shouldShowOnboarding({ projectsLoaded: false, projectCount: 0, alreadySeen: false })
    ).toBe(false);
    expect(
      shouldShowOnboarding({ projectsLoaded: true, projectCount: 0, alreadySeen: true })
    ).toBe(false);
  });

  it('persiste que la bienvenida ya se mostró', () => {
    const storage = memoryStorage();
    markOnboardingSeen(storage);
    expect(storage.data.get(ONBOARDING_STORAGE_KEY)).toBe('1');
    expect(hasSeenOnboarding(storage)).toBe(true);
  });

  it('no falla si localStorage está bloqueado', () => {
    const broken = {
      getItem: () => {
        throw new Error('bloqueado');
      },
      setItem: () => {
        throw new Error('bloqueado');
      },
    };
    expect(hasSeenOnboarding(broken)).toBe(false);
    expect(() => markOnboardingSeen(broken)).not.toThrow();
  });
});
