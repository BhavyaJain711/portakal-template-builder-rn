/**
 * Public types for portakal-template-builder-rn.
 *
 * A developer configures the builder: allowed variables (with descriptions
 * for the help modal), the printer spec, and a theme. End users assemble the
 * template visually — they never type raw JSON.
 */

import type { PrintSpec, TemplateSchema } from "portakal-template";

/** One variable the template may reference via {{key}}. */
export interface VariableSpec {
  /** Dotted key, e.g. "order.number" — used as {{order.number}} in templates. */
  key: string;
  /** Human label shown in the autocomplete and help modal. */
  label: string;
  /** Description shown in the help modal (developer-provided docs). */
  description: string;
  /**
   * Sample value used to build preview data. A plain value for scalar
   * variables; an ARRAY (of objects) marks the variable as a repeat-list
   * candidate for dynamic rows (e.g. `[{ name: "Back Work" }]`).
   */
  sample: string | number | unknown[];
}

/** Colors + geometry knobs for the builder. */
export interface BuilderTheme {
  colors: {
    primary: string;
    background: string;
    surface: string;
    border: string;
    text: string;
    textMuted: string;
    danger: string;
    success: string;
    chipBg: string;
    chipText: string;
    modalOverlay: string;
    previewBackground: string;
  };
  spacing?: number;
  radius?: number;
  fontSizes?: { small: number; body: number; title: number };
}

/** Props for the TemplateBuilder component. */
export interface TemplateBuilderProps {
  /** Initial template. The builder keeps a draft and calls `onChange` on each edit. */
  template: TemplateSchema;
  /** Variables the template may use. Drives autocomplete, help, and sample data. */
  variables: VariableSpec[];
  /** Printer spec — the preview compiles against this. */
  spec: PrintSpec;
  /** Optional theme override (default: defaultTheme). */
  theme?: BuilderTheme;
  /** Called with the current draft schema after every mutation. */
  onChange?: (schema: TemplateSchema) => void;
  /** Called when the user presses the Save button. Return a promise to keep the button busy. */
  onSave?: (schema: TemplateSchema) => void | Promise<void>;
  /** Override the sample data used for the preview (default: built from variables). */
  sampleData?: Record<string, unknown>;
  /** Called with the compiled result after each preview render. */
  onPreview?: (result: { tsc: string; zpl: string; svg: string }) => void;
  /** Show the collapsible compiled TSC/ZPL panel. */
  showCode?: boolean;
  /**
   * Manual preview mode: don't recompile on every edit; instead show a stale
   * indicator and an "Update preview" button. Useful on mobile where each
   * keystroke would otherwise re-render the full SVG. Default false (live).
   */
  manualPreview?: boolean;
  /** Allow editing (default true). */
  editable?: boolean;
  /**
   * Which panels are visible. All default true; pass `false` to hide a panel
   * entirely (e.g. don't expose raw JSON data editing to end users).
   */
  show?: {
    /** Rows/cells editor (default true). */
    rows?: boolean;
    /** Sample/preview data JSON editor (default true). */
    data?: boolean;
    /** Printer spec editor (default true). */
    printer?: boolean;
    /** Validation banner + status in the header (default true). */
    validation?: boolean;
  };
  /**
   * Whether each panel's content is editable. Defaults to the value of
   * `editable`. A panel locked here is HIDDEN in an editable builder (it
   * can't be changed anyway, so it isn't shown). In a view-mode builder
   * (`editable: false`) locked panels render read-only so the data is still
   * visible.
   */
  editablePanels?: {
    /** Rows/cells editor (default `editable`). */
    rows?: boolean;
    /** Sample/preview data JSON editor (default `editable`). */
    data?: boolean;
    /** Printer spec editor (default `editable`). */
    printer?: boolean;
  };
}
