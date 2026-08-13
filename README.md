# portakal-template-builder-rn

A **React Native template builder component** for [portakal-template](https://github.com/bhavyajain711/portakal-template).

Your app's end users assemble label templates visually — rows, cells, and elements — with a live preview, slash-command variable autocomplete, inline validation, and theming. They never type raw JSON.

- **Expo-first**, works on iOS, Android, tablet, and web (react-native-web)
- Native components only — `TouchableOpacity`, `TextInput`, `ScrollView`, `Modal`, `FlatList`
- Live `react-native-svg` preview of the exact `compileTemplate().svg` string — preview and printed output share the same resolved layout and can't drift
- Responsive: portrait stacks (editor above, preview below); landscape/tablet/web goes two-pane with a sticky preview
- Theming via a simple colors/spacing/typography object; `defaultTheme` + `darkTheme` included

## Install

```sh
npm install portakal-template-builder-rn react-native-svg
```

Peer dependencies (install yourself): `react`, `react-native`, `react-native-svg`.

## Quick start

```tsx
import { TemplateBuilder, darkTheme } from "portakal-template-builder-rn";

const variables = [
  { key: "store.name", label: "Store Name", description: "The store name printed on the label", sample: "Acme Store" },
  { key: "order.number", label: "Order Number", description: "The order's number, also encoded in the barcode", sample: "1024" },
  { key: "order.time", label: "Order Time", description: "When the order was placed", sample: "14:30" },
  { key: "order.id", label: "Order ID", description: "Unique order id used in the QR code", sample: "abc123" },
  { key: "order.total", label: "Order Total", description: "Total amount for the order", sample: "29.48" },
];

const spec = { width: 65, height: 40, unit: "mm", dpi: 203, font0Mode: "points" };

export function LabelTemplateScreen() {
  return (
    <TemplateBuilder
      template={initialTemplate}   // a portakal-template TemplateSchema
      variables={variables}
      spec={spec}
      theme={darkTheme}
      onChange={(schema) => save(schema)}   // persist the draft
      showCode
    />
  );
}
```

## Props

| Prop | Type | Description |
|---|---|---|
| `template` | `TemplateSchema` | Initial template. The builder keeps a draft and calls `onChange` on each edit. |
| `variables` | `VariableSpec[]` | Allowed variables. Drives `/` autocomplete, the ⓘ help modal, and sample preview data. |
| `spec` | `PrintSpec` | Printer spec — the preview compiles against this. |
| `theme?` | `BuilderTheme` | Colors/spacing/typography (default `defaultTheme`). |
| `onChange?` | `(schema) => void` | Called with the current draft after every mutation. |
| `sampleData?` | `Record<string, unknown>` | Override the preview data (default: built from variable `sample`s). |
| `onPreview?` | `({ tsc, zpl, svg }) => void` | Called after each debounced preview render. |
| `showCode?` | `boolean` | Show the collapsible compiled TSC/ZPL panel. |
| `editable?` | `boolean` | Allow editing (default `true`; `false` renders a read-only view). |

### `VariableSpec`

| Field | Type | Description |
|---|---|---|
| `key` | `string` | Dotted key, e.g. `"order.number"` — used as `{{order.number}}` in templates. |
| `label` | `string` | Human label shown in autocomplete and the help modal. |
| `description` | `string` | Developer-provided docs shown in the help modal. |
| `sample` | `string \| number` | Used to build preview sample data. |

## Slash-command variable autocomplete

In any text field (text, barcode, QR content):

- Type **`/`** to start composing a variable. A bare `/` with nothing typed shows no suggestions — pressing space leaves the `/` literal.
- Type after `/` (e.g. `/ord`) to filter variables by key, label, or description (top 5 shown).
- Tap a suggestion to insert `{{key}}` in place of the token.
- The **ⓘ** button beside each field opens the help modal listing every variable with its key, label, description, and sample.

## Validation

Every change is validated against the allowed variables and template structure using `validateTemplate` from portakal-template. Errors show as a banner above the preview. You can reuse the same validator server-side:

```ts
import { validateTemplate } from "portakal-template-builder-rn"; // re-exported

const { valid, errors } = validateTemplate(savedSchema, { allowedVariables: variables.map(v => ({ key: v.key })) });
```

## Theming

```ts
import { TemplateBuilder, resolveTheme } from "portakal-template-builder-rn";

const myTheme = resolveTheme({
  colors: { primary: "#2563eb", background: "#0f172a", surface: "#1e293b" },
  radius: 12,
});
```

## Layout

- **Portrait** (width < 700): preview on top, editor below.
- **Landscape / tablet / web** (width ≥ 700): editor on the left, sticky preview on the right.

## Example app

A minimal standalone Expo app lives in [`examples/expo/`](./examples/expo). From that directory:

```sh
npm install
npx expo start            # iOS / Android (Expo Go)
npx expo start --web      # web (react-native-web)
```

It renders the builder with the order-label template, a light/dark toggle, and a debug panel showing the current schema JSON.

## How it works

- **State**: a pure reducer (`src/state/builderReducer.ts`) keeps percent sums sane — adding a row divides all heights proportionally; adding a cell rebalances widths to sum 100.
- **Preview**: `compileTemplate(template, sampleData, { spec })` runs debounced (~200 ms) and renders `result.svg` via `SvgXml`. The compiled TSC/ZPL panel shows the exact strings the printer receives.
- **Autocomplete**: a pure tokenizer (`src/state/slash.ts`) detects the slash token at the caret and produces insertion replacements.

## License

MIT.
