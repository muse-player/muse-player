import { useCallback, useEffect, useRef } from "react";

export function useCursorHighlight(
  containerRef: React.RefObject<HTMLDivElement | null>,
  getElementsAtTime: (millisec: number) => { notes: string[]; page: number },
  currentTime: number,
  playing: boolean,
) {
  const overlaysRef = useRef<HTMLDivElement[]>([]);
  const prevPageRef = useRef(0);

  const clearOverlays = useCallback(() => {
    for (const div of overlaysRef.current) {
      div.remove();
    }
    overlaysRef.current = [];
  }, []);

  // Update highlights based on current playback time
  useEffect(() => {
    if (!playing || currentTime <= 0) {
      clearOverlays();
      return;
    }

    const result = getElementsAtTime(currentTime * 1000);
    if (!result || !result.notes || result.notes.length === 0) {
      clearOverlays();
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    // Clear on page change
    if (result.page !== prevPageRef.current) {
      clearOverlays();
      prevPageRef.current = result.page;
    }

    const containerRect = container.getBoundingClientRect();

    // Find all note elements and compute bounding boxes
    const boxes: DOMRect[] = [];
    for (const noteId of result.notes) {
      const el = container.querySelector(`#${CSS.escape(noteId)}`);
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        boxes.push(rect);
      }
    }

    if (boxes.length === 0) {
      clearOverlays();
      return;
    }

    // Merge overlapping boxes into one highlight region
    const minLeft = Math.min(...boxes.map((b) => b.left));
    const minTop = Math.min(...boxes.map((b) => b.top));
    const maxRight = Math.max(...boxes.map((b) => b.right));
    const maxBottom = Math.max(...boxes.map((b) => b.bottom));

    const pad = 4;
    const relLeft = minLeft - containerRect.left + container.scrollLeft - pad;
    const relTop = minTop - containerRect.top + container.scrollTop - pad;
    const width = maxRight - minLeft + pad * 2;
    const height = maxBottom - minTop + pad * 2;

    // Reuse or create overlay div
    let overlay = overlaysRef.current[0];
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.style.position = "absolute";
      overlay.style.pointerEvents = "none";
      overlay.style.borderRadius = "3px";
      overlay.style.backgroundColor = "rgba(2, 132, 199, 0.25)";
      overlay.style.zIndex = "10";
      container.appendChild(overlay);
      overlaysRef.current = [overlay];
    }

    overlay.style.left = `${relLeft}px`;
    overlay.style.top = `${relTop}px`;
    overlay.style.width = `${width}px`;
    overlay.style.height = `${height}px`;
  }, [currentTime, playing, getElementsAtTime, containerRef, clearOverlays]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      clearOverlays();
    };
  }, [clearOverlays]);
}
