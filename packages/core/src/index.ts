// Components
export { PlaybackControls } from "./components/playback-controls";
export { ScoreRenderer } from "./components/score-renderer";

// Hooks
export { useAutoScroll } from "./hooks/use-auto-scroll";
export { useNoteHighlight } from "./hooks/use-note-highlight";
export { usePianoSampler } from "./hooks/use-piano-sampler";
export type { PianoSamplerState, UsePianoSamplerOptions } from "./hooks/use-piano-sampler";
export { usePlayback } from "./hooks/use-playback";
export type { NoteEvent, PlaybackState } from "./hooks/use-playback";
export { useScore } from "./hooks/use-score";
export type { ScoreData } from "./hooks/use-score";

// Shared types
export type { ElementAttributes, ScoreRenderResult, TimeMapEntry } from "./types";
