/**
 * Row / cell editing UI. Each row is a card with a height field, move/delete
 * buttons, a repeat (dynamic row) picker, and a list of cell cards. Each cell
 * card has an icon header (move up/down, delete), a width field, an
 * element-type picker, and the matching element editor.
 */

import { Text, TextInput, View } from "react-native";
import type { TemplateCell, TemplateElement, TemplateRow, TemplateSchema } from "portakal-template";
import type { BuilderTheme, VariableSpec } from "../types.js";
import type { BuilderAction } from "../state/builderReducer.js";
import { Button, Chip, Divider, IconButton, NumberField, Section, TextBtn, useThemeStyles } from "./ui/primitives.js";
import {
  BarCodeElementEditor,
  BoxElementEditor,
  ImageElementEditor,
  LineElementEditor,
  QrCodeElementEditor,
  TextElementEditor,
  type RepeatCtx,
} from "./editors/ElementEditors.js";

const ELEMENT_TYPES = ["text", "barcode", "qrcode", "line", "box", "image", "space"] as const;

/** A readable name + glyph for each element type. */
const TYPE_META: Record<string, { label: string; glyph: string }> = {
  text: { label: "Text", glyph: "T" },
  barcode: { label: "Barcode", glyph: "▌▌" },
  qrcode: { label: "QR", glyph: "▦" },
  line: { label: "Line", glyph: "—" },
  box: { label: "Box", glyph: "▢" },
  image: { label: "Image", glyph: "🖼" },
  space: { label: "Space", glyph: "·" },
};

function ElementEditor({
  element,
  onPatch,
  variables,
  theme,
  repeatCtx,
}: {
  element: TemplateElement;
  onPatch: (p: Partial<TemplateElement>) => void;
  variables: VariableSpec[];
  theme: BuilderTheme;
  repeatCtx?: RepeatCtx;
}) {
  switch (element.type) {
    case "text":
      return <TextElementEditor element={element} onPatch={onPatch} variables={variables} theme={theme} repeatCtx={repeatCtx} />;
    case "barcode":
      return <BarCodeElementEditor element={element} onPatch={onPatch} variables={variables} theme={theme} repeatCtx={repeatCtx} />;
    case "qrcode":
      return <QrCodeElementEditor element={element} onPatch={onPatch} variables={variables} theme={theme} repeatCtx={repeatCtx} />;
    case "line":
      return <LineElementEditor element={element} onPatch={onPatch} theme={theme} />;
    case "box":
      return <BoxElementEditor element={element} onPatch={onPatch} variables={variables} theme={theme} repeatCtx={repeatCtx} />;
    case "image":
      return <ImageElementEditor element={element} onPatch={onPatch} theme={theme} />;
    default:
      return <Text style={{ color: theme.colors.textMuted, fontSize: theme.fontSizes?.small }}>Empty space</Text>;
  }
}

export function CellEditor({
  cell,
  rowIndex,
  cellIndex,
  cellCount,
  dispatch,
  variables,
  theme,
  editable = true,
  repeatCtx,
}: {
  cell: TemplateCell;
  rowIndex: number;
  cellIndex: number;
  cellCount: number;
  dispatch: (a: BuilderAction) => void;
  variables: VariableSpec[];
  theme: BuilderTheme;
  editable?: boolean;
  repeatCtx?: RepeatCtx;
}) {
  const { c, spacing, radius, fs } = useThemeStyles(theme);
  const el = cell.element;
  const meta = TYPE_META[el.type] ?? TYPE_META.text!;

  const patch = (p: Partial<TemplateElement>) =>
    dispatch({ type: "patchElement", rowIndex, cellIndex, patch: p });

  return (
    <View style={{ backgroundColor: c.background, borderRadius: radius, padding: spacing * 0.9, marginBottom: spacing * 0.6, borderWidth: 1, borderColor: c.border }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
          <Text style={{ color: c.primary, fontSize: fs.small, fontWeight: "800", marginRight: spacing * 0.4 }}>{meta.glyph}</Text>
          <Text style={{ color: c.text, fontSize: fs.body, fontWeight: "700" }} numberOfLines={1}>
            {meta.label}
          </Text>
          {el.type === "text" && el.content && (
            <Text style={{ color: c.textMuted, fontSize: fs.small, marginLeft: spacing * 0.5, flexShrink: 1 }} numberOfLines={1}>
              · {el.content}
            </Text>
          )}
        </View>
        {editable && (
          <View style={{ flexDirection: "row" }}>
            <IconButton label="↑" onPress={() => dispatch({ type: "moveCell", rowIndex, from: cellIndex, to: cellIndex - 1 })} theme={theme} disabled={cellIndex === 0} />
            <IconButton label="↓" onPress={() => dispatch({ type: "moveCell", rowIndex, from: cellIndex, to: cellIndex + 1 })} theme={theme} disabled={cellIndex === cellCount - 1} />
            <IconButton label="✕" onPress={() => dispatch({ type: "removeCell", rowIndex, cellIndex })} theme={theme} variant="danger" />
          </View>
        )}
      </View>

      {editable && (
        <View style={{ marginTop: spacing * 0.5 }}>
          <NumberField
            label="Width"
            value={cell.widthPercent}
            min={1}
            max={100}
            suffix="%"
            onChange={(widthPercent) => dispatch({ type: "setCellWidth", rowIndex, cellIndex, widthPercent })}
            theme={theme}
          />
        </View>
      )}

      {editable && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: spacing * 0.4 }}>
          {ELEMENT_TYPES.map((t) => (
            <Chip
              key={t}
              label={TYPE_META[t]?.label ?? t}
              active={el.type === t}
              onPress={() => dispatch({ type: "setElementType", rowIndex, cellIndex, element: { type: t } as TemplateElement })}
              theme={theme}
            />
          ))}
        </View>
      )}

      <View style={{ marginTop: spacing * 0.6 }}>
        <ElementEditor element={el} onPatch={patch} variables={variables} theme={theme} repeatCtx={repeatCtx} />
      </View>
    </View>
  );
}

export function RowCard({
  row,
  rowIndex,
  rowCount,
  dispatch,
  variables,
  theme,
  editable = true,
  listVars = [],
}: {
  row: TemplateRow;
  rowIndex: number;
  rowCount: number;
  dispatch: (a: BuilderAction) => void;
  variables: VariableSpec[];
  theme: BuilderTheme;
  editable?: boolean;
  listVars?: VariableSpec[];
}) {
  const { c, spacing, radius, fs } = useThemeStyles(theme);
  const isRepeat = !!row.repeat;
  // Autocomplete context: list-field variables insert {{field}} and auto-set
  // this row's repeat list; string-array lists insert {{this}}.
  const repeatCtx: RepeatCtx = {
    lists: listVars.map((v) => v.key),
    current: row.repeat,
    onSetRepeat: (list) => dispatch({ type: "setRepeat", index: rowIndex, repeat: list }),
    stringLists: listVars
      .filter((v) => Array.isArray(v.sample) && v.sample.every((x) => typeof x !== "object"))
      .map((v) => v.key),
  };

  return (
    <Section
      title={isRepeat ? `Row ${rowIndex + 1} · repeat` : `Row ${rowIndex + 1}`}
      theme={theme}
      style={{ borderLeftWidth: 3, borderLeftColor: isRepeat ? c.success : c.primary }}
    >
      {/* Header: height + row actions */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View style={{ flex: 1 }}>
          {editable ? (
            <NumberField
              label="Height"
              value={row.heightPercent}
              min={1}
              max={100}
              suffix="%"
              onChange={(heightPercent) => dispatch({ type: "setRowHeight", index: rowIndex, heightPercent })}
              theme={theme}
            />
          ) : (
            <Text style={{ color: c.text, fontSize: fs.body }}>Height: {row.heightPercent}%</Text>
          )}
        </View>
        {editable && (
          <View style={{ flexDirection: "row" }}>
            <IconButton label="↑" onPress={() => dispatch({ type: "moveRow", from: rowIndex, to: rowIndex - 1 })} theme={theme} disabled={rowIndex === 0} />
            <IconButton label="↓" onPress={() => dispatch({ type: "moveRow", from: rowIndex, to: rowIndex + 1 })} theme={theme} disabled={rowIndex === rowCount - 1} />
            <IconButton label="✕" onPress={() => dispatch({ type: "removeRow", index: rowIndex })} theme={theme} variant="danger" />
          </View>
        )}
      </View>

      {editable && (
        <>
          <Divider theme={theme} />
          <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap" }}>
            <Text style={{ color: c.textMuted, fontSize: fs.small, marginRight: spacing * 0.4 }}>Repeat list (dynamic rows):</Text>
            <Chip
              label="off"
              active={!row.repeat}
              onPress={() => dispatch({ type: "setRepeat", index: rowIndex, repeat: undefined })}
              theme={theme}
            />
            {listVars.map((v) => (
              <Chip
                key={v.key}
                label={v.key}
                active={row.repeat === v.key}
                onPress={() => dispatch({ type: "setRepeat", index: rowIndex, repeat: row.repeat === v.key ? undefined : v.key })}
                theme={theme}
              />
            ))}
          </View>
          {isRepeat && (
            <TextInput
              value={row.repeat ?? ""}
              onChangeText={(repeat) => dispatch({ type: "setRepeat", index: rowIndex, repeat: repeat || undefined })}
              placeholder="type a list path, e.g. order.items (or pick above)"
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
                marginTop: spacing * 0.4,
              }}
            />
          )}
          {!isRepeat && listVars.length === 0 && (
            <Text style={{ color: c.textMuted, fontSize: fs.small, marginTop: spacing * 0.3 }}>
              Tip: add a variable whose sample is an array to repeat this row.
            </Text>
          )}
        </>
      )}

      <View style={{ marginTop: spacing * 0.6 }}>
        {row.cells.map((cell, cellIndex) => (
          <CellEditor
            key={cellIndex}
            cell={cell}
            rowIndex={rowIndex}
            cellIndex={cellIndex}
            cellCount={row.cells.length}
            dispatch={dispatch}
            variables={variables}
            theme={theme}
            editable={editable}
            repeatCtx={repeatCtx}
          />
        ))}
      </View>
      {editable && (
        <TextBtn label="+ Add cell" onPress={() => dispatch({ type: "addCell", rowIndex })} theme={theme} />
      )}
    </Section>
  );
}

export function RowList({
  schema,
  dispatch,
  variables,
  theme,
  editable = true,
  listVars = [],
}: {
  schema: TemplateSchema;
  dispatch: (a: BuilderAction) => void;
  variables: VariableSpec[];
  theme: BuilderTheme;
  editable?: boolean;
  listVars?: VariableSpec[];
}) {
  const { c, spacing, fs } = useThemeStyles(theme);
  return (
    <View>
      {editable && (
        <Text style={{ color: c.text, fontSize: fs.title, fontWeight: "800", marginBottom: spacing * 0.6 }}>Rows</Text>
      )}
      {schema.rows.map((row, i) => (
        <RowCard key={i} row={row} rowIndex={i} rowCount={schema.rows.length} dispatch={dispatch} variables={variables} theme={theme} editable={editable} listVars={listVars} />
      ))}
      {editable && (
        <Button label="+ Add row" onPress={() => dispatch({ type: "addRow" })} theme={theme} variant="primary" />
      )}
    </View>
  );
}
