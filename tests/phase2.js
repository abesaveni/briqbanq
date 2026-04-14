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

async function logout(page) {
  await page.evaluate(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
  });
  await page.goto(BASE + '/signin', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
}

async function loginAs(page, roleTab, email, password) {
  await page.goto(BASE + '/signin', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  // Click role tab
  const tabBtn = page.locator(`button`).filter({ hasText: new RegExp(`^${roleTab}$`, 'i') }).first();
  await tabBtn.click();
  await page.waitForTimeout(500);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.waitForTimeout(300);
  await page.click(`button:has-text("Sign in as ${roleTab}")`);
  await page.waitForTimeout(4000);
  return page.url();
}

async function getNavItems(page) {
  const items = await page.$$eval(
    'nav a, nav button, [role="navigation"] a, header a, header button, aside a, aside li a',
    els => [...new Set(els.map(e => e.textContent.trim()).filter(t => t.length > 1 && t.length < 50))]
  );
  return items;
}

async function getButtons(page) {
  const btns = await page.$$eval(
    'main button, main a[href]',
    els => [...new Set(els.map(e => e.textContent.trim()).filter(t => t.length > 1 && t.length < 60))]
  );
  return btns;
}

const ROLES = [
  { tab: 'Admin',    email: 'admin@brickbanq.com',    password: 'Admin@123',    ssName: 'login-admin-dashboard.png',    expectPath: '/admin' },
  { tab: 'Lender',   email: 'lender@brickbanq.com',   password: 'Lender@123',   ssName: 'login-lender-dashboard.png',   expectPath: '/lender' },
  { tab: 'Lawyer',   email: 'lawyer@brickbanq.com',   password: 'Lawyer@123',   ssName: 'login-lawyer-dashboard.png',   expectPath: '/lawyer' },
  { tab: 'Investor', email: 'investor@brickbanq.com', password: 'Investor@123', ssName: 'login-investor-dashboard.png', expectPath: '/investor' },
  { tab: 'Borrower', email: 'borrower@brickbanq.com', password: 'Borrower@123', ssName: 'login-borrower-dashboard.png', expectPath: '/borrower' },
];

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 300, args: ['--ignore-certificate-errors'] });
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await ctx.newPage();

  const results = [];

  console.log('\n=== PHASE 2: LOGIN ALL 5 ROLES ===\n');

  for (const role of ROLES) {
    console.log(`\n--- ${role.tab.toUpperCase()} ---`);
    const consoleErrors = [];
    page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });

    const url = await loginAs(page, role.tab, role.email, role.password);
    const success = url.includes(role.expectPath);
    console.log(`Login: ${success ? 'SUCCESS' : 'FAIL'} → ${url}`);

    await page.waitForTimeout(2000);
    await shot(page, role.ssName);

    const navItems = await getNavItems(page);
    const buttons = await getButtons(page);
    console.log('Nav items:', navItems);
    console.log('Dashboard buttons:', buttons.slice(0, 20));
    console.log('Console errors:', consoleErrors.length ? consoleErrors : 'NONE');

    // Special checks
    if (role.tab === 'Lawyer') {
      const hasCreateCase = await page.$('button:has-text("Create Case"), a:has-text("Create Case")');
      console.log('Create Case button visible:', hasCreateCase ? 'YES ✓' : 'NO ✗');
    }
    if (role.tab === 'Borrower') {
      const hasCreateCase = await page.$('button:has-text("Create Case"), a:has-text("Create Case")');
      const hasAuctions = await page.$('a:has-text("Auction"), button:has-text("Auction")');
      console.log('No Create Case button:', !hasCreateCase ? 'CONFIRMED ✓' : 'FOUND — UNEXPECTED ✗');
      console.log('No Auctions tab:', !hasAuctions ? 'CONFIRMED ✓' : 'FOUND — UNEXPECTED ✗');
    }

    results.push({ role: role.tab, success, url, navItems, consoleErrors });
    await logout(page);
  }

  console.log('\n=== PHASE 2 SUMMARY ===');
  for (const r of results) {
    console.log(`${r.role}: ${r.success ? '✓ LOGIN OK' : '✗ LOGIN FAILED'} | Errors: ${r.consoleErrors.length}`);
    console.log(`  Nav: ${r.navItems.join(' | ')}`);
  }

  await browser.close();
})();
