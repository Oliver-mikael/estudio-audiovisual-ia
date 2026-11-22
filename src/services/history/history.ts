// Historial de estados para deshacer/rehacer.
//
// Es lógica pura y genérica: guarda hasta HISTORY_LIMIT estados anteriores del
// proyecto. Cada acción nueva descarta el futuro (como cualquier editor), y una
// acción que se puede agrupar (por ejemplo escribir en el mismo campo) puede no
// crear un paso nuevo desde la capa que lo usa.

export const HISTORY_LIMIT = 50;

export interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

export function createHistory<T>(present: T): HistoryState<T> {
  return { past: [], present, future: [] };
}

/** Registra un estado nuevo como presente y descarta los rehaceres pendientes. */
export function pushHistory<T>(
  state: HistoryState<T>,
  next: T,
  limit: number = HISTORY_LIMIT
): HistoryState<T> {
  const past = [...state.past, state.present];
  return {
    past: past.slice(Math.max(0, past.length - Math.max(1, limit))),
    present: next,
    future: [],
  };
}

export function canUndo<T>(state: HistoryState<T>): boolean {
  return state.past.length > 0;
}

export function canRedo<T>(state: HistoryState<T>): boolean {
  return state.future.length > 0;
}

/** Vuelve al estado anterior; si no hay, devuelve el mismo objeto. */
export function undo<T>(state: HistoryState<T>): HistoryState<T> {
  if (state.past.length === 0) return state;
  const previous = state.past[state.past.length - 1];
  return {
    past: state.past.slice(0, -1),
    present: previous,
    future: [state.present, ...state.future],
  };
}

/** Reaplica el último estado deshecho; si no hay, devuelve el mismo objeto. */
export function redo<T>(state: HistoryState<T>): HistoryState<T> {
  if (state.future.length === 0) return state;
  const [next, ...rest] = state.future;
  return {
    past: [...state.past, state.present],
    present: next,
    future: rest,
  };
}
