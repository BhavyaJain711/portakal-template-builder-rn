import { describe, expect, it } from "vitest";
import { validateTemplate } from "portakal-template";
import { buildSampleData } from "../src/state/sampleData.js";
import { compileTemplate } from "portakal-template";
import type { TemplateSchema } from "portakal-template";
import type { VariableSpec } from "../src/types.js";

const variables: VariableSpec[] = [
  { key: "store.name", label: "Store Name", description: "The store name", sample: "Acme Store" },
  { key: "order.number", label: "Order Number", description: "The order number", sample: "1024" },
  { key: "order.id", label: "Order ID", description: "Unique order id", sample: "abc123" },
  { key: "order.time", label: "Order Time", description: "Time of the order", sample: "14:30" },
  { key: "order.total", label: "Order Total", description: "Total amount", sample: "29.48" },
];

const orderTemplate: TemplateSchema = {
  id: "order_label",
  rows: [
    { heightPercent: 20, cells: [{ widthPercent: 100, element: { type: "text", content: "{{store.name}}", align: "center", bold: true } }] },
    { heightPercent: 5, cells: [{ widthPercent: 100, element: { type: "line", thickness: 2 } }] },
    { heightPercent: 15, cells: [{ widthPercent: 60, element: { type: "text", content: "Order #{{order.number}}", bold: true } }, { widthPercent: 40, element: { type: "text", content: "{{order.time}}", align: "right" } }] },
    { heightPercent: 35, cells: [{ widthPercent: 100, element: { type: "barcode", content: "{{order.number}}", showText: true } }] },
    { heightPercent: 25, cells: [{ widthPercent: 30, element: { type: "qrcode", content: "https://ordyn.app/o/{{order.id}}" } }, { widthPercent: 70, element: { type: "box", thickness: 2, child: { type: "text", content: "TOTAL: ${{order.total}}", align: "center", bold: true } } }] },
  ],
};

const spec = { width: 65, height: 40, unit: "mm" as const, dpi: 203 };

describe("builder wiring", () => {
  it("validates, builds sample data, and compiles a valid template", () => {
    const validation = validateTemplate(orderTemplate, { allowedVariables: variables.map((v) => ({ key: v.key, label: v.label })) });
    expect(validation.valid).toBe(true);

    const data = buildSampleData(variables);
    expect(data).toEqual({
      store: { name: "Acme Store" },
      order: { number: "1024", id: "abc123", time: "14:30", total: "29.48" },
    });

    const result = compileTemplate(orderTemplate, data, { spec });
    expect(result.svg).toContain("<svg");
    expect(result.tsc).toContain("Acme Store");
    expect(result.zpl).toContain("^XA");
  });

  it("surfaces a validation error when a used variable is not allowed", () => {
    const vars = variables.filter((v) => v.key !== "order.id");
    const validation = validateTemplate(orderTemplate, { allowedVariables: vars.map((v) => ({ key: v.key, label: v.label })) });
    expect(validation.valid).toBe(false);
    expect(validation.errors).toEqual([
      expect.objectContaining({ message: '"{{order.id}}" is not an allowed variable' }),
    ]);
  });
});
