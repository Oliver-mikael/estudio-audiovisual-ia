import { describe, it, expect, vi } from 'vitest';
import { TransitionEngine } from '../services/animation/transitionEngine';
import { KeyframeEngine } from '../services/animation/keyframeEngine';
import { ClipAnimation, TransitionType, EasingCurve } from '../types';

describe('Phase 7F - Transition and Keyframe Animation Engine', () => {
  describe('TransitionEngine', () => {
    it('calculates easing curves correctly', () => {
      // Linear
      expect(TransitionEngine.ease(0, 'linear')).toBe(0);
      expect(TransitionEngine.ease(0.5, 'linear')).toBe(0.5);
      expect(TransitionEngine.ease(1, 'linear')).toBe(1);

      // Ease-in
      expect(TransitionEngine.ease(0, 'ease-in')).toBe(0);
      expect(TransitionEngine.ease(0.5, 'ease-in')).toBe(0.25);
      expect(TransitionEngine.ease(1, 'ease-in')).toBe(1);

      // Ease-out
      expect(TransitionEngine.ease(0, 'ease-out')).toBe(0);
      expect(TransitionEngine.ease(0.5, 'ease-out')).toBe(0.75);
      expect(TransitionEngine.ease(1, 'ease-out')).toBe(1);

      // Clamping limits
      expect(TransitionEngine.ease(-0.5, 'linear')).toBe(0);
      expect(TransitionEngine.ease(1.5, 'linear')).toBe(1);
    });

    it('renders all transition types without throwing errors', () => {
      const mockCtx = {
        save: vi.fn(),
        restore: vi.fn(),
        drawImage: vi.fn(),
        translate: vi.fn(),
        scale: vi.fn(),
        beginPath: vi.fn(),
        rect: vi.fn(),
        clip: vi.fn(),
        fillRect: vi.fn(),
        globalAlpha: 1.0,
        fillStyle: '#000000',
      } as unknown as CanvasRenderingContext2D;

      const mockFrom = {} as CanvasImageSource;
      const mockTo = {} as CanvasImageSource;

      const types: TransitionType[] = [
        'cut',
        'fade',
        'crossfade',
        'slide-left',
        'slide-right',
        'slide-up',
        'slide-down',
        'zoom-in',
        'zoom-out',
        'wipe-left',
        'wipe-right',
        'fade-to-black',
        'fade-from-black',
      ];

      for (const t of types) {
        expect(() => {
          TransitionEngine.renderTransition(
            mockCtx,
            1280,
            720,
            mockFrom,
            mockTo,
            t,
            0.5,
            'ease-in-out'
          );
        }).not.toThrow();
      }
    });
  });

  describe('KeyframeEngine', () => {
    it('returns default values for properties', () => {
      expect(KeyframeEngine.getDefaultValue('positionX')).toBe(0);
      expect(KeyframeEngine.getDefaultValue('scale')).toBe(1.0);
      expect(KeyframeEngine.getDefaultValue('opacity')).toBe(1.0);
    });

    it('interpolates keyframes linearly and with easing', () => {
      const keyframes = [
        { id: 'k1', timeOffsetMs: 0, value: 0, easing: 'linear' as EasingCurve },
        { id: 'k2', timeOffsetMs: 1000, value: 100, easing: 'linear' as EasingCurve },
      ];

      // Before first
      expect(KeyframeEngine.interpolateProperty(keyframes, -100, 0)).toBe(0);
      // At first
      expect(KeyframeEngine.interpolateProperty(keyframes, 0, 0)).toBe(0);
      // Mid-point
      expect(KeyframeEngine.interpolateProperty(keyframes, 500, 0)).toBe(50);
      // At last
      expect(KeyframeEngine.interpolateProperty(keyframes, 1000, 0)).toBe(100);
      // After last
      expect(KeyframeEngine.interpolateProperty(keyframes, 1500, 0)).toBe(100);
    });

    it('interpolates complete clip transform state', () => {
      const animations: ClipAnimation[] = [
        {
          property: 'scale',
          keyframes: [
            { id: 'k1', timeOffsetMs: 0, value: 1.0, easing: 'linear' },
            { id: 'k2', timeOffsetMs: 2000, value: 1.5, easing: 'linear' },
          ],
        },
        {
          property: 'positionX',
          keyframes: [
            { id: 'k3', timeOffsetMs: 0, value: 0, easing: 'linear' },
            { id: 'k4', timeOffsetMs: 2000, value: 100, easing: 'linear' },
          ],
        },
        {
          property: 'opacity',
          keyframes: [
            { id: 'k5', timeOffsetMs: 0, value: 1.0, easing: 'linear' },
            { id: 'k6', timeOffsetMs: 2000, value: 0.0, easing: 'linear' },
          ],
        },
      ];

      const stateAt1000 = KeyframeEngine.interpolateClipTransform(animations, 1000);
      expect(stateAt1000.scale).toBeCloseTo(1.25);
      expect(stateAt1000.positionX).toBeCloseTo(50);
      expect(stateAt1000.opacity).toBeCloseTo(0.5);
    });
  });
});
