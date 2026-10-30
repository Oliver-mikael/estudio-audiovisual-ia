// Automated Unit Tests for Core Audio & Script Engine
import { describe, it, expect } from 'vitest';
import { DEMO_PROJECT } from '../data/demoProject';

describe('Estudio Audiovisual Core Logic', () => {
  it('should calculate accurate project total duration from scenes', () => {
    const totalSecs = DEMO_PROJECT.script.scenes.reduce(
      (acc, scene) => acc + scene.durationSeconds,
      0
    );

    expect(totalSecs).toBe(80); // Chapter 1 (80 seconds)
  });

  it('should have non-empty narration text for demo scene', () => {
    DEMO_PROJECT.script.scenes.forEach((scene) => {
      expect(scene.narrationText.length).toBeGreaterThan(10);
      expect(scene.durationSeconds).toBeGreaterThan(0);
    });
  });

  it('should match the official documentary project title', () => {
    expect(DEMO_PROJECT.title).toBe(
      'La primera página web: el comienzo de algo que cambiaría el mundo'
    );
  });

  it('should validate 720p 30fps default settings', () => {
    expect(DEMO_PROJECT.settings.resolution.width).toBe(1280);
    expect(DEMO_PROJECT.settings.resolution.height).toBe(720);
    expect(DEMO_PROJECT.settings.fps).toBe(30);
  });
});
