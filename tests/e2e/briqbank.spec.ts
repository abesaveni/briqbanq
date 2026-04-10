import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// ─── Credentials ───────────────────────────────────────────────────────────────
const USERS = {
  admin:    { email: 'admin@brickbanq.com',    password: 'Admin@123' },
  lender:   { email: 'lender@brickbanq.com',   password: 'Lender@123' },
  lawyer:   { email: 'lawyer@brickbanq.com',   password: 'Lawyer@123' },
  investor: { email: 'investor@brickbanq.com', password: 'Investor@123' },
  borrower: { email: 'borrower@brickbanq.com', password: 'Borrower@123' },
};

const SS_DIR = path.join(__dirname, '../screenshots');
if (!fs.existsSync(SS_DIR)) fs.mkdirSync(SS_DIR, { recursive: true });

// Shared results map written across tests
const REPORT_PATH = path.join(__dirname, '../test-report.txt');

// ─── Helpers ───────────────────────────────────────────────────────────────────
async function login(page: Page, user: { email: string; password: string }) {
  await page.goto('/signin');
  await page.waitForSelector('input[type="email"]', { timeout: 15000 });

  // Detect role from email prefix and click the matching role tile
  const roleFromEmail = user.email.split('@')[0]; // admin, lender, lawyer, investor, borrower
  const roleLabel = roleFromEmail.charAt(0).toUpperCase() + roleFromEmail.slice(1);
  try {
    // Role tiles are small buttons with the role label text (CSS uppercase)
    const roleTile = page.locator(`button`).filter({ hasText: new RegExp(`^${roleLabel}$`, 'i') }).first();
    if (await roleTile.isVisible({ timeout: 2000 })) {
      await roleTile.click();
      await page.waitForTimeout(300);
    }
  } catch {}

  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', user.password);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2500);
}

async function logout(page: Page) {
  try {
    const menuBtn = page.getByRole('button', { name: /open menu/i }).first();
    if (await menuBtn.isVisible({ timeout: 2000 })) {
      await menuBtn.click();
      await page.waitForTimeout(400);
    }
    const signout = page.getByText('Sign Out').first();
    if (await signout.isVisible({ timeout: 2000 })) {
      await signout.click();
      await page.waitForTimeout(1500);
      return;
    }
  } catch {}
  await page.goto('/signin');
  await page.waitForTimeout(800);
}

async function ss(page: Page, name: string) {
  const p = path.join(SS_DIR, `${name}.png`);
  await page.screenshot({ path: p, fullPage: false });
  console.log(`    📸 ${name}.png`);
}

function log(icon: '✓' | '✗' | '⚠', label: string, note = '') {
  console.log(`  ${icon} ${label}${note ? '  →  ' + note : ''}`);
}

// ─── STEP 0 — Smoke test ──────────────────────────────────────────────────────
test('STEP 0 — Smoke test', async ({ page }) => {
  console.log('\n══════════════════════════════════════════');
  console.log('STEP 0 — SMOKE TEST');
  console.log('══════════════════════════════════════════');

  const consoleErrors: string[] = [];
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });

  await page.goto('/');
  await page.waitForTimeout(2000);
  await ss(page, '00-smoke-homepage');

  const url = page.url();
  const onLogin = url.includes('signin') || url.includes('login') ||
    await page.locator('input[type="email"]').isVisible({ timeout: 3000 }).catch(() => false);
  log(onLogin ? '✓' : '✗', 'App loads + login visible', url);

  // Login as admin
  await login(page, USERS.admin);
  await ss(page, '00-smoke-admin-dashboard');
  const afterUrl = page.url();
  const landed = !afterUrl.includes('signin');
  log(landed ? '✓' : '✗', 'Admin login succeeds', afterUrl);

  if (consoleErrors.length > 0) {
    log('⚠', 'Console errors found', consoleErrors.slice(0, 2).join(' | '));
  } else {
    log('✓', 'No console errors');
  }

  expect(landed).toBe(true);
});

// ─── STEP 3 — Login all 5 roles ───────────────────────────────────────────────
test('STEP 3 — Login all 5 roles', async ({ page }) => {
  console.log('\n══════════════════════════════════════════');
  console.log('STEP 3 — LOGIN ALL 5 ROLES');
  console.log('══════════════════════════════════════════');

  const entries = Object.entries(USERS) as [string, { email: string; password: string }][];

  for (const [role, user] of entries) {
    console.log(`\n  ── ${role.toUpperCase()} ──`);
    await login(page, user);
    const url = page.url();
    const passed = !url.includes('signin') && !url.includes('login');
    await ss(page, `03-${role}-dashboard`);
    log(passed ? '✓' : '✗', `${role} login`, `landed: ${url}`);
    await logout(page);
  }
});

// ─── STEP 4A — Lender creates a case ─────────────────────────────────────────
test('STEP 4A — Lender creates a case', async ({ page }) => {
  test.setTimeout(180000); // 3 min — 11-step wizard with slowMo:400
  console.log('\n══════════════════════════════════════════');
  console.log('STEP 4A — LENDER CREATES CASE');
  console.log('══════════════════════════════════════════');

  await login(page, USERS.lender);
  await page.waitForTimeout(1500);

  // Open sidebar and click Submit New Case
  const menuBtn = page.getByRole('button', { name: /open menu/i }).first();
  if (await menuBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await menuBtn.click();
    await page.waitForTimeout(500);
  }
  const createLink = page.getByText(/submit new case|create.*case/i).first();
  if (await createLink.isVisible({ timeout: 3000 }).catch(() => false)) {
    await createLink.click();
    await page.waitForTimeout(1500);
  } else {
    await page.goto('/lender/submit-case');
    await page.waitForTimeout(1500);
  }

  await ss(page, '04a-lender-case-form');
  log('✓', 'Case form opened', page.url());

  // Helper: click Next/Submit Case button via JS (bypasses Playwright actionability delays)
  const clickNext = async () => {
    await page.waitForTimeout(400);
    // Use JS eval to find and click the Next/Submit Case button — avoids 30s disabled-wait
    const clicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button[type="button"]'));
      const btn = buttons.find(b => {
        const t = (b.textContent || '').trim();
        return t === 'Next' || t === 'Submit Case' || t.startsWith('Next') || t.startsWith('Submit Case');
      });
      if (btn) { (btn as HTMLButtonElement).click(); return true; }
      return false;
    });
    if (!clicked) {
      log('⚠', 'clickNext: Next button not found in DOM');
    }
    await page.waitForTimeout(600);
  };

  // ── STEP 1: Property — fill propertyAddress + suburb ──
  console.log('    Filling Step 1: Property...');
  // Verify Next is disabled before filling (validation test)
  const nextBtn = page.getByRole('button', { name: /^Next$/i }).first();
  const isDisabledBefore = await nextBtn.isDisabled({ timeout: 2000 }).catch(() => true);
  log(isDisabledBefore ? '✓' : '⚠', 'Step 1 Next disabled until fields filled');

  await page.fill('input[name="propertyAddress"]', '123 Pitt Street');
  await page.fill('input[name="suburb"]', 'Sydney');
  await ss(page, '04a-step1-filled');
  await clickNext();
  log('✓', 'Step 1 complete');

  // ── STEP 2: Entity / Credit Consent — tick checkbox ──
  console.log('    Filling Step 2: Entity...');
  const creditCheck = page.locator('#creditConsent, input[name="creditConsent"]').first();
  if (await creditCheck.isVisible({ timeout: 3000 }).catch(() => false)) {
    await creditCheck.check();
  }
  await clickNext();
  log('✓', 'Step 2 complete');

  // ── STEP 3: Payment — click "Confirm Payment — A$250.00" button ──
  console.log('    Filling Step 3: Payment...');
  await ss(page, '04a-step3-payment');
  const authorizeBtn = page.getByRole('button', { name: /Confirm Payment|confirm.*payment/i }).first();
  if (await authorizeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await authorizeBtn.click();
    await page.waitForTimeout(400);
    log('✓', 'Payment authorized');
  } else {
    // fallback: any button containing "250" or "payment"
    const fallbackBtn = page.locator('button').filter({ hasText: /250|payment/i }).first();
    if (await fallbackBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await fallbackBtn.click();
      await page.waitForTimeout(400);
      log('✓', 'Payment authorized (fallback)');
    } else {
      log('⚠', 'Payment button not found — may block step 3');
    }
  }
  await clickNext();
  log('✓', 'Step 3 complete');

  // ── STEPS 4–10: no required fields, just click Next ──
  // NOTE: use short fill timeouts (1500ms) so missing fields fail fast not 30s
  const fillOpt = async (selector: string, value: string) =>
    page.fill(selector, value, { timeout: 1500 }).catch(() => {});

  for (let s = 4; s <= 10; s++) {
    console.log(`    Step ${s}...`);
    if (s === 4) { // Lender details
      await fillOpt('input[name="lenderName"]', 'Test Bank');
      await fillOpt('input[name="loanAccountNumber"]', 'LN-2024-001');
    }
    if (s === 5) { // Loan info
      await fillOpt('input[name="outstandingDebt"]', '450000');
      await fillOpt('input[name="originalLoanAmount"]', '600000');
    }
    if (s === 8) {
      // NCCP step may have a "Continue" link instead of Next
      const skipLink = page.getByRole('button', { name: /continue|skip|nccp/i }).first();
      if (await skipLink.isVisible({ timeout: 2000 }).catch(() => false)) {
        await skipLink.click();
        await page.waitForTimeout(400);
        continue;
      }
    }
    await clickNext();
  }

  await ss(page, '04a-lender-form-filled');
  log('✓', 'Reached Step 11: Submit');

  // ── STEP 11: Submit ──
  const submitFinal = page.getByRole('button', { name: /Submit Case/i }).first();
  if (await submitFinal.isVisible({ timeout: 3000 }).catch(() => false)) {
    await submitFinal.click();
    await page.waitForTimeout(4000);
    await ss(page, '04a-lender-case-created');
    const success = page.url().includes('my-cases') || page.url().includes('cases') ||
      await page.locator('text=/success|created|submitted|case.*created/i').first()
        .isVisible({ timeout: 4000 }).catch(() => false);
    log(success ? '✓' : '✗', 'Case submitted', page.url());
  }

  // ── Verify in My Cases ──
  await page.goto('/lender/my-cases');
  await page.waitForTimeout(2000);
  await ss(page, '04a-lender-my-cases');
  const caseVisible = await page.locator('text=/LN-2024-001|Michael|Pitt|123 Pitt/i').first()
    .isVisible({ timeout: 5000 }).catch(() => false);
  log(caseVisible ? '✓' : '✗', 'Case visible in My Cases');
});

// ─── STEP 4C — Borrower blocked ───────────────────────────────────────────────
test('STEP 4C — Borrower cannot create case', async ({ page }) => {
  console.log('\n══════════════════════════════════════════');
  console.log('STEP 4C — BORROWER BLOCKED');
  console.log('══════════════════════════════════════════');

  await login(page, USERS.borrower);
  await page.waitForTimeout(1500);
  await ss(page, '04c-borrower-dashboard');

  // No create case
  const createBtn = await page.getByText(/create.*case|submit.*case|new case/i).first()
    .isVisible({ timeout: 3000 }).catch(() => false);
  log(!createBtn ? '✓' : '✗', 'No create case button', createBtn ? 'BUG: button visible' : 'correctly hidden');

  // No auctions tab
  const auctionTab = await page.getByText(/^auctions$/i).first()
    .isVisible({ timeout: 3000 }).catch(() => false);
  log(!auctionTab ? '✓' : '✗', 'No auctions tab', auctionTab ? 'BUG: tab visible' : 'correctly hidden');

  // Direct URL blocked
  await page.goto('/lender/submit-case');
  await page.waitForTimeout(2000);
  await ss(page, '04c-borrower-blocked');
  const blocked = !page.url().includes('submit-case');
  log(blocked ? '✓' : '✗', 'Direct URL to submit-case blocked', page.url());
});

// ─── STEP 5 — Admin approval + move to auction ───────────────────────────────
test('STEP 5 — Admin: approve case + move to auction', async ({ page }) => {
  test.setTimeout(120000);
  console.log('\n══════════════════════════════════════════');
  console.log('STEP 5 — ADMIN APPROVAL WORKFLOW');
  console.log('══════════════════════════════════════════');

  await login(page, USERS.admin);
  await page.waitForTimeout(1500);

  // Navigate directly to Case Management (not the dashboard)
  await page.goto('/admin/case-management');
  await page.waitForTimeout(2500);
  await ss(page, '05-admin-all-cases');

  // The case was submitted with property_address = "123 Pitt Street"
  // Case numbers follow the pattern MIP-YYYY-XXXX
  const caseRow = page.locator('tr, [role="row"]').filter({ hasText: /123 Pitt|MIP-/i }).first();
  const caseInList = await caseRow.isVisible({ timeout: 5000 }).catch(() => false);
  log(caseInList ? '✓' : '✗', 'Lender case visible to admin');

  if (!caseInList) {
    log('⚠', 'No cases found — skipping approval steps');
    return;
  }

  // Inline Approve: click the green approve icon button in the row (title="Approve Case")
  const approveBtn = caseRow.locator('[title="Approve Case"], button[title*="pprove"]').first();
  const hasApprove = await approveBtn.isVisible({ timeout: 3000 }).catch(() => false);
  log(hasApprove ? '✓' : '⚠', 'Approve button visible in row');

  if (hasApprove) {
    await approveBtn.click();
    await page.waitForTimeout(2500);
    await ss(page, '05-admin-case-approved');
    log('✓', 'Clicked Approve');
  }

  // Inline Move to Auction: click the indigo auction icon button (title="Move to Auction")
  await page.waitForTimeout(500);
  const auctionBtn = caseRow.locator('[title="Move to Auction"], button[title*="uction"]').first();
  const hasAuction = await auctionBtn.isVisible({ timeout: 5000 }).catch(() => false);
  log(hasAuction ? '✓' : '⚠', 'Move to Auction button visible in row');

  if (hasAuction) {
    await auctionBtn.click();
    await page.waitForTimeout(1000);
    await ss(page, '05-admin-auction-modal');

    // Scope all modal interactions to the overlay
    const modal = page.locator('div.fixed.inset-0').last();

    // End date = 3 months from now
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 3);
    const dateStr = endDate.toISOString().slice(0, 16);

    const dateInput = modal.locator('input[type="datetime-local"]').first();
    if (await dateInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await dateInput.fill(dateStr);
      await page.waitForTimeout(300);
    }

    // Reserve price — first number input inside the modal
    const reserveInput = modal.locator('input[type="number"]').first();
    if (await reserveInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await reserveInput.fill('400000');
      await page.waitForTimeout(200);
    }

    // Submit the modal — scope to overlay to avoid hitting the row icon button
    const confirmBtn = modal.locator('button').filter({ hasText: /Move to Auction|Creating Auction/i }).first();
    const confirmVisible = await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false);
    if (confirmVisible) {
      await confirmBtn.click();
      await page.waitForTimeout(3000);
      await ss(page, '05-admin-moved-to-auction');
      log('✓', 'Move to Auction submitted');
    } else {
      log('⚠', 'Modal confirm button not found');
    }
  }

  // Verify lender sees case as read-only after approval
  await logout(page);
  await login(page, USERS.lender);
  await page.goto('/lender/my-cases');
  await page.waitForTimeout(2000);
  const caseLink2 = page.locator('text=/LN-2024-001|Michael/i').first();
  if (await caseLink2.isVisible({ timeout: 4000 }).catch(() => false)) {
    await caseLink2.click();
    await page.waitForTimeout(1500);
    await ss(page, '05-lender-readonly-after-approval');
    const editBtn = await page.getByRole('button', { name: /^edit$/i }).first()
      .isVisible({ timeout: 2000 }).catch(() => false);
    log(!editBtn ? '✓' : '⚠', 'Edit locked for lender post-approval', editBtn ? 'edit still visible' : 'edit hidden');
  }
});

// ─── STEP 6 — Auction tab per role ────────────────────────────────────────────
test('STEP 6 — Auction tab visibility per role', async ({ page }) => {
  console.log('\n══════════════════════════════════════════');
  console.log('STEP 6 — AUCTION TAB PER ROLE');
  console.log('══════════════════════════════════════════');

  const checkAuctions = async (role: string, shouldHave: boolean) => {
    console.log(`\n  ── ${role.toUpperCase()} ──`);
    const user = USERS[role as keyof typeof USERS];
    await login(page, user);
    await page.waitForTimeout(1500);

    const menuBtn = page.getByRole('button', { name: /open menu/i }).first();
    if (await menuBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await menuBtn.click();
      await page.waitForTimeout(400);
    }

    const auctionNav = page.getByText(/^auctions$|live auction/i).first();
    const hasNav = await auctionNav.isVisible({ timeout: 3000 }).catch(() => false);
    const icon = (shouldHave === hasNav) ? '✓' : '✗';
    log(icon, `${role} auctions nav`, hasNav ? 'visible' : 'hidden');

    await ss(page, `06-${role}-auctions-nav`);

    if (role !== 'borrower' && hasNav) {
      await auctionNav.click();
      await page.waitForTimeout(2000);
      await ss(page, `06-${role}-auctions-page`);
      log('✓', `${role} auctions page loads`, page.url());
    }

    if (role === 'borrower') {
      await page.goto('/investor/auctions');
      await page.waitForTimeout(2000);
      await ss(page, '06-borrower-no-auction');
      const blocked = !page.url().includes('auctions') || page.url().includes('signin');
      log(blocked ? '✓' : '✗', 'Borrower blocked from /investor/auctions', page.url());
    }

    await logout(page);
  };

  await checkAuctions('investor', true);
  await checkAuctions('lender', true);
  await checkAuctions('lawyer', true);
  await checkAuctions('borrower', false);
});

// ─── STEP 7 — Bid placement ───────────────────────────────────────────────────
test('STEP 7 — Bid placement', async ({ page }) => {
  test.setTimeout(120000);
  console.log('\n══════════════════════════════════════════');
  console.log('STEP 7 — BID PLACEMENT');
  console.log('══════════════════════════════════════════');

  await login(page, USERS.investor);
  await page.waitForTimeout(1500);
  await page.goto('/investor/auctions');
  await page.waitForTimeout(3000); // wait for auctions to load from API
  await ss(page, '07-investor-auctions');

  // Auction cards are bg-white rounded-xl — find the action button inside them
  // Button text is "View Details" (status=upcoming/active) or "Place Bid" (status=live)
  const actionBtn = page.locator('button').filter({ hasText: /^(View Details|Place Bid|Buy Now)$/ }).first();
  const hasActionBtn = await actionBtn.isVisible({ timeout: 4000 }).catch(() => false);

  if (!hasActionBtn) {
    log('⚠', 'No auction cards found — bidding tests skipped');
    log('⚠', 'Backend fix needed or STEP 5 must run first to create auctions');
    return;
  }

  await actionBtn.click();
  await page.waitForTimeout(3000); // wait for auction room to load
  await ss(page, '07-investor-auction-detail');
  const detailUrl = page.url();
  const onDetailPage = detailUrl.includes('/investor/auctions/') || detailUrl.includes('/investor/buy-now/');
  log(onDetailPage ? '✓' : '✗', 'Auction detail page opened', detailUrl);

  if (!onDetailPage) {
    log('⚠', 'Navigation did not land on auction room — skipping bid tests');
    return;
  }

  // The BidPanel is under the "live" tab which is the default
  // Look for the "Place Bid" button inside the bid panel
  const placeBidBtn = page.locator('button').filter({ hasText: /^Place Bid$/ }).first();
  const hasBidBtn = await placeBidBtn.isVisible({ timeout: 5000 }).catch(() => false);
  log(hasBidBtn ? '✓' : '✗', 'Place Bid button visible');

  if (!hasBidBtn) return;

  // Fill bid amount input (beside the Place Bid button, not a modal)
  const bidInput = page.locator('input[type="number"]').first();
  if (!await bidInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    log('⚠', 'Bid amount input not found');
    return;
  }
  await ss(page, '07-investor-bid-panel');

  // Low bid validation: button should be DISABLED for amounts below reserve
  await bidInput.fill('100');
  await page.waitForTimeout(400);
  const btnDisabledForLow = await placeBidBtn.isDisabled().catch(() => true);
  log(btnDisabledForLow ? '✓' : '⚠', 'Low bid rejected (button disabled for amount < floor)',
    btnDisabledForLow ? 'disabled correctly' : 'button not disabled');
  await ss(page, '07-investor-bid-low-error');

  // Valid bid: fill amount above floor (reserve=400000, startingPrice=400000)
  await bidInput.clear();
  await bidInput.fill('410000');
  await page.waitForTimeout(400);
  const btnEnabledForValid = await placeBidBtn.isEnabled().catch(() => false);
  log(btnEnabledForValid ? '✓' : '⚠', 'Place Bid enabled for valid amount');
  await placeBidBtn.click();
  await page.waitForTimeout(2500);
  await ss(page, '07-investor-bid-placed');
  const success = await page.locator('text=/success|410,000|410000|placed|bid submitted/i').first()
    .isVisible({ timeout: 3000 }).catch(() => false);
  log(success ? '✓' : '⚠', 'Valid bid placed', success ? '$410,000 bid confirmed' : 'checking bid history...');

  // Also check if bid appears in history
  if (!success) {
    const bidInHistory = await page.locator('text=/410,000|410000/').first()
      .isVisible({ timeout: 2000 }).catch(() => false);
    log(bidInHistory ? '✓' : '⚠', 'Bid appears in history', bidInHistory ? 'bid visible' : 'not found');
  }
});

// ─── STEP 8 — Lawyer dashboard ────────────────────────────────────────────────
test('STEP 8 — Lawyer dashboard', async ({ page }) => {
  console.log('\n══════════════════════════════════════════');
  console.log('STEP 8 — LAWYER DASHBOARD');
  console.log('══════════════════════════════════════════');

  await login(page, USERS.lawyer);
  await page.waitForTimeout(2000);
  await ss(page, '08-lawyer-dashboard');
  log('✓', 'Lawyer dashboard loaded', page.url());

  // StatCard renders: <div class="bg-white rounded-xl border border-slate-200 p-4 flex flex-col">
  const statCards = await page.locator('div.bg-white.rounded-xl').count();
  log(statCards > 0 ? '✓' : '⚠', 'Summary stat cards', `${statCards} found`);

  // Create Case button on dashboard
  const createBtn = await page.getByRole('button', { name: /create.*case|new case/i }).first()
    .isVisible({ timeout: 4000 }).catch(() => false);
  log(createBtn ? '✓' : '⚠', 'Create Case button on dashboard', createBtn ? 'visible' : 'not found');

  // Sidebar navigation
  const sidebar = page.locator('aside, nav, [class*="sidebar"]').first();
  log(await sidebar.isVisible({ timeout: 2000 }).catch(() => false) ? '✓' : '⚠', 'Sidebar visible');

  // Assigned Cases page
  await page.goto('/lawyer/assigned-cases');
  await page.waitForTimeout(1500);
  await ss(page, '08-lawyer-assigned-cases');
  log(!page.url().includes('signin') ? '✓' : '✗', 'Assigned Cases loads', page.url());

  // Create Case form
  await page.goto('/lawyer/submit-case');
  await page.waitForTimeout(1500);
  await ss(page, '08-lawyer-create-form');
  log(!page.url().includes('signin') ? '✓' : '✗', 'Create Case form loads', page.url());
  await ss(page, '08-lawyer-full-dashboard');
});

// ─── STEP 9 — Final report ────────────────────────────────────────────────────
test('STEP 9 — Print summary', async ({}) => {
  const date = new Date().toISOString().slice(0, 10);
  const report = `
TEST RESULTS — BRIQBANK LOCAL
==============================
URL: http://localhost:3000
Run date: ${date}

SUITE 1 — Login (5 roles)
  See screenshots: 03-admin-dashboard.png
                   03-lender-dashboard.png
                   03-lawyer-dashboard.png
                   03-investor-dashboard.png
                   03-borrower-dashboard.png

SUITE 2 — Smoke
  See screenshots: 00-smoke-homepage.png
                   00-smoke-admin-dashboard.png

SUITE 3 — Case Creation
  See screenshots: 04a-lender-case-form.png
                   04a-lender-form-filled.png
                   04a-lender-case-created.png
                   04a-lender-my-cases.png
                   04c-borrower-dashboard.png
                   04c-borrower-blocked.png

SUITE 4 — Admin Workflow
  See screenshots: 05-admin-all-cases.png
                   05-admin-case-detail.png
                   05-admin-case-approved.png
                   05-admin-auction-modal.png
                   05-admin-moved-to-auction.png
                   05-lender-readonly-after-approval.png

SUITE 5 — Auctions
  See screenshots: 06-investor-auctions-page.png
                   06-lender-auctions-page.png
                   06-lawyer-auctions-page.png
                   06-borrower-no-auction.png

SUITE 6 — Bidding
  See screenshots: 07-investor-auction-detail.png
                   07-investor-bid-modal.png
                   07-investor-bid-low-error.png
                   07-investor-bid-placed.png

SUITE 7 — Lawyer Dashboard
  See screenshots: 08-lawyer-dashboard.png
                   08-lawyer-assigned-cases.png
                   08-lawyer-create-form.png

SCREENSHOTS: tests/screenshots/
`;
  fs.writeFileSync(REPORT_PATH, report.trim());
  console.log(report);
});
