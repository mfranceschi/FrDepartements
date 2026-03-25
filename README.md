# Départements & Régions de France

Application web monopage pour explorer et apprendre les départements et régions français. Interface entièrement en français.

## Fonctionnalités

### Carte interactive
- Carte SVG de la France métropolitaine avec projection conique conforme (D3.js)
- Bascule entre la couche **Départements** et la couche **Régions**
- Infobulle au survol (nom + numéro)
- Clic sur un territoire : panneau latéral avec nom, code et région parente
- **Inset Île-de-France** agrandi pour les 8 petits départements de la région parisienne
- **Insets Outre-mer** : Guadeloupe, Martinique, Guyane, La Réunion, Mayotte

### Tableau de référence
- **Liste complète** : 101 départements triables (numéro, nom, région) et filtrables en temps réel
- **Vue par région** : accordéon affichant les départements groupés par région, régions d'outre-mer séparées en bas
- Ordre de tri numérique correct pour 2A et 2B (positionnés en 20)

### Quiz géographique
5 types de questions, configurables avant chaque session :

| Type | Question | Saisie |
|---|---|---|
| Trouver un département | « Cliquez sur le département *Finistère* (29) » | Clic sur la carte |
| Trouver une région | « Cliquez sur la région *Bretagne* » | Clic sur la carte |
| Deviner le numéro | « Quel est le numéro du département *Gironde* ? » | QCM 4 choix |
| Deviner le nom | « Quel département porte le numéro *33* ? » | QCM 4 choix |
| Deviner la région | « Dans quelle région se trouve la *Gironde* ? » | QCM 4 choix |

**Configuration de session :**
- Sélection des types de questions actifs
- Difficulté des QCM : *Facile* (distracteurs aléatoires) ou *Difficile* (distracteurs de la même région)
- Longueur : 10 / 25 (défaut) / 50 / Tout
- Navigation clavier : touches `1`–`4` pour répondre, `Entrée` pour passer à la question suivante
- Feedback immédiat avec animation après chaque réponse
- Score en temps réel et récapitulatif de fin de session

## Stack technique

| | |
|---|---|
| Framework | React 19 + Vite |
| Langage | TypeScript |
| Carte | D3.js + GeoJSON |
| Style | Tailwind CSS v4 |
| Routing | React Router v6 |

Aucun backend — tout tourne dans le navigateur depuis des fichiers statiques.

## Données

- Contours géographiques : [france-geojson](https://github.com/gregoiredavid/france-geojson) (gregoiredavid)
- 18 régions (13 métropolitaines + 5 DROM) et 101 départements (96 métropolitains + 5 DROM)

## Lancer le projet

```bash
npm install
npm run dev
```
