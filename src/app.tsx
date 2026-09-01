import { useCallback, useEffect, useRef, useState } from "react";
import { PlaybackControls } from "./components/playback-controls";
import { ScoreRenderer } from "./components/score-renderer";
import { useAutoScroll } from "./hooks/use-auto-scroll";
import { usePlayback } from "./hooks/use-playback";
import { useVerovio } from "./hooks/use-verovio";

import "./app.css";

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    ready,
    loading,
    svg,
    currentPage,
    totalPages,
    timeMap,
    midiBase64,
    loadScore,
    renderPage,
    getElementsAtTime,
  } = useVerovio();

  const handleTimeUpdate = useCallback(
    (time: number) => {
      const result = getElementsAtTime(time * 1000);
      if (result.page > 0) {
        renderPage(result.page);
      }
    },
    [getElementsAtTime, renderPage],
  );

  const {
    playing,
    currentTime,
    totalDuration,
    currentMeasure,
    tempo,
    play,
    pause,
    stop,
    seek,
    updateTempo,
  } = usePlayback(midiBase64, timeMap, handleTimeUpdate);

  const { autoScrollEnabled } = useAutoScroll(containerRef, currentMeasure, playing);

  const [pageInput, setPageInput] = useState("1");

  useEffect(() => {
    if (ready) {
      loadScore("/djb.mxl");
    }
  }, [ready, loadScore]);

  useEffect(() => {
    setPageInput(String(currentPage));
  }, [currentPage]);

  const handlePageSubmit = useCallback(() => {
    const page = Number.parseInt(pageInput, 10);
    if (page >= 1 && page <= totalPages) {
      renderPage(page);
    }
  }, [pageInput, totalPages, renderPage]);

  return (
    <div className="flex h-dvh flex-col bg-slate-50 font-sans antialiased">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2 shadow-sm">
        <h1 className="text-base font-semibold text-slate-800">
          MXL Player
        </h1>
        <div className="flex items-center gap-3">
          {/* Page navigation */}
          {totalPages > 0 && (
            <div className="flex items-center gap-1.5 text-sm">
              <button
                onClick={() => renderPage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="rounded px-2 py-1 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
              >
                &laquo;
              </button>
              <input
                type="text"
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handlePageSubmit()}
                onBlur={handlePageSubmit}
                className="w-8 rounded border border-slate-300 bg-white text-center text-sm"
              />
              <span className="text-slate-500">
                /
                {totalPages}
              </span>
              <button
                onClick={() => renderPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="rounded px-2 py-1 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
              >
                &raquo;
              </button>
            </div>
          )}
          {/* Auto-scroll indicator */}
          <span
            className={`text-xs ${autoScrollEnabled && playing ? "text-orange-500" : "text-slate-400"}`}
          >
            {autoScrollEnabled && playing ? "Auto-scroll ON" : ""}
          </span>
        </div>
      </header>

      {/* Score area */}
      {loading && (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-slate-500">Loading score...</div>
        </div>
      )}
      {!loading && !svg && (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-slate-400">
            {ready ? "No score loaded" : "Initializing Verovio..."}
          </div>
        </div>
      )}
      {svg && <ScoreRenderer svg={svg} containerRef={containerRef} />}

      {/* Playback controls */}
      <PlaybackControls
        playing={playing}
        currentTime={currentTime}
        totalDuration={totalDuration}
        currentMeasure={currentMeasure}
        tempo={tempo}
        onPlay={play}
        onPause={pause}
        onStop={stop}
        onSeek={seek}
        onTempoChange={updateTempo}
      />
    </div>
  );
}
