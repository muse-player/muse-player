import { useCallback, useEffect, useRef, useState } from "react";

export function useAutoScroll(
  containerReference: React.RefObject<HTMLDivElement | null>,
  currentMeasureId: string,
  isPlaying: boolean,
) {
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const scrollTimeoutReference = useRef<null | ReturnType<typeof setTimeout>>(null);
  const lastMeasureReference = useRef("");

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

  // Auto-scroll when the current measure element changes
  useEffect(() => {
    if (!isPlaying || !autoScrollEnabled || !currentMeasureId || currentMeasureId === lastMeasureReference.current)
      return;
    lastMeasureReference.current = currentMeasureId;

    const container = containerReference.current;
    if (!container)
      return;

    // `currentMeasureId` is the notated measure element id (same id space as
    // the rendered SVG); no match means the data has no measure info.
    const target = container.querySelector(`#${CSS.escape(currentMeasureId)}`);
    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [currentMeasureId, isPlaying, autoScrollEnabled, containerReference]);

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
