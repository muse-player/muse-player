import { useCallback, useEffect, useRef, useState } from "react";
import type { TimeMapEntry, VerovioOptions } from "verovio";
import { VerovioToolkit } from "verovio/esm";
import createVerovioModule from "verovio/wasm";

const VEROVIO_OPTIONS: VerovioOptions = {
  scale: 40,
  pageWidth: 1200,
  adjustPageHeight: true,
  footer: "none",
  header: "none",
  breaks: "encoded" as const,
  font: "Leipzig",
};

export interface ScoreData {
  totalPages: number;
  title: string;
}

export function useVerovio() {
  const vrv = useRef<VerovioToolkit | null>(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [svg, setSvg] = useState("");
  const [scoreData, setScoreData] = useState<ScoreData | null>(null);
  const [timeMap, setTimeMap] = useState<TimeMapEntry[]>([]);
  const [midiBase64, setMidiBase64] = useState("");
  const [totalPages, setTotalPages] = useState(0);
  const renderedPageRef = useRef(1);

  useEffect(() => {
    createVerovioModule().then((moduleInstance) => {
      vrv.current = new VerovioToolkit(moduleInstance);
      vrv.current.setOptions(VEROVIO_OPTIONS);
      setReady(true);
    });
  }, []);

  const loadScore = useCallback(async (url: string) => {
    if (!vrv.current) return;
    setLoading(true);
    try {
      const resp = await fetch(url);
      const buffer = await resp.arrayBuffer();
      const loaded = vrv.current.loadZipDataBuffer(buffer);
      if (!loaded) {
        console.error("Failed to load score");
        setLoading(false);
        return;
      }
      const pages = vrv.current.getPageCount();
      setTotalPages(pages);
      setScoreData({ totalPages: pages, title: url.split("/").pop() || "" });
      setCurrentPage(1);
      renderedPageRef.current = 1;

      const midi = vrv.current.renderToMIDI();
      setMidiBase64(midi);

      const tm = vrv.current.renderToTimemap({ includeMeasures: true });
      setTimeMap(tm);

      const firstPageSvg = vrv.current.renderToSVG(1);
      setSvg(firstPageSvg);
    } catch (e) {
      console.error("Error loading score:", e);
    }
    setLoading(false);
  }, []);

  const renderPage = useCallback((page: number) => {
    if (!vrv.current || page < 1 || page > totalPages || page === renderedPageRef.current) return;
    renderedPageRef.current = page;
    const pageSvg = vrv.current.renderToSVG(page);
    setSvg(pageSvg);
    setCurrentPage(page);
  }, [totalPages]);

  const getElementsAtTime = useCallback((millisec: number) => {
    if (!vrv.current) return { notes: [], page: 0 };
    return vrv.current.getElementsAtTime(millisec);
  }, []);

  const getTimeForElement = useCallback((xmlId: string) => {
    if (!vrv.current) return 0;
    return vrv.current.getTimeForElement(xmlId);
  }, []);

  const getPageWithElement = useCallback((xmlId: string) => {
    if (!vrv.current) return 0;
    return vrv.current.getPageWithElement(xmlId);
  }, []);

  return {
    ready,
    loading,
    svg,
    currentPage,
    totalPages,
    scoreData,
    timeMap,
    midiBase64,
    loadScore,
    renderPage,
    getElementsAtTime,
    getTimeForElement,
    getPageWithElement,
  };
}
