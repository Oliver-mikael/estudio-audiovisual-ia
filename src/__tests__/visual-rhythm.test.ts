import { describe, expect, it } from 'vitest';
import { hasAutoCuts, visualCutTimes, visualSlotAt } from '../engine/visualRhythm';
import { Scene } from '../types';

const scene = (overrides: Partial<Scene> = {}): Scene => ({
  id: 's',
  title: 'Escena',
  narrationText: '',
  visualIntent: '',
  cameraMotion: 'Static',
  transition: 'Cut',
  durationSeconds: 9,
  imageUrl: 'blob:primary',
  secondaryImageUrl: 'blob:secondary',
  ...overrides,
});

describe('ritmo visual', () => {
  it('alterna principal y secundaria cada 3 segundos en escenas largas', () => {
    const value = scene();
    expect(visualSlotAt(value, 0)).toBe('primary');
    expect(visualSlotAt(value, 2.99)).toBe('primary');
    expect(visualSlotAt(value, 3)).toBe('secondary');
    expect(visualSlotAt(value, 5.99)).toBe('secondary');
    expect(visualSlotAt(value, 6)).toBe('primary');
    expect(visualSlotAt(value, 8.9)).toBe('primary');
    expect(visualCutTimes(value)).toEqual([3, 6]);
  });

  it('no alterna en escenas de 4 segundos o menos', () => {
    const value = scene({ durationSeconds: 4 });
    expect(hasAutoCuts(value)).toBe(false);
    expect(visualSlotAt(value, 3.5)).toBe('primary');
    expect(visualCutTimes(value)).toEqual([]);
  });

  it('no alterna sin imagen secundaria', () => {
    const value = scene({ secondaryImageUrl: undefined, secondaryImageAssetId: undefined });
    expect(hasAutoCuts(value)).toBe(false);
    expect(visualSlotAt(value, 4)).toBe('primary');
  });

  it('respeta el interruptor por escena', () => {
    const value = scene({ autoCuts: false });
    expect(hasAutoCuts(value)).toBe(false);
    expect(visualSlotAt(value, 4)).toBe('primary');
    expect(visualSlotAt(scene({ autoCuts: true }), 4)).toBe('secondary');
  });

  it('acepta una secundaria referenciada por id de recurso', () => {
    const value = scene({ secondaryImageUrl: undefined, secondaryImageAssetId: 'img-2' });
    expect(hasAutoCuts(value)).toBe(true);
  });
});
