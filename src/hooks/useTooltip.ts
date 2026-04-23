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
    el.style.display = 'block';
    // Lire la taille après display:block pour contraindre au viewport
    const { width, height } = el.getBoundingClientRect();
    const left = Math.min(x + 12, window.innerWidth - width - 8);
    const top = Math.max(y - 30, 8);
    // Évite aussi de dépasser en bas
    const clampedTop = Math.min(top, window.innerHeight - height - 8);
    el.style.left = `${left}px`;
    el.style.top = `${clampedTop}px`;
  }, []);

  const hideTooltip = useCallback(() => {
    const el = tooltipRef.current;
    if (el) el.style.display = 'none';
  }, []);

  return { tooltipRef, showTooltip, hideTooltip };
}
