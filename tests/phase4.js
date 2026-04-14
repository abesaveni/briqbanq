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

async function loginAdmin(page) {
  await page.goto(BASE + '/signin', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.click('button:has-text("Admin"):not(:has-text("Sign in"))');
  await page.waitForTimeout(400);
  await page.fill('input[type="email"]', 'admin@brickbanq.com');
  await page.fill('input[type="password"]', 'Admin@123');
  await page.click('button:has-text("Sign in as Admin")');
  await page.waitForURL('**/admin/**', { timeout: 15000 });
  await page.waitForTimeout(2000);
}

async function waitForCasesLoaded(page) {
  await page.waitForFunction(() => {
    const tds = document.querySelectorAll('td');
    for (const td of tds) {
      if (/loading cases/i.test(td.textContent)) return false;
    }
    return true;
  }, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(500);
}

async function getFirstRowStatus(page) {
  const rows = await page.$$('table tbody tr');
  if (!rows.length) return null;
  const sel = await rows[0].$('select');
  if (!sel) return null;
  return sel.evaluate(el => el.value);
}

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 250, args: ['--ignore-certificate-errors'] });
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await ctx.newPage();

  console.log('\n=== PHASE 4: ADMIN REVIEWS CASE & MOVES TO AUCTION ===\n');
  await loginAdmin(page);
  await shot(page, 'p4-00-admin-dashboard.png');

  // ─── Navigate to Case Management ─────────────────────────────────────────────
  console.log('Navigating to /admin/case-management...');
  await page.goto(BASE + '/admin/case-management', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(3000); // wait for React data fetch

  // Wait for table to have actual content (not spinner)
  await page.waitForFunction(() => {
    const rows = document.querySelectorAll('table tbody tr');
    if (rows.length === 0) return false;
    const firstCellText = rows[0].querySelector('td')?.textContent || '';
    return !firstCellText.includes('Loading');
  }, { timeout: 20000 }).catch(async () => {
    console.log('Timeout waiting for table — checking page state...');
    const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 300));
    console.log('Page text:', bodyText);
  });

  await page.waitForTimeout(1000);
  await shot(page, 'p4-01-admin-cases-list.png');

  const headerText = await page.$eval('h2', el => el.textContent.trim()).catch(() => '');
  console.log('Cases header:', headerText);

  // Check for error messages
  const loadErr = await page.$eval('[class*="text-red-7"]', el => el.textContent.trim()).catch(() => null);
  if (loadErr) console.log('Load error on page:', loadErr);

  const rows = await page.$$('table tbody tr');
  console.log(`Table rows found: ${rows.length}`);

  if (rows.length === 0) {
    // Try refreshing
    const refreshBtn = page.locator('button:has-text("Refresh")').first();
    if (await refreshBtn.count() > 0) {
      console.log('Clicking Refresh...');
      await refreshBtn.click();
      await page.waitForTimeout(3000);
    }
    const rows2 = await page.$$('table tbody tr');
    console.log(`Rows after refresh: ${rows2.length}`);
    if (rows2.length === 0) {
      console.log('ERROR: No cases in table after refresh');
      await browser.close();
      return;
    }
  }

  // ─── Show all cases ───────────────────────────────────────────────────────────
  for (let i = 0; i < rows.length; i++) {
    const text = await rows[i].evaluate(el => {
      const cells = el.querySelectorAll('td');
      return [...cells].slice(0, 4).map(c => c.textContent.trim()).join(' | ');
    });
    const sel = await rows[i].$('select');
    const status = sel ? await sel.evaluate(el => el.value) : '?';
    console.log(`  Row ${i+1}: ${text} [${status}]`);
  }

  // ─── Pick the first SUBMITTED/UNDER_REVIEW case ───────────────────────────────
  let targetRowIdx = 0;
  for (let i = 0; i < rows.length; i++) {
    const sel = await rows[i].$('select');
    const status = sel ? await sel.evaluate(el => el.value) : '';
    if (status === 'SUBMITTED' || status === 'UNDER_REVIEW') {
      targetRowIdx = i;
      break;
    }
    if (status === 'APPROVED') {
      targetRowIdx = i;
      break;
    }
  }
  console.log(`\nUsing row ${targetRowIdx + 1} for approve + auction flow`);

  // ─── View case details ────────────────────────────────────────────────────────
  let caseId = null;
  const eyeBtn = await rows[targetRowIdx].$('[title="View Details"]');
  if (eyeBtn) {
    await eyeBtn.click();
    await page.waitForTimeout(2000);
    const detailUrl = page.url();
    console.log('Case detail URL:', detailUrl);
    const urlMatch = detailUrl.match(/case-details\/([a-f0-9-]{36})/i);
    if (urlMatch) caseId = urlMatch[1];
    console.log('Case ID:', caseId);
    await shot(page, 'p4-02-case-detail.png');

    // Browse case detail tabs
    const tabLinks = await page.$$('[role="tab"], nav a[href*="case-details"]');
    console.log(`Case detail tabs found: ${tabLinks.length}`);
    for (let t = 0; t < Math.min(tabLinks.length, 4); t++) {
      const label = await tabLinks[t].textContent().catch(() => `tab${t}`);
      await tabLinks[t].click().catch(() => {});
      await page.waitForTimeout(800);
      const safeName = label.trim().replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
      await shot(page, `p4-02b-tab-${t}-${safeName}.png`);
    }

    await page.goto(BASE + '/admin/case-management', { waitUntil: 'networkidle', timeout: 15000 });
    await waitForCasesLoaded(page);
    await page.waitForTimeout(500);
  }

  // ─── Get fresh rows after navigation ─────────────────────────────────────────
  const freshRows = await page.$$('table tbody tr');
  console.log(`\nFresh rows after nav: ${freshRows.length}`);

  // Re-find target row (same index or by caseId)
  let workRow = freshRows[targetRowIdx] || freshRows[0];
  let workStatus = await (async () => {
    const s = await workRow.$('select');
    return s ? s.evaluate(el => el.value) : 'UNKNOWN';
  })();
  console.log('Target row current status:', workStatus);

  // ─── STEP 1: Approve (SUBMITTED/UNDER_REVIEW → APPROVED) ─────────────────────
  if (workStatus === 'SUBMITTED' || workStatus === 'UNDER_REVIEW') {
    console.log('\n--- Approving case ---');

    // Try the Approve button (CheckCircle icon, title="Approve Case")
    const approveBtn = await workRow.$('[title="Approve Case"]');
    if (approveBtn) {
      console.log('Clicking Approve Case button...');
      await approveBtn.click();
      await page.waitForTimeout(3000);
      await shot(page, 'p4-03-after-approve.png');

      // Re-read status
      const freshRows2 = await page.$$('table tbody tr');
      workRow = freshRows2[targetRowIdx] || freshRows2[0];
      const sel2 = await workRow.$('select');
      workStatus = sel2 ? await sel2.evaluate(el => el.value) : workStatus;
      console.log('Status after approve button:', workStatus);
    }

    // If still not APPROVED, use dropdown
    if (workStatus !== 'APPROVED') {
      console.log('Approve button did not change status — using dropdown...');
      const statusSel = await workRow.$('select');
      if (statusSel) {
        await statusSel.selectOption('APPROVED');
        await page.waitForTimeout(2000);
        workStatus = await statusSel.evaluate(el => el.value);
        console.log('Status via dropdown:', workStatus);
        await shot(page, 'p4-03b-dropdown-approved.png');
      }
    }
  } else if (workStatus === 'APPROVED') {
    console.log('Case already APPROVED ✓');
  } else {
    console.log(`Case status is ${workStatus} — skipping approve step`);
  }

  // ─── STEP 2: Move to Auction (APPROVED → AUCTION) ────────────────────────────
  console.log('\n--- Moving to Auction ---');
  await page.waitForTimeout(1000);

  // Refresh rows
  const preAuctionRows = await page.$$('table tbody tr');
  workRow = preAuctionRows[targetRowIdx] || preAuctionRows[0];

  const gavelBtn = await workRow.$('[title="Move to Auction"]');
  if (gavelBtn) {
    console.log('Gavel button visible — clicking Move to Auction...');
    await gavelBtn.click();
    await page.waitForTimeout(1500);
    await shot(page, 'p4-04-auction-modal.png');

    // Fill auction modal
    // End date: datetime-local format "YYYY-MM-DDTHH:MM"
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);
    const endDateStr = endDate.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:MM"

    // datetime-local input
    const dateInput = page.locator('input[type="datetime-local"]').first();
    if (await dateInput.count() > 0) {
      await dateInput.fill(endDateStr);
      console.log('Auction end date-time:', endDateStr);
    } else {
      console.log('WARN: datetime-local input not found');
    }

    // Reserve price (type="number", placeholder "e.g. 500000")
    const reserveInput = page.locator('input[placeholder*="500000"], input[placeholder*="reserve"]').first();
    if (await reserveInput.count() > 0) {
      await reserveInput.fill('400000');
      console.log('Reserve price: 400000');
    } else {
      // fallback: second number input
      const numInputs = page.locator('input[type="number"]');
      if (await numInputs.count() > 0) {
        await numInputs.first().fill('400000');
        console.log('Reserve price via fallback');
      }
    }

    // Min increment (placeholder "1000")
    const incrementInput = page.locator('input[placeholder="1000"]').first();
    if (await incrementInput.count() > 0) await incrementInput.fill('5000');

    const notesArea = page.locator('textarea').first();
    if (await notesArea.count() > 0) await notesArea.fill('Phase 4 test auction — 1 Test Street Sydney');

    await shot(page, 'p4-05-auction-form-filled.png');

    // Submit — button says "Move to Auction"
    // Find it inside the modal (fixed z-50 overlay)
    const modalSubmitBtn = page.locator('.fixed button:has-text("Move to Auction"), .fixed button:has-text("Create Auction")').first();
    const modalCount = await modalSubmitBtn.count();
    console.log('Modal submit button found:', modalCount > 0 ? 'YES' : 'NO');

    if (modalCount > 0) {
      const btnTxt = await modalSubmitBtn.textContent();
      console.log('Clicking:', btnTxt.trim());
      await modalSubmitBtn.click();
      await page.waitForTimeout(4000);
      await shot(page, 'p4-06-auction-submitted.png');

      // Check error message inside modal (if still visible)
      const errMsg = await page.$eval('.text-red-600', el => el.textContent.trim()).catch(() => null);
      if (errMsg) console.log('Auction error:', errMsg);

      // Check if modal closed
      const modalStillOpen = await page.$('.fixed:has(h2:has-text("Move Case to Auction"))');
      console.log('Modal closed:', !modalStillOpen ? 'YES ✓' : 'NO — check error');
    } else {
      // List all buttons visible
      const allBtns = await page.$$eval('button', btns => btns.map(b => b.textContent.trim()).filter(t => t.length > 0 && t.length < 50));
      console.log('All visible buttons:', allBtns);
    }

    // Verify status
    await page.waitForTimeout(1000);
    const postAuctionRows = await page.$$('table tbody tr');
    if (postAuctionRows.length > 0) {
      const finalSel = await (postAuctionRows[targetRowIdx] || postAuctionRows[0]).$('select');
      const finalStatus = finalSel ? await finalSel.evaluate(el => el.value) : 'unknown';
      console.log('Final case status:', finalStatus);
      console.log('AUCTION status:', finalStatus === 'AUCTION' ? 'YES ✓' : 'NO — check screenshots');
    }

  } else {
    // Fallback: use status dropdown
    console.log('Gavel button NOT found — using status dropdown to set AUCTION');
    const statusSel = await workRow.$('select');
    if (statusSel) {
      const curStatus = await statusSel.evaluate(el => el.value);
      console.log('Current status:', curStatus);
      if (curStatus === 'APPROVED') {
        await statusSel.selectOption('AUCTION');
        await page.waitForTimeout(1500);
        const newStatus = await statusSel.evaluate(el => el.value);
        console.log('Status set to:', newStatus);
        await shot(page, 'p4-06b-auction-via-dropdown.png');
      } else {
        console.log(`Cannot move to auction from ${curStatus}`);
      }
    }
  }

  await shot(page, 'p4-07-cases-list-final.png');

  // ─── Auction Control page ─────────────────────────────────────────────────────
  console.log('\n--- Admin Auction Control page ---');
  await page.goto(BASE + '/admin/auction-control', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2500);
  await shot(page, 'p4-08-auction-control.png');

  const auctionStats = await page.$$eval(
    '[class*="stat"], [class*="card"], h2, h3',
    els => els.map(e => e.textContent.trim()).filter(t => t.length > 0 && t.length < 80)
  ).catch(() => []);
  console.log('Auction control content:', auctionStats.slice(0, 10));

  // Save state
  const state = { caseId };
  fs.writeFileSync(path.join(__dirname, 'test-state.json'), JSON.stringify(state, null, 2));

  console.log('\n=== PHASE 4 SUMMARY ===');
  console.log(`Case ID: ${caseId || 'see screenshots'}`);
  console.log('Screenshots saved to:', SS);

  await browser.close();
})();
