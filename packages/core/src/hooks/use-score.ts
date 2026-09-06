import { useCallback, useState } from "react";
import type { ScoreRenderResult } from "../types";

export interface ScoreData {
  title: string;
  totalPages: number;
}

interface ElementsAtTimeResult {
  notes: string[];
  page: number;
}

export function useScore() {
  const [svgPages, setSvgPages] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [scoreData, setScoreData] = useState<null | ScoreData>(null);
  const [midiBase64, setMidiBase64] = useState("");
  const [timeMap, setTimeMap] = useState<ScoreRenderResult["timemap"]>([]);
  const [elementAttributes, setElementAttributes] = useState<ScoreRenderResult["elementAttributes"]>({});
  const [pageForElementMap, setPageForElementMap] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<null | string>(null);

  const loadResult = useCallback(async (url: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }
      const result: ScoreRenderResult = await response.json();

      const pageMap = new Map<string, number>();
      for (const [index, svg] of result.svgPages.entries()) {
        const parser = new DOMParser();
        const document_ = parser.parseFromString(svg, "image/svg+xml");
        for (const element of document_.querySelectorAll("[id]")) {
          pageMap.set(element.id, index + 1);
        }
      }

      setSvgPages(result.svgPages);
      setScoreData(result.scoreData);
      setMidiBase64(result.midiBase64);
      setTimeMap(result.timemap);
      setElementAttributes(result.elementAttributes);
      setPageForElementMap(pageMap);
      setCurrentPage(1);
    }
    catch (error_: unknown) {
      console.error("[useScore] Failed to load result:", error_);
      setError(error_ instanceof Error ? error_.message : "Unknown error");
    }
    setLoading(false);
  }, []);

  const renderPage = useCallback((page: number) => {
    if (page === currentPage || page < 1 || page > svgPages.length) {
      return;
    }
    setCurrentPage(page);
  }, [svgPages, currentPage]);

  const getSvg = useCallback((page: number): string => {
    return svgPages[page - 1] ?? "";
  }, [svgPages]);

  const getElementsAtTime = useCallback((millisec: number): ElementsAtTimeResult => {
    const notes: string[] = [];
    let page = 0;
    for (const entry of timeMap) {
      if (entry.tstamp > millisec)
        break;
      if (entry.on) {
        for (const id of entry.on) notes.push(id);
      }
      if (entry.off) {
        const offSet = new Set(entry.off);
        for (let index = notes.length - 1; index >= 0; index--) {
          if (offSet.has(notes[index]))
            notes.splice(index, 1);
        }
      }
    }

    for (const noteId of notes) {
      const p = pageForElementMap.get(noteId);
      if (p) {
        page = p;
        break;
      }
    }

    return { notes, page };
  }, [timeMap, pageForElementMap]);

  const getElementAttribute = useCallback((xmlId: string): Record<string, string> => {
    return elementAttributes[xmlId] ?? {};
  }, [elementAttributes]);

  const getPageWithElement = useCallback((xmlId: string): number => {
    return pageForElementMap.get(xmlId) ?? 0;
  }, [pageForElementMap]);

  const getTimeForElement = useCallback((xmlId: string): number => {
    for (const entry of timeMap) {
      if (entry.on?.includes(xmlId))
        return entry.tstamp / 1000;
    }
    return 0;
  }, [timeMap]);

  const totalPages = svgPages.length;
  const svg = getSvg(currentPage);

  return {
    currentPage,
    error,
    getElementAttr: getElementAttribute,
    getElementsAtTime,
    getPageWithElement,
    getTimeForElement,
    loading,
    loadResult,
    midiBase64,
    renderPage,
    scoreData,
    svg,
    timeMap,
    totalPages,
  };
}
