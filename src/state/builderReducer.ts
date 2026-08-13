/**
 * Pure state logic for the template builder — a reducer over TemplateSchema.
 * Row/cell percent manipulation always keeps sums sane:
 *  - adding a cell scales existing widths down proportionally (row sums to 100)
 *  - removing a cell redistributes its share over the remaining cells
 *  - adding a row divides all row heights proportionally (total stays ~100)
 */

import type { TemplateCell, TemplateElement, TemplateRow, TemplateSchema } from "portakal-template";

export type BuilderAction =
  | { type: "addRow" }
  | { type: "removeRow"; index: number }
  | { type: "moveRow"; from: number; to: number }
  | { type: "setRowHeight"; index: number; heightPercent: number }
  | { type: "addCell"; rowIndex: number }
  | { type: "removeCell"; rowIndex: number; cellIndex: number }
  | { type: "moveCell"; rowIndex: number; from: number; to: number }
  | { type: "setCellWidth"; rowIndex: number; cellIndex: number; widthPercent: number }
  | { type: "setElementType"; rowIndex: number; cellIndex: number; element: TemplateElement }
  | { type: "patchElement"; rowIndex: number; cellIndex: number; patch: Partial<TemplateElement> }
  | { type: "setRepeat"; index: number; repeat: string | undefined }
  | { type: "replaceSchema"; schema: TemplateSchema };

/** Clamp an integer percent into [1, 100]. */
function clampPercent(n: number): number {
  return Math.max(1, Math.min(100, Math.round(n)));
}

/** A fully-formed default element for each type — editors/preview never see partials. */
export function defaultElement(type: string): TemplateElement {
  switch (type) {
    case "text":
      return { type: "text", content: "Text", align: "left" };
    case "barcode":
      return { type: "barcode", content: "123456789", symbology: "code128" };
    case "qrcode":
      return { type: "qrcode", content: "https://example.com", ecc: "M" };
    case "line":
      return { type: "line", thickness: 2 };
    case "box":
      return { type: "box", thickness: 2, radius: 0, child: { type: "text", content: "Box", align: "center" } };
    case "image":
      return { type: "image", src: "16,16,255,0,0,255,0,0,255,0,0,255,0,0,255,0,0,255,0,0,255,0,0,255,0,0,255,0,0,255" };
    default:
      return { type: "space" };
  }
}

/** Scale a list of widths so they sum to exactly `target` (default 100). */
function rebalance(values: number[], target = 100): number[] {
  const total = values.reduce((a, b) => a + b, 0);
  if (total <= 0) return values.map(() => target / values.length);
  return values.map((v) => {
    const scaled = (v / total) * target;
    return Math.round(scaled * 100) / 100; // keep 2 decimals
  });
}

function emptyRow(): TemplateRow {
  return {
    heightPercent: 20,
    cells: [{ widthPercent: 100, element: { type: "text", content: "Text", align: "left" } }],
  };
}

export function builderReducer(state: TemplateSchema, action: BuilderAction): TemplateSchema {
  const rows = state.rows;

  switch (action.type) {
    case "replaceSchema":
      return action.schema;

    case "addRow": {
      // Divide all heights proportionally so the total stays ~100.
      const total = rows.reduce((a, r) => a + r.heightPercent, 0);
      const newRows = rows.map((r) => ({ ...r, heightPercent: Math.round((r.heightPercent * 90) / Math.max(1, total)) }));
      const added = Math.max(1, 100 - newRows.reduce((a, r) => a + r.heightPercent, 0));
      newRows.push({ ...emptyRow(), heightPercent: added });
      return { ...state, rows: newRows };
    }

    case "removeRow": {
      if (rows.length <= 1) return state; // keep at least one row
      const idx = Math.min(Math.max(0, action.index), rows.length - 1);
      const removed = rows[idx]!;
      const next = rows.filter((_, i) => i !== idx);
      if (next.length === 0) return state;
      // Redistribute the removed row's height over the survivors.
      const total = next.reduce((a, r) => a + r.heightPercent, 0);
      const distributed = next.map((r) => ({
        ...r,
        heightPercent: Math.round((r.heightPercent + (removed.heightPercent * r.heightPercent) / Math.max(1, total)) * 10) / 10,
      }));
      return { ...state, rows: distributed };
    }

    case "moveRow": {
      const from = Math.min(Math.max(0, action.from), rows.length - 1);
      const to = Math.min(Math.max(0, action.to), rows.length - 1);
      if (from === to) return state;
      const next = [...rows];
      const [moved] = next.splice(from, 1);
      if (!moved) return state;
      next.splice(to, 0, moved);
      return { ...state, rows: next };
    }

    case "setRowHeight": {
      const idx = Math.min(Math.max(0, action.index), rows.length - 1);
      const next = rows.map((r, i) =>
        i === idx ? { ...r, heightPercent: clampPercent(action.heightPercent) } : r,
      );
      return { ...state, rows: next };
    }

    case "addCell": {
      const rowIdx = Math.min(Math.max(0, action.rowIndex), rows.length - 1);
      const row = rows[rowIdx]!;
      // Add the new cell into the list first, then rebalance so the row still
      // sums to 100 — every cell (old and new) keeps a proportional share.
      const newCells: TemplateCell[] = [
        ...row.cells.map((c) => ({ ...c })),
        { widthPercent: row.cells[0]?.widthPercent ?? 100, element: { type: "text", content: "Text", align: "left" } },
      ];
      const widths = rebalance(newCells.map((c) => c.widthPercent));
      for (let i = 0; i < newCells.length; i++) newCells[i]!.widthPercent = widths[i]!;
      const next = rows.map((r, i) => (i === rowIdx ? { ...r, cells: newCells } : r));
      return { ...state, rows: next };
    }

    case "removeCell": {
      const rowIdx = Math.min(Math.max(0, action.rowIndex), rows.length - 1);
      const row = rows[rowIdx]!;
      if (row.cells.length <= 1) return state; // keep at least one cell
      const cellIdx = Math.min(Math.max(0, action.cellIndex), row.cells.length - 1);
      const remaining = row.cells.filter((_, i) => i !== cellIdx);
      const widths = rebalance(remaining.map((c) => c.widthPercent));
      const newCells = remaining.map((c, i) => ({ ...c, widthPercent: widths[i]! }));
      const next = rows.map((r, i) => (i === rowIdx ? { ...r, cells: newCells } : r));
      return { ...state, rows: next };
    }

    case "setCellWidth": {
      const rowIdx = Math.min(Math.max(0, action.rowIndex), rows.length - 1);
      const row = rows[rowIdx]!;
      if (action.cellIndex < 0 || action.cellIndex >= row.cells.length) return state;
      const newCells = row.cells.map((c, i) =>
        i === action.cellIndex ? { ...c, widthPercent: clampPercent(action.widthPercent) } : c,
      );
      const next = rows.map((r, i) => (i === rowIdx ? { ...r, cells: newCells } : r));
      return { ...state, rows: next };
    }

    case "moveCell": {
      const rowIdx = Math.min(Math.max(0, action.rowIndex), rows.length - 1);
      const row = rows[rowIdx]!;
      const from = Math.min(Math.max(0, action.from), row.cells.length - 1);
      const to = Math.min(Math.max(0, action.to), row.cells.length - 1);
      if (from === to) return state;
      const nextCells = [...row.cells];
      const [moved] = nextCells.splice(from, 1);
      if (!moved) return state;
      nextCells.splice(to, 0, moved);
      const next = rows.map((r, i) => (i === rowIdx ? { ...r, cells: nextCells } : r));
      return { ...state, rows: next };
    }

    case "setElementType": {
      const rowIdx = Math.min(Math.max(0, action.rowIndex), rows.length - 1);
      const row = rows[rowIdx]!;
      if (action.cellIndex < 0 || action.cellIndex >= row.cells.length) return state;
      const newCells = row.cells.map((c, i) =>
        i === action.cellIndex ? { ...c, element: defaultElement(action.element.type ?? "space") } : c,
      );
      const next = rows.map((r, i) => (i === rowIdx ? { ...r, cells: newCells } : r));
      return { ...state, rows: next };
    }

    case "patchElement": {
      const rowIdx = Math.min(Math.max(0, action.rowIndex), rows.length - 1);
      const row = rows[rowIdx]!;
      if (action.cellIndex < 0 || action.cellIndex >= row.cells.length) return state;
      const newCells = row.cells.map((c, i) =>
        i === action.cellIndex ? { ...c, element: { ...c.element, ...action.patch } as TemplateElement } : c,
      );
      const next = rows.map((r, i) => (i === rowIdx ? { ...r, cells: newCells } : r));
      return { ...state, rows: next };
    }

    case "setRepeat": {
      const idx = Math.min(Math.max(0, action.index), rows.length - 1);
      const next = rows.map((r, i) => (i === idx ? { ...r, repeat: action.repeat } : r));
      return { ...state, rows: next };
    }

    default:
      return state;
  }
}
