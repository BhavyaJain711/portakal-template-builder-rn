/**
 * PrinterSpecEditor — edit the PrintSpec the preview compiles against
 * (width, height, unit, dpi, gap, margin, speed, density, direction, copies,
 * font0Mode). Changes are debounced by the parent and fed back into the
 * builder, so the preview recompiles live.
 */

import { Text, TextInput, View } from "react-native";
import type { PrintSpec } from "portakal-template";
import type { BuilderTheme } from "../types.js";
import { Chip, Collapsible, useThemeStyles } from "./ui/primitives.js";

function NumField({
  label,
  value,
  onChange,
  theme,
  editable,
}: {
  label: string;
  value: number | undefined;
  onChange: (v: number) => void;
  theme: BuilderTheme;
  editable: boolean;
}) {
  const { c, spacing, radius, fs } = useThemeStyles(theme);
  return (
    <View style={{ marginBottom: spacing * 0.6 }}>
      <Text style={{ color: c.textMuted, fontSize: fs.small }}>{label}</Text>
      {editable ? (
        <TextInput
          value={value === undefined ? "" : String(value)}
          onChangeText={(t) => onChange(Number(t))}
          keyboardType="numeric"
          placeholder="—"
          placeholderTextColor={c.textMuted}
          style={{
            color: c.text,
            borderColor: c.border,
            borderWidth: 1,
            borderRadius: radius,
            paddingHorizontal: spacing * 0.7,
            paddingVertical: spacing * 0.4,
            fontSize: fs.small,
            backgroundColor: c.background,
          }}
        />
      ) : (
        <Text style={{ color: c.text, fontSize: fs.small, marginTop: spacing * 0.2 }}>
          {value === undefined ? "—" : String(value)}
        </Text>
      )}
    </View>
  );
}

function ChipRow({
  label,
  value,
  options,
  onPick,
  theme,
  editable,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onPick: (v: string) => void;
  theme: BuilderTheme;
  editable: boolean;
}) {
  const { c, spacing, fs } = useThemeStyles(theme);
  return (
    <View style={{ marginBottom: spacing * 0.4 }}>
      <Text style={{ color: c.textMuted, fontSize: fs.small, marginBottom: spacing * 0.3 }}>{label}</Text>
      {editable ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          {options.map((o) => (
            <Chip key={o} label={o} active={value === o} onPress={() => onPick(o)} theme={theme} />
          ))}
        </View>
      ) : (
        <Text style={{ color: c.text, fontSize: fs.small }}>{value}</Text>
      )}
    </View>
  );
}

export function PrinterSpecEditor({
  spec,
  onChange,
  theme,
  editable = true,
}: {
  spec: PrintSpec;
  onChange: (spec: PrintSpec) => void;
  theme: BuilderTheme;
  editable?: boolean;
}) {
  const { c, spacing, fs } = useThemeStyles(theme);
  const patch = (p: Partial<PrintSpec>) => onChange({ ...spec, ...p });

  const size = (
    <View style={{ flexDirection: "row", marginTop: spacing * 0.4 }}>
      <View style={{ flex: 1, marginRight: spacing * 0.4 }}>
        <NumField label={`Width (${spec.unit ?? "mm"})`} value={spec.width} onChange={(width) => patch({ width })} theme={theme} editable={editable} />
      </View>
      <View style={{ flex: 1 }}>
        <NumField label={`Height (${spec.unit ?? "mm"})`} value={spec.height} onChange={(height) => patch({ height })} theme={theme} editable={editable} />
      </View>
    </View>
  );

  const misc = (
    <View>
      <View style={{ flexDirection: "row" }}>
        <View style={{ flex: 1, marginRight: spacing * 0.4 }}>
          <NumField label="Speed" value={spec.speed} onChange={(speed) => patch({ speed })} theme={theme} editable={editable} />
        </View>
        <View style={{ flex: 1 }}>
          <NumField label="Density" value={spec.density} onChange={(density) => patch({ density })} theme={theme} editable={editable} />
        </View>
      </View>
      <View style={{ flexDirection: "row" }}>
        <View style={{ flex: 1, marginRight: spacing * 0.4 }}>
          <NumField label="Direction" value={spec.direction} onChange={(direction) => patch({ direction: (direction === 1 ? 1 : 0) as 0 | 1 })} theme={theme} editable={editable} />
        </View>
        <View style={{ flex: 1 }}>
          <NumField label="Copies" value={spec.copies} onChange={(copies) => patch({ copies })} theme={theme} editable={editable} />
        </View>
      </View>
      <Text style={{ color: c.textMuted, fontSize: fs.small }}>
        Tip: label size and DPI are supplied at print time — the template itself is device-agnostic.
      </Text>
    </View>
  );

  return (
    <Collapsible title="Printer" theme={theme} defaultOpen>
      <ChipRow
        label="Unit"
        value={spec.unit ?? "mm"}
        options={["mm", "inch", "dot"] as const}
        onPick={(unit) => patch({ unit: unit as PrintSpec["unit"] })}
        theme={theme}
        editable={editable}
      />
      <ChipRow
        label="Font size mode"
        value={spec.font0Mode ?? "multiplier"}
        options={["multiplier", "points"] as const}
        onPick={(font0Mode) => patch({ font0Mode: font0Mode as PrintSpec["font0Mode"] })}
        theme={theme}
        editable={editable}
      />
      {size}
      <NumField label="DPI" value={spec.dpi} onChange={(dpi) => patch({ dpi })} theme={theme} editable={editable} />
      <NumField label="Gap" value={spec.gap} onChange={(gap) => patch({ gap })} theme={theme} editable={editable} />
      <NumField label="Margin" value={spec.margin} onChange={(margin) => patch({ margin })} theme={theme} editable={editable} />
      {misc}
    </Collapsible>
  );
}
