import { Page } from '@playwright/test';

export const CREDENTIALS = {
  admin:    { email: 'admin@brickbanq.com',    password: 'Admin@123',    role: 'admin' },
  lawyer:   { email: 'lawyer@brickbanq.com',   password: 'Lawyer@123',   role: 'lawyer' },
  lender:   { email: 'lender@brickbanq.com',   password: 'Lender@123',   role: 'lender' },
  investor: { email: 'investor@brickbanq.com', password: 'Investor@123', role: 'investor' },
  borrower: { email: 'borrower@brickbanq.com', password: 'Borrower@123', role: 'borrower' },
};

export async function login(page: Page, role: keyof typeof CREDENTIALS) {
  const { email, password } = CREDENTIALS[role];
  // Retry goto in case server is temporarily slow
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await page.goto('/signin', { timeout: 45000 });
      break;
    } catch {
      if (attempt === 2) throw new Error('Failed to reach /signin after 3 attempts');
      await page.waitForTimeout(3000);
    }
  }
  await page.waitForLoadState('networkidle');

  // Click the role selector button (grid of 5 role buttons, all type="button")
  // Must use type="button" to avoid matching the submit button "Sign in as Borrower"
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
  await page.locator(`button[type="button"]:has-text("${roleLabel}")`).first().click();

  // Fill credentials
  await page.fill('#email', email);
  await page.fill('#password', password);

  // Submit
  await page.click('button[type="submit"]');

  // Wait for redirect away from /signin
  await page.waitForURL((url) => !url.pathname.includes('signin'), { timeout: 30000 });
  await page.waitForLoadState('networkidle');
}

export async function loginAndGoTo(page: Page, role: keyof typeof CREDENTIALS, path: string) {
  await login(page, role);
  await page.goto(path);
  await page.waitForLoadState('networkidle');
}
