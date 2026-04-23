import { memo, useMemo, useState } from 'react';
import type { Feature } from 'geojson';
import { type D3PathGen, isValidCentroid, resolveStroke, STROKE_WIDTH_ACTIVE } from './featureStyle';

interface CoucheRegionsProps {
  features: Feature[];
  pathGen: D3PathGen;
  visible: boolean;
  /** Quand true : affiche uniquement les contours (fill transparent), sans interaction */
  borderOnly?: boolean;
  quizMode?: boolean;
  highlightCode?: string;
  highlightVariant?: 'correct' | 'target';
  wrongCode?: string;
  onHover: (feature: Feature | null, x: number, y: number) => void;
  onClick?: (code: string) => void;
  showLabels?: boolean;
  zoomK?: number;
}

const SEUIL_LABEL_REGION = 50;

const BASE_STROKE = '#6aaa6a';

export default memo(function CoucheRegions({
  features,
  pathGen,
  visible,
  borderOnly = false,
  quizMode = false,
  highlightCode,
  highlightVariant = 'correct',
  wrongCode,
  onHover,
  onClick,
  showLabels = false,
  zoomK = 1,
}: CoucheRegionsProps) {
  const [hoveredCode, setHoveredCode] = useState<string | null>(null);

  const paths = useMemo(
    () => features.map((f) => {
      const rawCode = f.properties?.code;
      const rawNom = f.properties?.nom;
      const centroid = pathGen.centroid(f);
      const [[x0, y0], [x1, y1]] = pathGen.bounds(f);
      const minDim = Math.min(x1 - x0, y1 - y0);
      return {
        feature: f,
        d: pathGen(f),
        code: typeof rawCode === 'string' ? rawCode : undefined,
        nom: typeof rawNom === 'string' ? rawNom : undefined,
        centroid,
        minDim,
      };
    }),
    [features, pathGen],
  );

  // Contours seuls : pas de transition, null quand invisible
  if (borderOnly) {
    if (!visible) return null;
    return (
      <g className="couche-regions">
        {paths.map(({ d, code }) => {
          if (!d) return null;
          return (
            <path
              key={code ?? d}
              d={d}
              fill="none"
              stroke="#475569"
              strokeWidth={1.5}
              style={{ pointerEvents: 'none' }}
            />
          );
        })}
      </g>
    );
  }

  return (
    <g
      className="couche-regions"
      style={{ opacity: visible ? 1 : 0, pointerEvents: visible ? 'auto' : 'none', transition: 'opacity 200ms ease' }}
    >
      {paths.map(({ feature, d, code, nom }) => {
        if (!d) return null;

        const isHighlighted = code !== undefined && code === highlightCode;
        const isWrong = code !== undefined && code === wrongCode;
        const isHovered = code !== undefined && code === hoveredCode;
        const isQuizHighlighted = quizMode && isHighlighted;

        // Hover exprimé via un ring (stroke), fill inchangé — distinct du blanc de la sélection
        const hoverRing = isHovered && !quizMode && !isHighlighted && !isWrong;
        const fill = isHighlighted ? 'white' : isWrong ? 'white' : '#e8f4e8';
        const stroke = hoverRing
          ? '#15803d'
          : resolveStroke(isQuizHighlighted, isWrong, highlightVariant, BASE_STROKE);
        const strokeWidth = hoverRing
          ? 2
          : (isQuizHighlighted || isWrong) ? STROKE_WIDTH_ACTIVE : 1;

        return (
          <path
            key={code ?? d}
            d={d}
            aria-label={nom ?? code}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            style={{ cursor: onClick ? 'pointer' : 'default', transition: 'fill 120ms ease, stroke 120ms ease' }}
            onMouseEnter={(e) => {
              setHoveredCode(code ?? null);
              if (!quizMode) onHover(feature, e.clientX, e.clientY);
            }}
            onMouseMove={(e) => { if (!quizMode) onHover(feature, e.clientX, e.clientY); }}
            onMouseLeave={() => { setHoveredCode(null); onHover(null, 0, 0); }}
            onClick={() => { if (onClick && code) onClick(code); }}
          />
        );
      })}
      {!quizMode && showLabels && visible && paths.map(({ code, nom, centroid, minDim }) => {
        if ((minDim * zoomK) < SEUIL_LABEL_REGION) return null;
        if (!isValidCentroid(centroid)) return null;
        const [cx, cy] = centroid;
        const fs = 14 / zoomK;
        return (
          <text key={`label-${code}`} textAnchor="middle" style={{ userSelect: 'none', pointerEvents: 'none' }}>
            <tspan
              x={cx}
              y={cy}
              dominantBaseline="middle"
              fontSize={fs}
              fontWeight="bold"
              fill="#1e3a5f"
              stroke="white"
              strokeWidth={fs * 0.25}
              paintOrder="stroke"
            >
              {nom}
            </tspan>
          </text>
        );
      })}
    </g>
  );
});
