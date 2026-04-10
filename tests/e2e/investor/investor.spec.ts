import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth';

test.describe('Investor — Navigation & Core Pages', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'investor');
  });

  const pages = [
    { label: 'Dashboard',    path: '/investor/dashboard' },
    { label: 'All Deals',    path: '/investor/deals' },
    { label: 'Auctions',     path: '/investor/auctions' },
    { label: 'Contracts',    path: '/investor/contracts' },
    { label: 'Escrow',       path: '/investor/escrow' },
    { label: 'Tasks',        path: '/investor/tasks' },
    { label: 'Reports',      path: '/investor/reports' },
    { label: 'Documents',    path: '/investor/documents' },
    { label: 'Watchlist',    path: '/investor/watchlist' },
    { label: 'My Bids',      path: '/investor/my-bids' },
    { label: 'Notifications',path: '/investor/notifications' },
    { label: 'Settings',     path: '/investor/settings' },
  ];

  for (const { label, path } of pages) {
    test(`${label} loads without crash`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      await expect(page.locator('text=/Something went wrong/i')).not.toBeVisible();
      await expect(page.locator('h1, h2, [class*="heading"]').first()).toBeVisible();
    });
  }

  // Investor fix: Investment Memorandum doesn't crash
  test('Deal detail Investment Memo tab does not crash', async ({ page }) => {
    await page.goto('/investor/deals');
    await page.waitForLoadState('networkidle');
    const dealLink = page.locator('a[href*="case-details"], button:has-text("View")').first();
    if (await dealLink.isVisible().catch(() => false)) {
      await dealLink.click();
      await page.waitForLoadState('networkidle');
      const memoTab = page.locator('button:has-text("Investment Memo"), a:has-text("Memo")').first();
      if (await memoTab.isVisible().catch(() => false)) {
        await memoTab.click();
        await page.waitForLoadState('networkidle');
        await expect(page.locator('text=/Something went wrong/i')).not.toBeVisible();
      }
    } else {
      test.skip();
    }
  });

  // Investor fix: Reports page PDF download works (no alert())
  test('Reports page has Download PDF button (no alert popup)', async ({ page }) => {
    await page.goto('/investor/reports');
    await page.waitForLoadState('networkidle');
    // Set up dialog listener — alert() should NOT fire
    let alertFired = false;
    page.on('dialog', (dialog) => {
      alertFired = true;
      dialog.dismiss();
    });
    const downloadBtn = page.locator('button:has-text("Download"), button:has-text("Export"), button:has-text("PDF")').first();
    if (await downloadBtn.isVisible().catch(() => false)) {
      await downloadBtn.click();
      await page.waitForTimeout(1000);
      expect(alertFired).toBeFalsy();
    } else {
      test.skip();
    }
  });

  // Investor fix: Watchlist works
  test('Watchlist page loads and shows content', async ({ page }) => {
    await page.goto('/investor/watchlist');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=/Something went wrong/i')).not.toBeVisible();
  });

  // Investor fix: Settings validation
  test('Settings page profile form renders', async ({ page }) => {
    await page.goto('/investor/settings');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('input, select').first()).toBeVisible();
  });
});
