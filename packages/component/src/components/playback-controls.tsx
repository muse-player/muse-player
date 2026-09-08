import * as stylex from "@stylexjs/stylex";
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

const NARROW = "@media (max-width: 639px)";

const styles = stylex.create({
  buttonGroup: {
    alignItems: "center",
    display: "flex",
    gap: 12,
  },
  controlsRow: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: {
      [NARROW]: 8,
    },
    justifyContent: "space-between",
  },
  iconLarge: {
    height: 20,
    width: 20,
  },
  iconSmall: {
    height: 16,
    width: 16,
  },
  measure: {
    color: "#94a3b8",
    fontSize: 12,
    lineHeight: "16px",
    marginLeft: 8,
  },
  mono: {
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  },
  playButton: {
    alignItems: "center",
    backgroundColor: {
      ":active": "#c2410c",
      ":hover": "#ea580c",
      "default": "#f97316",
    },
    borderRadius: 9999,
    borderStyle: "none",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
    color: "white",
    cursor: "pointer",
    display: "flex",
    height: 40,
    justifyContent: "center",
    scale: {
      ":active": "95%",
      "default": "100%",
    },
    transitionProperty: "background-color",
    width: 40,
  },
  progressFill: {
    backgroundColor: "#f97316",
    borderRadius: 9999,
    height: "100%",
    left: 0,
    position: "absolute",
    top: 0,
    transitionDuration: "100ms",
    transitionProperty: "width",
  },
  progressThumb: {
    backgroundColor: "white",
    borderColor: "#f97316",
    borderRadius: 9999,
    borderStyle: "solid",
    borderWidth: 2,
    boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
    height: 14,
    opacity: {
      ":hover": 1,
      "default": 0,
    },
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    transitionProperty: "opacity",
    width: 14,
  },
  progressTrack: {
    backgroundColor: "#e2e8f0",
    borderRadius: 9999,
    cursor: "pointer",
    height: 6,
    marginBottom: 12,
    position: "relative",
    width: "100%",
  },
  root: {
    backgroundColor: "white",
    borderTopColor: "#e2e8f0",
    borderTopStyle: "solid",
    borderTopWidth: 1,
    boxShadow: "0 -2px 8px rgba(0,0,0,0.06)",
    display: "flex",
    flexDirection: "column",
    paddingBottom: 12,
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 12,
  },
  separator: {
    color: "#94a3b8",
  },
  stopButton: {
    alignItems: "center",
    backgroundColor: {
      ":active": "#e2e8f0",
      ":hover": "#f1f5f9",
      "default": "transparent",
    },
    borderColor: "#cbd5e1",
    borderRadius: 9999,
    borderStyle: "solid",
    borderWidth: 1,
    color: "#475569",
    cursor: "pointer",
    display: "flex",
    height: 32,
    justifyContent: "center",
    scale: {
      ":active": "95%",
      "default": "100%",
    },
    transitionProperty: "background-color",
    width: 32,
  },
  tempoGroup: {
    alignItems: "center",
    display: "flex",
    gap: 8,
    width: {
      [NARROW]: "100%",
    },
  },
  tempoLabel: {
    color: "#64748b",
    fontSize: 12,
    lineHeight: "16px",
  },
  tempoSlider: {
    accentColor: "#f97316",
    flex: {
      [NARROW]: 1,
    },
    height: 4,
    width: 80,
  },
  tempoValue: {
    color: "#475569",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    fontSize: 12,
    lineHeight: "16px",
    textAlign: "right",
    width: 32,
  },
  timeDisplay: {
    alignItems: "center",
    color: "#475569",
    display: "flex",
    fontSize: 14,
    gap: 8,
    lineHeight: "20px",
  },
});

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
    <div {...stylex.props(styles.root)}>
      {/* Progress bar */}
      <div
        {...stylex.props(styles.progressTrack)}
        onClick={handleProgressClick}
        ref={progressReference}
      >
        <div
          {...stylex.props(styles.progressFill)}
          style={{ width: `${progress}%` }}
        />
        <div
          {...stylex.props(styles.progressThumb)}
          style={{ left: `calc(${progress}% - 7px)` }}
        />
      </div>

      {/* Controls row */}
      <div {...stylex.props(styles.controlsRow)}>
        <div {...stylex.props(styles.buttonGroup)}>
          {/* Play/Pause */}
          <button
            {...stylex.props(styles.playButton)}
            onClick={playing ? onPause : onPlay}
          >
            {playing
              ? (
                  <svg {...stylex.props(styles.iconLarge)} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                )
              : (
                  <svg {...stylex.props(styles.iconLarge)} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
          </button>

          {/* Stop */}
          <button
            {...stylex.props(styles.stopButton)}
            onClick={onStop}
          >
            <svg {...stylex.props(styles.iconSmall)} fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h12v12H6z" />
            </svg>
          </button>
        </div>

        {/* Time display */}
        <div {...stylex.props(styles.timeDisplay)}>
          <span {...stylex.props(styles.mono)}>{formatTime(currentTime)}</span>
          <span {...stylex.props(styles.separator)}>/</span>
          <span {...stylex.props(styles.mono)}>{formatTime(totalDuration)}</span>
          <span {...stylex.props(styles.measure)}>
            M.
            {currentMeasure + 1}
          </span>
        </div>

        {/* Tempo control */}
        <div {...stylex.props(styles.tempoGroup)}>
          <span {...stylex.props(styles.tempoLabel)}>BPM</span>
          <input
            {...stylex.props(styles.tempoSlider)}
            max={240}
            min={40}
            onChange={event => onTempoChange(Number(event.target.value))}
            type="range"
            value={tempo}
          />
          <span {...stylex.props(styles.tempoValue)}>
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
