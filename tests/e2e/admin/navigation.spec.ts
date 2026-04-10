import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth';

test.describe('Admin — Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'admin');
  });

  const pages = [
    { label: 'Dashboard',          path: '/admin/dashboard' },
    { label: 'Case Management',    path: '/admin/case-management' },
    { label: 'All Deals',          path: '/admin/all-deals' },
    { label: 'Auction Control',    path: '/admin/auction-control' },
    { label: 'KYC Review',         path: '/admin/kyc-review' },
    { label: 'Document Library',   path: '/admin/document-library' },
    { label: 'Reports & Analytics',path: '/admin/reports-analytics' },
    { label: 'Admin Center',       path: '/admin/admin-center' },
    { label: 'Task Center',        path: '/admin/task-center' },
    { label: 'Notifications',      path: '/admin/notifications' },
    { label: 'Settings',           path: '/admin/settings' },
  ];

  for (const { label, path } of pages) {
    test(`${label} page loads without crash`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      // No unhandled error boundary shown
      await expect(page.locator('text=/Something went wrong|Unexpected error/i')).not.toBeVisible();
      // Page has content
      await expect(page.locator('h1, h2, [class*="dashboard"], [class*="heading"]').first()).toBeVisible();
    });
  }
});
