import { describe, it, expect, beforeEach } from 'vitest';
import { TimelineEngine, UndoRedoManager } from '../services/timeline/timelineEngine';
import { Project } from '../types';

describe('Auditoría y Pruebas Unitarias Fase 7C — TimelineEngine & UndoRedoManager', () => {
  let sampleProject: Project;

  beforeEach(() => {
    sampleProject = {
      id: 'proj-7c-test',
      title: 'Proyecto Documental Fase 7C',
      description: 'Prueba de edición interactiva de timeline',
      createdAt: 1700000000000,
      updatedAt: 1700000000000,
      angles: [],
      sources: [],
      script: {
        title: 'Guion Principal',
        summary: 'Resumen',
        targetAudience: 'General',
        tone: 'Divulgativo',
        scenes: [
          {
            id: 'scene-01',
            title: 'Escena 1: Introducción',
            narrationText: 'Texto de la primera escena...',
            visualIntent: 'Plano general',
            cameraMotion: 'Zoom In',
            transition: 'Fade',
            durationSeconds: 10,
          },
          {
            id: 'scene-02',
            title: 'Escena 2: Desarrollo',
            narrationText: 'Texto de la segunda escena...',
            visualIntent: 'Detalle de documento',
            cameraMotion: 'Pan Left',
            transition: 'Cut',
            durationSeconds: 15,
          },
        ],
      },
      mediaAssets: [],
      settings: {
        fps: 30,
        resolution: { width: 1280, height: 720 },
        aspectRatio: '16:9',
      },
    };
  });

  it('1. ensureTimeline: inicializa pistas V1, V2, A1 y T1 manteniendo retrocompatibilidad', () => {
    const initialized = TimelineEngine.ensureTimeline(sampleProject);
    expect(initialized.timeline).toBeDefined();
    expect(initialized.timeline?.tracks).toHaveLength(4);

    const v1 = initialized.timeline?.tracks.find((t) => t.id === 'track-v1');
    expect(v1).toBeDefined();
    expect(v1?.clips).toHaveLength(2);
    expect(v1?.clips[0].durationMs).toBe(10000);
    expect(v1?.clips[1].startMs).toBe(10000);
    expect(v1?.clips[1].durationMs).toBe(15000);
  });

  it('2. moveClip: desplaza la posición temporal de un clip y mantiene el orden', () => {
    const initialized = TimelineEngine.ensureTimeline(sampleProject);
    const moved = TimelineEngine.moveClip(initialized, 'track-v1', 'clip-v1-scene-01', 5000);

    const v1 = moved.timeline?.tracks.find((t) => t.id === 'track-v1');
    const clip1 = v1?.clips.find((c) => c.id === 'clip-v1-scene-01');
    expect(clip1?.startMs).toBe(5000);
  });

  it('3. trimClipIn: recorta el punto de entrada desplazando el startMs e incrementando offsetMs', () => {
    const initialized = TimelineEngine.ensureTimeline(sampleProject);
    const trimmed = TimelineEngine.trimClipIn(initialized, 'track-v1', 'clip-v1-scene-01', 2000);

    const v1 = trimmed.timeline?.tracks.find((t) => t.id === 'track-v1');
    const clip1 = v1?.clips.find((c) => c.id === 'clip-v1-scene-01');

    expect(clip1?.startMs).toBe(2000);
    expect(clip1?.offsetMs).toBe(2000);
    expect(clip1?.durationMs).toBe(8000);
  });

  it('4. trimClipOut: recorta el punto de salida modificando durationMs sin alterar startMs', () => {
    const initialized = TimelineEngine.ensureTimeline(sampleProject);
    const trimmed = TimelineEngine.trimClipOut(initialized, 'track-v1', 'clip-v1-scene-01', 7000);

    const v1 = trimmed.timeline?.tracks.find((t) => t.id === 'track-v1');
    const clip1 = v1?.clips.find((c) => c.id === 'clip-v1-scene-01');

    expect(clip1?.startMs).toBe(0);
    expect(clip1?.durationMs).toBe(7000);
  });

  it('5. splitClipAtPlayhead: divide un clip en la posición del cabezal en dos partes', () => {
    const initialized = TimelineEngine.ensureTimeline(sampleProject);
    // Dividir escena 1 (0 a 10s) en el segundo 4 (4000ms)
    const split = TimelineEngine.splitClipAtPlayhead(initialized, 'track-v1', 'clip-v1-scene-01', 4000);

    const v1 = split.timeline?.tracks.find((t) => t.id === 'track-v1');
    expect(v1?.clips).toHaveLength(3);

    const pt1 = v1?.clips.find((c) => c.id === 'clip-v1-scene-01-pt1');
    const pt2 = v1?.clips.find((c) => c.id === 'clip-v1-scene-01-pt2');

    expect(pt1?.durationMs).toBe(4000);
    expect(pt2?.startMs).toBe(4000);
    expect(pt2?.durationMs).toBe(6000);
    expect(pt2?.offsetMs).toBe(4000);
  });

  it('6. duplicateClip: crea una copia del clip en la pista', () => {
    const initialized = TimelineEngine.ensureTimeline(sampleProject);
    const duplicated = TimelineEngine.duplicateClip(initialized, 'track-v1', 'clip-v1-scene-01');

    const v1 = duplicated.timeline?.tracks.find((t) => t.id === 'track-v1');
    expect(v1?.clips).toHaveLength(3);
    const copy = v1?.clips.find((c) => c.name.includes('(Copia)'));
    expect(copy).toBeDefined();
  });

  it('7. deleteClip: elimina un clip del timeline y sincroniza con scenes', () => {
    const initialized = TimelineEngine.ensureTimeline(sampleProject);
    const deleted = TimelineEngine.deleteClip(initialized, 'track-v1', 'clip-v1-scene-01');

    const v1 = deleted.timeline?.tracks.find((t) => t.id === 'track-v1');
    expect(v1?.clips).toHaveLength(1);
    expect(deleted.script.scenes).toHaveLength(1);
  });

  it('8. reorderClips: reorganiza el orden secuencial de clips', () => {
    const initialized = TimelineEngine.ensureTimeline(sampleProject);
    const reordered = TimelineEngine.reorderClips(initialized, 'track-v1', 0, 1);

    const v1 = reordered.timeline?.tracks.find((t) => t.id === 'track-v1');
    expect(v1?.clips[0].id).toBe('clip-v1-scene-02');
    expect(v1?.clips[1].id).toBe('clip-v1-scene-01');
  });

  it('9. Track toggles: bloqueo, visibilidad y silencio de pistas', () => {
    let proj = TimelineEngine.ensureTimeline(sampleProject);

    proj = TimelineEngine.toggleTrackLock(proj, 'track-v1');
    expect(proj.timeline?.tracks.find((t) => t.id === 'track-v1')?.isLocked).toBe(true);

    // Intento de mover un clip en pista bloqueada debe ser ignorado
    const attemptedMove = TimelineEngine.moveClip(proj, 'track-v1', 'clip-v1-scene-01', 9999);
    expect(
      attemptedMove.timeline?.tracks.find((t) => t.id === 'track-v1')?.clips[0].startMs
    ).toBe(0);

    proj = TimelineEngine.toggleTrackVisibility(proj, 'track-v1');
    expect(proj.timeline?.tracks.find((t) => t.id === 'track-v1')?.isVisible).toBe(false);

    proj = TimelineEngine.toggleTrackMute(proj, 'track-a1');
    expect(proj.timeline?.tracks.find((t) => t.id === 'track-a1')?.isMuted).toBe(true);
  });

  it('10. UndoRedoManager: deshacer y rehacer con recuperación completa de estado', () => {
    const manager = new UndoRedoManager(10);
    const initial = TimelineEngine.ensureTimeline(sampleProject);

    manager.pushState(initial);

    // Modificación 1: Mover clip
    const modified1 = TimelineEngine.moveClip(initial, 'track-v1', 'clip-v1-scene-01', 3000);
    manager.pushState(modified1);

    // Modificación 2: Recortar clip
    const modified2 = TimelineEngine.trimClipOut(modified1, 'track-v1', 'clip-v1-scene-01', 5000);

    // Deshacer modificación 2
    expect(manager.canUndo()).toBe(true);
    const undoneTo1 = manager.undo(modified2);
    expect(undoneTo1).toBeDefined();
    const clipUndone1 = undoneTo1?.timeline?.tracks[0].clips.find((c) => c.id === 'clip-v1-scene-01');
    expect(clipUndone1?.durationMs).toBe(10000);

    // Deshacer modificación 1
    const undoneToInitial = manager.undo(undoneTo1!);
    expect(undoneToInitial).toBeDefined();
    const clipInitial = undoneToInitial?.timeline?.tracks[0].clips.find((c) => c.id === 'clip-v1-scene-01');
    expect(clipInitial?.startMs).toBe(0);

    // Rehacer
    expect(manager.canRedo()).toBe(true);
    const redoneTo1 = manager.redo(undoneToInitial!);
    expect(redoneTo1?.timeline?.tracks[0].clips.find((c) => c.id === 'clip-v1-scene-01')?.startMs).toBe(3000);
  });
});
