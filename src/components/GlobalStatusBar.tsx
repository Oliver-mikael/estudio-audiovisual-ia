// Global Status Bar Component (Phase 7B - Production Telemetry & Context Awareness)
import React, { useEffect, useState } from 'react';
import { Project } from '../types';
import { ensureStoragePersistence } from '../services/storage/projectBackup';
import { aiEngine } from '../services/ai/aiEngine';
import {
  HardDrive,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  Wifi,
  WifiOff,
  Clock,
  Film,
  Layers,
  Sparkles,
} from 'lucide-react';

interface GlobalStatusBarProps {
  project: Project;
  isSaving?: boolean;
}

export const GlobalStatusBar: React.FC<GlobalStatusBarProps> = ({ project, isSaving }) => {
  const [storageStatus, setStorageStatus] = useState<{
    supported: boolean;
    persisted: boolean;
    quota?: { usage: number; quota: number };
  }>({ supported: false, persisted: false });

  const activeProvider = aiEngine.getActiveProviderConfig();
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  useEffect(() => {
    ensureStoragePersistence().then(setStorageStatus);
  }, [project]);

  // Compute total duration in SMPTE timecode (HH:MM:SS:FF)
  const totalSeconds = (project.script?.scenes || []).reduce(
    (acc, s) => acc + (s.durationSeconds || 0),
    0
  );
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const frames = Math.floor((totalSeconds % 1) * 30);
  const smpte = `00:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}:${String(frames).padStart(2, '0')}`;

  const scenesCount = project.script?.scenes?.length || 0;
  const assetsCount = project.mediaAssets?.length || 0;

  return (
    <div className="bg-slate-950 border-b border-slate-800/80 px-4 py-1.5 flex items-center justify-between text-[11px] font-mono text-slate-400 select-none overflow-x-auto gap-4">
      {/* Left: Active Project & Save Status */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-1.5 text-slate-200">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
          <span className="font-semibold truncate max-w-[200px]" title={project.title}>
            {project.title}
          </span>
        </div>

        <span className="text-slate-700">|</span>

        <div className="flex items-center gap-1 text-[10px]">
          {isSaving ? (
            <span className="text-amber-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              Guardando en IndexedDB...
            </span>
          ) : (
            <span className="text-emerald-400/90 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              Guardado
            </span>
          )}
        </div>
      </div>

      {/* Center: Production SMPTE Timecode & Metrics */}
      <div className="flex items-center gap-4 shrink-0 text-slate-300">
        <div className="flex items-center gap-1.5 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
          <Clock className="w-3 h-3 text-indigo-400" />
          <span className="font-bold text-slate-100">{smpte}</span>
          <span className="text-[10px] text-slate-500">(30 FPS)</span>
        </div>

        <div className="hidden sm:flex items-center gap-3 text-[10px] text-slate-400">
          <span className="flex items-center gap-1">
            <Film className="w-3 h-3 text-slate-500" />
            {scenesCount} escenas
          </span>
          <span className="flex items-center gap-1">
            <Layers className="w-3 h-3 text-slate-500" />
            {assetsCount} medios
          </span>
        </div>
      </div>

      {/* Right: Storage Durability & AI Provider Telemetry */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Storage Persistence */}
        <div className="flex items-center gap-1" title="Persistencia de base de datos local">
          <HardDrive className="w-3 h-3 text-slate-500" />
          {storageStatus.persisted ? (
            <span className="text-emerald-400 flex items-center gap-0.5">
              <ShieldCheck className="w-3 h-3" /> Persistente
            </span>
          ) : (
            <span className="text-slate-400">Estándar</span>
          )}
        </div>

        <span className="text-slate-700 hidden md:inline">|</span>

        {/* AI Engine Status */}
        <div className="hidden md:flex items-center gap-1.5" title={`Proveedor de IA: ${activeProvider.name}`}>
          <Sparkles className="w-3 h-3 text-purple-400" />
          <span className="text-slate-300 truncate max-w-[140px]">{activeProvider.name}</span>
          {activeProvider.isOnlineRequired && !isOnline ? (
            <span className="text-rose-400 flex items-center gap-0.5 text-[10px]">
              <WifiOff className="w-2.5 h-2.5" /> Offline
            </span>
          ) : (
            <span className="text-emerald-400 flex items-center gap-0.5 text-[10px]">
              <Wifi className="w-2.5 h-2.5" /> {activeProvider.isOnlineRequired ? 'Cloud' : 'Local'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
