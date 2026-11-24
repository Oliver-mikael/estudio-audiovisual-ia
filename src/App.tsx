// Shell de la aplicación: pantalla de inicio + editor con barra lateral.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Project } from './types';
import { createEmptyProject } from './data/newProject';
import {
  deleteHistoryFromStorage,
  deleteProjectFromStorage,
  getAllProjectsFromStorage,
  getHistoryFromStorage,
  deleteProjectVersions,
  getProjectFromStorage,
  getProjectVersions,
  saveHistoryToStorage,
  saveProjectToStorage,
  saveProjectVersions,
} from './services/storage/db';
import { VideoPlayer } from './components/VideoPlayer';
import { HomeScreen } from './components/HomeScreen';
import { Modal } from './components/Modal';
import { StoryboardPreview } from './components/StoryboardPreview';
import { Onboarding } from './components/Onboarding';
import { ProjectStats } from './components/ProjectStats';
import { QualityReportPanel } from './components/QualityReport';
import { VersionsPanel } from './components/VersionsPanel';
import { GuidedTour } from './components/GuidedTour';
import { TOUR_STEPS } from './services/tour';
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
import { exportProjectAudio } from './engine/audioExport';
import { resolveSceneMediaUrls } from './engine/mediaResolver';
import { PLAY_PAUSE_EVENT, matchShortcut } from './engine/shortcuts';
import {
  buildShareUrl,
  canShareProject,
  decodeProjectFromShare,
  readSharePayload,
  summarizeSharedProject,
} from './engine/shareLink';
import {
  hasSeenOnboarding,
  markOnboardingSeen,
  shouldShowOnboarding,
} from './services/onboarding';
import {
  Theme,
  applyTheme,
  otherTheme,
  readStoredTheme,
  saveStoredTheme,
} from './services/theme';
import {
  ProjectVersion,
  addVersionSnapshot,
  createVersionSnapshot,
} from './services/versions/versions';
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
  AudioLines,
  CheckCircle2,
  Copy,
  Download,
  FileText,
  Film,
  FolderOpen,
  HelpCircle,
  History,
  Home,
  Lightbulb,
  Loader2,
  Menu,
  Moon,
  MonitorPlay,
  RefreshCw,
  Sun,
  Redo2,
  Search,
  Settings,
  Share2,
  Undo2,
  X,
} from 'lucide-react';

/** Opciones de historial: una clave agrupa las pulsaciones seguidas en un solo paso. */
export interface HistoryOptions {
  coalesceKey?: string;
}

const SECTIONS = [
  { id: 'guion', label: 'Guion', icon: FileText },
  { id: 'storyboard', label: 'Storyboard', icon: Film },
  { id: 'biblioteca', label: 'Biblioteca', icon: FolderOpen },
  { id: 'versiones', label: 'Versiones', icon: History },
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
  audioCodec: string;
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

/** Resultado de «Compartir»: una URL o el motivo por el que no se puede. */
interface ShareDialogData {
  url?: string;
  message?: string;
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
  // La lista de IndexedDB empieza vacía: hasta que termina la lectura no se
  // puede decidir si toca la bienvenida del primer uso (fase 41).
  const [projectsLoaded, setProjectsLoaded] = useState(false);
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [activeSection, setActiveSection] = useState<SectionId>('guion');
  // En pantallas < 768px la barra lateral se muestra como menú hamburguesa
  // (fase 42); en escritorio siempre está visible.
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Menú «Ayuda» y tutorial interactivo de 5 pasos (fase 45).
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [tourStep, setTourStep] = useState(0);

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
  const [isExportingAudio, setIsExportingAudio] = useState(false);
  const [audioNotice, setAudioNotice] = useState<string | null>(null);

  // Compartir como enlace (fase 43) e importación de un enlace recibido.
  const [isSharing, setIsSharing] = useState(false);
  const [shareDialog, setShareDialog] = useState<ShareDialogData | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [sharedProject, setSharedProject] = useState<Project | null>(null);
  const [sharedError, setSharedError] = useState<string | null>(null);

  // Tema claro/oscuro persistido en localStorage (fase 38).
  const [theme, setTheme] = useState<Theme>(() => readStoredTheme());

  useEffect(() => {
    applyTheme(theme);
    saveStoredTheme(theme);
  }, [theme]);

  // El tutorial abre la sección que contiene el elemento de cada paso y cierra
  // el cajón móvil para que el tooltip no quede tapado (fase 45).
  useEffect(() => {
    if (!isTourOpen) return;
    const step = TOUR_STEPS[tourStep];
    if (!step) return;
    if (step.section) setActiveSection(step.section as SectionId);
    setIsSidebarOpen(false);
  }, [isTourOpen, tourStep]);

  const refreshProjects = useCallback(async () => {
    try {
      const stored = await getAllProjectsFromStorage();
      setProjects(stored.sort((a, b) => b.updatedAt - a.updatedAt));
    } catch (error) {
      console.error('No se pudo leer la lista de proyectos:', error);
    } finally {
      setProjectsLoaded(true);
    }
  }, []);

  useEffect(() => {
    void refreshProjects();
  }, [refreshProjects]);

  // Cada proyecto abierto carga sus instantáneas de IndexedDB.
  const openProjectId = project?.id ?? null;
  useEffect(() => {
    if (!openProjectId) {
      versionsRef.current = [];
      setVersions([]);
      return;
    }

    let cancelled = false;
    setVersionsLoading(true);
    getProjectVersions(openProjectId)
      .then((stored) => {
        if (cancelled) return;
        versionsRef.current = stored;
        setVersions(stored);
      })
      .catch((error) => {
        console.error('No se pudieron leer las versiones del proyecto:', error);
      })
      .finally(() => {
        if (!cancelled) setVersionsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [openProjectId]);

  // Enlace compartido en el hash: se decodifica al abrir y se ofrece importar.
  useEffect(() => {
    const payload = readSharePayload(window.location.hash);
    if (!payload) return;
    let cancelled = false;
    decodeProjectFromShare(payload)
      .then((decoded) => {
        if (!cancelled) setSharedProject(decoded);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setSharedError(
            error instanceof Error ? error.message : 'No se pudo leer el proyecto compartido.'
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /** Cierra el aviso del enlace y borra el hash para que no se repita al recargar. */
  const clearSharedLink = useCallback(() => {
    setSharedProject(null);
    setSharedError(null);
    if (window.location.hash) {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    }
  }, []);

  const saveTimerRef = useRef<number | null>(null);
  const pendingProjectRef = useRef<Project | null>(null);

  // Versiones guardadas al exportar (fase 44), máximo 5 por proyecto.
  const [versions, setVersions] = useState<ProjectVersion[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const versionsRef = useRef<ProjectVersion[]>([]);

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

  /** Guarda una instantánea del proyecto exportado y rota las más antiguas. */
  const recordProjectVersion = useCallback(async (source: Project) => {
    const snapshot = createVersionSnapshot(source);
    const next = addVersionSnapshot(versionsRef.current, snapshot);
    versionsRef.current = next;
    setVersions(next);
    try {
      await saveProjectVersions(source.id, next);
    } catch (error) {
      console.error('No se pudo guardar la versión del proyecto:', error);
    }
  }, []);

  /** Restaura una instantánea en el proyecto abierto, conservando su id. */
  const handleRestoreVersion = useCallback(
    (version: ProjectVersion) => {
      if (!project) return;
      handleUpdateProject({ ...version.project, id: project.id, updatedAt: Date.now() });
      setActiveSection('guion');
    },
    [handleUpdateProject, project]
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

  /** Importa el proyecto del enlace como uno nuevo (título y escenas intactos). */
  const handleImportSharedProject = useCallback(async () => {
    if (!sharedProject) return;
    const now = Date.now();
    const imported: Project = {
      ...sharedProject,
      id: `project-${now}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: now,
      updatedAt: now,
    };
    resetHistory(imported);
    setProject(imported);
    setActiveSection('guion');
    setExportedVideo(null);
    setSaveStatus('saved');
    setSaveError(null);
    await persistProject(imported);
    clearSharedLink();
  }, [clearSharedLink, persistProject, resetHistory, sharedProject]);

  /** Genera la URL del proyecto o explica por qué no se puede compartir. */
  const handleShareProject = useCallback(async () => {
    if (!project) return;
    const check = canShareProject(project);
    if (!check.ok) {
      setShareDialog({ message: check.reason ?? 'Este proyecto no se puede compartir como enlace.' });
      return;
    }

    setIsSharing(true);
    setShareCopied(false);
    try {
      const url = await buildShareUrl(project, window.location.href);
      setShareDialog({ url });
    } catch (error) {
      setShareDialog({
        message: error instanceof Error ? error.message : 'No se pudo generar el enlace del proyecto.',
      });
    } finally {
      setIsSharing(false);
    }
  }, [project]);

  const handleCopyShareUrl = useCallback(async () => {
    if (!shareDialog?.url) return;
    try {
      await navigator.clipboard.writeText(shareDialog.url);
      setShareCopied(true);
    } catch {
      setShareDialog((current) => (current ? { ...current, message: 'Copia la URL manualmente desde el campo.' } : current));
    }
  }, [shareDialog?.url]);

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
      await deleteProjectVersions(id).catch(() => undefined);
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

  /** Abre el tutorial desde el primer paso, cerrando el menú de Ayuda. */
  const startTour = useCallback(() => {
    setIsHelpOpen(false);
    setTourStep(0);
    setIsTourOpen(true);
  }, []);

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

  /**
   * Atajos globales (fase 39): Espacio reproduce/pausa el Monitor, Ctrl+E abre
   * exportar, Ctrl+Z deshace, Ctrl+Shift+Z (o Ctrl+Y) rehace y Escape cierra el
   * modal abierto.
   */
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (!project && !exportDialog && !isPreviewOpen) return;
      const action = matchShortcut(event, event.target);
      if (!action) return;

      if (action === 'escape') {
        if (exportDialog) {
          event.preventDefault();
          setExportDialog(null);
        } else if (isPreviewOpen) {
          event.preventDefault();
          setIsPreviewOpen(false);
        }
        // Los diálogos propios de cada módulo se cierran con el manejador de Modal.
        return;
      }

      if (!project) return;

      if (action === 'undo' || action === 'redo') {
        if (!historyRef.current) return;
        event.preventDefault();
        if (action === 'undo') handleUndo();
        else handleRedo();
        return;
      }

      if (action === 'export') {
        event.preventDefault();
        if (isExporting || isPreparingExport || exportDialog || isPreviewOpen) return;
        void openExportDialog();
        return;
      }

      if (action === 'play-pause') {
        if (activeSection !== 'monitor') return;
        event.preventDefault();
        window.dispatchEvent(new Event(PLAY_PAUSE_EVENT));
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [
    activeSection,
    exportDialog,
    handleRedo,
    handleUndo,
    isExporting,
    isPreparingExport,
    isPreviewOpen,
    openExportDialog,
    project,
  ]);

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
        audioCodec: result.audioCodec,
        narrationAssetName: result.narrationAssetName,
        sceneNarrationCount: result.sceneNarrationCount,
        musicAssetName: result.musicAssetName,
        sfxAssetNames: result.sfxAssetNames,
        usedWebCodecs: result.usedWebCodecs,
      });

      // Cada exportación deja una instantánea en «Versiones» (fase 44).
      await recordProjectVersion(project);
    } catch (error) {
      console.error('Error durante la exportación:', error);
      const message = error instanceof Error ? error.message : 'Error desconocido.';
      setSaveError(`No se pudo exportar el video: ${message}`);
    } finally {
      setIsExporting(false);
    }
  }, [exportContainer, project, recordProjectVersion]);

  /**
   * Mezcla narración + música (+ efectos) con OfflineAudioContext y descarga el
   * resultado como WAV de 48 kHz, sin generar video (fase 36).
   */
  const handleExportAudio = useCallback(async () => {
    if (!project) return;
    setIsExportingAudio(true);
    setAudioNotice(null);
    try {
      const result = await exportProjectAudio(project);
      const url = URL.createObjectURL(result.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      setAudioNotice(
        `Audio exportado: ${result.fileName} · ${result.durationSeconds.toFixed(2)} s · ${result.sampleRate} Hz · ${result.channelCount} canales.`
      );
    } catch (error) {
      setSaveError(
        `No se pudo exportar el audio: ${error instanceof Error ? error.message : 'error desconocido.'}`
      );
    } finally {
      setIsExportingAudio(false);
    }
  }, [project]);

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
    const showOnboarding =
      !onboardingDismissed &&
      shouldShowOnboarding({
        projectsLoaded,
        projectCount: projects.length,
        alreadySeen: hasSeenOnboarding(),
      });

    const closeOnboarding = () => {
      setOnboardingDismissed(true);
      markOnboardingSeen();
    };

    return (
      <>
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
        {showOnboarding && (
          <Onboarding
            onClose={closeOnboarding}
            onCreateProject={() => {
              closeOnboarding();
              document.getElementById('new-project-title')?.focus();
            }}
          />
        )}

        {/* Enlace compartido recibido (fase 43) */}
        {sharedProject && (
          <Modal
            title="Proyecto compartido"
            onClose={clearSharedLink}
            footer={
              <>
                <button onClick={clearSharedLink} className="btn-secondary">
                  Descartar
                </button>
                <button
                  onClick={() => {
                    void handleImportSharedProject();
                  }}
                  className="btn-primary"
                  data-testid="import-shared-project"
                >
                  Importar proyecto
                </button>
              </>
            }
          >
            <p className="text-sm text-slate-300">
              Alguien ha compartido contigo un proyecto por enlace. Se importará como un proyecto nuevo en este
              navegador, con su guion y su configuración.
            </p>
            <dl className="space-y-2 text-sm" data-testid="shared-project-summary">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-400">Título</dt>
                <dd className="text-slate-100 font-medium text-right">{sharedProject.title}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-400">Escenas</dt>
                <dd className="text-slate-100 text-right">{summarizeSharedProject(sharedProject).sceneCount}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-400">Duración</dt>
                <dd className="text-slate-100 text-right">
                  {summarizeSharedProject(sharedProject).durationSeconds} s
                </dd>
              </div>
            </dl>
            <p className="text-xs text-slate-500">
              Los enlaces incluyen solo texto y configuración: nunca imágenes, audio ni video.
            </p>
          </Modal>
        )}

        {sharedError && (
          <Modal
            title="Enlace no válido"
            onClose={clearSharedLink}
            footer={
              <button onClick={clearSharedLink} className="btn-secondary">
                Cerrar
              </button>
            }
          >
            <p className="text-sm text-rose-300">{sharedError}</p>
          </Modal>
        )}
      </>
    );
  }

  const narrationAsset = findNarrationAsset(project);
  const musicAsset = findMusicAsset(project);

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Header fijo: proyecto, estado de guardado y exportación */}
      <header className="relative z-50 shrink-0 bg-slate-900 border-b border-slate-800 px-4 py-3 flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button
            onClick={() => setIsSidebarOpen((value) => !value)}
            data-testid="sidebar-toggle"
            data-open={isSidebarOpen ? 'true' : 'false'}
            aria-expanded={isSidebarOpen}
            aria-controls="app-sidebar"
            aria-label={isSidebarOpen ? 'Cerrar menú de secciones' : 'Abrir menú de secciones'}
            className="btn-secondary md:hidden"
            title="Secciones"
          >
            {isSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            <span>Menú</span>
          </button>
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
            onClick={() => setTheme((value) => otherTheme(value))}
            data-testid="theme-toggle"
            data-theme-current={theme}
            aria-pressed={theme === 'light'}
            className="btn-secondary"
            title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span>{theme === 'dark' ? 'Claro' : 'Oscuro'}</span>
          </button>
          <button
            onClick={() => {
              void handleShareProject();
            }}
            disabled={isSharing || isExporting}
            data-testid="share-project"
            className="btn-secondary"
            title="Compartir el proyecto como enlace (solo texto y configuración)"
          >
            {isSharing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
            <span>{isSharing ? 'Generando...' : 'Compartir'}</span>
          </button>
          <button
            onClick={() => {
              void handleExportAudio();
            }}
            disabled={isExportingAudio || isExporting}
            data-testid="export-audio"
            className="btn-secondary"
            title="Mezcla narración, música y efectos en un WAV de 48 kHz, sin video"
          >
            {isExportingAudio ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <AudioLines className="w-4 h-4" />
            )}
            <span>{isExportingAudio ? 'Mezclando...' : 'Exportar audio'}</span>
          </button>
          <div className="relative">
            <button
              onClick={() => setIsHelpOpen((value) => !value)}
              data-testid="help-menu"
              aria-expanded={isHelpOpen}
              aria-haspopup="menu"
              className="btn-secondary"
              title="Ayuda y tutorial"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Ayuda</span>
            </button>
            {isHelpOpen && (
              <div
                role="menu"
                data-testid="help-menu-panel"
                className="absolute right-0 mt-2 z-[60] w-64 rounded-xl border border-slate-700 bg-slate-900 p-2 shadow-2xl"
              >
                <button
                  role="menuitem"
                  onClick={startTour}
                  data-testid="tour-start"
                  className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-slate-800"
                >
                  <span className="block font-medium">Tutorial interactivo</span>
                  <span className="block text-xs text-slate-400">5 pasos sobre la interfaz real</span>
                </button>
              </div>
            )}
          </div>
          <button
            onClick={() => {
              void openExportDialog();
            }}
            disabled={isExporting || isPreparingExport}
            data-testid="export-video"
            className="btn-primary"
            title="Exportar video (Ctrl+E)"
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

      {audioNotice && (
        <div className="shrink-0 bg-emerald-950/60 border-b border-emerald-800 px-4 py-2 flex items-start justify-between gap-3">
          <span
            className="text-sm text-emerald-200 flex items-start gap-2"
            data-testid="audio-export-notice"
          >
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{audioNotice}</span>
          </span>
          <button
            onClick={() => setAudioNotice(null)}
            className="text-emerald-300 hover:text-emerald-100 text-sm"
          >
            Cerrar
          </button>
        </div>
      )}

      <div className="flex-1 flex min-h-0">
        {/* Barra lateral de navegación: fija en escritorio, cajón en móvil. */}
        {isSidebarOpen && (
          <div
            className="md:hidden fixed inset-0 z-30 bg-slate-950/70"
            onClick={() => setIsSidebarOpen(false)}
            aria-hidden="true"
          />
        )}
        <aside
          id="app-sidebar"
          data-testid="sidebar"
          data-open={isSidebarOpen ? 'true' : 'false'}
          className={`${
            isSidebarOpen ? 'flex' : 'hidden'
          } md:flex flex-col w-64 md:w-56 shrink-0 bg-slate-900 md:bg-slate-900/60 border-r border-slate-800 p-4 space-y-1 overflow-y-auto fixed md:static inset-y-0 left-0 z-40 md:z-auto h-full md:h-auto`}
        >
          <p className="etiqueta px-2 pb-2">Secciones</p>
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => {
                  setActiveSection(section.id);
                  setIsSidebarOpen(false);
                }}
                data-testid={`section-${section.id}`}
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

          <div className="panel-secundario pt-4 mt-4 border-t border-slate-800 space-y-1 text-sm text-slate-400">
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
          {activeSection === 'versiones' && (
            <VersionsPanel
              versions={versions}
              isLoading={versionsLoading}
              onRestore={handleRestoreVersion}
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
              <div className="card panel-secundario space-y-1 text-sm text-slate-400">
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
                  audio: {exportedVideo.audioCodec} ·{' '}
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

      {/* Tutorial interactivo de 5 pasos (fase 45) */}
      {isTourOpen && (
        <GuidedTour
          stepIndex={tourStep}
          onNext={() => {
            if (tourStep >= TOUR_STEPS.length - 1) {
              setIsTourOpen(false);
              setTourStep(0);
            } else {
              setTourStep((value) => value + 1);
            }
          }}
          onPrevious={() => setTourStep((value) => Math.max(0, value - 1))}
          onClose={() => {
            setIsTourOpen(false);
            setTourStep(0);
          }}
        />
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

      {/* Enlace generado para compartir (fase 43) */}
      {shareDialog && (
        <Modal
          title="Compartir proyecto"
          onClose={() => setShareDialog(null)}
          footer={
            <>
              <button onClick={() => setShareDialog(null)} className="btn-secondary">
                Cerrar
              </button>
              {shareDialog.url && (
                <button onClick={() => void handleCopyShareUrl()} className="btn-primary" data-testid="copy-share-url">
                  {shareCopied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{shareCopied ? 'Copiado' : 'Copiar enlace'}</span>
                </button>
              )}
            </>
          }
        >
          {shareDialog.url ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-300">
                Copia este enlace y compártelo. Al abrirlo, la app ofrece importar el proyecto con su guion y su
                configuración. No incluye imágenes, audio ni video.
              </p>
              <input
                readOnly
                value={shareDialog.url}
                data-testid="share-url"
                aria-label="Enlace para compartir el proyecto"
                onFocus={(event) => event.currentTarget.select()}
                className="campo font-mono text-xs"
              />
              <p className="text-xs text-slate-500">
                {shareDialog.url.length} caracteres · hash <code>#project=</code>
              </p>
            </div>
          ) : (
            <p className="text-sm text-amber-300" data-testid="share-message">
              {shareDialog.message}
            </p>
          )}
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
          {/* Advertencias de calidad antes de exportar (fase 40) */}
          <QualityReportPanel project={project} />

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

          {exportDialog.format.audioNote && (
            <p data-testid="export-audio-note" className="text-sm text-amber-300">
              {exportDialog.format.audioNote}
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
