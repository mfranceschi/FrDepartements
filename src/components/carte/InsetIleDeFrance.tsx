import { memo, useMemo } from 'react';
import { geoMercator, geoPath } from 'd3';
import type { Feature, FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';
import type { GeoPermissibleObjects } from 'd3';

const IDF_CODES = new Set(['75', '77', '78', '91', '92', '93', '94', '95']);

// Position et taille de l'inset dans le SVG 900x700
// Placé à gauche, au-dessus des DROM (qui commencent à y=430)
const X = 10;
const Y = 150;
const W = 175;
const H = 160;
const PAD = 6;


interface InsetIleDeFranceProps {
  features: Feature[];
  visible: boolean;
  quizMode?: boolean;
  highlightCode?: string;
  onHover: (feature: Feature | null, x: number, y: number) => void;
  onClick?: (code: string) => void;
}

export default memo(function InsetIleDeFrance({
  features,
  visible,
  quizMode = false,
  highlightCode,
  onHover,
  onClick,
}: InsetIleDeFranceProps) {
  const idfFeatures = useMemo(
    () => features.filter((f) => IDF_CODES.has(f.properties?.code as string)),
    [features],
  );

  const { gen, paths } = useMemo(() => {
    if (idfFeatures.length === 0) return { gen: null, paths: [] };

    const collection: FeatureCollection<Geometry, GeoJsonProperties> = {
      type: 'FeatureCollection',
      features: idfFeatures,
    };

    const proj = geoMercator()
      .fitExtent(
        [[PAD, PAD], [W - PAD, H - PAD - 14]],
        collection as GeoPermissibleObjects,
      );

    const generator = geoPath(proj);

    return {
      gen: generator,
      paths: idfFeatures.map((f) => ({
        feature: f,
        d: generator(f),
        code: f.properties?.code as string | undefined,
      })),
    };
  }, [idfFeatures]);

  if (!visible) return null;
  if (!gen || paths.length === 0) return null;

  return (
    <>
      {/* Inset */}
      <g transform={`translate(${X}, ${Y})`}>
        <rect
          x={0} y={0} width={W} height={H}
          fill="white" stroke="#f59e0b" strokeWidth={1.5} rx={3}
        />

        {paths.map(({ feature, d, code }) => {
          if (!d) return null;
          const isHighlighted = code !== undefined && code === highlightCode;

          return (
            <path
              key={code}
              d={d}
              fill={isHighlighted ? '#60a5fa' : '#dbeafe'}
              stroke="#3b82f6"
              strokeWidth={0.8}
              style={{ cursor: onClick ? 'pointer' : 'default' }}
              onMouseMove={(e) => { if (!quizMode) onHover(feature, e.clientX, e.clientY); }}
              onMouseLeave={() => onHover(null, 0, 0)}
              onClick={() => { if (onClick && code) onClick(code); }}
            />
          );
        })}

        <text x={W / 2} y={H - 3} fontSize={11} fill="#92400e" textAnchor="middle">
          Île-de-France (agrandie)
        </text>
      </g>
    </>
  );
});
