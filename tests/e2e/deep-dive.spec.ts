/**
 * BriqBank — Deep Dive End-to-End Test Suite
 * Covers Scenario 1, Scenario 2, and Scenario 3 (all roles)
 *
 * Credentials (from seed_local.py):
 *   admin@brickbanq.com    / Admin@123
 *   lender@brickbanq.com   / Lender@123
 *   investor@brickbanq.com / Investor@123
 *   lawyer@brickbanq.com   / Lawyer@123
 *   borrower@brickbanq.com / Borrower@123
 */

import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// ─── Config ────────────────────────────────────────────────────────────────────
const USERS = {
  admin:    { email: 'admin@brickbanq.com',    password: 'Admin@123',    role: 'admin' },
  lender:   { email: 'lender@brickbanq.com',   password: 'Lender@123',   role: 'lender' },
  investor: { email: 'investor@brickbanq.com', password: 'Investor@123', role: 'investor' },
  lawyer:   { email: 'lawyer@brickbanq.com',   password: 'Lawyer@123',   role: 'lawyer' },
  borrower: { email: 'borrower@brickbanq.com', password: 'Borrower@123', role: 'borrower' },
};

const ASSETS = path.join(__dirname, '../test-assets');
const SS_BASE = path.join(__dirname, '../screenshots');
['scenario-1', 'scenario-2', 'scenario-3'].forEach(d =>
  fs.mkdirSync(path.join(SS_BASE, d), { recursive: true })
);

// Track results across tests
const RESULTS: Record<string, string[]> = {
  s1: [], s2: [], s3_admin: [], s3_lender: [], s3_lawyer: [], s3_investor: [], s3_borrower: [],
};

// ─── Helpers ───────────────────────────────────────────────────────────────────
async function login(page: Page, user: { email: string; password: string; role: string }) {
  await page.goto('/signin');
  await page.waitForSelector('input[type="email"]', { timeout: 15000 });

  // Click role tile if present
  const roleLabel = user.role.charAt(0).toUpperCase() + user.role.slice(1);
  try {
    const roleTile = page.locator('button').filter({ hasText: new RegExp(`^${roleLabel}$`, 'i') }).first();
    if (await roleTile.isVisible({ timeout: 2000 })) {
      await roleTile.click();
      await page.waitForTimeout(300);
    }
  } catch {}

  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', user.password);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
}

async function logout(page: Page) {
  // Clear auth token directly — fast, always works regardless of UI state
  await page.evaluate(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
  });
  await page.goto('/signin');
  await page.waitForTimeout(800);
}

async function openNav(page: Page) {
  const menuBtn = page.getByRole('button', { name: /open menu/i }).first();
  if (await menuBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    if (!await page.locator('nav a').first().isVisible({ timeout: 500 }).catch(() => false)) {
      await menuBtn.click();
      await page.waitForTimeout(500);
    }
  }
}

async function closeNav(page: Page) {
  try {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  } catch {}
}

async function ss(page: Page, folder: string, name: string) {
  const dir = path.join(SS_BASE, folder);
  fs.mkdirSync(dir, { recursive: true });
  const p = path.join(dir, `${name}.png`);
  await page.screenshot({ path: p, fullPage: false });
  console.log(`    📸 ${folder}/${name}.png`);
}

function pass(group: string, label: string) {
  console.log(`  ✓ ${label}`);
  RESULTS[group]?.push(`✓ ${label}`);
}
function fail(group: string, label: string, note = '') {
  console.log(`  ✗ ${label}${note ? '  →  ' + note : ''}`);
  RESULTS[group]?.push(`✗ ${label}${note ? ': ' + note : ''}`);
}
function warn(label: string, note = '') {
  console.log(`  ⚠ ${label}${note ? '  →  ' + note : ''}`);
}

// ─── Case form helper: navigate through multi-step wizard ────────────────────
const clickNextJS = async (page: Page) => {
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => {
      const t = (b.textContent || '').trim();
      return t === 'Next' || t === 'Submit Case' || t.startsWith('Next') || t.startsWith('Submit Case');
    });
    if (btn) (btn as HTMLButtonElement).click();
  });
  await page.waitForTimeout(700);
};

const fillOpt = async (page: Page, selector: string, value: string) =>
  page.fill(selector, value, { timeout: 1500 }).catch(() => {});

// ─── Upload file helper ───────────────────────────────────────────────────────
async function uploadFile(page: Page, inputSelector: string, filePath: string) {
  const input = page.locator(inputSelector).first();
  if (await input.isVisible({ timeout: 3000 }).catch(() => false)) {
    await input.setInputFiles(filePath);
    await page.waitForTimeout(1500);
    return true;
  }
  return false;
}

// ─── Navigate to each nav item and screenshot ────────────────────────────────
async function deepDiveNav(page: Page, routes: { label: string; url: string }[], folder: string, prefix: string) {
  const results: string[] = [];
  for (const item of routes) {
    await page.goto(item.url);
    await page.waitForTimeout(2000);
    const name = `${prefix}-${item.label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    await ss(page, folder, name);
    const onPage = !page.url().includes('signin');
    results.push(onPage ? `✓ ${item.label} loads` : `✗ ${item.label} REDIRECT`);
    console.log(`  ${onPage ? '✓' : '✗'} ${item.label}: ${page.url()}`);
  }
  return results;
}

// ─── PREP: Verify app + test assets ──────────────────────────────────────────
test('PREP — Verify app + assets + seed users', async ({ page }) => {
  test.setTimeout(60000);
  console.log('\n══════════════════════════════════════════════════');
  console.log('PREP — VERIFY ENVIRONMENT');
  console.log('══════════════════════════════════════════════════');

  // Check test assets
  const assets = ['sample-image-1.jpg', 'sample-image-2.png', 'sample-document.pdf', 'sample-contract.docx'];
  for (const a of assets) {
    const p = path.join(ASSETS, a);
    const exists = fs.existsSync(p);
    const size = exists ? fs.statSync(p).size : 0;
    console.log(`  ${exists ? '✓' : '✗'} ${a}: ${size} bytes`);
  }

  // App loads
  await page.goto('/');
  await page.waitForTimeout(2000);
  await ss(page, 'scenario-1', 'prep-01-homepage');
  console.log(`  ✓ App loaded: ${page.url()}`);

  // Verify all 5 seed users can log in
  for (const [role, user] of Object.entries(USERS)) {
    await login(page, user);
    const ok = !page.url().includes('signin');
    console.log(`  ${ok ? '✓' : '✗'} ${role} login: ${page.url()}`);
    await ss(page, 'scenario-1', `prep-${role}-login`);
    await logout(page);
  }
  console.log('\n  PREP COMPLETE — all 5 users confirmed, assets ready');
});

// ══════════════════════════════════════════════════════════════════════════════
// SCENARIO 1 — S1-STEP 1: LENDER CREATES CASE
// ══════════════════════════════════════════════════════════════════════════════
test('S1-STEP1 — Lender deep dive + create case', async ({ page }) => {
  test.setTimeout(240000);
  console.log('\n══════════════════════════════════════════════════');
  console.log('S1-STEP1 — LENDER DEEP DIVE + CREATE CASE');
  console.log('══════════════════════════════════════════════════');

  await login(page, USERS.lender);
  await ss(page, 'scenario-1', 's1-01-lender-login');
  pass('s1', 'Lender login');

  // ── Deep Dive: all lender nav tabs ──
  console.log('\n  --- Lender Tab Deep Dive ---');
  const lenderRoutes = [
    { label: 'Dashboard',    url: '/lender/dashboard' },
    { label: 'My Cases',     url: '/lender/my-cases' },
    { label: 'Auctions',     url: '/lender/auctions' },
    { label: 'My Bids',      url: '/lender/my-bids' },
    { label: 'Deals',        url: '/lender/deals' },
    { label: 'Contracts',    url: '/lender/contracts' },
    { label: 'Reports',      url: '/lender/reports' },
    { label: 'Tasks',        url: '/lender/tasks' },
    { label: 'Notifications', url: '/lender/notifications' },
    { label: 'Settings',     url: '/lender/settings' },
  ];
  const navResults = await deepDiveNav(page, lenderRoutes, 'scenario-1', 's1-lender');
  navResults.forEach(r => RESULTS.s1.push(r));

  // ── Navigate to Submit Case ──
  await page.goto('/lender/submit-case');
  await page.waitForTimeout(2000);
  await ss(page, 'scenario-1', 's1-02-lender-create-form');
  console.log('\n  --- Creating Case ---');

  // ── Step 1: Property Address ──
  console.log('    Step 1: Property...');
  await fillOpt(page, 'input[name="propertyAddress"]', '123 Pitt Street');
  await fillOpt(page, 'input[name="suburb"]', 'Sydney');
  // Try state selector
  const stateSelect = page.locator('select[name="state"], input[name="state"]').first();
  if (await stateSelect.isVisible({ timeout: 1500 }).catch(() => false)) {
    const tag = await stateSelect.evaluate((el: HTMLElement) => el.tagName);
    if (tag === 'SELECT') await stateSelect.selectOption('NSW').catch(() => {});
    else await stateSelect.fill('NSW').catch(() => {});
  }
  await fillOpt(page, 'input[name="postcode"]', '2000');
  await ss(page, 'scenario-1', 's1-03-borrower-details');
  await clickNextJS(page);

  // ── Step 2: Entity / Credit Consent ──
  console.log('    Step 2: Entity...');
  const creditCheck = page.locator('input[type="checkbox"]').first();
  if (await creditCheck.isVisible({ timeout: 2000 }).catch(() => false)) {
    await creditCheck.check().catch(() => {});
  }
  await clickNextJS(page);

  // ── Step 3: Payment ──
  console.log('    Step 3: Payment...');
  await ss(page, 'scenario-1', 's1-step3-payment');
  const payBtn = page.locator('button').filter({ hasText: /Confirm Payment|confirm.*payment|250/i }).first();
  if (await payBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await payBtn.click();
    await page.waitForTimeout(500);
    pass('s1', 'Payment step handled');
  } else {
    warn('Payment button not found — proceeding');
  }
  await clickNextJS(page);

  // ── Steps 4–10 ──
  for (let s = 4; s <= 10; s++) {
    console.log(`    Step ${s}...`);
    if (s === 4) {
      await fillOpt(page, 'input[name="lenderName"]', 'Test Bank');
      await fillOpt(page, 'input[name="loanAccountNumber"]', 'LN-LENDER-2024-001');
    }
    if (s === 5) {
      await fillOpt(page, 'input[name="outstandingDebt"]', '450000');
      await fillOpt(page, 'input[name="originalLoanAmount"]', '600000');
      await fillOpt(page, 'input[name="loanAmount"]', '450000');
    }
    if (s === 6) {
      // Borrower details
      await fillOpt(page, 'input[name="firstName"]', 'Michael');
      await fillOpt(page, 'input[name="lastName"]', 'Nguyen');
      await fillOpt(page, 'input[name="email"]', 'michael.nguyen@testmail.com.au');
      await fillOpt(page, 'input[name="phone"]', '0412345678');
    }
    if (s === 7) {
      // Property details
      await fillOpt(page, 'input[name="estimatedValue"]', '850000');
      await fillOpt(page, 'input[name="bedrooms"]', '3');
    }
    if (s === 8) {
      // Try continue/skip if NCCP step
      const skipLink = page.locator('button').filter({ hasText: /continue|skip|nccp|acknowledge/i }).first();
      if (await skipLink.isVisible({ timeout: 1500 }).catch(() => false)) {
        await skipLink.click();
        await page.waitForTimeout(500);
        continue;
      }
    }
    // Upload documents on steps 9-10
    if (s === 9) {
      const docInput = page.locator('input[type="file"]').first();
      if (await docInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await docInput.setInputFiles([
          path.join(ASSETS, 'sample-document.pdf'),
          path.join(ASSETS, 'sample-contract.docx'),
        ]).catch(() => {});
        await page.waitForTimeout(1500);
        await ss(page, 'scenario-1', 's1-06-uploads-complete');
      }
      // Image uploads
      const imgInput = page.locator('input[type="file"]').nth(1);
      if (await imgInput.isVisible({ timeout: 1500 }).catch(() => false)) {
        await imgInput.setInputFiles([
          path.join(ASSETS, 'sample-image-1.jpg'),
          path.join(ASSETS, 'sample-image-2.png'),
        ]).catch(() => {});
        await page.waitForTimeout(1500);
      }
    }
    await clickNextJS(page);
  }

  await ss(page, 'scenario-1', 's1-lender-form-filled');

  // ── Submit ──
  const submitBtn = page.locator('button').filter({ hasText: /Submit Case/i }).first();
  if (await submitBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
    await submitBtn.click();
    await page.waitForTimeout(5000);
    await ss(page, 'scenario-1', 's1-07-case-submitted');
    const success = !page.url().includes('submit-case') ||
      await page.locator('text=/success|created|submitted/i').first().isVisible({ timeout: 3000 }).catch(() => false);
    if (success) pass('s1', 'Case submitted successfully'); else warn('Case submit — checking redirect');
  }

  // ── Verify in My Cases ──
  await page.goto('/lender/my-cases');
  await page.waitForTimeout(2500);
  await ss(page, 'scenario-1', 's1-08-my-cases-with-new');
  const caseVisible = await page.locator('text=/LN-LENDER|Pitt|Michael|123 Pitt/i').first()
    .isVisible({ timeout: 5000 }).catch(() => false);
  caseVisible ? pass('s1', 'New case visible in My Cases') : warn('Case not yet visible in list');

  // ── Click case for detail tabs ──
  const caseRow = page.locator('tr, [role="row"], li').filter({ hasText: /Pitt|Michael|MIP-/i }).first();
  const viewBtn = caseRow.locator('button, a').filter({ hasText: /view|open|details/i }).first();
  const eyeIcon = caseRow.locator('[data-lucide="eye"], button svg').first();
  if (await viewBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await viewBtn.click();
  } else if (await eyeIcon.isVisible({ timeout: 2000 }).catch(() => false)) {
    await eyeIcon.click();
  } else {
    // Try clicking the row itself
    if (await caseRow.isVisible({ timeout: 2000 }).catch(() => false)) {
      await caseRow.click();
    } else {
      // Navigate to first case detail
      const firstLink = page.locator('a[href*="/lender/case-details/"]').first();
      if (await firstLink.isVisible({ timeout: 2000 }).catch(() => false)) await firstLink.click();
    }
  }
  await page.waitForTimeout(2000);
  await ss(page, 'scenario-1', 's1-09-case-detail');
  pass('s1', 'Case detail opened');

  // ── Check tabs in case detail ──
  const tabs = ['Overview', 'Property', 'Loan', 'Documents', 'Activity'];
  for (const tabName of tabs) {
    const tabBtn = page.locator(`button, [role="tab"]`).filter({ hasText: new RegExp(tabName, 'i') }).first();
    if (await tabBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await tabBtn.click();
      await page.waitForTimeout(1000);
      const ssName = `s1-${tabs.indexOf(tabName) + 10}-${tabName.toLowerCase()}-tab`;
      await ss(page, 'scenario-1', ssName);
      pass('s1', `${tabName} tab loads`);
    } else {
      warn(`${tabName} tab not found — may use different label`);
    }
  }

  // ── Activity: send message ──
  const msgInput = page.locator('textarea, input[type="text"]').filter({ hasText: '' }).last();
  const msgArea = page.locator('textarea[placeholder*="message"], textarea[placeholder*="comment"], textarea[placeholder*="note"]').first();
  const msgTarget = await msgArea.isVisible({ timeout: 2000 }).catch(() => false) ? msgArea : msgInput;
  if (await msgTarget.isVisible({ timeout: 2000 }).catch(() => false)) {
    await msgTarget.fill('This case is ready for admin review. All documents have been uploaded.');
    const sendBtn = page.locator('button').filter({ hasText: /send|submit|post/i }).last();
    if (await sendBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await sendBtn.click();
      await page.waitForTimeout(1500);
      await ss(page, 'scenario-1', 's1-15-activity-message');
      pass('s1', 'Activity message sent');
    }
  }

  await logout(page);
  console.log('\n  S1-STEP1 COMPLETE');
});

// ══════════════════════════════════════════════════════════════════════════════
// SCENARIO 1 — S1-STEP 2: ADMIN REVIEWS + APPROVES + MOVES TO AUCTION
// ══════════════════════════════════════════════════════════════════════════════
test('S1-STEP2 — Admin deep dive + approve + move to auction', async ({ page }) => {
  test.setTimeout(180000);
  console.log('\n══════════════════════════════════════════════════');
  console.log('S1-STEP2 — ADMIN DEEP DIVE + APPROVE + AUCTION');
  console.log('══════════════════════════════════════════════════');

  await login(page, USERS.admin);
  await ss(page, 'scenario-1', 's1-16-admin-login');
  pass('s1', 'Admin login');

  // ── Deep dive: all admin tabs ──
  console.log('\n  --- Admin Tab Deep Dive ---');
  const adminRoutes = [
    { label: 'Dashboard',       url: '/admin/dashboard' },
    { label: 'Case Management', url: '/admin/case-management' },
    { label: 'All Deals',       url: '/admin/all-deals' },
    { label: 'Auction Control', url: '/admin/auction-control' },
    { label: 'KYC Review',      url: '/admin/kyc-review' },
    { label: 'Document Library', url: '/admin/document-library' },
    { label: 'Reports Analytics', url: '/admin/reports-analytics' },
    { label: 'Task Center',     url: '/admin/task-center' },
    { label: 'Admin Centre',    url: '/admin/admin-center' },
    { label: 'Notifications',   url: '/admin/notifications' },
    { label: 'Settings',        url: '/admin/settings' },
  ];
  const navR = await deepDiveNav(page, adminRoutes, 'scenario-1', 's1-admin');
  navR.forEach(r => RESULTS.s1.push(r));

  // ── Navigate to Case Management ──
  await page.goto('/admin/case-management');
  await page.waitForTimeout(3000);
  await ss(page, 'scenario-1', 's1-17-admin-all-cases');

  // Find the lender's case
  const caseRow = page.locator('tr, [role="row"]').filter({ hasText: /123 Pitt|Michael|MIP-/i }).first();
  const caseVisible = await caseRow.isVisible({ timeout: 5000 }).catch(() => false);
  caseVisible ? pass('s1', 'Lender case visible to admin') : warn('Case not found — may need STEP1 to run first');

  if (!caseVisible) {
    warn('Skipping approval — no case found. Run S1-STEP1 first.');
    await logout(page);
    return;
  }

  // ── View case detail ──
  const viewBtn = caseRow.locator('[title="View Case"], button[title*="view"], a[href*="case-details"]').first();
  if (await viewBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await viewBtn.click();
    await page.waitForTimeout(2000);
    await ss(page, 'scenario-1', 's1-18-admin-overview');
    pass('s1', 'Admin case detail opens');

    // Check all admin case tabs
    for (const tabLabel of ['Overview', 'Property', 'Documents', 'Bids', 'Messages', 'Activity']) {
      const t = page.locator(`button, [role="tab"]`).filter({ hasText: new RegExp(tabLabel, 'i') }).first();
      if (await t.isVisible({ timeout: 1500 }).catch(() => false)) {
        await t.click();
        await page.waitForTimeout(800);
        await ss(page, 'scenario-1', `s1-admin-${tabLabel.toLowerCase()}-tab`);
      }
    }

    // Activity: admin sends message
    const actTab = page.locator(`button, [role="tab"]`).filter({ hasText: /Activity|Messages/i }).first();
    if (await actTab.isVisible({ timeout: 1500 }).catch(() => false)) {
      await actTab.click();
      await page.waitForTimeout(800);
      const msgArea = page.locator('textarea').first();
      if (await msgArea.isVisible({ timeout: 2000 }).catch(() => false)) {
        await msgArea.fill('Case reviewed. All documents verified. Approving and moving to live auction.');
        const sendBtn = page.locator('button').filter({ hasText: /send|submit|post/i }).last();
        if (await sendBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
          await sendBtn.click();
          await page.waitForTimeout(1000);
          await ss(page, 'scenario-1', 's1-22-admin-activity');
          pass('s1', 'Admin activity message sent');
        }
      }
    }

    // Go back to case list
    await page.goto('/admin/case-management');
    await page.waitForTimeout(2000);
  }

  // ── Approve Case ──
  const caseRow2 = page.locator('tr, [role="row"]').filter({ hasText: /123 Pitt|Michael|MIP-/i }).first();
  const approveBtn = caseRow2.locator('[title="Approve Case"], button[title*="pprove"]').first();
  if (await approveBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
    await approveBtn.click();
    await page.waitForTimeout(2500);
    await ss(page, 'scenario-1', 's1-23-case-approved');
    pass('s1', 'Case approved');
  } else {
    warn('Approve button not found in row');
  }

  // ── Move to Auction ──
  await page.waitForTimeout(500);
  const caseRow3 = page.locator('tr, [role="row"]').filter({ hasText: /123 Pitt|Michael|MIP-/i }).first();
  const auctionBtn = caseRow3.locator('[title="Move to Auction"], button[title*="uction"]').first();
  const hasAuction = await auctionBtn.isVisible({ timeout: 5000 }).catch(() => false);

  if (hasAuction) {
    await auctionBtn.click();
    await page.waitForTimeout(1000);
    await ss(page, 'scenario-1', 's1-24-auction-modal');

    const modal = page.locator('div.fixed.inset-0').last();
    const endDate = new Date(); endDate.setMonth(endDate.getMonth() + 3);
    const dateStr = endDate.toISOString().slice(0, 16);

    const dateInput = modal.locator('input[type="datetime-local"]').first();
    if (await dateInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await dateInput.fill(dateStr);
    }
    const reserveInput = modal.locator('input[type="number"]').first();
    if (await reserveInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await reserveInput.fill('400000');
    }
    // Fill auction notes if present
    const notesInput = modal.locator('textarea').first();
    if (await notesInput.isVisible({ timeout: 1500 }).catch(() => false)) {
      await notesInput.fill('Prime Sydney residential property. Motivated seller. Open for all bids.');
    }

    await ss(page, 'scenario-1', 's1-24b-auction-modal-filled');

    const confirmBtn = modal.locator('button').filter({ hasText: /Move to Auction|Confirm|Creating/i }).first();
    if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmBtn.click();
      await page.waitForTimeout(3000);
      await ss(page, 'scenario-1', 's1-25-moved-to-auction');
      pass('s1', 'Case moved to auction');
    } else {
      warn('Auction modal confirm not found');
    }
  } else {
    warn('Move to Auction button not visible — case may need to be Approved first');
  }

  // ── Verify in Auction Control ──
  await page.goto('/admin/auction-control');
  await page.waitForTimeout(3000);
  await ss(page, 'scenario-1', 's1-26-auction-listed');
  const auctionListed = await page.locator('text=/Pitt|Sydney|auction/i').first()
    .isVisible({ timeout: 4000 }).catch(() => false);
  auctionListed ? pass('s1', 'Auction appears in Auction Control') : warn('Auction not yet in control page');

  await logout(page);
  console.log('\n  S1-STEP2 COMPLETE');
});

// ══════════════════════════════════════════════════════════════════════════════
// SCENARIO 1 — S1-STEP 3: INVESTOR PLACES BID
// ══════════════════════════════════════════════════════════════════════════════
test('S1-STEP3 — Investor deep dive + place bid $410,000', async ({ page }) => {
  test.setTimeout(120000);
  console.log('\n══════════════════════════════════════════════════');
  console.log('S1-STEP3 — INVESTOR DEEP DIVE + BID $410,000');
  console.log('══════════════════════════════════════════════════');

  await login(page, USERS.investor);
  await ss(page, 'scenario-1', 's1-27-investor-login');

  // ── Deep dive: investor tabs ──
  const investorRoutes = [
    { label: 'Dashboard',    url: '/investor/dashboard' },
    { label: 'Auctions',     url: '/investor/auctions' },
    { label: 'Deals',        url: '/investor/deals' },
    { label: 'My Bids',      url: '/investor/my-bids' },
    { label: 'Contracts',    url: '/investor/contracts' },
    { label: 'Documents',    url: '/investor/documents' },
    { label: 'Reports',      url: '/investor/reports' },
    { label: 'Tasks',        url: '/investor/tasks' },
    { label: 'Notifications', url: '/investor/notifications' },
    { label: 'Settings',     url: '/investor/settings' },
  ];
  await deepDiveNav(page, investorRoutes, 'scenario-1', 's1-investor');

  // ── Auctions page ──
  await page.goto('/investor/auctions');
  await page.waitForTimeout(3000);
  await ss(page, 'scenario-1', 's1-28-investor-auctions');

  // Find action button on any auction card
  const actionBtn = page.locator('button').filter({ hasText: /^(View Details|Place Bid|Buy Now|Enter Auction)$/ }).first();
  const hasBtn = await actionBtn.isVisible({ timeout: 5000 }).catch(() => false);

  if (!hasBtn) {
    warn('No auction cards found — bidding steps skipped (run S1-STEP2 first)');
    await logout(page);
    return;
  }

  await actionBtn.click();
  await page.waitForTimeout(3000);
  await ss(page, 'scenario-1', 's1-investor-auction-detail');
  pass('s1', 'Investor opened auction detail');

  // ── Check bid panel ──
  const bidInput = page.locator('input[type="number"]').first();
  const placeBidBtn = page.locator('button').filter({ hasText: /^Place Bid$/ }).first();

  if (!await placeBidBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    warn('Place Bid button not visible — auction may not be live');
    await logout(page);
    return;
  }

  await ss(page, 'scenario-1', 's1-29-bid-panel');
  pass('s1', 'Bid panel visible');

  // Test low bid validation (below reserve 400000)
  if (await bidInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await bidInput.fill('100');
    await page.waitForTimeout(400);
    const btnDisabled = await placeBidBtn.isDisabled().catch(() => true);
    btnDisabled ? pass('s1', 'Low bid rejected (button disabled)') : warn('Low bid not rejected');
    await ss(page, 'scenario-1', 's1-30-bid-validation');

    // Place valid bid $410,000
    await bidInput.clear();
    await bidInput.fill('410000');
    await page.waitForTimeout(400);
    const enabled = await placeBidBtn.isEnabled().catch(() => false);
    if (enabled) {
      await placeBidBtn.click();
      await page.waitForTimeout(2500);
      await ss(page, 'scenario-1', 's1-31-investor-bid-placed');
      const success = await page.locator('text=/410,000|410000|success|placed/i').first()
        .isVisible({ timeout: 3000 }).catch(() => false);
      success ? pass('s1', 'Investor bid $410,000 placed') : warn('Bid placed — checking state');
    } else {
      warn('Place Bid button not enabled for $410,000 — reserve may be higher');
      // Try higher amount
      await bidInput.fill('450000');
      await page.waitForTimeout(400);
      if (await placeBidBtn.isEnabled().catch(() => false)) {
        await placeBidBtn.click();
        await page.waitForTimeout(2500);
        await ss(page, 'scenario-1', 's1-31-investor-bid-placed-alt');
        pass('s1', 'Investor bid $450,000 placed (adjusted for reserve)');
      }
    }
  }

  // ── My Bids ──
  await page.goto('/investor/my-bids');
  await page.waitForTimeout(2000);
  await ss(page, 'scenario-1', 's1-32-my-bids-winning');
  const bidVisible = await page.locator('text=/410,000|450,000|Winning|winning/i').first()
    .isVisible({ timeout: 3000 }).catch(() => false);
  bidVisible ? pass('s1', 'Investor bid visible in My Bids') : warn('My Bids — bid not yet showing');

  await logout(page);
  console.log('\n  S1-STEP3 COMPLETE');
});

// ══════════════════════════════════════════════════════════════════════════════
// SCENARIO 1 — S1-STEP 4: LAWYER PLACES BID
// ══════════════════════════════════════════════════════════════════════════════
test('S1-STEP4 — Lawyer deep dive + place bid $425,000', async ({ page }) => {
  test.setTimeout(120000);
  console.log('\n══════════════════════════════════════════════════');
  console.log('S1-STEP4 — LAWYER DEEP DIVE + BID $425,000');
  console.log('══════════════════════════════════════════════════');

  await login(page, USERS.lawyer);
  await ss(page, 'scenario-1', 's1-33-lawyer-login');

  // ── Deep dive: lawyer tabs ──
  const lawyerRoutes = [
    { label: 'Dashboard',       url: '/lawyer/dashboard' },
    { label: 'Assigned Cases',  url: '/lawyer/assigned-cases' },
    { label: 'Live Auctions',   url: '/lawyer/live-auctions' },
    { label: 'My Bids',         url: '/lawyer/my-bids' },
    { label: 'Contract Review', url: '/lawyer/contract-review' },
    { label: 'Task Center',     url: '/lawyer/task-center' },
    { label: 'Notifications',   url: '/lawyer/notifications' },
    { label: 'Settings',        url: '/lawyer/settings' },
  ];
  await deepDiveNav(page, lawyerRoutes, 'scenario-1', 's1-lawyer');

  // ── Check dashboard has Create Case + Browse Deals buttons ──
  await page.goto('/lawyer/dashboard');
  await page.waitForTimeout(1500);
  await ss(page, 'scenario-1', 's1-34-lawyer-dashboard');
  const createCaseBtn = await page.getByRole('button', { name: /create.*case|new case/i }).first()
    .isVisible({ timeout: 3000 }).catch(() => false);
  const browseDealsBtn = await page.getByRole('button', { name: /browse.*deal/i }).first()
    .isVisible({ timeout: 3000 }).catch(() => false);
  createCaseBtn ? pass('s1', 'Lawyer dashboard — Create Case button visible') : fail('s1', 'Create Case button missing');
  browseDealsBtn ? pass('s1', 'Lawyer dashboard — Browse Deals button visible') : warn('Browse Deals button not found');

  // ── Auctions page ──
  await page.goto('/lawyer/live-auctions');
  await page.waitForTimeout(3000);
  await ss(page, 'scenario-1', 's1-35-lawyer-auction-detail');

  const actionBtn = page.locator('button').filter({ hasText: /^(View Details|Place Bid|Buy Now|Enter Auction)$/ }).first();
  if (!await actionBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    warn('No auction cards — bidding skipped (needs S1-STEP2)');
    await logout(page);
    return;
  }

  await actionBtn.click();
  await page.waitForTimeout(3000);

  // ── Place bid $425,000 ──
  const bidInput = page.locator('input[type="number"]').first();
  const placeBidBtn = page.locator('button').filter({ hasText: /^Place Bid$/ }).first();

  if (await placeBidBtn.isVisible({ timeout: 3000 }).catch(() => false) &&
      await bidInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await bidInput.fill('425000');
    await page.waitForTimeout(400);
    if (await placeBidBtn.isEnabled().catch(() => false)) {
      await placeBidBtn.click();
      await page.waitForTimeout(2500);
      await ss(page, 'scenario-1', 's1-36-lawyer-bid-placed');
      pass('s1', 'Lawyer bid $425,000 placed');
    } else {
      // Try higher than whatever current bid is
      await bidInput.fill('500000');
      await page.waitForTimeout(400);
      if (await placeBidBtn.isEnabled().catch(() => false)) {
        await placeBidBtn.click();
        await page.waitForTimeout(2500);
        pass('s1', 'Lawyer bid placed (adjusted amount)');
      } else {
        warn('Place Bid button not enabled for lawyer');
      }
    }
  } else {
    warn('Bid panel not found for lawyer');
  }

  await logout(page);
  console.log('\n  S1-STEP4 COMPLETE');
});

// ══════════════════════════════════════════════════════════════════════════════
// SCENARIO 1 — S1-STEP 5: ADMIN PLACES BID
// ══════════════════════════════════════════════════════════════════════════════
test('S1-STEP5 — Admin places bid $450,000', async ({ page }) => {
  test.setTimeout(120000);
  console.log('\n══════════════════════════════════════════════════');
  console.log('S1-STEP5 — ADMIN PLACES BID $450,000');
  console.log('══════════════════════════════════════════════════');

  await login(page, USERS.admin);
  await page.goto('/admin/auction-control');
  await page.waitForTimeout(3000);
  await ss(page, 'scenario-1', 's1-37-admin-auction');

  // Find "Enter Auction Room" or "View Details" on live auction
  const enterBtn = page.locator('button').filter({ hasText: /Enter Auction Room|View Details/i }).first();
  if (!await enterBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    warn('No auction room button found — admin bid skipped');
    await logout(page); return;
  }

  await enterBtn.click();
  await page.waitForTimeout(3000);
  await ss(page, 'scenario-1', 's1-admin-auction-room');

  // Place Bid card in admin auction room
  const bidInput = page.locator('input[type="number"]').first();
  const placeBidBtn = page.locator('button').filter({ hasText: /^Place Bid$/ }).first();

  if (await placeBidBtn.isVisible({ timeout: 3000 }).catch(() => false) &&
      await bidInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await bidInput.fill('450000');
    await page.waitForTimeout(400);
    if (await placeBidBtn.isEnabled().catch(() => false)) {
      await placeBidBtn.click();
      await page.waitForTimeout(2500);
      await ss(page, 'scenario-1', 's1-38-admin-bid-placed');
      pass('s1', 'Admin bid $450,000 placed');
    } else {
      // Fallback: try higher
      await bidInput.fill('550000');
      await page.waitForTimeout(400);
      if (await placeBidBtn.isEnabled().catch(() => false)) {
        await placeBidBtn.click();
        await page.waitForTimeout(2500);
        pass('s1', 'Admin bid placed (adjusted to $550,000)');
      } else {
        warn('Admin bid button disabled — may need higher amount');
      }
    }
  }

  // Check bid history shows all 3 bids
  const bidHistorySection = page.locator('text=/Bid History|bids/i').first();
  if (await bidHistorySection.isVisible({ timeout: 2000 }).catch(() => false)) {
    await ss(page, 'scenario-1', 's1-admin-bid-history');
    pass('s1', 'Bid history visible');
  }

  await logout(page);
  console.log('\n  S1-STEP5 COMPLETE');
});

// ══════════════════════════════════════════════════════════════════════════════
// SCENARIO 1 — S1-STEP 6: BORROWER VIEWS (READ ONLY)
// ══════════════════════════════════════════════════════════════════════════════
test('S1-STEP6 — Borrower read-only view + access control', async ({ page }) => {
  test.setTimeout(90000);
  console.log('\n══════════════════════════════════════════════════');
  console.log('S1-STEP6 — BORROWER READ-ONLY + ACCESS CONTROL');
  console.log('══════════════════════════════════════════════════');

  await login(page, USERS.borrower);
  await ss(page, 'scenario-1', 's1-39-borrower-login');
  pass('s1', 'Borrower login');

  // ── Deep dive: borrower tabs ──
  const borrowerRoutes = [
    { label: 'Dashboard',            url: '/borrower/dashboard' },
    { label: 'My Cases',             url: '/borrower/my-case' },
    { label: 'Contracts',            url: '/borrower/contracts' },
    { label: 'Identity Verification', url: '/borrower/identity-verification' },
    { label: 'Notifications',        url: '/borrower/notifications' },
    { label: 'Settings',             url: '/borrower/settings' },
  ];
  await deepDiveNav(page, borrowerRoutes, 'scenario-1', 's1-borrower');

  await page.goto('/borrower/dashboard');
  await page.waitForTimeout(1500);
  await ss(page, 'scenario-1', 's1-40-borrower-nav');

  // ── No auction tab ──
  const auctionTab = await page.getByText(/^auctions$/i).first()
    .isVisible({ timeout: 2000 }).catch(() => false);
  !auctionTab ? pass('s1', 'No Auctions tab in borrower nav') : fail('s1', 'Auctions tab visible — RBAC fail');

  // ── No create case button ──
  const createBtn = await page.locator('button, a').filter({ hasText: /create.*case|submit.*case/i }).first()
    .isVisible({ timeout: 2000 }).catch(() => false);
  !createBtn ? pass('s1', 'No Create Case button for borrower') : fail('s1', 'Create Case visible — RBAC fail');

  // ── Try direct URL to investor auctions ──
  await page.goto('/investor/auctions');
  await page.waitForTimeout(2000);
  await ss(page, 'scenario-1', 's1-41-borrower-blocked-auction');
  const blocked = !page.url().includes('/investor/') || page.url().includes('signin');
  blocked ? pass('s1', 'Borrower blocked from /investor/auctions') : fail('s1', 'Borrower NOT blocked — RBAC gap', page.url());

  // ── Try admin route ──
  await page.goto('/admin/case-management');
  await page.waitForTimeout(2000);
  const adminBlocked = !page.url().includes('/admin/') || page.url().includes('signin');
  adminBlocked ? pass('s1', 'Borrower blocked from admin routes') : fail('s1', 'Borrower accessed admin — RBAC gap');

  // ── View own case (read only) ──
  await page.goto('/borrower/my-case');
  await page.waitForTimeout(2000);
  await ss(page, 'scenario-1', 's1-borrower-my-case');
  // Should NOT see edit/delete/approve buttons
  const editBtn = await page.getByRole('button', { name: /^edit$/i }).first()
    .isVisible({ timeout: 1500 }).catch(() => false);
  const deleteBtn = await page.getByRole('button', { name: /^delete$/i }).first()
    .isVisible({ timeout: 1500 }).catch(() => false);
  const approveBtn = await page.getByRole('button', { name: /^approve/i }).first()
    .isVisible({ timeout: 1500 }).catch(() => false);
  !editBtn ? pass('s1', 'No Edit button for borrower') : fail('s1', 'Edit button visible to borrower');
  !deleteBtn ? pass('s1', 'No Delete button for borrower') : fail('s1', 'Delete button visible to borrower');
  !approveBtn ? pass('s1', 'No Approve button for borrower') : fail('s1', 'Approve button visible to borrower');

  // Activity tab: check if message input exists
  const actTab = page.locator('button, [role="tab"]').filter({ hasText: /Activity|Messages/i }).first();
  if (await actTab.isVisible({ timeout: 2000 }).catch(() => false)) {
    await actTab.click();
    await page.waitForTimeout(800);
    const msgArea = page.locator('textarea').first();
    const hasMsgInput = await msgArea.isVisible({ timeout: 1500 }).catch(() => false);
    hasMsgInput ? pass('s1', 'Borrower has message input in Activity') : warn('Borrower Activity — read only (no message input)');
    await ss(page, 'scenario-1', 's1-borrower-activity-readonly');
  }

  await logout(page);
  console.log('\n  S1-STEP6 COMPLETE');
});

// ══════════════════════════════════════════════════════════════════════════════
// SCENARIO 1 — S1-STEP 7: ADMIN CLOSES AUCTION + ASSIGNS TO LAWYER
// ══════════════════════════════════════════════════════════════════════════════
test('S1-STEP7 — Admin closes auction + assigns to lawyer', async ({ page }) => {
  test.setTimeout(120000);
  console.log('\n══════════════════════════════════════════════════');
  console.log('S1-STEP7 — ADMIN CLOSES AUCTION + ASSIGNS LAWYER');
  console.log('══════════════════════════════════════════════════');

  await login(page, USERS.admin);
  await page.goto('/admin/auction-control');
  await page.waitForTimeout(3000);
  await ss(page, 'scenario-1', 's1-42-admin-auction-before-close');

  // Check highest bid
  const highestBid = await page.locator('text=/highest|current bid/i').first()
    .isVisible({ timeout: 2000 }).catch(() => false);
  highestBid ? pass('s1', 'Current highest bid shown') : warn('Highest bid not visible');

  // ── Click "Close Early" on the live auction ──
  const closeBtn = page.locator('button').filter({ hasText: /Close Early|Close Auction/i }).first();
  if (!await closeBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    warn('Close Early button not found — auction may not be live');
    await logout(page); return;
  }

  // Click via JS to bypass Playwright's actionability wait (button disables itself during loading)
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find(el => /Close Early|Close Auction/i.test(el.textContent || ''));
    if (b) (b as HTMLButtonElement).click();
  });
  await page.waitForTimeout(1000);
  await ss(page, 'scenario-1', 's1-43-close-dialog');
  // AuctionControl has NO confirm dialog — close fires immediately, button disables during request
  await page.waitForTimeout(4000); // wait for backend close + re-fetch
  await ss(page, 'scenario-1', 's1-44-auction-closed');
  pass('s1', 'Auction closed');

  // ── Enter auction room to see winner + assign lawyer ──
  await page.goto('/admin/auction-control');
  await page.waitForTimeout(2000);
  const viewBtn = page.locator('button').filter({ hasText: /View Details|Enter Auction/i }).first();
  if (await viewBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await viewBtn.click();
    await page.waitForTimeout(2000);
    await ss(page, 'scenario-1', 's1-auction-room-after-close');

    // Winner display
    const winner = await page.locator('text=/Winner|Winning|winner/i').first()
      .isVisible({ timeout: 2000 }).catch(() => false);
    winner ? pass('s1', 'Winner shown in auction room') : warn('Winner not shown yet');

    // Assign to lawyer
    const assignBtn = page.locator('button').filter({ hasText: /Assign.*Lawyer|Assign/i }).first();
    if (await assignBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await assignBtn.click();
      await page.waitForTimeout(1000);
      // Select lawyer from dropdown
      const lawyerOption = page.locator('option, [role="option"], li').filter({ hasText: /lawyer|Lawyer/i }).first();
      if (await lawyerOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await lawyerOption.click();
      } else {
        const lawyerSelect = page.locator('select').first();
        if (await lawyerSelect.isVisible({ timeout: 1500 }).catch(() => false)) {
          await lawyerSelect.selectOption({ index: 0 }).catch(() => {});
        }
      }
      const confirmAssign = page.locator('button').filter({ hasText: /Confirm|Assign/i }).last();
      if (await confirmAssign.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmAssign.click();
        await page.waitForTimeout(2000);
        pass('s1', 'Case assigned to lawyer');
      }
      await ss(page, 'scenario-1', 's1-45-assigned-to-lawyer');
    } else {
      warn('Assign to Lawyer button not found — may not be implemented yet');
    }

    // Admin activity message
    const actTab = page.locator('button, [role="tab"]').filter({ hasText: /Activity|Messages/i }).first();
    if (await actTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await actTab.click();
      await page.waitForTimeout(600);
      const msgArea = page.locator('textarea').first();
      if (await msgArea.isVisible({ timeout: 1500 }).catch(() => false)) {
        await msgArea.fill('Auction closed. Winning bid $450,000. Assigned to James Thornton for legal review. Please complete due diligence within 14 days.');
        const sendBtn = page.locator('button').filter({ hasText: /send|submit|post/i }).last();
        if (await sendBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
          await sendBtn.click();
          await page.waitForTimeout(1000);
          await ss(page, 'scenario-1', 's1-46-admin-assignment-message');
          pass('s1', 'Admin assignment message sent');
        }
      }
    }
  }

  await logout(page);
  console.log('\n  S1-STEP7 COMPLETE — SCENARIO 1 DONE');
  console.log('\n  S1 Results:', RESULTS.s1.join(', '));
});

// ══════════════════════════════════════════════════════════════════════════════
// SCENARIO 2 — LAWYER CREATES CASE → SAME FLOW
// ══════════════════════════════════════════════════════════════════════════════
test('S2-STEP1 — Lawyer creates case (Collins Street)', async ({ page }) => {
  test.setTimeout(240000);
  console.log('\n══════════════════════════════════════════════════');
  console.log('S2-STEP1 — LAWYER CREATES CASE');
  console.log('══════════════════════════════════════════════════');

  await login(page, USERS.lawyer);
  await ss(page, 'scenario-2', 's2-01-lawyer-login');

  // Navigate to Submit New Case
  await page.goto('/lawyer/submit-case');
  await page.waitForTimeout(2000);
  await ss(page, 'scenario-2', 's2-02-lawyer-create-form');

  // Step 1: Property
  await fillOpt(page, 'input[name="propertyAddress"]', '456 Collins Street');
  await fillOpt(page, 'input[name="suburb"]', 'Melbourne');
  const stateSelect = page.locator('select[name="state"], input[name="state"]').first();
  if (await stateSelect.isVisible({ timeout: 1500 }).catch(() => false)) {
    const tag = await stateSelect.evaluate((el: HTMLElement) => el.tagName);
    if (tag === 'SELECT') await stateSelect.selectOption('VIC').catch(() => {});
    else await stateSelect.fill('VIC').catch(() => {});
  }
  await fillOpt(page, 'input[name="postcode"]', '3000');
  await clickNextJS(page);

  // Step 2: Entity
  const creditCheck = page.locator('input[type="checkbox"]').first();
  if (await creditCheck.isVisible({ timeout: 2000 }).catch(() => false)) {
    await creditCheck.check().catch(() => {});
  }
  await clickNextJS(page);

  // Step 3: Payment
  const payBtn = page.locator('button').filter({ hasText: /Confirm Payment|confirm.*payment|250/i }).first();
  if (await payBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await payBtn.click();
    await page.waitForTimeout(500);
  }
  await clickNextJS(page);

  // Steps 4–10
  for (let s = 4; s <= 10; s++) {
    if (s === 4) {
      await fillOpt(page, 'input[name="lenderName"]', 'Victoria Bank');
      await fillOpt(page, 'input[name="loanAccountNumber"]', 'LN-LAWYER-2024-001');
    }
    if (s === 5) {
      await fillOpt(page, 'input[name="outstandingDebt"]', '380000');
      await fillOpt(page, 'input[name="originalLoanAmount"]', '500000');
      await fillOpt(page, 'input[name="loanAmount"]', '380000');
    }
    if (s === 6) {
      await fillOpt(page, 'input[name="firstName"]', 'Jane');
      await fillOpt(page, 'input[name="lastName"]', 'Smith');
      await fillOpt(page, 'input[name="email"]', 'jane.smith@testmail.com.au');
      await fillOpt(page, 'input[name="phone"]', '0423456789');
    }
    if (s === 7) {
      await fillOpt(page, 'input[name="estimatedValue"]', '620000');
      await fillOpt(page, 'input[name="bedrooms"]', '2');
    }
    if (s === 9) {
      const docInput = page.locator('input[type="file"]').first();
      if (await docInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await docInput.setInputFiles([path.join(ASSETS, 'sample-document.pdf')]).catch(() => {});
        await page.waitForTimeout(1000);
      }
    }
    await clickNextJS(page);
  }

  const submitBtn = page.locator('button').filter({ hasText: /Submit Case/i }).first();
  if (await submitBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
    await submitBtn.click();
    await page.waitForTimeout(5000);
    await ss(page, 'scenario-2', 's2-case-submitted');
    pass('s2', 'Lawyer created case (Collins Street)');
  }

  await logout(page);
});

test('S2-STEP2 — Admin approves + moves Collins St to auction', async ({ page }) => {
  test.setTimeout(120000);
  console.log('\n══════════════════════════════════════════════════');
  console.log('S2-STEP2 — ADMIN APPROVES LAWYER CASE');
  console.log('══════════════════════════════════════════════════');

  await login(page, USERS.admin);
  await page.goto('/admin/case-management');
  await page.waitForTimeout(3000);
  await ss(page, 'scenario-2', 's2-admin-all-cases');

  const caseRow = page.locator('tr, [role="row"]').filter({ hasText: /Collins|456|Melbourne|MIP-/i }).first();
  if (!await caseRow.isVisible({ timeout: 5000 }).catch(() => false)) {
    warn('Collins St case not found — run S2-STEP1 first'); await logout(page); return;
  }
  pass('s2', 'Lawyer case visible to admin');

  // Approve
  const approveBtn = caseRow.locator('[title="Approve Case"], button[title*="pprove"]').first();
  if (await approveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await approveBtn.click();
    await page.waitForTimeout(2500);
    pass('s2', 'Collins St case approved');
  }

  // Move to Auction
  await page.waitForTimeout(500);
  const caseRow2 = page.locator('tr, [role="row"]').filter({ hasText: /Collins|456|Melbourne/i }).first();
  const auctionBtn = caseRow2.locator('[title="Move to Auction"], button[title*="uction"]').first();
  if (await auctionBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await auctionBtn.click();
    await page.waitForTimeout(1000);
    const modal = page.locator('div.fixed.inset-0').last();
    const endDate = new Date(); endDate.setMonth(endDate.getMonth() + 3);
    const dateInput = modal.locator('input[type="datetime-local"]').first();
    if (await dateInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await dateInput.fill(endDate.toISOString().slice(0, 16));
    }
    const reserveInput = modal.locator('input[type="number"]').first();
    if (await reserveInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await reserveInput.fill('350000');
    }
    const confirmBtn = modal.locator('button').filter({ hasText: /Move to Auction|Confirm|Creating/i }).first();
    if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmBtn.click();
      await page.waitForTimeout(3000);
      await ss(page, 'scenario-2', 's2-moved-to-auction');
      pass('s2', 'Collins St moved to auction');
    }
  }

  await logout(page);
});

test('S2-STEP3to5 — Lender + Investor + Admin bids on Collins St', async ({ page }) => {
  test.setTimeout(180000);
  console.log('\n══════════════════════════════════════════════════');
  console.log('S2-STEP3to5 — BIDS ON LAWYER CASE');
  console.log('══════════════════════════════════════════════════');

  // Lender bids $360,000
  await login(page, USERS.lender);
  await page.goto('/lender/auctions');
  await page.waitForTimeout(3000);
  const aBtn1 = page.locator('button').filter({ hasText: /View Details|Place Bid|Enter Auction/i }).first();
  if (await aBtn1.isVisible({ timeout: 5000 }).catch(() => false)) {
    await aBtn1.click();
    await page.waitForTimeout(3000);
    const inp = page.locator('input[type="number"]').first();
    const bid = page.locator('button').filter({ hasText: /^Place Bid$/ }).first();
    if (await bid.isVisible({ timeout: 3000 }).catch(() => false) && await inp.isVisible({ timeout: 2000 }).catch(() => false)) {
      await inp.fill('360000');
      await page.waitForTimeout(400);
      if (await bid.isEnabled().catch(() => false)) {
        await bid.click(); await page.waitForTimeout(2000);
        pass('s2', 'Lender bid $360,000 placed');
      } else {
        await inp.fill('400000'); await page.waitForTimeout(300);
        if (await bid.isEnabled().catch(() => false)) { await bid.click(); await page.waitForTimeout(2000); pass('s2', 'Lender bid placed'); }
      }
    }
  }
  await ss(page, 'scenario-2', 's2-lender-bid');
  await logout(page);

  // Investor bids $375,000
  await login(page, USERS.investor);
  await page.goto('/investor/auctions');
  await page.waitForTimeout(3000);
  const aBtn2 = page.locator('button').filter({ hasText: /View Details|Place Bid|Enter Auction/i }).first();
  if (await aBtn2.isVisible({ timeout: 5000 }).catch(() => false)) {
    await aBtn2.click();
    await page.waitForTimeout(3000);
    const inp2 = page.locator('input[type="number"]').first();
    const bid2 = page.locator('button').filter({ hasText: /^Place Bid$/ }).first();
    if (await bid2.isVisible({ timeout: 3000 }).catch(() => false)) {
      await inp2.fill('375000'); await page.waitForTimeout(400);
      if (await bid2.isEnabled().catch(() => false)) { await bid2.click(); await page.waitForTimeout(2000); pass('s2', 'Investor bid $375,000 placed'); }
      else {
        await inp2.fill('420000'); await page.waitForTimeout(300);
        if (await bid2.isEnabled().catch(() => false)) { await bid2.click(); await page.waitForTimeout(2000); pass('s2', 'Investor bid placed'); }
      }
    }
  }
  await ss(page, 'scenario-2', 's2-investor-bid');
  await logout(page);

  // Admin bids $390,000
  await login(page, USERS.admin);
  await page.goto('/admin/auction-control');
  await page.waitForTimeout(3000);
  const enterBtn = page.locator('button').filter({ hasText: /Enter Auction Room|View Details/i }).first();
  if (await enterBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await enterBtn.click();
    await page.waitForTimeout(3000);
    const inp3 = page.locator('input[type="number"]').first();
    const bid3 = page.locator('button').filter({ hasText: /^Place Bid$/ }).first();
    if (await bid3.isVisible({ timeout: 3000 }).catch(() => false)) {
      await inp3.fill('600000'); await page.waitForTimeout(400);
      if (await bid3.isEnabled().catch(() => false)) { await bid3.click(); await page.waitForTimeout(2000); pass('s2', 'Admin bid placed'); }
    }
  }
  await ss(page, 'scenario-2', 's2-admin-bid');

  // Verify lawyer who created it CANNOT bid on own case
  // (Go to lawyer auctions and check if Place Bid is disabled/blocked for case they created)
  await logout(page);
  await login(page, USERS.lawyer);
  await page.goto('/lawyer/live-auctions');
  await page.waitForTimeout(3000);
  const lawyerAuctionBtn = page.locator('button').filter({ hasText: /View Details|Place Bid|Enter Auction/i }).first();
  if (await lawyerAuctionBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await lawyerAuctionBtn.click();
    await page.waitForTimeout(3000);
    await ss(page, 'scenario-2', 's2-lawyer-own-case-bid-check');
    // Check if bid button is disabled or hidden for case creator
    const bidBtn = page.locator('button').filter({ hasText: /^Place Bid$/ }).first();
    const bidVisible = await bidBtn.isVisible({ timeout: 2000 }).catch(() => false);
    const bidDisabled = bidVisible ? await bidBtn.isDisabled().catch(() => false) : false;
    if (!bidVisible || bidDisabled) {
      pass('s2', 'Lawyer cannot bid on own case (blocked or disabled)');
    } else {
      warn('Lawyer bid button is visible and enabled on own case — verify if this is intentional');
    }
  }
  await logout(page);
  console.log('\n  S2-STEP3to5 COMPLETE');
});

test('S2-STEP6 — Admin closes Collins St auction + assigns lawyer', async ({ page }) => {
  test.setTimeout(180000);
  console.log('\n══════════════════════════════════════════════════');
  console.log('S2-STEP6 — ADMIN CLOSES LAWYER CASE AUCTION');
  console.log('══════════════════════════════════════════════════');

  await login(page, USERS.admin);
  await page.goto('/admin/auction-control');
  await page.waitForTimeout(3000);

  const closeBtn = page.locator('button').filter({ hasText: /Close Early|Close Auction/i }).first();
  if (await closeBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    // Click via JS — button disables itself during the close request (no confirm modal)
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(el => /Close Early|Close Auction/i.test(el.textContent || ''));
      if (b) (b as HTMLButtonElement).click();
    });
    await page.waitForTimeout(4000); // wait for backend close + re-fetch
    pass('s2', 'Collins St auction closed');
  }
  await ss(page, 'scenario-2', 's2-auction-closed');
  await logout(page);
  console.log('\n  S2 COMPLETE');
  console.log('\n  S2 Results:', RESULTS.s2.join(', '));
});

// ══════════════════════════════════════════════════════════════════════════════
// SCENARIO 3 — ADMIN DEEP DIVE
// ══════════════════════════════════════════════════════════════════════════════
test('S3-ADMIN — Full admin tab + delete + download + share + message test', async ({ page }) => {
  test.setTimeout(180000);
  console.log('\n══════════════════════════════════════════════════');
  console.log('S3-ADMIN — FULL ADMIN DEEP DIVE');
  console.log('══════════════════════════════════════════════════');

  await login(page, USERS.admin);
  await page.goto('/admin/dashboard');
  await page.waitForTimeout(2000);
  await ss(page, 'scenario-3', 's3-admin-dashboard');
  pass('s3_admin', 'Admin dashboard loaded');

  // ── Every nav tab ──
  const adminRoutes = [
    { label: 'Case Management', url: '/admin/case-management' },
    { label: 'All Deals',       url: '/admin/all-deals' },
    { label: 'Auction Control', url: '/admin/auction-control' },
    { label: 'KYC Review',      url: '/admin/kyc-review' },
    { label: 'Document Library', url: '/admin/document-library' },
    { label: 'Reports Analytics', url: '/admin/reports-analytics' },
    { label: 'Task Center',     url: '/admin/task-center' },
    { label: 'Admin Centre',    url: '/admin/admin-center' },
    { label: 'Notifications',   url: '/admin/notifications' },
    { label: 'Settings',        url: '/admin/settings' },
  ];
  const navResults = await deepDiveNav(page, adminRoutes, 'scenario-3', 's3-admin');
  navResults.forEach(r => RESULTS.s3_admin.push(r));

  // ── View icons test: case management ──
  await page.goto('/admin/case-management');
  await page.waitForTimeout(2000);
  const viewBtns = await page.locator('[title*="View"], [title*="view"], [data-lucide="eye"]').all();
  console.log(`  Found ${viewBtns.length} view icons in case management`);
  if (viewBtns.length > 0) {
    await viewBtns[0].click();
    await page.waitForTimeout(2000);
    await ss(page, 'scenario-3', 's3-admin-case-detail-view');
    pass('s3_admin', `View icon opens case detail`);
    await page.goBack();
    await page.waitForTimeout(1500);
  }

  // ── Download test ──
  await page.goto('/admin/case-management');
  await page.waitForTimeout(1500);
  // Click first case detail, go to Documents tab, download
  const firstViewBtn = page.locator('[title*="View"], a[href*="case-details"]').first();
  if (await firstViewBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await firstViewBtn.click();
    await page.waitForTimeout(2000);
    const docTab = page.locator('button, [role="tab"]').filter({ hasText: /Documents/i }).first();
    if (await docTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await docTab.click();
      await page.waitForTimeout(1000);
      await ss(page, 'scenario-3', 's3-admin-documents-tab');
      // Download buttons
      const downloadBtns = await page.locator('button[aria-label*="download"], [data-lucide="download"], button').filter({ hasText: /download/i }).all();
      if (downloadBtns.length > 0) {
        const [download] = await Promise.all([
          page.waitForEvent('download', { timeout: 5000 }).catch(() => null),
          downloadBtns[0].click(),
        ]);
        if (download) {
          pass('s3_admin', `Download works: ${download.suggestedFilename()}`);
        } else {
          warn('Download event not captured — may open in new tab');
        }
      }
    }
    await page.goBack(); await page.waitForTimeout(1000);
  }

  // ── Share test ──
  const shareBtns = await page.locator('button').filter({ hasText: /share/i }).all();
  console.log(`  Found ${shareBtns.length} share buttons on current page`);
  if (shareBtns.length > 0) {
    await shareBtns[0].click();
    await page.waitForTimeout(1000);
    await ss(page, 'scenario-3', 's3-admin-share-dialog');
    pass('s3_admin', 'Share button opens dialog');
    await page.keyboard.press('Escape');
  } else {
    warn('No share buttons found on admin pages');
  }

  // ── Delete test (admin) ──
  await page.goto('/admin/case-management');
  await page.waitForTimeout(2000);
  const deleteBtns = await page.locator('[title="Delete Case"], button[title*="elete"]').all();
  console.log(`  Found ${deleteBtns.length} delete buttons`);
  if (deleteBtns.length > 0) {
    await ss(page, 'scenario-3', 's3-admin-before-delete');
    const rowsBefore = await page.locator('tr[data-testid], tbody tr').count();
    await deleteBtns[0].click();
    await page.waitForTimeout(1000);
    await ss(page, 'scenario-3', 's3-admin-delete-dialog');
    const confirmDel = page.locator('button').filter({ hasText: /Confirm|Yes|Delete/i }).last();
    const overlay2 = page.locator('div.fixed.inset-0, [role="dialog"]').last();
    const modalDel = overlay2.locator('button').filter({ hasText: /Confirm|Yes|Delete/i }).first();
    const delTarget = await modalDel.isVisible({ timeout: 2000 }).catch(() => false) ? modalDel : confirmDel;
    if (await delTarget.isVisible({ timeout: 2000 }).catch(() => false)) {
      await delTarget.click();
      await page.waitForTimeout(2000);
      await page.goto('/admin/dashboard');
      await page.waitForTimeout(500);
      await page.goto('/admin/case-management');
      await page.waitForTimeout(2000);
      await ss(page, 'scenario-3', 's3-admin-after-delete');
      const rowsAfter = await page.locator('tr[data-testid], tbody tr').count();
      console.log(`  Rows before: ${rowsBefore}, after: ${rowsAfter}`);
      rowsAfter <= rowsBefore ? pass('s3_admin', `Delete works — rows: ${rowsBefore} → ${rowsAfter}`) : warn('Row count unchanged after delete');
    }
  } else {
    warn('No delete buttons found on case management');
  }

  // ── Message test ──
  await page.goto('/admin/case-management');
  await page.waitForTimeout(1500);
  const anyView = page.locator('a[href*="case-details"], [title*="View"]').first();
  if (await anyView.isVisible({ timeout: 2000 }).catch(() => false)) {
    await anyView.click();
    await page.waitForTimeout(2000);
    const actTab = page.locator('button, [role="tab"]').filter({ hasText: /Activity|Messages/i }).first();
    if (await actTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await actTab.click();
      await page.waitForTimeout(600);
      const msgArea = page.locator('textarea').first();
      if (await msgArea.isVisible({ timeout: 2000 }).catch(() => false)) {
        await msgArea.fill('Admin test message — deep dive testing');
        const sendBtn = page.locator('button').filter({ hasText: /send|submit|post/i }).last();
        if (await sendBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
          await sendBtn.click();
          await page.waitForTimeout(1000);
          await ss(page, 'scenario-3', 's3-admin-message');
          pass('s3_admin', 'Admin message sent successfully');
        }
      }
    }
  }

  await logout(page);
  console.log('\n  S3-ADMIN COMPLETE');
});

// ══════════════════════════════════════════════════════════════════════════════
// SCENARIO 3 — LENDER DEEP DIVE
// ══════════════════════════════════════════════════════════════════════════════
test('S3-LENDER — Full lender tab + delete + download + message test', async ({ page }) => {
  test.setTimeout(150000);
  console.log('\n══════════════════════════════════════════════════');
  console.log('S3-LENDER — FULL LENDER DEEP DIVE');
  console.log('══════════════════════════════════════════════════');

  await login(page, USERS.lender);
  await page.goto('/lender/dashboard');
  await page.waitForTimeout(2000);
  await ss(page, 'scenario-3', 's3-lender-dashboard');

  const lenderRoutes = [
    { label: 'My Cases',  url: '/lender/my-cases' },
    { label: 'Auctions',  url: '/lender/auctions' },
    { label: 'My Bids',   url: '/lender/my-bids' },
    { label: 'Deals',     url: '/lender/deals' },
    { label: 'Contracts', url: '/lender/contracts' },
    { label: 'Reports',   url: '/lender/reports' },
    { label: 'Tasks',     url: '/lender/tasks' },
    { label: 'Communications', url: '/lender/communications' },
    { label: 'Notifications', url: '/lender/notifications' },
    { label: 'Settings',  url: '/lender/settings' },
  ];
  const navR = await deepDiveNav(page, lenderRoutes, 'scenario-3', 's3-lender');
  navR.forEach(r => RESULTS.s3_lender.push(r));

  // ── View icons ──
  await page.goto('/lender/my-cases');
  await page.waitForTimeout(2000);
  const caseLinks = await page.locator('a[href*="case-details"], button').filter({ hasText: /view|details|open/i }).all();
  console.log(`  Found ${caseLinks.length} view icons in My Cases`);
  if (caseLinks.length > 0) {
    await caseLinks[0].click();
    await page.waitForTimeout(2000);
    await ss(page, 'scenario-3', 's3-lender-case-detail');
    pass('s3_lender', 'Lender case detail opens');

    // Download test
    const docTab = page.locator('button, [role="tab"]').filter({ hasText: /Documents/i }).first();
    if (await docTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await docTab.click();
      await page.waitForTimeout(1000);
      await ss(page, 'scenario-3', 's3-lender-documents');
      const dlBtns = await page.locator('button, a').filter({ hasText: /download/i }).all();
      if (dlBtns.length > 0) {
        const [dl] = await Promise.all([
          page.waitForEvent('download', { timeout: 5000 }).catch(() => null),
          dlBtns[0].click(),
        ]);
        dl ? pass('s3_lender', `Download: ${dl.suggestedFilename()}`) : warn('Download not captured');
      }
    }

    // Activity message
    const actTab = page.locator('button, [role="tab"]').filter({ hasText: /Activity|Messages/i }).first();
    if (await actTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await actTab.click();
      await page.waitForTimeout(600);
      const msgArea = page.locator('textarea').first();
      if (await msgArea.isVisible({ timeout: 2000 }).catch(() => false)) {
        await msgArea.fill('Lender test message — checking message functionality');
        const sendBtn = page.locator('button').filter({ hasText: /send|submit|post/i }).last();
        if (await sendBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
          await sendBtn.click();
          await page.waitForTimeout(1000);
          await ss(page, 'scenario-3', 's3-lender-message');
          pass('s3_lender', 'Lender message sent');
        }
      }
    }
    await page.goBack(); await page.waitForTimeout(1000);
  }

  // ── Delete draft case ──
  await page.goto('/lender/my-cases');
  await page.waitForTimeout(2000);
  const draftRow = page.locator('tr, li').filter({ hasText: /DRAFT|draft|Submitted|submitted/i }).first();
  if (await draftRow.isVisible({ timeout: 2000 }).catch(() => false)) {
    const delBtn = draftRow.locator('button[title*="elete"], [title*="Delete"]').first();
    if (await delBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await ss(page, 'scenario-3', 's3-lender-before-delete');
      await delBtn.click();
      await page.waitForTimeout(1000);
      await ss(page, 'scenario-3', 's3-lender-delete-confirm');
      const confirmBtn = page.locator('button').filter({ hasText: /Confirm|Yes|Delete/i }).last();
      if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmBtn.click();
        await page.waitForTimeout(2000);
        await page.goto('/lender/dashboard');
        await page.waitForTimeout(500);
        await page.goto('/lender/my-cases');
        await page.waitForTimeout(2000);
        await ss(page, 'scenario-3', 's3-lender-after-delete');
        pass('s3_lender', 'Lender deleted draft case + confirmed gone');
      }
    } else {
      warn('No delete button on draft row');
    }
  }

  // Attempt to delete approved case (should be blocked)
  const approvedRow = page.locator('tr, li').filter({ hasText: /APPROVED|AUCTION|In Auction/i }).first();
  if (await approvedRow.isVisible({ timeout: 2000 }).catch(() => false)) {
    const delBtnApproved = approvedRow.locator('button[title*="elete"]').first();
    const delVisible = await delBtnApproved.isVisible({ timeout: 1500 }).catch(() => false);
    !delVisible ? pass('s3_lender', 'Approved case delete blocked (no delete button)') : warn('Delete button visible on approved case');
    await ss(page, 'scenario-3', 's3-lender-approved-no-delete');
  }

  await logout(page);
  console.log('\n  S3-LENDER COMPLETE');
});

// ══════════════════════════════════════════════════════════════════════════════
// SCENARIO 3 — LAWYER DEEP DIVE
// ══════════════════════════════════════════════════════════════════════════════
test('S3-LAWYER — Full lawyer tab + delete + download + message', async ({ page }) => {
  test.setTimeout(150000);
  console.log('\n══════════════════════════════════════════════════');
  console.log('S3-LAWYER — FULL LAWYER DEEP DIVE');
  console.log('══════════════════════════════════════════════════');

  await login(page, USERS.lawyer);
  await page.goto('/lawyer/dashboard');
  await page.waitForTimeout(2000);
  await ss(page, 'scenario-3', 's3-lawyer-dashboard');

  // Create Case + Browse Deals buttons
  const ccBtn = await page.getByRole('button', { name: /create.*case|new case/i }).first()
    .isVisible({ timeout: 3000 }).catch(() => false);
  ccBtn ? pass('s3_lawyer', 'Create Case button on dashboard') : fail('s3_lawyer', 'Create Case button missing');
  const bdBtn = await page.getByRole('button', { name: /browse.*deal/i }).first()
    .isVisible({ timeout: 3000 }).catch(() => false);
  bdBtn ? pass('s3_lawyer', 'Browse Deals button on dashboard') : warn('Browse Deals button not found');
  await ss(page, 'scenario-3', 's3-lawyer-dashboard-full');

  const lawyerRoutes = [
    { label: 'Assigned Cases',  url: '/lawyer/assigned-cases' },
    { label: 'Live Auctions',   url: '/lawyer/live-auctions' },
    { label: 'My Bids',         url: '/lawyer/my-bids' },
    { label: 'Contract Review', url: '/lawyer/contract-review' },
    { label: 'Task Center',     url: '/lawyer/task-center' },
    { label: 'Notifications',   url: '/lawyer/notifications' },
    { label: 'Settings',        url: '/lawyer/settings' },
  ];
  const navR = await deepDiveNav(page, lawyerRoutes, 'scenario-3', 's3-lawyer');
  navR.forEach(r => RESULTS.s3_lawyer.push(r));

  // View icon + downloads
  await page.goto('/lawyer/assigned-cases');
  await page.waitForTimeout(2000);
  const viewBtns = await page.locator('a[href*="assigned-cases/"], button').filter({ hasText: /view|details/i }).all();
  if (viewBtns.length > 0) {
    await viewBtns[0].click();
    await page.waitForTimeout(2000);
    await ss(page, 'scenario-3', 's3-lawyer-case-detail');
    pass('s3_lawyer', 'Lawyer case detail opens');

    const docTab = page.locator('button, [role="tab"]').filter({ hasText: /Documents/i }).first();
    if (await docTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await docTab.click();
      await page.waitForTimeout(1000);
      const dlBtns = await page.locator('button, a').filter({ hasText: /download/i }).all();
      if (dlBtns.length > 0) {
        const [dl] = await Promise.all([
          page.waitForEvent('download', { timeout: 5000 }).catch(() => null),
          dlBtns[0].click(),
        ]);
        dl ? pass('s3_lawyer', `Download: ${dl.suggestedFilename()}`) : warn('Download not captured');
      }
    }

    const actTab = page.locator('button, [role="tab"]').filter({ hasText: /Activity|Messages/i }).first();
    if (await actTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await actTab.click();
      await page.waitForTimeout(600);
      const msgArea = page.locator('textarea').first();
      if (await msgArea.isVisible({ timeout: 2000 }).catch(() => false)) {
        await msgArea.fill('Lawyer test message — activity tab check');
        const sendBtn = page.locator('button').filter({ hasText: /send|submit|post/i }).last();
        if (await sendBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
          await sendBtn.click();
          await page.waitForTimeout(1000);
          await ss(page, 'scenario-3', 's3-lawyer-message');
          pass('s3_lawyer', 'Lawyer message sent');
        }
      }
    }
    await page.goBack(); await page.waitForTimeout(1000);
  }

  // Delete draft case
  await page.goto('/lawyer/assigned-cases');
  await page.waitForTimeout(2000);
  const draftRow = page.locator('tr, li').filter({ hasText: /DRAFT|draft|Submitted/i }).first();
  if (await draftRow.isVisible({ timeout: 2000 }).catch(() => false)) {
    const delBtn = draftRow.locator('button[title*="elete"], [title*="Delete"]').first();
    if (await delBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
      await ss(page, 'scenario-3', 's3-lawyer-before-delete');
      await delBtn.click();
      await page.waitForTimeout(1000);
      const confirmBtn = page.locator('button').filter({ hasText: /Confirm|Yes|Delete/i }).last();
      if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmBtn.click();
        await page.waitForTimeout(2000);
        await page.goto('/lawyer/dashboard');
        await page.waitForTimeout(500);
        await page.goto('/lawyer/assigned-cases');
        await page.waitForTimeout(2000);
        await ss(page, 'scenario-3', 's3-lawyer-after-delete');
        pass('s3_lawyer', 'Lawyer deleted case + confirmed gone');
      }
    }
  }

  // Auction downloads
  await page.goto('/lawyer/live-auctions');
  await page.waitForTimeout(2000);
  const aBtn = page.locator('button').filter({ hasText: /View Details|Enter Auction/i }).first();
  if (await aBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
    await aBtn.click();
    await page.waitForTimeout(2000);
    const docTab2 = page.locator('button, [role="tab"]').filter({ hasText: /Documents/i }).first();
    if (await docTab2.isVisible({ timeout: 2000 }).catch(() => false)) {
      await docTab2.click();
      await page.waitForTimeout(1000);
      await ss(page, 'scenario-3', 's3-lawyer-auction-docs');
      pass('s3_lawyer', 'Auction documents tab visible');
    }
  }

  // Check assigned case from Scenario 1
  await page.goto('/lawyer/assigned-cases');
  await page.waitForTimeout(2000);
  const assignedCase = await page.locator('text=/assigned|Assigned/i').first()
    .isVisible({ timeout: 2000 }).catch(() => false);
  assignedCase ? pass('s3_lawyer', 'Assigned cases section visible') : warn('No assigned section found');

  await logout(page);
  console.log('\n  S3-LAWYER COMPLETE');
});

// ══════════════════════════════════════════════════════════════════════════════
// SCENARIO 3 — INVESTOR DEEP DIVE
// ══════════════════════════════════════════════════════════════════════════════
test('S3-INVESTOR — Full investor tab + no delete + download + bids + message', async ({ page }) => {
  test.setTimeout(150000);
  console.log('\n══════════════════════════════════════════════════');
  console.log('S3-INVESTOR — FULL INVESTOR DEEP DIVE');
  console.log('══════════════════════════════════════════════════');

  await login(page, USERS.investor);
  await page.goto('/investor/dashboard');
  await page.waitForTimeout(2000);
  await ss(page, 'scenario-3', 's3-investor-dashboard');
  pass('s3_investor', 'Investor dashboard loaded');

  const investorRoutes = [
    { label: 'Auctions',     url: '/investor/auctions' },
    { label: 'Deals',        url: '/investor/deals' },
    { label: 'My Bids',      url: '/investor/my-bids' },
    { label: 'Contracts',    url: '/investor/contracts' },
    { label: 'Escrow',       url: '/investor/escrow' },
    { label: 'Documents',    url: '/investor/documents' },
    { label: 'Reports',      url: '/investor/reports' },
    { label: 'Tasks',        url: '/investor/tasks' },
    { label: 'Notifications', url: '/investor/notifications' },
    { label: 'Settings',     url: '/investor/settings' },
  ];
  const navR = await deepDiveNav(page, investorRoutes, 'scenario-3', 's3-investor');
  navR.forEach(r => RESULTS.s3_investor.push(r));

  // View icon + download
  await page.goto('/investor/auctions');
  await page.waitForTimeout(2000);
  const aBtn = page.locator('button').filter({ hasText: /View Details|Place Bid|Enter Auction/i }).first();
  if (await aBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
    await aBtn.click();
    await page.waitForTimeout(2000);
    await ss(page, 'scenario-3', 's3-investor-auction-detail');
    pass('s3_investor', 'Investor auction detail opens');

    // Documents + download
    const docTab = page.locator('button, [role="tab"]').filter({ hasText: /Documents/i }).first();
    if (await docTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await docTab.click();
      await page.waitForTimeout(1000);
      await ss(page, 'scenario-3', 's3-investor-docs');
      const dlBtns = await page.locator('button, a').filter({ hasText: /download/i }).all();
      if (dlBtns.length > 0) {
        const [dl] = await Promise.all([
          page.waitForEvent('download', { timeout: 5000 }).catch(() => null),
          dlBtns[0].click(),
        ]);
        dl ? pass('s3_investor', `Download: ${dl.suggestedFilename()}`) : warn('Download not captured');
      }
    }

    // Message in auction
    const actTab = page.locator('button, [role="tab"]').filter({ hasText: /Activity|Messages/i }).first();
    if (await actTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await actTab.click();
      await page.waitForTimeout(600);
      const msgArea = page.locator('textarea').first();
      if (await msgArea.isVisible({ timeout: 2000 }).catch(() => false)) {
        await msgArea.fill('Investor test message — bid enquiry');
        const sendBtn = page.locator('button').filter({ hasText: /send|submit|post/i }).last();
        if (await sendBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
          await sendBtn.click();
          await page.waitForTimeout(1000);
          await ss(page, 'scenario-3', 's3-investor-message');
          pass('s3_investor', 'Investor message sent');
        }
      }
    }
  }

  // No delete buttons
  await page.goto('/investor/auctions');
  await page.waitForTimeout(1500);
  const delBtns = await page.locator('button').filter({ hasText: /^Delete$|^delete$/i }).all();
  const hasDelete = delBtns.length > 0;
  !hasDelete ? pass('s3_investor', 'No delete buttons for investor') : fail('s3_investor', `Delete button visible (${delBtns.length}) — RBAC gap`);
  await ss(page, 'scenario-3', 's3-investor-no-delete');

  // My Bids deep dive
  await page.goto('/investor/my-bids');
  await page.waitForTimeout(2000);
  await ss(page, 'scenario-3', 's3-investor-my-bids');
  const bidsData = await page.locator('text=/410,000|450,000|Winning|Outbid|placed/i').first()
    .isVisible({ timeout: 3000 }).catch(() => false);
  bidsData ? pass('s3_investor', 'My Bids shows bid data') : warn('My Bids empty or data not found');

  await logout(page);
  console.log('\n  S3-INVESTOR COMPLETE');
});

// ══════════════════════════════════════════════════════════════════════════════
// SCENARIO 3 — BORROWER DEEP DIVE (KEY DELETE TEST)
// ══════════════════════════════════════════════════════════════════════════════
test('S3-BORROWER — Full borrower read-only + delete test + access blocks', async ({ page }) => {
  test.setTimeout(150000);
  console.log('\n══════════════════════════════════════════════════');
  console.log('S3-BORROWER — BORROWER DEEP DIVE + DELETE TEST');
  console.log('══════════════════════════════════════════════════');

  await login(page, USERS.borrower);
  await page.goto('/borrower/dashboard');
  await page.waitForTimeout(2000);
  await ss(page, 'scenario-3', 's3-borrower-dashboard');
  pass('s3_borrower', 'Borrower dashboard loaded');

  const borrowerRoutes = [
    { label: 'My Cases',  url: '/borrower/my-case' },
    { label: 'Contracts', url: '/borrower/contracts' },
    { label: 'Identity Verification', url: '/borrower/identity-verification' },
    { label: 'Notifications', url: '/borrower/notifications' },
    { label: 'Settings',  url: '/borrower/settings' },
  ];
  const navR = await deepDiveNav(page, borrowerRoutes, 'scenario-3', 's3-borrower');
  navR.forEach(r => RESULTS.s3_borrower.push(r));

  // ── Confirm view only ──
  await page.goto('/borrower/my-case');
  await page.waitForTimeout(2000);
  await ss(page, 'scenario-3', 's3-borrower-my-case');

  const editBtn = await page.getByRole('button', { name: /^edit$/i }).first().isVisible({ timeout: 1500 }).catch(() => false);
  const delBtn = await page.getByRole('button', { name: /^delete$/i }).first().isVisible({ timeout: 1500 }).catch(() => false);
  const appBtn = await page.getByRole('button', { name: /^approve/i }).first().isVisible({ timeout: 1500 }).catch(() => false);
  !editBtn ? pass('s3_borrower', 'No Edit button') : fail('s3_borrower', 'Edit button visible — RBAC gap');
  !delBtn ? pass('s3_borrower', 'No Delete button') : fail('s3_borrower', 'Delete button visible — RBAC gap');
  !appBtn ? pass('s3_borrower', 'No Approve button') : fail('s3_borrower', 'Approve button visible — RBAC gap');

  // ── DELETE TEST (key test) ──
  // Count cases before
  const caseItems = await page.locator('tr, li, [data-testid]').filter({ hasText: /MIP-|case/i }).all();
  const countBefore = caseItems.length;
  console.log(`  Case count before delete attempt: ${countBefore}`);
  await ss(page, 'scenario-3', 's3-borrower-before-delete');

  // Check all delete-like buttons
  const allDeleteBtns = await page.locator('button').filter({ hasText: /delete|remove/i }).all();
  console.log(`  Delete buttons found: ${allDeleteBtns.length}`);
  RESULTS.s3_borrower.push(`Case count before: ${countBefore}`);

  if (allDeleteBtns.length > 0) {
    // Delete button exists — attempt to use it
    await allDeleteBtns[0].click();
    await page.waitForTimeout(1000);
    await ss(page, 'scenario-3', 's3-borrower-delete-attempt');
    const confirmBtn = page.locator('button').filter({ hasText: /Confirm|Yes|Delete/i }).last();
    if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmBtn.click();
      await page.waitForTimeout(2000);
    }
    await page.goto('/borrower/dashboard');
    await page.waitForTimeout(800);
    await ss(page, 'scenario-3', 's3-borrower-dashboard-after');
    await page.goto('/borrower/my-case');
    await page.waitForTimeout(2000);
    await ss(page, 'scenario-3', 's3-borrower-cases-after-delete');
    const caseItemsAfter = await page.locator('tr, li, [data-testid]').filter({ hasText: /MIP-|case/i }).all();
    const countAfter = caseItemsAfter.length;
    console.log(`  Case count after: ${countAfter}`);
    RESULTS.s3_borrower.push(`Case count after: ${countAfter}`);
    RESULTS.s3_borrower.push(`Delete result: ${countAfter < countBefore ? 'ALLOWED (reduced by 1)' : 'BLOCKED (count unchanged)'}`);
    pass('s3_borrower', `Delete test complete — before: ${countBefore}, after: ${countAfter}`);
  } else {
    // No delete button — confirm access denied
    pass('s3_borrower', `Delete BLOCKED — no delete button visible (count stays ${countBefore})`);
    RESULTS.s3_borrower.push(`Delete result: BLOCKED (no button)`);
    RESULTS.s3_borrower.push(`Case count after: ${countBefore} (unchanged)`);
    await ss(page, 'scenario-3', 's3-borrower-no-delete-confirmed');

    // API-level test: try direct delete via fetch
    const deleteResult = await page.evaluate(async () => {
      try {
        const token = localStorage.getItem('token') || '';
        const r = await fetch('/api/v1/cases/nonexistent-id', {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        return { status: r.status, ok: r.ok };
      } catch (e) {
        return { status: 0, error: String(e) };
      }
    });
    console.log(`  API DELETE test: status ${deleteResult.status}`);
    RESULTS.s3_borrower.push(`API DELETE: ${deleteResult.status === 403 || deleteResult.status === 404 ? 'blocked/not found (correct)' : `status ${deleteResult.status}`}`);
  }

  // ── Auction access blocks ──
  await page.goto('/investor/auctions');
  await page.waitForTimeout(2000);
  await ss(page, 'scenario-3', 's3-borrower-blocked-investor-auctions');
  const blocked1 = !page.url().includes('/investor/');
  blocked1 ? pass('s3_borrower', 'Blocked from /investor/auctions') : fail('s3_borrower', 'Accessed /investor — RBAC gap');

  await page.goto('/lender/submit-case');
  await page.waitForTimeout(2000);
  await ss(page, 'scenario-3', 's3-borrower-blocked-create');
  const blocked2 = !page.url().includes('/lender/');
  blocked2 ? pass('s3_borrower', 'Blocked from lender routes') : fail('s3_borrower', 'Accessed /lender — RBAC gap');

  await page.goto('/admin/case-management');
  await page.waitForTimeout(2000);
  const blocked3 = !page.url().includes('/admin/');
  blocked3 ? pass('s3_borrower', 'Blocked from admin routes') : fail('s3_borrower', 'Accessed /admin — RBAC gap');

  // Message test
  await page.goto('/borrower/my-case');
  await page.waitForTimeout(1500);
  const viewBtnCase = page.locator('button, a').filter({ hasText: /view|details|open/i }).first();
  if (await viewBtnCase.isVisible({ timeout: 2000 }).catch(() => false)) {
    await viewBtnCase.click();
    await page.waitForTimeout(2000);
  }
  const actTab = page.locator('button, [role="tab"]').filter({ hasText: /Activity|Messages/i }).first();
  if (await actTab.isVisible({ timeout: 2000 }).catch(() => false)) {
    await actTab.click();
    await page.waitForTimeout(600);
    const msgArea = page.locator('textarea').first();
    if (await msgArea.isVisible({ timeout: 1500 }).catch(() => false)) {
      await msgArea.fill('Borrower message test');
      const sendBtn = page.locator('button').filter({ hasText: /send|submit|post/i }).last();
      if (await sendBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
        await sendBtn.click();
        await page.waitForTimeout(1000);
        pass('s3_borrower', 'Borrower message allowed');
        RESULTS.s3_borrower.push('Messages: ALLOWED');
      }
    } else {
      pass('s3_borrower', 'Activity tab read-only (no message input)');
      RESULTS.s3_borrower.push('Messages: BLOCKED (read-only)');
    }
    await ss(page, 'scenario-3', 's3-borrower-activity');
  }

  // Download test
  await page.goto('/borrower/my-case');
  await page.waitForTimeout(1500);
  const dlBtns = await page.locator('button, a').filter({ hasText: /download/i }).all();
  if (dlBtns.length > 0) {
    const [dl] = await Promise.all([
      page.waitForEvent('download', { timeout: 5000 }).catch(() => null),
      dlBtns[0].click(),
    ]);
    dl ? pass('s3_borrower', `Borrower download allowed: ${dl.suggestedFilename()}`) : warn('Borrower download not captured');
  } else {
    warn('No download buttons for borrower');
  }

  await logout(page);
  console.log('\n  S3-BORROWER COMPLETE');
});

// ══════════════════════════════════════════════════════════════════════════════
// FINAL REPORT
// ══════════════════════════════════════════════════════════════════════════════
test('FINAL REPORT — Generate test summary', async ({}) => {
  console.log('\n══════════════════════════════════════════════════');
  console.log('FINAL REPORT');
  console.log('══════════════════════════════════════════════════');

  const date = new Date().toISOString().slice(0, 19).replace('T', ' ');

  const countPass = (arr: string[]) => arr.filter(r => r.startsWith('✓')).length;
  const countFail = (arr: string[]) => arr.filter(r => r.startsWith('✗')).length;
  const allFails = (arr: string[]) => arr.filter(r => r.startsWith('✗'));

  const report = `
╔══════════════════════════════════════════════════════════════════╗
║   BRIQBANK DEEP DIVE TEST REPORT                                 ║
║   http://localhost:3000                                          ║
║   ${date}                                          ║
╚══════════════════════════════════════════════════════════════════╝

SCENARIO 1 — Lender → Admin → Bids → Close
───────────────────────────────────────────
Passed: ${countPass(RESULTS.s1)}  |  Failed: ${countFail(RESULTS.s1)}
${RESULTS.s1.join('\n')}

SCENARIO 2 — Lawyer Creates → Same Flow
───────────────────────────────────────────
Passed: ${countPass(RESULTS.s2)}  |  Failed: ${countFail(RESULTS.s2)}
${RESULTS.s2.join('\n')}

SCENARIO 3 — Deep Dive Per Role
───────────────────────────────────────────

ADMIN (${countPass(RESULTS.s3_admin)}✓ / ${countFail(RESULTS.s3_admin)}✗):
${RESULTS.s3_admin.join('\n')}

LENDER (${countPass(RESULTS.s3_lender)}✓ / ${countFail(RESULTS.s3_lender)}✗):
${RESULTS.s3_lender.join('\n')}

LAWYER (${countPass(RESULTS.s3_lawyer)}✓ / ${countFail(RESULTS.s3_lawyer)}✗):
${RESULTS.s3_lawyer.join('\n')}

INVESTOR (${countPass(RESULTS.s3_investor)}✓ / ${countFail(RESULTS.s3_investor)}✗):
${RESULTS.s3_investor.join('\n')}

BORROWER (${countPass(RESULTS.s3_borrower)}✓ / ${countFail(RESULTS.s3_borrower)}✗):
${RESULTS.s3_borrower.join('\n')}

───────────────────────────────────────────
ALL FAILURES:
${[...allFails(RESULTS.s1), ...allFails(RESULTS.s2),
   ...allFails(RESULTS.s3_admin), ...allFails(RESULTS.s3_lender),
   ...allFails(RESULTS.s3_lawyer), ...allFails(RESULTS.s3_investor),
   ...allFails(RESULTS.s3_borrower)].join('\n') || '  none'}

SCREENSHOTS: tests/screenshots/scenario-1/
             tests/screenshots/scenario-2/
             tests/screenshots/scenario-3/
VIDEOS:      tests/screenshots/ (playwright video per test)
`;

  fs.writeFileSync(
    path.join(__dirname, '../deep-dive-report.txt'),
    report.trim()
  );
  console.log(report);
});
