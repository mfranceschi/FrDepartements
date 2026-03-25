import type { Feature } from 'geojson';
import type * as d3 from 'd3';

interface CoucheDepsProps {
  features: Feature[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pathGen: d3.GeoPath<any, d3.GeoPermissibleObjects>;
  visible: boolean;
  quizMode?: boolean;
  highlightCode?: string;
  onHover: (feature: Feature | null, x: number, y: number) => void;
  onClick?: (code: string) => void;
}

export default function CoucheDepts({
  features,
  pathGen,
  visible,
  quizMode = false,
  highlightCode,
  onHover,
  onClick,
}: CoucheDepsProps) {
  if (!visible) return null;

  return (
    <g className="couche-depts">
      {features.map((feature) => {
        const code = feature.properties?.code as string | undefined;
        const isHighlighted = code !== undefined && code === highlightCode;
        const d = pathGen(feature);
        if (!d) return null;

        return (
          <path
            key={code ?? Math.random()}
            d={d}
            fill={isHighlighted ? '#60a5fa' : '#dbeafe'}
            stroke="#3b82f6"
            strokeWidth={0.5}
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
