interface ScoreRendererProperties {
  containerRef: React.RefObject<HTMLDivElement | null>;
  svg: string;
}

export function ScoreRenderer({ containerRef, svg }: ScoreRendererProperties) {
  return (
    <div
      className="flex-1 overflow-y-auto overflow-x-hidden bg-white"
      ref={containerRef}
    >
      <div className="relative w-full flex justify-center py-4">
        <div dangerouslySetInnerHTML={{ __html: svg }} />
      </div>
    </div>
  );
}
