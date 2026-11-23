// Shell de la aplicación: pantalla de inicio + editor con barra lateral.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Project } from './types';
import { createEmptyProject } from './data/newProject';
import {
  deleteHistoryFromStorage,
  deleteProjectFromStorage,
  getAllProjectsFromStorage,
  getHistoryFromStorage,
  getProjectFromStorage,
  saveHistoryToStorage,
  saveProjectToStorage,
} from './services/storage/db';
import { VideoPlayer } from './components/VideoPlayer';
import { HomeScreen } from './components/HomeScreen';
import { Modal } from './components/Modal';
import { StoryboardPreview } from './components/StoryboardPreview';
import { ProjectStats } from './components/ProjectStats';
import {
  ExportContainer,
  ExportFormatInfo,
  VideoExporter,
  buildExportFileName,
  describeExportFormat,
  projectDurationSeconds,
} from './engine/exporter';
import { findMusicAsset, findNarrationAsset, projectHasAudio } from './engine/audioTrack';
import { buildSrt, buildSrtFileName, collectSrtCues } from './engine/srt';
import { resolveSceneMediaUrls } from './engine/mediaResolver';
import {
  HISTORY_LIMIT,
  HistoryState,
  canRedo,
  canUndo,
  createHistory,
  pushHistory,
  redo,
  undo,
} from './services/history/history';
import { IdeaLab } from './modules/IdeaLab';
import { ResearchModule } from './modules/ResearchModule';
import { ScriptWorkshop } from './modules/ScriptWorkshop';
import { StoryboardModule } from './modules/StoryboardModule';
import { MediaLibraryModule } from './modules/MediaLibraryModule';
import { SettingsModule } from './modules/SettingsModule';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileText,
  Film,
  FolderOpen,
  Home,
  Lightbulb,
  Loader2,
  MonitorPlay,
  RefreshCw,
  Redo2,
  Search,
  Settings,
  Undo2,
} from 'lucide-react';

/** Opciones de historial: una clave agrupa las pulsaciones seguidas en un solo paso. */
export interface HistoryOptions {
  coalesceKey?: string;
}

const SECTIONS = [
  { id: 'guion', label: 'Guion', icon: FileText },
  { id: 'storyboard', label: 'Storyboard', icon: Film },
  { id: 'biblioteca', label: 'Biblioteca', icon: FolderOpen },
  { id: 'ideas', label: 'Ideas', icon: Lightbulb },
  { id: 'investigacion', label: 'Investigación', icon: Search },
  { id: 'monitor', label: 'Monitor', icon: MonitorPlay },
  { id: 'ajustes', label: 'Ajustes', icon: Settings },
] as const;

type SectionId = (typeof SECTIONS)[number]['id'];
type SaveStatus = 'saved' | 'saving' | 'error';

interface ExportedVideo {
  url: string;
  extension: 'webm' | 'mp4';
  narrationAssetName: string | null;
  sceneNarrationCount: number;
  musicAssetName: string | null;
  sfxAssetNames: string[];
  usedWebCodecs: boolean;
}

interface ExportDialogData {
  container: ExportContainer;
  format: ExportFormatInfo;
  subtitleCount: number;
  durationSeconds: number;
}

function describeSaveError(error: unknown): string {
  if (error instanceof DOMException && (error.name === 'QuotaExceededError' || error.code === 22)) {
    return 'No hay espacio suficiente en el navegador (cuota de almacenamiento superada). Elimina recursos o proyectos para liberar espacio.';
  }
  return 'No se pudo guardar el proyecto en el almacenamiento local del navegador.';
}

const SaveIndicator: React.FC<{ status: SaveStatus }> = ({ status }) => {
  if (status === 'saving') {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-amber-300">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Guardando...</span>
      </span>
    );
  }

  if (status === 'error') {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-rose-300">
        <AlertCircle className="w-4 h-4" />
        <span>Error al guardar</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-emerald-300">
      <CheckCircle2 className="w-4 h-4" />
      <span>Guardado ✓</span>
    </span>
  );
};

export const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [activeSection, setActiveSection] = useState<SectionId>('guion');

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [saveError, setSaveError] = useState<string | null>(null);

  // Exportación
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportMessage, setExportMessage] = useState('');
  const [exportedVideo, setExportedVideo] = useState<ExportedVideo | null>(null);
  const [exportDialog, setExportDialog] = useState<ExportDialogData | null>(null);
  const [exportContainer, setExportContainer] = useState<ExportContainer>('webm');
  const [isPreparingExport, setIsPreparingExport] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const refreshProjects = useCallback(async () => {
    try {
      const stored = await getAllProjectsFromStorage();
      setProjects(stored.sort((a, b) => b.updatedAt - a.updatedAt));
    } catch (error) {
      console.error('No se pudo leer la lista de proyectos:', error);
    }
  }, []);

  useEffect(() => {
    void refreshProjects();
  }, [refreshProjects]);

  const saveTimerRef = useRef<number | null>(null);
  const pendingProjectRef = useRef<Project | null>(null);

  // Historial de deshacer/rehacer (hasta 50 pasos).
  const historyRef = useRef<HistoryState<Project> | null>(null);
  const lastHistoryKeyRef = useRef<{ key: string; at: number } | null>(null);
  const historyTimerRef = useRef<number | null>(null);
  const projectIdRef = useRef<string | null>(null);
  projectIdRef.current = project?.id ?? null;
  const [historyCounts, setHistoryCounts] = useState({ undo: 0, redo: 0 });

  const syncHistoryCounts = useCallback(() => {
    const history = historyRef.current;
    setHistoryCounts({
      undo: history ? history.past.length : 0,
      redo: history ? history.future.length : 0,
    });
  }, []);

  const resetHistory = useCallback(
    (value: Project) => {
      historyRef.current = createHistory(value);
      lastHistoryKeyRef.current = null;
      syncHistoryCounts();
    },
    [syncHistoryCounts]
  );

  /** Guarda el historial en IndexedDB (un registro por proyecto, 50 pasos). */
  const flushHistorySave = useCallback(async () => {
    if (historyTimerRef.current !== null) {
      window.clearTimeout(historyTimerRef.current);
      historyTimerRef.current = null;
    }
    const history = historyRef.current;
    const projectId = projectIdRef.current;
    if (!history || !projectId) return;

    try {
      await saveHistoryToStorage(projectId, {
        past: history.past,
        present: history.present,
        future: history.future,
      });
    } catch (error) {
      console.error('No se pudo guardar el historial en el almacenamiento local:', error);
    }
  }, []);

  /** Programa el guardado del historial para no escribir en cada tecla. */
  const scheduleHistorySave = useCallback(() => {
    if (historyTimerRef.current !== null) window.clearTimeout(historyTimerRef.current);
    historyTimerRef.current = window.setTimeout(() => {
      historyTimerRef.current = null;
      void flushHistorySave();
    }, 700);
  }, [flushHistorySave]);

  const persistProject = useCallback(async (updated: Project) => {
    setSaveStatus('saving');
    try {
      await saveProjectToStorage(updated);
      setSaveStatus('saved');
      setSaveError(null);
      void refreshProjects();
    } catch (error) {
      console.error('Error al guardar el proyecto:', error);
      setSaveStatus('error');
      setSaveError(describeSaveError(error));
    }
  }, [refreshProjects]);

  /** Aplica un proyecto y programa el autoguardado con 1 segundo de debounce. */
  const applyProject = useCallback(
    (updated: Project) => {
      setProject(updated);
      pendingProjectRef.current = updated;
      setSaveStatus('saving');

      if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = window.setTimeout(() => {
        saveTimerRef.current = null;
        const pending = pendingProjectRef.current;
        pendingProjectRef.current = null;
        if (pending) void persistProject(pending);
      }, 1000);
    },
    [persistProject]
  );

  /** Acción del usuario: registra el estado anterior en el historial y aplica el nuevo. */
  const handleUpdateProject = useCallback(
    (updated: Project, options?: HistoryOptions) => {
      const history = historyRef.current;
      if (history) {
        const now = Date.now();
        const key = options?.coalesceKey;
        const last = lastHistoryKeyRef.current;
        const coalesce = Boolean(key && last && last.key === key && now - last.at < 1000);
        historyRef.current = coalesce
          ? { ...history, present: updated, future: [] }
          : pushHistory(history, updated);
        lastHistoryKeyRef.current = key ? { key, at: now } : null;
        syncHistoryCounts();
        scheduleHistorySave();
      }
      applyProject(updated);
    },
    [applyProject, scheduleHistorySave, syncHistoryCounts]
  );

  const handleUndo = useCallback(() => {
    const history = historyRef.current;
    if (!history || !canUndo(history)) return;
    const restored = undo(history);
    historyRef.current = restored;
    lastHistoryKeyRef.current = null;
    syncHistoryCounts();
    scheduleHistorySave();
    applyProject(restored.present);
  }, [applyProject, scheduleHistorySave, syncHistoryCounts]);

  const handleRedo = useCallback(() => {
    const history = historyRef.current;
    if (!history || !canRedo(history)) return;
    const restored = redo(history);
    historyRef.current = restored;
    lastHistoryKeyRef.current = null;
    syncHistoryCounts();
    scheduleHistorySave();
    applyProject(restored.present);
  }, [applyProject, scheduleHistorySave, syncHistoryCounts]);

  // Ctrl+Z deshace; Ctrl+Y o Ctrl+Shift+Z rehace.
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (!historyRef.current) return;
      if (!(event.ctrlKey || event.metaKey)) return;
      const key = event.key.toLowerCase();
      if (key === 'z' && !event.shiftKey) {
        event.preventDefault();
        handleUndo();
      } else if (key === 'y' || (key === 'z' && event.shiftKey)) {
        event.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleUndo, handleRedo]);

  const flushPendingSave = useCallback(async () => {
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    const pending = pendingProjectRef.current;
    pendingProjectRef.current = null;
    if (pending) await persistProject(pending);
  }, [persistProject]);

  const handleCreateProject = useCallback(async (title: string, templateId?: string | null) => {
    const created = createEmptyProject(title, templateId);
    resetHistory(created);
    setProject(created);
    setActiveSection('guion');
    setExportedVideo(null);
    setSaveStatus('saved');
    setSaveError(null);
    await persistProject(created);
  }, [persistProject, resetHistory]);

  const handleOpenProject = useCallback(async (id: string) => {
    await flushPendingSave();
    await flushHistorySave();
    const stored = await getProjectFromStorage(id);
    if (!stored) {
      setSaveError('No se encontró el proyecto seleccionado en el almacenamiento local.');
      return;
    }

    const storedHistory = await getHistoryFromStorage(id).catch(() => null);

    if (storedHistory && storedHistory.present?.id === id) {
      // Restaura el historial guardado y revalida las URLs de imagen/video de
      // cada instantánea (los object URLs mueren al recargar la página).
      const [past, present, future] = await Promise.all([
        Promise.all(storedHistory.past.map((snapshot) => resolveSceneMediaUrls(snapshot))),
        resolveSceneMediaUrls(storedHistory.present),
        Promise.all(storedHistory.future.map((snapshot) => resolveSceneMediaUrls(snapshot))),
      ]);

      historyRef.current = {
        past: past.slice(Math.max(0, past.length - HISTORY_LIMIT)),
        present,
        future: future.slice(0, HISTORY_LIMIT),
      };
      lastHistoryKeyRef.current = null;
      syncHistoryCounts();
      setProject(present);
      // El presente del historial puede ser más reciente que el proyecto guardado.
      void persistProject(present);
    } else {
      const resolved = await resolveSceneMediaUrls(stored);
      resetHistory(resolved);
      setProject(resolved);
    }

    setActiveSection('guion');
    setExportedVideo(null);
    setSaveStatus('saved');
    setSaveError(null);
  }, [flushHistorySave, flushPendingSave, persistProject, resetHistory, syncHistoryCounts]);

  const handleRenameProject = useCallback(
    async (id: string, title: string) => {
      const stored = await getProjectFromStorage(id);
      if (!stored) return;
      const updated = { ...stored, title, updatedAt: Date.now() };
      setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)));
      await saveProjectToStorage(updated);
      if (project?.id === id) setProject(updated);
      void refreshProjects();
    },
    [project?.id, refreshProjects]
  );

  const handleDeleteProject = useCallback(
    async (id: string) => {
      await deleteProjectFromStorage(id);
      await deleteHistoryFromStorage(id).catch(() => undefined);
      if (project?.id === id) {
        setProject(null);
        historyRef.current = null;
        syncHistoryCounts();
        setExportedVideo(null);
      }
      void refreshProjects();
    },
    [project?.id, refreshProjects]
  );

  const handleBackHome = useCallback(() => {
    void flushPendingSave();
    void flushHistorySave();
    setProject(null);
    historyRef.current = null;
    syncHistoryCounts();
    setExportedVideo(null);
    setSaveError(null);
    void refreshProjects();
  }, [flushHistorySave, flushPendingSave, refreshProjects, syncHistoryCounts]);

  // Al cerrar la pestaña se intenta guardar lo que quede pendiente.
  useEffect(() => {
    const handler = () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
        const pending = pendingProjectRef.current;
        if (pending) void saveProjectToStorage(pending);
      }

      // El historial pendiente también se intenta guardar al cerrar la pestaña.
      if (historyTimerRef.current !== null) {
        window.clearTimeout(historyTimerRef.current);
        historyTimerRef.current = null;
      }
      const history = historyRef.current;
      const projectId = projectIdRef.current;
      if (history && projectId) {
        void saveHistoryToStorage(projectId, {
          past: history.past,
          present: history.present,
          future: history.future,
        });
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  /** Datos reales del proyecto + el formato que producirá este navegador. */
  const buildExportDialog = useCallback(
    async (container: ExportContainer): Promise<ExportDialogData | null> => {
      if (!project) return null;
      const durationSeconds = projectDurationSeconds(project);
      const format = await describeExportFormat(project, projectHasAudio(project), container);
      return {
        container,
        format,
        subtitleCount: collectSrtCues(project).length,
        durationSeconds,
      };
    },
    [project]
  );

  const openExportDialog = useCallback(async () => {
    if (!project) return;
    setIsPreparingExport(true);
    try {
      setExportDialog(await buildExportDialog(exportContainer));
    } finally {
      setIsPreparingExport(false);
    }
  }, [buildExportDialog, exportContainer, project]);

  /** Cambia WebM/MP4 y vuelve a preguntar al navegador qué formato real puede hacer. */
  const changeExportContainer = useCallback(
    async (container: ExportContainer) => {
      setExportContainer(container);
      setIsPreparingExport(true);
      try {
        setExportDialog(await buildExportDialog(container));
      } finally {
        setIsPreparingExport(false);
      }
    },
    [buildExportDialog]
  );

  const handleExportVideo = useCallback(async () => {
    if (!project) return;
    setExportDialog(null);
    setIsPreviewOpen(false);

    try {
      setIsExporting(true);
      setExportedVideo(null);
      setExportProgress(0);
      setExportMessage('Preparando exportación...');

      const result = await VideoExporter.exportProjectVideo(
        project,
        (progress, message) => {
          setExportProgress(progress);
          setExportMessage(message);
        },
        { container: exportContainer }
      );

      setExportedVideo({
        url: URL.createObjectURL(result.blob),
        extension: result.extension,
        narrationAssetName: result.narrationAssetName,
        sceneNarrationCount: result.sceneNarrationCount,
        musicAssetName: result.musicAssetName,
        sfxAssetNames: result.sfxAssetNames,
        usedWebCodecs: result.usedWebCodecs,
      });
    } catch (error) {
      console.error('Error durante la exportación:', error);
      const message = error instanceof Error ? error.message : 'Error desconocido.';
      setSaveError(`No se pudo exportar el video: ${message}`);
    } finally {
      setIsExporting(false);
    }
  }, [exportContainer, project]);

  /** Descarga los subtítulos de todo el proyecto como .srt con tiempos absolutos. */
  const handleDownloadSrt = useCallback(() => {
    if (!project) return;
    const srt = buildSrt(project);
    if (!srt) {
      setSaveError('El proyecto no tiene subtítulos que exportar. Añádelos en el taller de guion.');
      return;
    }

    const blob = new Blob([srt], { type: 'application/x-subrip;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = buildSrtFileName(project);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, [project]);

  if (!project) {
    return (
      <HomeScreen
        projects={projects}
        onCreateProject={(title, templateId) => {
          void handleCreateProject(title, templateId);
        }}
        onOpenProject={(id) => {
          void handleOpenProject(id);
        }}
        onRenameProject={(id, title) => {
          void handleRenameProject(id, title);
        }}
        onDeleteProject={(id) => {
          void handleDeleteProject(id);
        }}
      />
    );
  }

  const narrationAsset = findNarrationAsset(project);
  const musicAsset = findMusicAsset(project);

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Header fijo: proyecto, estado de guardado y exportación */}
      <header className="shrink-0 bg-slate-900 border-b border-slate-800 px-4 py-3 flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button onClick={handleBackHome} className="btn-secondary" title="Volver al inicio">
            <Home className="w-4 h-4" />
            <span>Inicio</span>
          </button>

          <div className="min-w-0">
            <label htmlFor="project-title" className="block text-slate-500">
              Proyecto
            </label>
            <input
              id="project-title"
              value={project.title}
              onChange={(event) => handleUpdateProject({ ...project, title: event.target.value })}
              className="bg-transparent border-b border-transparent hover:border-slate-700 focus:border-indigo-500 focus:outline-none text-[16px] font-semibold text-slate-100 w-full max-w-md truncate"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleUndo}
              disabled={historyCounts.undo === 0}
              className="btn-secondary"
              title="Deshacer (Ctrl+Z)"
              aria-label={`Deshacer (${historyCounts.undo} pasos)`}
            >
              <Undo2 className="w-4 h-4" />
              <span className="font-mono text-xs">{historyCounts.undo}</span>
            </button>
            <button
              onClick={handleRedo}
              disabled={historyCounts.redo === 0}
              className="btn-secondary"
              title="Rehacer (Ctrl+Y)"
              aria-label={`Rehacer (${historyCounts.redo} pasos)`}
            >
              <Redo2 className="w-4 h-4" />
              <span className="font-mono text-xs">{historyCounts.redo}</span>
            </button>
          </div>
          <SaveIndicator status={saveStatus} />
          <button
            onClick={() => {
              void openExportDialog();
            }}
            disabled={isExporting || isPreparingExport}
            className="btn-primary"
          >
            {isExporting || isPreparingExport ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>{isExporting ? 'Exportando...' : 'Exportar video'}</span>
          </button>
        </div>
      </header>

      {saveError && (
        <div className="shrink-0 bg-rose-950/70 border-b border-rose-800 px-4 py-2 flex items-start justify-between gap-3">
          <span className="text-sm text-rose-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{saveError}</span>
          </span>
          <button onClick={() => setSaveError(null)} className="text-rose-300 hover:text-rose-100 text-sm">
            Cerrar
          </button>
        </div>
      )}

      <div className="flex-1 flex min-h-0">
        {/* Barra lateral de navegación */}
        <aside className="w-56 shrink-0 bg-slate-900/60 border-r border-slate-800 p-4 space-y-1 overflow-y-auto">
          <p className="etiqueta px-2 pb-2">Secciones</p>
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{section.label}</span>
              </button>
            );
          })}

          <div className="pt-4 mt-4 border-t border-slate-800 space-y-1 text-sm text-slate-400">
            <p className="px-2">
              {project.script.scenes.length} escena(s) · {projectDurationSeconds(project)} s
            </p>
            <p className="px-2">
              Narración: {narrationAsset ? narrationAsset.name : 'sin asignar'}
            </p>
            <p className="px-2">
              Música: {musicAsset ? musicAsset.name : 'sin asignar'}
            </p>
          </div>
        </aside>

        {/* Panel derecho: solo la sección activa */}
        <main className="flex-1 min-w-0 overflow-y-auto p-4">
          {activeSection === 'guion' && (
            <ScriptWorkshop project={project} onUpdateProject={handleUpdateProject} />
          )}
          {activeSection === 'storyboard' && <StoryboardModule project={project} />}
          {activeSection === 'biblioteca' && (
            <MediaLibraryModule project={project} onUpdateProject={handleUpdateProject} />
          )}
          {activeSection === 'ideas' && (
            <IdeaLab
              project={project}
              onUpdateProject={handleUpdateProject}
              onGoToScript={() => setActiveSection('guion')}
              onOpenSettings={() => setActiveSection('ajustes')}
            />
          )}
          {activeSection === 'investigacion' && (
            <ResearchModule project={project} onUpdateProject={handleUpdateProject} />
          )}
          {activeSection === 'ajustes' && (
            <SettingsModule project={project} onUpdateProject={handleUpdateProject} />
          )}
          {activeSection === 'monitor' && (
            <div className="max-w-4xl space-y-4">
              <h2 className="titulo-seccion">Monitor de previsualización</h2>
              <VideoPlayer project={project} />
              <div className="card space-y-1 text-sm text-slate-400">
                <p>
                  Resolución: {project.settings.resolution.width} × {project.settings.resolution.height} px a{' '}
                  {project.settings.fps} fps.
                </p>
                <p>La vista previa dibuja cuadro a cuadro el mismo motor que usa la exportación.</p>
                <p>
                  El Monitor reproduce la misma mezcla de audio que la exportación (narración, música con
                  ducking y efectos por escena). El botón de silencio corta el sonido de verdad y la
                  reproducción se detiene al pausar y se recoloca al mover la barra de tiempo.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Progreso / resultado de exportación, visible en cualquier sección */}
      {(isExporting || exportedVideo) && (
        <div className="fixed bottom-4 right-4 z-50 w-80 card space-y-3 shadow-2xl">
          {isExporting ? (
            <>
              <div className="flex items-center justify-between text-sm text-slate-300">
                <span className="truncate pr-2">{exportMessage}</span>
                <span className="font-mono">{exportProgress}%</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                <div className="bg-indigo-500 h-full transition-all" style={{ width: `${exportProgress}%` }} />
              </div>
            </>
          ) : (
            exportedVideo && (
              <>
                <p className="text-sm font-semibold text-emerald-300">Video exportado</p>
                <p className="text-sm text-slate-400">
                  {exportedVideo.extension === 'webm' ? 'WebM' : 'MP4'} ·{' '}
                  {exportedVideo.usedWebCodecs ? 'WebCodecs (cuadro por cuadro)' : 'MediaRecorder (tiempo real)'} ·{' '}
                  {exportedVideo.narrationAssetName
                    ? `narración: ${exportedVideo.narrationAssetName}`
                    : 'sin narración'}
                  {exportedVideo.sceneNarrationCount > 0
                    ? ` · ${exportedVideo.sceneNarrationCount} voz(es) por escena`
                    : ''}
                  {exportedVideo.musicAssetName ? ` · música: ${exportedVideo.musicAssetName}` : ''}
                  {exportedVideo.sfxAssetNames.length > 0
                    ? ` · ${exportedVideo.sfxAssetNames.length} efecto(s)`
                    : ''}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <a
                    href={exportedVideo.url}
                    download={buildExportFileName(project, exportedVideo.extension)}
                    className="btn-primary flex-1"
                  >
                    <Download className="w-4 h-4" />
                    <span>Descargar .{exportedVideo.extension}</span>
                  </a>
                  <button
                    onClick={handleDownloadSrt}
                    className="btn-secondary"
                    title="Descargar los subtítulos de todas las escenas como .srt"
                  >
                    <FileText className="w-4 h-4" />
                    <span>.srt</span>
                  </button>
                  <button onClick={() => setExportedVideo(null)} className="btn-secondary">
                    Cerrar
                  </button>
                </div>
              </>
            )
          )}
        </div>
      )}

      {/* Previsualización del storyboard antes de exportar (fase 31) */}
      {isPreviewOpen && project && (
        <Modal
          title="Previsualización antes de exportar"
          widthClass="max-w-3xl"
          onClose={() => setIsPreviewOpen(false)}
          footer={
            <button onClick={() => setIsPreviewOpen(false)} className="btn-secondary">
              Cancelar
            </button>
          }
        >
          <StoryboardPreview
            project={project}
            onExport={() => {
              void handleExportVideo();
            }}
          />
        </Modal>
      )}

      {/* Modal previo a la exportación con los datos reales */}
      {exportDialog && (
        <Modal
          title="Confirmar exportación"
          onClose={() => setExportDialog(null)}
          footer={
            <>
              <button
                onClick={handleDownloadSrt}
                disabled={exportDialog.subtitleCount === 0}
                className="btn-secondary mr-auto"
                title="Descargar los subtítulos de todas las escenas como .srt"
              >
                <FileText className="w-4 h-4" />
                <span>Descargar .srt</span>
              </button>
              <button onClick={() => setExportDialog(null)} className="btn-secondary">
                Cancelar
              </button>
              <button
                onClick={() => {
                  setExportDialog(null);
                  setIsPreviewOpen(true);
                }}
                disabled={exportDialog.durationSeconds <= 0 || !exportDialog.format.supported}
                className="btn-primary"
              >
                <MonitorPlay className="w-4 h-4" />
                <span>Ver preview y exportar</span>
              </button>
            </>
          }
        >
          {/* Resumen calculado con los datos reales del proyecto (fase 35) */}
          <ProjectStats project={project} format={exportDialog.format} />

          <dl className="space-y-2 text-sm">
            <div className="flex justify-between items-center gap-4">
              <dt className="text-slate-400">Contenedor</dt>
              <dd>
                <select
                  data-testid="export-container"
                  aria-label="Contenedor del archivo exportado"
                  value={exportDialog.container}
                  disabled={isPreparingExport}
                  onChange={(event) => {
                    void changeExportContainer(event.target.value as ExportContainer);
                  }}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="webm">WebM · VP9</option>
                  <option value="mp4">MP4 · H.264</option>
                </select>
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-400">Formato real</dt>
              <dd className="text-slate-100 font-mono text-right">
                {exportDialog.format.container} · {exportDialog.format.videoCodec}
                {exportDialog.format.audioCodec === 'sin audio'
                  ? ' · sin audio'
                  : ` · ${exportDialog.format.audioCodec}`}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-400">Modo de codificación</dt>
              <dd className="text-slate-100 text-right">{exportDialog.format.mode}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-400">Subtítulos</dt>
              <dd className="text-slate-100 text-right">
                {exportDialog.subtitleCount > 0
                  ? `${exportDialog.subtitleCount} línea(s) · ${buildSrtFileName(project)}`
                  : 'Ninguno'}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-400">Nombre del archivo</dt>
              <dd className="text-slate-100 font-mono text-right break-all">
                {buildExportFileName(project, exportDialog.container)}
              </dd>
            </div>
          </dl>

          {exportDialog.durationSeconds <= 0 && (
            <p className="text-sm text-rose-300">
              El proyecto no tiene escenas con duración. Añade al menos una escena en el Taller de guion.
            </p>
          )}

          {exportDialog.format.mobileLimited && (
            <p className="text-sm text-amber-300">
              Dispositivo móvil detectado: la exportación se limita a {exportDialog.format.width} ×{' '}
              {exportDialog.format.height} px y {exportDialog.format.fps} fps aunque el proyecto pida más.
            </p>
          )}

          {exportDialog.format.message && (
            <p data-testid="export-format-message" className="text-sm text-rose-300">
              {exportDialog.format.message}
            </p>
          )}

          {!exportDialog.format.usedWebCodecs && exportDialog.format.supported && (
            <p className="text-sm text-amber-300">
              Este navegador no soporta WebCodecs para estos ajustes: la exportación usará MediaRecorder en tiempo
              real y puede tardar lo mismo que la duración del video.
            </p>
          )}
        </Modal>
      )}
    </div>
  );
};
