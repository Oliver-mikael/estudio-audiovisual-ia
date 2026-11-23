// Fase 28: catálogo de música libre incluida. Debe haber 5 categorías con al
// menos una pista cada una, rutas públicas y licencia CC0.
import { describe, expect, it } from 'vitest';
import { MUSIC_CATEGORIES, MUSIC_LIBRARY } from '../data/musicLibrary';

describe('biblioteca de música incluida', () => {
  it('incluye 10 pistas CC0 con identificadores únicos', () => {
    expect(MUSIC_LIBRARY).toHaveLength(10);
    const ids = new Set(MUSIC_LIBRARY.map((track) => track.id));
    expect(ids.size).toBe(MUSIC_LIBRARY.length);
    MUSIC_LIBRARY.forEach((track) => {
      expect(track.license).toBe('CC0 1.0');
      expect(track.url).toMatch(/^\/music\/[a-z0-9-]+\.mp3$/);
      expect(track.bpm).toBeGreaterThan(0);
      expect(track.durationSeconds).toBeGreaterThan(10);
    });
  });

  it('cubre las 5 categorías con al menos una pista cada una', () => {
    expect(MUSIC_CATEGORIES).toHaveLength(5);
    MUSIC_CATEGORIES.forEach((category) => {
      expect(MUSIC_LIBRARY.filter((track) => track.category === category).length).toBeGreaterThan(0);
    });
  });
});
