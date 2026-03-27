# Plan — Application Web : Départements & Régions de France

## Vue d'ensemble

Application web monopage avec trois sections principales :
1. **Carte** — carte SVG interactive de la France avec infobulles au survol
2. **Quiz** — cinq types de questions pour tester ses connaissances géographiques
3. **Tableau** — présentation de référence triable et filtrable

Toute l'interface, tous les labels et tous les textes sont **en français**.

---

## Stack technique

| Besoin | Choix | Pourquoi |
|---|---|---|
| Framework | **React + Vite** | Setup rapide, modèle composant bien adapté |
| Rendu carte | **D3.js + TopoJSON** | Référence pour les cartes SVG administratives ; aucun serveur de tuiles |
| Style | **Tailwind CSS** | Utilitaire, zéro overhead de configuration |
| Routing | **React Router v6** | Navigation simple entre les trois pages |
| Format données géo | **GeoJSON** | Standard pour les contours administratifs français |
| Gestionnaire de paquets | **npm** | Standard |

Pas de backend, pas de base de données — tout tourne dans le navigateur depuis des fichiers statiques.

---

## Données

### Contours géographiques

Source : dépôt `france-geojson` (gregoiredavid), qui fournit des fichiers séparés pour chaque territoire.

Fichiers à inclure :
- `regions.geojson` — 18 régions (13 métropolitaines + 5 régions d'outre-mer)
- `departements.geojson` — 101 départements (96 métropolitains + 5 DROM)

Les DOM-TOM (971 Guadeloupe, 972 Martinique, 973 Guyane, 974 La Réunion, 976 Mayotte) sont inclus dès le départ. Leur positionnement sur la carte se fera via des **insets** (petits cadres repositionnés autour de la France métropolitaine), car leur localisation réelle rendrait la carte illisible.

La Corse est incluse dans la projection principale (pas d'inset).

### Données tabulaires

Un fichier `src/data/departements.ts` contenant un tableau de constantes :

```ts
interface Departement {
  code: string;        // "01", "2A", "2B", "75", "971", …
  nom: string;         // "Ain", "Corse-du-Sud", "Paris", "Guadeloupe", …
  regionCode: string;  // code de la région parente
  outresMer: boolean;  // true pour les 5 DROM
}

interface Region {
  code: string;        // "84", "01", "02", "03", "04", "06"
  nom: string;         // "Auvergne-Rhône-Alpes", "Guadeloupe", …
  outresMer: boolean;
}
```

Ces ~101 lignes sont suffisamment petites pour être bundlées comme constante TypeScript.

---

## Structure du projet

```
FrDepartements/
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── src/
│   ├── main.tsx
│   ├── App.tsx                   # Router + shell de mise en page
│   ├── data/
│   │   ├── departements.ts       # données tabulaires statiques
│   │   └── regions.ts
│   ├── geo/                      # fichiers GeoJSON
│   │   ├── departements.json     # 101 départements
│   │   └── regions.json          # 18 régions
│   ├── pages/
│   │   ├── CartePage.tsx
│   │   ├── QuizPage.tsx
│   │   └── TableauPage.tsx
│   ├── components/
│   │   ├── Nav.tsx
│   │   ├── carte/
│   │   │   ├── CarteFrance.tsx   # carte SVG D3, accepte props highlight/select
│   │   │   ├── CoucheRegions.tsx # paths SVG des régions
│   │   │   ├── CoucheDepts.tsx   # paths SVG des départements
│   │   │   └── InsetOutreMer.tsx # mini-cartes repositionnées pour les DROM
│   │   ├── quiz/
│   │   │   ├── QuizShell.tsx          # question + réponse + bandeau score
│   │   │   ├── QuizConfig.tsx         # sélection des types + difficulté
│   │   │   └── types-questions/
│   │   │       ├── TrouverDeptCarte.tsx    # cliquer le bon département
│   │   │       ├── TrouverRegionCarte.tsx  # cliquer la bonne région
│   │   │       ├── DevinerCodeDept.tsx     # QCM : quel est le numéro ?
│   │   │       ├── DevinerNomDept.tsx      # QCM : quel département a le code XX ?
│   │   │       └── DevinerRegionDept.tsx   # QCM : dans quelle région est X ?
│   │   └── tableau/
│   │       ├── TableauFlat.tsx       # liste plate filtrable et triable
│   │       └── AccordionRegions.tsx  # vue groupée par région
│   └── hooks/
│       ├── useGeoData.ts    # charge et mémoïse les GeoJSON
│       └── useQuiz.ts       # génération questions, vérification réponses, état session
```

---

## Composant Carte

- D3 projette le GeoJSON sur un `<svg>` avec une projection **conique conforme** centrée sur la France métropolitaine.
- La **Corse** est incluse dans la projection principale — pas d'inset nécessaire, elle est déjà visible.
- Les **5 DROM** (Guadeloupe, Martinique, Guyane, La Réunion, Mayotte) sont affichés dans de petits cadres insets positionnés autour de la France métropolitaine, avec une mini-étiquette indiquant le nom.
- `CoucheRegions` et `CoucheDepts` sont des éléments `<g>` séparés, activables via des cases à cocher.
- Au **survol** : infobulle flottante avec le nom (et le code pour les départements).
- Au **clic** (mode quiz) : la carte transmet le code du territoire cliqué au composant quiz parent.
- En **mode exploration** : le clic sur un territoire le met en surbrillance et affiche un panneau d'info latéral (nom, code, région parente).

### Carte en mode quiz

Pour les questions de type clic sur carte (`TrouverDeptCarte`, `TrouverRegionCarte`) :
- **Noms et numéros masqués** — aucun label affiché sur les territoires, les infobulles au survol sont désactivées.
- **Couche unique** — seule la couche pertinente est affichée : uniquement les départements pour `TrouverDeptCarte`, uniquement les régions pour `TrouverRegionCarte`. Le toggle de couche est désactivé pendant la question.
- **DROM exclus** des questions clic sur carte pour l'instant (leur affichage en insets rendrait l'interaction peu fiable). Ils restent présents sur la carte à titre visuel mais ne sont pas cliquables pendant ces questions.

---

## Modes de Quiz

| Mode | Question affichée | Saisie |
|---|---|---|
| **TrouverDeptCarte** | « Cliquez sur le département *Finistère* (29) » | Clic sur la carte |
| **TrouverRegionCarte** | « Cliquez sur la région *Bretagne* » | Clic sur la carte |
| **DevinerCodeDept** | « Quel est le numéro du département *Gironde* ? » | QCM à 4 choix |
| **DevinerNomDept** | « Quel département porte le numéro *33* ? » | QCM à 4 choix |
| **DevinerRegionDept** | « Dans quelle région se trouve la *Gironde* ? » | QCM à 4 choix |

### Difficulté des distracteurs (QCM uniquement)

Un **sélecteur de difficulté** est affiché dans l'écran de configuration du quiz. Il ne s'applique qu'aux questions QCM — les questions de type clic sur carte n'ont pas de distracteurs et ne sont donc pas affectées.

| Niveau | Comportement des mauvaises réponses |
|---|---|
| **Facile** | Tirées aléatoirement dans l'ensemble du pool |
| **Difficile** | Tirées parmi les territoires géographiquement proches (voisins directs ou même région) |

La proximité géographique est calculée à partir des centroïdes GeoJSON ou d'une liste de voisins précalculée.

### Longueur de session

L'utilisateur choisit le nombre de questions parmi des valeurs prédéfinies :
**10 — 25 (défaut) — 50 — Tout**

Les questions sont mélangées tous types confondus (pas regroupées par type). Si le pool disponible est plus petit que la valeur choisie, on utilise le pool complet.

### Déroulement d'une session

1. Écran de configuration : choisir les types de questions actifs, le niveau de difficulté (QCM) et le nombre de questions.
2. Les questions sont tirées aléatoirement (pool mélangé, sans répétition avant épuisement).
3. Après chaque réponse : feedback immédiat (✓ correct / ✗ incorrect + bonne réponse affichée).
4. Score affiché en permanence : **X bonnes réponses sur Y**.
5. À la fin de la session : écran récapitulatif avec le score final et un bouton « Rejouer ».
6. Le score ne persiste pas entre les sessions.

---

## Page Tableau

Deux vues accessibles via des onglets :

1. **Par région** — accordéon : chaque région se déplie pour afficher ses départements (numéro, nom). Les régions d'outre-mer apparaissent en bas de liste avec un séparateur visuel.
2. **Liste complète** — tous les 101 départements, triables par numéro ou par nom, avec un filtre texte en temps réel.

---

## Étapes d'implémentation

### Phase 1 — Scaffolding
1. `npm create vite@latest . -- --template react-ts`
2. Installer les dépendances : `react-router-dom`, `d3`, `tailwindcss`, `@types/d3`
3. Configurer Tailwind
4. Ajouter `Nav` + `App.tsx` avec les trois routes (`/carte`, `/quiz`, `/tableau`)

### Phase 2 — Données
5. Télécharger les fichiers GeoJSON (régions + départements incluant DROM) dans `src/geo/`
6. Écrire `src/data/departements.ts` et `src/data/regions.ts` (101 départements, 18 régions)

### Phase 3 — Carte
7. Construire `CarteFrance` avec projection D3 + paths SVG
8. Ajouter l'infobulle au survol
9. Ajouter les insets pour les 5 DROM
10. Ajouter le toggle couche régions / couche départements
11. Exposer le callback `onFeatureClick` pour le quiz

### Phase 4 — Tableau
12. Construire `TableauFlat` (tri + filtre)
13. Construire `AccordionRegions` (vue groupée)

### Phase 5 — Quiz
14. Construire le hook `useQuiz` (génération aléatoire, vérification, score)
15. Implémenter la logique de distracteurs selon la difficulté (facile / difficile)
16. Implémenter chacun des 5 types de questions
17. Construire `QuizShell` (affichage question, bandeau score, bouton Suivant)
18. Construire `QuizConfig` (sélection des types, niveau de difficulté)

### Phase 6 — Finitions
19. Mise en page responsive (carte adaptatrice à la taille de fenêtre)
20. Navigation clavier pour les QCM (touches 1–4)
21. Animations de feedback (flash vert / rouge sur la réponse)
22. Écran récapitulatif de fin de session

---

## Décisions actées

| Point | Décision |
|---|---|
| DOM-TOM | Inclus (971–976), affichés en insets sur la carte ; exclus des questions clic sur carte |
| Corse | Incluse dans la projection principale |
| Difficulté | Toggle Facile / Difficile, QCM uniquement (pas d'effet sur les questions carte) |
| Longueur de session | Choix parmi 10 / 25 (défaut) / 50 / Tout |
| Questions mélangées | Tous types confondus, pas regroupés par type |
| Score | Compteur simple : X bonnes réponses sur Y |
| Carte en mode quiz | Noms et numéros masqués, couche unique selon le type de question |
| Langue | Tout en français |
