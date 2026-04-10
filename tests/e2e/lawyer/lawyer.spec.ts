import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth';

test.describe('Lawyer — Navigation & Core Pages', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'lawyer');
  });

  const pages = [
    { label: 'Dashboard',        path: '/lawyer/dashboard' },
    { label: 'Assigned Cases',   path: '/lawyer/assigned-cases' },
    { label: 'Contract Review',  path: '/lawyer/contract-review' },
    { label: 'Task Center',      path: '/lawyer/task-center' },
    { label: 'KYC Review',       path: '/lawyer/kyc-review' },
    { label: 'Live Auctions',    path: '/lawyer/live-auctions' },
    { label: 'Reports',          path: '/lawyer/reports' },
    { label: 'Notifications',    path: '/lawyer/notifications' },
    { label: 'Settings',         path: '/lawyer/settings' },
  ];

  for (const { label, path } of pages) {
    test(`${label} loads without crash`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      await expect(page.locator('text=/Something went wrong/i')).not.toBeVisible();
      await expect(page.locator('h1, h2, [class*="heading"]').first()).toBeVisible();
    });
  }

  // Lawyer fix: Heading fonts are correct (not system default)
  test('Dashboard heading uses Inter font', async ({ page }) => {
    await page.goto('/lawyer/dashboard');
    await page.waitForLoadState('networkidle');
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible();
    const fontFamily = await h1.evaluate(el => getComputedStyle(el).fontFamily);
    expect(fontFamily.toLowerCase()).toContain('inter');
  });

  // Lawyer fix: Settings Profile tab shows inline validation errors
  test('Settings Profile tab renders form fields', async ({ page }) => {
    await page.goto('/lawyer/settings');
    await page.waitForLoadState('networkidle');
    const profileTab = page.locator('button:has-text("Profile"), a:has-text("Profile")').first();
    if (await profileTab.isVisible().catch(() => false)) {
      await profileTab.click();
      await page.waitForTimeout(400);
    }
    await expect(page.locator('input[name="firstName"], input[placeholder*="First"]').first()).toBeVisible();
    await expect(page.locator('input[name="lastName"], input[placeholder*="Last"]').first()).toBeVisible();
  });

  test('Settings Profile inline validation shows errors on empty save', async ({ page }) => {
    await page.goto('/lawyer/settings');
    await page.waitForLoadState('networkidle');
    const profileTab = page.locator('button:has-text("Profile"), a:has-text("Profile")').first();
    if (await profileTab.isVisible().catch(() => false)) await profileTab.click();

    const firstNameInput = page.locator('input[name="firstName"], input[placeholder*="First"]').first();
    if (await firstNameInput.isVisible().catch(() => false)) {
      await firstNameInput.fill('');
      const saveBtn = page.locator('button:has-text("Save"), button[type="submit"]').first();
      await saveBtn.click();
      await page.waitForTimeout(500);
      // Inline error should appear (red border or error message)
      const errorMsg = page.locator('text=/required|invalid|first name/i').first();
      const redBorder = page.locator('[class*="border-red"]').first();
      const hasError = await errorMsg.isVisible().catch(() => false) || await redBorder.isVisible().catch(() => false);
      expect(hasError).toBeTruthy();
    } else {
      test.skip();
    }
  });

  // Lawyer fix: API Integrations tab fields are editable
  test('Settings API Integrations tab fields are editable', async ({ page }) => {
    await page.goto('/lawyer/settings');
    await page.waitForLoadState('networkidle');
    const apiTab = page.locator('button:has-text("API"), button:has-text("Integrations")').first();
    if (await apiTab.isVisible().catch(() => false)) {
      await apiTab.click();
      await page.waitForTimeout(400);
      const input = page.locator('input[type="text"], input[type="password"]').first();
      if (await input.isVisible().catch(() => false)) {
        await input.fill('test-value-123');
        const val = await input.inputValue();
        expect(val).toBe('test-value-123');
      } else {
        test.skip();
      }
    } else {
      test.skip();
    }
  });
});
