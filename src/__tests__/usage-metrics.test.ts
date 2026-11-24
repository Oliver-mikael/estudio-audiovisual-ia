import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  EMPTY_USAGE,
  USAGE_RECORD_ID,
  formatUsageDate,
  formatUsageDuration,
  loadUsageMetrics,
  normalizeUsage,
  recordAppUse,
  recordVideoExport,
  registerExport,
  registerUse,
} from '../services/metrics/usage';
import { saveUsageMetricsRecord } from '../services/storage/db';

describe('métricas de uso local (fase 47)', () => {
  beforeEach(async () => {
    await saveUsageMetricsRecord({ id: USAGE_RECORD_ID, ...EMPTY_USAGE });
  });

  it('el primer uso fija la fecha y los siguientes solo actualizan la última', () => {
    const first = registerUse(EMPTY_USAGE, 1_000);
    expect(first.firstUseAt).toBe(1_000);
    expect(first.lastUseAt).toBe(1_000);

    const second = registerUse(first, 5_000);
    expect(second.firstUseAt).toBe(1_000);
    expect(second.lastUseAt).toBe(5_000);
  });

  it('cada exportación suma un video y su duración', () => {
    const afterOne = registerExport(EMPTY_USAGE, 12.5, 1_000);
    expect(afterOne.exportedVideos).toBe(1);
    expect(afterOne.exportedSeconds).toBe(12.5);
    expect(afterOne.firstUseAt).toBe(1_000);

    const afterTwo = registerExport(afterOne, 7.25, 2_000);
    expect(afterTwo.exportedVideos).toBe(2);
    expect(afterTwo.exportedSeconds).toBe(19.75);
    expect(afterTwo.lastUseAt).toBe(2_000);
  });

  it('ignora duraciones inválidas sin romper el contador', () => {
    expect(registerExport(EMPTY_USAGE, Number.NaN, 1).exportedSeconds).toBe(0);
    expect(registerExport(EMPTY_USAGE, -4, 1).exportedSeconds).toBe(0);
    expect(registerExport(EMPTY_USAGE, Number.NaN, 1).exportedVideos).toBe(1);
  });

  it('repara registros incompletos o corruptos', () => {
    expect(normalizeUsage(null)).toEqual(EMPTY_USAGE);
    expect(normalizeUsage({ exportedVideos: '3' as unknown as number })).toEqual(EMPTY_USAGE);
    expect(normalizeUsage({ exportedVideos: 2, exportedSeconds: 3.456 })).toMatchObject({
      exportedVideos: 2,
      exportedSeconds: 3.46,
      firstUseAt: null,
    });
  });

  it('formatea fechas y duraciones en español', () => {
    expect(formatUsageDate(null)).toBe('—');
    expect(formatUsageDate(1_700_000_000_000)).toContain('2023');
    expect(formatUsageDuration(0)).toBe('0 s');
    expect(formatUsageDuration(12.4)).toBe('12 s');
    expect(formatUsageDuration(65)).toBe('1 min 05 s');
    expect(formatUsageDuration(3_720)).toBe('1 h 02 min');
  });

  it('persiste en IndexedDB: tras 2 exports los contadores son correctos', async () => {
    await recordAppUse(1_000);
    await recordVideoExport(10, 2_000);
    await recordVideoExport(5.5, 3_000);

    const stored = await loadUsageMetrics();
    expect(stored).toEqual({
      exportedVideos: 2,
      exportedSeconds: 15.5,
      firstUseAt: 1_000,
      lastUseAt: 3_000,
    });

    // Las fechas sobreviven a una nueva lectura (primera se conserva al reabrir).
    await recordAppUse(9_000);
    const reopened = await loadUsageMetrics();
    expect(reopened.firstUseAt).toBe(1_000);
    expect(reopened.lastUseAt).toBe(9_000);
    expect(reopened.exportedVideos).toBe(2);
  });

  it('dos exportaciones simultáneas no pierden ninguna', async () => {
    await Promise.all([recordVideoExport(4, 1), recordVideoExport(6, 2)]);
    const stored = await loadUsageMetrics();
    expect(stored.exportedVideos).toBe(2);
    expect(stored.exportedSeconds).toBe(10);
  });
});
