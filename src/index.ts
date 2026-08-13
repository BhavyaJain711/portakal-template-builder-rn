/**
 * portakal-template-builder-rn — React Native template builder for portakal-template.
 * Visual row/cell/element editor with slash-command variable autocomplete,
 * live SVG preview, validation, and theming. Expo-first; works on iOS,
 * Android, tablet, and web (react-native-web).
 */

export { TemplateBuilder } from "./components/TemplateBuilder.js";
export { defaultTheme, darkTheme, resolveTheme } from "./theme.js";
export type { BuilderTheme, TemplateBuilderProps, VariableSpec } from "./types.js";

// Convenience re-export so UI consumers don't need a second import for
// validating the template they get back from onChange.
export { validateTemplate } from "portakal-template";
export type { ValidationResult, ValidationIssue } from "portakal-template";
