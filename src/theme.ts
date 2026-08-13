/**
 * Builder themes. `defaultTheme` (light) and `darkTheme` are exported; pass a
 * partial override to <TemplateBuilder theme={...}>.
 */

import type { BuilderTheme } from "./types.js";

function makeTheme(dark: boolean): BuilderTheme {
  return {
    colors: dark
      ? {
          primary: "#f97316",
          background: "#09090b",
          surface: "#18181b",
          border: "#27272a",
          text: "#fafafa",
          textMuted: "#a1a1aa",
          danger: "#f87171",
          success: "#4ade80",
          chipBg: "#27272a",
          chipText: "#e4e4e7",
          modalOverlay: "rgba(0,0,0,0.6)",
          previewBackground: "#27272a",
        }
      : {
          primary: "#f97316",
          background: "#fafafa",
          surface: "#ffffff",
          border: "#e4e4e7",
          text: "#18181b",
          textMuted: "#71717a",
          danger: "#dc2626",
          success: "#16a34a",
          chipBg: "#f4f4f5",
          chipText: "#3f3f46",
          modalOverlay: "rgba(0,0,0,0.4)",
          previewBackground: "#f4f4f5",
        },
    spacing: 12,
    radius: 8,
    fontSizes: { small: 12, body: 14, title: 17 },
  };
}

export const defaultTheme: BuilderTheme = makeTheme(false);
export const darkTheme: BuilderTheme = makeTheme(true);

/** Deep-merge a partial theme over a base theme. */
export function resolveTheme(theme?: Partial<BuilderTheme>): BuilderTheme {
  const base = defaultTheme;
  const merged: BuilderTheme = {
    colors: { ...base.colors, ...(theme?.colors ?? {}) },
    spacing: theme?.spacing ?? base.spacing,
    radius: theme?.radius ?? base.radius,
    fontSizes: {
      small: theme?.fontSizes?.small ?? base.fontSizes!.small,
      body: theme?.fontSizes?.body ?? base.fontSizes!.body,
      title: theme?.fontSizes?.title ?? base.fontSizes!.title,
    },
  };
  return merged;
}
