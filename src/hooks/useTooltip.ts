import { useRef, useCallback } from 'react';
import type { RefObject } from 'react';

export interface UseTooltipReturn {
  tooltipRef: RefObject<HTMLDivElement | null>;
  showTooltip: (text: string, x: number, y: number) => void;
  hideTooltip: () => void;
}

export function useTooltip(): UseTooltipReturn {
  const tooltipRef = useRef<HTMLDivElement>(null);

  const showTooltip = useCallback((text: string, x: number, y: number) => {
    const el = tooltipRef.current;
    if (!el) return;
    el.textContent = text;
    el.style.left = `${x + 12}px`;
    el.style.top = `${y - 30}px`;
    el.style.display = 'block';
  }, []);

  const hideTooltip = useCallback(() => {
    const el = tooltipRef.current;
    if (el) el.style.display = 'none';
  }, []);

  return { tooltipRef, showTooltip, hideTooltip };
}
