import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const pages = [
  { name: 'Carte', path: '/carte', waitFor: 'svg.block' },
  { name: 'Quiz', path: '/quiz', waitFor: 'h1' },
  { name: 'Tableau', path: '/tableau', waitFor: 'button' },
] as const;

test.describe('Accessibilité (WCAG 2.1 AA)', () => {
  for (const { name, path, waitFor } of pages) {
    test(`${name} — aucune violation`, async ({ page }) => {
      await page.goto(path);
      await page.locator(waitFor).first().waitFor({ state: 'visible', timeout: 15_000 });

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      expect(results.violations).toEqual([]);
    });
  }
});
