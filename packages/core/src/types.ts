export interface ElementAttributes {
  [xmlId: string]: Record<string, string>;
}

export interface ScoreRenderResult {
  elementAttributes: ElementAttributes;
  midiBase64: string;
  scoreData: { title: string; totalPages: number };
  svgPages: string[];
  timemap: TimeMapEntry[];
}

export interface TimeMapEntry {
  off?: string[];
  on?: string[];
  qstamp: number;
  tempo?: number;
  tstamp: number;
}
