import { useMemo } from "react";

interface ScoreRendererProperties {
  containerRef: React.RefObject<HTMLDivElement | null>;
  svg: string;
}

export function ScoreRenderer({ containerRef, svg }: ScoreRendererProperties) {
  const responsiveSvg = useMemo(() => makeSvgResponsive(svg), [svg]);

  return (
    <div
      className="flex flex-1 items-center justify-center overflow-hidden bg-white"
      ref={containerRef}
    >
      <div className="relative h-full w-full p-4">
        <div
          className="flex h-full w-full items-center justify-center"
          // eslint-disable-next-line react/dom-no-dangerously-set-innerhtml
          dangerouslySetInnerHTML={{ __html: responsiveSvg }}
        />
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
  result = result.replace(/height="\d+(?:\.\d+)?px?"/, "height=\"100%\"");
  result = result.replace(/(<svg\b)/, (_, tag) => {
    return `${tag} viewBox="0 0 ${String(w)} ${String(h)}" preserveAspectRatio="xMidYMid meet"`;
  });
  return result;
}
