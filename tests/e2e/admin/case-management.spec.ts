import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth';

test.describe('Admin — Case Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'admin');
    await page.goto('/admin/case-management');
    await page.waitForLoadState('networkidle');
  });

  test('case management page loads with table or empty state', async ({ page }) => {
    const hasTable = await page.locator('table, [class*="table"], [class*="case"]').first().isVisible().catch(() => false);
    const hasEmpty = await page.locator('text=/no cases|empty/i').isVisible().catch(() => false);
    expect(hasTable || hasEmpty).toBeTruthy();
  });

  // Bug 2 fix: Auction date uses separate date + time inputs
  test('Bug 2 — Schedule Auction modal has separate date and time inputs', async ({ page }) => {
    // Open schedule auction — look for a case row action button
    const auctionBtn = page.locator('button', { hasText: /schedule auction|auction/i }).first();
    const rowBtn = page.locator('text=/schedule/i').first();
    const btn = (await auctionBtn.isVisible().catch(() => false)) ? auctionBtn : rowBtn;
    if (await btn.isVisible().catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(500);
      // Should have type="date" AND type="time" inputs, NOT type="datetime-local"
      const dateInput = page.locator('input[type="date"]');
      const timeInput = page.locator('input[type="time"]');
      const datetimeLocal = page.locator('input[type="datetime-local"]');
      await expect(dateInput).toBeVisible();
      await expect(timeInput).toBeVisible();
      await expect(datetimeLocal).not.toBeVisible();
    } else {
      test.skip();
    }
  });
});

test.describe('Admin — Case Details', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'admin');
  });

  // Bug 1 fix: Assign Lawyer/Lender modal exists in case detail
  test('Bug 1 — Case detail has Assign button that opens modal', async ({ page }) => {
    await page.goto('/admin/case-management');
    await page.waitForLoadState('networkidle');
    // Wait for loading to finish
    await page.waitForSelector('[class*="animate-spin"], [class*="loading"]', { state: 'hidden', timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(500);

    // Find first case link — could be in a table row or card
    const firstCaseLink = page.locator('a[href*="case-details"]').first();
    if (!await firstCaseLink.isVisible().catch(() => false)) { test.skip(); return; }

    await firstCaseLink.click();
    await page.waitForLoadState('networkidle');

    const assignBtn = page.locator('button:has-text("Assign")');
    await expect(assignBtn).toBeVisible({ timeout: 10000 });
    await assignBtn.click();
    await page.waitForTimeout(600);

    await expect(page.locator('text=Assign Lawyer')).toBeVisible();
    await expect(page.locator('text=Assign Lender')).toBeVisible();
    await expect(page.locator('select').first()).toBeVisible();
  });

  test('Case detail tabs all render', async ({ page }) => {
    await page.goto('/admin/case-management');
    await page.waitForLoadState('networkidle');
    const firstLink = page.locator('a[href*="case-details"]').first();
    if (await firstLink.isVisible().catch(() => false)) {
      await firstLink.click();
      await page.waitForLoadState('networkidle');
      const tabs = ['Overview', 'Property', 'Documents', 'Investment Memo', 'Settlement', 'Bids', 'Messages', 'Activity'];
      for (const tab of tabs) {
        await expect(page.locator(`text=${tab}`).first()).toBeVisible();
      }
    } else {
      test.skip();
    }
  });
});
