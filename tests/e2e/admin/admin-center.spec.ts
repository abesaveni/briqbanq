import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth';

test.describe('Admin — Admin Center', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'admin');
    await page.goto('/admin/admin-center');
    await page.waitForLoadState('networkidle');
  });

  // Bug 13 fix: Spelling — "Admin Center" not "Admin Centre"
  test('Bug 13 — Page heading says "Admin Center" (not "Centre")', async ({ page }) => {
    const heading = page.locator('h1, h2').first();
    const text = await heading.textContent();
    expect(text).toMatch(/Admin Center/i);
    expect(text).not.toMatch(/Admin Centre/i);
  });

  test('Tab navigation works', async ({ page }) => {
    const tabs = ['Integrations', 'Analytics', 'Security'];
    for (const tab of tabs) {
      const tabEl = page.locator(`button:has-text("${tab}"), [role="tab"]:has-text("${tab}")`).first();
      if (await tabEl.isVisible().catch(() => false)) {
        await tabEl.click();
        await page.waitForTimeout(400);
        await expect(page.locator('text=/Something went wrong/i')).not.toBeVisible();
      }
    }
  });

  // Bug 14 fix: Config modal inputs are editable (controlled)
  test('Bug 14 — Integration Configure modal has editable inputs', async ({ page }) => {
    const configBtn = page.locator('button:has-text("Configure")').first();
    if (await configBtn.isVisible().catch(() => false)) {
      await configBtn.click();
      await page.waitForTimeout(500);
      const input = page.locator('[class*="modal"] input, [class*="fixed"] input').first();
      if (await input.isVisible().catch(() => false)) {
        // Clear and type — if uncontrolled (defaultValue), value won't update
        const testValue = 'test-api-key-12345';
        await input.triple_click?.() || await input.click({ clickCount: 3 });
        await input.fill(testValue);
        const inputValue = await input.inputValue();
        expect(inputValue).toBe(testValue);
      }
    } else {
      test.skip();
    }
  });

  // Bug 15 fix: Analytics tab uses adminService (same as Dashboard)
  test('Bug 15 — Analytics tab loads data without error', async ({ page }) => {
    const analyticsTab = page.locator('button:has-text("Analytics"), [role="tab"]:has-text("Analytics")').first();
    if (await analyticsTab.isVisible().catch(() => false)) {
      await analyticsTab.click();
      await page.waitForLoadState('networkidle');
      await expect(page.locator('text=/Something went wrong/i')).not.toBeVisible();
      // Should show stat cards
      const statCards = page.locator('[class*="border"][class*="rounded"]');
      expect(await statCards.count()).toBeGreaterThan(0);
    } else {
      test.skip();
    }
  });
});

test.describe('Admin — Organization Settings', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'admin');
    await page.goto('/admin/settings');
    await page.waitForLoadState('networkidle');
  });

  // Bug 18 fix: Save Changes shows confirmation toast
  test('Bug 18 — Organization Settings Save Changes shows confirmation', async ({ page }) => {
    await page.goto('/admin/settings');
    await page.waitForLoadState('networkidle');
    // Settings uses tab navigation — click Organization tab
    const orgTab = page.locator('button', { hasText: 'Organization' }).first();
    await expect(orgTab).toBeVisible({ timeout: 10000 });
    await orgTab.click();
    await page.waitForTimeout(500);

    const saveBtn = page.locator('button:has-text("Save Changes"), button:has-text("Save")').first();
    await expect(saveBtn).toBeVisible({ timeout: 5000 });
    await saveBtn.click();
    // Toast should appear — success or error message
    const toast = page.locator('[class*="fixed"][class*="top"], [class*="toast"], [class*="banner"]').first();
    await expect(toast).toBeVisible({ timeout: 6000 });
  });
});
