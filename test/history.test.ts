import { describe, expect, it } from "vitest";
import {
  canRedo,
  canUndo,
  commit,
  commitWithin,
  initialHistory,
  merge,
  redo,
  reset,
  undo,
} from "../src/state/history.js";

describe("history", () => {
  it("commits push past states and clear future", () => {
    let h = initialHistory("a");
    h = commit(h, "b");
    h = commit(h, "c");
    expect(h.present).toBe("c");
    expect(h.past).toEqual(["a", "b"]);
    expect(canUndo(h)).toBe(true);
    expect(canRedo(h)).toBe(false);
  });

  it("undo walks back and redo walks forward", () => {
    let h = initialHistory("a");
    h = commit(h, "b");
    h = commit(h, "c");
    h = undo(h);
    expect(h.present).toBe("b");
    expect(canRedo(h)).toBe(true);
    h = undo(h);
    expect(h.present).toBe("a");
    h = undo(h); // at the beginning — no-op
    expect(h.present).toBe("a");
    h = redo(h);
    expect(h.present).toBe("b");
    h = redo(h);
    expect(h.present).toBe("c");
    h = redo(h); // at the end — no-op
    expect(h.present).toBe("c");
  });

  it("a fresh commit after undo drops the redo branch", () => {
    let h = initialHistory("a");
    h = commit(h, "b");
    h = commit(h, "c");
    h = undo(h); // present = b
    h = commit(h, "d");
    expect(h.present).toBe("d");
    expect(h.future).toEqual([]); // "c" is gone
  });

  it("merge replaces present without growing past", () => {
    let h = initialHistory("a");
    h = commit(h, "b");
    h = merge(h, "b2");
    expect(h.present).toBe("b2");
    expect(h.past).toEqual(["a"]);
  });

  it("commitWithin merges rapid commits into one undo step", () => {
    let h = initialHistory("a");
    let t: number | null = null;
    // commit "b" at t=1000 (no previous commit)
    const r1 = commitWithin(h, "b", t, 400, 1000);
    h = r1.history;
    t = r1.lastCommitAt;
    expect(h.present).toBe("b");
    expect(h.past).toEqual(["a"]);
    // "b1" 200ms later → merges
    const r2 = commitWithin(h, "b1", t, 400, 1200);
    h = r2.history;
    t = r2.lastCommitAt;
    expect(h.present).toBe("b1");
    expect(h.past).toEqual(["a"]); // still one step
    // "c" 500ms later → new entry
    const r3 = commitWithin(h, "c", t, 400, 1700);
    h = r3.history;
    expect(h.present).toBe("c");
    expect(h.past).toEqual(["a", "b1"]);
    // undo skips back over the merged burst in one go
    h = undo(h);
    expect(h.present).toBe("b1");
  });

  it("reset replaces everything", () => {
    let h = initialHistory("a");
    h = commit(h, "b");
    h = reset(h, "z");
    expect(h.present).toBe("z");
    expect(h.past).toEqual([]);
    expect(h.future).toEqual([]);
    expect(canUndo(h)).toBe(false);
  });
});
