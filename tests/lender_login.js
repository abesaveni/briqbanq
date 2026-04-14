const { chromium } = require('@playwright/test');
(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });

  // Login
  await page.goto('http://localhost:3000/signin');
  await page.waitForTimeout(1500);
  await page.click('button:has-text("Lender"):not(:has-text("Sign in"))');
  await page.waitForTimeout(600);
  await page.fill('input[type="email"]', 'lender@brickbanq.com');
  await page.fill('input[type="password"]', 'Lender@123');
  await page.waitForTimeout(400);
  await page.click('button:has-text("Sign in as Lender")');
  await page.waitForURL('**/lender/dashboard', { timeout: 10000 });
  await page.waitForTimeout(2000);

  // Click "New MIP Case" button on dashboard
  await page.click('button:has-text("New MIP Case")');
  await page.waitForTimeout(3000);
  console.log('URL after click:', page.url());
  await page.screenshot({ path: 'tests/screenshots/lender-create-case.png', fullPage: false });
  console.log('Screenshot saved');
  await browser.close();
})();
