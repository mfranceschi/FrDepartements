import { useState, useCallback, useRef, useEffect } from 'react';
import type { RefObject } from 'react';
import { zoom as d3zoom, zoomIdentity, select } from 'd3';
import type { ZoomBehavior, D3ZoomEvent } from 'd3';
import type { GeoPath, GeoPermissibleObjects } from 'd3-geo';
import type { Feature } from 'geojson';
import { isValidCentroid } from '../components/carte/featureStyle';

const FOCUS_SVG_W = 900;
const FOCUS_SVG_H = 700;
const FOCUS_SCALE = 4;
const ZOOM_STEP = 1.5;

export const ZOOM_MIN = 0.5;
export const ZOOM_MAX = 8;

const DEFAULT_ZOOM = zoomIdentity;

interface UseD3ZoomOptions {
  pathGen: GeoPath<unknown, GeoPermissibleObjects>;
  features: { departements: Feature[]; regions: Feature[] };
  focusCode?: string;
  focusType?: 'departement' | 'region';
  focusSeq?: number;
  focusScale?: number;
}

export interface UseD3ZoomReturn {
  svgRef: RefObject<SVGSVGElement | null>;
  gRef: RefObject<SVGGElement | null>;
  zoomK: number;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  handleZoomReset: () => void;
}

export function useD3Zoom({
  pathGen,
  features,
  focusCode,
  focusType,
  focusSeq,
  focusScale,
}: UseD3ZoomOptions): UseD3ZoomReturn {
  // zoomK est le seul state lié au zoom : mis à jour uniquement quand k change,
  // pas à chaque frame de pan. Le transform du <g> est appliqué en impératif.
  const [zoomK, setZoomK] = useState(1);

  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const lastKRef = useRef(1);
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | undefined>(undefined);
  const featuresRef = useRef(features);
  featuresRef.current = features;

  // Setup d3.zoom
  useEffect(() => {
    if (!svgRef.current) return;
    const zoomBehavior = d3zoom<SVGSVGElement, unknown>()
      .scaleExtent([ZOOM_MIN, ZOOM_MAX])
      .on('zoom', (event: D3ZoomEvent<SVGSVGElement, unknown>) => {
        const { x, y, k } = event.transform;
        // Mise à jour DOM directe : zéro re-render React pendant le pan
        if (gRef.current) {
          gRef.current.style.transform = `translate(${x}px,${y}px) scale(${k})`;
        }
        // Re-render React seulement quand le facteur de zoom change (pas le pan)
        if (k !== lastKRef.current) {
          lastKRef.current = k;
          setZoomK(k);
        }
      });

    zoomRef.current = zoomBehavior;
    select(svgRef.current).call(zoomBehavior);
    select(svgRef.current).call(zoomBehavior.transform, DEFAULT_ZOOM);

    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      select(svgRef.current).on('.zoom', null);
    };
  }, []);

  // Zoom programmatique vers un territoire (recherche sidebar).
  // featuresRef est toujours à jour sans être une dépendance : l'effet ne se
  // déclenche que sur un changement de focusCode / focusType.
  useEffect(() => {
    if (!focusCode || !svgRef.current || !zoomRef.current) return;

    const pool = focusType === 'region' ? featuresRef.current.regions : featuresRef.current.departements;
    const target = pool.find((f) => f.properties?.code === focusCode);
    if (!target) return;

    const centroid = pathGen.centroid(target);
    if (!centroid || !isValidCentroid(centroid)) return;

    const scale = focusScale ?? FOCUS_SCALE;
    const tx = FOCUS_SVG_W / 2 - scale * centroid[0];
    const ty = FOCUS_SVG_H / 2 - scale * centroid[1];
    const newTransform = zoomIdentity.translate(tx, ty).scale(scale);

    select(svgRef.current)
      .transition()
      .duration(500)
      .call(zoomRef.current.transform, newTransform);
  }, [focusCode, focusType, focusSeq, focusScale, pathGen]);

  const handleZoomIn = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return;
    select(svgRef.current).transition().duration(250).call(zoomRef.current.scaleBy, ZOOM_STEP);
  }, []);

  const handleZoomOut = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return;
    select(svgRef.current).transition().duration(250).call(zoomRef.current.scaleBy, 1 / ZOOM_STEP);
  }, []);

  const handleZoomReset = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return;
    select(svgRef.current).transition().duration(300).call(zoomRef.current.transform, DEFAULT_ZOOM);
  }, []);

  return { svgRef, gRef, zoomK, handleZoomIn, handleZoomOut, handleZoomReset };
}
