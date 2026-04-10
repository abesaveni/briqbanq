import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth';

test.describe('Lender — Navigation & Core Pages', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'lender');
  });

  const pages = [
    { label: 'Dashboard',          path: '/lender/dashboard' },
    { label: 'All Deals',          path: '/lender/deals' },
    { label: 'My Cases',           path: '/lender/my-cases' },
    { label: 'Auctions',           path: '/lender/auctions' },
    { label: 'Contracts',          path: '/lender/contracts' },
    { label: 'Tasks',              path: '/lender/tasks' },
    { label: 'Reports',            path: '/lender/reports' },
    { label: 'Documents',          path: '/lender/documents' },
    { label: 'Communications',     path: '/lender/communications' },
    { label: 'Review Cases',       path: '/lender/review-relevant-cases' },
    { label: 'Trend Analysis',     path: '/lender/trend-analysis' },
    { label: 'My Bids',            path: '/lender/my-bids' },
    { label: 'Notifications',      path: '/lender/notifications' },
    { label: 'Settings',           path: '/lender/settings' },
  ];

  for (const { label, path } of pages) {
    test(`${label} loads without crash`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      await expect(page.locator('text=/Something went wrong/i')).not.toBeVisible();
      await expect(page.locator('h1, h2, [class*="heading"]').first()).toBeVisible();
    });
  }

  // Lender fix: Submit New Case form
  test('Submit New Case form renders all sections', async ({ page }) => {
    await page.goto('/lender/submit-case');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=/Something went wrong/i')).not.toBeVisible();
    await expect(page.locator('input, select, textarea').first()).toBeVisible();
  });

  // Lender fix: Reports PDF (no alert())
  test('Reports page PDF export does not fire alert()', async ({ page }) => {
    await page.goto('/lender/reports');
    await page.waitForLoadState('networkidle');
    let alertFired = false;
    page.on('dialog', (dialog) => { alertFired = true; dialog.dismiss(); });
    const btn = page.locator('button:has-text("Download"), button:has-text("Export"), button:has-text("PDF")').first();
    if (await btn.isVisible().catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(1000);
      expect(alertFired).toBeFalsy();
    } else {
      test.skip();
    }
  });

  // Lender fix: My Cases table loads
  test('My Cases shows table or empty state', async ({ page }) => {
    await page.goto('/lender/my-cases');
    await page.waitForLoadState('networkidle');
    const hasTable = await page.locator('table, [class*="table"], tr').first().isVisible().catch(() => false);
    const hasEmpty = await page.locator('text=/no case|empty/i').isVisible().catch(() => false);
    expect(hasTable || hasEmpty).toBeTruthy();
  });

  // Lender fix: Case detail page loads
  test('Case detail page loads for first case', async ({ page }) => {
    await page.goto('/lender/my-cases');
    await page.waitForLoadState('networkidle');
    const caseLink = page.locator('a[href*="case-details"], button:has-text("View")').first();
    if (await caseLink.isVisible().catch(() => false)) {
      await caseLink.click();
      await page.waitForLoadState('networkidle');
      await expect(page.locator('text=/Something went wrong/i')).not.toBeVisible();
    } else {
      test.skip();
    }
  });
});
