/**
 * TemplateBuilder — the root component. A developer passes the initial
 * template, allowed variables, the printer spec, and a theme; end users edit
 * rows/cells/elements visually with a live preview. Emits the current schema
 * via onChange for persistence, and calls `onSave` when the user presses Save.
 *
 * Layout: portrait → stacked (editor above, preview below); landscape/tablet/
 * web (width ≥ 700) → two-pane with a sticky preview on the right.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { validateTemplate } from "portakal-template";
import type { PrintSpec, TemplateSchema } from "portakal-template";
import type { TemplateBuilderProps } from "../types.js";
import { resolveTheme } from "../theme.js";
import { builderReducer } from "../state/builderReducer.js";
import {
  canRedo,
  canUndo,
  commitWithin,
  initialHistory,
  redo,
  reset,
  undo,
  type HistoryState,
} from "../state/history.js";
import { buildSampleData, listVariables } from "../state/sampleData.js";
import { RowList } from "./RowList.js";
import { PreviewPanel } from "./PreviewPanel.js";
import { SampleDataEditor } from "./SampleDataEditor.js";
import { PrinterSpecEditor } from "./PrinterSpecEditor.js";
import { useThemeStyles } from "./ui/primitives.js";

/** Group edits that arrive within this window into one undo step. */
const UNDO_GROUP_MS = 600;

export function TemplateBuilder({
  template,
  variables,
  spec,
  theme,
  onChange,
  onSave,
  sampleData,
  onPreview,
  showCode,
  manualPreview = false,
  editable = true,
  show,
  editablePanels,
}: TemplateBuilderProps) {
  const resolvedTheme = useMemo(() => resolveTheme(theme), [theme]);
  const { c, spacing } = useThemeStyles(resolvedTheme);
  const [schemaState, setSchemaState] = useState<HistoryState<TemplateSchema>>(() => initialHistory(template));
  const schema = schemaState.present;
  const lastCommitAt = useRef<number | null>(null);
  const [specState, setSpecState] = useState<PrintSpec>(spec);
  const [sampleState, setSampleState] = useState<Record<string, unknown> | undefined>(sampleData);
  const [saving, setSaving] = useState(false);
  const { width } = useWindowDimensions();
  const isWide = width >= 700;
  const firstRender = useRef(true);

  // Options: visibility defaults true; editability defaults to `editable`.
  //
  // Semantics: `show.data: false` hides the JSON panel entirely.
  // `editablePanels.data: false` also hides it (a locked panel isn't exposed),
  // unless the whole builder is in view mode (`editable: false`) — then panels
  // render read-only so the end user can still see the sample data.
  const viewOnly = !editable;
  const showRows = show?.rows ?? true;
  const showData = show?.data ?? true;
  const showPrinter = show?.printer ?? true;
  const showValidation = show?.validation ?? true;
  const editableRows = editablePanels?.rows ?? editable;
  const editableData = editablePanels?.data ?? editable;
  const editablePrinter = editablePanels?.printer ?? editable;
  // Panel is shown when it's visible AND (editable OR view mode). A locked
  // panel in an editable builder is hidden — it can't be changed anyway.
  const showDataPanel = showData && (editableData || viewOnly);
  const showPrinterPanel = showPrinter && (editablePrinter || viewOnly);
  const showRowsPanel = showRows && (editableRows || viewOnly);

  // Wrap the reducer with history: edits commit (grouped), undo/redo navigate.
  const dispatch = useMemo(
    () =>
      (action: Parameters<typeof builderReducer>[1]) => {
        setSchemaState((s) => {
          const next = builderReducer(s.present, action);
          if (next === s.present) return s; // no-op
          const now = Date.now();
          const { history, lastCommitAt: at } = commitWithin(s, next, lastCommitAt.current, UNDO_GROUP_MS, now);
          lastCommitAt.current = at;
          return history;
        });
      },
    [],
  );

  // Re-sync the draft when the parent passes a new template (external load).
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (template !== schema) {
      setSchemaState((s) => reset(s, template));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template]);

  // Re-sync the live preview when the parent passes a new spec or sample data.
  useEffect(() => {
    setSpecState(spec);
  }, [spec]);
  useEffect(() => {
    setSampleState(sampleData);
  }, [sampleData]);

  const validation = useMemo(
    () =>
      validateTemplate(schema, {
        allowedVariables: variables.map((v) => ({ key: v.key, label: v.label })),
      }),
    [schema, variables],
  );

  const previewData = useMemo(
    () => sampleState ?? buildSampleData(variables),
    [sampleState, variables],
  );

  // List variables (sample is an array) are repeat-row candidates.
  const listVars = useMemo(() => listVariables(variables), [variables]);

  // Notify the parent on every schema change (skip the very first render).
  useEffect(() => {
    if (firstRender.current) return;
    onChange?.(schema);
  }, [schema, onChange]);

  const handleUndo = () => {
    lastCommitAt.current = null; // don't group a fresh edit with the undo jump
    setSchemaState((s) => undo(s));
  };
  const handleRedo = () => {
    lastCommitAt.current = null;
    setSchemaState((s) => redo(s));
  };
  const undoDisabled = !canUndo(schemaState);
  const redoDisabled = !canRedo(schemaState);

  const handleSave = async () => {
    if (!onSave || saving) return;
    setSaving(true);
    try {
      await onSave(schema);
    } finally {
      setSaving(false);
    }
  };

  const header = (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing * 0.6 }}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Text style={{ color: c.text, fontSize: 18, fontWeight: "800" }}>Label template</Text>
        {showValidation && (
          validation.valid ? (
            <Text style={{ color: c.success, fontSize: 12, fontWeight: "700", marginLeft: spacing * 0.6 }}>✓ Valid</Text>
          ) : (
            <Text style={{ color: c.danger, fontSize: 12, fontWeight: "700", marginLeft: spacing * 0.6 }}>
              {validation.errors.length} issue{validation.errors.length > 1 ? "s" : ""}
            </Text>
          )
        )}
      </View>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        {onSave && (
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            style={{ backgroundColor: c.primary, borderRadius: resolvedTheme.radius, paddingHorizontal: spacing * 1.1, paddingVertical: spacing * 0.5, flexDirection: "row", alignItems: "center" }}
          >
            {saving && <ActivityIndicator color="#fff" size="small" style={{ marginRight: 6 }} />}
            <Text style={{ color: "#fff", fontSize: 14, fontWeight: "800" }}>Save</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={handleUndo}
          disabled={undoDisabled}
          style={{ marginLeft: spacing * 0.4, backgroundColor: c.chipBg, borderRadius: resolvedTheme.radius, paddingHorizontal: spacing * 0.8, paddingVertical: spacing * 0.4, opacity: undoDisabled ? 0.35 : 1 }}
        >
          <Text style={{ color: c.chipText, fontSize: 14, fontWeight: "700" }}>↶</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleRedo}
          disabled={redoDisabled}
          style={{ marginLeft: spacing * 0.3, backgroundColor: c.chipBg, borderRadius: resolvedTheme.radius, paddingHorizontal: spacing * 0.8, paddingVertical: spacing * 0.4, opacity: redoDisabled ? 0.35 : 1 }}
        >
          <Text style={{ color: c.chipText, fontSize: 14, fontWeight: "700" }}>↷</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const editorPane = (
    <>
      {showRowsPanel && (
        <RowList schema={schema} dispatch={dispatch} variables={variables} theme={resolvedTheme} editable={editableRows} listVars={listVars} />
      )}
      {showDataPanel && <SampleDataEditor sampleData={previewData} onChange={setSampleState} theme={resolvedTheme} editable={editableData} />}
      {showPrinterPanel && <PrinterSpecEditor spec={specState} onChange={setSpecState} theme={resolvedTheme} editable={editablePrinter} />}
    </>
  );

  const previewPane = (
    <PreviewPanel
      schema={schema}
      spec={specState}
      sampleData={previewData}
      validation={validation}
      theme={resolvedTheme}
      showCode={showCode}
      showValidation={showValidation}
      manualPreview={manualPreview}
      onPreview={onPreview}
    />
  );

  return (
    <View style={[styles.root, { backgroundColor: resolvedTheme.colors.background }]}>
      {isWide ? (
        <View style={styles.twoPane}>
          <ScrollView style={styles.editorPane} contentContainerStyle={{ padding: spacing }}>
            {header}
            {editorPane}
          </ScrollView>
          <View style={[styles.previewCol, { borderLeftColor: c.border }]}>
            <ScrollView contentContainerStyle={{ padding: spacing }}>
              {previewPane}
            </ScrollView>
          </View>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: spacing }}>
          {header}
          {previewPane}
          {editorPane}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  twoPane: { flex: 1, flexDirection: "row" },
  editorPane: { flex: 1 },
  previewCol: { flex: 1, borderLeftWidth: StyleSheet.hairlineWidth },
});
