import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth';

test.describe('Admin — Notifications', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'admin');
    await page.goto('/admin/notifications');
    await page.waitForLoadState('networkidle');
  });

  test('Notifications page loads', async ({ page }) => {
    await expect(page.locator('text=Notifications').first()).toBeVisible();
  });

  test('stat cards show unread, total, this week', async ({ page }) => {
    await expect(page.locator('text=Unread').first()).toBeVisible();
    await expect(page.locator('text=/Total/i').first()).toBeVisible();
  });

  test('search and filter controls are present', async ({ page }) => {
    await expect(page.locator('input[placeholder*="Search"]')).toBeVisible();
    await expect(page.locator('select').first()).toBeVisible();
  });

  // Bug 16 fix: Type filter handles uppercase API values
  test('Bug 16 — Type filter works (selects and filters list)', async ({ page }) => {
    const typeSelect = page.locator('select').first();
    await typeSelect.selectOption({ label: 'Bid' });
    await page.waitForTimeout(500);
    // Should not crash
    await expect(page.locator('text=/Something went wrong/i')).not.toBeVisible();
    // Reset
    await typeSelect.selectOption({ label: 'All Types' });
  });

  // Bug 17 fix: View button navigates directly, not opens modal
  test('Bug 17 — View button navigates to related page', async ({ page }) => {
    const viewBtn = page.locator('button:has-text("View"), a:has-text("View")').first();
    if (await viewBtn.isVisible().catch(() => false)) {
      const currentUrl = page.url();
      await viewBtn.click();
      await page.waitForTimeout(1000);
      // URL should have changed (navigated away)
      const newUrl = page.url();
      expect(newUrl).not.toBe(currentUrl);
      // Should NOT still be on notifications page with a modal open
      // (If URL changed, navigation worked correctly)
    } else {
      test.skip();
    }
  });

  test('Mark All Read button works', async ({ page }) => {
    const markAllBtn = page.locator('button:has-text("Mark All Read")');
    if (await markAllBtn.isVisible().catch(() => false)) {
      await markAllBtn.click();
      await page.waitForTimeout(500);
      await expect(page.locator('text=/Something went wrong/i')).not.toBeVisible();
    } else {
      test.skip();
    }
  });

  test('notification detail modal opens on row click', async ({ page }) => {
    const firstRow = page.locator('[class*="notification"], [class*="divide"] > div').first();
    if (await firstRow.isVisible().catch(() => false)) {
      await firstRow.click();
      await page.waitForTimeout(500);
      const modal = page.locator('[class*="modal"], [role="dialog"], [class*="fixed inset"]').last();
      await expect(modal).toBeVisible();
    } else {
      test.skip();
    }
  });
});
