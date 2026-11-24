// Tour guiado de 5 pasos (fase 45).
//
// Cada paso apunta a un elemento real con un tooltip fijo y una flecha. El
// elemento se resalta con un anillo y el fondo oscurecido no bloquea los clics:
// el tutorial se puede cerrar en cualquier momento con «Saltar».
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import {
  Rect,
  TOUR_STEPS,
  TourPlacement,
  TooltipPosition,
  computeTooltipPosition,
} from '../services/tour';

interface GuidedTourProps {
  stepIndex: number;
  onNext: () => void;
  onPrevious: () => void;
  onClose: () => void;
}

/** Estilo de la flecha: un cuadrado girado 45° en el borde que mira al elemento. */
function arrowStyle(placement: TourPlacement, offset: number): React.CSSProperties {
  const base: React.CSSProperties = {
    position: 'absolute',
    width: 12,
    height: 12,
    backgroundColor: 'var(--superficie)',
    borderColor: '#6366f1',
  };

  if (placement === 'bottom') {
    return { ...base, top: -6, left: offset - 6, borderLeftWidth: 1, borderTopWidth: 1, transform: 'rotate(45deg)' };
  }
  if (placement === 'top') {
    return { ...base, bottom: -6, left: offset - 6, borderRightWidth: 1, borderBottomWidth: 1, transform: 'rotate(45deg)' };
  }
  if (placement === 'right') {
    return { ...base, left: -6, top: offset - 6, borderLeftWidth: 1, borderBottomWidth: 1, transform: 'rotate(45deg)' };
  }
  return { ...base, right: -6, top: offset - 6, borderRightWidth: 1, borderTopWidth: 1, transform: 'rotate(45deg)' };
}

export const GuidedTour: React.FC<GuidedTourProps> = ({
  stepIndex,
  onNext,
  onPrevious,
  onClose,
}) => {
  const step = TOUR_STEPS[stepIndex] ?? TOUR_STEPS[0];
  const isLast = stepIndex >= TOUR_STEPS.length - 1;
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const [position, setPosition] = useState<TooltipPosition | null>(null);
  const [targetMissing, setTargetMissing] = useState(false);

  const update = useCallback(() => {
    const element = document.querySelector(step.target);
    if (!element) {
      setTargetRect(null);
      setPosition(null);
      return;
    }

    const rect = element.getBoundingClientRect();
    setTargetRect({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });

    const box = tooltipRef.current?.getBoundingClientRect();
    setPosition(
      computeTooltipPosition(
        rect,
        { width: box?.width ?? 340, height: box?.height ?? 180 },
        { width: window.innerWidth, height: window.innerHeight },
        step.placement
      )
    );
  }, [step]);

  useEffect(() => {
    // La sección puede tardar un render en aparecer: se reintenta con rAF y,
    // al final, se mide otra vez para ajustar la altura real del tooltip.
    setPosition(null);
    setTargetRect(null);
    setTargetMissing(false);
    let frame = 0;
    let attempts = 0;
    const tick = () => {
      update();
      if (!document.querySelector(step.target)) {
        if (attempts < 60) {
          attempts += 1;
          frame = window.requestAnimationFrame(tick);
        } else {
          setTargetMissing(true);
        }
      }
    };
    frame = window.requestAnimationFrame(tick);

    const onResize = () => update();
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
    };
  }, [step, update]);

  // El tooltip cambia de alto al aparecer o al quitar el aviso de elemento
  // ausente: se vuelve a medir para que la flecha siga centrada (fase 45).
  useEffect(() => {
    const node = tooltipRef.current;
    if (!node || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => update());
    observer.observe(node);
    return () => observer.disconnect();
  }, [update]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const fallbackTop = Math.max(16, window.innerHeight / 2 - 110);
  const fallbackLeft = Math.max(16, window.innerWidth / 2 - 170);

  return (
    <>
      {targetRect && (
        <div
          data-testid="tour-highlight"
          aria-hidden="true"
          className="fixed z-[95] pointer-events-none rounded-lg ring-2 ring-indigo-400 shadow-[0_0_0_9999px_rgba(2,6,23,0.55)]"
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
          }}
        />
      )}

      <div
        ref={tooltipRef}
        role="dialog"
        aria-modal="false"
        aria-label={`Tutorial: ${step.title}`}
        data-testid="tour-tooltip"
        data-step={step.id}
        data-placement={position?.placement ?? 'fallback'}
        className="fixed z-[97] w-[340px] max-w-[calc(100vw-2rem)] rounded-xl border border-indigo-700 bg-slate-900 p-4 shadow-2xl"
        style={{
          top: position?.top ?? fallbackTop,
          left: position?.left ?? fallbackLeft,
          backgroundColor: 'var(--superficie)',
          color: 'var(--texto)',
        }}
      >
        {position && <span aria-hidden="true" style={arrowStyle(position.placement, position.arrowOffset)} />}

        <div className="flex items-start justify-between gap-3">
          <p className="etiqueta text-indigo-300">
            Paso {stepIndex + 1} de {TOUR_STEPS.length}
          </p>
          <button
            onClick={onClose}
            className="btn-secondary px-2 py-1"
            title="Cerrar el tutorial"
            data-testid="tour-close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="mt-1 text-[16px] font-semibold text-slate-100">{step.title}</p>
        <p className="mt-1 text-sm text-slate-300">{step.description}</p>
        {targetMissing && (
          <p className="mt-2 text-xs text-amber-300" data-testid="tour-target-missing">
            Este elemento no está visible ahora mismo (en móvil puede estar dentro del menú «Menú»).
          </p>
        )}

        <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-800 pt-3">
          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-slate-200"
            data-testid="tour-skip"
          >
            Saltar tutorial
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onPrevious}
              disabled={stepIndex === 0}
              className="btn-secondary text-xs"
              data-testid="tour-previous"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Anterior</span>
            </button>
            <button onClick={onNext} className="btn-primary text-xs" data-testid="tour-next">
              <span>{isLast ? 'Finalizar' : 'Siguiente'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
