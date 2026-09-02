import { useCallback, useEffect, useRef, useState } from "react";

// One sample per octave covers the full piano range via Tone.Sampler pitch-shifting
const PIANO_SAMPLE_NOTES = ["A1", "A2", "A3", "A4", "A5", "A6"];
const PIANO_SAMPLE_BASE_URL = "https://tonejs.github.io/audio/salamander/";

export interface PianoSamplerState {
  loading: boolean;
  ready: boolean;
  reverb: any | null;
  sampler: any | null;
}

export function usePianoSampler() {
  const [state, setState] = useState<PianoSamplerState>({
    loading: false,
    ready: false,
    reverb: null,
    sampler: null,
  });
  const loadedReference = useRef(false);

  const loadSampler = useCallback(async () => {
    if (loadedReference.current)
      return;
    loadedReference.current = true;
    setState(previous => ({ ...previous, loading: true }));

    try {
      const Tone = await import("tone");
      await Tone.start();

      // Build sample map: { "A1": "A1.mp3", "A2": "A2.mp3", ... }
      const urls: Record<string, string> = {};
      for (const note of PIANO_SAMPLE_NOTES) {
        urls[note] = `${note}.mp3`;
      }

      const reverb = new Tone.Reverb({
        decay: 1.5,
        wet: 0.2,
      }).toDestination();

      const sampler = new Tone.Sampler({
        baseUrl: PIANO_SAMPLE_BASE_URL,
        onerror: (error: Error) => {
          console.error("[piano-sampler] Failed to load samples:", error);
          setState(previous => ({ ...previous, loading: false }));
          loadedReference.current = false;
        },
        onload: () => {
          setState({
            loading: false,
            ready: true,
            reverb,
            sampler,
          });
        },
        release: 1,
        urls,
      });

      sampler.connect(reverb);
    }
    catch (error) {
      console.error("[piano-sampler] Failed to initialize:", error);
      setState(previous => ({ ...previous, loading: false }));
      loadedReference.current = false;
    }
  }, []);

  // Auto-load on mount
  useEffect(() => {
    loadSampler();
  }, [loadSampler]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (state.sampler) {
        state.sampler.dispose();
      }
      if (state.reverb) {
        state.reverb.dispose();
      }
    };
  }, [state.sampler, state.reverb]);

  return state;
}
