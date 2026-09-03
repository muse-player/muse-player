import { getPianoSampleUrls } from "@muse-player/instruments";
import { useCallback, useEffect, useRef, useState } from "react";

export interface PianoSamplerState {
  error: null | string;
  loading: boolean;
  ready: boolean;
  sampler: any | null;
}

export interface UsePianoSamplerOptions {
  baseUrl?: string;
}

export function usePianoSampler(options?: UsePianoSamplerOptions) {
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
      const urls = getPianoSampleUrls(options?.baseUrl);
      const sampler = new Tone.Sampler({
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
        urls,
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
  }, [options?.baseUrl]);

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
