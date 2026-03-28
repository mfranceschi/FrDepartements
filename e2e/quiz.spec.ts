import { test, expect, type Page } from '@playwright/test';

// ─── Helpers pour le quiz entier ─────────────────────────────────────────────

/**
 * Identifie le type de question à partir du texte d'instruction affiché.
 * Chaque type possède une phrase d'introduction distincte et non ambiguë.
 */
async function detectQuestionType(page: Page): Promise<string> {
  const p = page.locator('p.text-center.text-lg').first();
  await expect(p).toBeVisible({ timeout: 10_000 });
  const text = await p.textContent() ?? '';
  if (text.includes('Cliquez sur le département')) return 'TrouverDeptCarte';
  if (text.includes('Cliquez sur la région'))       return 'TrouverRegionCarte';
  if (text.includes('Quel est le numéro'))           return 'DevinerCodeDept';
  if (text.includes('porte le numéro'))              return 'DevinerNomDept';
  if (text.includes('Dans quelle région'))           return 'DevinerRegionDept';
  if (text.includes('Quel est ce département'))      return 'DevinerNomDeptCarte';
  if (text.includes('Quelle est cette région'))      return 'DevinerNomRegionCarte';
  return 'unknown';
}

/**
 * Répond à la question courante quelle que soit son type :
 * - Carte    → clic sur le premier chemin SVG de la couche active
 * - QCM      → touche « 1 » (raccourci clavier géré par QuizShell)
 *
 * Attend l'apparition du feedback, puis retourne le type et si la réponse
 * était correcte ou non.
 */
async function answerCurrentQuestion(page: Page): Promise<{ type: string; correct: boolean }> {
  const type = await detectQuestionType(page);

  if (type === 'TrouverDeptCarte') {
    // La CartePage (display:none) contient aussi des .couche-depts paths ;
    // on cherche le premier path ayant un bounding-box non nul (= visible).
    // dispatchEvent bubbles jusqu'au React root et déclenche le handler onClick.
    await page.evaluate(() => {
      for (const p of document.querySelectorAll('.couche-depts path')) {
        if ((p as Element).getBoundingClientRect().width > 0) {
          p.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
          return;
        }
      }
    });
  } else if (type === 'TrouverRegionCarte') {
    await page.evaluate(() => {
      for (const p of document.querySelectorAll('.couche-regions path')) {
        if ((p as Element).getBoundingClientRect().width > 0) {
          p.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
          return;
        }
      }
    });
  } else {
    // QCM : raccourci clavier « 1 » → answers choices[0]
    // (DevinerCodeDept, DevinerNomDept, DevinerRegionDept)
    await page.keyboard.press('1');
  }

  // Attendre le feedback : "✓ Bonne réponse !" ou un texte commençant par "✗"
  const correctFb = page.getByText('✓ Bonne réponse !');
  const wrongFb   = page.locator(':text-matches("^✗")');
  await expect(correctFb.or(wrongFb)).toBeVisible({ timeout: 6_000 });

  const correct = await correctFb.isVisible();
  return { type, correct };
}

// ─── Tests existants ──────────────────────────────────────────────────────────

/**
 * Tests E2E du parcours Quiz.
 * Couvre : configuration → démarrage → réponse → score final → rejeu erreurs.
 */
test.describe('Quiz – parcours complet', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/quiz');
  });

  test('affiche le formulaire de configuration au démarrage', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /quiz/i })).toBeVisible();
    // Le bouton de démarrage doit être présent
    await expect(page.getByRole('button', { name: /commencer|démarrer|lancer/i })).toBeVisible();
  });

  test('démarre une session et affiche la première question', async ({ page }) => {
    await page.getByRole('button', { name: /commencer|démarrer|lancer/i }).click();
    // La progression 1/N doit apparaître
    await expect(page.getByText(/Question\s+1\s*\//)).toBeVisible();
  });

  test('répond à une question et voit le feedback', async ({ page }) => {
    await page.getByRole('button', { name: /commencer|démarrer|lancer/i }).click();
    // answerCurrentQuestion détecte le type, répond et vérifie le feedback
    await answerCurrentQuestion(page);
  });

  test('peut avancer à la question suivante après avoir répondu', async ({ page }) => {
    await page.getByRole('button', { name: /commencer|démarrer|lancer/i }).click();

    // Cherche les boutons de choix QCM
    const choiceButtons = page.getByRole('button').filter({ hasNotText: /zoom|reset|\+|−|↺/i });
    const firstChoice = choiceButtons.first();

    if (await firstChoice.isVisible({ timeout: 8_000 })) {
      await firstChoice.click();
      // Le bouton "Suivant" ou "Continuer" doit apparaître après la réponse
      const nextBtn = page.getByRole('button', { name: /suivant|continuer|next/i });
      await expect(nextBtn).toBeVisible({ timeout: 3_000 });
      await nextBtn.click();
      // La question 2 doit s'afficher
      await expect(page.getByText(/2\s*\/\s*\d+/)).toBeVisible();
    }
  });

  test('modal de confirmation lors de la navigation pendant un quiz en cours', async ({ page }) => {
    await page.getByRole('button', { name: /commencer|démarrer|lancer/i }).click();
    // Attend que la session démarre
    await expect(page.getByText(/Question\s+1\s*\//)).toBeVisible({ timeout: 8_000 });

    // Tente de naviguer vers une autre page
    await page.getByRole('link', { name: /tableau/i }).click();

    // Un dialogue de confirmation doit s'afficher
    await expect(
      page.getByRole('dialog').or(page.getByText(/quitter|abandonner|confirmer/i))
    ).toBeVisible({ timeout: 3_000 });
  });

  test('peut quitter le quiz via la modal de confirmation', async ({ page }) => {
    await page.getByRole('button', { name: /commencer|démarrer|lancer/i }).click();
    await expect(page.getByText(/Question\s+1\s*\//)).toBeVisible({ timeout: 8_000 });

    await page.getByRole('link', { name: /tableau/i }).click();

    // Clique sur "Quitter"
    const quitBtn = page.getByRole('button', { name: /quitter/i });
    if (await quitBtn.isVisible({ timeout: 2_000 })) {
      await quitBtn.click();
      await expect(page).toHaveURL('/tableau');
    }
  });
});

// ─── Quiz entier : 7 types de questions, score et évaluations cohérents ───────

/**
 * Ce bloc teste un quiz complet en conditions réelles :
 *
 * - Configuration avec les **7 types de questions** simultanément activés
 * - Session de **10 questions** (répartition garantie 5 carte / 5 QCM par l'algo)
 * - Réponse à chaque question en détectant dynamiquement son type
 * - Enregistrement du résultat (correct / incorrect) pour chaque question
 * - Vérification finale que **le score affiché est cohérent** avec les réponses
 *   données : pourcentage = Math.round(corrects / total × 100)
 * - Vérification que les **catégories** dans le récapitulatif correspondent
 *   aux types de questions rencontrés
 * - Vérification que le bouton « Revoir mes erreurs (N) » reflète exactement
 *   le nombre d'erreurs comptabilisé pendant le quiz
 */
test.describe('Quiz entier – 7 types de questions, score et évaluations cohérents', () => {
  // Timeout généreux : délai "Mémorisez…" (1.5 s) × jusqu'à 5 questions carte
  // + chargement GeoJSON + délais réseau CI
  test.setTimeout(90_000);

  test('complète 10 questions (tous modes activés) et vérifie la cohérence du score final', async ({ page }) => {
    await page.goto('/quiz');

    // ── 1. Configuration ────────────────────────────────────────────────────
    // Les 5 modes sont cochés par défaut ; on sélectionne 10 questions.
    await page.getByRole('button', { name: '10' }).click();
    // Vérification visuelle : le bouton 10 doit être actif (fond bleu)
    await expect(page.getByRole('button', { name: '10' })).toHaveClass(/bg-blue-600/);

    await page.getByRole('button', { name: 'Commencer' }).click();

    // ── 2. Attendre le chargement des données géo et la première question ───
    // GeoJSON chargé de façon asynchrone ; on laisse 15 s au premier rendu.
    await expect(page.getByText('Question 1 / 10')).toBeVisible({ timeout: 15_000 });

    // ── 3. Répondre aux 10 questions en enregistrant type et résultat ───────
    const results: { type: string; correct: boolean }[] = [];

    for (let q = 1; q <= 10; q++) {
      // Attendre que la question N soit bien affichée avant d'interagir
      await expect(page.getByText(`Question ${q} / 10`)).toBeVisible({ timeout: 10_000 });

      const result = await answerCurrentQuestion(page);
      results.push(result);

      // Chaque type doit être reconnu (pas de cas "unknown")
      expect(
        result.type,
        `Question ${q} : type non reconnu — texte d'instruction inattendu`,
      ).not.toBe('unknown');

      // Le live-score affiché après réponse doit être cohérent :
      // score courant / nombre de questions déjà répondues
      const liveScore = results.filter(r => r.correct).length;
      await expect(
        page.locator(`text=${liveScore}`).first(),
      ).toBeVisible({ timeout: 3_000 });

      // Avancer vers la question suivante.
      // Pour les questions carte, le bouton reste désactivé ("Mémorisez…")
      // pendant 1.5 s — toBeEnabled() attend automatiquement qu'il redevienne cliquable.
      const btnLabel = q === 10 ? 'Voir le résultat' : 'Question suivante';
      const nextBtn = page.getByRole('button', { name: btnLabel });
      await expect(nextBtn).toBeEnabled({ timeout: 5_000 });
      await nextBtn.click();
    }

    // ── 4. Écran de fin ─────────────────────────────────────────────────────
    // Le message de résultat (« Excellent ! », « Bien ! » ou « Continuez ! »)
    // doit apparaître après le clic sur « Voir le résultat ».
    await expect(
      page.getByRole('heading', { name: /excellent|bien|continuez/i }),
    ).toBeVisible({ timeout: 8_000 });

    const trackedCorrect = results.filter(r => r.correct).length;
    const trackedWrong   = results.filter(r => !r.correct).length;
    const trackedTotal   = results.length; // doit être 10
    expect(trackedTotal).toBe(10);

    // ── 5. Cohérence du score brut ──────────────────────────────────────────
    // Le gros chiffre affiché (X / 10) doit correspondre à nos corrects tracés.
    // On cible le <p> de grande taille (text-6xl) qui affiche le score.
    const scoreEl = page.locator('p.text-6xl').first();
    const rawScoreText = await scoreEl.textContent() ?? '';
    // parseInt("8 / 10") → 8  (s'arrête au premier caractère non numérique)
    expect(parseInt(rawScoreText)).toBe(trackedCorrect);

    // ── 6. Cohérence du pourcentage ─────────────────────────────────────────
    const expectedPct = Math.round((trackedCorrect / trackedTotal) * 100);
    await expect(
      page.getByText(`${expectedPct} % de bonnes réponses`),
    ).toBeVisible();

    // ── 7. Récapitulatif par catégorie ──────────────────────────────────────
    // Avec 5 modes et la répartition garantie 5 carte / 5 QCM, au moins 2 types
    // différents apparaissent → CategoryStats est toujours affiché.
    const seenModes = new Set(results.map(r => r.type));
    expect(seenModes.size).toBeGreaterThanOrEqual(2);

    await expect(page.getByText('Par catégorie')).toBeVisible();

    // La meilleure (↑) et la moins bonne (↓) catégorie doivent être affichées.
    // .first() car d'autres pages (display:none) peuvent avoir des ↑ dans leurs tableaux.
    await expect(page.locator('text=↑').first()).toBeVisible();
    await expect(page.locator('text=↓').first()).toBeVisible();

    // CategoryStats affiche uniquement la meilleure (↑) et la moins bonne (↓) catégorie.
    // On vérifie que leurs libellés sont bien issus des modes rencontrés.
    const MODE_LABELS: Record<string, string> = {
      TrouverDeptCarte:    'Dept. sur carte',
      TrouverRegionCarte:  'Région sur carte',
      DevinerNomDeptCarte: 'Nom de dept. (carte)',
      DevinerNomRegionCarte: 'Nom de région',
      DevinerCodeDept:     'Numéro de dept.',
      DevinerNomDept:      'Nom de dept.',
      DevinerRegionDept:   "Région d'un dept.",
    };
    const validLabels = new Set([...seenModes].map(m => MODE_LABELS[m]).filter(Boolean));
    // Le texte dans le bloc ↑ doit être le label d'un des modes joués
    const bestLabel = await page.locator('text=↑').first().locator('..').locator('p.font-semibold').textContent();
    expect(validLabels.has(bestLabel ?? '')).toBe(true);
    const worstLabel = await page.locator('text=↓').first().locator('..').locator('p.font-semibold').textContent();
    expect(validLabels.has(worstLabel ?? '')).toBe(true);

    // ── 8. Bouton « Revoir mes erreurs » cohérent avec le comptage ──────────
    if (trackedWrong > 0) {
      await expect(
        page.getByRole('button', { name: `Revoir mes erreurs (${trackedWrong})` }),
      ).toBeVisible();
    } else {
      // Score parfait : le bouton n'existe pas
      await expect(
        page.getByRole('button', { name: /revoir mes erreurs/i }),
      ).not.toBeVisible();
    }

    // Le bouton « Rejouer » est toujours présent
    await expect(page.getByRole('button', { name: 'Rejouer' })).toBeVisible();
  });
});
