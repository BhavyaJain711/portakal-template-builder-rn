/**
 * VariableHelpModal — a modal listing every allowed variable with its key,
 * label, description, and sample value. Opened via the ⓘ button on SlashInput.
 */

import { Text, View } from "react-native";
import type { BuilderTheme, VariableSpec } from "../types.js";
import { Modal, useThemeStyles } from "./ui/primitives.js";

export function VariableHelpModal({
  visible,
  onClose,
  variables,
  theme,
}: {
  visible: boolean;
  onClose: () => void;
  variables: VariableSpec[];
  theme: BuilderTheme;
}) {
  const { c, spacing, fs } = useThemeStyles(theme);
  return (
    <Modal visible={visible} title="Available variables" onClose={onClose} theme={theme}>
      <Text style={{ color: c.textMuted, fontSize: fs.small, marginBottom: spacing }}>
        Type "/" in a text field and start typing to insert one of these.
      </Text>
      {variables.map((v) => (
        <View key={v.key} style={{ marginBottom: spacing * 0.9 }}>
          <Text style={{ color: c.primary, fontSize: fs.body, fontWeight: "700" }}>
            {v.label} <Text style={{ color: c.textMuted, fontWeight: "400" }}>{"{{" + v.key + "}}"}</Text>
          </Text>
          <Text style={{ color: c.text, fontSize: fs.body }}>{v.description}</Text>
          <Text style={{ color: c.textMuted, fontSize: fs.small }}>
            Sample: <Text style={{ color: c.text }}>{String(v.sample)}</Text>
          </Text>
        </View>
      ))}
    </Modal>
  );
}
