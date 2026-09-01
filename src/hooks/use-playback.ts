import { useCallback, useEffect, useRef, useState } from "react";

interface TimeMapEntry {
  tstamp: number;
  qstamp: number;
  on?: string[];
  off?: string[];
  tempo?: number;
}

export interface NoteEvent {
  time: number;
  duration: number;
  pitch: string;
  midi: number;
}

export interface PlaybackState {
  playing: boolean;
  currentTime: number;
  totalDuration: number;
  currentMeasure: number;
  tempo: number;
}

export function usePlayback(
  midiBase64: string,
  timeMap: TimeMapEntry[],
  onTimeUpdate?: (time: number) => void,
  onNotesUpdate?: (noteIds: string[]) => void,
) {
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [currentMeasure, setCurrentMeasure] = useState(0);
  const [tempo, setTempo] = useState(120);
  const [notes, setNotes] = useState<NoteEvent[]>([]);

  const toneRef = useRef<any>(null);
  const synthRef = useRef<any>(null);
  const partRef = useRef<any>(null);
  const loopRef = useRef<any>(null);
  const startedRef = useRef(false);

  // Parse MIDI when midiBase64 changes
  useEffect(() => {
    if (!midiBase64) return;

    (async () => {
      try {
        const { Midi } = await import("@tonejs/midi");
        const binary = atob(midiBase64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const midi = new Midi(bytes.buffer);

        const allNotes: NoteEvent[] = [];
        for (const track of midi.tracks) {
          for (const note of track.notes) {
            allNotes.push({
              time: note.time,
              duration: note.duration,
              pitch: note.name,
              midi: note.midi,
            });
          }
        }
        allNotes.sort((a, b) => a.time - b.time);
        setNotes(allNotes);
        setTotalDuration(midi.duration);
      } catch (e) {
        console.error("[playback] Failed to parse MIDI:", e);
      }
    })();
  }, [midiBase64]);

  // Refs for values needed by Part/Loop callbacks (avoid stale closures)
  const timeMapRef = useRef(timeMap);
  const onTimeUpdateRef = useRef(onTimeUpdate);
  const onNotesUpdateRef = useRef(onNotesUpdate);
  useEffect(() => { timeMapRef.current = timeMap; }, [timeMap]);
  useEffect(() => { onTimeUpdateRef.current = onTimeUpdate; }, [onTimeUpdate]);
  useEffect(() => { onNotesUpdateRef.current = onNotesUpdate; }, [onNotesUpdate]);

  const buildPartAndLoop = useCallback(() => {
    const Tone = toneRef.current;
    if (!Tone) return;

    // Dispose previous Part if notes changed
    if (partRef.current) {
      partRef.current.dispose();
      partRef.current = null;
    }

    if (notes.length > 0) {
      const part = new Tone.Part((time: number, note: NoteEvent) => {
        synthRef.current?.triggerAttackRelease(
          note.pitch,
          note.duration,
          time,
        );
      }, notes.map((n) => [n.time, n] as [number, NoteEvent]));
      part.start(0);
      partRef.current = part;
    }

    // Create tracking loop (only once)
    if (!loopRef.current) {
      const activeNotes = new Set<string>();
      const loop = new Tone.Loop(() => {
        const transport = Tone.getTransport();
        const now = transport.seconds;
        setCurrentTime(now);

        const tm = timeMapRef.current;
        if (tm.length > 0) {
          const ms = now * 1000;
          let measure = 0;
          // Track active notes by processing timeMap entries up to current time
          activeNotes.clear();
          for (let i = 0; i < tm.length; i++) {
            if (tm[i].tstamp <= ms) {
              for (const id of (tm[i].on ?? [])) activeNotes.add(id);
              for (const id of (tm[i].off ?? [])) activeNotes.delete(id);
              if (tm[i].on && tm[i].on!.length > 0) {
                measure = i;
              }
            } else {
              break;
            }
          }
          setCurrentMeasure(measure);
          onNotesUpdateRef.current?.([...activeNotes]);
        }

        onTimeUpdateRef.current?.(now);
      }, "16n");
      loop.start(0);
      loopRef.current = loop;
    }
  }, [notes]);

  const initAudio = useCallback(async () => {
    if (startedRef.current) return;
    const Tone = await import("tone");
    toneRef.current = Tone;

    await Tone.start();
    Tone.getTransport().bpm.value = tempo;

    const synth = new Tone.PolySynth(Tone.Synth).toDestination();
    synth.volume.value = -8;
    synthRef.current = synth;
    startedRef.current = true;
  }, [tempo]);

  // Rebuild Part when notes change AND audio is ready
  useEffect(() => {
    if (!startedRef.current || notes.length === 0) return;
    buildPartAndLoop();
  }, [notes, buildPartAndLoop]);

  const play = useCallback(async () => {
    await initAudio();
    const Tone = toneRef.current;
    if (!Tone) return;

    // Build Part now that audio is ready (handles first-play case)
    buildPartAndLoop();

    Tone.getTransport().start();
    setPlaying(true);
  }, [initAudio, buildPartAndLoop]);

  const pause = useCallback(() => {
    const Tone = toneRef.current;
    if (!Tone) return;
    Tone.getTransport().pause();
    setPlaying(false);
  }, []);

  const stop = useCallback(() => {
    const Tone = toneRef.current;
    if (!Tone) return;
    Tone.getTransport().stop();
    Tone.getTransport().seconds = 0;
    setPlaying(false);
    setCurrentTime(0);
    setCurrentMeasure(0);
  }, []);

  const seek = useCallback((timeInSeconds: number) => {
    const Tone = toneRef.current;
    if (!Tone) return;
    Tone.getTransport().seconds = timeInSeconds;
    setCurrentTime(timeInSeconds);
  }, []);

  const seekToMeasure = useCallback((measureIndex: number) => {
    if (timeMap[measureIndex]) {
      const time = timeMap[measureIndex].tstamp / 1000;
      seek(time);
    }
  }, [timeMap, seek]);

  const updateTempo = useCallback((newTempo: number) => {
    setTempo(newTempo);
    const Tone = toneRef.current;
    if (Tone) {
      Tone.getTransport().bpm.value = newTempo;
    }
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      partRef.current?.dispose();
      loopRef.current?.dispose();
      synthRef.current?.dispose();
      toneRef.current?.getTransport().stop();
    };
  }, []);

  return {
    playing,
    currentTime,
    totalDuration,
    currentMeasure,
    tempo,
    play,
    pause,
    stop,
    seek,
    seekToMeasure,
    updateTempo,
  };
}
