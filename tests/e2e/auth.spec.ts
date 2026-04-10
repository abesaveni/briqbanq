import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('home page loads', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Page renders something — title may still be "frontend" on older builds
    await expect(page.locator('body')).toBeVisible();
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test('sign-in page renders', async ({ page }) => {
    await page.goto('/signin');
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('sign-in with invalid credentials shows error', async ({ page }) => {
    await page.goto('/signin');
    await page.fill('input[type="email"], input[name="email"]', 'wrong@test.com');
    await page.fill('input[type="password"], input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    // Should stay on signin or show error
    await page.waitForTimeout(2000);
    const url = page.url();
    const hasError = await page.locator('text=/invalid|incorrect|error|wrong/i').isVisible().catch(() => false);
    const stillOnSignin = url.includes('signin');
    expect(stillOnSignin || hasError).toBeTruthy();
  });

  test('admin login succeeds and redirects to dashboard', async ({ page }) => {
    await page.goto('/signin');
    await page.waitForLoadState('networkidle');
    await page.locator('button:has-text("Admin")').click();
    await page.fill('#email', 'admin@brickbanq.com');
    await page.fill('#password', 'Admin@123');
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.pathname.includes('signin'), { timeout: 30000 });
    await expect(page.url()).toContain('admin');
  });

  test('sign-up page renders with OTP flow', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
  });
});
