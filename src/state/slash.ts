/**
 * Slash-command autocomplete tokenizer for text element content.
 *
 * UX (per spec):
 *  - A bare "/" at the caret with nothing typed → no suggestions; typing a
 *    space leaves "/" as a literal character.
 *  - Typing after "/" (e.g. "/ord") filters variables by key/label/description.
 *  - Accepting a suggestion replaces the "/fragment" with "{{key}}".
 *
 * Pure functions, no React — unit-tested in isolation.
 */

import type { VariableSpec } from "../types.js";

/** A detected slash-token at the caret position. */
export interface SlashToken {
  /** Start index (inclusive) of the "/" in the content. */
  start: number;
  /** End index (exclusive) of the fragment after "/". */
  end: number;
  /** The typed fragment after "/" ("" when nothing typed yet). */
  fragment: string;
  /** Whether the caret is at the end of the token (still composing). */
  active: boolean;
}

const TOKEN_RE_SRC = "/[A-Za-z0-9_.\\-]*";

/**
 * Detect a slash-token covering (or ending at) the caret position.
 * A bare "/" with no following char is detected as active but produces no
 * suggestions (see suggestVariables). A "/" followed by a space is not a
 * token — the slash stays literal.
 */
export function detectToken(content: string, caret: number): SlashToken | null {
  if (caret < 0) caret = 0;
  if (caret > content.length) caret = content.length;

  // Fresh regex per call — a shared /g regex keeps lastIndex across matchAll.
  const re = new RegExp(TOKEN_RE_SRC, "g");
  for (const m of content.matchAll(re)) {
    const start = m.index!;
    const end = start + m[0].length;
    // The token covers [start, end). The caret is composing when it sits
    // inside the token or exactly at its end.
    if (caret >= start && caret <= end) {
      const fragment = content.slice(start + 1, caret);
      // A slash immediately followed by a space is not a variable token —
      // "/ " stays literal.
      const nextChar = content[start + 1];
      if (nextChar === " " || nextChar === "\n" || nextChar === "\t") return null;
      return { start, end, fragment, active: true };
    }
  }
  return null;
}

/** Case-insensitive substring filter across key, label, and description. */
export function suggestVariables(
  variables: VariableSpec[],
  fragment: string,
  limit = 5,
): VariableSpec[] {
  const q = fragment.trim().toLowerCase();
  if (!q) return []; // bare "/" → no suggestions (per spec)
  const hits = variables.filter(
    (v) =>
      v.key.toLowerCase().includes(q) ||
      v.label.toLowerCase().includes(q) ||
      v.description.toLowerCase().includes(q),
  );
  return hits.slice(0, limit);
}

/** Result of accepting a suggestion. */
export interface SlashReplacement {
  /** Full content with "{{key}}" substituted for the token. */
  text: string;
  /** Caret position after the inserted "{{key}}". */
  caret: number;
}

/**
 * When a key is a field of a repeat list (e.g. "order.items.name" with list
 * "order.items"), the inserted placeholder should be the item-scoped "{{name}}"
 * — that's what resolves per repeated row. Returns null when the key isn't
 * under any known list.
 */
export function repeatFieldOf(
  key: string,
  listKeys: string[],
): { list: string; field: string } | null {
  let best: { list: string; field: string } | null = null;
  for (const list of listKeys) {
    if (key.startsWith(list + ".")) {
      const candidate = { list, field: key.slice(list.length + 1) };
      if (!best || list.length > best.list.length) best = candidate;
    }
  }
  return best;
}

/**
 * Replace the slash-token [start, end) in `content` with "{{key}}".
 * If `token` is omitted, the token is detected from `content`/`caret`.
 */
export function applySuggestion(
  content: string,
  key: string,
  token: SlashToken,
): SlashReplacement {
  const insert = `{{${key}}}`;
  const text = content.slice(0, token.start) + insert + content.slice(token.end);
  const caret = token.start + insert.length;
  return { text, caret };
}
