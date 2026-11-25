// Home Dashboard (Phase 6B - Professional Home View)
// Compact layout with studio metrics, persistent storage status, multi-project management, import preview modal and theme switcher

import React, { useState, useEffect } from 'react';
import { Project } from '../types';
import {
  ensureStoragePersistence,
  downloadProjectEAI,
  downloadBatchEAI,
  validateAndParseEAIPackage,
  restoreProjectFromEAI,
  EAIExportPackage,
  ImportStrategy
} from '../services/storage/projectBackup';
import { getAllProjectsFromStorage, deleteProjectFromStorage, saveProjectToStorage } from '../services/storage/db';
import { ThemeMode, getStoredTheme, applyTheme } from '../services/ui/theme';
import {
  FolderPlus,
  DownloadCloud,
  UploadCloud,
  ShieldCheck,
  Film,
  Clock,
  Layers,
  Search,
  Calendar,
  CheckCircle2,
  HardDrive,
  Copy,
  Trash2,
  AlertCircle,
  Sun,
  Moon,
  Laptop
} from 'lucide-react';

interface HomeDashboardProps {
  currentProject: Project;
  onSelectProject: (project: Project) => void;
  onNewProject: () => void;
  onOpenProjectEditor: () => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  currentProject,
  onSelectProject,
  onNewProject,
  onOpenProjectEditor
}) => {
  const [projects, setProjects] = useState<Project[]>([currentProject]);
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState<ThemeMode>(getStoredTheme());
  const [storageStatus, setStorageStatus] = useState<{
    supported: boolean;
    persisted: boolean;
    quota?: { usage: number; quota: number };
  }>({ supported: false, persisted: false });
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Import preview modal state
  const [importCandidate, setImportCandidate] = useState<{
    pkg: EAIExportPackage;
    checksumValid: boolean;
    existsAlready: boolean;
  } | null>(null);
  const [importStrategy, setImportStrategy] = useState<ImportStrategy>('create_copy');

  useEffect(() => {
    ensureStoragePersistence().then(setStorageStatus);
    loadAllProjects();
  }, [currentProject]);

  const loadAllProjects = async () => {
    const all = await getAllProjectsFromStorage();
    if (all && all.length > 0) {
      setProjects(all);
    } else {
      setProjects([currentProject]);
    }
  };

  const handleThemeChange = (newTheme: ThemeMode) => {
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  const handleExportCurrent = async () => {
    try {
      setIsProcessing(true);
      await downloadProjectEAI(currentProject);
      setFeedbackMessage({
        type: 'success',
        text: `Copia de seguridad (.eai) con firma SHA-256 generada para "${currentProject.title}".`
      });
    } catch (err) {
      setFeedbackMessage({
        type: 'error',
        text: 'Error generando la copia de seguridad. Revisa la consola.'
      });
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportAll = async () => {
    try {
      setIsProcessing(true);
      await downloadBatchEAI();
      setFeedbackMessage({
        type: 'success',
        text: `Copia completa de todos los proyectos locales exportada exitosamente (.eai).`
      });
    } catch (err) {
      setFeedbackMessage({
        type: 'error',
        text: 'Error generando la copia por lotes.'
      });
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      const text = await file.text();
      const result = await validateAndParseEAIPackage(text);

      if (result.type === 'single' && result.singlePackage) {
        const pkg = result.singlePackage;
        const exists = projects.some((p) => p.id === pkg.project.id);
        setImportCandidate({
          pkg,
          checksumValid: result.checksumValid,
          existsAlready: exists
        });
        setImportStrategy(exists ? 'create_copy' : 'overwrite');
      } else if (result.type === 'batch' && result.batchPackage) {
        // Restore each in batch
        for (const item of result.batchPackage.packages) {
          await restoreProjectFromEAI(item, 'create_copy');
        }
        await loadAllProjects();
        setFeedbackMessage({
          type: 'success',
          text: `Paquete por lotes importado: ${result.batchPackage.projectsCount} proyectos restaurados.`
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido al procesar paquete.';
      setFeedbackMessage({ type: 'error', text: msg });
    } finally {
      setIsProcessing(false);
      e.target.value = '';
    }
  };

  const confirmImport = async () => {
    if (!importCandidate) return;
    try {
      setIsProcessing(true);
      const restored = await restoreProjectFromEAI(importCandidate.pkg, importStrategy);
      await loadAllProjects();
      onSelectProject(restored);
      setFeedbackMessage({
        type: 'success',
        text: `Proyecto "${restored.title}" importado con éxito a IndexedDB.`
      });
      setImportCandidate(null);
    } catch (err) {
      setFeedbackMessage({
        type: 'error',
        text: 'Error al restaurar el proyecto en almacenamiento.'
      });
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDuplicateProject = async (proj: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    const copy: Project = {
      ...proj,
      id: `proj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: `${proj.title} (Copia)`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await saveProjectToStorage(copy);
    await loadAllProjects();
    setFeedbackMessage({
      type: 'success',
      text: `Proyecto duplicado como "${copy.title}".`
    });
  };

  const handleDeleteProject = async (proj: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    if (projects.length <= 1) {
      setFeedbackMessage({
        type: 'error',
        text: 'No se puede eliminar el único proyecto existente en el estudio.'
      });
      return;
    }
    if (confirm(`¿Estás seguro de eliminar el proyecto "${proj.title}" de IndexedDB? Esta acción es irreversible si no tienes copia .eai.`)) {
      await deleteProjectFromStorage(proj.id);
      const remaining = projects.filter((p) => p.id !== proj.id);
      setProjects(remaining);
      if (currentProject.id === proj.id && remaining.length > 0) {
        onSelectProject(remaining[0]);
      }
      setFeedbackMessage({
        type: 'info',
        text: `Proyecto "${proj.title}" eliminado de IndexedDB.`
      });
    }
  };

  // Studio-wide Real Aggregated Metrics
  const totalProjects = projects.length;
  const totalScenesAll = projects.reduce((acc, p) => acc + (p.script?.scenes?.length || 0), 0);
  const totalDurationAll = projects.reduce(
    (acc, p) => acc + (p.script?.scenes || []).reduce((sum, s) => sum + (s.durationSeconds || 0), 0),
    0
  );
  const totalAssetsAll = projects.reduce((acc, p) => acc + (p.mediaAssets?.length || 0), 0);

  const filteredProjects = projects.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Pilot Header: Compact, Technical & Professional */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-sm">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-100 tracking-tight">
              Taller de Creación & Centro de Respaldo
            </h2>
            <span className="px-1.5 py-0.5 bg-indigo-950 text-indigo-400 border border-indigo-800/60 text-[10px] font-mono rounded uppercase">
              Fase 6B
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Control de proyectos locales, copias físicas (.eai) con checksum SHA-256 y persistencia duradera.
          </p>
        </div>

        {/* Header Right Controls: Theme Selector & Persistence Status */}
        <div className="flex items-center gap-2">
          {/* Theme Selector */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs font-mono">
            <button
              onClick={() => handleThemeChange('dark')}
              className={`p-1 rounded ${theme === 'dark' ? 'bg-slate-800 text-indigo-300' : 'text-slate-400 hover:text-slate-200'}`}
              title="Modo Oscuro"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleThemeChange('light')}
              className={`p-1 rounded ${theme === 'light' ? 'bg-slate-800 text-amber-300' : 'text-slate-400 hover:text-slate-200'}`}
              title="Modo Claro"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleThemeChange('auto')}
              className={`p-1 rounded ${theme === 'auto' ? 'bg-slate-800 text-emerald-300' : 'text-slate-400 hover:text-slate-200'}`}
              title="Modo Automático del Sistema"
            >
              <Laptop className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Storage Persistence Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-[11px] font-mono">
            <HardDrive className="w-3 h-3 text-slate-400" />
            <span className="text-slate-400">Storage:</span>
            {storageStatus.persisted ? (
              <span className="flex items-center gap-1 text-emerald-400">
                <ShieldCheck className="w-3 h-3" /> Persistente
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-400" title="Almacenamiento estándar del navegador">
                <CheckCircle2 className="w-3 h-3" /> Estándar
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Notifications / Feedback Alert */}
      {feedbackMessage && (
        <div
          className={`p-3 rounded-lg border text-xs flex items-center justify-between transition-all ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
              : feedbackMessage.type === 'error'
              ? 'bg-rose-950/60 border-rose-800 text-rose-300'
              : 'bg-indigo-950/60 border-indigo-800 text-indigo-300'
          }`}
        >
          <span>{feedbackMessage.text}</span>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-slate-400 hover:text-slate-200 text-xs font-mono px-1"
          >
            ×
          </button>
        </div>
      )}

      {/* Current Active Project Spotlight */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-semibold block">
              Proyecto Activo en Sesión
            </span>
            <h3 className="text-base font-bold text-slate-100">{currentProject.title}</h3>
            <p className="text-xs text-slate-400 line-clamp-1">{currentProject.description}</p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onOpenProjectEditor}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors shadow-sm"
            >
              <Film className="w-3.5 h-3.5" />
              <span>Abrir en Taller</span>
            </button>

            <button
              onClick={handleExportCurrent}
              disabled={isProcessing}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition-colors"
              title="Descargar copia individual (.eai) con checksum SHA-256"
            >
              <DownloadCloud className="w-3.5 h-3.5 text-indigo-400" />
              <span>Copia .eai</span>
            </button>
          </div>
        </div>

        {/* Aggregated Studio Real Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-800/80">
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Proyectos Locales</span>
            </div>
            <p className="text-sm font-bold text-slate-200 mt-0.5">{totalProjects}</p>
          </div>

          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
              <Film className="w-3.5 h-3.5 text-indigo-400" />
              <span>Escenas Totales</span>
            </div>
            <p className="text-sm font-bold text-slate-200 mt-0.5">{totalScenesAll}</p>
          </div>

          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>Tiempo Total</span>
            </div>
            <p className="text-sm font-bold text-slate-200 mt-0.5 font-mono">{totalDurationAll}s</p>
          </div>

          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
              <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
              <span>Medios en BD</span>
            </div>
            <p className="text-sm font-bold text-slate-200 mt-0.5">{totalAssetsAll}</p>
          </div>
        </div>
      </div>

      {/* Projects Directory & Import / New Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar proyectos en IndexedDB..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportAll}
              disabled={isProcessing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-medium transition-colors"
              title="Exportar todos los proyectos de IndexedDB en un único archivo .eai"
            >
              <DownloadCloud className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Exportar Todo</span>
            </button>

            <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium cursor-pointer transition-colors">
              <UploadCloud className="w-3.5 h-3.5 text-emerald-400" />
              <span>Importar .eai</span>
              <input
                type="file"
                accept=".eai,application/json"
                onChange={handleFileSelected}
                className="hidden"
                disabled={isProcessing}
              />
            </label>

            <button
              onClick={onNewProject}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors shadow-sm"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>Nuevo</span>
            </button>
          </div>
        </div>

        {/* Projects List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {filteredProjects.map((p) => {
            const isCurrent = p.id === currentProject.id;
            return (
              <div
                key={p.id}
                onClick={() => onSelectProject(p)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-slate-900/90 border-indigo-500/80 shadow-md ring-1 ring-indigo-500/20'
                    : 'bg-slate-900/50 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-semibold text-slate-200">{p.title}</h4>
                      {isCurrent && (
                        <span className="px-1.5 py-0.2 bg-indigo-950 text-indigo-300 text-[9px] font-mono rounded">
                          Activo
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1">{p.description || 'Sin descripción'}</p>
                  </div>

                  {/* Actions for this project */}
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => handleDuplicateProject(p, e)}
                      className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
                      title="Duplicar proyecto"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteProject(p, e)}
                      className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                      title="Eliminar de IndexedDB"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-2.5 pt-2 border-t border-slate-800/60">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {new Date(p.updatedAt || p.createdAt).toLocaleDateString()}
                  </span>
                  <span>{p.script?.scenes?.length || 0} escenas • 720p 30fps</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Import Preview & Strategy Modal */}
      {importCandidate && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-emerald-400" />
                <span>Vista Previa de Importación .eai</span>
              </h3>
              <button
                onClick={() => setImportCandidate(null)}
                className="text-slate-400 hover:text-slate-200 text-xs font-mono"
              >
                ×
              </button>
            </div>

            {/* Integrity status */}
            <div className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
              importCandidate.checksumValid
                ? 'bg-emerald-950/50 border-emerald-800 text-emerald-300'
                : 'bg-amber-950/50 border-amber-800 text-amber-300'
            }`}>
              {importCandidate.checksumValid ? (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Firma SHA-256 válida. Integridad del paquete verificada.</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>El archivo carece de checksum o ha sido editado externamente.</span>
                </>
              )}
            </div>

            {/* Project Details */}
            <div className="space-y-1.5 bg-slate-950 p-3 rounded-lg border border-slate-800/80 text-xs">
              <div className="font-semibold text-slate-200">{importCandidate.pkg.project.title}</div>
              <div className="text-slate-400 text-[11px] line-clamp-2">{importCandidate.pkg.project.description}</div>
              <div className="text-slate-400 text-[11px] font-mono pt-1">
                Escenas: {importCandidate.pkg.project.script?.scenes?.length || 0} •
                Medios adjuntos: {importCandidate.pkg.bundledAssets?.length || 0} •
                Versión: {importCandidate.pkg.version}
              </div>
            </div>

            {/* Collision Strategy Selection */}
            {importCandidate.existsAlready && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-300 block">
                  El proyecto ya existe en tu base local. Selecciona estrategia:
                </label>
                <div className="space-y-1.5 text-xs">
                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="strategy"
                      value="create_copy"
                      checked={importStrategy === 'create_copy'}
                      onChange={() => setImportStrategy('create_copy')}
                      className="text-indigo-600 focus:ring-0"
                    />
                    <span>Importar como proyecto nuevo (Copia con nuevo ID)</span>
                  </label>
                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="strategy"
                      value="overwrite"
                      checked={importStrategy === 'overwrite'}
                      onChange={() => setImportStrategy('overwrite')}
                      className="text-indigo-600 focus:ring-0"
                    />
                    <span>Sobrescribir el proyecto existente</span>
                  </label>
                </div>
              </div>
            )}

            {/* Dialog Footer Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setImportCandidate(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmImport}
                disabled={isProcessing}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
              >
                Confirmar e Importar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
