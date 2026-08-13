import { describe, expect, it } from "vitest";
import { builderReducer } from "../src/state/builderReducer.js";
import type { TemplateElement, TemplateSchema } from "portakal-template";

const base: TemplateSchema = {
  id: "test",
  rows: [
    { heightPercent: 60, cells: [{ widthPercent: 100, element: { type: "text", content: "A" } }] },
    { heightPercent: 40, cells: [{ widthPercent: 100, element: { type: "text", content: "B" } }] },
  ],
};

describe("builderReducer", () => {
  it("addRow divides heights proportionally and appends a new row", () => {
    const next = builderReducer(base, { type: "addRow" });
    expect(next.rows).toHaveLength(3);
    // 60 and 40 scaled to 90% → 54, 36; remainder 10 goes to the new row.
    expect(next.rows[0]!.heightPercent).toBe(54);
    expect(next.rows[1]!.heightPercent).toBe(36);
    expect(next.rows[2]!.heightPercent).toBe(10);
    const sum = next.rows.reduce((a, r) => a + r.heightPercent, 0);
    expect(sum).toBe(100);
  });

  it("removeRow redistributes the removed height over survivors", () => {
    const next = builderReducer(base, { type: "removeRow", index: 0 });
    expect(next.rows).toHaveLength(1);
    // 40 + 60*(40/40) = 100
    expect(next.rows[0]!.heightPercent).toBe(100);
  });

  it("moveRow reorders rows", () => {
    const next = builderReducer(base, { type: "moveRow", from: 1, to: 0 });
    expect(next.rows.map((r) => r.heightPercent)).toEqual([40, 60]);
  });

  it("moveCell reorders cells within a row", () => {
    const row2: TemplateSchema = {
      rows: [{ heightPercent: 100, cells: [
        { widthPercent: 60, element: { type: "text", content: "A" } },
        { widthPercent: 40, element: { type: "text", content: "B" } },
      ] }],
    };
    const next = builderReducer(row2, { type: "moveCell", rowIndex: 0, from: 1, to: 0 });
    expect(next.rows[0]!.cells.map((c) => c.element)).toMatchObject([{ content: "B" }, { content: "A" }]);
    // Widths travel with the cells.
    expect(next.rows[0]!.cells.map((c) => c.widthPercent)).toEqual([40, 60]);
    // A no-op move is a no-op.
    expect(builderReducer(row2, { type: "moveCell", rowIndex: 0, from: 1, to: 1 })).toBe(row2);
  });

  it("setRowHeight clamps to [1,100]", () => {
    const next = builderReducer(base, { type: "setRowHeight", index: 0, heightPercent: 250 });
    expect(next.rows[0]!.heightPercent).toBe(100);
  });

  it("addCell rebalances widths to sum 100", () => {
    const row2: TemplateSchema = {
      rows: [{ heightPercent: 100, cells: [
        { widthPercent: 60, element: { type: "text", content: "A" } },
        { widthPercent: 40, element: { type: "text", content: "B" } },
      ] }],
    };
    const next = builderReducer(row2, { type: "addCell", rowIndex: 0 });
    expect(next.rows[0]!.cells).toHaveLength(3);
    const widths = next.rows[0]!.cells.map((c) => c.widthPercent);
    const sum = widths.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(100, 1);
  });

  it("removeCell rebalances widths and keeps at least one cell", () => {
    const row2: TemplateSchema = {
      rows: [{ heightPercent: 100, cells: [
        { widthPercent: 60, element: { type: "text", content: "A" } },
        { widthPercent: 40, element: { type: "text", content: "B" } },
      ] }],
    };
    const next = builderReducer(row2, { type: "removeCell", rowIndex: 0, cellIndex: 0 });
    expect(next.rows[0]!.cells).toHaveLength(1);
    expect(next.rows[0]!.cells[0]!.widthPercent).toBe(100);
  });

  it("setElementType replaces the element with defaults", () => {
    const next = builderReducer(base, {
      type: "setElementType",
      rowIndex: 0,
      cellIndex: 0,
      element: { type: "qrcode", content: "https://example.com", ecc: "M" },
    });
    expect(next.rows[0]!.cells[0]!.element).toEqual({ type: "qrcode", content: "https://example.com", ecc: "M" });
  });

  it("patchElement merges into the element", () => {
    const next = builderReducer(base, { type: "patchElement", rowIndex: 1, cellIndex: 0, patch: { align: "center" } });
    expect(next.rows[1]!.cells[0]!.element).toMatchObject({ content: "B", align: "center" });
  });

  it("replaceSchema swaps the whole schema", () => {
    const replacement: TemplateSchema = { rows: [{ heightPercent: 100, cells: [{ widthPercent: 100, element: { type: "space" } }] }] };
    const next = builderReducer(base, { type: "replaceSchema", schema: replacement });
    expect(next).toEqual(replacement);
  });

  it("setRepeat sets and clears a row's repeat key", () => {
    const withRepeat = builderReducer(base, { type: "setRepeat", index: 1, repeat: "design.parts" });
    expect(withRepeat.rows[1]!.repeat).toBe("design.parts");
    const cleared = builderReducer(withRepeat, { type: "setRepeat", index: 1, repeat: undefined });
    expect(cleared.rows[1]!.repeat).toBeUndefined();
    expect(cleared.rows[0]!.repeat).toBeUndefined();
  });

  it("patchElement edits the correct cell when rows have different cell counts", () => {
    const multi: TemplateSchema = {
      rows: [
        { heightPercent: 50, cells: [{ widthPercent: 100, element: { type: "text", content: "only" } }] },
        {
          heightPercent: 50,
          cells: [
            { widthPercent: 60, element: { type: "text", content: "A" } },
            { widthPercent: 40, element: { type: "text", content: "B" } },
          ],
        },
      ],
    };
    // Patch row 1 cell 1 ("B") — must NOT touch row 0's "only".
    const next = builderReducer(multi, { type: "patchElement", rowIndex: 1, cellIndex: 1, patch: { align: "right" } });
    expect(next.rows[0]!.cells[0]!.element).toMatchObject({ content: "only" });
    expect(next.rows[0]!.cells[0]!.element).not.toHaveProperty("align");
    expect(next.rows[1]!.cells[1]!.element).toMatchObject({ content: "B", align: "right" });
    expect(next.rows[1]!.cells[0]!.element).toMatchObject({ content: "A" });
  });

  it("setElementType fills in a complete default element (no partials)", () => {
    const next = builderReducer(base, { type: "setElementType", rowIndex: 0, cellIndex: 0, element: { type: "barcode" } as TemplateElement });
    const el = next.rows[0]!.cells[0]!.element as Extract<TemplateElement, { type: "barcode" }>;
    expect(el.type).toBe("barcode");
    expect(typeof el.content).toBe("string");
    expect(el.content.length).toBeGreaterThan(0);
    expect(el.symbology).toBe("code128");
  });
});
