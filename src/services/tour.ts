// Tutorial interactivo (fase 45).
//
// Cinco pasos que apuntan a elementos reales de la interfaz. La posición del
// tooltip se calcula aquí, sin DOM, para poder probarla: el componente solo
// mide el elemento con getBoundingClientRect y pasa los rectángulos.

export type TourPlacement = 'top' | 'bottom' | 'left' | 'right';

export interface TourStep {
  id: string;
  title: string;
  description: string;
  /** Selector del elemento real al que apunta el tooltip. */
  target: string;
  /** Sección que hay que abrir para que el elemento exista (null = no cambia). */
  section: string | null;
  placement: TourPlacement;
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'script',
    title: 'Pestaña Script',
    description:
      'El Taller de guion es el centro del proyecto: aquí escribes cada escena, su duración, su narración y sus subtítulos.',
    target: '[data-testid="section-guion"]',
    section: 'guion',
    placement: 'right',
  },
  {
    id: 'ia',
    title: 'Generar con IA',
    description:
      'En Ideas, escribe un tema y pulsa «Generar guion»: Gemini crea el gancho, las escenas y el cierre editables.',
    target: '[data-testid="gemini-generate"]',
    section: 'ideas',
    placement: 'bottom',
  },
  {
    id: 'biblioteca',
    title: 'Pestaña Biblioteca',
    description:
      'Sube imágenes, clips de video, voces y música. Todo se guarda en este navegador y se reutiliza en cualquier escena.',
    target: '[data-testid="section-biblioteca"]',
    section: 'biblioteca',
    placement: 'right',
  },
  {
    id: 'exportar',
    title: 'Botón Exportar',
    description:
      '«Exportar video» abre el resumen, el reporte de calidad y el formato real que puede producir este navegador.',
    target: '[data-testid="export-video"]',
    section: null,
    placement: 'bottom',
  },
  {
    id: 'versiones',
    title: 'Panel Versiones',
    description:
      'Cada exportación guarda una instantánea del proyecto. Aquí ves su fecha y duración, y puedes restaurar las cinco más recientes.',
    target: '[data-testid="versions-panel"]',
    section: 'versiones',
    placement: 'bottom',
  },
];

export interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface TooltipPosition {
  top: number;
  left: number;
  placement: TourPlacement;
  /** Distancia del centro de la flecha al borde superior/izquierdo del tooltip. */
  arrowOffset: number;
}

/** Separación entre el elemento y el tooltip. */
export const TOOLTIP_GAP = 12;
/** Margen mínimo con los bordes de la ventana. */
export const VIEWPORT_MARGIN = 8;
/** La flecha nunca se acerca más que esto a las esquinas del tooltip. */
export const ARROW_INSET = 18;

const OPPOSITE: Record<TourPlacement, TourPlacement> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
};

const ALL_PLACEMENTS: TourPlacement[] = ['bottom', 'top', 'right', 'left'];

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

/**
 * Coloca el tooltip junto al elemento apuntado. Prueba primero la posición
 * pedida y, si no cabe, la contraria y el resto; después lo mantiene dentro de
 * la ventana. La flecha se centra en el elemento salvo que el tooltip tenga que
 * desplazarse.
 */
export function computeTooltipPosition(
  target: Rect,
  tooltip: Size,
  viewport: Size,
  preferred: TourPlacement,
  gap: number = TOOLTIP_GAP
): TooltipPosition {
  const space: Record<TourPlacement, number> = {
    top: target.top,
    bottom: viewport.height - (target.top + target.height),
    left: target.left,
    right: viewport.width - (target.left + target.width),
  };
  const needed: Record<TourPlacement, number> = {
    top: tooltip.height,
    bottom: tooltip.height,
    left: tooltip.width,
    right: tooltip.width,
  };

  const candidates: TourPlacement[] = [preferred, OPPOSITE[preferred], ...ALL_PLACEMENTS];
  const placement =
    candidates.find((candidate) => space[candidate] >= needed[candidate] + gap) ?? preferred;

  const targetCenterX = target.left + target.width / 2;
  const targetCenterY = target.top + target.height / 2;

  let top = 0;
  let left = 0;
  if (placement === 'bottom') {
    top = target.top + target.height + gap;
    left = targetCenterX - tooltip.width / 2;
  } else if (placement === 'top') {
    top = target.top - tooltip.height - gap;
    left = targetCenterX - tooltip.width / 2;
  } else if (placement === 'right') {
    left = target.left + target.width + gap;
    top = targetCenterY - tooltip.height / 2;
  } else {
    left = target.left - tooltip.width - gap;
    top = targetCenterY - tooltip.height / 2;
  }

  top = clamp(top, VIEWPORT_MARGIN, viewport.height - tooltip.height - VIEWPORT_MARGIN);
  left = clamp(left, VIEWPORT_MARGIN, viewport.width - tooltip.width - VIEWPORT_MARGIN);

  const arrowOffset =
    placement === 'top' || placement === 'bottom'
      ? clamp(targetCenterX - left, ARROW_INSET, tooltip.width - ARROW_INSET)
      : clamp(targetCenterY - top, ARROW_INSET, tooltip.height - ARROW_INSET);

  return { top, left, placement, arrowOffset };
}
