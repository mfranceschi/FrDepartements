import { test, expect, type Page } from '@playwright/test';

/**
 * Tests E2E de la page Carte.
 * Couvre : chargement, recherche, sélecteur de couche, zoom.
 */
test.describe('Carte interactive', () => {
  test.describe.configure({ mode: 'serial' });

  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto('/carte');
    // Premier chargement : attend le GeoJSON (lourd). Les tests suivants bénéficient
    // du cache HTTP de ce contexte partagé.
    await expect(page.locator('svg.block')).toBeVisible({ timeout: 15_000 });
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('affiche la carte SVG avec les départements', async () => {
    await expect(page.locator('.couche-depts path').first()).toBeVisible({ timeout: 10_000 });
  });

  test('affiche les boutons de zoom', async () => {
    // exact:true évite que "Dézoomer" soit aussi matché par la recherche partielle "Zoomer"
    await expect(page.getByTitle('Zoomer', { exact: true })).toBeVisible();
    await expect(page.getByTitle('Dézoomer', { exact: true })).toBeVisible();
    await expect(page.getByTitle('Réinitialiser le zoom', { exact: true })).toBeVisible();
  });

  test('peut zoomer via le bouton +', async () => {
    const zoomInBtn = page.getByTitle('Zoomer', { exact: true });
    await zoomInBtn.click();
    await zoomInBtn.click();
    // La carte principale (pas les icônes SVG) doit toujours être visible après zoom
    await expect(page.locator('svg.block')).toBeVisible();
  });

  test('affiche le sélecteur de couche Départements / Régions', async () => {
    await expect(page.getByRole('button', { name: /départements/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /régions/i })).toBeVisible();
  });

  test('bascule vers la couche Régions', async () => {
    await page.getByRole('button', { name: /régions/i }).click();
    // La couche régions doit apparaître
    await expect(page.locator('.couche-regions path').first()).toBeVisible({ timeout: 5_000 });
  });

  test('la barre de recherche filtre les résultats', async () => {
    // Sur desktop, c'est l'input de la sidebar (hidden lg:block) qui est visible
    const searchInput = page.getByPlaceholder(/rechercher|search/i).filter({ visible: true });
    await expect(searchInput).toBeVisible();

    await searchInput.fill('Paris');
    // Des suggestions doivent apparaître (filter visible car le dropdown existe aussi dans la barre mobile cachée)
    await expect(page.getByText(/paris/i).filter({ visible: true }).first()).toBeVisible({ timeout: 3_000 });
  });

  test('cliquer sur un résultat de recherche met à jour la sidebar', async () => {
    const searchInput = page.getByPlaceholder(/rechercher|search/i).filter({ visible: true });
    await searchInput.fill('Finistère');

    const suggestion = page.getByText(/finistère/i).filter({ visible: true }).first();
    await expect(suggestion).toBeVisible({ timeout: 3_000 });
    await suggestion.click();

    // La sidebar doit afficher le titre "Finistère" (heading dans le panneau)
    await expect(page.getByRole('heading', { name: /finistère/i })).toBeVisible();
  });

  test('cliquer directement sur un path SVG de la couche depts met à jour la sidebar', async () => {
    // Reload pour retrouver un état propre (sidebar vide, couche depts active).
    // Rapide car le GeoJSON est déjà dans le cache HTTP du contexte partagé.
    await page.goto('/carte');
    await expect(page.locator('svg.block')).toBeVisible({ timeout: 8_000 });

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

  test('affiche le checkbox "Cours d\'eau" dans la toolbar', async () => {
    await expect(page.getByLabel(/cours d'eau/i)).toBeVisible();
  });

  test('cliquer sur un path SVG de la couche régions met à jour la sidebar', async () => {
    // Bascule vers la couche régions
    await page.getByRole('button', { name: /régions/i }).click();
    await expect(page.locator('.couche-regions path').first()).toBeVisible({ timeout: 5_000 });

    // Clic sur le premier path région
    await page.locator('.couche-regions path').first().click({ force: true });

    // Une info de région doit s'afficher (code à 2 chiffres + libellé « Région »)
    await expect(
      page.getByRole('complementary').getByText('Région', { exact: true }),
    ).toBeVisible({ timeout: 5_000 });
  });
});

// Describe séparé : le hook charge le vrai fleuves.json depuis public/ (lent en Playwright,
// ~20s à cause du stream CDP) — test.slow() triple le timeout à 90s.
// Les deux tests partagent la même page (serial) : fleuves.json n'est chargé qu'une seule fois.
test.describe('Carte interactive – couche fleuves', () => {
  test.describe.configure({ mode: 'serial' });

  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto('/carte');
    await expect(page.locator('svg.block')).toBeVisible({ timeout: 15_000 });
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('cocher "Cours d\'eau" charge et affiche les paths de fleuves', async () => {
    test.slow();
    await page.getByLabel(/cours d'eau/i).check();
    await expect(page.locator('.couche-fleuves path').first()).toBeVisible({ timeout: 50_000 });
  });

  test('survoler un fleuve affiche un tooltip avec son nom', async () => {
    // Les fleuves sont déjà chargés par le test précédent (contexte partagé).
    const hitPath = page.locator('.couche-fleuves path[stroke="transparent"]').first();
    await expect(hitPath).toBeAttached({ timeout: 5_000 });

    await hitPath.hover({ force: true });

    const tooltip = page.locator('div.fixed.z-50.pointer-events-none');
    await expect(tooltip).toBeVisible({ timeout: 5_000 });
    const text = await tooltip.textContent();
    expect(text).toBeTruthy();
    expect(text!.length).toBeGreaterThan(0);
  });
});
