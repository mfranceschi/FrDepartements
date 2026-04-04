import { memo, useMemo, useState } from 'react';
import type { Feature } from 'geojson';
import type { GeoPath, GeoPermissibleObjects } from 'd3';

interface CoucheRegionsProps {
  features: Feature[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pathGen: GeoPath<any, GeoPermissibleObjects>;
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
    () => features.map((f) => ({ feature: f, d: pathGen(f), code: f.properties?.code as string | undefined })),
    [features, pathGen],
  );

  if (!visible) return null;

  return (
    <g className="couche-regions">
      {paths.map(({ feature, d, code }) => {
        if (!d) return null;
        const isHighlighted = code !== undefined && code === highlightCode;
        const isWrong = code !== undefined && code === wrongCode;

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

        const isHovered = code !== undefined && code === hoveredCode;
        const quizHighlightColor = highlightVariant === 'target' ? '#fbbf24' : '#4ade80';
        const fill = isHighlighted
          ? (quizMode ? quizHighlightColor : 'white')
          : isWrong ? '#fca5a5'
          : (!quizMode && isHovered) ? 'white'
          : '#e8f4e8';

        return (
          <path
            key={code ?? d}
            d={d}
            fill={fill}
            stroke={isWrong ? '#dc2626' : '#6aaa6a'}
            strokeWidth={1}
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
