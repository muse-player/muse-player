import {
  PlaybackControls,
  ScoreRenderer,
  useAutoScroll,
  useNoteHighlight,
  usePianoSampler,
  usePlayback,
  useScore,
} from "@muse-player/core";
import { useCallback, useEffect, useRef, useState } from "react";
import "./app.css";

export default function App() {
  const containerReference = useRef<HTMLDivElement>(null);
  const {
    currentPage,
    getElementAttr,
    getElementsAtTime,
    loading,
    loadResult,
    midiBase64,
    renderPage,
    svg,
    timeMap,
    totalPages,
  } = useScore();

  const [activeNoteIds, setActiveNoteIds] = useState<string[]>([]);

  const handleTimeUpdate = useCallback(
    (time: number) => {
      const result = getElementsAtTime(time * 1000);
      if (result.page > 0) {
        renderPage(result.page);
      }
    },
    [getElementsAtTime, renderPage],
  );

  const handleNotesUpdate = useCallback((noteIds: string[]) => {
    setActiveNoteIds(noteIds);
  }, []);

  const { error: samplerError, loading: samplerLoading, ready: samplerReady, sampler } = usePianoSampler({
    baseUrl: "/piano/",
  });

  const {
    currentMeasure,
    currentTime,
    pause,
    play,
    playing,
    seek,
    stop,
    tempo,
    totalDuration,
    updateTempo,
  } = usePlayback(midiBase64, timeMap, handleTimeUpdate, handleNotesUpdate, samplerReady ? { sampler } : null);

  const { autoScrollEnabled } = useAutoScroll(containerReference, currentMeasure, playing);

  useNoteHighlight(
    containerReference,
    activeNoteIds,
    getElementAttr,
  );

  const [pageInput, setPageInput] = useState("1");

  useEffect(() => {
    loadResult("/djb.rendered.json");
  }, [loadResult]);

  useEffect(() => {
    setPageInput(String(currentPage));
  }, [currentPage]);

  const handlePageSubmit = useCallback(() => {
    const page = Number(pageInput);
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
                className="rounded px-2 py-1 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                disabled={currentPage <= 1}
                onClick={() => renderPage(currentPage - 1)}
              >
                &laquo;
              </button>
              <input
                className="w-8 rounded border border-slate-300 bg-white text-center text-sm"
                onBlur={handlePageSubmit}
                onChange={event => setPageInput(event.target.value)}
                onKeyDown={event => event.key === "Enter" && handlePageSubmit()}
                type="text"
                value={pageInput}
              />
              <span className="text-slate-500">
                /
                {totalPages}
              </span>
              <button
                className="rounded px-2 py-1 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                disabled={currentPage >= totalPages}
                onClick={() => renderPage(currentPage + 1)}
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
      {samplerLoading && (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-slate-500">Loading piano samples...</div>
        </div>
      )}
      {samplerError && (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-red-500">
            Piano load failed:
            {samplerError}
          </div>
        </div>
      )}
      {!loading && !samplerLoading && !svg && (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-slate-400">No score loaded</div>
        </div>
      )}
      {svg && <ScoreRenderer containerRef={containerReference} svg={svg} />}

      {/* Playback controls */}
      <PlaybackControls
        currentMeasure={currentMeasure}
        currentTime={currentTime}
        onPause={pause}
        onPlay={play}
        onSeek={seek}
        onStop={stop}
        onTempoChange={updateTempo}
        playing={playing}
        tempo={tempo}
        totalDuration={totalDuration}
      />
    </div>
  );
}
