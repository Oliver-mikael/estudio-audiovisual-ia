// Pantalla de bienvenida para el primer uso (fase 41).
//
// Tres pasos numerados y un botón para saltar. No bloquea la app: HomeScreen
// sigue detrás y se puede crear el primer proyecto sin cerrar el panel.
import React from 'react';
import { ArrowRight, KeyRound, Sparkles, X } from 'lucide-react';
import { ONBOARDING_STEPS } from '../services/onboarding';

interface OnboardingProps {
  onClose: () => void;
  /** Lleva al modal de creación de proyecto; la bienvenida se cierra. */
  onCreateProject: () => void;
}

const ICONS = [KeyRound, Sparkles, ArrowRight];

export const Onboarding: React.FC<OnboardingProps> = ({ onClose, onCreateProject }) => {
  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/85 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      data-testid="onboarding"
    >
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 md:p-7 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="etiqueta">Primeros pasos</p>
            <h2 id="onboarding-title" className="text-[22px] font-bold text-slate-100 leading-tight">
              Bienvenido a Estudio Audiovisual Inteligente
            </h2>
            <p className="text-sm text-slate-400">
              Tres pasos para tu primer video. Todo se procesa en tu navegador.
            </p>
          </div>
          <button
            onClick={onClose}
            data-testid="onboarding-skip"
            className="btn-secondary shrink-0"
            title="Saltar la bienvenida"
          >
            <X className="w-4 h-4" />
            <span>Saltar</span>
          </button>
        </div>

        <ol className="space-y-3">
          {ONBOARDING_STEPS.map((step, index) => {
            const Icon = ICONS[index] ?? Sparkles;
            return (
              <li
                key={step.id}
                data-testid={`onboarding-step-${index + 1}`}
                className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4"
              >
                <span className="shrink-0 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-semibold">
                  {index + 1}
                </span>
                <div className="space-y-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                    <Icon className="w-4 h-4 text-indigo-400" />
                    <span>{step.title}</span>
                  </p>
                  <p className="text-sm text-slate-400">{step.description}</p>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-800 pt-4">
          <p className="text-xs text-slate-500">
            Esta bienvenida solo aparece una vez; no bloquea la creación de proyectos.
          </p>
          <div className="flex gap-2">
            <button onClick={onClose} className="btn-secondary">
              Explorar por mi cuenta
            </button>
            <button onClick={onCreateProject} className="btn-primary" data-testid="onboarding-start">
              <span>Crear mi primer proyecto</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
