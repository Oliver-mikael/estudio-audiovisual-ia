// Fase 27: gancho visual en la intro. Zoom 110 % → 100 % en 0,5 s, velo oscuro,
// visible solo los primeros 3 s y desactivable por proyecto.
import { describe, expect, it } from 'vitest';
import { createEmptyProject } from '../data/newProject';
import {
  INTRO_HOOK_SECONDS,
  introHookFrame,
  introHookText,
  isIntroHookEnabled,
} from '../engine/introHook';

function projectWithScene(title = 'El gancho de la intro') {
  const project = createEmptyProject('Gancho');
  project.script.scenes = [
    {
      id: 's1',
      title,
      narrationText: '',
      visualIntent: '',
      cameraMotion: 'Static',
      transition: 'Cut',
      durationSeconds: 5,
    },
    {
      id: 's2',
      title: 'Segunda escena',
      narrationText: '',
      visualIntent: '',
      cameraMotion: 'Static',
      transition: 'Cut',
      durationSeconds: 4,
    },
  ];
  return project;
}

describe('gancho de la intro', () => {
  it('usa el título de la primera escena si no hay texto configurado', () => {
    const project = projectWithScene();
    expect(introHookText(project)).toBe('El gancho de la intro');
  });

  it('el texto configurado tiene prioridad sobre el título', () => {
    const project = projectWithScene();
    project.settings.introHookText = '  Un gancho escrito a mano  ';
    expect(introHookText(project)).toBe('Un gancho escrito a mano');
  });

  it('hace zoom de 110 % a 100 % en los primeros 0,5 s', () => {
    const project = projectWithScene();
    expect(introHookFrame(project, 0)?.scale).toBeCloseTo(1.1, 2);
    expect(introHookFrame(project, 0.25)?.scale).toBeGreaterThan(1);
    expect(introHookFrame(project, 0.25)?.scale).toBeLessThan(1.1);
    expect(introHookFrame(project, 0.5)?.scale).toBeCloseTo(1, 3);
    expect(introHookFrame(project, 1.5)?.scale).toBeCloseTo(1, 3);
  });

  it('desaparece a los 3 segundos y oscurece el fondo', () => {
    const project = projectWithScene();
    const visible = introHookFrame(project, 1.5);
    expect(visible).not.toBeNull();
    expect(visible?.darken).toBeGreaterThan(0.2);
    expect(introHookFrame(project, INTRO_HOOK_SECONDS)).toBeNull();
    expect(introHookFrame(project, 4)).toBeNull();
  });

  it('se puede desactivar por proyecto', () => {
    const project = projectWithScene();
    expect(isIntroHookEnabled(project)).toBe(true);
    project.settings.introHookEnabled = false;
    expect(isIntroHookEnabled(project)).toBe(false);
    expect(introHookFrame(project, 1)).toBeNull();
  });

  it('no dibuja nada sin texto', () => {
    const project = projectWithScene('');
    expect(introHookText(project)).toBe('');
    expect(introHookFrame(project, 1)).toBeNull();
  });
});
