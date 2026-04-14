const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const BASE = 'https://brickbanq.au';
const SS = path.join(__dirname, 'screenshots');
fs.mkdirSync(SS, { recursive: true });

let STATE = {};
try { STATE = JSON.parse(fs.readFileSync(path.join(__dirname, 'test-state.json'), 'utf8')); } catch {}
const CASE_ID = STATE.caseId || '63bd60a7-2cf8-47ac-a517-1b380c2ffb6c';

async function shot(page, name) {
  await page.screenshot({ path: path.join(SS, name), fullPage: false });
  console.log('SCREENSHOT:', name);
}

async function loginAdmin(page) {
  await page.goto(BASE + '/signin', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.click('button:has-text("Admin"):not(:has-text("Sign in"))');
  await page.waitForTimeout(400);
  await page.fill('input[type="email"]', 'admin@brickbanq.com');
  await page.fill('input[type="password"]', 'Admin@123');
  await page.click('button:has-text("Sign in as Admin")');
  await page.waitForURL('**/admin/**', { timeout: 15000 });
  await page.waitForTimeout(2000);
}

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 200, args: ['--ignore-certificate-errors'] });
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await ctx.newPage();

  console.log('\n=== PHASE 7: ADMIN CLOSES AUCTION & ASSIGNS TO LAWYER ===\n');
  await loginAdmin(page);
  await shot(page, 'p7-00-admin-dashboard.png');

  // ─── Auction Control ──────────────────────────────────────────────────────────
  console.log('--- Auction Control ---');
  await page.goto(BASE + '/admin/auction-control', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2500);
  await shot(page, 'p7-01-auction-control.png');

  // List auctions
  const auctionCards = await page.$$eval('[class*="card"], [class*="auction"]', els =>
    els.slice(0, 8).map(e => e.textContent.trim().slice(0, 100))
  );
  console.log('Auctions:', auctionCards.filter(t => t.length > 5).slice(0, 5));

  // Find close/end auction buttons
  const closeAuctionBtns = page.locator('button:has-text("Close Auction"), button:has-text("End Auction"), button:has-text("Close"), button:has-text("End")');
  const closeCount = await closeAuctionBtns.count();
  console.log(`Close/End auction buttons: ${closeCount}`);

  if (closeCount > 0) {
    console.log('Clicking Close Auction...');
    await closeAuctionBtns.first().click();
    await page.waitForTimeout(1500);
    await shot(page, 'p7-02-close-confirm.png');

    // Confirm if modal appears
    const confirmBtn = page.locator('button:has-text("Confirm"), button:has-text("Yes, Close"), button:has-text("Close Auction"), button:has-text("End")').last();
    if (await confirmBtn.count() > 0) {
      const btnTxt = await confirmBtn.textContent();
      console.log('Confirming:', btnTxt.trim());
      await confirmBtn.click();
      await page.waitForTimeout(2000);
      await shot(page, 'p7-03-auction-closed.png');
      console.log('Auction closed ✓');
    }
  } else {
    console.log('No close buttons on auction control — checking auction rooms');
    // Try entering auction room and closing from there
    const viewRoomBtn = page.locator('button:has-text("View Room"), button:has-text("Manage")').first();
    if (await viewRoomBtn.count() > 0) {
      await viewRoomBtn.click({ force: true });
      await page.waitForTimeout(2000);
      await shot(page, 'p7-02-auction-room.png');
      console.log('Auction room URL:', page.url());

      const closeBtn = page.locator('button:has-text("Close Auction"), button:has-text("End Auction")').first();
      if (await closeBtn.count() > 0) {
        await closeBtn.click();
        await page.waitForTimeout(1500);
        const confirmBtn2 = page.locator('button:has-text("Confirm"), button:has-text("Yes")').first();
        if (await confirmBtn2.count() > 0) await confirmBtn2.click();
        await page.waitForTimeout(2000);
        await shot(page, 'p7-03-auction-closed.png');
        console.log('Auction closed from room ✓');
      }
    }
  }

  // ─── Assign lawyer to case ────────────────────────────────────────────────────
  console.log('\n--- Assign Lawyer to Case ---');
  await page.goto(BASE + '/admin/case-management', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForFunction(() => {
    const rows = document.querySelectorAll('table tbody tr');
    return rows.length > 0 && !rows[0].textContent.includes('Loading');
  }, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1000);
  await shot(page, 'p7-04-case-management.png');

  const rows = await page.$$('table tbody tr');
  console.log(`Rows: ${rows.length}`);

  if (rows.length > 0) {
    // Find row with "King William" (our main test case) or use first row
    let targetRow = rows[0];
    for (const row of rows) {
      const text = await row.evaluate(el => el.textContent);
      if (text.includes('King William') || text.includes('63bd60a7')) {
        targetRow = row;
        break;
      }
    }

    const rowText = await targetRow.evaluate(el => el.textContent.trim().slice(0, 100));
    console.log('Assigning to case:', rowText);

    // Click Assign Lawyer button (UserPlus icon, title="Assign Lawyer / Lender")
    const assignBtn = await targetRow.$('[title="Assign Lawyer / Lender"]');
    if (assignBtn) {
      await assignBtn.click();
      await page.waitForTimeout(2000);
      await shot(page, 'p7-05-assign-modal.png');
      console.log('Assign modal opened ✓');

      // Select lawyer from dropdown — find all selects in the modal overlay
      const allSelects = await page.$$('.fixed select');
      console.log(`Selects in modal: ${allSelects.length}`);
      for (let si = 0; si < allSelects.length; si++) {
        const opts = await allSelects[si].$$eval('option', os =>
          os.map(o => ({ v: o.value, t: o.textContent.trim() })).filter(o => o.v)
        );
        console.log(`Select ${si} options:`, opts);
        if (opts.length > 0) {
          await allSelects[si].evaluate((el, val) => {
            el.value = val;
            el.dispatchEvent(new Event('change', { bubbles: true }));
          }, opts[0].v);
          console.log(`Selected: ${opts[0].t} in select ${si}`);
        }
      }

      await page.waitForTimeout(500);
      const submitBtn = page.locator('button:has-text("Assign"), button:has-text("Save"), button:has-text("Confirm")').last();
      if (await submitBtn.count() > 0) {
        await submitBtn.click();
        await page.waitForTimeout(2000);
        await shot(page, 'p7-06-after-assign.png');
        console.log('Lawyer assigned ✓');
      }
    } else {
      console.log('No assign button found on row');
    }
  }

  // ─── All Deals ────────────────────────────────────────────────────────────────
  console.log('\n--- All Deals ---');
  await page.goto(BASE + '/admin/all-deals', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);
  await shot(page, 'p7-07-all-deals.png');
  console.log('All Deals URL:', page.url());

  const dealsContent = await page.evaluate(() => document.body.innerText.slice(0, 300));
  console.log('Deals content:', dealsContent.replace(/\n+/g, ' ').slice(0, 200));

  console.log('\n=== PHASE 7 SUMMARY ===');
  console.log('Admin logged in: ✓');
  console.log('Auction control viewed: ✓');
  console.log('Case management: ✓');
  console.log('Screenshots saved to:', SS);

  await browser.close();
})();
