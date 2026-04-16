import { memo, useMemo, useState } from 'react';
import type { Feature } from 'geojson';
import type { D3PathGen } from './featureStyle';
import { isValidCentroid } from './featureStyle';
import { normalizeFleuveName } from '../../data/fleuveAliases';

interface CoucheEauProps {
  features: Feature[];
  pathGen: D3PathGen;
  visible: boolean;
  zoomK?: number;
  onHover: (name: string | null, x: number, y: number) => void;
  onClick?: (name: string) => void;
  selectedName?: string;
}

const SEUIL_LABEL_ZOOM = 2.5;

export default memo(function CoucheFleuves({
  features,
  pathGen,
  visible,
  zoomK = 1,
  onHover,
  onClick,
  selectedName,
}: CoucheEauProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const paths = useMemo(
    () =>
      features.map((f, i) => ({
        d: pathGen(f),
        centroid: pathGen.centroid(f),
        name: typeof f.properties?.name === 'string' ? normalizeFleuveName(f.properties.name) : null,
        id: `${String(f.properties?.ne_id ?? f.properties?.name ?? 'r')}-${i}`,
      })),
    [features, pathGen],
  );

  if (!visible) return null;

  const strokeWidth = 1.4 / zoomK;
  const haloWidth = strokeWidth * 3;
  const hitWidth = 8 / zoomK;
  const showLabels = zoomK >= SEUIL_LABEL_ZOOM;
  const fontSize = 10 / zoomK;
  const hasHover = hoveredId !== null;
  const hasSelection = !!selectedName;

  return (
    <g className="couche-fleuves" clipPath="url(#clip-france)">
      {/* Halo blanc */}
      {paths.map(({ d, name, id }) => {
        if (!d) return null;
        const isSelected = !!name && name === selectedName;
        const isHovered = id === hoveredId;
        const dimmed = (hasSelection && !isSelected && !isHovered) || (!hasSelection && hasHover && !isHovered);
        return (
          <path
            key={`halo-${id}`}
            d={d}
            fill="none"
            stroke="white"
            strokeWidth={isSelected ? haloWidth * 2 : haloWidth}
            strokeOpacity={dimmed ? 0.2 : 0.7}
            strokeLinejoin="round"
            strokeLinecap="round"
            style={{ pointerEvents: 'none' }}
          />
        );
      })}

      {/* Tracé principal */}
      {paths.map(({ d, name, id }) => {
        if (!d) return null;
        const isSelected = !!name && name === selectedName;
        const isHovered = id === hoveredId;
        const dimmed = (hasSelection && !isSelected && !isHovered) || (!hasSelection && hasHover && !isHovered);
        return (
          <path
            key={`river-${id}`}
            d={d}
            fill="none"
            stroke={isSelected ? '#1E3A8A' : isHovered ? '#1E40AF' : '#1D4ED8'}
            strokeWidth={isSelected ? strokeWidth * 3.5 : isHovered ? strokeWidth * 2.2 : strokeWidth}
            strokeOpacity={dimmed ? 0.15 : 0.85}
            strokeLinejoin="round"
            strokeLinecap="round"
            style={{ pointerEvents: 'none', transition: 'stroke-opacity 0.15s, stroke-width 0.15s' }}
          />
        );
      })}

      {/* Zone de hit transparente */}
      {paths.map(({ d, name, id }) =>
        d ? (
          <path
            key={`hit-${id}`}
            d={d}
            fill="none"
            stroke="transparent"
            strokeWidth={hitWidth}
            style={{ cursor: onClick && name ? 'pointer' : 'default' }}
            onClick={onClick && name ? () => onClick(name) : undefined}
            onMouseEnter={(e) => { setHoveredId(id); onHover(name, e.clientX, e.clientY); }}
            onMouseMove={(e) => onHover(name, e.clientX, e.clientY)}
            onMouseLeave={() => { setHoveredId(null); onHover(null, 0, 0); }}
          />
        ) : null,
      )}

      {/* Labels horizontaux au centroïde */}
      {showLabels &&
        paths.map(({ centroid, name, id }) => {
          if (!name || !isValidCentroid(centroid)) return null;
          const [cx, cy] = centroid;
          const isSelected = name === selectedName;
          const isHovered = id === hoveredId;
          return (
            <text
              key={`label-${id}`}
              x={cx}
              y={cy}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={isSelected || isHovered ? fontSize * 1.15 : fontSize}
              fontStyle="italic"
              fontWeight={isSelected || isHovered ? 'bold' : 'normal'}
              fill="#1E3A8A"
              stroke="white"
              strokeWidth={fontSize * 0.35}
              paintOrder="stroke"
              style={{ userSelect: 'none', pointerEvents: 'none' }}
            >
              {name}
            </text>
          );
        })}
    </g>
  );
});
