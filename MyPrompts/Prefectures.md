# Préfectures — UX & plan d'implémentation

## Contexte

Les structures de données actuelles ne contiennent pas de préfecture :
- `Departement` : `{ code, nom, regionCode }`
- `Region` : `{ code, nom }`

Deux niveaux à exposer :
- **Préfecture départementale** — chef-lieu administratif du département (ex : Bourg-en-Bresse pour l'Ain)
- **Préfecture régionale** — chef-lieu de région (ex : Lyon pour Auvergne-Rhône-Alpes)

---

## Proposition UX

### Vue Carte

**InfoPanel (sidebar droite, au clic)**

C'est l'endroit naturel : l'utilisateur a déjà sélectionné un territoire, il est dans un état "je veux en savoir plus". Ajouter simplement une ligne supplémentaire :

- Département sélectionné → `Préfecture : Bourg-en-Bresse`
- Région sélectionnée → `Préfecture régionale : Lyon`

Aucun nouvel élément d'interface, cohérent avec les lignes "Code" et "Région" déjà présentes.

**Tooltip au survol**

Enrichir le tooltip existant d'une mention discrète de la préfecture :
```
Ain (01)
Préfecture : Bourg-en-Bresse
```
La deuxième ligne peut être plus petite / grisée. Cela donne l'info en survol rapide sans avoir à cliquer.

**Repères géographiques sur la carte**

Oui, c'est faisable proprement : la projection D3 (`PROJECTION`) est déjà instanciée en module constant dans `CarteFrance.tsx`. `PROJECTION([lon, lat])` retourne directement les coordonnées SVG de n'importe quelle ville — aucun GeoJSON supplémentaire requis.

Visuellement, deux niveaux de repères :
- **Préfecture départementale** : petit cercle plein (rayon ~3px écran), couleur bordeaux `#9f1239`
- **Préfecture régionale** : cercle légèrement plus grand avec anneau extérieur (double ring), même couleur — la distingue visuellement comme chef-lieu supérieur

Les cercles sont rendus dans le groupe zoomable avec `r = 3 / k` (rayon constant à l'écran quelle que soit l'échelle), `pointer-events: none` sauf si on veut un tooltip dédié.

**Déclenchement :**
Un bouton toggle séparé "Préfectures" dans la toolbar (à côté de "Étiquettes"), désactivé par défaut. Les deux toggles sont indépendants — on peut vouloir les repères sans les étiquettes texte.

**Tooltip au survol d'un repère :**
Si `pointer-events` activés sur les cercles : tooltip `"Bourg-en-Bresse — préfecture de l'Ain"`. Attention à la superposition avec les `<path>` des départements — les cercles doivent être rendus après les paths pour capter les événements.

**Interaction avec le département sélectionné :**
Quand un département est sélectionné (surbrillance bleue), son repère de préfecture peut passer en blanc avec contour bordeaux pour rester lisible sur fond coloré.

---

### Vue Tableau

**En-tête de région (accordion)**

Quand la région est dépliée, afficher la préfecture régionale dans le corps, avant la liste des départements :

```
▼  84   Auvergne-Rhône-Alpes                    12 depts
   Préfecture régionale : Lyon
   ─────────────────────────────
   01  Ain               Bourg-en-Bresse
   03  Allier            Moulins
   ...
```

**Lignes département**

Ajouter une troisième colonne (ou ligne secondaire sur mobile) avec la préfecture départementale. La grille passe de 2 à 3 colonnes sur desktop, reste 2 colonnes sur mobile avec la préfecture en texte secondaire sous le nom.

---

## Plan d'implémentation

### Étape 1 — Données (`src/data/`)

**`departements.ts`**
- Ajouter `prefecture: string`, `lat: number`, `lon: number` à l'interface `Departement`
- Remplir les 96 entrées (données stables, source : découpage administratif officiel)

**`regions.ts`**
- Ajouter `prefectureRegionale: string` à l'interface `Region` (pas de coordonnées séparées : la préfecture régionale est toujours aussi une préfecture départementale — ses coordonnées sont déjà dans `departements.ts`)
- Remplir les 13 entrées :

| Code | Région | Préfecture régionale |
|------|--------|----------------------|
| 11 | Île-de-France | Paris |
| 24 | Centre-Val de Loire | Orléans |
| 27 | Bourgogne-Franche-Comté | Dijon |
| 28 | Normandie | Rouen |
| 32 | Hauts-de-France | Lille |
| 44 | Grand Est | Strasbourg |
| 52 | Pays de la Loire | Nantes |
| 53 | Bretagne | Rennes |
| 75 | Nouvelle-Aquitaine | Bordeaux |
| 76 | Occitanie | Toulouse |
| 84 | Auvergne-Rhône-Alpes | Lyon |
| 93 | Provence-Alpes-Côte d'Azur | Marseille |
| 94 | Corse | Ajaccio |

---

### Étape 2 — Vue Carte

**`src/pages/CartePage.tsx`**
- `InfoPanel` département : ajouter une ligne `Préfecture : Bourg-en-Bresse` après la ligne Région
- `InfoPanel` région : ajouter une ligne `Préfecture régionale : Lyon`
- `DEPT_MAP` (buildDeptMap) : inclure `prefecture` dans la valeur stockée
- `REGION_MAP` (buildRegionMap) : passer à une `Map<string, Region>` complète pour accéder à `prefectureRegionale`
- Enrichir le tooltip au survol : `handleDeptHover` construit le texte `nom (code)\nPréfecture : ...`

**Nouveau composant `src/components/carte/CouchePrefectures.tsx`**
- Props : `departements: Departement[]`, `zoomK: number`, `visible: boolean`, `highlightDeptCode?: string`
- Calcul à la création : `PROJECTION([lon, lat])` pour chaque entrée → coordonnées SVG statiques (la projection ne change pas)
- Rendu de deux calques de cercles :
  - Préfectures départementales : `<circle r={3/k} fill="#9f1239" />`
  - Préfectures régionales : `<circle r={4/k} fill="none" stroke="#9f1239" strokeWidth={1/k} />` superposé au cercle plein
- Le cercle du département sélectionné (`highlightDeptCode`) passe en blanc / contour bordeaux
- `pointer-events: all` + tooltip dédié (ou réutiliser le tooltip existant de `CarteFrance`)

**`src/components/carte/CarteFrance.tsx`**
- Nouveau state `showPrefectures: boolean` (défaut `false`)
- Bouton toggle "Préfectures" dans la toolbar, indépendant de "Étiquettes"
- Passer `showPrefectures`, `zoomK`, `highlightDeptCode` à `CouchePrefectures`
- Insérer `<CouchePrefectures>` après `<CoucheDepts>` dans le groupe zoomable (pour que les cercles soient au-dessus des paths)

---

### Étape 3 — Vue Tableau (`src/components/tableau/AccordionRegions.tsx`)

- Afficher `region.prefectureRegionale` dans le corps déplié, au-dessus de la liste
- Passer à une grille 3 colonnes : `code | nom | préfecture`
- Sur mobile (`sm:` breakpoint) : garder 2 colonnes, afficher la préfecture comme ligne secondaire sous le nom (`text-gray-400 text-xs`)

---

### Étape 4 — Tests

- Mettre à jour `src/tests/AccordionRegions.test.tsx` : vérifier l'affichage de la préfecture régionale et départementale
- Mettre à jour `src/tests/CartePage.test.tsx` : vérifier que l'InfoPanel affiche bien la préfecture au clic
- Ajouter un test unitaire pour `CouchePrefectures` : vérifier que les cercles sont rendus aux bons codes
- Les données statiques changeant d'interface, le compilateur TypeScript guidera les endroits à corriger

---

## Ce qui ne change pas

- Structure GeoJSON (`/public/`) — aucune modification, les coordonnées préfectures sont dans `departements.ts`
- Mode Quiz — non concerné
- `CoucheRegions.tsx`, `CoucheDepts.tsx` — non concernés
- Logique de zoom, étiquettes, navigation — non concernés
