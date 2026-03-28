import { useMemo, useState } from 'react';
import { geoMercator, geoPath } from 'd3';
import type { Feature } from 'geojson';
import type { GeoPermissibleObjects } from 'd3';

export interface GroupTerritoryConfig {
  code: string;
  nom: string;
  /** Si fourni, le territoire est rendu agrandi à cette taille (px) centré sur son centroïde */
  targetSizePx?: number;
}

export interface GroupInsetConfig {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  /** [lng_west, lat_south, lng_east, lat_north] */
  geoBounds: [number, number, number, number];
  territories: GroupTerritoryConfig[];
}

interface GroupInsetProps {
  config: GroupInsetConfig;
  deptsByCode: Map<string, Feature>;
  regionsByCode: Map<string, Feature>;
  deptToRegion: Record<string, string>;
  worldFeatures: Feature[];
  showDepts: boolean;
  showRegions: boolean;
  quizMode: boolean;
  highlightDeptCode?: string;
  highlightRegionCode?: string;
  wrongDeptCode?: string;
  wrongRegionCode?: string;
  onHover: (feature: Feature | null, x: number, y: number) => void;
  onClick?: (code: string, type: 'departement' | 'region') => void;
}

function bboxToFeature([w, s, e, n]: [number, number, number, number]): Feature {
  // Sens antihoraire (CCW) requis par GeoJSON pour un anneau extérieur
  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [[[w, s], [w, n], [e, n], [e, s], [w, s]]],
    },
  };
}

export default function GroupInset({
  config,
  deptsByCode,
  regionsByCode,
  deptToRegion,
  worldFeatures,
  showDepts,
  showRegions,
  quizMode,
  highlightDeptCode,
  highlightRegionCode,
  wrongDeptCode,
  wrongRegionCode,
  onHover,
  onClick,
}: GroupInsetProps) {
  const { x, y, width, height, geoBounds, territories } = config;
  const padding = 4;

  const globalProj = useMemo(
    () =>
      geoMercator().fitExtent(
        [[padding, padding], [width - padding, height - padding]],
        bboxToFeature(geoBounds) as GeoPermissibleObjects,
      ),
    [geoBounds, width, height],
  );

  const globalPathGen = useMemo(() => geoPath(globalProj), [globalProj]);

  // Filter world features whose bounding box intersects geoBounds (+ marge de 6°)
  // La marge permet d'inclure des pays dont le bord dépasse légèrement la fenêtre
  // (ex. Guyana dont l'extrémité est est à -56.5° pour une borne ouest à -56°)
  const contextFeatures = useMemo(() => {
    const [w, s, e, n] = geoBounds;
    const M = 6;
    return worldFeatures.filter((f) => {
      if (!f.geometry) return false;
      const geom = f.geometry;
      let firstRing: number[][] = [];
      if (geom.type === 'Polygon') {
        firstRing = geom.coordinates[0];
      } else if (geom.type === 'MultiPolygon') {
        firstRing = geom.coordinates.flatMap((p) => p[0]);
      } else {
        return false;
      }
      let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
      for (const [lng, lat] of firstRing) {
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
      }
      return maxLng >= w - M && minLng <= e + M && maxLat >= s - M && minLat <= n + M;
    });
  }, [worldFeatures, geoBounds]);

  // Compute centroid + paths for each territory
  // Si targetSizePx est fourni : projection locale centrée sur le centroïde (zoom léger)
  // Sinon : projection globale (échelle réelle)
  const territoryData = useMemo(
    () =>
      territories.map((terr) => {
        const deptFeature = deptsByCode.get(terr.code) ?? null;
        const regionCode = deptToRegion[terr.code];
        const regionFeature = regionCode ? (regionsByCode.get(regionCode) ?? null) : null;
        const mainFeature = deptFeature || regionFeature;

        const empty = { ...terr, deptFeature, regionFeature, regionCode,
          centroid: null, deptPath: null, regionPath: null, pathTransform: null, labelY: 0 };

        if (!mainFeature) return empty;

        const centroid = globalPathGen.centroid(mainFeature as GeoPermissibleObjects);
        if (!centroid || isNaN(centroid[0]) || isNaN(centroid[1])) return empty;

        const sz = terr.targetSizePx;
        let deptPath: string | null;
        let regionPath: string | null;
        let pathTransform: string | null;
        let labelY: number;

        if (sz) {
          const localProj = geoMercator().fitExtent(
            [[0, 0], [sz, sz]], mainFeature as GeoPermissibleObjects,
          );
          const localGen = geoPath(localProj);
          deptPath    = deptFeature   ? localGen(deptFeature   as GeoPermissibleObjects) : null;
          regionPath  = regionFeature ? localGen(regionFeature as GeoPermissibleObjects) : null;
          pathTransform = `translate(${centroid[0] - sz / 2}, ${centroid[1] - sz / 2})`;
          labelY = Math.min(centroid[1] + sz / 2 + 9, height - 2);
        } else {
          deptPath    = deptFeature   ? globalPathGen(deptFeature   as GeoPermissibleObjects) : null;
          regionPath  = regionFeature ? globalPathGen(regionFeature as GeoPermissibleObjects) : null;
          pathTransform = null;
          labelY = Math.min(centroid[1] + 12, height - 2);
        }

        return { ...terr, deptFeature, regionFeature, regionCode,
          centroid, deptPath, regionPath, pathTransform, labelY };
      }),
    [territories, deptsByCode, regionsByCode, deptToRegion, globalPathGen, height],
  );

  const [hoverName, setHoverName] = useState<{ name: string; cx: number; cy: number } | null>(null);

  return (
    // Le SVG imbriqué crée un viewport indépendant : overflow="hidden" clip nativement
    // tout débordement (ex. Brésil, Madagascar), sans clipPath ni ID globaux.
    <svg x={x} y={y} width={width} height={height} overflow="hidden">

      {/* Background (océan) */}
      <rect width={width} height={height} fill="#f0f9ff" stroke="#7dd3fc" strokeWidth={0.8} rx={2} />

      {/* Contexte mondial */}
      {contextFeatures.map((f, i) => {
        const d = globalPathGen(f as GeoPermissibleObjects);
        if (!d) return null;
        const countryName = (f.properties?.NAME_FR ?? f.properties?.NAME) as string | undefined;
        return (
          <path
            key={i}
            d={d}
            fill="#e2e8e0"
            stroke="#b8c0b4"
            strokeWidth={0.4}
            onMouseEnter={!quizMode && countryName ? () => {
              const c = globalPathGen.centroid(f as GeoPermissibleObjects);
              if (c && !isNaN(c[0])) setHoverName({ name: countryName, cx: c[0], cy: c[1] });
            } : undefined}
            onMouseLeave={!quizMode && countryName ? () => setHoverName(null) : undefined}
          />
        );
      })}

      {/* Territoires (échelle réelle ou légèrement zoomés si targetSizePx défini) */}
      {territoryData.map((td) => {
        if (!td.centroid) return null;

        const {
          code, nom, centroid,
          deptFeature, regionFeature, regionCode,
          deptPath, regionPath, pathTransform, labelY,
        } = td;

        const deptCode = deptFeature?.properties?.code as string | undefined;
        const regCode  = regionFeature?.properties?.code as string | undefined;
        const isDeptHighlighted   = deptCode !== undefined && deptCode === highlightDeptCode;
        const isRegionHighlighted = regCode  !== undefined && regCode  === highlightRegionCode;
        const isDeptWrong         = deptCode !== undefined && deptCode === wrongDeptCode;
        const isRegionWrong       = regCode  !== undefined && regCode  === wrongRegionCode;

        return (
          <g key={code}>
            <g transform={pathTransform ?? undefined}>
              {showRegions && regionPath && (
                <path
                  d={regionPath}
                  fill={isRegionHighlighted ? '#4ade80' : isRegionWrong ? '#fca5a5' : '#e8f4e8'}
                  stroke={isRegionWrong ? '#dc2626' : '#6aaa6a'}
                  strokeWidth={0.8}
                  style={{ cursor: onClick ? 'pointer' : 'default' }}
                  onMouseMove={(e) => {
                    if (!quizMode && regionFeature) onHover(regionFeature, e.clientX, e.clientY);
                  }}
                  onMouseLeave={() => { onHover(null, 0, 0); }}
                  onClick={() => {
                    if (onClick && regionCode) onClick(regionCode, 'region');
                  }}
                />
              )}
              {showDepts && deptPath && (
                <path
                  d={deptPath}
                  fill={isDeptHighlighted ? '#60a5fa' : isDeptWrong ? '#fca5a5' : '#dbeafe'}
                  stroke={isDeptWrong ? '#dc2626' : '#3b82f6'}
                  strokeWidth={0.5}
                  style={{ cursor: onClick ? 'pointer' : 'default' }}
                  onMouseMove={(e) => {
                    if (!quizMode && deptFeature) onHover(deptFeature, e.clientX, e.clientY);
                  }}
                  onMouseLeave={() => { onHover(null, 0, 0); }}
                  onClick={() => {
                    if (onClick) onClick(code, 'departement');
                  }}
                />
              )}
            </g>

            {!quizMode && (
              <text
                x={centroid[0]}
                y={labelY}
                textAnchor="middle"
                fontSize={11}
                fill="#374151"
                fontWeight="500"
              >
                {nom}
              </text>
            )}
          </g>
        );
      })}

      {/* Tooltip nom au survol */}
      {hoverName && (() => {
        const PAD = 5;
        const TH = 15;
        const TW = Math.min(hoverName.name.length * 6.5 + PAD * 2, width - 4);
        const cx = Math.max(0, Math.min(hoverName.cx, width));
        const cy = Math.max(0, Math.min(hoverName.cy, height));
        const tx = Math.max(2, Math.min(cx - TW / 2, width - TW - 2));
        const ty = cy - TH - 8 < 2 ? cy + 6 : cy - TH - 8;
        return (
          <g style={{ pointerEvents: 'none' }}>
            <rect x={tx} y={ty} width={TW} height={TH} rx={3} fill="rgba(15,23,42,0.85)" />
            <text
              x={tx + TW / 2} y={ty + TH - 3}
              textAnchor="middle"
              fontSize={10}
              fill="#f1f5f9"
              fontWeight="600"
            >
              {hoverName.name}
            </text>
          </g>
        );
      })()}
    </svg>
  );
}
