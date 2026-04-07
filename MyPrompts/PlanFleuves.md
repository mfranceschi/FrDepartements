# Plan — Intégration des fleuves et rivières (couche carte uniquement)

## Périmètre

Afficher les principaux fleuves et affluents de France métropolitaine en overlay sur la carte existante. Pas d'intégration dans le quiz, pas de lien explicite avec les départements éponymes — c'est une aide visuelle pure.

---

## 1. GeoJSON des cours d'eau

### Source retenue : Natural Earth + complément BD TOPAGE® si nécessaire

**Natural Earth** — fichier [`ne_10m_rivers_europe.geojson`](https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_10m_rivers_europe.geojson) (supplément Europe, dérivé de la base CCM de la Commission Européenne). C'est la base de départ.

**Ce que contient ce fichier :**
- Champ `name` (nom du cours d'eau) + `name_fr` (nom français) — noms disponibles directement, sans traitement.
- Uniquement les cours d'eau de classes 4 et 5 CCM (les "majeurs") : Loire, Rhône, Garonne, Seine, Rhin, Meuse sont garantis, ainsi que les grands affluents (Saône, Moselle, Dordogne, Tarn, Lot, Marne probablement).
- Les affluents intermédiaires (Cher, Allier, Isère, Yonne, Ariège, Vendée, Mayenne…) risquent d'être absents ou incomplets.
- Taille brute (Europe entière) : **2,42 Mo** → après filtrage sur la France : **~200–500 Ko** estimé.
- Domaine public.

**Pipeline :**
1. Télécharger le fichier raw depuis le dépôt GitHub de Natural Earth.
2. Filtrer sur le bounding box France métropolitaine via [mapshaper.org](https://mapshaper.org) (outil en ligne, sans GDAL).
3. Simplifier légèrement les géométries si nécessaire.
4. Conserver uniquement les propriétés `name` et `name_fr`, supprimer le reste.
5. Exporter en `public/fleuves.json`.

**Si des affluents importants manquent visuellement :** compléter avec **BD TOPAGE® (SANDRE/IGN)**, en filtrant par ordre de Strahler ≥ 5 ou 6 pour ne garder que les cours d'eau significatifs. Disponible gratuitement en GeoJSON sur [sandre.eaufrance.fr](https://www.sandre.eaufrance.fr). Pipeline un peu plus lourd mais faisable dans mapshaper.

Ce fichier est chargé **lazily** à la demande (voir §2), respectant la politique Cache-First Workbox déjà en place.

### Impact bundle

Bien en-deçà de la limite de 9 Mo — estimé à 200–500 Ko après filtrage France.

---

## 2. Hook de chargement (`src/hooks/useFleuveData.ts`)

Hook autonome, distinct de `useGeoData`, chargé uniquement quand l'utilisateur active la couche. Même structure que `useGeoData` (cache module-level, timeout, `FeatureCollection`).

```ts
// Chargé à la demande via import() dynamique
// Cache module-level pour ne charger qu'une fois
// Retourne : { fleuves: FeatureCollection | null, loading, error }
```

---

## 3. Couche SVG (`src/components/carte/CoucheFleuves.tsx`)

```tsx
// Props : features: Feature[], pathGen: GeoPath, visible: boolean, zoomK: number
// Rendu : <path> pour chaque LineString / MultiLineString
// Style :
//   - stroke bleu unique (#3B82F6 à ~75% opacité), couleur neutre vis-à-vis des remplissages dept/région
//   - strokeWidth adaptatif : ~1.2 / zoomK (reste lisible au zoom, ne noie pas les frontières)
//   - fill: none
// Labels : <text> sur le chemin, visibles à partir de zoomK > 2
//   - fontSize adaptatif, même logique que les labels de départements
//   - textContent : propriété `name_fr` du GeoJSON (fallback sur `name`)
```

Position dans le SVG de `CarteFrance` : au-dessus des couches géographiques (régions/depts), en-dessous des préfectures.

---

## 4. Intégration dans `CarteFrance.tsx`

### Nouveaux états

```ts
const [showFleuves, setShowFleuves] = useState(false);
```

Quand `showFleuves` passe à `true`, déclencher le chargement via `useFleuveData`.

### Toolbar (mode exploration uniquement)

Nouveau checkbox dans la barre d'outils, **disponible sur les deux layers** (départements et régions) — les rivières sont pertinentes dans les deux cas :

```tsx
<label className="flex items-center gap-2 ...">
  <input
    type="checkbox"
    checked={showFleuves}
    onChange={() => setShowFleuves(v => !v)}
  />
  Afficher les cours d'eau
</label>
```

### Dans le JSX SVG

```tsx
<CoucheFleuves
  features={fleuveFeatures}
  pathGen={PATH_GEN}
  visible={!quizMode && showFleuves}
  zoomK={transform.k}
/>
```

Pas exposé en mode quiz (inutile sans contexte pédagogique associé).

---

## Séquençage

| Étape | Tâche | Effort |
|-------|-------|--------|
| 1 | Préparer `public/fleuves.json` (filtrer + simplifier Natural Earth) | Faible (mapshaper en ligne) |
| 2 | `useFleuveData` hook | Faible |
| 3 | `CoucheFleuves.tsx` | Moyen |
| 4 | Intégration dans `CarteFrance.tsx` (état + checkbox + rendu) | Faible |

L'étape 1 est le seul point bloquant — tout le reste du code suit les patterns existants.

---

## Décisions de style

- **Couleur** : bleu unique pour tous les cours d'eau. Choisir une teinte qui ne rentre pas en collision avec les couleurs de remplissage des départements/régions (qui sont bleu-clair et vert-clair) — envisager un bleu plus saturé ou foncé, ex. `#1D4ED8` (blue-700) avec une légère transparence, ou un trait fin `#3B82F6` (blue-500) à 70–80% d'opacité.
- **Labels** : à itérer visuellement (seuil de zoom, taille, lisibilité à affiner en cours d'implémentation).
