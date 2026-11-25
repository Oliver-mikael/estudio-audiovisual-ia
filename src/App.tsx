// Shell de la aplicación: pantalla de inicio + editor con barra lateral.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Project } from './types';
import { DEMO_PROJECT } from './data/demoProject';
import { saveProjectToStorage, getProjectFromStorage } from './services/storage/db';
import { VideoExporter } from './engine/exporter';
import { IdeaLab } from './modules/IdeaLab';
import { ResearchModule } from './modules/ResearchModule';
import { ScriptWorkshop } from './modules/ScriptWorkshop';
import { StoryboardModule } from './modules/StoryboardModule';
import { MediaLibraryModule } from './modules/MediaLibraryModule';
import { HomeDashboard } from './modules/HomeDashboard';
import { ProductionStudio } from './modules/ProductionStudio';
import { GlobalStatusBar } from './components/GlobalStatusBar';
import { ExportProfilesModal } from './components/ExportProfilesModal';
import { downloadProjectEAI } from './services/storage/projectBackup';
import { AIAssistantDrawer } from './components/AIAssistantDrawer';
import {
  Home,
  Lightbulb,
  Search,
  FileText,
  Film,
  FolderOpen,
  Download,
  Cpu,
  RefreshCw,
  Smartphone,
  DownloadCloud,
  Sparkles,
  Clapperboard,
} from 'lucide-react';

export const App: React.FC = () => {
  const [project, setProject] = useState<Project>(DEMO_PROJECT);
  const [activeTab, setActiveTab] = useState<
    'home' | 'ideas' | 'research' | 'script' | 'storyboard' | 'production' | 'media'
  >('production');
  const [isAIDrawerOpen, setIsAIDrawerOpen] = useState(false);
  const [activeAssistantSceneId, setActiveAssistantSceneId] = useState<string | undefined>(undefined);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Exportación
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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

  // Fechas de primer y último uso (fase 47). No bloquea la carga inicial.
  useEffect(() => {
    void recordAppUse().catch(() => undefined);
  }, []);

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

  const handleUpdateProject = (updated: Project) => {
    setProject(updated);
    setIsSaving(true);
    saveProjectToStorage(updated).finally(() => {
      setTimeout(() => setIsSaving(false), 800);
    });
  };

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
      // Y suma el video y su duración real a «Mi actividad» (fase 47).
      void recordVideoExport(result.durationSeconds).catch(() => undefined);
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

        {/* Global Action Banner */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => downloadProjectEAI(project)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs rounded-lg shadow-sm transition-all"
            title="Descargar copia de seguridad física del proyecto completo (.eai)"
          >
            <DownloadCloud className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Copia .eai</span>
          </button>

          <button
            onClick={() => setIsAIDrawerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium text-xs rounded-lg shadow-md shadow-purple-600/20 transition-all"
            title="Abrir Asistente Central de Inteligencia Artificial (Fase 6C)"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Asistente IA</span>
          </button>

          <a
            href="/app-debug.apk"
            download="app-debug.apk"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700/80 hover:bg-emerald-600 text-white font-medium text-xs rounded-lg border border-emerald-500/40 shadow-md transition-all"
            title="Descargar paquete instalador Android APK (4.1 MB)"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-300" />
            <span className="hidden sm:inline">APK (4.1 MB)</span>
          </a>

          <button
            onClick={() => setIsExportModalOpen(true)}
            disabled={isExporting}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-xs rounded-lg shadow-lg shadow-indigo-600/20 transition-all ${
              isExporting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isExporting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            <span>{isExporting ? 'Renderizando...' : 'Exportar Video'}</span>
          </button>
        </div>
      </header>

      {/* Global Real-time Production Status Bar */}
      <GlobalStatusBar project={project} isSaving={isSaving} />

      {/* Workspace Navigation Bar (10 Specialised Workspaces) */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-6 py-2 sticky top-[57px] z-40 backdrop-blur">
        <nav className="flex items-center gap-1.5 overflow-x-auto max-w-[1700px] mx-auto w-full">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === 'home'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Inicio</span>
          </button>

          <button
            onClick={() => setActiveTab('production')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'production'
                ? 'bg-indigo-600 text-white shadow ring-1 ring-indigo-400/30'
                : 'text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/40'
            }`}
          >
            <Clapperboard className="w-4 h-4" />
            <span>Producción & Montaje</span>
          </button>

          <button
            onClick={() => setActiveTab('ideas')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === 'ideas'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Lightbulb className="w-4 h-4" />
            <span>Laboratorio de Ideas</span>
          </button>

          <button
            onClick={() => setActiveTab('research')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === 'research'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Investigación</span>
          </button>

          <button
            onClick={() => setActiveTab('script')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === 'script'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Taller de Guion</span>
          </button>

          <button
            onClick={() => setActiveTab('storyboard')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === 'storyboard'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Film className="w-4 h-4" />
            <span>Storyboard</span>
          </button>

          <button
            onClick={() => setActiveTab('media')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === 'media'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            <span>Biblioteca</span>
          </button>
        </nav>
      </div>

      {/* Main Workspace Layout */}
      <div className="flex-1 p-5 md:p-6 max-w-[1700px] mx-auto w-full">
        {/* Render Progress or Success Notice if Exporting */}
        {(isExporting || exportedVideoUrl) && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-5 space-y-3 shadow-lg">
            {isExporting && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-300 font-mono">
                  <span>{exportMessage}</span>
                  <span>{exportProgress}%</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="bg-indigo-500 h-full transition-all duration-200"
                    style={{ width: `${exportProgress}%` }}
                  />
                </div>
              </div>
            )}

            {exportedVideoUrl && !isExporting && (
              <div className="flex items-center justify-between bg-emerald-950/60 border border-emerald-800/80 p-3 rounded-lg">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-emerald-300 block">
                    ¡Video Renderizado con Éxito!
                  </span>
                  <span className="text-[11px] text-emerald-400/80 font-mono">
                    Formato WebM 720p 30 FPS listo para descarga
                  </span>
                </div>

                <a
                  href={exportedVideoUrl}
                  download={`${project.title.toLowerCase().replace(/\s+/g, '-')}-720p.webm`}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-lg transition-colors shadow flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar Archivo</span>
                </a>
              </div>
            )}
          </div>
        )}

        {/* Tab Views */}
        <div>
          {activeTab === 'home' && (
            <HomeDashboard
              currentProject={project}
              onSelectProject={handleUpdateProject}
              onNewProject={() => {
                const newProj: Project = {
                  ...DEMO_PROJECT,
                  id: `proj-${Date.now()}`,
                  title: 'Nuevo Proyecto Audiovisual',
                  description: 'Inicia tu investigación y desglose narrativo.',
                  createdAt: Date.now(),
                  updatedAt: Date.now(),
                };
                handleUpdateProject(newProj);
                setActiveTab('production');
              }}
              onOpenProjectEditor={() => setActiveTab('production')}
            />
          )}

          {activeTab === 'production' && (
            <ProductionStudio
              project={project}
              onUpdateProject={handleUpdateProject}
              onRequestExportModal={() => setIsExportModalOpen(true)}
            />
          )}

          {activeTab === 'ideas' && (
            <IdeaLab
              project={project}
              onUpdateProject={handleUpdateProject}
              onNavigateToScript={() => setActiveTab('production')}
            />
          )}

          {activeTab === 'research' && (
            <ResearchModule project={project} onUpdateProject={handleUpdateProject} />
          )}

          {activeTab === 'script' && (
            <ScriptWorkshop
              project={project}
              onUpdateProject={handleUpdateProject}
              onRequestAIAssist={(sceneId) => {
                setActiveAssistantSceneId(sceneId);
                setIsAIDrawerOpen(true);
              }}
            />
          )}

          {activeTab === 'storyboard' && (
            <StoryboardModule project={project} onUpdateProject={handleUpdateProject} />
          )}

          {activeTab === 'media' && (
            <MediaLibraryModule project={project} onUpdateProject={handleUpdateProject} />
          )}
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
          {activeSection === 'actividad' && <ActivityPanel />}
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

      {/* Export Profiles Modal (Phase 7B) */}
      <ExportProfilesModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        project={project}
        isExporting={isExporting}
        onStartExport={async (_profile) => {
          setIsExportModalOpen(false);
          await handleExportVideo();
        }}
      />

      {/* Global AI Assistant Drawer */}
      <AIAssistantDrawer
        isOpen={isAIDrawerOpen}
        onClose={() => setIsAIDrawerOpen(false)}
        project={project}
        currentSceneId={activeAssistantSceneId}
        onApplyResult={(task, data) => {
          if (task === 'EXPAND_SCENE_NARRATION' && data?.expandedNarration && activeAssistantSceneId) {
            const updatedScenes = project.script.scenes.map((s) =>
              s.id === activeAssistantSceneId ? { ...s, narrationText: data.expandedNarration } : s
            );
            handleUpdateProject({
              ...project,
              script: { ...project.script, scenes: updatedScenes },
            });
            setIsAIDrawerOpen(false);
          }
        }}
      />
    </div>
  );
};
