import { useCallback, useEffect, useRef, useState } from "react";

// tonejs-instruments piano sample map (A1-B7, every note)
// Source: https://github.com/nbrosowsky/tonejs-instruments
const PIANO_SAMPLES: Record<string, string> = {
  "A1": "A1.mp3",
  "A2": "A2.mp3",
  "A3": "A3.mp3",
  "A4": "A4.mp3",
  "A5": "A5.mp3",
  "A6": "A6.mp3",
  "A7": "A7.mp3",
  "A#1": "As1.mp3",
  "A#2": "As2.mp3",
  "A#3": "As3.mp3",
  "A#4": "As4.mp3",
  "A#5": "As5.mp3",
  "A#6": "As6.mp3",
  "A#7": "As7.mp3",
  "B1": "B1.mp3",
  "B2": "B2.mp3",
  "B3": "B3.mp3",
  "B4": "B4.mp3",
  "B5": "B5.mp3",
  "B6": "B6.mp3",
  "B7": "B7.mp3",
  "C1": "C1.mp3",
  "C2": "C2.mp3",
  "C3": "C3.mp3",
  "C4": "C4.mp3",
  "C5": "C5.mp3",
  "C6": "C6.mp3",
  "C7": "C7.mp3",
  "C#1": "Cs1.mp3",
  "C#2": "Cs2.mp3",
  "C#3": "Cs3.mp3",
  "C#4": "Cs4.mp3",
  "C#5": "Cs5.mp3",
  "C#6": "Cs6.mp3",
  "C#7": "Cs7.mp3",
  "D1": "D1.mp3",
  "D2": "D2.mp3",
  "D3": "D3.mp3",
  "D4": "D4.mp3",
  "D5": "D5.mp3",
  "D6": "D6.mp3",
  "D7": "D7.mp3",
  "D#1": "Ds1.mp3",
  "D#2": "Ds2.mp3",
  "D#3": "Ds3.mp3",
  "D#4": "Ds4.mp3",
  "D#5": "Ds5.mp3",
  "D#6": "Ds6.mp3",
  "D#7": "Ds7.mp3",
  "E1": "E1.mp3",
  "E2": "E2.mp3",
  "E3": "E3.mp3",
  "E4": "E4.mp3",
  "E5": "E5.mp3",
  "E6": "E6.mp3",
  "E7": "E7.mp3",
  "F1": "F1.mp3",
  "F2": "F2.mp3",
  "F3": "F3.mp3",
  "F4": "F4.mp3",
  "F5": "F5.mp3",
  "F6": "F6.mp3",
  "F7": "F7.mp3",
  "F#1": "Fs1.mp3",
  "F#2": "Fs2.mp3",
  "F#3": "Fs3.mp3",
  "F#4": "Fs4.mp3",
  "F#5": "Fs5.mp3",
  "F#6": "Fs6.mp3",
  "F#7": "Fs7.mp3",
  "G1": "G1.mp3",
  "G2": "G2.mp3",
  "G3": "G3.mp3",
  "G4": "G4.mp3",
  "G5": "G5.mp3",
  "G6": "G6.mp3",
  "G7": "G7.mp3",
  "G#1": "Gs1.mp3",
  "G#2": "Gs2.mp3",
  "G#3": "Gs3.mp3",
  "G#4": "Gs4.mp3",
  "G#5": "Gs5.mp3",
  "G#6": "Gs6.mp3",
  "G#7": "Gs7.mp3",
};

const PIANO_BASE_URL = "https://nbrosowsky.github.io/tonejs-instruments/samples/piano/";

export interface PianoSamplerState {
  error: null | string;
  loading: boolean;
  ready: boolean;
  sampler: any | null;
}

export function usePianoSampler() {
  const [state, setState] = useState<PianoSamplerState>({
    error: null,
    loading: false,
    ready: false,
    sampler: null,
  });
  const loadedReference = useRef(false);
  const samplerReference = useRef<any>(null);
  const compressorReference = useRef<any>(null);
  const reverbReference = useRef<any>(null);

  const loadSampler = useCallback(async () => {
    if (loadedReference.current)
      return;
    loadedReference.current = true;
    setState(previous => ({ ...previous, loading: true }));

    try {
      const Tone = await import("tone");
      await Tone.start();

      // Create effects chain: Compressor → Reverb → Destination
      const compressor = new Tone.Compressor({
        attack: 0.003,
        knee: 30,
        ratio: 4,
        release: 0.15,
        threshold: -24,
      });
      compressorReference.current = compressor;

      const reverb = new Tone.Reverb({
        decay: 2,
        preDelay: 0.01,
        wet: 0.15,
      });
      reverbReference.current = reverb;
      await reverb.generate();

      compressor.connect(reverb);
      reverb.toDestination();

      // Create Tone.Sampler with tonejs-instruments piano samples
      const sampler = new Tone.Sampler({
        baseUrl: PIANO_BASE_URL,
        onload: () => {
          samplerReference.current = sampler;
          setState({
            error: null,
            loading: false,
            ready: true,
            sampler,
          });
        },
        release: 1.2,
        urls: PIANO_SAMPLES,
      });
      sampler.connect(compressor);
    }
    catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("[piano-sampler] Failed to initialize:", message);
      setState({
        error: message,
        loading: false,
        ready: false,
        sampler: null,
      });
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
      if (samplerReference.current) {
        samplerReference.current.dispose();
        samplerReference.current = null;
      }
      if (compressorReference.current) {
        compressorReference.current.dispose();
        compressorReference.current = null;
      }
      if (reverbReference.current) {
        reverbReference.current.dispose();
        reverbReference.current = null;
      }
    };
  }, []);

  return state;
}
