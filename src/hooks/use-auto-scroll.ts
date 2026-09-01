import { useCallback, useEffect, useRef, useState } from "react";

export function useAutoScroll(
  containerRef: React.RefObject<HTMLDivElement | null>,
  currentMeasure: number,
  playing: boolean,
) {
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastMeasureRef = useRef(-1);

  // Detect manual scroll and pause auto-scroll
  const handleScroll = useCallback(() => {
    if (!playing) return;
    setAutoScrollEnabled(false);
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      setAutoScrollEnabled(true);
    }, 5000);
  }, [playing]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", handleScroll);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, [containerRef, handleScroll]);

  // Auto-scroll when measure changes
  useEffect(() => {
    if (!playing || !autoScrollEnabled || currentMeasure === lastMeasureRef.current) return;
    lastMeasureRef.current = currentMeasure;

    const container = containerRef.current;
    if (!container) return;

    // Find SVG elements with measure data
    const measureElements = container.querySelectorAll(`[data-tstamp]`);
    if (measureElements.length === 0) {
      // Fallback: scroll proportionally based on measure count
      const progress = currentMeasure / Math.max(currentMeasure + 10, 1);
      const maxScroll = container.scrollHeight - container.clientHeight;
      container.scrollTo({
        top: maxScroll * progress,
        behavior: "smooth",
      });
      return;
    }

    // Find the element closest to the current time position
    const targetEl = measureElements[Math.min(currentMeasure, measureElements.length - 1)];
    if (targetEl) {
      targetEl.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [currentMeasure, playing, autoScrollEnabled, containerRef]);

  // Re-enable auto-scroll when playback starts
  useEffect(() => {
    if (playing) {
      setAutoScrollEnabled(true);
    }
  }, [playing]);

  return {
    autoScrollEnabled,
    setAutoScrollEnabled,
  };
}
