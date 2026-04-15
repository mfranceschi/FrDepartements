# ship — Expédition

Tu es en mode **expédition**. Suis ces étapes dans l'ordre, sans sauter aucune.

---

## Étape 1 — Auto-revue du code non commité

Commence par récupérer l'état des changements :
```
git status
git diff HEAD
```

Lis chaque fichier modifié. Pour chacun, cherche :
- Des bugs évidents ou erreurs de logique
- Du code mort, des duplications, des noms trompeurs
- Des améliorations de lisibilité ou de robustesse qui sont **sans risque**

Règles strictes pour les modifications :
- Ne modifie que ce qui est clairement améliorable sans changer le comportement observable
- N'ajoute pas de features, ne refactorise pas au-delà des fichiers touchés
- En cas de doute sur l'impact, laisse tel quel
- TypeScript strict est actif : pas d'`any`, pas de variables inutilisées

Après tes éventuelles modifications, présente un récapitulatif concis de ce que tu as changé et pourquoi. Si tu n'as rien changé, dis-le explicitement.

---

## Étape 2 — Pipeline CI locale

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
En cas d'échec : analyse le test qui échoue, corrige le code source (pas le test sauf s'il est manifestement erroné), puis relance.

### 2d. Tests E2E
```
npm run test:e2e
```
En cas d'échec : analyse le test Playwright qui échoue, corrige le code source, puis relance.

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
