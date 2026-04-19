# ship — Expédition

Tu es en mode **expédition**. Suis ces étapes dans l'ordre, sans sauter aucune.

---

## Étape 1 — Prise de connaissance des changements locaux

**Avant toute chose**, lis et mémorise l'intégralité des changements en cours :
```
git status
git diff HEAD
```

Lis chaque fichier modifié. Pour chacun, comprends :
- Quelle nouvelle feature ou modification est introduite
- Quelle est l'intention derrière le changement

Rédige immédiatement un **brouillon de message de commit** (format `type(scope): description courte`) qui capture fidèlement l'intention de ces changements. Présente-le à l'utilisateur.

> **Règle fondamentale** : ce brouillon représente ce qui **doit** être expédié. Toute la suite du processus (lint, build, tests) doit aboutir à shipper ces changements — pas à les annuler. Si des tests échouent, c'est eux qu'il faut adapter, pas les nouvelles features.

Ensuite, cherche dans les fichiers modifiés :
- Des bugs évidents ou erreurs de logique
- Du code mort, des duplications, des noms trompeurs
- Des améliorations de lisibilité ou de robustesse qui sont **sans risque**

Règles strictes pour les modifications cosmétiques :
- Ne modifie que ce qui est clairement améliorable sans changer le comportement observable
- N'ajoute pas de features, ne refactorise pas au-delà des fichiers touchés
- En cas de doute sur l'impact, laisse tel quel
- TypeScript strict est actif : pas d'`any`, pas de variables inutilisées

Après tes éventuelles modifications, présente un récapitulatif concis de ce que tu as changé et pourquoi. Si tu n'as rien changé, dis-le explicitement.

---

## Étape 2 — Pipeline CI locale

### 2.0 — Décision : faut-il exécuter la CI ?

Avant de lancer quoi que ce soit, détermine si des fichiers de **code exécutable** ont été modifiés. Sont considérés comme code exécutable :

- Fichiers `*.ts` ou `*.tsx` dans `src/`
- Fichiers de configuration : `vite.config.*`, `tsconfig*.json`, `eslint.config.*`, `vitest.config.*`
- Fichiers `*.css` dans `src/`

Ne sont **pas** du code exécutable (CI inutile) :

- Fichiers `*.md`
- Données statiques : `src/data/*.json`, `public/**`
- Assets : images, fonts, icônes

**Si aucun fichier exécutable n'est modifié** : annonce-le explicitement ("Aucun code exécutable modifié — CI locale ignorée") et passe directement à l'étape 3.

**Si au moins un fichier exécutable est modifié** : continue avec les étapes 2a–2d ci-dessous.

Lance chaque commande **dans l'ordre**. Si une étape échoue, tente un correctif et relance avant de passer à la suivante. Si tu ne peux pas corriger avec confiance, arrête et explique la situation à l'utilisateur.

### 2a. Lint
```
npm run lint
```
En cas d'erreur : corrige les violations ESLint dans les fichiers concernés, puis relance.

### 2b. Build (TypeScript + Vite)
```
npm run build
```
En cas d'erreur : corrige les erreurs TypeScript ou de build, puis relance.

### 2c. Tests unitaires
```
npm test
```
En cas d'échec : avant de toucher quoi que ce soit, diagnostique la cause de l'échec en te référant au brouillon de commit de l'étape 1. Trois cas possibles :

- **Le test testait l'ancien comportement** (le changement local est intentionnel et correct) → mets le test à jour pour refléter le nouveau comportement.
- **Le changement local a introduit un vrai bug** (le test a raison de lever une alarme) → corrige le bug dans le code, sans toucher au test.
- **Le test est fragile ou mal écrit** (l'échec n'est pas lié au changement) → refactorise le test.

Ne reviens jamais sur une feature ou une modification locale pour faire passer un test sans avoir d'abord déterminé dans quel cas tu te trouves.

### 2d. Tests E2E
```
npm run test:e2e
```
En cas d'échec : même diagnostic en trois cas — adapte le test Playwright si le comportement a légitimement changé, corrige le code s'il y a un vrai bug, ne supprime pas ou ne contourne pas la feature.

Une fois que les 4 étapes passent, annonce-le clairement et passe à l'étape 3.

---

## Étape 3 — Commit et push

1. Affiche le diff complet qui sera commité :
   ```
   git diff HEAD
   ```

2. Rédige un message de commit en respectant le style du projet (vérifie avec `git log --oneline -10`). Format attendu : `type(scope): description courte`.

3. Crée le commit et pousse directement :
   ```
   git add -p   # ou git add <fichiers spécifiques>
   git commit -m "..."
   git push
   ```

---

## Étape 4 — Surveillance de la CI GitHub

Après le push, surveille la pipeline GitHub Actions :

1. Attends quelques secondes que la run soit créée, puis récupère-la :
   ```
   gh run list --limit 3
   ```

2. Surveille jusqu'à completion :
   ```
   gh run watch <run-id>
   ```
   (ou relance `gh run view <run-id>` toutes les 30 secondes si `watch` n'est pas disponible)

3. **Si la CI passe** : annonce le succès. L'expédition est terminée.

4. **Si la CI échoue** :
   - Récupère les logs d'erreur : `gh run view <run-id> --log-failed`
   - Analyse la cause racine
   - Présente clairement à l'utilisateur :
     - Ce qui a échoué (quelle job, quel step)
     - Pourquoi ça a échoué (analyse du log)
     - Quelle correction tu suggères (avec le diff proposé)
   - **Ne modifie rien.** Demande : "Veux-tu que j'applique cette correction ?"
   - Attends la réponse avant toute action.
