// Métricas de uso locales (fase 47).
//
// Se guardan en IndexedDB, nunca salen del navegador: cuántos videos se han
// exportado, cuántos segundos suman, cuándo se usó la app por primera vez y
// cuándo por última. Las transformaciones son puras para poder probarlas.

import {
  StoredUsageMetrics,
  getUsageMetricsRecord,
  saveUsageMetricsRecord,
} from '../storage/db';

export const USAGE_RECORD_ID = 'usage';

export interface UsageMetrics {
  exportedVideos: number;
  /** Suma de la duración real de cada video exportado, en segundos. */
  exportedSeconds: number;
  firstUseAt: number | null;
  lastUseAt: number | null;
}

export const EMPTY_USAGE: UsageMetrics = {
  exportedVideos: 0,
  exportedSeconds: 0,
  firstUseAt: null,
  lastUseAt: null,
};

function isTimestamp(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

/** Repara un registro ausente o incompleto sin perder lo que sí es válido. */
export function normalizeUsage(record?: Partial<UsageMetrics> | null): UsageMetrics {
  if (!record) return { ...EMPTY_USAGE };
  return {
    exportedVideos: Number.isFinite(record.exportedVideos) ? Math.max(0, record.exportedVideos ?? 0) : 0,
    exportedSeconds: Number.isFinite(record.exportedSeconds)
      ? Math.max(0, Number((record.exportedSeconds ?? 0).toFixed(2)))
      : 0,
    firstUseAt: isTimestamp(record.firstUseAt) ? record.firstUseAt : null,
    lastUseAt: isTimestamp(record.lastUseAt) ? record.lastUseAt : null,
  };
}

/** Registra una sesión: la primera fecha se conserva y la última se actualiza. */
export function registerUse(metrics: UsageMetrics, now: number = Date.now()): UsageMetrics {
  return {
    ...metrics,
    firstUseAt: metrics.firstUseAt ?? now,
    lastUseAt: now,
  };
}

/** Suma un video exportado con su duración real. */
export function registerExport(
  metrics: UsageMetrics,
  durationSeconds: number,
  now: number = Date.now()
): UsageMetrics {
  const seconds = Number.isFinite(durationSeconds) && durationSeconds > 0 ? durationSeconds : 0;
  return registerUse(
    {
      ...metrics,
      exportedVideos: metrics.exportedVideos + 1,
      exportedSeconds: Number((metrics.exportedSeconds + seconds).toFixed(2)),
    },
    now
  );
}

/** Fecha legible en español, o «—» si todavía no hay dato. */
export function formatUsageDate(timestamp: number | null): string {
  if (!timestamp) return '—';
  return new Date(timestamp).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' });
}

/** Duración total en formato «1 h 02 min», «3 min 05 s» o «12 s». */
export function formatUsageDuration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const rest = total % 60;
  if (hours > 0) return `${hours} h ${String(minutes).padStart(2, '0')} min`;
  if (minutes > 0) return `${minutes} min ${String(rest).padStart(2, '0')} s`;
  return `${rest} s`;
}

function toRecord(metrics: UsageMetrics): StoredUsageMetrics {
  return { id: USAGE_RECORD_ID, ...metrics };
}

/** Lee el registro; si no existe o está roto, devuelve ceros. */
export async function loadUsageMetrics(): Promise<UsageMetrics> {
  try {
    return normalizeUsage(await getUsageMetricsRecord(USAGE_RECORD_ID));
  } catch {
    return { ...EMPTY_USAGE };
  }
}

// Las escrituras se encadenan para que dos exportaciones seguidas no se pisen
// al leer-modificar-escribir el mismo registro.
let writeQueue: Promise<unknown> = Promise.resolve();

function updateUsage(transform: (current: UsageMetrics) => UsageMetrics): Promise<UsageMetrics> {
  const run = writeQueue.then(async () => {
    const current = await loadUsageMetrics();
    const next = transform(current);
    await saveUsageMetricsRecord(toRecord(next));
    return next;
  });
  writeQueue = run.catch(() => undefined);
  return run;
}

/** Marca que la app se ha abierto (primera y última fecha de uso). */
export function recordAppUse(now: number = Date.now()): Promise<UsageMetrics> {
  return updateUsage((current) => registerUse(current, now));
}

/** Registra un video exportado; `durationSeconds` es la duración real del archivo. */
export function recordVideoExport(
  durationSeconds: number,
  now: number = Date.now()
): Promise<UsageMetrics> {
  return updateUsage((current) => registerExport(current, durationSeconds, now));
}
