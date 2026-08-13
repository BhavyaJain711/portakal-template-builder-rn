/**
 * Build sample data for the preview from VariableSpecs.
 * Dotted keys become nested objects: "order.number" → { order: { number: ... } }.
 */

import type { VariableSpec } from "../types.js";

export function buildSampleData(variables: VariableSpec[]): Record<string, unknown> {
  const data: Record<string, unknown> = {};

  // A variable whose sample is an array is a repeat list — its key occupies
  // the whole subtree, so item-field keys under it must not be materialized.
  const listKeys = new Set(
    variables.filter((v) => Array.isArray(v.sample)).map((v) => v.key),
  );

  const underList = (key: string): boolean => {
    for (const lk of listKeys) {
      if (key.startsWith(lk + ".")) return true;
    }
    return false;
  };

  for (const v of variables) {
    if (Array.isArray(v.sample)) {
      setPath(data, v.key, v.sample);
      continue;
    }
    if (underList(v.key)) continue; // covered by the list's items
    const parts = v.key.split(".");
    let cursor: Record<string, unknown> = data;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i]!;
      if (!cursor[part] || typeof cursor[part] !== "object") {
        cursor[part] = {};
      }
      cursor = cursor[part] as Record<string, unknown>;
    }
    const last = parts[parts.length - 1]!;
    if (!(last in cursor)) {
      cursor[last] = v.sample;
    }
  }
  return data;
}

/** Tokenize a path into segments, where "parts[0].name" → ["parts", 0, "name"]. */
export function tokenizePath(path: string): (string | number)[] {
  const tokens: (string | number)[] = [];
  for (const part of path.split(".")) {
    const idxMatch = part.match(/^([A-Za-z_$][\w$]*)(?:\[(\d+)\])*$/);
    if (!idxMatch) {
      // Not a clean identifier — treat the whole thing as a literal key.
      tokens.push(part);
      continue;
    }
    tokens.push(idxMatch[1]!);
    for (let i = 2; i < idxMatch.length; i++) {
      if (idxMatch[i] !== undefined) tokens.push(Number(idxMatch[i]));
    }
  }
  return tokens;
}

/** Get a value at a dotted path (undefined when any segment is missing). */
export function getPath(data: Record<string, unknown>, path: string): unknown {
  let current: unknown = data;
  for (const token of tokenizePath(path)) {
    if (current === null || current === undefined || typeof current !== "object") return undefined;
    current = (current as Record<string | number, unknown>)[token];
  }
  return current;
}

/** Set a value at a dotted path, creating intermediate objects/arrays. */
export function setPath(data: Record<string, unknown>, path: string, value: unknown): void {
  const tokens = tokenizePath(path);
  let cursor: Record<string | number, unknown> = data;
  for (let i = 0; i < tokens.length - 1; i++) {
    const token = tokens[i]!;
    const next = cursor[token];
    if (next === null || next === undefined || typeof next !== "object") {
      // If the next token is a number, create an array; otherwise an object.
      const created = typeof tokens[i + 1] === "number" ? [] : {};
      cursor[token] = created;
    }
    cursor = cursor[token] as Record<string | number, unknown>;
  }
  const last = tokens[tokens.length - 1]!;
  if (value === undefined) {
    delete cursor[last];
  } else {
    cursor[last] = value;
  }
}

/** Find variables whose key points at a value under the repeat path (used for row repeat options). */
export function listVariablesAt(data: Record<string, unknown>, path: string): string[] {
  const value = getPath(data, path);
  if (Array.isArray(value)) {
    return value.map((_, i) => `${path}[${i}]`);
  }
  return [];
}

/** Variables whose sample is an array — candidates for repeat rows. */
export function listVariables(variables: VariableSpec[]): VariableSpec[] {
  return variables.filter((v) => Array.isArray(v.sample));
}
