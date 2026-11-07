// Cinematic Transition Engine (Phase 7F)
// Pure Canvas 2D transitions between consecutive visual frames
import { TransitionType, EasingCurve } from '../../types';

export class TransitionEngine {
  /**
   * Applies easing curve to progress (0.0 to 1.0)
   */
  public static ease(progress: number, curve: EasingCurve = 'ease-in-out'): number {
    const t = Math.max(0, Math.min(1, progress));
    switch (curve) {
      case 'linear':
        return t;
      case 'ease-in':
        return t * t;
      case 'ease-out':
        return t * (2 - t);
      case 'ease-in-out':
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      default:
        return t;
    }
  }

  /**
   * Renders a transition from source canvas/drawable to destination canvas/drawable
   */
  public static renderTransition(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    fromDrawable: CanvasImageSource | null,
    toDrawable: CanvasImageSource | null,
    type: TransitionType,
    rawProgress: number,
    easing: EasingCurve = 'ease-in-out'
  ): void {
    const progress = this.ease(rawProgress, easing);

    ctx.save();

    switch (type) {
      case 'cut': {
        // Immediate cut at mid-point or progress >= 0.5
        const active = progress >= 0.5 ? toDrawable : fromDrawable;
        if (active) ctx.drawImage(active, 0, 0, width, height);
        break;
      }

      case 'fade':
      case 'crossfade': {
        // True alpha blend between from and to
        if (fromDrawable) {
          ctx.globalAlpha = 1.0 - progress;
          ctx.drawImage(fromDrawable, 0, 0, width, height);
        }
        if (toDrawable) {
          ctx.globalAlpha = progress;
          ctx.drawImage(toDrawable, 0, 0, width, height);
        }
        break;
      }

      case 'slide-left': {
        const offset = progress * width;
        if (fromDrawable) {
          ctx.drawImage(fromDrawable, -offset, 0, width, height);
        }
        if (toDrawable) {
          ctx.drawImage(toDrawable, width - offset, 0, width, height);
        }
        break;
      }

      case 'slide-right': {
        const offset = progress * width;
        if (fromDrawable) {
          ctx.drawImage(fromDrawable, offset, 0, width, height);
        }
        if (toDrawable) {
          ctx.drawImage(toDrawable, -width + offset, 0, width, height);
        }
        break;
      }

      case 'slide-up': {
        const offset = progress * height;
        if (fromDrawable) {
          ctx.drawImage(fromDrawable, 0, -offset, width, height);
        }
        if (toDrawable) {
          ctx.drawImage(toDrawable, 0, height - offset, width, height);
        }
        break;
      }

      case 'slide-down': {
        const offset = progress * height;
        if (fromDrawable) {
          ctx.drawImage(fromDrawable, 0, offset, width, height);
        }
        if (toDrawable) {
          ctx.drawImage(toDrawable, 0, -height + offset, width, height);
        }
        break;
      }

      case 'zoom-in': {
        // From zooms in and dissolves out, To expands in from center
        if (fromDrawable) {
          ctx.save();
          const scale = 1.0 + progress * 0.4;
          ctx.globalAlpha = 1.0 - progress;
          ctx.translate(width / 2, height / 2);
          ctx.scale(scale, scale);
          ctx.drawImage(fromDrawable, -width / 2, -height / 2, width, height);
          ctx.restore();
        }
        if (toDrawable) {
          ctx.save();
          const scale = 0.7 + progress * 0.3;
          ctx.globalAlpha = progress;
          ctx.translate(width / 2, height / 2);
          ctx.scale(scale, scale);
          ctx.drawImage(toDrawable, -width / 2, -height / 2, width, height);
          ctx.restore();
        }
        break;
      }

      case 'zoom-out': {
        // From shrinks to center, To reveals underneath
        if (toDrawable) {
          ctx.drawImage(toDrawable, 0, 0, width, height);
        }
        if (fromDrawable) {
          ctx.save();
          const scale = Math.max(0.01, 1.0 - progress * 0.5);
          ctx.globalAlpha = 1.0 - progress;
          ctx.translate(width / 2, height / 2);
          ctx.scale(scale, scale);
          ctx.drawImage(fromDrawable, -width / 2, -height / 2, width, height);
          ctx.restore();
        }
        break;
      }

      case 'wipe-left': {
        // Linear wipe revealing toDrawable from right to left
        const splitX = (1.0 - progress) * width;
        if (toDrawable) {
          ctx.drawImage(toDrawable, 0, 0, width, height);
        }
        if (fromDrawable) {
          ctx.save();
          ctx.beginPath();
          ctx.rect(0, 0, splitX, height);
          ctx.clip();
          ctx.drawImage(fromDrawable, 0, 0, width, height);
          ctx.restore();
        }
        break;
      }

      case 'wipe-right': {
        // Linear wipe revealing toDrawable from left to right
        const splitX = progress * width;
        if (fromDrawable) {
          ctx.drawImage(fromDrawable, 0, 0, width, height);
        }
        if (toDrawable) {
          ctx.save();
          ctx.beginPath();
          ctx.rect(0, 0, splitX, height);
          ctx.clip();
          ctx.drawImage(toDrawable, 0, 0, width, height);
          ctx.restore();
        }
        break;
      }

      case 'fade-to-black': {
        // Dip to solid black in first half, then reveal toDrawable in second half
        if (progress < 0.5) {
          const subProgress = progress * 2;
          if (fromDrawable) {
            ctx.globalAlpha = 1.0 - subProgress;
            ctx.drawImage(fromDrawable, 0, 0, width, height);
          }
          ctx.fillStyle = '#000000';
          ctx.globalAlpha = subProgress;
          ctx.fillRect(0, 0, width, height);
        } else {
          const subProgress = (progress - 0.5) * 2;
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, width, height);
          if (toDrawable) {
            ctx.globalAlpha = subProgress;
            ctx.drawImage(toDrawable, 0, 0, width, height);
          }
        }
        break;
      }

      case 'fade-from-black': {
        // Starts in black, reveals toDrawable
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, width, height);
        if (toDrawable) {
          ctx.globalAlpha = progress;
          ctx.drawImage(toDrawable, 0, 0, width, height);
        }
        break;
      }

      default: {
        if (toDrawable) ctx.drawImage(toDrawable, 0, 0, width, height);
        else if (fromDrawable) ctx.drawImage(fromDrawable, 0, 0, width, height);
        break;
      }
    }

    ctx.restore();
  }
}
