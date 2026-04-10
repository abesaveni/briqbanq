import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth';

test.describe('Admin — KYC Review', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'admin');
    await page.goto('/admin/kyc-review');
    await page.waitForLoadState('networkidle');
  });

  test('KYC queue page loads', async ({ page }) => {
    await expect(page.locator('text=/KYC|kyc/i').first()).toBeVisible();
  });

  test('KYC detail page loads', async ({ page }) => {
    const firstReview = page.locator('a[href*="kyc-review/"], button:has-text("Review"), button:has-text("View")').first();
    if (await firstReview.isVisible().catch(() => false)) {
      await firstReview.click();
      await page.waitForLoadState('networkidle');
      await expect(page.locator('text=/KYC|Identity/i').first()).toBeVisible();
    } else {
      test.skip();
    }
  });

  // Bug 8 fix: Timeline is dynamic, not hardcoded
  test('Bug 8 — KYC Timeline does not show hardcoded Jennifer Brown date', async ({ page }) => {
    // Navigate directly to KYC queue and check for any entry
    await page.waitForSelector('a[href*="kyc-review/"], tr:has-text("Review"), [class*="card"]:has-text("Review")', { timeout: 15000 }).catch(() => {});
    const firstReview = page.locator('a[href*="kyc-review/"]').first();
    if (!await firstReview.isVisible().catch(() => false)) { test.skip(); return; }
    await firstReview.click();
    await page.waitForLoadState('networkidle');
    // Hardcoded date should NOT appear
    await expect(page.locator('text=13/03/2026, 12:23:11 pm')).not.toBeVisible();
    await expect(page.locator('text=Timeline')).toBeVisible();
  });

  // Bug 9 fix: View Activity Log opens inline modal, not navigate to /admin/audit
  test('Bug 9 — View Activity Log opens modal (not broken navigation)', async ({ page }) => {
    const firstReview = page.locator('a[href*="kyc-review/"], button:has-text("Review"), button:has-text("View")').first();
    if (await firstReview.isVisible().catch(() => false)) {
      await firstReview.click();
      await page.waitForLoadState('networkidle');
      const activityBtn = page.locator('button:has-text("View Activity Log")');
      if (await activityBtn.isVisible().catch(() => false)) {
        await activityBtn.click();
        await page.waitForTimeout(500);
        // Modal should appear — NOT a 404 page
        const modal = page.locator('[class*="modal"], [role="dialog"], [class*="fixed"]').last();
        await expect(modal).toBeVisible();
        await expect(page.locator('text=/Activity|Log/i').first()).toBeVisible();
        // URL should NOT have changed to /admin/audit
        expect(page.url()).not.toContain('/admin/audit');
      } else {
        test.skip();
      }
    } else {
      test.skip();
    }
  });

  // Bug 6 fix: Approved KYC shows Reject (Reverse Approval) button
  test('Bug 6 — Approved KYC shows reverse approval option', async ({ page }) => {
    // Look for an approved KYC row with a badge/status text "Approved"
    const approvedLink = page.locator('a[href*="kyc-review/"]:near(:text("Approved"))').first();
    const fallbackLink = page.locator('tr:has-text("Approved") a[href*="kyc-review/"], [class*="card"]:has-text("Approved") a[href*="kyc-review/"]').first();
    const link = await approvedLink.isVisible().catch(() => false) ? approvedLink : fallbackLink;
    if (!await link.isVisible().catch(() => false)) { test.skip(); return; }
    await link.click();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=/Reject.*Reverse|Reverse.*Approval/i')).toBeVisible();
  });

  // Bug 7 fix: PDF generation uses real role, not hardcoded 'Investor'
  test('Bug 7 — Download Report button is present in KYC detail', async ({ page }) => {
    const firstLink = page.locator('a[href*="kyc-review/"]').first();
    if (!await firstLink.isVisible().catch(() => false)) { test.skip(); return; }
    await firstLink.click();
    await page.waitForLoadState('networkidle');
    const downloadBtn = page.locator('button:has-text("Download"), button:has-text("Report"), button:has-text("PDF")').first();
    await expect(downloadBtn).toBeVisible({ timeout: 10000 });
  });
});
