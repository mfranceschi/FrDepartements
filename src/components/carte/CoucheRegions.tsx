import { memo, useMemo } from 'react';
import type { Feature } from 'geojson';
import type { GeoPath, GeoPermissibleObjects } from 'd3';

interface CoucheRegionsProps {
  features: Feature[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pathGen: GeoPath<any, GeoPermissibleObjects>;
  visible: boolean;
  quizMode?: boolean;
  highlightCode?: string;
  wrongCode?: string;
  onHover: (feature: Feature | null, x: number, y: number) => void;
  onClick?: (code: string) => void;
}

export default memo(function CoucheRegions({
  features,
  pathGen,
  visible,
  quizMode = false,
  highlightCode,
  wrongCode,
  onHover,
  onClick,
}: CoucheRegionsProps) {
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

        return (
          <path
            key={code ?? d}
            d={d}
            fill={isHighlighted ? '#4ade80' : isWrong ? '#fca5a5' : '#e8f4e8'}
            stroke={isWrong ? '#dc2626' : '#6aaa6a'}
            strokeWidth={1}
            style={{ cursor: onClick ? 'pointer' : 'default' }}
            onMouseMove={(e) => { if (!quizMode) onHover(feature, e.clientX, e.clientY); }}
            onMouseLeave={() => onHover(null, 0, 0)}
            onClick={() => { if (onClick && code) onClick(code); }}
          />
        );
      })}
    </g>
  );
});
