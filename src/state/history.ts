/**
 * Undo/redo history for the builder. Pure helpers + a small hook.
 *
 * History keeps a stack of past states and a stack of future (redone) states.
 * New states are pushed with `commit`; consecutive commits that happen within
 * `groupMs` of each other (e.g. rapid slider/typing updates) merge into one
 * history entry, so undo steps back over a burst of changes instead of every
 * single keystroke.
 */

export interface HistoryState<T> {
  /** Past states, oldest first. The current state is NOT in this array. */
  past: T[];
  /** The current state. */
  present: T;
  /** States ahead (after undos), nearest first. Empty when nothing to redo. */
  future: T[];
}

export function initialHistory<T>(present: T): HistoryState<T> {
  return { past: [], present, future: [] };
}

export function canUndo<T>(h: HistoryState<T>): boolean {
  return h.past.length > 0;
}

export function canRedo<T>(h: HistoryState<T>): boolean {
  return h.future.length > 0;
}

/** Push a new state onto the history. */
export function commit<T>(h: HistoryState<T>, next: T): HistoryState<T> {
  return { past: [...h.past, h.present], present: next, future: [] };
}

/** Merge `next` into the current history entry (same undo step). */
export function merge<T>(h: HistoryState<T>, next: T): HistoryState<T> {
  return { ...h, present: next };
}

/**
 * Commit, but merge with the previous commit if `withinMs` elapsed since it.
 * `lastCommitAt` (ms epoch) tracks when the previous commit happened; returns
 * the new history AND the new timestamp.
 */
export function commitWithin<T>(
  h: HistoryState<T>,
  next: T,
  lastCommitAt: number | null,
  withinMs: number,
  now: number,
): { history: HistoryState<T>; lastCommitAt: number } {
  if (lastCommitAt !== null && now - lastCommitAt <= withinMs) {
    return { history: merge(h, next), lastCommitAt: now };
  }
  return { history: commit(h, next), lastCommitAt: now };
}

export function undo<T>(h: HistoryState<T>): HistoryState<T> {
  if (h.past.length === 0) return h;
  const previous = h.past[h.past.length - 1]!;
  return {
    past: h.past.slice(0, -1),
    present: previous,
    future: [h.present, ...h.future],
  };
}

export function redo<T>(h: HistoryState<T>): HistoryState<T> {
  if (h.future.length === 0) return h;
  const next = h.future[0]!;
  return {
    past: [...h.past, h.present],
    present: next,
    future: h.future.slice(1),
  };
}

/** Replace the whole history with a new present state (external load). */
export function reset<T>(_h: HistoryState<T>, present: T): HistoryState<T> {
  return initialHistory(present);
}
