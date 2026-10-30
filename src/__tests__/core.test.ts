// Automated Unit Tests for Core Audio & Script Engine
import { describe, it, expect } from 'vitest';
import { DEMO_PROJECT } from '../data/demoProject';

describe('Estudio Audiovisual Core Logic', () => {
  it('should calculate accurate project total duration from scenes', () => {
    const totalSecs = DEMO_PROJECT.script.scenes.reduce(
      (acc, scene) => acc + scene.durationSeconds,
      0
    );

    expect(totalSecs).toBe(60); // 60s demo project
  });

  it('should have non-empty narration text and subtitles for all demo scenes', () => {
    DEMO_PROJECT.script.scenes.forEach((scene) => {
      expect(scene.narrationText.length).toBeGreaterThan(10);
      expect(scene.subtitles && scene.subtitles.length).toBeGreaterThan(0);
      expect(scene.durationSeconds).toBeGreaterThan(0);
    });
  });

  it('should contain valid verified sources in research matrix', () => {
    expect(DEMO_PROJECT.sources.length).toBeGreaterThan(0);
    const verifiedSource = DEMO_PROJECT.sources.find((s) => s.verified);
    expect(verifiedSource).toBeDefined();
    expect(verifiedSource?.license).toBe('CC-BY');
  });

  it('should validate 720p 30fps default settings', () => {
    expect(DEMO_PROJECT.settings.resolution.width).toBe(1280);
    expect(DEMO_PROJECT.settings.resolution.height).toBe(720);
    expect(DEMO_PROJECT.settings.fps).toBe(30);
  });
});
