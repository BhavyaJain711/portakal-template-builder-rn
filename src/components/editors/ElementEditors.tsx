/**
 * Element editors — one per TemplateElement type. Each receives the element,
 * a patch callback (merges into the element), and the theme.
 */

import { Text, TextInput, View } from "react-native";
import type { TemplateElement } from "portakal-template";
import type { BuilderTheme, VariableSpec } from "../../types.js";
import { SlashInput } from "../SlashInput.js";
import { Chip, NumberField, Toggle, useThemeStyles } from "../ui/primitives.js";

/** Text-specific partial patch (avoids the union's disjoint fields). */
type TextPatch = Partial<Extract<TemplateElement, { type: "text" }>>;

/** Repeat context passed to editors so autocomplete scopes to list items. */
export interface RepeatCtx {
  /** Repeat-list keys, e.g. ["order.items"]. */
  lists: string[];
  /** The row's current repeat list, if any. */
  current?: string;
  /** Set the row's repeat list (auto-set when a list-field is picked). */
  onSetRepeat?: (list: string) => void;
  /** Repeat-list keys whose items are strings (insert "{{this}}"). */
  stringLists?: string[];
}

export function TextElementEditor({
  element,
  onPatch,
  variables,
  theme,
  repeatCtx,
}: {
  element: Extract<TemplateElement, { type: "text" }>;
  onPatch: (p: TextPatch) => void;
  variables: VariableSpec[];
  theme: BuilderTheme;
  repeatCtx?: RepeatCtx;
}) {
  const { spacing } = useThemeStyles(theme);
  return (
    <View>
      <SlashInput
        value={element.content}
        onChangeText={(content) => onPatch({ content })}
        variables={variables}
        theme={theme}
        placeholder='Text — type "/" to insert a variable'
        repeatLists={repeatCtx?.lists}
        repeat={repeatCtx?.current}
        onSetRepeat={repeatCtx?.onSetRepeat}
        stringLists={repeatCtx?.stringLists}
      />
      <View style={{ flexDirection: "row", marginTop: spacing * 0.6, flexWrap: "wrap" }}>
        {(["left", "center", "right"] as const).map((align) => (
          <Chip
            key={align}
            label={align}
            active={element.align === align}
            onPress={() => onPatch({ align })}
            theme={theme}
          />
        ))}
      </View>
      <View style={{ marginTop: spacing * 0.4 }}>
        <Toggle label="Bold" value={!!element.bold} onChange={(bold) => onPatch({ bold })} theme={theme} />
        <Toggle label="Wrap" value={element.wrap !== false} onChange={(wrap) => onPatch({ wrap })} theme={theme} />
      </View>
    </View>
  );
}

const SYMBOLOGIES = ["code128", "code39", "ean13", "upca"] as const;

export function BarCodeElementEditor({
  element,
  onPatch,
  variables,
  theme,
  repeatCtx,
}: {
  element: Extract<TemplateElement, { type: "barcode" }>;
  onPatch: (p: Partial<TemplateElement>) => void;
  variables: VariableSpec[];
  theme: BuilderTheme;
  repeatCtx?: RepeatCtx;
}) {
  const { spacing } = useThemeStyles(theme);
  return (
    <View>
      <SlashInput
        value={element.content}
        onChangeText={(content) => onPatch({ content })}
        variables={variables}
        theme={theme}
        multiline={false}
        placeholder="Barcode content"
        repeatLists={repeatCtx?.lists}
        repeat={repeatCtx?.current}
        onSetRepeat={repeatCtx?.onSetRepeat}
        stringLists={repeatCtx?.stringLists}
      />
      <Text style={{ color: theme.colors.textMuted, fontSize: theme.fontSizes?.small, marginTop: spacing * 0.5 }}>
        Symbology
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: spacing * 0.3 }}>
        {SYMBOLOGIES.map((s) => (
          <Chip
            key={s}
            label={s}
            active={(element.symbology ?? "code128") === s}
            onPress={() => onPatch({ symbology: s })}
            theme={theme}
          />
        ))}
      </View>
      <View style={{ marginTop: spacing * 0.4 }}>
        <Toggle label="Show readable text" value={element.showText !== false} onChange={(showText) => onPatch({ showText })} theme={theme} />
      </View>
    </View>
  );
}

const ECCS = ["L", "M", "Q", "H"] as const;

export function QrCodeElementEditor({
  element,
  onPatch,
  variables,
  theme,
  repeatCtx,
}: {
  element: Extract<TemplateElement, { type: "qrcode" }>;
  onPatch: (p: Partial<TemplateElement>) => void;
  variables: VariableSpec[];
  theme: BuilderTheme;
  repeatCtx?: RepeatCtx;
}) {
  const { spacing } = useThemeStyles(theme);
  return (
    <View>
      <SlashInput
        value={element.content}
        onChangeText={(content) => onPatch({ content })}
        variables={variables}
        theme={theme}
        multiline={false}
        placeholder="QR content (URL or text)"
        repeatLists={repeatCtx?.lists}
        repeat={repeatCtx?.current}
        onSetRepeat={repeatCtx?.onSetRepeat}
        stringLists={repeatCtx?.stringLists}
      />
      <Text style={{ color: theme.colors.textMuted, fontSize: theme.fontSizes?.small, marginTop: spacing * 0.5 }}>
        Error correction
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: spacing * 0.3 }}>
        {ECCS.map((e) => (
          <Chip
            key={e}
            label={e}
            active={(element.ecc ?? "M") === e}
            onPress={() => onPatch({ ecc: e })}
            theme={theme}
          />
        ))}
      </View>
    </View>
  );
}

export function LineElementEditor({
  element,
  onPatch,
  theme,
}: {
  element: Extract<TemplateElement, { type: "line" }>;
  onPatch: (p: Partial<TemplateElement>) => void;
  theme: BuilderTheme;
}) {
  return (
    <View>
      <NumberField
        label="Thickness"
        value={element.thickness ?? 2}
        min={1}
        max={20}
        onChange={(thickness) => onPatch({ thickness })}
        theme={theme}
      />
      <View style={{ flexDirection: "row", marginTop: 8 }}>
        <Chip label="horizontal" active={element.orientation !== "vertical"} onPress={() => onPatch({ orientation: "horizontal" })} theme={theme} />
        <Chip label="vertical" active={element.orientation === "vertical"} onPress={() => onPatch({ orientation: "vertical" })} theme={theme} />
      </View>
    </View>
  );
}

export function BoxElementEditor({
  element,
  onPatch,
  variables,
  theme,
  repeatCtx,
}: {
  element: Extract<TemplateElement, { type: "box" }>;
  onPatch: (p: Partial<TemplateElement>) => void;
  variables: VariableSpec[];
  theme: BuilderTheme;
  repeatCtx?: RepeatCtx;
}) {
  const { spacing } = useThemeStyles(theme);
  return (
    <View>
      <NumberField label="Thickness" value={element.thickness ?? 2} min={1} max={20} onChange={(thickness) => onPatch({ thickness })} theme={theme} />
      <NumberField label="Radius" value={element.radius ?? 0} min={0} max={20} onChange={(radius) => onPatch({ radius })} theme={theme} />
      <Text style={{ color: theme.colors.textMuted, fontSize: theme.fontSizes?.small, marginTop: spacing * 0.5 }}>
        Inner element
      </Text>
      <View style={{ marginTop: spacing * 0.3 }}>
        {element.child?.type === "text" ? (
          <TextElementEditor
            element={element.child as Extract<TemplateElement, { type: "text" }>}
            onPatch={(p: TextPatch) => {
              const child = element.child as Extract<TemplateElement, { type: "text" }>;
              const next: Extract<TemplateElement, { type: "text" }> = {
                type: "text",
                content: p.content ?? child.content,
                align: p.align ?? child.align,
                bold: p.bold ?? child.bold,
                wrap: p.wrap ?? child.wrap,
              };
              onPatch({ child: next });
            }}
            variables={variables}
            theme={theme}
            repeatCtx={repeatCtx}
          />
        ) : (
          <Text style={{ color: theme.colors.textMuted, fontSize: theme.fontSizes?.small }}>
            Child element: {element.child?.type ?? "none"}
          </Text>
        )}
      </View>
    </View>
  );
}

export function ImageElementEditor({
  element,
  onPatch,
  theme,
}: {
  element: Extract<TemplateElement, { type: "image" }>;
  onPatch: (p: Partial<TemplateElement>) => void;
  theme: BuilderTheme;
}) {
  const { c, spacing, fs } = useThemeStyles(theme);
  return (
    <View>
      <Text style={{ color: c.textMuted, fontSize: fs.small, marginBottom: spacing * 0.4 }}>
        Monochrome bitmap descriptor: <Text style={{ color: c.text }}>width,height,byte,...</Text>
      </Text>
      <TextInputStub
        value={element.src}
        onChangeText={(src) => onPatch({ src })}
        theme={theme}
      />
    </View>
  );
}

/** Minimal themed TextInput used only by ImageElementEditor (avoids SlashInput's variable logic). */
function TextInputStub({
  value,
  onChangeText,
  theme,
}: {
  value: string;
  onChangeText: (v: string) => void;
  theme: BuilderTheme;
}) {
  const { c, spacing, radius, fs } = useThemeStyles(theme);
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      multiline
      placeholder="16,16,255,0,0,..."
      placeholderTextColor={c.textMuted}
      style={{
        color: c.text,
        borderColor: c.border,
        borderWidth: 1,
        borderRadius: radius,
        paddingHorizontal: spacing * 0.8,
        paddingVertical: spacing * 0.6,
        fontSize: fs.small,
        backgroundColor: c.background,
        minHeight: 56,
      }}
    />
  );
}
