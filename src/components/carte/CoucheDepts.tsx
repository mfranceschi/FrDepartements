import { memo, useMemo, useState } from 'react';
import type { Feature } from 'geojson';
import { computeDeptColors } from '../../geo/colorMap';
import { type D3PathGen, isValidCentroid, resolveStroke, STROKE_WIDTH_ACTIVE } from './featureStyle';

interface CoucheDepsProps {
  features: Feature[];
  pathGen: D3PathGen;
  visible: boolean;
  quizMode?: boolean;
  highlightCode?: string;
  highlightVariant?: 'correct' | 'target';
  wrongCode?: string;
  /** Codes des départements traversés par un cours d'eau sélectionné */
  traversedCodes?: string[];
  onHover: (feature: Feature | null, x: number, y: number) => void;
  onClick?: (code: string) => void;
  zoomK?: number;
  showLabels?: boolean;
  /** Quand false : rend uniquement les labels (textes), sans les paths de remplissage */
  showFills?: boolean;
}

// Seuils en unités SVG × facteur de zoom :
// - au-dessus de SEUIL_CODE : affiche le numéro + nom
const SEUIL_CODE = 100;
const SEUIL_NOM = 100;

export default memo(function CoucheDepts({
  features,
  pathGen,
  visible,
  quizMode = false,
  highlightCode,
  highlightVariant = 'correct',
  wrongCode,
  traversedCodes,
  onHover,
  onClick,
  zoomK = 1,
  showLabels = true,
  showFills = true,
}: CoucheDepsProps) {
  // Coloriage des départements (déterministe, calculé une seule fois)
  const colorMap = useMemo(() => computeDeptColors(features), [features]);

  const [hoveredCode, setHoveredCode] = useState<string | null>(null);

  // Calcul des paths, centroïdes et tailles une seule fois (ou quand features/pathGen changent)
  const paths = useMemo(
    () => features.map((f) => {
      const d = pathGen(f);
      const rawCode = f.properties?.code;
      const rawNom = f.properties?.nom;
      const code = typeof rawCode === 'string' ? rawCode : undefined;
      const nom = typeof rawNom === 'string' ? rawNom : undefined;
      const centroid = pathGen.centroid(f);
      const [[x0, y0], [x1, y1]] = pathGen.bounds(f);
      const minDim = Math.min(x1 - x0, y1 - y0);
      return { feature: f, d, code, nom, centroid, minDim };
    }),
    [features, pathGen],
  );

  // L'instance labels-only sort en null quand invisible — pas de transition nécessaire.
  // L'instance fills reste dans le DOM avec opacity pour la transition de couche.
  if (!showFills && !visible) return null;

  return (
    <g
      className="couche-depts"
      style={
        showFills
          ? { opacity: visible ? 1 : 0, pointerEvents: visible ? 'auto' : 'none', transition: 'opacity 200ms ease' }
          : undefined
      }
    >
      {showFills && paths.map(({ feature, d, code, nom }) => {
        if (!d) return null;
        const isHighlighted = code !== undefined && code === highlightCode;
        const isWrong = code !== undefined && code === wrongCode;
        const isHovered = code !== undefined && code === hoveredCode;
        const isTraversed = !isHighlighted && !isWrong && !isHovered && code !== undefined && (traversedCodes?.includes(code) ?? false);
        const baseFill = code ? (colorMap.get(code) ?? '#dbeafe') : '#dbeafe';
        const isQuizHighlighted = quizMode && isHighlighted;

        // Hover exprimé via un ring (stroke), fill inchangé — distinct du blanc de la sélection
        const hoverRing = isHovered && !quizMode && !isHighlighted && !isWrong;
        const fill = (isHighlighted || isWrong) ? 'white' : isTraversed ? '#bfdbfe' : baseFill;
        const stroke = hoverRing
          ? '#2563eb'
          : resolveStroke(isQuizHighlighted, isWrong, highlightVariant, isTraversed ? '#3b82f6' : '#475569');
        const strokeWidth = hoverRing
          ? 2
          : (isQuizHighlighted || isWrong) ? STROKE_WIDTH_ACTIVE : isTraversed ? 1 : 0.5;

        return (
          <path
            key={code ?? d}
            d={d}
            role="img"
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
        const effective = minDim * zoomK;
        if (effective < SEUIL_CODE) return null;
        const showName = effective >= SEUIL_NOM;
        if (!isValidCentroid(centroid)) return null;
        const [cx, cy] = centroid;
        const fs = 14 / zoomK; // taille fixe à l'écran (~14px) quelle que soit l'échelle

        return (
          <text key={`label-${code}`} textAnchor="middle" style={{ userSelect: 'none', pointerEvents: 'none' }}>
            <tspan
              x={cx}
              y={showName ? cy - fs * 0.65 : cy}
              dominantBaseline={showName ? 'auto' : 'middle'}
              fontSize={fs}
              fontWeight="bold"
              fill="#1e3a5f"
              stroke="white"
              strokeWidth={fs * 0.25}
              paintOrder="stroke"
            >
              {code}
            </tspan>
            {showName && (
              <tspan
                x={cx}
                y={cy + fs * 0.75}
                fontSize={fs}
                fill="#1e3a5f"
                stroke="white"
                strokeWidth={fs * 0.25}
                paintOrder="stroke"
              >
                {nom}
              </tspan>
            )}
          </text>
        );
      })}
    </g>
  );
});
