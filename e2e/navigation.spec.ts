import { test, expect } from '@playwright/test';

/**
 * Tests de navigation entre les trois pages de l'application.
 * Vérifie que les liens Nav fonctionnent et que l'URL change correctement.
 */
test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/carte');
  });

  test('affiche la page Carte par défaut', async ({ page }) => {
    await expect(page).toHaveURL('/carte');
    // La carte SVG principale doit être présente (svg.block = CarteFrance, pas les icônes nav)
    await expect(page.locator('svg.block')).toBeVisible();
  });

  test('redirige / vers /quiz', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/quiz');
  });

  test('redirige une URL invalide vers /quiz', async ({ page }) => {
    await page.goto('/inexistant');
    await expect(page).toHaveURL('/quiz');
  });

  test('navigue vers la page Quiz', async ({ page }) => {
    await page.getByRole('link', { name: /quiz/i }).click();
    await expect(page).toHaveURL('/quiz');
    // La config quiz doit être visible
    await expect(page.getByRole('heading', { name: /quiz/i })).toBeVisible();
  });

  test('navigue vers la page Tableau', async ({ page }) => {
    await page.getByRole('link', { name: /tableau/i }).click();
    await expect(page).toHaveURL('/tableau');
    // Les onglets du tableau doivent être présents
    await expect(page.getByRole('button', { name: /par région/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /liste/i })).toBeVisible();
  });

  test('navigue entre toutes les pages en séquence', async ({ page }) => {
    await page.getByRole('link', { name: /quiz/i }).click();
    await expect(page).toHaveURL('/quiz');

    await page.getByRole('link', { name: /tableau/i }).click();
    await expect(page).toHaveURL('/tableau');

    await page.getByRole('link', { name: /carte/i }).click();
    await expect(page).toHaveURL('/carte');
  });
});
