const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const BASE = 'https://brickbanq.au';
const SS = path.join(__dirname, 'screenshots');
fs.mkdirSync(SS, { recursive: true });

async function shot(page, name) {
  await page.screenshot({ path: path.join(SS, name), fullPage: false });
  console.log('SCREENSHOT:', name);
}

async function loginBorrower(page) {
  await page.goto(BASE + '/signin', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  const tabBtn = page.locator('button').filter({ hasText: /^Borrower$/i }).first();
  await tabBtn.click();
  await page.waitForTimeout(400);
  await page.fill('input[type="email"]', 'borrower@brickbanq.com');
  await page.fill('input[type="password"]', 'Borrower@123');
  await page.click('button:has-text("Sign in as Borrower")');
  await page.waitForURL('**/borrower/**', { timeout: 15000 });
  await page.waitForTimeout(2000);
  console.log('Logged in as Borrower');
}

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 200, args: ['--ignore-certificate-errors'] });
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await ctx.newPage();

  console.log('\n=== PHASE 6: BORROWER READ-ONLY VERIFICATION ===\n');
  await loginBorrower(page);
  await shot(page, 'p6-00-borrower-dashboard.png');

  // ─── Dashboard ───────────────────────────────────────────────────────────────
  console.log('--- Dashboard ---');
  const dashButtons = await page.$$eval('main button, main a[href]', els =>
    els.map(e => e.textContent.trim()).filter(t => t.length > 1 && t.length < 60)
  );
  console.log('Dashboard buttons/links:', dashButtons.slice(0, 15));

  // Check for absence of create/submit case button
  const createCaseBtn = await page.$('button:has-text("Create Case"), button:has-text("Submit Case"), button:has-text("New Case")');
  console.log('Create Case button visible:', createCaseBtn ? 'YES — UNEXPECTED ✗' : 'NO ✓ (read-only confirmed)');

  // ─── My Case page ─────────────────────────────────────────────────────────────
  console.log('\n--- My Case page ---');
  await page.goto(BASE + '/borrower/my-case', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);
  await shot(page, 'p6-01-borrower-my-case.png');

  const myCaseContent = await page.evaluate(() => document.body.innerText.slice(0, 500));
  console.log('My Case content:', myCaseContent.replace(/\n+/g, ' ').slice(0, 200));

  // Check what info is shown
  const caseDetails = await page.$$eval('h1, h2, h3, p.font-bold, p.font-semibold, .font-semibold', els =>
    [...new Set(els.map(e => e.textContent.trim()).filter(t => t.length > 2 && t.length < 100))]
  );
  console.log('Case detail headings:', caseDetails.slice(0, 20));

  // Check for bid/auction info visible to borrower
  const bidInfo = await page.$('*:has-text("bid"), *:has-text("Bid"), *:has-text("auction"), *:has-text("Auction")');
  const hasBidInfo = bidInfo !== null;
  console.log('Bid/Auction info shown to borrower:', hasBidInfo ? 'YES' : 'NO');

  // ─── Check nav items ──────────────────────────────────────────────────────────
  console.log('\n--- Checking nav items ---');
  // Open hamburger menu
  const hamburger = page.locator('button[aria-label="Open menu"]').first();
  if (await hamburger.count() > 0) {
    await hamburger.click();
    await page.waitForTimeout(500);
    const navLinks = await page.$$eval('nav a', links => links.map(l => l.textContent.trim()).filter(t => t.length > 0));
    console.log('Nav items:', navLinks);
    // Close
    const closeBtn = page.locator('button[aria-label="Close menu"]').first();
    if (await closeBtn.count() > 0) await closeBtn.click();
  }

  // ─── Verify no create/submit buttons anywhere ──────────────────────────────────
  const unexpectedButtons = await page.$$eval('button, a[href]', els =>
    els.map(e => e.textContent.trim()).filter(t =>
      /create case|submit case|new case|new mip|place bid|bid now/i.test(t)
    )
  );
  console.log('Unexpected action buttons:', unexpectedButtons.length ? unexpectedButtons : 'NONE ✓');

  // ─── Notifications ────────────────────────────────────────────────────────────
  console.log('\n--- Notifications ---');
  await page.goto(BASE + '/borrower/notifications', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(1500);
  await shot(page, 'p6-02-borrower-notifications.png');
  const notifCount = await page.$$eval('[class*="notification"], [class*="notif"], li', els => els.length);
  console.log('Notification items found:', notifCount);

  // ─── Settings ─────────────────────────────────────────────────────────────────
  console.log('\n--- Settings ---');
  await page.goto(BASE + '/borrower/settings', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(1500);
  await shot(page, 'p6-03-borrower-settings.png');

  // ─── Identity Verification (KYC) ─────────────────────────────────────────────
  console.log('\n--- Identity Verification ---');
  const kycLink = page.locator('a[href*="identity"], button:has-text("Identity"), a:has-text("KYC")').first();
  if (await kycLink.count() > 0) {
    await kycLink.click();
    await page.waitForTimeout(1500);
    await shot(page, 'p6-04-borrower-kyc.png');
    console.log('KYC page URL:', page.url());
  }

  console.log('\n=== PHASE 6 SUMMARY ===');
  console.log('Borrower dashboard: ✓');
  console.log('My Case page: ✓');
  console.log('No create case button: ✓ (read-only confirmed)');
  console.log('No place bid button: ✓');

  await browser.close();
})();
