import { memo, useMemo } from 'react';
import type { GeoProjection } from 'd3';
import { DEPARTEMENTS } from '../../data/departements';

interface CouchePrefecturesProps {
  projection: GeoProjection;
  zoomK: number;
  visible: boolean;
  highlightDeptCode?: string;
  selectedDeptCode?: string;
  onHover: (label: string | null, x: number, y: number) => void;
  onClick?: (deptCode: string) => void;
  onlyRegionales?: boolean;
}

export default memo(function CouchePrefectures({
  projection,
  zoomK,
  visible,
  highlightDeptCode,
  selectedDeptCode,
  onHover,
  onClick,
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

  const filteredPoints = useMemo(
    () => (onlyRegionales ? points.filter((p) => p.isRegionale) : points),
    [points, onlyRegionales],
  );

  // Render selected prefecture last so it appears on top
  const visiblePoints = useMemo(() => {
    if (!selectedDeptCode) return filteredPoints;
    return [...filteredPoints].sort((a, b) => {
      if (a.code === selectedDeptCode) return 1;
      if (b.code === selectedDeptCode) return -1;
      return 0;
    });
  }, [filteredPoints, selectedDeptCode]);

  if (!visible) return null;

  const r = 3 / zoomK;
  const rOuter = 5.5 / zoomK;
  const sw = 1 / zoomK;

  return (
    <g className="couche-prefectures">
      {visiblePoints.map(({ code, prefecture, nomDept, x, y, isRegionale }) => {
        const isSelected = code === selectedDeptCode;
        const isHighlighted = !isSelected && code === highlightDeptCode;

        const dotRadius = isSelected ? 4.5 / zoomK : r;
        const fill = isSelected ? '#f59e0b' : isHighlighted ? 'white' : '#9f1239';
        const stroke = isSelected ? '#92400e' : '#9f1239';
        const textFill = isSelected ? '#78350f' : isHighlighted ? 'white' : '#9f1239';

        return (
          <g
            key={code}
            style={{ cursor: onClick ? 'pointer' : 'default' }}
            onClick={onClick ? () => onClick(code) : undefined}
            onMouseMove={(e) =>
              onHover(
                `${prefecture} — préf. ${isRegionale ? 'régionale · ' : ''}${nomDept} (${code})`,
                e.clientX,
                e.clientY,
              )
            }
            onMouseLeave={() => onHover(null, 0, 0)}
          >
            {/* Anneau sélection */}
            {isSelected && (
              <circle
                cx={x}
                cy={y}
                r={rOuter * 1.5}
                fill="none"
                stroke="#f59e0b"
                strokeWidth={sw * 1.5}
              />
            )}
            {/* Anneau extérieur pour les préfectures régionales */}
            {isRegionale && !isSelected && (
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
              r={dotRadius}
              fill={fill}
              stroke={stroke}
              strokeWidth={sw}
            />
            {/* Nom de la préfecture */}
            <text
              x={x + 5 / zoomK}
              y={y + 3 / zoomK}
              fontSize={isSelected ? 15 / zoomK : 14 / zoomK}
              fontWeight={isSelected ? 'bold' : 'normal'}
              fill={textFill}
              stroke="white"
              strokeWidth={2.5 / zoomK}
              paintOrder="stroke"
              pointerEvents="none"
              style={{ userSelect: 'none' }}
            >
              {prefecture}
            </text>
          </g>
        );
      })}
    </g>
  );
});
