import { memo, useMemo, useState } from 'react';
import type { Feature } from 'geojson';
import { type D3PathGen, resolveStroke, STROKE_WIDTH_ACTIVE } from './featureStyle';

interface CoucheRegionsProps {
  features: Feature[];
  pathGen: D3PathGen;
  visible: boolean;
  /** Quand true : affiche uniquement les contours (fill transparent), sans interaction */
  borderOnly?: boolean;
  quizMode?: boolean;
  highlightCode?: string;
  highlightVariant?: 'correct' | 'target';
  wrongCode?: string;
  onHover: (feature: Feature | null, x: number, y: number) => void;
  onClick?: (code: string) => void;
}

const BASE_STROKE = '#6aaa6a';

export default memo(function CoucheRegions({
  features,
  pathGen,
  visible,
  borderOnly = false,
  quizMode = false,
  highlightCode,
  highlightVariant = 'correct',
  wrongCode,
  onHover,
  onClick,
}: CoucheRegionsProps) {
  const [hoveredCode, setHoveredCode] = useState<string | null>(null);

  // Calcul des paths une seule fois (ou quand features/pathGen changent)
  const paths = useMemo(
    () => features.map((f) => {
      const rawCode = f.properties?.code;
      return { feature: f, d: pathGen(f), code: typeof rawCode === 'string' ? rawCode : undefined };
    }),
    [features, pathGen],
  );

  if (!visible) return null;

  return (
    <g className="couche-regions">
      {paths.map(({ feature, d, code }) => {
        if (!d) return null;

        if (borderOnly) {
          return (
            <path
              key={code ?? d}
              d={d}
              fill="none"
              stroke="#475569"
              strokeWidth={1.5}
              style={{ pointerEvents: 'none' }}
            />
          );
        }

        const isHighlighted = code !== undefined && code === highlightCode;
        const isWrong = code !== undefined && code === wrongCode;
        const isHovered = code !== undefined && code === hoveredCode;
        const isQuizHighlighted = quizMode && isHighlighted;

        const fill = isHighlighted
          ? 'white'
          : isWrong ? 'white'
          : (!quizMode && isHovered) ? 'white'
          : '#e8f4e8';
        const stroke = resolveStroke(isQuizHighlighted, isWrong, highlightVariant, BASE_STROKE);
        const strokeWidth = (isQuizHighlighted || isWrong) ? STROKE_WIDTH_ACTIVE : 1;

        return (
          <path
            key={code ?? d}
            d={d}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            style={{ cursor: onClick ? 'pointer' : 'default' }}
            onMouseEnter={(e) => {
              setHoveredCode(code ?? null);
              if (!quizMode) onHover(feature, e.clientX, e.clientY);
            }}
            onMouseMove={(e) => { if (!quizMode) onHover(feature, e.clientX, e.clientY); }}
            onMouseLeave={() => { setHoveredCode(null); onHover(null, 0, 0); }}
            onClick={() => { if (onClick && code) onClick(code); }}
          />
        );
      })}
    </g>
  );
});
