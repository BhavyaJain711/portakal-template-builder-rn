/**
 * SampleDataEditor — a card that opens a full-screen JSON editor modal for the
 * preview sample data.
 *
 * Tapping the card opens a comfortable large editor (no tiny inline textarea).
 * The user edits JSON directly; parse errors are shown inline and the draft is
 * kept while typing. When valid, the parsed object is passed to the preview.
 * In read-only mode (editable=false) the card shows a summary and the modal
 * shows the JSON without an editor.
 */

import { useEffect, useState } from "react";
import { ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import type { BuilderTheme } from "../types.js";
import { Button, Modal, useThemeStyles } from "./ui/primitives.js";

export function SampleDataEditor({
  sampleData,
  onChange,
  theme,
  editable = true,
}: {
  sampleData: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
  theme: BuilderTheme;
  editable?: boolean;
}) {
  const { c, spacing, radius, fs } = useThemeStyles(theme);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string>(() => JSON.stringify(sampleData, null, 2));
  const [error, setError] = useState<string | null>(null);

  // When the parent replaces the sample data (e.g. new variables), resync.
  useEffect(() => {
    setDraft(JSON.stringify(sampleData, null, 2));
    setError(null);
  }, [sampleData]);

  const handleChange = (text: string) => {
    setDraft(text);
    if (text.trim() === "") {
      setError(null);
      onChange({});
      return;
    }
    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        setError(null);
        onChange(parsed as Record<string, unknown>);
      } else {
        setError("Top-level value must be a JSON object");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid JSON");
    }
  };

  const format = () => {
    try {
      setDraft(JSON.stringify(JSON.parse(draft), null, 2));
      setError(null);
    } catch {
      // leave as-is; the error badge already explains
    }
  };

  const pretty = JSON.stringify(sampleData, null, 2);

  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        style={{ backgroundColor: c.surface, borderRadius: radius, marginBottom: spacing, borderWidth: 1, borderColor: c.border, padding: spacing }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{ color: c.textMuted, fontSize: fs.small, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.6 }}>
            Preview data (JSON)
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {!error && editable && <Text style={{ color: c.success, fontSize: fs.small, fontWeight: "700", marginRight: 6 }}>✓</Text>}
            <Text style={{ color: c.textMuted, fontSize: fs.small, fontWeight: "700" }}>↗</Text>
          </View>
        </View>
        <Text
          numberOfLines={2}
          style={{ color: c.textMuted, fontSize: fs.small, fontFamily: "monospace", marginTop: spacing * 0.4 }}
        >
          {pretty}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={open}
        onClose={() => setOpen(false)}
        title="Preview data (JSON)"
        theme={theme}
        fullScreen
      >
        <Text style={{ color: c.textMuted, fontSize: fs.small, marginBottom: spacing * 0.5 }}>
          Edit the sample data the preview renders with. Repeat rows read arrays,
          e.g. <Text style={{ color: c.text }}>{'"order": { "items": [{ "name": "Hamburger" }] }'}</Text>.
        </Text>
        {editable ? (
          <TextInput
            value={draft}
            onChangeText={handleChange}
            multiline
            autoCapitalize="none"
            autoCorrect={false}
            style={{
              color: c.text,
              borderColor: error ? c.danger : c.border,
              borderWidth: 1,
              borderRadius: radius,
              padding: spacing * 0.8,
              fontSize: fs.small,
              fontFamily: "monospace",
              backgroundColor: c.background,
              minHeight: 260,
              textAlignVertical: "top",
            }}
          />
        ) : (
          <ScrollView style={{ maxHeight: 320, backgroundColor: c.background, borderRadius: radius, padding: spacing * 0.8 }}>
            <Text selectable style={{ color: c.text, fontSize: fs.small, fontFamily: "monospace" }}>
              {pretty}
            </Text>
          </ScrollView>
        )}
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: spacing * 0.6 }}>
          {editable && (
            <Button label="Format" onPress={format} theme={theme} variant="primary" />
          )}
          <Text style={{ color: error ? c.danger : c.success, fontSize: fs.small, fontWeight: "700", marginLeft: spacing * 0.4, flex: 1 }}>
            {error ?? (editable ? "JSON is valid" : "Read-only preview")}
          </Text>
        </View>
      </Modal>
    </>
  );
}
