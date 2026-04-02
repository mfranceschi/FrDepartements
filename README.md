# Départements & Régions de France

Application web progressive (PWA) pour explorer et apprendre les 96 départements et 13 régions de France métropolitaine (Corse incluse).

## Fonctionnalités

### Carte interactive
- Visualisation SVG de la France avec D3.js
- Zoom et panoramique
- Survol / clic sur un département ou une région pour afficher ses informations

### Quiz
Cinq modes d'entraînement configurables :

| Mode | Description |
|---|---|
| **Dept. sur carte** | Cliquer sur le département demandé |
| **Région sur carte** | Cliquer sur la région demandée |
| **Numéro de dept.** | QCM — trouver le numéro d'un département |
| **Nom de dept.** | QCM — trouver le nom d'un département |
| **Région d'un dept.** | QCM — trouver la région d'appartenance |

Sessions de 5, 10, 20 ou tous les départements. Score en temps réel, récapitulatif par catégorie et mode « Revoir mes erreurs ».

### Tableau
Liste complète des départements organisée par région, avec codes et noms.

## Stack technique

| Couche | Technologie |
|---|---|
| UI | React 19 + TypeScript |
| Styles | Tailwind CSS v4 |
| Carte | D3.js v7 (SVG + GeoJSON) |
| Routing | React Router DOM v7 |
| Build | Vite 8 |
| PWA | vite-plugin-pwa (Workbox) |
| Tests unitaires | Vitest + Testing Library |
| Tests E2E | Playwright (Chromium) |
| Lint | ESLint 9 + typescript-eslint |

## Démarrage rapide

```bash
# Prérequis : Node.js 20+
npm install
npm run dev
# → http://localhost:5173
```

## Scripts disponibles

| Commande | Description |
|---|---|
| `npm run dev` | Serveur de développement Vite |
| `npm run build` | Vérification TypeScript + build de production |
| `npm run preview` | Prévisualiser le build de production |
| `npm run lint` | ESLint sur tout le projet |
| `npm test` | Tests unitaires (Vitest, mode run) |
| `npm run test:watch` | Tests unitaires en mode watch |
| `npm run test:e2e` | Tests E2E Playwright (lance le serveur dev automatiquement) |
| `npm run test:e2e:ui` | Interface graphique Playwright |

## Structure du projet

```
src/
├── components/
│   ├── carte/          # Carte SVG (couches depts, régions)
│   ├── quiz/           # Shell quiz + 5 types de questions
│   └── tableau/        # Tableau et accordéon par région
├── pages/              # CartePage, QuizPage, TableauPage
├── hooks/              # useQuiz (logique de session, Fisher-Yates)
├── data/               # Données statiques (départements, régions)
├── quiz/               # Types TypeScript du quiz
└── tests/              # Tests unitaires Vitest
e2e/                    # Tests E2E Playwright
public/                 # GeoJSON France + assets statiques
```

## PWA

L'application est installable sur tous les appareils. Le service worker Workbox met en cache :
- Tous les assets JS/CSS/HTML au moment du build
- Les fichiers GeoJSON (stratégie Cache-First, durée 30 jours)

La mise à jour se fait automatiquement (`autoUpdate`).

## CI/CD

La pipeline GitHub Actions (`.github/workflows/ci.yml`) comprend deux jobs :

**`build`** (bloquant — timeout 15 min) :
1. Lint ESLint
2. Vérification TypeScript (`tsc --noEmit`)
3. Tests unitaires Vitest
4. Build Vite de production
5. Upload de l'artefact `dist/`

**`e2e`** (dépend de `build` — timeout 20 min) :
1. Installation des navigateurs Playwright (Chromium)
2. Tests E2E complets (parcours quiz, navigation, score)
3. Upload du rapport Playwright (toujours disponible, conservation 7 jours)

Les tests E2E ont 2 tentatives automatiques en cas d'échec sur CI.
