# Meilleurs DROMs sur carte — Plan de mise en œuvre

## Objectif

Remplacer les insets DROM isolés (un rectangle par île) par des **insets géographiques groupés** :
- **Antilles** : Guadeloupe + Martinique dans un même rectangle avec contexte caribéen
- **Océan Indien** : La Réunion + Mayotte dans un même rectangle avec contexte (Madagascar, Comores, etc.)
- **Guyane** : reste en inset simple (territoire unique, pas de voisin DROM)

Les îles de La Réunion et Mayotte étant très petites à l'échelle de leur contexte géographique,
elles seront **artificiellement agrandies** via une double projection (technique cartographique assumée).

---

## Étape 1 — Données géographiques mondiales

### Fichier à ajouter
Télécharger le GeoJSON **Natural Earth 110m countries** (résolution basse, suffisante pour un inset
de ~280px) et le placer dans `src/data/world-110m.json`.

Source : https://naturalearthdata.com → `ne_110m_admin_0_countries.geojson`

### Filtrage à la volée
Ne pas charger le monde entier en mémoire : filtrer au rendu les features dont le bounding box
intersecte la zone géographique de l'inset. Quelques dizaines de pays max par groupe.

---

## Étape 2 — Nouveau composant `GroupInset`

Créer `src/components/carte/GroupInset.tsx` avec la structure suivante :

```
GroupInset
  ├── <rect />                         fond du rectangle SVG
  ├── <WorldContextLayer />            pays voisins — projection globale, non-interactifs
  └── territories.map(t =>
        <EnlargedTerritoryLayer />)    île en double projection — interactive
```

### Interface

```typescript
interface TerritoryInGroup {
  code: string;           // ex: '974'
  nom: string;            // ex: 'La Réunion'
  type: 'departement' | 'region';
  // Position approximative du centroïde dans l'inset (0..1),
  // calculée depuis les coordonnées géographiques réelles
  relativePosition: { x: number; y: number };
  enlargeScale: number;   // facteur d'agrandissement, ex: 4
}

interface GroupInsetConfig {
  id: string;
  label: string;          // ex: 'Océan Indien'
  x: number; y: number;   // position dans le SVG parent
  width: number; height: number;
  // Bounding box géographique : [lng_ouest, lat_sud, lng_est, lat_nord]
  geoBounds: [number, number, number, number];
  territories: TerritoryInGroup[];
}
```

### Configurations initiales

```typescript
const GROUP_INSET_CONFIGS: GroupInsetConfig[] = [
  {
    id: 'antilles',
    label: 'Antilles',
    x: 10, y: 437, width: 280, height: 90,
    geoBounds: [-64, 13, -59, 19],  // Guadeloupe + Martinique + contexte caribéen
    territories: [
      { code: '971', nom: 'Guadeloupe', type: 'departement',
        relativePosition: { x: 0.38, y: 0.25 }, enlargeScale: 3 },
      { code: '972', nom: 'Martinique', type: 'departement',
        relativePosition: { x: 0.48, y: 0.65 }, enlargeScale: 3 },
    ],
  },
  {
    id: 'ocean-indien',
    label: 'Océan Indien',
    x: 10, y: 625, width: 280, height: 130,
    geoBounds: [40, -35, 65, -8],   // Madagascar, Comores, Réunion, Mayotte
    territories: [
      { code: '974', nom: 'La Réunion', type: 'departement',
        relativePosition: { x: 0.78, y: 0.72 }, enlargeScale: 5 },
      { code: '976', nom: 'Mayotte', type: 'departement',
        relativePosition: { x: 0.35, y: 0.28 }, enlargeScale: 5 },
    ],
  },
];
```

---

## Étape 3 — Double projection (cœur technique)

### Couche contexte (projection globale)

```typescript
const globalProj = geoMercator().fitExtent(
  [[padding, padding], [width - padding, height - padding]],
  bboxFeatureFromGeoBounds(geoBounds)  // GeoJSON rectangle sur la bbox
);
// Rendu des pays voisins avec cette projection
// style : fill="#e8e8e8" stroke="#bbb" strokeWidth={0.5}
// pointer-events: none
```

### Couche île agrandie (projection locale)

Pour chaque territoire :

```typescript
// 1. Projeter le centroïde de l'île avec la projection globale
//    → donne la position (cx, cy) dans le SVG
const [cx, cy] = globalProj(featureCentroid(deptFeature));

// 2. Créer une projection locale fitExtent sur une petite zone autour de l'île
const localProj = geoMercator().fitExtent(
  [[0, 0], [targetSizePx, targetSizePx]],  // ex: 40x40 px
  deptFeature
);

// 3. Dessiner l'île dans son repère local, puis la déplacer au bon endroit via transform
<g transform={`translate(${cx - targetSizePx/2}, ${cy - targetSizePx/2})`}>
  <path d={geoPath(localProj)(deptFeature)} ... />
</g>
```

`targetSizePx` est dérivé de `enlargeScale` : par exemple si l'île fait naturellement ~8px,
`enlargeScale: 5` → `targetSizePx = 40px`.

---

## Étape 4 — Labels

Chaque île dans le groupe reçoit un label positionné sous son centroïde projeté :

```tsx
<text
  x={cx}
  y={cy + targetSizePx / 2 + 10}
  textAnchor="middle"
  fontSize={9}
  fill="#374151"
  fontWeight="500"
>
  {territory.nom}
</text>
```

En mode quiz (`quizMode=true`), les labels sont masqués (comportement identique à l'existant).

---

## Étape 5 — Interactions

Les props `onHover`, `onClick`, `highlightDeptCode`, `highlightRegionCode` fonctionnent
**par territoire** exactement comme dans `SingleInset` actuel — la logique ne change pas,
elle s'applique simplement sur plusieurs features au sein d'un même inset.

---

## Étape 6 — Mise à jour de `InsetOutreMer.tsx`

- Remplacer les entrées `INSET_CONFIGS` pour `971`, `972`, `974`, `976` par les deux `GroupInsetConfig`
- Conserver `SingleInset` pour la Guyane (`973`)
- Supprimer les `GROUP_LABELS` existants (ils deviennent des labels intégrés aux `GroupInset`)
- Passer `worldFeatures` (le GeoJSON countries filtré) en prop ou via un contexte/hook dédié

---

## Récapitulatif des fichiers touchés

| Fichier | Action |
|---|---|
| `src/data/world-110m.json` | **Créer** — données Natural Earth 110m |
| `src/components/carte/GroupInset.tsx` | **Créer** — nouveau composant |
| `src/components/carte/InsetOutreMer.tsx` | **Modifier** — intégration des GroupInset |
| `src/tests/InsetOverlay.test.tsx` | **Mettre à jour** — couvrir les nouveaux groupes |

---

## Notes et garde-fous

- **Taille des îles** : viser ~35-50 px pour La Réunion et Mayotte, ~25-35 px pour les Antilles.
  Ajuster `enlargeScale` après rendu visuel.
- **Honnêteté cartographique** : les îles agrandies restent positionnées à leur vraie place
  géographique relative — seule leur taille est gonflée. Acceptable dans ce contexte applicatif.
- **Performance** : le GeoJSON 110m est chargé une seule fois et filtré à la bbox. Pas d'impact
  notable sur le rendu.
- **Fallback** : si le monde GeoJSON n'est pas disponible, le `GroupInset` se dégrade gracieusement
  en n'affichant que les îles sur fond uni (comme l'actuel `SingleInset`).
