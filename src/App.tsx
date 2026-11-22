// Shell de la aplicación: pantalla de inicio + editor con barra lateral.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Project } from './types';
import { createEmptyProject } from './data/newProject';
import {
  deleteProjectFromStorage,
  getAllProjectsFromStorage,
  getProjectFromStorage,
  saveProjectToStorage,
} from './services/storage/db';
import { VideoPlayer } from './components/VideoPlayer';
import { HomeScreen } from './components/HomeScreen';
import { Modal } from './components/Modal';
import {
  ExportFormatInfo,
  VideoExporter,
  buildExportFileName,
  describeExportFormat,
  projectDurationSeconds,
} from './engine/exporter';
import { findMusicAsset, findNarrationAsset } from './engine/audioTrack';
import { resolveSceneMediaUrls } from './engine/mediaResolver';
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
  Search,
  Settings,
} from 'lucide-react';

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
  musicAssetName: string | null;
  sfxAssetNames: string[];
  usedWebCodecs: boolean;
}

interface ExportDialogData {
  format: ExportFormatInfo;
  narrationName: string | null;
  musicName: string | null;
  sfxCount: number;
  durationSeconds: number;
  totalFrames: number;
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
  const [isPreparingExport, setIsPreparingExport] = useState(false);

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

  /** Autoguardado con 1 segundo de debounce para no escribir en cada tecla. */
  const handleUpdateProject = useCallback(
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

  const flushPendingSave = useCallback(async () => {
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    const pending = pendingProjectRef.current;
    pendingProjectRef.current = null;
    if (pending) await persistProject(pending);
  }, [persistProject]);

  const handleCreateProject = useCallback(async (title: string) => {
    const created = createEmptyProject(title);
    setProject(created);
    setActiveSection('guion');
    setExportedVideo(null);
    setSaveStatus('saved');
    setSaveError(null);
    await persistProject(created);
  }, [persistProject]);

  const handleOpenProject = useCallback(async (id: string) => {
    await flushPendingSave();
    const stored = await getProjectFromStorage(id);
    if (!stored) {
      setSaveError('No se encontró el proyecto seleccionado en el almacenamiento local.');
      return;
    }
    setProject(await resolveSceneMediaUrls(stored));
    setActiveSection('guion');
    setExportedVideo(null);
    setSaveStatus('saved');
    setSaveError(null);
  }, [flushPendingSave]);

  const handleRenameProject = useCallback(
    async (id: string, title: string) => {
      const stored = await getProjectFromStorage(id);
      if (!stored) return;
      const updated = { ...stored, title };
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
      if (project?.id === id) {
        setProject(null);
        setExportedVideo(null);
      }
      void refreshProjects();
    },
    [project?.id, refreshProjects]
  );

  const handleBackHome = useCallback(() => {
    void flushPendingSave();
    setProject(null);
    setExportedVideo(null);
    setSaveError(null);
    void refreshProjects();
  }, [flushPendingSave, refreshProjects]);

  // Al cerrar la pestaña se intenta guardar lo que quede pendiente.
  useEffect(() => {
    const handler = () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
        const pending = pendingProjectRef.current;
        if (pending) void saveProjectToStorage(pending);
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  const openExportDialog = useCallback(async () => {
    if (!project) return;
    setIsPreparingExport(true);
    try {
      const narrationAsset = findNarrationAsset(project);
      const musicAsset = findMusicAsset(project);
      const sfxCount = project.script.scenes.filter((scene) => scene.sfxAssetId).length;
      const durationSeconds = projectDurationSeconds(project);
      const format = await describeExportFormat(
        project,
        Boolean(narrationAsset || musicAsset || sfxCount > 0)
      );
      setExportDialog({
        format,
        narrationName: narrationAsset ? narrationAsset.name : null,
        musicName: musicAsset ? musicAsset.name : null,
        sfxCount,
        durationSeconds,
        totalFrames: Math.round(durationSeconds * format.fps),
      });
    } finally {
      setIsPreparingExport(false);
    }
  }, [project]);

  const handleExportVideo = useCallback(async () => {
    if (!project) return;
    setExportDialog(null);

    try {
      setIsExporting(true);
      setExportedVideo(null);
      setExportProgress(0);
      setExportMessage('Preparando exportación...');

      const result = await VideoExporter.exportProjectVideo(project, (progress, message) => {
        setExportProgress(progress);
        setExportMessage(message);
      });

      setExportedVideo({
        url: URL.createObjectURL(result.blob),
        extension: result.extension,
        narrationAssetName: result.narrationAssetName,
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
  }, [project]);

  if (!project) {
    return (
      <HomeScreen
        projects={projects}
        onCreateProject={(title) => {
          void handleCreateProject(title);
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
            <IdeaLab project={project} onUpdateProject={handleUpdateProject} />
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
                  {exportedVideo.musicAssetName ? ` · música: ${exportedVideo.musicAssetName}` : ''}
                  {exportedVideo.sfxAssetNames.length > 0
                    ? ` · ${exportedVideo.sfxAssetNames.length} efecto(s)`
                    : ''}
                </p>
                <div className="flex items-center gap-2">
                  <a
                    href={exportedVideo.url}
                    download={buildExportFileName(project, exportedVideo.extension)}
                    className="btn-primary flex-1"
                  >
                    <Download className="w-4 h-4" />
                    <span>Descargar .{exportedVideo.extension}</span>
                  </a>
                  <button onClick={() => setExportedVideo(null)} className="btn-secondary">
                    Cerrar
                  </button>
                </div>
              </>
            )
          )}
        </div>
      )}

      {/* Modal previo a la exportación con los datos reales */}
      {exportDialog && (
        <Modal
          title="Confirmar exportación"
          onClose={() => setExportDialog(null)}
          footer={
            <>
              <button onClick={() => setExportDialog(null)} className="btn-secondary">
                Cancelar
              </button>
              <button
                onClick={() => {
                  void handleExportVideo();
                }}
                disabled={exportDialog.durationSeconds <= 0}
                className="btn-primary"
              >
                <Download className="w-4 h-4" />
                <span>Exportar</span>
              </button>
            </>
          }
        >
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-400">Resolución real</dt>
              <dd className="text-slate-100 font-mono">
                {exportDialog.format.width} × {exportDialog.format.height} px
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
              <dt className="text-slate-400">Narración</dt>
              <dd className="text-slate-100 text-right">
                {exportDialog.narrationName ? exportDialog.narrationName : 'Sin narración'}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-400">Música de fondo</dt>
              <dd className="text-slate-100 text-right">
                {exportDialog.musicName ? exportDialog.musicName : 'Sin música'}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-400">Efectos por escena</dt>
              <dd className="text-slate-100 text-right">
                {exportDialog.sfxCount > 0 ? `${exportDialog.sfxCount} asignado(s)` : 'Ninguno'}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-400">Duración</dt>
              <dd className="text-slate-100 font-mono">
                {exportDialog.durationSeconds} s · {exportDialog.totalFrames} cuadros · {exportDialog.format.fps}{' '}
                fps
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-400">Nombre del archivo</dt>
              <dd className="text-slate-100 font-mono text-right break-all">
                {buildExportFileName(project, 'webm')}
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

          {!exportDialog.format.usedWebCodecs && (
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
