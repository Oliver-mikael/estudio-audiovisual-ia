// Transición Fundido: la opacidad de la escena entrante se interpola de 0 a 1
// durante los cuadros de la transición y desaparece fuera de ese rango.
import { describe, expect, it } from 'vitest';
import {
  computeTransitionFrame,
  fadeOpacity,
  transitionSecondsFor,
  DEFAULT_TRANSITION_SECONDS,
} from '../engine/renderEngine';
import { Project, Scene } from '../types';

const FPS = 30;

function makeScene(overrides: Partial<Scene>): Scene {
  return {
    id: 'scene',
    title: 'Escena',
    narrationText: 'Texto de la escena para la prueba de transición.',
    visualIntent: 'Prueba',
    cameraMotion: 'Static',
    transition: 'Fade',
    durationSeconds: 2,
    subtitles: ['Texto de la escena para la prueba de transición.'],
    ...overrides,
  };
}

function makeProject(scenes: Scene[]): Project {
  return {
    id: 'project-transitions',
    title: 'Transiciones',
    description: '',
    createdAt: 0,
    updatedAt: 0,
    angles: [],
    sources: [],
    mediaAssets: [],
    script: {
      title: 'Transiciones',
      summary: '',
      targetAudience: '',
      tone: 'Divulgativo',
      scenes,
    },
    settings: { fps: FPS, resolution: { width: 1280, height: 720 }, aspectRatio: '16:9' },
  };
}

// Escena 1: 2 s sin transición. Escena 2: 2 s con Fundido de 0,5 s.
const project = makeProject([
  makeScene({ id: 'a', title: 'Escena A', durationSeconds: 2, transition: 'Cut' }),
  makeScene({ id: 'b', title: 'Escena B', durationSeconds: 2, transition: 'Fade', transitionDurationSeconds: 0.5 }),
]);

describe('Transición Fundido', () => {
  it('interpola la opacidad de 0 a 1 en los cuadros de la transición', () => {
    // Del cuadro 60 (t = 2,0 s) al 74 (t = 2,466 s), dentro de los 0,5 s del fundido.
    const frames = Array.from({ length: 15 }, (_, index) => {
      const time = (60 + index) / FPS;
      const state = computeTransitionFrame(project, time);
      expect(state).not.toBeNull();
      expect(state!.previous?.scene.id).toBe('a');
      return { time, opacity: fadeOpacity(state!.progress) };
    });

    expect(frames[0].opacity).toBe(0);
    expect(frames[frames.length - 1].opacity).toBeCloseTo(14 / 15, 6);

    for (let index = 1; index < frames.length; index++) {
      expect(frames[index].opacity).toBeGreaterThan(frames[index - 1].opacity);
      expect(frames[index].opacity).toBeLessThan(1);
      expect(frames[index].opacity - frames[index - 1].opacity).toBeCloseTo(1 / 15, 6);
    }
  });

  it('sitúa la escena saliente en su tiempo correspondiente durante la mezcla', () => {
    const start = computeTransitionFrame(project, 2);
    const middle = computeTransitionFrame(project, 2.25);
    const end = computeTransitionFrame(project, 2.499);

    expect(start!.previousLocalTime).toBeCloseTo(1.5, 6);
    expect(middle!.previousLocalTime).toBeCloseTo(1.75, 6);
    expect(end!.previousLocalTime).toBeCloseTo(1.999, 3);
    expect(middle!.progress).toBeCloseTo(0.5, 6);
  });

  it('no mezcla escenas fuera del rango de la transición', () => {
    const beforeTransition = computeTransitionFrame(project, 1.2);
    const afterTransition = computeTransitionFrame(project, 2.6);
    const firstScene = computeTransitionFrame(project, 0.2);

    expect(beforeTransition!.previous).toBeNull();
    expect(beforeTransition!.current.scene.id).toBe('a');
    expect(afterTransition!.previous).toBeNull();
    expect(afterTransition!.progress).toBe(0);
    expect(firstScene!.previous).toBeNull();
  });

  it('usa 0,5 s por defecto y nunca ocupa más de la mitad de la escena', () => {
    expect(transitionSecondsFor(makeScene({ transition: 'Fade' }))).toBe(
      DEFAULT_TRANSITION_SECONDS
    );
    expect(transitionSecondsFor(makeScene({ transition: 'Cut', transitionDurationSeconds: 2 }))).toBe(0);
    expect(
      transitionSecondsFor(
        makeScene({ transition: 'Slide', durationSeconds: 0.6, transitionDurationSeconds: 3 })
      )
    ).toBeCloseTo(0.3, 6);
  });
});
