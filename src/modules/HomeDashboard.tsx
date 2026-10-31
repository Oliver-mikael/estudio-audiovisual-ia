// Home Dashboard Pilot View (Phase 6B - Redesign Pilot)
// Compact, professional layout with project overview, persistent storage status, and .eai backup controls

import React, { useState, useEffect } from 'react';
import { Project } from '../types';
import { ensureStoragePersistence, downloadProjectEAI, validateAndParseEAIPackage, restoreProjectFromEAI } from '../services/storage/projectBackup';
import { getAllProjectsFromStorage } from '../services/storage/db';
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
  HardDrive
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
  const [storageStatus, setStorageStatus] = useState<{
    supported: boolean;
    persisted: boolean;
    quota?: { usage: number; quota: number };
  }>({ supported: false, persisted: false });
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Check IndexedDB persistence capability
    ensureStoragePersistence().then(setStorageStatus);

    // Load all local projects from IndexedDB
    getAllProjectsFromStorage().then((all) => {
      if (all && all.length > 0) {
        setProjects(all);
      } else {
        setProjects([currentProject]);
      }
    });
  }, [currentProject]);

  const handleExportCurrent = async () => {
    try {
      setIsProcessing(true);
      await downloadProjectEAI(currentProject);
      setFeedbackMessage({
        type: 'success',
        text: `Copia de seguridad (.eai) generada para "${currentProject.title}".`
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

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      const text = await file.text();
      const pkg = validateAndParseEAIPackage(text);
      const restored = await restoreProjectFromEAI(pkg);

      setProjects((prev) => {
        const filtered = prev.filter((p) => p.id !== restored.id);
        return [restored, ...filtered];
      });

      onSelectProject(restored);
      setFeedbackMessage({
        type: 'success',
        text: `Proyecto "${restored.title}" importado y restaurado en IndexedDB con éxito.`
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido al importar paquete.';
      setFeedbackMessage({
        type: 'error',
        text: msg
      });
    } finally {
      setIsProcessing(false);
      // Reset input value
      e.target.value = '';
    }
  };

  // Metrics computation
  const totalScenes = currentProject.script?.scenes?.length || 0;
  const totalDurationSeconds = (currentProject.script?.scenes || []).reduce(
    (acc, s) => acc + (s.durationSeconds || 0),
    0
  );
  const totalSources = currentProject.sources?.length || 0;
  const totalAssets = currentProject.mediaAssets?.length || 0;

  const filteredProjects = projects.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Pilot Header: Compact, Technical & Professional */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-100 tracking-tight">
              Taller de Creación & Respaldo Local
            </h2>
            <span className="px-2 py-0.5 bg-indigo-950 text-indigo-400 border border-indigo-800/60 text-[10px] font-mono rounded uppercase">
              Fase 6B Piloto
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Administra tus proyectos locales, genera copias de seguridad portables (.eai) y supervisa el estado de persistencia.
          </p>
        </div>

        {/* Global Persistence Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono">
          <HardDrive className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400 text-[11px]">IndexedDB:</span>
          {storageStatus.persisted ? (
            <span className="flex items-center gap-1 text-emerald-400 text-[11px]">
              <ShieldCheck className="w-3 h-3" /> Persistente
            </span>
          ) : (
            <span className="flex items-center gap-1 text-amber-400 text-[11px]" title="Almacenamiento estándar del navegador">
              <CheckCircle2 className="w-3 h-3" /> Activo (Estándar)
            </span>
          )}
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
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-indigo-400 font-semibold block">
              Proyecto Activo en Memoria
            </span>
            <h3 className="text-lg font-bold text-slate-100">{currentProject.title}</h3>
            <p className="text-xs text-slate-400 line-clamp-1">{currentProject.description}</p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onOpenProjectEditor}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors shadow-sm"
            >
              <Film className="w-3.5 h-3.5" />
              <span>Abrir en Taller</span>
            </button>

            <button
              onClick={handleExportCurrent}
              disabled={isProcessing}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition-colors"
              title="Descargar copia física (.eai) con metadatos y medios incluidos"
            >
              <DownloadCloud className="w-3.5 h-3.5 text-indigo-400" />
              <span>Copia .eai</span>
            </button>
          </div>
        </div>

        {/* Compact Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800/80">
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Escenas</span>
            </div>
            <p className="text-base font-bold text-slate-200 mt-0.5">{totalScenes}</p>
          </div>

          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>Duración</span>
            </div>
            <p className="text-base font-bold text-slate-200 mt-0.5 font-mono">{totalDurationSeconds}s</p>
          </div>

          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Fuentes</span>
            </div>
            <p className="text-base font-bold text-slate-200 mt-0.5">{totalSources}</p>
          </div>

          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
              <Film className="w-3.5 h-3.5 text-indigo-400" />
              <span>Medios</span>
            </div>
            <p className="text-base font-bold text-slate-200 mt-0.5">{totalAssets}</p>
          </div>
        </div>
      </div>

      {/* Projects Directory & Import / New Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar proyecto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium cursor-pointer transition-colors">
              <UploadCloud className="w-3.5 h-3.5 text-emerald-400" />
              <span>Importar .eai</span>
              <input
                type="file"
                accept=".eai,application/json"
                onChange={handleImportFile}
                className="hidden"
                disabled={isProcessing}
              />
            </label>

            <button
              onClick={onNewProject}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors shadow-sm"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>Nuevo Proyecto</span>
            </button>
          </div>
        </div>

        {/* Projects List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredProjects.map((p) => {
            const isCurrent = p.id === currentProject.id;
            return (
              <div
                key={p.id}
                onClick={() => onSelectProject(p)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-slate-900/90 border-indigo-500/80 shadow-md ring-1 ring-indigo-500/20'
                    : 'bg-slate-900/50 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-slate-200">{p.title}</h4>
                      {isCurrent && (
                        <span className="px-1.5 py-0.5 bg-indigo-950 text-indigo-300 text-[9px] font-mono rounded">
                          Activo
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-1">{p.description || 'Sin descripción'}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono mt-3 pt-2.5 border-t border-slate-800/60">
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
    </div>
  );
};
