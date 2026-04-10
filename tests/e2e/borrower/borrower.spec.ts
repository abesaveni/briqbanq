import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth';

test.describe('Borrower — Navigation & Core Pages', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'borrower');
  });

  const pages = [
    { label: 'Dashboard',    path: '/borrower/dashboard' },
    { label: 'My Case',      path: '/borrower/my-case' },
    { label: 'Notifications',path: '/borrower/notifications' },
    { label: 'Settings',     path: '/borrower/settings' },
  ];

  for (const { label, path } of pages) {
    test(`${label} loads without crash`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      await expect(page.locator('text=/Something went wrong/i')).not.toBeVisible();
      await expect(page.locator('h1, h2, [class*="heading"]').first()).toBeVisible();
    });
  }

  test('My Case shows case info or empty state', async ({ page }) => {
    await page.goto('/borrower/my-case');
    await page.waitForLoadState('networkidle');
    const hasCase = await page.locator('[class*="case"], [class*="card"], table').first().isVisible().catch(() => false);
    const hasEmpty = await page.locator('text=/no case|submit|get started/i').isVisible().catch(() => false);
    expect(hasCase || hasEmpty).toBeTruthy();
  });

  test('Settings page renders form', async ({ page }) => {
    await page.goto('/borrower/settings');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('input, select').first()).toBeVisible();
  });
});
