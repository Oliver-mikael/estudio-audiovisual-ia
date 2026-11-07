// Keyframe Animation Engine (Phase 7F)
// Interpolates spatial transform, scale, rotation and opacity curves at any given millisecond
import {
  ClipAnimation,
  AnimationKeyframe,
  KeyframeProperty,
  EasingCurve,
} from '../../types';
import { TransitionEngine } from './transitionEngine';

export interface InterpolatedTransform {
  positionX: number; // in pixels offset
  positionY: number; // in pixels offset
  scale: number; // 1.0 = normal
  rotation: number; // in degrees
  opacity: number; // 0.0 to 1.0
}

export class KeyframeEngine {
  /**
   * Default property value when no keyframe is specified
   */
  public static getDefaultValue(prop: KeyframeProperty): number {
    switch (prop) {
      case 'positionX':
      case 'positionY':
      case 'rotation':
        return 0;
      case 'scale':
      case 'opacity':
        return 1.0;
    }
  }

  /**
   * Interpolates a single property value at a specific time offset within a clip
   */
  public static interpolateProperty(
    keyframes: AnimationKeyframe[],
    timeOffsetMs: number,
    defaultValue: number
  ): number {
    if (!keyframes || keyframes.length === 0) {
      return defaultValue;
    }

    // Sort keyframes ascending by time offset
    const sorted = [...keyframes].sort((a, b) => a.timeOffsetMs - b.timeOffsetMs);

    // If before first keyframe, clamp to first value
    if (timeOffsetMs <= sorted[0].timeOffsetMs) {
      return sorted[0].value;
    }

    // If after last keyframe, clamp to last value
    const last = sorted[sorted.length - 1];
    if (timeOffsetMs >= last.timeOffsetMs) {
      return last.value;
    }

    // Find the bounding keyframe segment [k1, k2]
    for (let i = 0; i < sorted.length - 1; i++) {
      const k1 = sorted[i];
      const k2 = sorted[i + 1];

      if (timeOffsetMs >= k1.timeOffsetMs && timeOffsetMs <= k2.timeOffsetMs) {
        const span = k2.timeOffsetMs - k1.timeOffsetMs;
        if (span <= 0) return k1.value;

        const rawT = (timeOffsetMs - k1.timeOffsetMs) / span;
        const easing: EasingCurve = k2.easing || 'linear';
        const easedT = TransitionEngine.ease(rawT, easing);

        return k1.value + (k2.value - k1.value) * easedT;
      }
    }

    return defaultValue;
  }

  /**
   * Computes the complete interpolated transform state for a clip at timeOffsetMs
   */
  public static interpolateClipTransform(
    animations: ClipAnimation[] | undefined,
    timeOffsetMs: number,
    baseTransform?: { x?: number; y?: number; scale?: number; rotation?: number },
    baseOpacity?: number
  ): InterpolatedTransform {
    const result: InterpolatedTransform = {
      positionX: baseTransform?.x ?? 0,
      positionY: baseTransform?.y ?? 0,
      scale: baseTransform?.scale ?? 1.0,
      rotation: baseTransform?.rotation ?? 0,
      opacity: baseOpacity ?? 1.0,
    };

    if (!animations || animations.length === 0) {
      return result;
    }

    for (const anim of animations) {
      switch (anim.property) {
        case 'positionX':
          result.positionX = this.interpolateProperty(
            anim.keyframes,
            timeOffsetMs,
            result.positionX
          );
          break;
        case 'positionY':
          result.positionY = this.interpolateProperty(
            anim.keyframes,
            timeOffsetMs,
            result.positionY
          );
          break;
        case 'scale':
          result.scale = this.interpolateProperty(anim.keyframes, timeOffsetMs, result.scale);
          break;
        case 'rotation':
          result.rotation = this.interpolateProperty(
            anim.keyframes,
            timeOffsetMs,
            result.rotation
          );
          break;
        case 'opacity':
          result.opacity = this.interpolateProperty(anim.keyframes, timeOffsetMs, result.opacity);
          break;
      }
    }

    // Clamp opacity between 0 and 1
    result.opacity = Math.max(0, Math.min(1, result.opacity));

    return result;
  }

  /**
   * Applies the interpolated transform to a 2D rendering context centered around (centerX, centerY)
   */
  public static applyTransformToContext(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    transform: InterpolatedTransform
  ): void {
    ctx.translate(centerX + transform.positionX, centerY + transform.positionY);
    if (transform.rotation !== 0) {
      ctx.rotate((transform.rotation * Math.PI) / 180);
    }
    if (transform.scale !== 1.0) {
      ctx.scale(transform.scale, transform.scale);
    }
    ctx.globalAlpha *= transform.opacity;
  }
}
