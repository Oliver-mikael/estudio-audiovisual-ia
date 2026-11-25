import { describe, expect, it } from 'vitest';
import {
  ARROW_INSET,
  TOUR_STEPS,
  TOOLTIP_GAP,
  VIEWPORT_MARGIN,
  computeTooltipPosition,
} from '../services/tour';

const viewport = { width: 1280, height: 800 };

describe('tutorial interactivo (fase 45)', () => {
  it('define 5 pasos en el orden pedido y apunta a elementos reales', () => {
    expect(TOUR_STEPS).toHaveLength(5);
    expect(TOUR_STEPS.map((step) => step.id)).toEqual([
      'script',
      'ia',
      'biblioteca',
      'exportar',
      'versiones',
    ]);
    expect(TOUR_STEPS.map((step) => step.target)).toEqual([
      '[data-testid="section-guion"]',
      '[data-testid="gemini-generate"]',
      '[data-testid="section-biblioteca"]',
      '[data-testid="export-video"]',
      '[data-testid="versions-panel"]',
    ]);
  });

  it('a la derecha queda pegado al borde derecho del elemento y centrado en vertical', () => {
    const target = { top: 300, left: 100, width: 200, height: 44 };
    const tooltip = { width: 340, height: 180 };
    const position = computeTooltipPosition(target, tooltip, viewport, 'right');

    expect(position.placement).toBe('right');
    expect(position.left).toBe(target.left + target.width + TOOLTIP_GAP);
    expect(position.top).toBe(target.top + target.height / 2 - tooltip.height / 2);
    expect(position.arrowOffset).toBe(90);
  });

  it('debajo queda separado por el hueco y centrado en horizontal', () => {
    const target = { top: 100, left: 500, width: 120, height: 40 };
    const tooltip = { width: 340, height: 170 };
    const position = computeTooltipPosition(target, tooltip, viewport, 'bottom');

    expect(position.placement).toBe('bottom');
    expect(position.top).toBe(target.top + target.height + TOOLTIP_GAP);
    expect(position.left).toBe(560 - 170);
    expect(position.arrowOffset).toBe(170);
  });

  it('cambia de lado si no cabe en la posición pedida', () => {
    const nearBottom = { top: 700, left: 400, width: 120, height: 40 };
    const tooltip = { width: 340, height: 180 };
    const below = computeTooltipPosition(nearBottom, tooltip, viewport, 'bottom');
    expect(below.placement).toBe('top');
    expect(below.top + tooltip.height + TOOLTIP_GAP).toBe(nearBottom.top);

    const nearRight = { top: 300, left: 1050, width: 200, height: 40 };
    const right = computeTooltipPosition(nearRight, tooltip, viewport, 'right');
    expect(right.placement).toBe('left');
    expect(right.left + tooltip.width + TOOLTIP_GAP).toBe(nearRight.left);
  });

  it('nunca sale de la ventana y la flecha sigue dentro del tooltip', () => {
    const target = { top: 20, left: 20, width: 60, height: 30 };
    const tooltip = { width: 340, height: 180 };
    const position = computeTooltipPosition(target, tooltip, { width: 360, height: 640 }, 'right');

    expect(position.left).toBeGreaterThanOrEqual(VIEWPORT_MARGIN);
    expect(position.left + tooltip.width).toBeLessThanOrEqual(360 - VIEWPORT_MARGIN);
    expect(position.top).toBeGreaterThanOrEqual(VIEWPORT_MARGIN);
    expect(position.top + tooltip.height).toBeLessThanOrEqual(640 - VIEWPORT_MARGIN);
    expect(position.arrowOffset).toBeGreaterThanOrEqual(ARROW_INSET);
    expect(position.arrowOffset).toBeLessThanOrEqual(tooltip.width - ARROW_INSET);
  });

  it('con el tooltip desplazado la flecha apunta al elemento, no al centro', () => {
    // Elemento a la izquierda de la pantalla: el tooltip se pega al margen y la
    // flecha tiene que quedar más a la izquierda que el centro del tooltip.
    const target = { top: 100, left: 8, width: 44, height: 44 };
    const tooltip = { width: 340, height: 180 };
    const position = computeTooltipPosition(target, tooltip, viewport, 'bottom');

    const arrowAbsoluteX = position.left + position.arrowOffset;
    expect(arrowAbsoluteX).toBeCloseTo(target.left + target.width / 2, 5);
    expect(position.arrowOffset).toBeLessThan(tooltip.width / 2);
  });
});
