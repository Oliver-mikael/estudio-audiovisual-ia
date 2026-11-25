// Panel «Versiones» (fase 44): instantáneas guardadas al exportar un video.
import React from 'react';
import { History, RotateCcw } from 'lucide-react';
import { ProjectVersion, VERSION_LIMIT, formatVersionDate } from '../services/versions/versions';

interface VersionsPanelProps {
  versions: ProjectVersion[];
  isLoading?: boolean;
  onRestore: (version: ProjectVersion) => void;
}

export const VersionsPanel: React.FC<VersionsPanelProps> = ({ versions, isLoading, onRestore }) => {
  return (
    <div className="space-y-4 max-w-3xl" data-testid="versions-panel" data-version-count={versions.length}>
      <div className="card flex items-start gap-3">
        <History className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <h2 className="titulo-seccion">Versiones del proyecto</h2>
          <p className="text-sm text-slate-400 mt-1">
            Cada vez que exportas un video se guarda una instantánea del proyecto. Se conservan las{' '}
            {VERSION_LIMIT} más recientes; las antiguas se descartan automáticamente.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="etiqueta">Instantáneas guardadas</p>
        <span className="text-xs font-mono text-slate-300" data-testid="versions-count">
          {versions.length} de {VERSION_LIMIT}
        </span>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-400">Cargando versiones...</p>
      ) : versions.length === 0 ? (
        <div className="bg-slate-900/50 border border-dashed border-slate-800 rounded-xl p-6 text-center text-sm text-slate-400">
          Todavía no hay versiones. Exporta un video y la primera instantánea aparecerá aquí.
        </div>
      ) : (
        <ul className="space-y-2">
          {versions.map((version, index) => (
            <li
              key={version.id}
              data-testid={`version-${index}`}
              className="card flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-semibold text-slate-100 truncate">
                  {version.title}
                  {index === 0 && (
                    <span className="ml-2 text-[11px] font-medium text-emerald-300 border border-emerald-800 bg-emerald-950/60 rounded-full px-2 py-0.5">
                      más reciente
                    </span>
                  )}
                </p>
                <p className="text-sm text-slate-400">
                  <span data-testid={`version-date-${index}`}>{formatVersionDate(version.createdAt)}</span>
                  {' · '}
                  <span data-testid={`version-duration-${index}`}>{version.durationSeconds} s</span>
                  {' · '}
                  {version.sceneCount} escena(s)
                </p>
              </div>
              <button
                onClick={() => onRestore(version)}
                className="btn-secondary shrink-0"
                data-testid={`restore-version-${index}`}
                title="Restaurar esta versión del proyecto"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Restaurar</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-slate-500">
        Restaurar una versión cambia el proyecto abierto (puedes deshacerlo con Ctrl+Z). No borra las demás
        instantáneas.
      </p>
    </div>
  );
};
