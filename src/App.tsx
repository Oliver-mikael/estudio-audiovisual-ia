// Main Application Shell for Estudio Audiovisual Inteligente
import React, { useState, useEffect } from 'react';
import { Project } from './types';
import { DEMO_PROJECT } from './data/demoProject';
import { saveProjectToStorage, getProjectFromStorage } from './services/storage/db';
import { VideoPlayer } from './components/VideoPlayer';
import { VideoExporter } from './engine/exporter';
import { IdeaLab } from './modules/IdeaLab';
import { ResearchModule } from './modules/ResearchModule';
import { ScriptWorkshop } from './modules/ScriptWorkshop';
import { StoryboardModule } from './modules/StoryboardModule';
import { MediaLibraryModule } from './modules/MediaLibraryModule';
import { HomeDashboard } from './modules/HomeDashboard';
import { downloadProjectEAI } from './services/storage/projectBackup';
import { Home, Lightbulb, Search, FileText, Film, FolderOpen, Download, Cpu, RefreshCw, Smartphone, DownloadCloud } from 'lucide-react';

export const App: React.FC = () => {
  const [project, setProject] = useState<Project>(DEMO_PROJECT);
  const [activeTab, setActiveTab] = useState<'home' | 'ideas' | 'research' | 'script' | 'storyboard' | 'media'>('home');

  // Export state
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportMessage, setExportMessage] = useState('');
  const [exportedVideoUrl, setExportedVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    // Load from storage or set demo project
    getProjectFromStorage(DEMO_PROJECT.id).then((stored) => {
      if (stored) {
        setProject(stored);
      } else {
        saveProjectToStorage(DEMO_PROJECT);
      }
    });
  }, []);

  const handleUpdateProject = (updated: Project) => {
    setProject(updated);
    saveProjectToStorage(updated);
  };

  const handleExportVideo = async () => {
    try {
      setIsExporting(true);
      setExportedVideoUrl(null);
      const blob = await VideoExporter.exportProjectVideo(project, (progress, message) => {
        setExportProgress(progress);
        setExportMessage(message);
      });

      const url = URL.createObjectURL(blob);
      setExportedVideoUrl(url);
    } catch (err) {
      console.error('Error during video export:', err);
      alert('Error exportando el video. Revisa la consola.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* App Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-lg shadow-indigo-600/30">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-base text-slate-100 leading-tight">
              ESTUDIO AUDIOVISUAL INTELIGENTE
            </h1>
            <p className="text-[11px] text-slate-400 font-mono">
              Producción Local Offline • IA Asistencial
            </p>
          </div>
        </div>

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
            onClick={handleExportVideo}
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

      {/* Main Workspace Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 max-w-[1700px] mx-auto w-full">
        {/* Left Column: Canvas Preview Studio (Always Accessible) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="sticky top-20 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-300 font-mono uppercase tracking-wider">
                Monitor de Producción en Tiempo Real
              </h2>
            </div>

            <VideoPlayer project={project} />

            {/* Export Progress / Download Card */}
            {(isExporting || exportedVideoUrl) && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
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
                        Formato listo para descarga (WebM / MP4)
                      </span>
                    </div>

                    <a
                      href={exportedVideoUrl}
                      download={`${project.title.toLowerCase().replace(/\s+/g, '-')}-720p.webm`}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded transition-colors shadow flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Descargar</span>
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Tabbed Intelligent Studio Modules */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1.5 rounded-xl overflow-x-auto">
            <button
              onClick={() => setActiveTab('home')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                activeTab === 'home'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Inicio</span>
            </button>

            <button
              onClick={() => setActiveTab('ideas')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
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
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
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
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
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
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
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
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                activeTab === 'media'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <FolderOpen className="w-4 h-4" />
              <span>Biblioteca</span>
            </button>
          </nav>

          {/* Active Tab Panel */}
          <div className="flex-1">
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
                    updatedAt: Date.now()
                  };
                  handleUpdateProject(newProj);
                  setActiveTab('script');
                }}
                onOpenProjectEditor={() => setActiveTab('script')}
              />
            )}
            {activeTab === 'ideas' && <IdeaLab project={project} onUpdateProject={handleUpdateProject} />}
            {activeTab === 'research' && <ResearchModule project={project} onUpdateProject={handleUpdateProject} />}
            {activeTab === 'script' && <ScriptWorkshop project={project} onUpdateProject={handleUpdateProject} />}
            {activeTab === 'storyboard' && <StoryboardModule project={project} />}
            {activeTab === 'media' && <MediaLibraryModule project={project} onUpdateProject={handleUpdateProject} />}
          </div>
        </div>
      </div>
    </div>
  );
};
