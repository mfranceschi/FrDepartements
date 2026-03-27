import { memo, useMemo } from 'react';
import * as d3 from 'd3';
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

// Boîte de zoom approximative sur la carte principale (coordonnées SVG estimées)
const ZOOM_BOX = { x: 482, y: 212, w: 68, h: 46 };

interface InsetIleDeFranceProps {
  features: Feature[];
  visible: boolean;
  quizMode?: boolean;
  highlightCode?: string;
  scale?: number;
  onHover: (feature: Feature | null, x: number, y: number) => void;
  onClick?: (code: string) => void;
}

export default memo(function InsetIleDeFrance({
  features,
  visible,
  quizMode = false,
  highlightCode,
  scale = 1,
  onHover,
  onClick,
}: InsetIleDeFranceProps) {
  if (!visible) return null;

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

    const proj = d3
      .geoMercator()
      .fitExtent(
        [[PAD, PAD], [W - PAD, H - PAD - 14]],
        collection as GeoPermissibleObjects,
      );

    const generator = d3.geoPath(proj);

    return {
      gen: generator,
      paths: idfFeatures.map((f) => ({
        feature: f,
        d: generator(f),
        code: f.properties?.code as string | undefined,
      })),
    };
  }, [idfFeatures]);

  if (!gen || paths.length === 0) return null;

  // Bas-gauche de la zoom box → coin haut-droit de l'inset (ligne de connexion)
  const lineX1 = ZOOM_BOX.x;
  const lineY1 = ZOOM_BOX.y + ZOOM_BOX.h;
  const lineX2 = X + W;
  const lineY2 = Y;

  return (
    <>
      {/* Boîte de zoom sur la carte principale */}
      <rect
        x={ZOOM_BOX.x} y={ZOOM_BOX.y}
        width={ZOOM_BOX.w} height={ZOOM_BOX.h}
        fill="none" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="3 2" rx={2}
      />

      {/* Ligne de connexion */}
      <line
        x1={lineX1} y1={lineY1} x2={lineX2} y2={lineY2}
        stroke="#f59e0b" strokeWidth={0.8} strokeDasharray="4 3" opacity={0.7}
      />

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

        <text x={W / 2} y={H - 3} fontSize={14 / scale} fill="#92400e" textAnchor="middle">
          Île-de-France (agrandie)
        </text>
      </g>
    </>
  );
});
