import { useCallback, useRef } from "react";

interface PlaybackControlsProperties {
  currentMeasure: number;
  currentTime: number;
  onPause: () => void;
  onPlay: () => void;
  onSeek: (time: number) => void;
  onStop: () => void;
  onTempoChange: (tempo: number) => void;
  playing: boolean;
  tempo: number;
  totalDuration: number;
}

export function PlaybackControls({
  currentMeasure,
  currentTime,
  onPause,
  onPlay,
  onSeek,
  onStop,
  onTempoChange,
  playing,
  tempo,
  totalDuration,
}: PlaybackControlsProperties) {
  const progressReference = useRef<HTMLDivElement>(null);

  const handleProgressClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!progressReference.current || totalDuration <= 0)
        return;
      const rect = progressReference.current.getBoundingClientRect();
      const ratio = (event.clientX - rect.left) / rect.width;
      onSeek(ratio * totalDuration);
    },
    [totalDuration, onSeek],
  );

  const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  return (
    <div className="flex flex-col border-t border-slate-200 bg-white px-4 py-3 shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
      {/* Progress bar */}
      <div
        className="group relative mb-3 h-1.5 w-full cursor-pointer rounded-full bg-slate-200"
        onClick={handleProgressClick}
        ref={progressReference}
      >
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-orange-500 transition-[width] duration-100"
          style={{ width: `${progress}%` }}
        />
        <div
          className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border-2 border-orange-500 bg-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
          style={{ left: `calc(${progress}% - 7px)` }}
        />
      </div>

      {/* Controls row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Play/Pause */}
          <button
            className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-white shadow-md transition hover:bg-orange-600 active:scale-95"
            onClick={playing ? onPause : onPlay}
          >
            {playing
              ? (
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                )
              : (
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
          </button>

          {/* Stop */}
          <button
            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-600 transition hover:bg-slate-100 active:scale-95"
            onClick={onStop}
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h12v12H6z" />
            </svg>
          </button>
        </div>

        {/* Time display */}
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <span className="font-mono">{formatTime(currentTime)}</span>
          <span className="text-slate-400">/</span>
          <span className="font-mono">{formatTime(totalDuration)}</span>
          <span className="ml-2 text-xs text-slate-400">
            M.
            {currentMeasure + 1}
          </span>
        </div>

        {/* Tempo control */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">BPM</span>
          <input
            className="h-1 w-20 accent-orange-500"
            max={240}
            min={40}
            onChange={event => onTempoChange(Number(event.target.value))}
            type="range"
            value={tempo}
          />
          <span className="w-8 text-right text-xs font-mono text-slate-600">
            {tempo}
          </span>
        </div>
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
