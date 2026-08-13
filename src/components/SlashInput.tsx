/**
 * SlashInput — a TextInput with slash-command variable autocomplete.
 *
 * Typing "/" starts composing a fragment; a suggestion card appears under the
 * field listing matching variables (key/label/description). Tapping one
 * inserts "{{key}}" in place of the token. A bare "/" with nothing typed
 * shows no suggestions; typing a space leaves the "/" literal.
 *
 * A ⓘ button beside the field opens the variable help modal.
 */

import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import type { BuilderTheme, VariableSpec } from "../types.js";
import { applySuggestion, detectToken, repeatFieldOf, suggestVariables } from "../state/slash.js";
import { VariableHelpModal } from "./VariableHelpModal.js";
import { useThemeStyles } from "./ui/primitives.js";

export function SlashInput({
  value,
  onChangeText,
  variables,
  theme,
  multiline = true,
  placeholder,
  /** Repeat-list keys (e.g. "order.items") that scope placeholders to items. */
  repeatLists = [],
  /** The row's current repeat list, if any. */
  repeat = undefined,
  /** Called when accepting a suggestion auto-set a repeat list. */
  onSetRepeat,
  /** Repeat-list keys whose items are strings (insert "{{this}}" instead of a field). */
  stringLists = [],
}: {
  value: string;
  onChangeText: (v: string) => void;
  variables: VariableSpec[];
  theme: BuilderTheme;
  multiline?: boolean;
  placeholder?: string;
  repeatLists?: string[];
  repeat?: string;
  onSetRepeat?: (list: string) => void;
  stringLists?: string[];
}) {
  const { c, spacing, radius, fs } = useThemeStyles(theme);
  const safeValue = value ?? "";
  const [caret, setCaret] = useState<number>(safeValue.length);
  const [showHelp, setShowHelp] = useState(false);

  const token = useMemo(() => detectToken(safeValue, caret), [safeValue, caret]);
  const suggestions = useMemo(
    () => (token ? suggestVariables(variables, token.fragment) : []),
    [token, variables],
  );

  const onSelectionChange = (e: { nativeEvent: { selection: { start: number; end: number } } }) => {
    const { start, end } = e.nativeEvent.selection;
    if (start === end) setCaret(start);
  };

  const accept = (key: string) => {
    if (!token) return;
    // A field of a repeat list (order.items.name → {{name}}), a string-list
    // itself (order.items → {{this}}), or a plain variable.
    const field = repeatFieldOf(key, repeatLists);
    if (field) {
      if (field.list !== repeat) onSetRepeat?.(field.list);
      const insertKey = field.field;
      const { text, caret: newCaret } = applySuggestion(safeValue, insertKey, token);
      onChangeText(text);
      setCaret(newCaret);
      return;
    }
    if (stringLists.includes(key)) {
      if (key !== repeat) onSetRepeat?.(key);
      const { text, caret: newCaret } = applySuggestion(safeValue, "this", token);
      onChangeText(text);
      setCaret(newCaret);
      return;
    }
    const { text, caret: newCaret } = applySuggestion(safeValue, key, token);
    onChangeText(text);
    setCaret(newCaret);
  };

  return (
    <View>
      <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
        <TextInput
          value={safeValue}
          onChangeText={onChangeText}
          onSelectionChange={onSelectionChange}
          multiline={multiline}
          placeholder={placeholder ?? 'Type "/" to insert a variable'}
          placeholderTextColor={c.textMuted}
          style={{
            flex: 1,
            color: c.text,
            borderColor: c.border,
            borderWidth: 1,
            borderRadius: radius,
            paddingHorizontal: spacing * 0.8,
            paddingVertical: spacing * 0.6,
            fontSize: fs.body,
            minHeight: multiline ? 56 : 40,
            backgroundColor: c.background,
          }}
        />
        <TouchableOpacity
          onPress={() => setShowHelp(true)}
          style={{ marginLeft: spacing * 0.5, paddingHorizontal: 6, paddingTop: multiline ? 2 : 8 }}
        >
          <Text style={{ color: c.primary, fontSize: fs.title, fontWeight: "700" }}>ⓘ</Text>
        </TouchableOpacity>
      </View>

      {suggestions.length > 0 && (
        <View
          style={{
            marginTop: 4,
            backgroundColor: c.surface,
            borderColor: c.border,
            borderWidth: 1,
            borderRadius: radius,
            overflow: "hidden",
            maxHeight: 180,
          }}
        >
          <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled>
            {suggestions.map((item) => {
              const field = repeatFieldOf(item.key, repeatLists);
              const isStringList = stringLists.includes(item.key);
              const shownKey = field ? field.field : isStringList ? "this" : item.key;
              return (
                <TouchableOpacity
                  key={item.key}
                  onPress={() => accept(item.key)}
                  style={{ paddingHorizontal: spacing, paddingVertical: spacing * 0.5, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border }}
                >
                  <Text style={{ color: c.text, fontSize: fs.body, fontWeight: "600" }}>
                    {item.label} <Text style={{ color: c.primary }}>{"{{" + shownKey + "}}"}</Text>
                    {field && <Text style={{ color: c.textMuted, fontSize: fs.small }}>  (repeats over {field.list})</Text>}
                    {isStringList && <Text style={{ color: c.textMuted, fontSize: fs.small }}>  (each item is a value)</Text>}
                  </Text>
                  <Text style={{ color: c.textMuted, fontSize: fs.small }}>{item.description}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      <VariableHelpModal
        visible={showHelp}
        onClose={() => setShowHelp(false)}
        variables={variables}
        theme={theme}
      />
    </View>
  );
}
