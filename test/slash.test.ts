import { describe, expect, it } from "vitest";
import { detectToken, suggestVariables, applySuggestion, repeatFieldOf } from "../src/state/slash.js";
import type { VariableSpec } from "../src/types.js";

const vars: VariableSpec[] = [
  { key: "order.number", label: "Order Number", description: "The order's number", sample: "1024" },
  { key: "order.id", label: "Order ID", description: "Unique order id", sample: "abc123" },
  { key: "store.name", label: "Store Name", description: "The store name", sample: "Acme" },
];

describe("detectToken", () => {
  it("detects a token when the caret sits after a slash fragment", () => {
    // "Order /ord": index 6 = "/", so caret 8 = after "/o" → fragment "o"
    const t = detectToken("Order /ord", 8);
    expect(t).toEqual({ start: 6, end: 10, fragment: "o", active: true });
  });

  it("detects a bare slash as active with empty fragment", () => {
    // caret 7 = immediately after "/" → fragment ""
    const t = detectToken("Order /", 7);
    expect(t).toEqual({ start: 6, end: 7, fragment: "", active: true });
  });

  it("returns null when the slash is followed by a space", () => {
    const t = detectToken("Order / ", 8);
    expect(t).toBeNull();
  });

  it("returns null when the caret is outside any token", () => {
    expect(detectToken("Order #1024", 5)).toBeNull();
    expect(detectToken("Order #1024", 0)).toBeNull();
  });

  it("detects the token when the caret is mid-fragment", () => {
    // caret 7 = after "/" → fragment ""
    const t = detectToken("Order /ord", 7);
    expect(t).toEqual({ start: 6, end: 10, fragment: "", active: true });
  });

  it("handles a token at the very start", () => {
    // "/order": caret 3 = after "/or" → fragment "or"
    const t = detectToken("/order", 3);
    expect(t).toEqual({ start: 0, end: 6, fragment: "or", active: true });
  });
});

describe("suggestVariables", () => {
  it("returns nothing for an empty fragment (bare slash)", () => {
    expect(suggestVariables(vars, "")).toEqual([]);
  });

  it("filters by key substring", () => {
    const hits = suggestVariables(vars, "ord");
    expect(hits.map((v) => v.key)).toContain("order.number");
    expect(hits.map((v) => v.key)).toContain("order.id");
    expect(hits.map((v) => v.key)).not.toContain("store.name");
  });

  it("filters by label and description too", () => {
    expect(suggestVariables(vars, "store").map((v) => v.key)).toEqual(["store.name"]);
    expect(suggestVariables(vars, "unique").map((v) => v.key)).toEqual(["order.id"]);
  });

  it("is case-insensitive", () => {
    expect(suggestVariables(vars, "STORE").map((v) => v.key)).toEqual(["store.name"]);
  });

  it("respects the limit", () => {
    expect(suggestVariables(vars, "o", 2)).toHaveLength(2);
  });
});

describe("applySuggestion", () => {
  it("replaces the token with {{key}} and returns the new caret", () => {
    const token = detectToken("Order /ord", 8)!;
    const { text, caret } = applySuggestion("Order /ord", "order.number", token);
    expect(text).toBe("Order {{order.number}}");
    expect(caret).toBe("Order {{order.number}}".length);
  });

  it("replaces a bare slash", () => {
    const token = detectToken("Order /", 7)!;
    const { text } = applySuggestion("Order /", "store.name", token);
    expect(text).toBe("Order {{store.name}}");
  });

  it("replaces mid-fragment", () => {
    const token = detectToken("Order /ord", 7)!;
    const { text } = applySuggestion("Order /ord", "order.id", token);
    expect(text).toBe("Order {{order.id}}");
  });
});

describe("repeatFieldOf", () => {
  it("maps a list-field key to its item-scoped field and list", () => {
    expect(repeatFieldOf("order.items.name", ["order.items"])).toEqual({ list: "order.items", field: "name" });
    expect(repeatFieldOf("order.items.qty", ["order.items"])).toEqual({ list: "order.items", field: "qty" });
  });

  it("returns null for keys not under a list", () => {
    expect(repeatFieldOf("order.number", ["order.items"])).toBeNull();
    expect(repeatFieldOf("order.items", ["order.items"])).toBeNull(); // the list itself, not a field
  });

  it("matches the longest list prefix", () => {
    expect(repeatFieldOf("a.b.c", ["a", "a.b"])).toEqual({ list: "a.b", field: "c" });
  });
});
