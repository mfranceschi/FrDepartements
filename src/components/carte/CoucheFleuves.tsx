import { memo, useMemo } from 'react';
import type { Feature } from 'geojson';
import type { D3PathGen } from './featureStyle';
import { isValidCentroid } from './featureStyle';

interface CoucheEauProps {
  features: Feature[];
  pathGen: D3PathGen;
  visible: boolean;
  zoomK?: number;
}

// Seuil de zoom au-delà duquel les labels apparaissent
const SEUIL_LABEL_ZOOM = 2.5;

export default memo(function CoucheFleuves({
  features,
  pathGen,
  visible,
  zoomK = 1,
}: CoucheEauProps) {
  const paths = useMemo(
    () =>
      features.map((f, i) => ({
        d: pathGen(f),
        centroid: pathGen.centroid(f),
        name: typeof f.properties?.name === 'string' ? f.properties.name : null,
        id: String(f.properties?.ne_id ?? f.properties?.name ?? `idx-${i}`),
      })),
    [features, pathGen],
  );

  if (!visible) return null;

  const strokeWidth = 1.4 / zoomK;
  const haloWidth = strokeWidth * 3;
  const showLabels = zoomK >= SEUIL_LABEL_ZOOM;
  const fontSize = 10 / zoomK;

  return (
    <g className="couche-fleuves" style={{ pointerEvents: 'none' }}>
      {/* Halo blanc pour détacher les rivières de toutes les couleurs de fond */}
      {paths.map(({ d, id }) =>
        d ? (
          <path
            key={`halo-${id}`}
            d={d}
            fill="none"
            stroke="white"
            strokeWidth={haloWidth}
            strokeOpacity={0.7}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ) : null,
      )}

      {/* Tracé principal */}
      {paths.map(({ d, id }) =>
        d ? (
          <path
            key={`river-${id}`}
            d={d}
            fill="none"
            stroke="#1D4ED8"
            strokeWidth={strokeWidth}
            strokeOpacity={0.85}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ) : null,
      )}

      {/* Labels horizontaux au centroïde — évite les textes retournés du textPath */}
      {showLabels &&
        paths.map(({ centroid, name, id }) => {
          if (!name || !isValidCentroid(centroid)) return null;
          const [cx, cy] = centroid;
          return (
            <text
              key={`label-${id}`}
              x={cx}
              y={cy}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={fontSize}
              fontStyle="italic"
              fill="#1E3A8A"
              stroke="white"
              strokeWidth={fontSize * 0.35}
              paintOrder="stroke"
              style={{ userSelect: 'none' }}
            >
              {name}
            </text>
          );
        })}
    </g>
  );
});
