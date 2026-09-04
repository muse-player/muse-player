import type { TimeMapEntry, VerovioOptions } from "verovio";
import { useCallback, useEffect, useRef, useState } from "react";
import { VerovioToolkit } from "verovio/esm";
import createVerovioModule from "verovio/wasm";

const VEROVIO_OPTIONS: VerovioOptions = {
  adjustPageHeight: true,
  breaks: "auto" as const,
  font: "Leipzig",
  footer: "none",
  header: "none",
  pageWidth: 1300,
  scale: 40,
};

export interface ScoreData {
  title: string;
  totalPages: number;
}

export function useVerovio() {
  const vrv = useRef<null | VerovioToolkit>(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [svg, setSvg] = useState("");
  const [scoreData, setScoreData] = useState<null | ScoreData>(null);
  const [timeMap, setTimeMap] = useState<TimeMapEntry[]>([]);
  const [midiBase64, setMidiBase64] = useState("");
  const [totalPages, setTotalPages] = useState(0);
  const renderedPageReference = useRef(1);

  useEffect(() => {
    void (async () => {
      const moduleInstance = await createVerovioModule();
      vrv.current = new VerovioToolkit(moduleInstance);
      vrv.current.setOptions(VEROVIO_OPTIONS);
      setReady(true);
    })();
  }, []);

  const loadScore = useCallback(async (url: string) => {
    if (!vrv.current)
      return;
    setLoading(true);
    try {
      const resp = await fetch(url);
      const buffer = await resp.arrayBuffer();
      vrv.current.setOptions(VEROVIO_OPTIONS);
      const loaded = vrv.current.loadZipDataBuffer(buffer);
      if (!loaded) {
        console.error("Failed to load score");
        setLoading(false);
        return;
      }
      const pages = vrv.current.getPageCount();
      setTotalPages(pages);
      setScoreData({ title: url.split("/").pop() || "", totalPages: pages });
      setCurrentPage(1);
      renderedPageReference.current = 1;

      const midi = vrv.current.renderToMIDI();
      setMidiBase64(midi);

      const tm = vrv.current.renderToTimemap({ includeMeasures: true });
      setTimeMap(tm);

      const firstPageSvg = vrv.current.renderToSVG(1);
      setSvg(firstPageSvg);
    }
    catch (error) {
      console.error("Error loading score:", error);
    }
    setLoading(false);
  }, []);

  const renderPage = useCallback((page: number) => {
    if (!vrv.current || page < 1 || page > totalPages || page === renderedPageReference.current)
      return;
    renderedPageReference.current = page;
    const pageSvg = vrv.current.renderToSVG(page);
    setSvg(pageSvg);
    setCurrentPage(page);
  }, [totalPages]);

  const getElementsAtTime = useCallback((millisec: number) => {
    if (!vrv.current)
      return { notes: [], page: 0 };
    return vrv.current.getElementsAtTime(millisec);
  }, []);

  const getTimeForElement = useCallback((xmlId: string) => {
    if (!vrv.current)
      return 0;
    return vrv.current.getTimeForElement(xmlId);
  }, []);

  const getPageWithElement = useCallback((xmlId: string) => {
    if (!vrv.current)
      return 0;
    return vrv.current.getPageWithElement(xmlId);
  }, []);

  const getElementAttribute = useCallback((xmlId: string): Record<string, string> => {
    if (!vrv.current)
      return {};
    return vrv.current.getElementAttr(xmlId);
  }, []);

  return {
    currentPage,
    getElementAttr: getElementAttribute,
    getElementsAtTime,
    getPageWithElement,
    getTimeForElement,
    loading,
    loadScore,
    midiBase64,
    ready,
    renderPage,
    scoreData,
    svg,
    timeMap,
    totalPages,
  };
}
