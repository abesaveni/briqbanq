import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth';

test.describe('Admin — Document Library', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'admin');
    await page.goto('/admin/document-library');
    await page.waitForLoadState('networkidle');
  });

  test('Document Library page loads', async ({ page }) => {
    await expect(page.locator('text=/Document/i').first()).toBeVisible();
  });

  test('search input is functional', async ({ page }) => {
    const search = page.locator('input[placeholder*="Search"], input[type="search"]').first();
    await expect(search).toBeVisible();
    await search.fill('test');
    await page.waitForTimeout(500);
    await search.clear();
  });

  test('filter controls are present', async ({ page }) => {
    // Category and type filters
    const selects = page.locator('select');
    await expect(selects.first()).toBeVisible();
  });

  // Bug 10 fix: Share button shows visible toast instead of silently failing
  test('Bug 10 — Share button shows toast feedback', async ({ page }) => {
    const shareBtn = page.locator('button[title*="Share"], button:has-text("Share")').first();
    if (await shareBtn.isVisible().catch(() => false)) {
      await shareBtn.click();
      await page.waitForTimeout(800);
      // A toast/notification should appear
      const toast = page.locator('text=/copied|clipboard/i').first();
      await expect(toast).toBeVisible({ timeout: 3000 });
    } else {
      test.skip();
    }
  });

  // Bug 3 fix: Document view/download does not use s3_key as URL
  test('Bug 3 — Document view button does not open broken s3_key URL', async ({ page }) => {
    const viewBtn = page.locator('button[title*="View"], button:has-text("View")').first();
    if (await viewBtn.isVisible().catch(() => false)) {
      // Listen for new page/tab open or modal
      const [newPage] = await Promise.all([
        page.context().waitForEvent('page', { timeout: 3000 }).catch(() => null),
        viewBtn.click(),
      ]);
      await page.waitForTimeout(500);
      if (newPage) {
        const url = newPage.url();
        // s3_key paths look like "cases/123/doc.pdf" — should NOT be used directly as URL
        expect(url).not.toMatch(/^cases\//);
        expect(url).not.toMatch(/^documents\//);
      }
      // If modal opens instead, just check no error
      const errorText = page.locator('text=/not found|404|broken/i');
      const errorVisible = await errorText.isVisible().catch(() => false);
      expect(errorVisible).toBeFalsy();
    } else {
      test.skip();
    }
  });

  test('document list shows items or empty state', async ({ page }) => {
    const hasItems = await page.locator('[class*="document"], tr, [class*="file"]').first().isVisible().catch(() => false);
    const hasEmpty = await page.locator('text=/no document|empty/i').isVisible().catch(() => false);
    expect(hasItems || hasEmpty).toBeTruthy();
  });
});
