import React, { useEffect, useId, useRef } from 'react';
import mermaid from 'mermaid';

let initialized = false;

interface MermaidProps {
  chart: string;
  className?: string;
}

const Mermaid: React.FC<MermaidProps> = ({ chart, className }) => {
  const id = useId().replace(/[:]/g, '');
  const renderId = `mermaid-${id}`;
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!initialized) {
      try {
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'loose',
          theme: 'base',
          flowchart: {
            htmlLabels: true,
            curve: 'basis',
            nodeSpacing: 40,
            rankSpacing: 60,
            padding: 8,
            useMaxWidth: true,
            wrap: true,
          },
          fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system',
        } as any);
        initialized = true;
      } catch (e) {
        // no-op
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const render = async () => {
      if (!containerRef.current) return;
      try {
        const { svg } = await (mermaid as any).render(renderId, chart);
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      } catch (e) {
        if (containerRef.current) {
          containerRef.current.innerHTML = `<pre class="text-xs p-2">${String(e)}</pre>`;
        }
      }
    };
    render();
    return () => {
      cancelled = true;
    };
  }, [chart, renderId]);

  return <div ref={containerRef} className={className ?? 'w-full h-full overflow-auto'} aria-label="Mermaid diagram" />;
};

export default Mermaid;
