import { useMemo } from 'react';
import { geoMercator, geoPath } from 'd3';
import type { Feature } from 'geojson';
import type { GeoPermissibleObjects } from 'd3';

export interface GroupTerritoryConfig {
  code: string;
  nom: string;
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
  const { id, x, y, width, height, geoBounds, territories } = config;
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

  // Filter world features whose bounding box intersects geoBounds
  const contextFeatures = useMemo(() => {
    const [w, s, e, n] = geoBounds;
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
      return maxLng >= w && minLng <= e && maxLat >= s && minLat <= n;
    });
  }, [worldFeatures, geoBounds]);

  // Compute centroid + paths for each territory using the global projection
  const territoryData = useMemo(
    () =>
      territories.map((terr) => {
        const deptFeature = deptsByCode.get(terr.code) ?? null;
        const regionCode = deptToRegion[terr.code];
        const regionFeature = regionCode ? (regionsByCode.get(regionCode) ?? null) : null;
        const mainFeature = deptFeature || regionFeature;

        if (!mainFeature) {
          return { ...terr, deptFeature, regionFeature, regionCode, centroid: null,
            deptGlobalPath: null, regionGlobalPath: null };
        }

        const centroid = globalPathGen.centroid(mainFeature as GeoPermissibleObjects);
        if (!centroid || isNaN(centroid[0]) || isNaN(centroid[1])) {
          return { ...terr, deptFeature, regionFeature, regionCode, centroid: null,
            deptGlobalPath: null, regionGlobalPath: null };
        }

        return {
          ...terr,
          deptFeature,
          regionFeature,
          regionCode,
          centroid,
          deptGlobalPath: deptFeature
            ? globalPathGen(deptFeature as GeoPermissibleObjects)
            : null,
          regionGlobalPath: regionFeature
            ? globalPathGen(regionFeature as GeoPermissibleObjects)
            : null,
        };
      }),
    [territories, deptsByCode, regionsByCode, deptToRegion, globalPathGen],
  );

  const clipId = `clip-group-${id}`;

  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        <clipPath id={clipId}>
          <rect width={width} height={height} />
        </clipPath>
      </defs>

      {/* Background (océan) */}
      <rect width={width} height={height} fill="#f0f9ff" stroke="#7dd3fc" strokeWidth={0.8} rx={2} />

      {/* Contexte mondial — non interactif */}
      <g clipPath={`url(#${clipId})`} style={{ pointerEvents: 'none' }}>
        {contextFeatures.map((f, i) => {
          const d = globalPathGen(f as GeoPermissibleObjects);
          if (!d) return null;
          return (
            <path key={i} d={d} fill="#e2e8e0" stroke="#b8c0b4" strokeWidth={0.4} />
          );
        })}
      </g>

      {/* Territoires à l'échelle réelle (projection globale) */}
      {territoryData.map((td) => {
        if (!td.centroid) return null;

        const {
          code, nom, centroid,
          deptFeature, regionFeature, regionCode,
          deptGlobalPath, regionGlobalPath,
        } = td;

        const deptCode = deptFeature?.properties?.code as string | undefined;
        const regCode  = regionFeature?.properties?.code as string | undefined;
        const isDeptHighlighted   = deptCode !== undefined && deptCode === highlightDeptCode;
        const isRegionHighlighted = regCode  !== undefined && regCode  === highlightRegionCode;
        const isDeptWrong         = deptCode !== undefined && deptCode === wrongDeptCode;
        const isRegionWrong       = regCode  !== undefined && regCode  === wrongRegionCode;

        return (
          <g key={code}>
            <g clipPath={`url(#${clipId})`}>
              {showRegions && regionGlobalPath && (
                <path
                  d={regionGlobalPath}
                  fill={isRegionHighlighted ? '#4ade80' : isRegionWrong ? '#fca5a5' : '#e8f4e8'}
                  stroke={isRegionWrong ? '#dc2626' : '#6aaa6a'}
                  strokeWidth={0.8}
                  style={{ cursor: onClick ? 'pointer' : 'default' }}
                  onMouseMove={(e) => {
                    if (!quizMode && regionFeature) onHover(regionFeature, e.clientX, e.clientY);
                  }}
                  onMouseLeave={() => onHover(null, 0, 0)}
                  onClick={() => {
                    if (onClick && regionCode) onClick(regionCode, 'region');
                  }}
                />
              )}
              {showDepts && deptGlobalPath && (
                <path
                  d={deptGlobalPath}
                  fill={isDeptHighlighted ? '#60a5fa' : isDeptWrong ? '#fca5a5' : '#dbeafe'}
                  stroke={isDeptWrong ? '#dc2626' : '#3b82f6'}
                  strokeWidth={0.5}
                  style={{ cursor: onClick ? 'pointer' : 'default' }}
                  onMouseMove={(e) => {
                    if (!quizMode && deptFeature) onHover(deptFeature, e.clientX, e.clientY);
                  }}
                  onMouseLeave={() => onHover(null, 0, 0)}
                  onClick={() => {
                    if (onClick) onClick(code, 'departement');
                  }}
                />
              )}
            </g>

            {/* Nom du territoire */}
            {!quizMode && (
              <text
                x={centroid[0]}
                y={Math.min(centroid[1] + 12, height - 2)}
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
    </g>
  );
}
