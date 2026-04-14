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

async function loginAs(page, roleTab, email, password, expectPath) {
  await page.goto(BASE + '/signin', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  const tabBtn = page.locator('button').filter({ hasText: new RegExp(`^${roleTab}$`, 'i') }).first();
  await tabBtn.click();
  await page.waitForTimeout(400);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click(`button:has-text("Sign in as ${roleTab}")`);
  await page.waitForURL(`**/${expectPath}/**`, { timeout: 15000 });
  await page.waitForTimeout(1500);
  console.log(`\nLogged in as ${roleTab}`);
}

async function logout(page) {
  await page.evaluate(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
  });
  await page.goto(BASE + '/signin', { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
}

async function visitRoutes(page, routes, prefix) {
  const results = [];
  for (const route of routes) {
    const url = BASE + route.path;
    await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(800);
    const title = await page.$eval('h1, h2, .text-2xl, .text-xl', el => el.textContent.trim()).catch(() => '?');
    const hasError = await page.$('*:has-text("404"), *:has-text("Page Not Found")') !== null;
    const status = hasError ? 'ERROR' : 'OK';
    console.log(`  ${status} ${route.path} → ${title.slice(0, 50)}`);
    await shot(page, `${prefix}-${route.name}.png`);
    results.push({ path: route.path, name: route.name, title, status });
  }
  return results;
}

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 100, args: ['--ignore-certificate-errors'] });
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await ctx.newPage();

  const allResults = {};
  console.log('\n=== PHASE 9: DEEP DIVE ALL ROLES ALL FEATURES ===\n');

  // ────────────────────────────────────────────────────────────────────────────────
  // ADMIN — all routes
  // ────────────────────────────────────────────────────────────────────────────────
  await loginAs(page, 'Admin', 'admin@brickbanq.com', 'Admin@123', 'admin');

  const adminRoutes = [
    { path: '/admin/dashboard', name: 'p9-admin-01-dashboard' },
    { path: '/admin/case-management', name: 'p9-admin-02-cases' },
    { path: '/admin/all-deals', name: 'p9-admin-03-deals' },
    { path: '/admin/auction-control', name: 'p9-admin-04-auctions' },
    { path: '/admin/kyc-review', name: 'p9-admin-05-kyc' },
    { path: '/admin/document-library', name: 'p9-admin-06-docs' },
    { path: '/admin/reports-analytics', name: 'p9-admin-07-reports' },
    { path: '/admin/task-center', name: 'p9-admin-08-tasks' },
    { path: '/admin/admin-center', name: 'p9-admin-09-console' },
    { path: '/admin/notifications', name: 'p9-admin-10-notif' },
    { path: '/admin/settings', name: 'p9-admin-11-settings' },
  ];
  allResults.admin = await visitRoutes(page, adminRoutes, 'p9-admin');
  await logout(page);

  // ────────────────────────────────────────────────────────────────────────────────
  // LENDER — all routes
  // ────────────────────────────────────────────────────────────────────────────────
  await loginAs(page, 'Lender', 'lender@brickbanq.com', 'Lender@123', 'lender');

  const lenderRoutes = [
    { path: '/lender/dashboard', name: 'p9-lender-01-dashboard' },
    { path: '/lender/my-cases', name: 'p9-lender-02-cases' },
    { path: '/lender/deals', name: 'p9-lender-03-deals' },
    { path: '/lender/auctions', name: 'p9-lender-04-auctions' },
    { path: '/lender/contracts', name: 'p9-lender-05-contracts' },
    { path: '/lender/communications', name: 'p9-lender-06-comms' },
    { path: '/lender/tasks', name: 'p9-lender-07-tasks' },
    { path: '/lender/reports', name: 'p9-lender-08-reports' },
    { path: '/lender/review-relevant-cases', name: 'p9-lender-09-review' },
    { path: '/lender/trend-analysis', name: 'p9-lender-10-trends' },
    { path: '/lender/my-bids', name: 'p9-lender-11-bids' },
    { path: '/lender/notifications', name: 'p9-lender-12-notif' },
    { path: '/lender/settings', name: 'p9-lender-13-settings' },
    { path: '/lender/identity-verification', name: 'p9-lender-14-kyc' },
  ];
  allResults.lender = await visitRoutes(page, lenderRoutes, 'p9-lender');
  await logout(page);

  // ────────────────────────────────────────────────────────────────────────────────
  // INVESTOR — all routes
  // ────────────────────────────────────────────────────────────────────────────────
  await loginAs(page, 'Investor', 'investor@brickbanq.com', 'Investor@123', 'investor');

  const investorRoutes = [
    { path: '/investor/dashboard', name: 'p9-investor-01-dashboard' },
    { path: '/investor/deals', name: 'p9-investor-02-deals' },
    { path: '/investor/auctions', name: 'p9-investor-03-auctions' },
    { path: '/investor/contracts', name: 'p9-investor-04-contracts' },
    { path: '/investor/escrow', name: 'p9-investor-05-escrow' },
    { path: '/investor/tasks', name: 'p9-investor-06-tasks' },
    { path: '/investor/reports', name: 'p9-investor-07-reports' },
    { path: '/investor/documents', name: 'p9-investor-08-docs' },
    { path: '/investor/my-bids', name: 'p9-investor-09-bids' },
    { path: '/investor/notifications', name: 'p9-investor-10-notif' },
    { path: '/investor/settings', name: 'p9-investor-11-settings' },
    { path: '/investor/identity-verification', name: 'p9-investor-12-kyc' },
  ];
  allResults.investor = await visitRoutes(page, investorRoutes, 'p9-investor');
  await logout(page);

  // ────────────────────────────────────────────────────────────────────────────────
  // LAWYER — all routes
  // ────────────────────────────────────────────────────────────────────────────────
  await loginAs(page, 'Lawyer', 'lawyer@brickbanq.com', 'Lawyer@123', 'lawyer');

  const lawyerRoutes = [
    { path: '/lawyer/dashboard', name: 'p9-lawyer-01-dashboard' },
    { path: '/lawyer/assigned-cases', name: 'p9-lawyer-02-cases' },
    { path: '/lawyer/kyc-review', name: 'p9-lawyer-03-kyc' },
    { path: '/lawyer/contract-review', name: 'p9-lawyer-04-contracts' },
    { path: '/lawyer/live-auctions', name: 'p9-lawyer-05-auctions' },
    { path: '/lawyer/task-center', name: 'p9-lawyer-06-tasks' },
    { path: '/lawyer/reports', name: 'p9-lawyer-07-reports' },
    { path: '/lawyer/admin-console', name: 'p9-lawyer-08-console' },
    { path: '/lawyer/my-bids', name: 'p9-lawyer-09-bids' },
    { path: '/lawyer/notifications', name: 'p9-lawyer-10-notif' },
    { path: '/lawyer/settings', name: 'p9-lawyer-11-settings' },
    { path: '/lawyer/identity-verification', name: 'p9-lawyer-12-kyc-verify' },
    { path: '/lawyer/submit-case', name: 'p9-lawyer-13-submit-case' },
  ];
  allResults.lawyer = await visitRoutes(page, lawyerRoutes, 'p9-lawyer');
  await logout(page);

  // ────────────────────────────────────────────────────────────────────────────────
  // BORROWER — all routes
  // ────────────────────────────────────────────────────────────────────────────────
  await loginAs(page, 'Borrower', 'borrower@brickbanq.com', 'Borrower@123', 'borrower');

  const borrowerRoutes = [
    { path: '/borrower/dashboard', name: 'p9-borrower-01-dashboard' },
    { path: '/borrower/my-case', name: 'p9-borrower-02-mycase' },
    { path: '/borrower/auction', name: 'p9-borrower-03-auction' },
    { path: '/borrower/notifications', name: 'p9-borrower-04-notif' },
    { path: '/borrower/settings', name: 'p9-borrower-05-settings' },
  ];
  allResults.borrower = await visitRoutes(page, borrowerRoutes, 'p9-borrower');
  await logout(page);

  // ─── Summary ──────────────────────────────────────────────────────────────────
  console.log('\n=== PHASE 9 SUMMARY ===\n');
  let totalOK = 0, totalError = 0;
  for (const [role, routes] of Object.entries(allResults)) {
    const ok = routes.filter(r => r.status === 'OK').length;
    const err = routes.filter(r => r.status === 'ERROR').length;
    totalOK += ok; totalError += err;
    console.log(`${role.toUpperCase()}: ${ok}/${routes.length} OK${err > 0 ? ` | ${err} ERRORS` : ''}`);
    routes.forEach(r => {
      if (r.status === 'ERROR') console.log(`  ✗ ${r.path}`);
    });
  }
  console.log(`\nTOTAL: ${totalOK} OK / ${totalError} errors`);
  console.log('Screenshots saved to:', SS);

  // Save results
  fs.writeFileSync(path.join(__dirname, 'phase9-results.json'), JSON.stringify(allResults, null, 2));

  await browser.close();
})();
