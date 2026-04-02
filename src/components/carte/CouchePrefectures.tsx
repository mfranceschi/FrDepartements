import { memo, useMemo } from 'react';
import type { GeoProjection } from 'd3';
import { DEPARTEMENTS } from '../../data/departements';

interface CouchePrefecturesProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  projection: GeoProjection;
  zoomK: number;
  visible: boolean;
  highlightDeptCode?: string;
  onHover: (label: string | null, x: number, y: number) => void;
  onlyRegionales?: boolean;
}

export default memo(function CouchePrefectures({
  projection,
  zoomK,
  visible,
  highlightDeptCode,
  onHover,
  onlyRegionales = false,
}: CouchePrefecturesProps) {
  // Projeter les coordonnées une seule fois (la projection ne change pas)
  const points = useMemo(
    () =>
      DEPARTEMENTS.map((d) => {
        const xy = projection([d.lon, d.lat]);
        if (!xy) return null;
        return {
          code: d.code,
          prefecture: d.prefecture,
          nomDept: d.nom,
          x: xy[0],
          y: xy[1],
          isRegionale: d.isPrefectureRegionale === true,
        };
      }).filter(Boolean) as {
        code: string;
        prefecture: string;
        nomDept: string;
        x: number;
        y: number;
        isRegionale: boolean;
      }[],
    [projection],
  );

  if (!visible) return null;

  const visiblePoints = onlyRegionales ? points.filter((p) => p.isRegionale) : points;

  const r = 3 / zoomK;
  const rOuter = 5.5 / zoomK;
  const sw = 1 / zoomK;

  return (
    <g className="couche-prefectures">
      {visiblePoints.map(({ code, prefecture, nomDept, x, y, isRegionale }) => {
        const isHighlighted = code === highlightDeptCode;
        const fill = isHighlighted ? 'white' : '#9f1239';
        const stroke = '#9f1239';

        return (
          <g
            key={code}
            style={{ cursor: 'default' }}
            onMouseMove={(e) =>
              onHover(
                `${prefecture} — préf. ${isRegionale ? 'régionale · ' : ''}${nomDept} (${code})`,
                e.clientX,
                e.clientY,
              )
            }
            onMouseLeave={() => onHover(null, 0, 0)}
          >
            {/* Anneau extérieur pour les préfectures régionales */}
            {isRegionale && (
              <circle
                cx={x}
                cy={y}
                r={rOuter}
                fill="none"
                stroke={stroke}
                strokeWidth={sw}
              />
            )}
            {/* Point central */}
            <circle
              cx={x}
              cy={y}
              r={r}
              fill={fill}
              stroke={stroke}
              strokeWidth={sw}
            />
          </g>
        );
      })}
    </g>
  );
});
