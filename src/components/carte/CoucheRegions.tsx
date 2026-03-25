import type { Feature } from 'geojson';
import type * as d3 from 'd3';

interface CoucheRegionsProps {
  features: Feature[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pathGen: d3.GeoPath<any, d3.GeoPermissibleObjects>;
  visible: boolean;
  quizMode?: boolean;
  highlightCode?: string;
  onHover: (feature: Feature | null, x: number, y: number) => void;
  onClick?: (code: string) => void;
}

export default function CoucheRegions({
  features,
  pathGen,
  visible,
  quizMode = false,
  highlightCode,
  onHover,
  onClick,
}: CoucheRegionsProps) {
  if (!visible) return null;

  return (
    <g className="couche-regions">
      {features.map((feature) => {
        const code = feature.properties?.code as string | undefined;
        const isHighlighted = code !== undefined && code === highlightCode;
        const d = pathGen(feature);
        if (!d) return null;

        return (
          <path
            key={code ?? Math.random()}
            d={d}
            fill={isHighlighted ? '#4ade80' : '#e8f4e8'}
            stroke="#6aaa6a"
            strokeWidth={1}
            style={{ cursor: onClick ? 'pointer' : 'default' }}
            onMouseMove={(e) => {
              if (!quizMode) onHover(feature, e.clientX, e.clientY);
            }}
            onMouseLeave={() => onHover(null, 0, 0)}
            onClick={() => {
              if (onClick && code) onClick(code);
            }}
          />
        );
      })}
    </g>
  );
}
