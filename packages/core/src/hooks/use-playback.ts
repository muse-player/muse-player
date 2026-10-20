import { useCallback, useEffect, useRef, useState } from "react";
import type { TimeMapEntry } from "../types";

export interface NoteEvent {
  duration: number;
  midi: number;
  pitch: string;
  time: number;
}

export interface PlaybackState {
  currentMeasure: number;
  currentMeasureId: string;
  currentTime: number;
  playing: boolean;
  tempo: number;
  totalDuration: number;
}

export function usePlayback(
  midiBase64: string,
  timeMap: TimeMapEntry[],
  onTimeUpdate?: (time: number) => void,
  onNotesUpdate?: (noteIds: string[]) => void,
  instrument?: null | { sampler?: any },
) {
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [currentMeasure, setCurrentMeasure] = useState(0);
  const [currentMeasureId, setCurrentMeasureId] = useState("");
  const [tempo, setTempo] = useState(120);
  const [notes, setNotes] = useState<NoteEvent[]>([]);

  const toneReference = useRef<any>(null);
  const synthReference = useRef<any>(null);
  const partReference = useRef<any>(null);
  const loopReference = useRef<any>(null);
  const startedReference = useRef(false);
  const lastNotifiedNotesReference = useRef<string[]>([]);
  const measureIndexReference = useRef(new Map<string, number>());
  const measureStartsReference = useRef<number[]>([]);

  // Parse MIDI when midiBase64 changes
  useEffect(() => {
    if (!midiBase64)
      return;

    (async () => {
      try {
        const { Midi } = await import("@tonejs/midi");
        const binary = atob(midiBase64);
        const bytes = new Uint8Array(binary.length);
        for (let index = 0; index < binary.length; index++) {
          // eslint-disable-next-line unicorn/prefer-code-point -- charCodeAt is correct for binary data (0-255)
          bytes[index] = binary.charCodeAt(index);
        }
        const midi = new Midi(bytes.buffer);

        const allNotes: NoteEvent[] = [];
        for (const track of midi.tracks) {
          for (const note of track.notes) {
            allNotes.push({
              duration: note.duration,
              midi: note.midi,
              pitch: note.name,
              time: note.time,
            });
          }
        }
        allNotes.sort((a, b) => a.time - b.time);
        setNotes(allNotes);
        setTotalDuration(midi.duration);
      }
      catch (error) {
        console.error("[playback] Failed to parse MIDI:", error);
      }
    })();
  }, [midiBase64]);

  // Refs for values needed by Part/Loop callbacks (avoid stale closures)
  const timeMapReference = useRef(timeMap);
  const onTimeUpdateReference = useRef(onTimeUpdate);
  const onNotesUpdateReference = useRef(onNotesUpdate);
  useEffect(() => {
    timeMapReference.current = timeMap;

    // Measure numbers come from `measureOn` entries; the second pass of a
    // repeat maps back to the notated measure (first occurrence).
    const measureIndexById = new Map<string, number>();
    const measureStarts: number[] = [];
    for (const entry of timeMap) {
      if (!entry.measureOn || measureIndexById.has(entry.measureOn)) {
        continue;
      }
      measureIndexById.set(entry.measureOn, measureStarts.length);
      measureStarts.push(entry.tstamp);
    }
    measureIndexReference.current = measureIndexById;
    measureStartsReference.current = measureStarts;
  }, [timeMap]);
  useEffect(() => {
    onTimeUpdateReference.current = onTimeUpdate;
  }, [onTimeUpdate]);
  useEffect(() => {
    onNotesUpdateReference.current = onNotesUpdate;
  }, [onNotesUpdate]);

  const buildPartAndLoop = useCallback(() => {
    const Tone = toneReference.current;
    if (!Tone)
      return;

    // Dispose previous Part if notes changed
    if (partReference.current) {
      partReference.current.dispose();
      partReference.current = null;
    }

    if (notes.length > 0) {
      const part = new Tone.Part((time: number, note: NoteEvent) => {
        synthReference.current?.triggerAttackRelease(
          note.pitch,
          note.duration,
          time,
        );
      }, notes.map(n => [n.time, n] as [number, NoteEvent]));
      part.start(0);
      partReference.current = part;
    }

    // Create tracking loop (only once)
    if (!loopReference.current) {
      const activeNotes = new Set<string>();
      const loop = new Tone.Loop(() => {
        const transport = Tone.getTransport();
        const now = transport.seconds;
        setCurrentTime(now);

        const tm = timeMapReference.current;
        if (tm.length > 0) {
          const ms = now * 1000;
          let measureId = "";
          let measure = 0;
          // Track active notes by processing timeMap entries up to current time
          activeNotes.clear();
          for (const element of tm) {
            if (element.tstamp > ms) {
              break;
            }

            const onIds = element.on ?? [];
            const offIds = element.off ?? [];
            for (const id of onIds) activeNotes.add(id);
            for (const id of offIds) activeNotes.delete(id);
            if (element.measureOn) {
              measureId = element.measureOn;
              measure = measureIndexReference.current.get(element.measureOn) ?? measure;
            }
          }
          setCurrentMeasure(measure);
          setCurrentMeasureId(measureId);

          // Notify whenever the active set changes; keep the last highlight
          // box during rests (empty set) and let stop()/seek() clear it.
          const notesArray = [...activeNotes];
          const previous = lastNotifiedNotesReference.current;
          const hasChanged = notesArray.length !== previous.length || notesArray.some(id => !previous.includes(id));
          if (hasChanged && notesArray.length > 0) {
            lastNotifiedNotesReference.current = notesArray;
            onNotesUpdateReference.current?.(notesArray);
          }
        }

        onTimeUpdateReference.current?.(now);
      }, "16n");
      loop.start(0);
      loopReference.current = loop;
    }
  }, [notes]);

  const initAudio = useCallback(async () => {
    if (startedReference.current)
      return;
    const Tone = await import("tone");
    toneReference.current = Tone;

    await Tone.start();
    Tone.getTransport().bpm.value = tempo;

    if (instrument?.sampler) {
      // Use provided Tone.Sampler with real piano samples
      synthReference.current = instrument.sampler;
    }
    else {
      // Fallback to basic synth if no sampler provided
      const synth = new Tone.PolySynth(Tone.Synth).toDestination();
      synth.volume.value = -8;
      synthReference.current = synth;
    }
    startedReference.current = true;
  }, [tempo, instrument]);

  // Rebuild Part when notes change AND audio is ready
  useEffect(() => {
    if (!startedReference.current || notes.length === 0)
      return;
    buildPartAndLoop();
  }, [notes, buildPartAndLoop]);

  const play = useCallback(async () => {
    await initAudio();
    const Tone = toneReference.current;
    if (!Tone)
      return;

    // Build Part now that audio is ready (handles first-play case)
    buildPartAndLoop();

    Tone.getTransport().start();
    setPlaying(true);
  }, [initAudio, buildPartAndLoop]);

  const pause = useCallback(() => {
    const Tone = toneReference.current;
    if (!Tone)
      return;
    Tone.getTransport().pause();
    setPlaying(false);
  }, []);

  const stop = useCallback(() => {
    const Tone = toneReference.current;
    if (!Tone)
      return;
    Tone.getTransport().stop();
    Tone.getTransport().seconds = 0;
    setPlaying(false);
    setCurrentTime(0);
    setCurrentMeasure(0);
    setCurrentMeasureId("");
    lastNotifiedNotesReference.current = [];
    onNotesUpdateReference.current?.([]);
  }, []);

  const seek = useCallback((timeInSeconds: number) => {
    const Tone = toneReference.current;
    if (!Tone)
      return;
    Tone.getTransport().seconds = timeInSeconds;
    setCurrentTime(timeInSeconds);
    lastNotifiedNotesReference.current = [];
    onNotesUpdateReference.current?.([]);
  }, []);

  const seekToMeasure = useCallback((measureIndex: number) => {
    const time = measureStartsReference.current[measureIndex];
    if (time === undefined)
      return;
    seek(time / 1000);
  }, [seek]);

  const updateTempo = useCallback((newTempo: number) => {
    setTempo(newTempo);
    const Tone = toneReference.current;
    if (Tone) {
      Tone.getTransport().bpm.value = newTempo;
    }
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      partReference.current?.dispose();
      partReference.current = null;
      loopReference.current?.dispose();
      loopReference.current = null;
      synthReference.current?.dispose();
      synthReference.current = null;
      toneReference.current?.getTransport().stop();
    };
  }, []);

  return {
    currentMeasure,
    currentMeasureId,
    currentTime,
    pause,
    play,
    playing,
    seek,
    seekToMeasure,
    stop,
    tempo,
    totalDuration,
    updateTempo,
  };
}
