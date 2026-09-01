import { useCallback, useEffect, useRef } from "react";

const RIGHT_HAND_COLOR = "rgb(59, 130, 246)";
const RIGHT_HAND_BG = "rgba(59, 130, 246, 0.25)";
const LEFT_HAND_COLOR = "rgb(239, 68, 68)";
const LEFT_HAND_BG = "rgba(239, 68, 68, 0.25)";

interface HighlightRect {
  noteId: string;
  rect: SVGRectElement;
}

export function useNoteHighlight(
  containerReference: React.RefObject<HTMLDivElement | null>,
  activeNoteIds: string[],
  getElementAttribute: (xmlId: string) => Record<string, string>,
) {
  const overlayReference = useRef<null | SVGGElement>(null);
  const highlightsReference = useRef<Map<string, HighlightRect>>(new Map());

  const getOrCreateOverlay = useCallback((): null | SVGGElement => {
    if (overlayReference.current?.isConnected)
      return overlayReference.current;

    const container = containerReference.current;
    if (!container)
      return null;

    const svg = container.querySelector("svg");
    if (!svg)
      return null;

    let overlay = svg.querySelector("g.note-highlight-overlay") as SVGGElement;
    if (!overlay) {
      overlay = document.createElementNS("http://www.w3.org/2000/svg", "g");
      overlay.classList.add("note-highlight-overlay");
      overlay.setAttribute("pointer-events", "none");
      svg.append(overlay);
    }
    overlayReference.current = overlay;
    return overlay;
  }, [containerReference]);

  const resolveHand = useCallback((noteId: string): "left" | "right" => {
    const attributes = getElementAttribute(noteId);
    if (attributes.staff) {
      return attributes.staff === "1" ? "right" : "left";
    }

    const element = document.querySelector(`#${noteId}`);
    if (element) {
      const staffGroup = element.closest("g[class*=\"staff\"]") as null | SVGGElement;
      if (staffGroup) {
        const classList = staffGroup.getAttribute("class") ?? "";
        const match = classList.match(/staff-(\d+)/);
        if (match)
          return match[1] === "1" ? "right" : "left";

        const idMatch = staffGroup.id.match(/staff.*?(\d+)/);
        if (idMatch)
          return idMatch[1] === "1" ? "right" : "left";
      }

      const system = element.closest("g.system") as null | SVGGElement;
      if (system) {
        const systemRect = system.getBoundingClientRect();
        const noteRect = element.getBoundingClientRect();
        const midY = systemRect.top + systemRect.height / 2;
        return noteRect.top < midY ? "right" : "left";
      }
    }

    return "right";
  }, [getElementAttribute]);

  useEffect(() => {
    const overlay = getOrCreateOverlay();
    if (!overlay)
      return;

    const currentIds = new Set(activeNoteIds);
    const existing = highlightsReference.current;

    for (const [id, entry] of existing) {
      if (currentIds.has(id))
        continue;
      entry.rect.remove();
      existing.delete(id);
    }

    for (const id of currentIds) {
      if (existing.has(id))
        continue;

      const element = document.querySelector(`#${id}`);
      if (!element)
        continue;

      const noteRect = element.getBoundingClientRect();
      const svg = overlay.ownerSVGElement;
      if (!svg)
        continue;

      const svgRect = svg.getBoundingClientRect();
      const hand = resolveHand(id);
      const fillColor = hand === "right" ? RIGHT_HAND_BG : LEFT_HAND_BG;
      const strokeColor = hand === "right" ? RIGHT_HAND_COLOR : LEFT_HAND_COLOR;

      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      const padding = 2;
      const vb = svg.viewBox.baseVal;
      const scaleX = vb.width > 0 ? vb.width / svgRect.width : 1;
      const scaleY = vb.height > 0 ? vb.height / svgRect.height : 1;

      const x = (noteRect.left - svgRect.left - padding) * scaleX;
      const y = (noteRect.top - svgRect.top - padding) * scaleY;
      const w = (noteRect.width + padding * 2) * scaleX;
      const h = (noteRect.height + padding * 2) * scaleY;

      rect.setAttribute("x", String(x));
      rect.setAttribute("y", String(y));
      rect.setAttribute("width", String(w));
      rect.setAttribute("height", String(h));
      rect.setAttribute("rx", "4");
      rect.setAttribute("fill", fillColor);
      rect.setAttribute("stroke", strokeColor);
      rect.setAttribute("stroke-width", "1.5");

      overlay.append(rect);
      existing.set(id, { noteId: id, rect });
    }
  }, [activeNoteIds, getOrCreateOverlay, resolveHand]);

  useEffect(() => {
    const container = containerReference.current;
    if (!container)
      return;

    const observer = new MutationObserver(() => {
      overlayReference.current = null;
      highlightsReference.current.clear();
    });

    const svgWrapper = container.querySelector("div");
    if (svgWrapper) {
      observer.observe(svgWrapper, { childList: true });
    }

    return () => observer.disconnect();
  }, [containerReference]);
}
