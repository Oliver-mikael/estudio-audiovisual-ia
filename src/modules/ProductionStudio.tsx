// ProductionStudio Component (Phase 7C - Interactive Multi-track Timeline Editor)
// Real interactive editing: Move, Trim In/Out, Split at Playhead, Duplicate, Delete, Undo/Redo & Track Controls
import React, { useState, useRef } from 'react';
import { Project, TimelineClip } from '../types';
import { TimelineEngine, UndoRedoManager } from '../services/timeline/timelineEngine';
import { VideoPlayer } from '../components/VideoPlayer';
import { audioRecorder } from '../services/audio/AudioRecorder';
import { audioMixer } from '../services/audio/AudioMixer';
import {
  Film,
  Music,
  Type,
  Subtitles,
  ArrowRightLeft,
  Sparkles,
  Sliders,
  Palette,
  Layers,
  Download,
  Play,
  Volume2,
  VolumeX,
  Trash2,
  Scissors,
  Copy,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Undo2,
  Redo2,
  Mic,
} from 'lucide-react';

interface ProductionStudioProps {
  project: Project;
  onUpdateProject: (updated: Project) => void;
  onRequestExportModal?: () => void;
}

type ProductionCategory =
  | 'medios'
  | 'audio'
  | 'texto'
  | 'subtitulos'
  | 'transiciones'
  | 'efectos'
  | 'filtros'
  | 'animaciones'
  | 'color'
  | 'capas';

export const ProductionStudio: React.FC<ProductionStudioProps> = ({
  project,
  onUpdateProject,
  onRequestExportModal,
}) => {
  const [activeCategory, setActiveCategory] = useState<ProductionCategory>('medios');
  const [timelineZoom, setTimelineZoom] = useState<number>(1);
  const [playheadMs, setPlayheadMs] = useState<number>(0);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [selectedTrackId, setSelectedTrackId] = useState<string>('track-v1');

  // Undo/Redo History Manager Reference
  const historyRef = useRef<UndoRedoManager>(new UndoRedoManager(30));
  const initializedProject = TimelineEngine.ensureTimeline(project);

  const tracks = initializedProject.timeline?.tracks || [];
  const activeTrack = tracks.find((t) => t.id === selectedTrackId) || tracks[0];
  const activeClip = activeTrack?.clips.find((c) => c.id === selectedClipId) || activeTrack?.clips[0];

  // Total project duration in ms
  const totalDurationMs = tracks.reduce((max, track) => {
    const trackEnd = track.clips.reduce((tMax, c) => Math.max(tMax, c.startMs + c.durationMs), 0);
    return Math.max(max, trackEnd);
  }, 0);

  const applyChangeWithHistory = (newProject: Project) => {
    historyRef.current.pushState(initializedProject);
    onUpdateProject(newProject);
  };

  const handleUndo = () => {
    if (!historyRef.current.canUndo()) return;
    const previous = historyRef.current.undo(initializedProject);
    if (previous) onUpdateProject(previous);
  };

  const handleRedo = () => {
    if (!historyRef.current.canRedo()) return;
    const next = historyRef.current.redo(initializedProject);
    if (next) onUpdateProject(next);
  };

  // 1. Split at playhead
  const handleSplit = () => {
    if (!activeClip || !selectedTrackId) return;
    const splitProject = TimelineEngine.splitClipAtPlayhead(
      initializedProject,
      selectedTrackId,
      activeClip.id,
      playheadMs
    );
    applyChangeWithHistory(splitProject);
  };

  // 2. Duplicate active clip
  const handleDuplicate = () => {
    if (!activeClip || !selectedTrackId) return;
    const duplicated = TimelineEngine.duplicateClip(
      initializedProject,
      selectedTrackId,
      activeClip.id
    );
    applyChangeWithHistory(duplicated);
  };

  // 3. Delete active clip
  const handleDelete = () => {
    if (!activeClip || !selectedTrackId) return;
    const deleted = TimelineEngine.deleteClip(
      initializedProject,
      selectedTrackId,
      activeClip.id
    );
    applyChangeWithHistory(deleted);
    setSelectedClipId(null);
  };

  // 4. Trim In (move in-point forward)
  const handleTrimIn = (deltaSeconds: number) => {
    if (!activeClip || !selectedTrackId) return;
    const trimmed = TimelineEngine.trimClipIn(
      initializedProject,
      selectedTrackId,
      activeClip.id,
      deltaSeconds * 1000
    );
    applyChangeWithHistory(trimmed);
  };

  // 5. Trim Out (alter duration)
  const handleTrimOut = (deltaSeconds: number) => {
    if (!activeClip || !selectedTrackId) return;
    const newDuration = Math.max(500, activeClip.durationMs + deltaSeconds * 1000);
    const trimmed = TimelineEngine.trimClipOut(
      initializedProject,
      selectedTrackId,
      activeClip.id,
      newDuration
    );
    applyChangeWithHistory(trimmed);
  };

  // Track toggles
  const handleToggleLock = (trackId: string) => {
    onUpdateProject(TimelineEngine.toggleTrackLock(initializedProject, trackId));
  };
  const handleToggleVisibility = (trackId: string) => {
    onUpdateProject(TimelineEngine.toggleTrackVisibility(initializedProject, trackId));
  };
  const handleToggleMute = (trackId: string) => {
    onUpdateProject(TimelineEngine.toggleTrackMute(initializedProject, trackId));
  };

  const categories = [
    { id: 'medios', label: 'Medios', icon: Film },
    { id: 'audio', label: 'Audio', icon: Music },
    { id: 'texto', label: 'Texto', icon: Type },
    { id: 'subtitulos', label: 'Subtítulos', icon: Subtitles },
    { id: 'transiciones', label: 'Transiciones', icon: ArrowRightLeft },
    { id: 'efectos', label: 'Efectos', icon: Sparkles },
    { id: 'filtros', label: 'Filtros', icon: Sliders },
    { id: 'animaciones', label: 'Animaciones', icon: Play },
    { id: 'color', label: 'Color', icon: Palette },
    { id: 'capas', label: 'Capas', icon: Layers },
  ];

  return (
    <div className="space-y-4">
      {/* Top Controls Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-600 rounded-lg text-white">
            <Film className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>Editor Audiovisual & Timeline Multipista</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-indigo-950 text-indigo-400 border border-indigo-800/60 rounded">
                Fase 7C
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Edición interactiva con corte en cabezal, recorte in/out y reversibilidad completa.
            </p>
          </div>
        </div>

        {/* Timeline Action Tools: Undo, Redo, Export Modal */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={handleUndo}
              disabled={!historyRef.current.canUndo()}
              className="p-1.5 text-slate-300 hover:text-white disabled:opacity-30 disabled:hover:text-slate-300 transition-colors rounded"
              title="Deshacer cambio (Ctrl+Z)"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleRedo}
              disabled={!historyRef.current.canRedo()}
              className="p-1.5 text-slate-300 hover:text-white disabled:opacity-30 disabled:hover:text-slate-300 transition-colors rounded"
              title="Rehacer cambio (Ctrl+Y)"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {onRequestExportModal && (
            <button
              onClick={onRequestExportModal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-lg text-xs font-semibold shadow-md transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Perfiles de Exportación</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Studio Workspace: Monitor & Timeline (Left) + Tools (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Interactive Canvas Monitor + Interactive Timeline */}
        <div className="lg:col-span-7 space-y-3">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-3 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs">
              <span className="font-mono text-slate-300 font-semibold uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Monitor Maestro (Canvas 2D)
              </span>
              <span className="text-slate-400 font-mono text-[11px]">
                Cabezal: {(playheadMs / 1000).toFixed(2)}s / {(totalDurationMs / 1000).toFixed(1)}s
              </span>
            </div>

            <VideoPlayer project={initializedProject} />
          </div>

          {/* Interactive Multi-track Timeline Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-3 shadow-sm">
            {/* Timeline Control Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs">
              {/* Clip Tool Actions: Split, Duplicate, Delete, Trim */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={handleSplit}
                  disabled={!activeClip}
                  className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-xs transition-colors disabled:opacity-40"
                  title="Dividir clip en el cabezal"
                >
                  <Scissors className="w-3 h-3 text-indigo-400" />
                  <span>Dividir</span>
                </button>

                <button
                  onClick={handleDuplicate}
                  disabled={!activeClip}
                  className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-xs transition-colors disabled:opacity-40"
                  title="Duplicar clip seleccionado"
                >
                  <Copy className="w-3 h-3 text-slate-400" />
                  <span>Duplicar</span>
                </button>

                <button
                  onClick={handleDelete}
                  disabled={!activeClip}
                  className="flex items-center gap-1 px-2.5 py-1 bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-800/80 rounded text-xs transition-colors disabled:opacity-40"
                  title="Eliminar clip"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Eliminar</span>
                </button>

                <div className="h-4 w-px bg-slate-800 mx-1 hidden sm:block" />

                {/* Trim Buttons */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleTrimIn(1)}
                    disabled={!activeClip}
                    className="px-2 py-0.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[10px] rounded text-slate-300 font-mono disabled:opacity-40"
                    title="Avanzar punto de entrada (+1s)"
                  >
                    In +1s
                  </button>
                  <button
                    onClick={() => handleTrimOut(-1)}
                    disabled={!activeClip}
                    className="px-2 py-0.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[10px] rounded text-slate-300 font-mono disabled:opacity-40"
                    title="Reducir salida (-1s)"
                  >
                    Out -1s
                  </button>
                  <button
                    onClick={() => handleTrimOut(1)}
                    disabled={!activeClip}
                    className="px-2 py-0.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[10px] rounded text-slate-300 font-mono disabled:opacity-40"
                    title="Extender salida (+1s)"
                  >
                    Out +1s
                  </button>
                </div>
              </div>

              {/* Zoom Slider */}
              <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                <span>Zoom:</span>
                <input
                  type="range"
                  min="0.5"
                  max="2.5"
                  step="0.1"
                  value={timelineZoom}
                  onChange={(e) => setTimelineZoom(parseFloat(e.target.value))}
                  className="w-16 accent-indigo-500"
                />
              </div>
            </div>

            {/* Playhead Scrubber Range */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>00:00:00</span>
                <span>Cabezal: {(playheadMs / 1000).toFixed(1)}s</span>
                <span>{(totalDurationMs / 1000).toFixed(1)}s</span>
              </div>
              <input
                type="range"
                min="0"
                max={Math.max(1000, totalDurationMs)}
                value={playheadMs}
                onChange={(e) => setPlayheadMs(parseInt(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            {/* Multi-track Visual Representation */}
            <div className="space-y-2 text-xs font-mono">
              {tracks.map((track) => (
                <div key={track.id} className="flex items-center gap-2">
                  {/* Track Header Controls */}
                  <div className="w-20 bg-slate-950 p-1.5 rounded-lg border border-slate-800 flex items-center justify-between text-[10px] text-slate-300">
                    <span className="font-bold">{track.name.split(' ')[0]}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleVisibility(track.id)}
                        className={`p-0.5 hover:text-white ${track.isVisible ? 'text-slate-400' : 'text-rose-400'}`}
                        title={track.isVisible ? 'Pista visible' : 'Pista oculta'}
                      >
                        {track.isVisible ? <Eye className="w-2.5 h-2.5" /> : <EyeOff className="w-2.5 h-2.5" />}
                      </button>
                      <button
                        onClick={() => handleToggleLock(track.id)}
                        className={`p-0.5 hover:text-white ${track.isLocked ? 'text-amber-400' : 'text-slate-400'}`}
                        title={track.isLocked ? 'Pista bloqueada' : 'Pista desbloqueada'}
                      >
                        {track.isLocked ? <Lock className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5" />}
                      </button>
                      {track.type === 'audio' && (
                        <button
                          onClick={() => handleToggleMute(track.id)}
                          className={`p-0.5 hover:text-white ${track.isMuted ? 'text-rose-400' : 'text-emerald-400'}`}
                          title={track.isMuted ? 'Pista silenciada' : 'Audio activo'}
                        >
                          {track.isMuted ? <VolumeX className="w-2.5 h-2.5" /> : <Volume2 className="w-2.5 h-2.5" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Track Clips Container */}
                  <div className="flex-1 flex gap-1 overflow-x-auto p-1 bg-slate-950 rounded-lg border border-slate-800/80 min-h-[40px] items-center">
                    {track.clips.length === 0 ? (
                      <span className="text-[10px] text-slate-600 italic px-2">Sin clips en esta pista</span>
                    ) : (
                      track.clips.map((clip, i) => {
                        const isSelected = clip.id === activeClip?.id;
                        const isVideo = track.type === 'video';
                        const isAudio = track.type === 'audio';

                        return (
                          <div
                            key={clip.id}
                            onClick={() => {
                              setSelectedTrackId(track.id);
                              setSelectedClipId(clip.id);
                              setPlayheadMs(clip.startMs);
                            }}
                            className={`h-7 px-2.5 flex items-center justify-between rounded text-[11px] cursor-pointer transition-all shrink-0 border select-none ${
                              isSelected
                                ? 'bg-indigo-600 border-indigo-300 text-white shadow-md'
                                : isVideo
                                ? 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800'
                                : isAudio
                                ? 'bg-emerald-950 border-emerald-800 text-emerald-300 hover:bg-emerald-900'
                                : 'bg-indigo-950 border-indigo-800 text-indigo-300 hover:bg-indigo-900'
                            }`}
                            style={{
                              minWidth: `${Math.max(70, (clip.durationMs / 1000) * 12 * timelineZoom)}px`,
                            }}
                            title={`${clip.name} (${(clip.durationMs / 1000).toFixed(1)}s)`}
                          >
                            <span className="truncate max-w-[120px]">
                              #{i + 1} {clip.name}
                            </span>
                            <span className="text-[9px] opacity-75 ml-1">
                              {(clip.durationMs / 1000).toFixed(1)}s
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Category Tabs & Inspector Panel */}
        <div className="lg:col-span-5 space-y-4">
          {/* 10 Production Categories Navigation */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-2 flex items-center gap-1 overflow-x-auto shadow-sm">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id as ProductionCategory)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Active Category Content Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4 shadow-sm text-xs">
            {activeCategory === 'medios' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h3 className="font-semibold text-slate-200">Biblioteca Multimedia en Estudio</h3>
                  <span className="font-mono text-slate-400">{activeClip?.name || 'Recursos disponibles'}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto">
                  {(project.mediaAssets || []).map((asset) => (
                    <div
                      key={asset.id}
                      className="p-2 bg-slate-950 border border-slate-800 rounded-lg flex flex-col justify-between hover:border-indigo-500 transition-colors"
                    >
                      <div
                        onClick={() => {
                          if (activeClip?.sceneId) {
                            const updatedScenes = project.script.scenes.map((s) =>
                              s.id === activeClip.sceneId ? { ...s, imageUrl: asset.url } : s
                            );
                            onUpdateProject({
                              ...project,
                              script: { ...project.script, scenes: updatedScenes },
                            });
                          }
                        }}
                        className="aspect-video bg-slate-900 rounded overflow-hidden mb-1.5 flex items-center justify-center cursor-pointer"
                        title="Asignar al clip actual"
                      >
                        {asset.thumbnailUrl ? (
                          <img src={asset.thumbnailUrl} alt={asset.name} className="w-full h-full object-cover" />
                        ) : asset.type === 'image' ? (
                          <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[10px] font-mono text-slate-500">{asset.name}</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-[11px] text-slate-300 truncate flex-1" title={asset.name}>
                          {asset.name}
                        </p>
                        <button
                          onClick={() => {
                            const updated = TimelineEngine.insertMediaAssetAsClip(
                              initializedProject,
                              asset,
                              undefined,
                              playheadMs
                            );
                            applyChangeWithHistory(updated);
                          }}
                          className="px-1.5 py-0.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[9px] font-semibold"
                          title="Insertar en Timeline"
                        >
                          + Timeline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeCategory === 'audio' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h3 className="font-semibold text-slate-200">
                    Mezclador Multipista & Grabación de Voz
                  </h3>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                    Web Audio Activo
                  </span>
                </div>

                {/* Voice Recorder Block */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                      <Mic className="w-3.5 h-3.5 text-rose-400" />
                      <span>Grabador de Locución en Vivo</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      Entrada: Micrófono Local
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={async () => {
                        try {
                          if (audioRecorder.isRecordingActive()) {
                            const { asset } = await audioRecorder.stopRecording(
                              `Locución: ${activeClip?.name || 'Escena'}`
                            );
                            // Add asset to project and create clip in A1
                            const updatedAssets = [...project.mediaAssets, asset];
                            const a1Track = initializedProject.timeline?.tracks.find((t) => t.id === 'track-a1');
                            if (a1Track) {
                              const newClip: TimelineClip = {
                                id: `clip-a1-${Date.now()}`,
                                name: asset.name,
                                trackId: 'track-a1',
                                assetId: asset.id,
                                type: 'audio',
                                startMs: playheadMs,
                                durationMs: Math.max(1000, asset.sizeBytes / 16), // Approx or buffer duration
                                offsetMs: 0,
                                volume: 1.0,
                              };
                              const updatedTracks = initializedProject.timeline!.tracks.map((t) =>
                                t.id === 'track-a1' ? { ...t, clips: [...t.clips, newClip] } : t
                              );
                              applyChangeWithHistory({
                                ...initializedProject,
                                mediaAssets: updatedAssets,
                                timeline: { ...initializedProject.timeline!, tracks: updatedTracks },
                              });
                            }
                          } else {
                            await audioRecorder.startRecording();
                          }
                        } catch (err: any) {
                          alert(err.message || 'Error con el micrófono');
                        }
                      }}
                      className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-semibold text-xs transition-colors shadow-md"
                    >
                      <Mic className="w-3.5 h-3.5" />
                      <span>Grabar Locución en A1</span>
                    </button>
                  </div>
                </div>

                {/* Multitrack Faders */}
                <div className="space-y-2">
                  <div className="space-y-1 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <div className="flex justify-between text-[11px] text-slate-300">
                      <span>Pista A1 (Locución)</span>
                      <span>100%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="150"
                      defaultValue="100"
                      onChange={(e) => audioMixer.setTrackVolume('track-a1', parseInt(e.target.value) / 100)}
                      className="w-full accent-emerald-500"
                    />
                  </div>

                  <div className="space-y-1 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <div className="flex justify-between text-[11px] text-slate-300">
                      <span>Pista A2 (Música de Fondo)</span>
                      <span>25%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      defaultValue="25"
                      onChange={(e) => audioMixer.setTrackVolume('track-a2', parseInt(e.target.value) / 100)}
                      className="w-full accent-indigo-500"
                    />
                  </div>

                  <div className="space-y-1 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <div className="flex justify-between text-[11px] text-slate-300">
                      <span>Volumen Master General</span>
                      <span>100%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="150"
                      defaultValue="100"
                      onChange={(e) => audioMixer.setMasterVolume(parseInt(e.target.value) / 100)}
                      className="w-full accent-indigo-400"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeCategory === 'texto' && (
              <div className="space-y-3">
                <h3 className="font-semibold text-slate-200 border-b border-slate-800 pb-2">
                  Títulos & Gráficos Cinéticos
                </h3>
                <textarea
                  rows={3}
                  value={activeClip?.textPayload || ''}
                  onChange={(e) => {
                    const text = e.target.value;
                    if (!activeClip || !selectedTrackId) return;
                    const updatedTracks = tracks.map((t) => {
                      if (t.id !== selectedTrackId) return t;
                      return {
                        ...t,
                        clips: t.clips.map((c) => (c.id === activeClip.id ? { ...c, textPayload: text } : c)),
                      };
                    });
                    applyChangeWithHistory({
                      ...initializedProject,
                      timeline: { ...initializedProject.timeline!, tracks: updatedTracks },
                    });
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                  placeholder="Texto del clip seleccionado..."
                />
              </div>
            )}

            {activeCategory === 'subtitulos' && (
              <div className="space-y-3">
                <h3 className="font-semibold text-slate-200 border-b border-slate-800 pb-2">
                  Subtítulos Cinéticos Sincronizados
                </h3>
                <div className="space-y-2">
                  {(tracks.find((t) => t.id === 'track-t1')?.clips || []).map((subClip, idx) => (
                    <div key={subClip.id} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300">
                      Cue #{idx + 1} ({(subClip.startMs / 1000).toFixed(1)}s): "{subClip.textPayload || 'Subtítulo'}"
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeCategory === 'transiciones' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h3 className="font-semibold text-slate-200">
                    Transición de Entrada ({activeClip?.name || 'Clip'})
                  </h3>
                  <span className="text-[10px] font-mono text-indigo-400">
                    {activeClip?.transition?.type || 'Ninguna'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'cut', label: 'Corte Directo' },
                    { id: 'crossfade', label: 'Disolvencia Cruzada' },
                    { id: 'slide-left', label: 'Deslizar Izquierda' },
                    { id: 'slide-right', label: 'Deslizar Derecha' },
                    { id: 'zoom-in', label: 'Zoom In' },
                    { id: 'zoom-out', label: 'Zoom Out' },
                    { id: 'wipe-left', label: 'Barrido Izquierda' },
                    { id: 'fade-to-black', label: 'Fundido a Negro' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        if (!activeClip || !selectedTrackId) return;
                        const updatedTracks = tracks.map((tr) => {
                          if (tr.id !== selectedTrackId) return tr;
                          return {
                            ...tr,
                            clips: tr.clips.map((c) =>
                              c.id === activeClip.id
                                ? {
                                    ...c,
                                    transition: {
                                      id: `trans-${Date.now()}`,
                                      type: t.id as any,
                                      durationMs: 1000,
                                      easing: 'ease-in-out',
                                    },
                                  }
                                : c
                            ),
                          };
                        });
                        applyChangeWithHistory({
                          ...initializedProject,
                          timeline: { ...initializedProject.timeline!, tracks: updatedTracks },
                        });
                      }}
                      className={`p-2 rounded-lg border text-xs font-medium transition-colors ${
                        activeClip?.transition?.type === t.id
                          ? 'bg-indigo-600 border-indigo-400 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-900'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeCategory === 'animaciones' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h3 className="font-semibold text-slate-200">
                    Animación por Keyframes ({activeClip?.name || 'Clip'})
                  </h3>
                  <span className="text-[10px] font-mono text-indigo-400">
                    {activeClip?.animations?.length || 0} curvas activas
                  </span>
                </div>
                <div className="space-y-2">
                  <p className="text-[11px] text-slate-400">
                    Aplica curvas cinemáticas automatizadas de escala, paneo o fundido:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      {
                        label: 'Zoom Suave (1.0 -> 1.25)',
                        prop: 'scale',
                        k1: 1.0,
                        k2: 1.25,
                      },
                      {
                        label: 'Desvanecer (1.0 -> 0.0)',
                        prop: 'opacity',
                        k1: 1.0,
                        k2: 0.0,
                      },
                      {
                        label: 'Paneo Derecha (0 -> 60px)',
                        prop: 'positionX',
                        k1: 0,
                        k2: 60,
                      },
                      {
                        label: 'Paneo Arriba (0 -> -40px)',
                        prop: 'positionY',
                        k1: 0,
                        k2: -40,
                      },
                    ].map((preset, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          if (!activeClip || !selectedTrackId) return;
                          const dur = activeClip.durationMs || 5000;
                          const newAnim = {
                            property: preset.prop as any,
                            keyframes: [
                              { id: `k1-${Date.now()}`, timeOffsetMs: 0, value: preset.k1, easing: 'ease-in-out' as const },
                              { id: `k2-${Date.now()}`, timeOffsetMs: dur, value: preset.k2, easing: 'ease-in-out' as const },
                            ],
                          };
                          const updatedTracks = tracks.map((tr) => {
                            if (tr.id !== selectedTrackId) return tr;
                            return {
                              ...tr,
                              clips: tr.clips.map((c) =>
                                c.id === activeClip.id
                                  ? {
                                      ...c,
                                      animations: [
                                        ...(c.animations || []).filter((a) => a.property !== preset.prop),
                                        newAnim,
                                      ],
                                    }
                                  : c
                              ),
                            };
                          });
                          applyChangeWithHistory({
                            ...initializedProject,
                            timeline: { ...initializedProject.timeline!, tracks: updatedTracks },
                          });
                        }}
                        className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 hover:border-indigo-500 text-[11px] text-left transition-colors"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeCategory === 'color' && (
              <div className="space-y-3">
                <h3 className="font-semibold text-slate-200 border-b border-slate-800 pb-2">
                  Gradación de Color & Balance
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Exposición</span>
                    <span>0.0</span>
                  </div>
                  <input type="range" min="-100" max="100" defaultValue="0" className="w-full accent-indigo-500" />
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Saturación</span>
                    <span>100%</span>
                  </div>
                  <input type="range" min="0" max="200" defaultValue="100" className="w-full accent-indigo-500" />
                </div>
              </div>
            )}

            {activeCategory === 'efectos' && (
              <div className="space-y-2 text-slate-400">
                <h3 className="font-semibold text-slate-200 border-b border-slate-800 pb-2">
                  Efectos Ópticos Cinemáticos
                </h3>
                <p className="text-[11px]">
                  Viñeta cinematográfica, grano de película y superposiciones de luz procedimentales aplicadas en Canvas 2D.
                </p>
              </div>
            )}

            {activeCategory === 'filtros' && (
              <div className="space-y-2">
                <h3 className="font-semibold text-slate-200 border-b border-slate-800 pb-2">
                  Filtros Estilísticos
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {['Neutro', 'Cinematográfico', 'Documental Cálido', 'Noir'].map((f) => (
                    <button key={f} className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 hover:border-slate-700">
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeCategory === 'capas' && (
              <div className="space-y-2">
                <h3 className="font-semibold text-slate-200 border-b border-slate-800 pb-2">
                  Capas Superpuestas
                </h3>
                <p className="text-[11px] text-slate-400">
                  Gestión de superposición V1 Fondo, V2 Overlays gráficos y T1 Subtítulos.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
