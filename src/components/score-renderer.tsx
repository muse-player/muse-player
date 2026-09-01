interface ScoreRendererProps {
  svg: string;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function ScoreRenderer({ svg, containerRef }: ScoreRendererProps) {
  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto overflow-x-hidden bg-white"
    >
      <div className="relative w-full flex justify-center py-4">
        <div dangerouslySetInnerHTML={{ __html: svg }} />
      </div>
    </div>
  );
}
