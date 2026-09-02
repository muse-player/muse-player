import { useCallback, useEffect, useRef, useState } from "react";

export function useAutoScroll(
  containerReference: React.RefObject<HTMLDivElement | null>,
  currentMeasure: number,
  isPlaying: boolean,
) {
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const scrollTimeoutReference = useRef<null | ReturnType<typeof setTimeout>>(null);
  const lastMeasureReference = useRef(-1);

  // Detect manual scroll and pause auto-scroll
  const handleScroll = useCallback(() => {
    if (!isPlaying)
      return;
    setAutoScrollEnabled(false);
    if (scrollTimeoutReference.current) {
      clearTimeout(scrollTimeoutReference.current);
    }
    scrollTimeoutReference.current = setTimeout(() => {
      setAutoScrollEnabled(true);
    }, 5000);
  }, [isPlaying]);

  useEffect(() => {
    const container = containerReference.current;
    if (!container)
      return;
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", handleScroll);
      if (scrollTimeoutReference.current)
        clearTimeout(scrollTimeoutReference.current);
    };
  }, [containerReference, handleScroll]);

  // Auto-scroll when measure changes
  useEffect(() => {
    if (!isPlaying || !autoScrollEnabled || currentMeasure === lastMeasureReference.current)
      return;
    lastMeasureReference.current = currentMeasure;

    const container = containerReference.current;
    if (!container)
      return;

    // Find SVG elements with measure data
    const measureElements = container.querySelectorAll(`[data-tstamp]`);
    if (measureElements.length === 0) {
      // Fallback: scroll proportionally based on measure count
      const progress = currentMeasure / Math.max(currentMeasure + 10, 1);
      const maxScroll = container.scrollHeight - container.clientHeight;
      container.scrollTo({
        behavior: "smooth",
        top: maxScroll * progress,
      });
      return;
    }

    // Find the element closest to the current time position
    const targetElement = measureElements[Math.min(currentMeasure, measureElements.length - 1)];
    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [currentMeasure, isPlaying, autoScrollEnabled, containerReference]);

  // Re-enable auto-scroll when playback starts
  useEffect(() => {
    if (isPlaying) {
      setAutoScrollEnabled(true);
    }
  }, [isPlaying]);

  return {
    autoScrollEnabled,
    setAutoScrollEnabled,
  };
}
