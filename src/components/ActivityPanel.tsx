// Panel «Mi actividad» (fase 47): contadores locales de uso.
import React, { useEffect, useState } from 'react';
import { BarChart3, CalendarDays, Clock, Film } from 'lucide-react';
import {
  UsageMetrics,
  formatUsageDate,
  formatUsageDuration,
  loadUsageMetrics,
} from '../services/metrics/usage';

export const ActivityPanel: React.FC = () => {
  const [metrics, setMetrics] = useState<UsageMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadUsageMetrics()
      .then((stored) => {
        if (!cancelled) setMetrics(stored);
      })
      .catch(() => {
        if (!cancelled) setError('No se pudieron leer las métricas locales.');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const cards = [
    {
      id: 'exported-videos',
      icon: Film,
      label: 'Videos exportados',
      value: metrics ? String(metrics.exportedVideos) : '—',
    },
    {
      id: 'exported-seconds',
      icon: Clock,
      label: 'Duración total exportada',
      value: metrics ? formatUsageDuration(metrics.exportedSeconds) : '—',
      detail: metrics ? `${metrics.exportedSeconds} s` : undefined,
    },
    {
      id: 'first-use',
      icon: CalendarDays,
      label: 'Primer uso',
      value: metrics ? formatUsageDate(metrics.firstUseAt) : '—',
    },
    {
      id: 'last-use',
      icon: CalendarDays,
      label: 'Último uso',
      value: metrics ? formatUsageDate(metrics.lastUseAt) : '—',
    },
  ];

  return (
    <div className="space-y-4 max-w-3xl" data-testid="activity-panel">
      <div className="card flex items-start gap-3">
        <BarChart3 className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <h2 className="titulo-seccion">Mi actividad</h2>
          <p className="text-sm text-slate-400 mt-1">
            Contadores guardados solo en este navegador: cuántos videos has exportado, su duración total y
            cuándo usaste la app por primera y por última vez.
          </p>
        </div>
      </div>

      {error ? (
        <p className="text-sm text-rose-300" data-testid="activity-error">
          {error}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.id} className="card space-y-1" data-testid={`activity-${card.id}`}>
                <p className="etiqueta flex items-center gap-1.5">
                  <Icon className="w-4 h-4 text-indigo-400" />
                  <span>{card.label}</span>
                </p>
                <p className="text-[22px] font-semibold text-slate-100 leading-tight">
                  {card.id === 'exported-videos' ? (
                    <span data-testid="activity-exported-count">{card.value}</span>
                  ) : card.id === 'exported-seconds' ? (
                    <span data-testid="activity-exported-seconds">{card.value}</span>
                  ) : card.id === 'first-use' ? (
                    <span data-testid="activity-first-use">{card.value}</span>
                  ) : (
                    <span data-testid="activity-last-use">{card.value}</span>
                  )}
                </p>
                {card.detail && <p className="text-xs text-slate-500">{card.detail}</p>}
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-slate-500">
        Los videos exportados por lotes también cuentan. Estos datos no se envían a ningún servidor y no se
        borran al eliminar un proyecto.
      </p>
    </div>
  );
};
