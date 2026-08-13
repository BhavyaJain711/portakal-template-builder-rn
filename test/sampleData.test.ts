import { describe, expect, it } from "vitest";
import { buildSampleData, getPath, listVariables, setPath } from "../src/state/sampleData.js";
import type { VariableSpec } from "../src/types.js";

const vars: VariableSpec[] = [
  { key: "order.number", label: "Order Number", description: "The order number", sample: "1024" },
  { key: "order.total", label: "Order Total", description: "Total amount", sample: 29.48 },
  { key: "store.name", label: "Store Name", description: "Store name", sample: "Acme Store" },
];

describe("buildSampleData", () => {
  it("builds nested objects from dotted keys", () => {
    expect(buildSampleData(vars)).toEqual({
      order: { number: "1024", total: 29.48 },
      store: { name: "Acme Store" },
    });
  });

  it("handles a single-key variable", () => {
    expect(buildSampleData([{ key: "name", label: "Name", description: "x", sample: "Ada" }])).toEqual({
      name: "Ada",
    });
  });

  it("does not overwrite an existing value when keys share a prefix", () => {
    const data = buildSampleData([
      { key: "a.b", label: "A B", description: "x", sample: 1 },
      { key: "a", label: "A", description: "x", sample: "root" },
    ]);
    // "a" already exists as an object from "a.b" → stays the object.
    expect(data).toEqual({ a: { b: 1 } });
  });

  it("getPath returns the value at a dotted path", () => {
    const data = { order: { number: "1024" } };
    expect(getPath(data, "order.number")).toBe("1024");
    expect(getPath(data, "order.missing")).toBeUndefined();
    expect(getPath(data, "nope.deep")).toBeUndefined();
  });

  it("setPath writes nested values and creates intermediates", () => {
    const data: Record<string, unknown> = {};
    setPath(data, "design.parts[0].name", "Back Work");
    expect(data).toEqual({ design: { parts: [{ name: "Back Work" }] } });
  });

  it("listVariables returns only array-valued variables (repeat candidates)", () => {
    const vars2: VariableSpec[] = [
      { key: "design.parts", label: "Parts", description: "x", sample: [{ name: "A" }] },
      { key: "order.number", label: "Number", description: "x", sample: "1024" },
    ];
    expect(listVariables(vars2).map((v) => v.key)).toEqual(["design.parts"]);
  });

  it("keeps list arrays and skips item-field keys under them", () => {
    const vars2: VariableSpec[] = [
      { key: "order.items", label: "Items", description: "x", sample: [{ name: "Hamburger", qty: "2" }] },
      { key: "order.items.name", label: "Item Name", description: "x", sample: "Hamburger" },
      { key: "order.items.qty", label: "Item Qty", description: "x", sample: "2" },
      { key: "store.name", label: "Store", description: "x", sample: "Acme" },
    ];
    expect(buildSampleData(vars2)).toEqual({
      order: { items: [{ name: "Hamburger", qty: "2" }] },
      store: { name: "Acme" },
    });
  });
});
