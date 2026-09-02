import { useCallback, useEffect, useRef } from "react";

const RIGHT_HAND_COLOR = "rgb(59, 130, 246)";
const RIGHT_HAND_BG = "rgba(59, 130, 246, 0.25)";
const LEFT_HAND_COLOR = "rgb(239, 68, 68)";
const LEFT_HAND_BG = "rgba(239, 68, 68, 0.25)";

type Hand = "left" | "right";

export function useNoteHighlight(
  containerReference: React.RefObject<HTMLDivElement | null>,
  activeNoteIds: string[],
  getElementAttribute: (xmlId: string) => Record<string, string>,
) {
  const overlayReference = useRef<HTMLDivElement | null>(null);
  const handDivs = useRef<Map<Hand, HTMLDivElement>>(new Map());

  const getOrCreateOverlay = useCallback((): HTMLDivElement | null => {
    if (overlayReference.current?.isConnected)
      return overlayReference.current;

    const container = containerReference.current;
    if (!container)
      return null;

    const relativeWrapper = container.firstElementChild as HTMLDivElement | null;
    if (!relativeWrapper)
      return null;

    let overlay = relativeWrapper.querySelector("div.note-highlight-overlay") as HTMLDivElement;
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.classList.add("note-highlight-overlay");
      overlay.style.position = "absolute";
      overlay.style.top = "0";
      overlay.style.left = "0";
      overlay.style.width = "100%";
      overlay.style.height = "100%";
      overlay.style.pointerEvents = "none";
      overlay.style.overflow = "hidden";
      relativeWrapper.append(overlay);
    }
    overlayReference.current = overlay;
    return overlay;
  }, [containerReference]);

  const resolveHand = useCallback((noteId: string): Hand => {
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

    const container = containerReference.current;
    if (!container)
      return;

    // Group note bounding rects by hand
    const rectsByHand = new Map<Hand, DOMRect[]>();
    for (const id of activeNoteIds) {
      const element = document.querySelector(`#${id}`);
      if (!element)
        continue;
      const hand = resolveHand(id);
      let rects = rectsByHand.get(hand);
      if (!rects) {
        rects = [];
        rectsByHand.set(hand, rects);
      }
      rects.push(element.getBoundingClientRect());
    }

    const activeHands = new Set(rectsByHand.keys());
    const existing = handDivs.current;

    // Always clean up inactive hands
    for (const [hand, div] of existing) {
      if (activeHands.has(hand))
        continue;
      div.remove();
      existing.delete(hand);
    }

    if (rectsByHand.size === 0)
      return;

    // Create or update one merged div per active hand
    const containerRect = container.getBoundingClientRect();
    const padding = 2;
    for (const [hand, rects] of rectsByHand) {
      const minX = Math.min(...rects.map(r => r.left));
      const minY = Math.min(...rects.map(r => r.top));
      const maxX = Math.max(...rects.map(r => r.right));
      const maxY = Math.max(...rects.map(r => r.bottom));

      let div = existing.get(hand);
      if (!div) {
        div = document.createElement("div");
        div.style.position = "absolute";
        div.style.borderRadius = "4px";
        div.style.border = `1.5px solid ${hand === "right" ? RIGHT_HAND_COLOR : LEFT_HAND_COLOR}`;
        div.style.backgroundColor = hand === "right" ? RIGHT_HAND_BG : LEFT_HAND_BG;
        overlay.append(div);
        existing.set(hand, div);
      }

      div.style.left = `${minX - containerRect.left + container.scrollLeft - padding}px`;
      div.style.top = `${minY - containerRect.top + container.scrollTop - padding}px`;
      div.style.width = `${maxX - minX + padding * 2}px`;
      div.style.height = `${maxY - minY + padding * 2}px`;
    }
  }, [activeNoteIds, getOrCreateOverlay, resolveHand, containerReference]);
}
