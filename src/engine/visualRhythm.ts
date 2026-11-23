// Ritmo visual: cortes automáticos entre la imagen principal y la secundaria.
//
// En una escena de más de 4 segundos, el renderer alterna la imagen principal y
// la secundaria cada 3 segundos (si existe secundaria) para que el espectador no
// vea una foto estática demasiado tiempo. Se puede desactivar por escena con
// `scene.autoCuts = false`.

import { Scene } from '../types';

export const AUTO_CUT_INTERVAL_SECONDS = 3;
export const AUTO_CUT_MIN_SCENE_SECONDS = 4;

export type VisualSlot = 'primary' | 'secondary';

/** true si la escena debe alternar entre sus dos imágenes. */
export function hasAutoCuts(scene: Scene): boolean {
  return (
    scene.durationSeconds > AUTO_CUT_MIN_SCENE_SECONDS &&
    scene.autoCuts !== false &&
    Boolean(scene.secondaryImageUrl || scene.secondaryImageAssetId)
  );
}

/**
 * Imagen que se dibuja en un instante de la escena: la principal durante los
 * primeros 3 s, la secundaria los 3 s siguientes, y así sucesivamente.
 */
export function visualSlotAt(scene: Scene, sceneLocalTime: number): VisualSlot {
  if (!hasAutoCuts(scene)) return 'primary';
  const slot = Math.floor(Math.max(0, sceneLocalTime) / AUTO_CUT_INTERVAL_SECONDS);
  return slot % 2 === 1 ? 'secondary' : 'primary';
}

/** Instantes (relativos a la escena) en los que cambia la imagen. */
export function visualCutTimes(scene: Scene): number[] {
  if (!hasAutoCuts(scene)) return [];
  const times: number[] = [];
  for (let time = AUTO_CUT_INTERVAL_SECONDS; time < scene.durationSeconds; time += AUTO_CUT_INTERVAL_SECONDS) {
    times.push(time);
  }
  return times;
}
