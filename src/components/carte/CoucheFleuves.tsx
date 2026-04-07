import { memo, useMemo } from 'react';
import type { Feature } from 'geojson';
import type { D3PathGen } from './featureStyle';

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
      features.map((f) => ({
        d: pathGen(f),
        name: typeof f.properties?.name === 'string' ? f.properties.name : null,
        id: f.properties?.ne_id ?? f.properties?.name ?? Math.random(),
      })),
    [features, pathGen],
  );

  if (!visible) return null;

  const strokeWidth = 1.2 / zoomK;
  const showLabels = zoomK >= SEUIL_LABEL_ZOOM;
  const fontSize = 11 / zoomK;

  return (
    <g className="couche-fleuves" style={{ pointerEvents: 'none' }}>
      {paths.map(({ d, name, id }) => {
        if (!d) return null;
        return (
          <g key={String(id)}>
            <path
              d={d}
              fill="none"
              stroke="#3B82F6"
              strokeWidth={strokeWidth}
              strokeOpacity={0.75}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {showLabels && name && (
              <text style={{ userSelect: 'none' }}>
                <textPath
                  href={`#river-path-${String(id)}`}
                  startOffset="50%"
                  textAnchor="middle"
                  fontSize={fontSize}
                  fill="#1D4ED8"
                  stroke="white"
                  strokeWidth={fontSize * 0.3}
                  paintOrder="stroke"
                >
                  {name}
                </textPath>
              </text>
            )}
          </g>
        );
      })}

      {/* Chemins nommés pour textPath — invisibles, juste pour l'accroche des labels */}
      {showLabels && (
        <defs>
          {paths.map(({ d, name, id }) =>
            d && name ? (
              <path key={`def-${String(id)}`} id={`river-path-${String(id)}`} d={d} />
            ) : null,
          )}
        </defs>
      )}
    </g>
  );
});
