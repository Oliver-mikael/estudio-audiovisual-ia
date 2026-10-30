// Unit tests for Exporter Logic & Audio Calculations
import { describe, it, expect } from 'vitest';
import { DEMO_PROJECT } from '../data/demoProject';

describe('VideoExporter Core Logic', () => {
  it('should accurately calculate total frame count for 30 FPS export', () => {
    const totalSecs = DEMO_PROJECT.script.scenes.reduce(
      (sum, s) => sum + s.durationSeconds,
      0
    );
    const fps = DEMO_PROJECT.settings.fps;
    const totalFrames = Math.ceil(totalSecs * fps);

    expect(totalSecs).toBe(10);
    expect(fps).toBe(30);
    expect(totalFrames).toBe(300); // 10s * 30fps = 300 frames
  });

  it('should verify resolution configuration for 720p', () => {
    expect(DEMO_PROJECT.settings.resolution.width).toBe(1280);
    expect(DEMO_PROJECT.settings.resolution.height).toBe(720);
  });
});
