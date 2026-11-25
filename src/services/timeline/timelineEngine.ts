// Timeline & Clip Manipulation Engine (Phase 7C - Interactive Editing Core)
// Provides pure functions for clip editing, track synchronization, and an immutable Undo/Redo history stack.

import { Project, Scene, TimelineTrack, TimelineClip, MediaAsset } from '../../types';

export class TimelineEngine {
  /**
   * Inserts an imported MediaAsset directly as a clip into the timeline.
   */
  public static insertMediaAssetAsClip(
    project: Project,
    asset: MediaAsset,
    targetTrackId?: string,
    playheadMs: number = 0
  ): Project {
    const updated = this.ensureTimeline(project);
    const chosenTrackId =
      targetTrackId || (asset.type === 'audio' ? 'track-a1' : 'track-v1');

    const durationMs = asset.durationSeconds
      ? Math.round(asset.durationSeconds * 1000)
      : asset.type === 'image'
      ? 5000
      : 3000;

    const newClip: TimelineClip = {
      id: `clip-${asset.id}-${Date.now()}`,
      name: asset.name,
      trackId: chosenTrackId,
      assetId: asset.id,
      type: asset.type === 'audio' ? 'audio' : asset.type === 'video' ? 'video' : 'image',
      startMs: Math.max(0, playheadMs),
      durationMs,
      offsetMs: 0,
      opacity: 1.0,
      volume: 1.0,
      speed: 1.0,
    };

    const tracks = updated.timeline!.tracks.map((t) => {
      if (t.id !== chosenTrackId) return t;
      const clips = [...t.clips, newClip];
      clips.sort((a, b) => a.startMs - b.startMs);
      return { ...t, clips };
    });

    return this.syncScenesFromTimeline({
      ...updated,
      timeline: { ...updated.timeline!, tracks },
    });
  }
  /**
   * Ensure a project has a populated timeline model initialized from its scenes if missing.
   * Maintains 100% backward compatibility with prior projects.
   */
  public static ensureTimeline(project: Project): Project {
    if (project.timeline && project.timeline.tracks && project.timeline.tracks.length > 0) {
      return project;
    }

    const scenes = project.script?.scenes || [];
    let currentStartMs = 0;

    const v1Clips: TimelineClip[] = [];
    const a1Clips: TimelineClip[] = [];
    const t1Clips: TimelineClip[] = [];

    scenes.forEach((sc, idx) => {
      const durationMs = Math.round(sc.durationSeconds * 1000);

      // Video track clip (V1)
      v1Clips.push({
        id: `clip-v1-${sc.id || idx}`,
        name: sc.title,
        trackId: 'track-v1',
        sceneId: sc.id,
        type: sc.imageUrl ? 'image' : 'video',
        startMs: currentStartMs,
        durationMs,
        offsetMs: 0,
        opacity: 1.0,
        volume: 1.0,
        speed: 1.0,
        transform: { x: 0, y: 0, scale: 1.0, rotation: 0 },
        colorAdjustments: {
          brightness: 0,
          contrast: 1.0,
          saturation: 1.0,
          temperature: 0,
          vignette: 0,
        },
      });

      // Audio track clip (A1)
      a1Clips.push({
        id: `clip-a1-${sc.id || idx}`,
        name: `${sc.title} (Voz)`,
        trackId: 'track-a1',
        sceneId: sc.id,
        type: 'audio',
        startMs: currentStartMs,
        durationMs,
        offsetMs: 0,
        volume: 1.0,
        speed: 1.0,
        textPayload: sc.narrationText,
      });

      // Subtitle track clip (T1)
      t1Clips.push({
        id: `clip-t1-${sc.id || idx}`,
        name: `Sub #${idx + 1}`,
        trackId: 'track-t1',
        sceneId: sc.id,
        type: 'caption',
        startMs: currentStartMs,
        durationMs,
        offsetMs: 0,
        textPayload: sc.narrationText,
      });

      currentStartMs += durationMs;
    });

    const tracks: TimelineTrack[] = [
      {
        id: 'track-v1',
        name: 'Video 1 (Base)',
        type: 'video',
        order: 0,
        isMuted: false,
        isLocked: false,
        isVisible: true,
        clips: v1Clips,
      },
      {
        id: 'track-v2',
        name: 'Video 2 (Capas / Overlays)',
        type: 'video',
        order: 1,
        isMuted: false,
        isLocked: false,
        isVisible: true,
        clips: [],
      },
      {
        id: 'track-a1',
        name: 'Audio 1 (Locución)',
        type: 'audio',
        order: 2,
        isMuted: false,
        isLocked: false,
        isVisible: true,
        clips: a1Clips,
      },
      {
        id: 'track-t1',
        name: 'Texto 1 (Subtítulos)',
        type: 'text',
        order: 3,
        isMuted: false,
        isLocked: false,
        isVisible: true,
        clips: t1Clips,
      },
    ];

    return {
      ...project,
      timeline: {
        tracks,
        activeTrackId: 'track-v1',
        markers: [],
      },
    };
  }

  /**
   * Synchronizes timeline modifications back to the project's scenes array.
   */
  public static syncScenesFromTimeline(project: Project): Project {
    const v1Track = project.timeline?.tracks.find((t) => t.id === 'track-v1');
    if (!v1Track) return project;

    // Map existing scenes by ID for metadata preservation
    const sceneMap = new Map<string, Scene>();
    (project.script?.scenes || []).forEach((sc) => sceneMap.set(sc.id, sc));

    const updatedScenes: Scene[] = v1Track.clips.map((clip, idx) => {
      const existing = clip.sceneId ? sceneMap.get(clip.sceneId) : null;
      const durationSeconds = Math.max(1, Math.round(clip.durationMs / 1000));

      if (existing) {
        return {
          ...existing,
          title: clip.name,
          durationSeconds,
        };
      }

      return {
        id: clip.sceneId || `scene-sync-${clip.id}`,
        title: clip.name || `Escena #${idx + 1}`,
        narrationText: clip.textPayload || 'Locución de escena editada...',
        visualIntent: 'Composición cinematográfica en timeline multipista',
        cameraMotion: 'Zoom In',
        transition: 'Fade',
        durationSeconds,
      };
    });

    return {
      ...project,
      script: {
        ...project.script,
        scenes: updatedScenes,
      },
    };
  }

  /**
   * Move clip to a new start position, keeping clips ordered.
   */
  public static moveClip(
    project: Project,
    trackId: string,
    clipId: string,
    newStartMs: number
  ): Project {
    const updated = this.ensureTimeline(project);
    const tracks = updated.timeline!.tracks.map((track) => {
      if (track.id !== trackId || track.isLocked) return track;

      const clipIndex = track.clips.findIndex((c) => c.id === clipId);
      if (clipIndex === -1) return track;

      const clip = track.clips[clipIndex];
      const boundedStart = Math.max(0, Math.round(newStartMs));

      const updatedClip = { ...clip, startMs: boundedStart };
      const newClips = [...track.clips];
      newClips[clipIndex] = updatedClip;
      newClips.sort((a, b) => a.startMs - b.startMs);

      return { ...track, clips: newClips };
    });

    return this.syncScenesFromTimeline({
      ...updated,
      timeline: { ...updated.timeline!, tracks },
    });
  }

  /**
   * Trim In Point (head): increases offsetMs and moves startMs forward, reducing durationMs.
   */
  public static trimClipIn(
    project: Project,
    trackId: string,
    clipId: string,
    deltaMs: number
  ): Project {
    const updated = this.ensureTimeline(project);
    const tracks = updated.timeline!.tracks.map((track) => {
      if (track.id !== trackId || track.isLocked) return track;

      const clip = track.clips.find((c) => c.id === clipId);
      if (!clip) return track;

      // Minimum duration constraint (500 ms)
      const minDuration = 500;
      const maxAllowedDelta = clip.durationMs - minDuration;
      const effectiveDelta = Math.min(deltaMs, maxAllowedDelta);

      if (clip.durationMs - effectiveDelta < minDuration) return track;

      const updatedClips = track.clips.map((c) => {
        if (c.id !== clipId) return c;
        return {
          ...c,
          startMs: c.startMs + effectiveDelta,
          offsetMs: Math.max(0, c.offsetMs + effectiveDelta),
          durationMs: c.durationMs - effectiveDelta,
        };
      });

      return { ...track, clips: updatedClips };
    });

    return this.syncScenesFromTimeline({
      ...updated,
      timeline: { ...updated.timeline!, tracks },
    });
  }

  /**
   * Trim Out Point (tail): alters durationMs without altering startMs.
   */
  public static trimClipOut(
    project: Project,
    trackId: string,
    clipId: string,
    newDurationMs: number
  ): Project {
    const updated = this.ensureTimeline(project);
    const tracks = updated.timeline!.tracks.map((track) => {
      if (track.id !== trackId || track.isLocked) return track;

      const clip = track.clips.find((c) => c.id === clipId);
      if (!clip) return track;

      const minDuration = 500;
      const boundedDuration = Math.max(minDuration, Math.round(newDurationMs));

      const updatedClips = track.clips.map((c) => {
        if (c.id !== clipId) return c;
        return {
          ...c,
          durationMs: boundedDuration,
        };
      });

      return { ...track, clips: updatedClips };
    });

    return this.syncScenesFromTimeline({
      ...updated,
      timeline: { ...updated.timeline!, tracks },
    });
  }

  /**
   * Split clip at playhead position into two independent segments.
   */
  public static splitClipAtPlayhead(
    project: Project,
    trackId: string,
    clipId: string,
    playheadMs: number
  ): Project {
    const updated = this.ensureTimeline(project);
    const tracks = updated.timeline!.tracks.map((track) => {
      if (track.id !== trackId || track.isLocked) return track;

      const clipIndex = track.clips.findIndex((c) => c.id === clipId);
      if (clipIndex === -1) return track;

      const target = track.clips[clipIndex];
      const clipStart = target.startMs;
      const clipEnd = target.startMs + target.durationMs;

      // Must land strictly inside the clip bounds
      if (playheadMs <= clipStart + 400 || playheadMs >= clipEnd - 400) {
        return track; // Too close to boundaries to split
      }

      const firstPartDuration = playheadMs - clipStart;
      const secondPartDuration = target.durationMs - firstPartDuration;

      const firstClip: TimelineClip = {
        ...target,
        id: `${target.id}-pt1`,
        name: `${target.name} (P1)`,
        durationMs: firstPartDuration,
      };

      const secondClip: TimelineClip = {
        ...target,
        id: `${target.id}-pt2`,
        name: `${target.name} (P2)`,
        sceneId: `scene-split-${Date.now()}`,
        startMs: playheadMs,
        offsetMs: target.offsetMs + firstPartDuration,
        durationMs: secondPartDuration,
      };

      const newClips = [...track.clips];
      newClips.splice(clipIndex, 1, firstClip, secondClip);

      return { ...track, clips: newClips };
    });

    return this.syncScenesFromTimeline({
      ...updated,
      timeline: { ...updated.timeline!, tracks },
    });
  }

  /**
   * Duplicate a clip directly adjacent to itself on the track.
   */
  public static duplicateClip(project: Project, trackId: string, clipId: string): Project {
    const updated = this.ensureTimeline(project);
    const tracks = updated.timeline!.tracks.map((track) => {
      if (track.id !== trackId || track.isLocked) return track;

      const clipIndex = track.clips.findIndex((c) => c.id === clipId);
      if (clipIndex === -1) return track;

      const target = track.clips[clipIndex];
      const duplicated: TimelineClip = {
        ...target,
        id: `clip-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        sceneId: `scene-dup-${Date.now()}`,
        name: `${target.name} (Copia)`,
        startMs: target.startMs + target.durationMs + 200,
      };

      const newClips = [...track.clips, duplicated];
      newClips.sort((a, b) => a.startMs - b.startMs);

      return { ...track, clips: newClips };
    });

    return this.syncScenesFromTimeline({
      ...updated,
      timeline: { ...updated.timeline!, tracks },
    });
  }

  /**
   * Delete clip from timeline track.
   */
  public static deleteClip(project: Project, trackId: string, clipId: string): Project {
    const updated = this.ensureTimeline(project);
    const tracks = updated.timeline!.tracks.map((track) => {
      if (track.id !== trackId || track.isLocked) return track;
      return {
        ...track,
        clips: track.clips.filter((c) => c.id !== clipId),
      };
    });

    return this.syncScenesFromTimeline({
      ...updated,
      timeline: { ...updated.timeline!, tracks },
    });
  }

  /**
   * Reorder clips in track.
   */
  public static reorderClips(
    project: Project,
    trackId: string,
    sourceIndex: number,
    destinationIndex: number
  ): Project {
    const updated = this.ensureTimeline(project);
    const tracks = updated.timeline!.tracks.map((track) => {
      if (track.id !== trackId || track.isLocked) return track;

      const clips = [...track.clips];
      const [removed] = clips.splice(sourceIndex, 1);
      clips.splice(destinationIndex, 0, removed);

      // Re-anchor startMs continuously
      let currStart = 0;
      const reanchored = clips.map((c) => {
        const item = { ...c, startMs: currStart };
        currStart += c.durationMs;
        return item;
      });

      return { ...track, clips: reanchored };
    });

    return this.syncScenesFromTimeline({
      ...updated,
      timeline: { ...updated.timeline!, tracks },
    });
  }

  /**
   * Track state toggles: Mute, Lock, Visibility
   */
  public static toggleTrackLock(project: Project, trackId: string): Project {
    const updated = this.ensureTimeline(project);
    const tracks = updated.timeline!.tracks.map((t) =>
      t.id === trackId ? { ...t, isLocked: !t.isLocked } : t
    );
    return { ...updated, timeline: { ...updated.timeline!, tracks } };
  }

  public static toggleTrackVisibility(project: Project, trackId: string): Project {
    const updated = this.ensureTimeline(project);
    const tracks = updated.timeline!.tracks.map((t) =>
      t.id === trackId ? { ...t, isVisible: !t.isVisible } : t
    );
    return { ...updated, timeline: { ...updated.timeline!, tracks } };
  }

  public static toggleTrackMute(project: Project, trackId: string): Project {
    const updated = this.ensureTimeline(project);
    const tracks = updated.timeline!.tracks.map((t) =>
      t.id === trackId ? { ...t, isMuted: !t.isMuted } : t
    );
    return { ...updated, timeline: { ...updated.timeline!, tracks } };
  }
}

/**
 * Immutable Undo/Redo State Manager for Studio Timeline Operations
 */
export class UndoRedoManager {
  private undoStack: Project[] = [];
  private redoStack: Project[] = [];
  private maxHistory: number = 30;

  constructor(maxHistory: number = 30) {
    this.maxHistory = maxHistory;
  }

  public pushState(currentState: Project): void {
    // Clone to prevent shared references
    const snapshot = JSON.parse(JSON.stringify(currentState));
    this.undoStack.push(snapshot);
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
    }
    // Any new action clears the redo stack
    this.redoStack = [];
  }

  public undo(currentState: Project): Project | null {
    if (this.undoStack.length === 0) return null;

    const previous = this.undoStack.pop()!;
    this.redoStack.push(JSON.parse(JSON.stringify(currentState)));
    return previous;
  }

  public redo(currentState: Project): Project | null {
    if (this.redoStack.length === 0) return null;

    const next = this.redoStack.pop()!;
    this.undoStack.push(JSON.parse(JSON.stringify(currentState)));
    return next;
  }

  public canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  public canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  public clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }
}
