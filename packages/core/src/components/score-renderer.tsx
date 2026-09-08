import { useMemo } from "react";

const MIN_SVG_WIDTH = 800;

interface ScoreRendererProperties {
  containerRef: React.RefObject<HTMLDivElement | null>;
  svg: string;
}

export function ScoreRenderer({ containerRef, svg }: ScoreRendererProperties) {
  const responsiveSvg = useMemo(() => makeSvgResponsive(svg), [svg]);

  return (
    <div
      className="flex-1 overflow-y-auto bg-white"
      ref={containerRef}
      style={{ overflowX: "auto" }}
    >
      <div className="relative flex justify-center py-4" style={{ minWidth: MIN_SVG_WIDTH }}>
        <div className="w-full" dangerouslySetInnerHTML={{ __html: responsiveSvg }} />
      </div>
    </div>
  );
}

function makeSvgResponsive(svgString: string): string {
  const widthMatch = svgString.match(/width="(\d+(?:\.\d+)?)px?"/);
  const heightMatch = svgString.match(/height="(\d+(?:\.\d+)?)px?"/);
  if (!widthMatch || !heightMatch) {
    return svgString;
  }
  const w = Number(widthMatch[1]);
  const h = Number(heightMatch[1]);
  if (w <= 0 || h <= 0) {
    return svgString;
  }

  let result = svgString;
  result = result.replace(/width="\d+(?:\.\d+)?px?"/, "width=\"100%\"");
  result = result.replace(/height="\d+(?:\.\d+)?px?"/, "height=\"auto\"");
  result = result.replace(/(<svg\b)/, (_, tag) => {
    return `${tag} viewBox="0 0 ${String(w)} ${String(h)}" preserveAspectRatio="xMinYMin meet"`;
  });
  return result;
}
