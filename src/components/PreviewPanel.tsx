/**
 * PreviewPanel — debounced live preview of the template compiled against the
 * printer spec, rendered with react-native-svg's SvgXml (the exact SVG string
 * from compileTemplate, so preview and printed output share the same resolved
 * layout). Shows validation errors and an optional compiled TSC/ZPL view.
 */

import { useEffect, useRef, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SvgXml } from "react-native-svg";
import { compileTemplate } from "portakal-template";
import type { PrintSpec, TemplateSchema } from "portakal-template";
import type { BuilderTheme } from "../types.js";
import { useThemeStyles } from "./ui/primitives.js";

const DEBOUNCE_MS = 200;

export function PreviewPanel({
  schema,
  spec,
  sampleData,
  validation,
  theme,
  showCode,
  showValidation = true,
  manualPreview = false,
  onPreview,
}: {
  schema: TemplateSchema;
  spec: PrintSpec;
  sampleData: Record<string, unknown>;
  validation: { valid: boolean; errors: { path: string; message: string }[] };
  theme: BuilderTheme;
  showCode?: boolean;
  showValidation?: boolean;
  manualPreview?: boolean;
  onPreview?: (result: { tsc: string; zpl: string; svg: string }) => void;
}) {
  const { c, spacing, radius, fs } = useThemeStyles(theme);
  const [compiled, setCompiled] = useState<{ tsc: string; zpl: string; svg: string } | null>(null);
  const [stale, setStale] = useState(false);
  const [showCodePanel, setShowCodePanel] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const renderPreview = () => {
    try {
      const result = compileTemplate(schema, sampleData, { spec });
      setCompiled({ tsc: result.tsc, zpl: result.zpl, svg: result.svg });
      onPreview?.({ tsc: result.tsc, zpl: result.zpl, svg: result.svg });
      setStale(false);
    } catch {
      setCompiled(null);
      setStale(false);
    }
  };

  // Live mode: debounce-compile on every change.
  useEffect(() => {
    if (manualPreview) return; // manual mode compiles on button press
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(renderPreview, DEBOUNCE_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schema, spec, sampleData, manualPreview]);

  // Manual mode: mark the preview stale as soon as inputs change.
  useEffect(() => {
    if (manualPreview) setStale(true);
  }, [schema, spec, sampleData, manualPreview]);

  const needsCompile = manualPreview && (compiled === null || stale);

  return (
    <View style={{ backgroundColor: c.surface, borderRadius: radius, padding: spacing, marginBottom: spacing, borderWidth: 1, borderColor: c.border }}>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: spacing * 0.6 }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: compiled ? c.success : c.danger, marginRight: spacing * 0.5 }} />
        <Text style={{ color: c.textMuted, fontSize: fs.small, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.6 }}>
          Preview
        </Text>
      </View>

      {showValidation && validation.errors.length > 0 && (
        <View style={{ backgroundColor: c.danger, borderRadius: radius, padding: spacing * 0.7, marginBottom: spacing * 0.6 }}>
          <Text style={{ color: "#fff", fontSize: fs.small, fontWeight: "700" }}>
            {validation.errors.length} issue{validation.errors.length > 1 ? "s" : ""} — fix before printing
          </Text>
          {validation.errors.slice(0, 3).map((e, i) => (
            <Text key={i} style={{ color: "#fff", fontSize: fs.small, marginTop: spacing * 0.2, opacity: 0.9 }}>
              · {e.message}
            </Text>
          ))}
        </View>
      )}

      {manualPreview && stale && (
        <View style={{ backgroundColor: c.textMuted, borderRadius: radius, padding: spacing * 0.7, marginBottom: spacing * 0.6, opacity: 0.9 }}>
          <Text style={{ color: "#fff", fontSize: fs.small, fontWeight: "700" }}>
            Preview is outdated — press “Update preview”
          </Text>
        </View>
      )}

      <View
        style={{
          backgroundColor: c.previewBackground,
          borderRadius: radius,
          padding: spacing,
          alignItems: "center",
          justifyContent: "center",
          minHeight: 180,
        }}
      >
        {compiled ? (
          <SvgXml xml={compiled.svg} width="100%" height="100%" />
        ) : (
          <Text style={{ color: c.textMuted, fontSize: fs.body }}>Preview not available</Text>
        )}
      </View>

      {manualPreview && (
        <TouchableOpacity
          onPress={renderPreview}
          disabled={!needsCompile}
          style={{
            marginTop: spacing * 0.6,
            backgroundColor: needsCompile ? c.primary : c.chipBg,
            borderRadius: radius,
            paddingVertical: spacing * 0.5,
            alignItems: "center",
          }}
        >
          <Text style={{ color: needsCompile ? "#fff" : c.chipText, fontSize: fs.small, fontWeight: "800" }}>
            Update preview
          </Text>
        </TouchableOpacity>
      )}

      {showCode && (
        <>
          <TouchableOpacity onPress={() => setShowCodePanel((v) => !v)} style={{ marginTop: spacing * 0.8 }}>
            <Text style={{ color: c.primary, fontSize: fs.small, fontWeight: "700" }}>
              {showCodePanel ? "Hide" : "Show"} compiled TSC / ZPL
            </Text>
          </TouchableOpacity>
          {showCodePanel && compiled && (
            <ScrollView style={{ maxHeight: 220, marginTop: spacing * 0.6, backgroundColor: c.background, borderRadius: radius, padding: spacing * 0.7 }}>
              <Text style={{ color: c.text, fontSize: fs.small, fontFamily: "monospace" }}>{compiled.tsc}</Text>
              <View style={{ height: spacing }} />
              <Text style={{ color: c.textMuted, fontSize: fs.small, fontWeight: "700" }}>ZPL II</Text>
              <Text style={{ color: c.text, fontSize: fs.small, fontFamily: "monospace" }}>{compiled.zpl}</Text>
            </ScrollView>
          )}
        </>
      )}
    </View>
  );
}
