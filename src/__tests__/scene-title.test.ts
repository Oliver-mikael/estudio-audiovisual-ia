// Fase 32: título animado en la primera escena. Desliza desde abajo en 0,4 s,
// vive solo en el tercio inferior del primer cuadro y es independiente del gancho.
import { describe, expect, it } from 'vitest';
import { createEmptyProject } from '../data/newProject';
import {
  SCENE_TITLE_SECONDS,
  SCENE_TITLE_SLIDE_DISTANCE_PX,
  SCENE_TITLE_SLIDE_SECONDS,
  sceneTitleFrame,
} from '../engine/sceneTitle';

function projectWithScenes(title = 'Mi proyecto animado') {
  const project = createEmptyProject(title);
  project.settings.introHookEnabled = false;
  project.script.scenes = [
    {
      id: 's1',
      title: 'Primera',
      narrationText: '',
      visualIntent: '',
      cameraMotion: 'Static',
      transition: 'Cut',
      durationSeconds: 6,
    },
    {
      id: 's2',
      title: 'Segunda',
      narrationText: '',
      visualIntent: '',
      cameraMotion: 'Static',
      transition: 'Cut',
      durationSeconds: 4,
    },
  ];
  return project;
}

describe('título animado de la primera escena', () => {
  it('desliza desde 60 px por debajo hasta su posición en 0,4 s', () => {
    const project = projectWithScenes();
    const scene = project.script.scenes[0];
    expect(sceneTitleFrame(project, scene, 0)?.translateY).toBeCloseTo(
      SCENE_TITLE_SLIDE_DISTANCE_PX,
      3
    );
    const middle = sceneTitleFrame(project, scene, 0.2)?.translateY ?? 0;
    expect(middle).toBeGreaterThan(0);
    expect(middle).toBeLessThan(SCENE_TITLE_SLIDE_DISTANCE_PX);
    expect(sceneTitleFrame(project, scene, SCENE_TITLE_SLIDE_SECONDS)?.translateY).toBeCloseTo(0, 3);
    expect(sceneTitleFrame(project, scene, 1.5)?.translateY).toBeCloseTo(0, 3);
  });

  it('usa el título del proyecto y desaparece a los 4 s', () => {
    const project = projectWithScenes();
    const scene = project.script.scenes[0];
    expect(sceneTitleFrame(project, scene, 0.5)?.text).toBe('Mi proyecto animado');
    expect(sceneTitleFrame(project, scene, SCENE_TITLE_SECONDS - 0.05)).not.toBeNull();
    expect(sceneTitleFrame(project, scene, SCENE_TITLE_SECONDS)).toBeNull();
  });

  it('solo se dibuja en la primera escena', () => {
    const project = projectWithScenes();
    expect(sceneTitleFrame(project, project.script.scenes[1], 0.5)).toBeNull();
  });

  it('se recorta a la duración de la escena y no aparece sin título', () => {
    const short = projectWithScenes();
    short.script.scenes[0].durationSeconds = 1;
    expect(sceneTitleFrame(short, short.script.scenes[0], 0.9)).not.toBeNull();
    expect(sceneTitleFrame(short, short.script.scenes[0], 1)).toBeNull();

    const untitled = projectWithScenes('   ');
    expect(untitled.title).toBe('Proyecto sin título');
    untitled.title = '   ';
    expect(sceneTitleFrame(untitled, untitled.script.scenes[0], 0.5)).toBeNull();
  });

  it('es independiente del gancho de la intro', () => {
    const project = projectWithScenes();
    project.settings.introHookEnabled = true;
    expect(sceneTitleFrame(project, project.script.scenes[0], 0.5)).not.toBeNull();
    expect(sceneTitleFrame(project, project.script.scenes[0], 3.5)).not.toBeNull();
  });
});
