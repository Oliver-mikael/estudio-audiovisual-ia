// Lista de advertencias de calidad antes de exportar (fase 40).
//
// Solo informa: no desactiva ningún botón. Cada comprobación lleva su estado en
// `data-status` para poder verificarla en el DOM.
import React from 'react';
import { Project } from '../types';
import { buildQualityReport } from '../engine/qualityReport';

interface QualityReportPanelProps {
  project: Project;
}

export const QualityReportPanel: React.FC<QualityReportPanelProps> = ({ project }) => {
  const report = buildQualityReport(project);

  return (
    <div className="space-y-2" data-testid="quality-report" data-warning-count={report.warningCount}>
      <div className="flex items-center justify-between gap-3">
        <p className="etiqueta">Reporte de calidad</p>
        <span
          data-testid="quality-summary"
          className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${
            report.allOk
              ? 'text-emerald-300 border-emerald-800 bg-emerald-950/60'
              : 'text-amber-300 border-amber-800 bg-amber-950/50'
          }`}
        >
          {report.allOk ? 'Sin advertencias' : `${report.warningCount} advertencia(s)`}
        </span>
      </div>

      <ul className="space-y-1.5" aria-live="polite">
        {report.checks.map((check) => (
          <li
            key={check.id}
            data-testid={`quality-${check.id}`}
            data-status={check.ok ? 'ok' : 'warning'}
            className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
              check.ok
                ? 'border-slate-800 bg-slate-950/60 text-slate-300'
                : 'border-amber-800 bg-amber-950/40 text-amber-200'
            }`}
          >
            <span aria-hidden="true" className="leading-5">
              {check.ok ? '✅' : '⚠️'}
            </span>
            <span>
              <span className="font-medium">{check.label}: </span>
              {check.message}
            </span>
          </li>
        ))}
      </ul>

      <p className="text-[11px] text-slate-500">
        Solo informativo: las advertencias no bloquean la exportación.
      </p>
    </div>
  );
};
