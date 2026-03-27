import { test, expect } from '@playwright/test';

/**
 * Tests E2E de la page Carte.
 * Couvre : chargement, recherche, sélecteur de couche, zoom.
 */
test.describe('Carte interactive', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/carte');
    // Attend que la carte SVG soit rendue (GeoJSON chargé)
    await expect(page.locator('svg')).toBeVisible({ timeout: 15_000 });
  });

  test('affiche la carte SVG avec les départements', async ({ page }) => {
    // Le groupe de couche des départements doit contenir des paths
    await expect(page.locator('.couche-depts path').first()).toBeVisible({ timeout: 10_000 });
  });

  test('affiche les boutons de zoom', async ({ page }) => {
    await expect(page.getByTitle('Zoomer')).toBeVisible();
    await expect(page.getByTitle('Dézoomer')).toBeVisible();
    await expect(page.getByTitle('Réinitialiser le zoom')).toBeVisible();
  });

  test('peut zoomer via le bouton +', async ({ page }) => {
    // Clique plusieurs fois pour zoomer
    const zoomInBtn = page.getByTitle('Zoomer');
    await zoomInBtn.click();
    await zoomInBtn.click();
    // La carte doit toujours être visible après zoom
    await expect(page.locator('svg')).toBeVisible();
  });

  test('affiche le sélecteur de couche Départements / Régions', async ({ page }) => {
    await expect(page.getByRole('button', { name: /départements/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /régions/i })).toBeVisible();
  });

  test('bascule vers la couche Régions', async ({ page }) => {
    await page.getByRole('button', { name: /régions/i }).click();
    // La couche régions doit apparaître
    await expect(page.locator('.couche-regions path').first()).toBeVisible({ timeout: 5_000 });
  });

  test('la barre de recherche filtre les résultats', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/rechercher|search/i);
    await expect(searchInput).toBeVisible();

    await searchInput.fill('Paris');
    // Des suggestions doivent apparaître
    await expect(page.getByText(/paris/i).first()).toBeVisible({ timeout: 3_000 });
  });

  test('cliquer sur un résultat de recherche met à jour la sidebar', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/rechercher|search/i);
    await searchInput.fill('Finistère');

    const suggestion = page.getByText(/finistère/i).first();
    await expect(suggestion).toBeVisible({ timeout: 3_000 });
    await suggestion.click();

    // La sidebar doit afficher les infos du Finistère (code 29)
    await expect(page.getByText(/finistère/i)).toBeVisible();
  });

  test('cliquer directement sur un path SVG de la couche depts met à jour la sidebar', async ({ page }) => {
    // Vérifie que le message par défaut est présent avant le clic
    await expect(
      page.getByText(/cliquez sur un département/i),
    ).toBeVisible({ timeout: 5_000 });

    // Clic direct sur le premier path SVG de la couche départements
    await page.locator('.couche-depts path').first().click({ force: true });

    // Le message par défaut doit avoir disparu et une info de département doit s'afficher.
    // On vérifie la présence d'un code de département (format 2 chiffres ou 2A/2B)
    await expect(
      page.getByRole('complementary').getByText(/^\d{2,3}$|^2[AB]$/),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('cliquer sur un path SVG de la couche régions met à jour la sidebar', async ({ page }) => {
    // Bascule vers la couche régions
    await page.getByRole('button', { name: /régions/i }).click();
    await expect(page.locator('.couche-regions path').first()).toBeVisible({ timeout: 5_000 });

    // Clic sur le premier path région
    await page.locator('.couche-regions path').first().click({ force: true });

    // Une info de région doit s'afficher (code à 2 chiffres + libellé « Région »)
    await expect(
      page.getByRole('complementary').getByText('Région'),
    ).toBeVisible({ timeout: 5_000 });
  });
});
