import { test, expect } from '@playwright/test';

test.describe('PWA — mode hors ligne', () => {
  // Le service worker n'est disponible que sur le build de production.
  // En local (dev server), ce test est ignoré ; en CI, vite preview est utilisé.
  test('application disponible après coupure réseau', async ({ page, context }) => {
    test.skip(!process.env.CI, 'Requiert le build de production (service worker absent en dev)');
    // Premier chargement : active le service worker et remplit le cache
    await page.goto('/quiz');
    await page.locator('h1').first().waitFor({ state: 'visible', timeout: 15_000 });

    // Attend que le SW soit bien enregistré
    await page.evaluate(() =>
      navigator.serviceWorker.ready.then(() => true)
    );

    await context.setOffline(true);

    await page.reload();

    // L'app doit rester fonctionnelle (nav + contenu principal présents)
    await expect(page.getByRole('navigation', { name: 'Navigation principale' })).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10_000 });

    await context.setOffline(false);
  });
});
