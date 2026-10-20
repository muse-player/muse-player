import type { ElementAttributes, TimeMapEntry } from "./types";

// Verovio re-IDs every repeated occurrence in the playback timeline with a
// `-rend<N>` suffix (N = pass), while the rendered SVG only contains the
// notated ID. Timeline IDs must be mapped back before DOM/page lookups.
const REPEAT_PASS_SUFFIX = /-rend\d+$/;

export function canonicalizeElementAttributes(elementAttributes: ElementAttributes): ElementAttributes {
  const result: ElementAttributes = {};
  const assignedIds = new Set<string>();
  for (const [id, attributes] of Object.entries(elementAttributes)) {
    const baseId = toBaseElementId(id);
    // The notated entry carries the real attributes; repeat-pass entries are {}.
    if (baseId === id || !assignedIds.has(baseId)) {
      result[baseId] = attributes;
      assignedIds.add(baseId);
    }
  }
  return result;
}

export function canonicalizeTimemap(timemap: TimeMapEntry[]): TimeMapEntry[] {
  return timemap.map((entry) => {
    const next: TimeMapEntry = { ...entry };
    if (next.on) {
      next.on = next.on.map(id => toBaseElementId(id));
    }
    if (next.off) {
      next.off = next.off.map(id => toBaseElementId(id));
    }
    if (next.measureOn) {
      next.measureOn = toBaseElementId(next.measureOn);
    }
    return next;
  });
}

function toBaseElementId(xmlId: string): string {
  return xmlId.replace(REPEAT_PASS_SUFFIX, "");
}
