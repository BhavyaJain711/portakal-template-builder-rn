/**
 * Small themeable UI primitives built only on core React Native components
 * (TouchableOpacity, Text, View). Works on iOS, Android, tablet, and web.
 */

import React, { useState } from "react";
import {
  Modal as RNModal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import type { BuilderTheme } from "../../types.js";

export function useThemeStyles(theme: BuilderTheme) {
  const c = theme.colors;
  const spacing = theme.spacing ?? 12;
  const radius = theme.radius ?? 8;
  return { c, spacing, radius, fs: theme.fontSizes ?? { small: 12, body: 14, title: 17 } };
}

/** A small pressable pill (e.g. element-type chips, align chips). */
export function Chip({
  label,
  active,
  onPress,
  theme,
  style,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  theme: BuilderTheme;
  style?: StyleProp<ViewStyle>;
}) {
  const { c, spacing, radius, fs } = useThemeStyles(theme);
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        {
          paddingHorizontal: spacing * 0.8,
          paddingVertical: spacing * 0.4,
          borderRadius: radius,
          backgroundColor: active ? c.primary : c.chipBg,
          marginRight: spacing * 0.4,
          marginBottom: spacing * 0.4,
        },
        style,
      ]}
    >
      <Text style={{ color: active ? "#fff" : c.chipText, fontSize: fs.small, fontWeight: "600" }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

/** A compact icon button (arrow, ✕, etc.). */
export function IconButton({
  label,
  onPress,
  theme,
  disabled,
  variant = "default",
  style,
}: {
  label: string;
  onPress: () => void;
  theme: BuilderTheme;
  disabled?: boolean;
  variant?: "default" | "danger";
  style?: StyleProp<ViewStyle>;
}) {
  const { c, spacing, radius } = useThemeStyles(theme);
  const bg = variant === "danger" ? c.danger : c.chipBg;
  const fg = variant === "danger" ? "#fff" : c.chipText;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={[
        {
          width: 30,
          height: 30,
          borderRadius: radius,
          backgroundColor: bg,
          alignItems: "center",
          justifyContent: "center",
          marginLeft: spacing * 0.3,
          opacity: disabled ? 0.35 : 1,
        },
        style,
      ]}
    >
      <Text style={{ color: fg, fontSize: 15, fontWeight: "700" }}>{label}</Text>
    </TouchableOpacity>
  );
}

/** A text-styled action (e.g. "+ Add cell", "Edit", "Done"). */
export function TextBtn({
  label,
  onPress,
  theme,
  tone = "primary",
  style,
}: {
  label: string;
  onPress: () => void;
  theme: BuilderTheme;
  tone?: "primary" | "muted";
  style?: StyleProp<ViewStyle>;
}) {
  const { c, fs } = useThemeStyles(theme);
  return (
    <TouchableOpacity onPress={onPress} style={[{ paddingVertical: 2, paddingHorizontal: 2 }, style]}>
      <Text style={{ color: tone === "primary" ? c.primary : c.textMuted, fontSize: fs.small, fontWeight: "700" }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

/** A thin divider line. */
export function Divider({ theme }: { theme: BuilderTheme }) {
  const { c, spacing } = useThemeStyles(theme);
  return <View style={{ height: 1, backgroundColor: c.border, marginVertical: spacing * 0.6 }} />;
}

/** A labeled field row: label + input (used for compact text inputs). */
export function Field({
  label,
  value,
  onChangeText,
  theme,
  placeholder,
  style,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  theme: BuilderTheme;
  placeholder?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const { c, spacing, radius, fs } = useThemeStyles(theme);
  return (
    <View style={[{ flex: 1 }, style]}>
      <Text style={{ color: c.textMuted, fontSize: fs.small, marginBottom: spacing * 0.3 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
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
    </View>
  );
}

/** A labeled numeric field: type directly, or nudge with − / +. */
export function NumberField({
  label,
  value,
  onChange,
  theme,
  min = 0,
  max = 100,
  step = 1,
  allowDecimal = true,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  theme: BuilderTheme;
  min?: number;
  max?: number;
  step?: number;
  allowDecimal?: boolean;
  suffix?: string;
}) {
  const { c, spacing, radius, fs } = useThemeStyles(theme);
  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  // Clamp on blur so a partial "3" or "37." doesn't stick as invalid.
  const commit = (raw: string) => {
    const n = parseFloat(raw.replace(",", "."));
    if (Number.isFinite(n)) onChange(clamp(n));
  };
  const btn = (char: string, delta: number) => (
    <TouchableOpacity
      onPress={() => onChange(clamp((value || 0) + delta))}
      style={{ backgroundColor: c.chipBg, borderRadius: radius, paddingHorizontal: 10, paddingVertical: 4 }}
    >
      <Text style={{ color: c.text, fontSize: fs.body, fontWeight: "700" }}>{char}</Text>
    </TouchableOpacity>
  );
  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginVertical: spacing * 0.3 }}>
      <Text style={{ color: c.textMuted, fontSize: fs.small, width: 96, marginRight: spacing * 0.4 }}>{label}</Text>
      {btn("−", -step)}
      <TextInput
        value={String(Math.round(value * 100) / 100)}
        onChangeText={(raw) => commit(raw)}
        onBlur={() => onChange(clamp(value))}
        keyboardType={allowDecimal ? "decimal-pad" : "number-pad"}
        selectTextOnFocus
        style={{
          color: c.text,
          fontSize: fs.body,
          width: 64,
          textAlign: "center",
          backgroundColor: c.background,
          borderColor: c.border,
          borderWidth: 1,
          borderRadius: radius,
          paddingVertical: 4,
          marginHorizontal: spacing * 0.3,
        }}
      />
      {btn("+", step)}
      {suffix && <Text style={{ color: c.textMuted, fontSize: fs.small, marginLeft: spacing * 0.3 }}>{suffix}</Text>}
    </View>
  );
}

/** @deprecated use {@link NumberField} — a stepper can't type values like 37.5. */
export function Stepper(props: Parameters<typeof NumberField>[0]) {
  return <NumberField {...props} />;
}

/** A labeled button. */
export function Button({
  label,
  onPress,
  theme,
  variant = "default",
  style,
}: {
  label: string;
  onPress: () => void;
  theme: BuilderTheme;
  variant?: "default" | "danger" | "primary";
  style?: StyleProp<ViewStyle>;
}) {
  const { c, spacing, radius, fs } = useThemeStyles(theme);
  const bg = variant === "danger" ? c.danger : variant === "primary" ? c.primary : c.chipBg;
  const fg = variant === "default" ? c.chipText : "#fff";
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[{ backgroundColor: bg, borderRadius: radius, paddingHorizontal: spacing * 1.1, paddingVertical: spacing * 0.55, marginRight: spacing * 0.4, marginBottom: spacing * 0.4, alignItems: "center" }, style]}
    >
      <Text style={{ color: fg, fontSize: fs.small, fontWeight: "700" }}>{label}</Text>
    </TouchableOpacity>
  );
}

/** A titled section wrapper. */
export function Section({
  title,
  children,
  theme,
  style,
}: {
  title: string;
  children: React.ReactNode;
  theme: BuilderTheme;
  style?: StyleProp<ViewStyle>;
}) {
  const { c, spacing, radius, fs } = useThemeStyles(theme);
  return (
    <View style={[{ backgroundColor: c.surface, borderRadius: radius, padding: spacing, marginBottom: spacing, borderWidth: 1, borderColor: c.border }, style]}>
      <Text style={{ color: c.textMuted, fontSize: fs.small, fontWeight: "800", textTransform: "uppercase", marginBottom: spacing * 0.6, letterSpacing: 0.6 }}>
        {title}
      </Text>
      {children}
    </View>
  );
}

/**
 * A section whose content can be collapsed. `right` renders on the header
 * row (e.g. a status badge). Starts collapsed unless `defaultOpen`.
 */
export function Collapsible({
  title,
  children,
  theme,
  right,
  defaultOpen = false,
  style,
}: {
  title: string;
  children: React.ReactNode;
  theme: BuilderTheme;
  right?: React.ReactNode;
  defaultOpen?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { c, spacing, radius, fs } = useThemeStyles(theme);
  const [open, setOpen] = useState(defaultOpen);
  return (
    <View style={[{ backgroundColor: c.surface, borderRadius: radius, marginBottom: spacing, borderWidth: 1, borderColor: c.border, overflow: "hidden" }, style]}>
      <TouchableOpacity
        onPress={() => setOpen((o) => !o)}
        style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing, paddingVertical: spacing * 0.8 }}
      >
        <Text style={{ color: c.textMuted, fontSize: fs.small, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.6 }}>
          {title}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {right}
          <Text style={{ color: c.textMuted, fontSize: fs.small, marginLeft: spacing * 0.4, fontWeight: "700" }}>
            {open ? "−" : "+"}
          </Text>
        </View>
      </TouchableOpacity>
      {open && <View style={{ paddingHorizontal: spacing, paddingBottom: spacing }}>{children}</View>}
    </View>
  );
}

/** A simple on/off toggle. */
export function Toggle({
  label,
  value,
  onChange,
  theme,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  theme: BuilderTheme;
}) {
  const { c, spacing, fs } = useThemeStyles(theme);
  return (
    <TouchableOpacity
      onPress={() => onChange(!value)}
      style={{ flexDirection: "row", alignItems: "center", marginVertical: spacing * 0.3 }}
    >
      <View
        style={{
          width: 40,
          height: 22,
          borderRadius: 11,
          backgroundColor: value ? c.primary : c.chipBg,
          justifyContent: "center",
          paddingHorizontal: 2,
          marginRight: spacing * 0.6,
        }}
      >
        <View
          style={{
            width: 18,
            height: 18,
            borderRadius: 9,
            backgroundColor: "#fff",
            alignSelf: value ? "flex-end" : "flex-start",
          }}
        />
      </View>
      <Text style={{ color: c.text, fontSize: fs.body }}>{label}</Text>
    </TouchableOpacity>
  );
}

/** A themed modal wrapper. `fullScreen` fills the screen (large editors). */
export function Modal({
  visible,
  title,
  onClose,
  children,
  theme,
  fullScreen,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  theme: BuilderTheme;
  fullScreen?: boolean;
}) {
  const { c, spacing, radius, fs } = useThemeStyles(theme);
  return (
    <RNModal visible={visible} transparent animationType={fullScreen ? "slide" : "fade"} onRequestClose={onClose}>
      {fullScreen ? (
        <View style={{ flex: 1, backgroundColor: c.background, padding: spacing * 1.5 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing }}>
            <Text style={{ color: c.text, fontSize: fs.title, fontWeight: "800" }}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={{ paddingHorizontal: 8, paddingVertical: 4 }}>
              <Text style={{ color: c.textMuted, fontSize: fs.title, fontWeight: "700" }}>✕</Text>
            </TouchableOpacity>
          </View>
          {children}
        </View>
      ) : (
        <View style={{ flex: 1, backgroundColor: c.modalOverlay, justifyContent: "center", padding: spacing * 2 }}>
          <View style={{ backgroundColor: c.surface, borderRadius: radius, padding: spacing * 1.5, maxHeight: "80%" }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing }}>
              <Text style={{ color: c.text, fontSize: fs.title, fontWeight: "700" }}>{title}</Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={{ color: c.textMuted, fontSize: fs.title }}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView>{children}</ScrollView>
          </View>
        </View>
      )}
    </RNModal>
  );
}
