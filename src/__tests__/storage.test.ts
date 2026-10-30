// Unit tests for Storage & Project State
import { describe, it, expect } from 'vitest';
import { DEMO_PROJECT } from '../data/demoProject';
import { Project } from '../types';

describe('Project Persistence Data Model & Validation', () => {
  it('should serialize and deserialize project state without data loss', () => {
    const serialized = JSON.stringify(DEMO_PROJECT);
    const parsed: Project = JSON.parse(serialized);

    expect(parsed.id).toBe(DEMO_PROJECT.id);
    expect(parsed.script.scenes.length).toBe(1);
    expect(parsed.sources.length).toBe(0); // Clean initial template
  });

  it('should properly link scenes with subtitles', () => {
    DEMO_PROJECT.script.scenes.forEach((scene) => {
      expect(scene.subtitles).toBeDefined();
      expect(scene.subtitles?.length).toBeGreaterThan(0);
    });
  });
});
