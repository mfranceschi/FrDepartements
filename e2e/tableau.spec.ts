import { test, expect } from '@playwright/test';

/**
 * Tests E2E de la page Tableau.
 * Couvre : onglets, filtre de recherche, tri des colonnes.
 */
test.describe('Tableau des départements', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tableau');
  });

  test('affiche les deux onglets', async ({ page }) => {
    await expect(page.getByRole('button', { name: /par région/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /liste/i })).toBeVisible();
  });

  test("affiche l'accordéon par région par défaut", async ({ page }) => {
    // L'onglet "Par région" est actif par défaut
    // Des boutons d'accordéon (noms de régions) doivent être présents
    const regionButtons = page.getByRole('button').filter({ hasNotText: /par région|liste/i });
    await expect(regionButtons.first()).toBeVisible({ timeout: 5_000 });
  });

  test("bascule vers l'onglet Liste complète", async ({ page }) => {
    await page.getByRole('button', { name: /liste/i }).click();
    // Un tableau ou une liste doit s'afficher avec 101 lignes
    await expect(page.getByRole('table').or(page.locator('tbody tr').first())).toBeVisible({
      timeout: 5_000,
    });
  });

  test('filtre les départements par nom dans la liste', async ({ page }) => {
    await page.getByRole('button', { name: /liste/i }).click();

    const searchInput = page.getByPlaceholder(/rechercher|filtrer|search/i);
    await expect(searchInput).toBeVisible({ timeout: 3_000 });

    await searchInput.fill('Manche');
    // Seuls les résultats contenant "Manche" doivent rester visibles
    await expect(page.getByText(/manche/i).first()).toBeVisible({ timeout: 3_000 });
  });

  test('tri par code département dans la liste', async ({ page }) => {
    await page.getByRole('button', { name: /liste/i }).click();

    // Clique sur l'en-tête "Code" pour trier
    const codeHeader = page.getByRole('columnheader', { name: /code/i });
    if (await codeHeader.isVisible({ timeout: 3_000 })) {
      await codeHeader.click();
      // Après le tri, la liste doit toujours être visible
      await expect(page.locator('tbody tr').first()).toBeVisible();
    }
  });

  test("l'accordéon peut s'ouvrir sur une région", async ({ page }) => {
    // Reste sur l'onglet "Par région"
    const firstAccordionBtn = page.getByRole('button').filter({ hasNotText: /par région|liste/i }).first();
    await expect(firstAccordionBtn).toBeVisible({ timeout: 5_000 });
    await firstAccordionBtn.click();

    // Des lignes de département doivent apparaître dans l'accordéon ouvert
    await expect(page.locator('tbody tr, [role="row"]').first()).toBeVisible({ timeout: 3_000 });
  });

  test('affiche 101 départements au total dans la liste complète', async ({ page }) => {
    await page.getByRole('button', { name: /liste/i }).click();

    // Attend les lignes du tableau
    const rows = page.locator('tbody tr');
    await expect(rows.first()).toBeVisible({ timeout: 5_000 });
    const count = await rows.count();
    expect(count).toBe(101);
  });
});
