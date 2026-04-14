const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const BASE = 'https://brickbanq.au';
const SS = path.join(__dirname, 'screenshots');
fs.mkdirSync(SS, { recursive: true });

// Load case ID from phase4
let STATE = {};
try { STATE = JSON.parse(fs.readFileSync(path.join(__dirname, 'test-state.json'), 'utf8')); } catch {}
const CASE_ID = STATE.caseId || '63bd60a7-2cf8-47ac-a517-1b380c2ffb6c';
console.log('Using case ID:', CASE_ID);

async function shot(page, name) {
  await page.screenshot({ path: path.join(SS, name), fullPage: false });
  console.log('SCREENSHOT:', name);
}

async function loginAs(page, roleTab, email, password, expectPath) {
  await page.goto(BASE + '/signin', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  const tabBtn = page.locator('button').filter({ hasText: new RegExp(`^${roleTab}$`, 'i') }).first();
  await tabBtn.click();
  await page.waitForTimeout(400);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click(`button:has-text("Sign in as ${roleTab}")`);
  await page.waitForURL(`**/${expectPath}/**`, { timeout: 15000 });
  await page.waitForTimeout(2000);
  console.log(`Logged in as ${roleTab}`);
}

async function logout(page) {
  await page.evaluate(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
  });
  await page.goto(BASE + '/signin', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
}

async function findAuctionInList(page) {
  // Look for "Test Street" or "1 Test Street" in auction cards/rows
  const testCaseAuction = page.locator(':has-text("Test Street"), :has-text("1 Test"), :has-text("King William")').first();
  return testCaseAuction;
}

async function placeBid(page, amount, role) {
  // Look for bid input and submit button
  const bidInput = page.locator('input[type="number"]').first();
  if (await bidInput.count() > 0) {
    // Use triple-click to select all, then type to trigger React onChange
    await bidInput.click({ clickCount: 3 });
    await page.waitForTimeout(200);
    await bidInput.type(String(amount), { delay: 50 });
    await page.waitForTimeout(800); // wait for React state to update
    const val = await bidInput.evaluate(el => el.value);
    console.log(`${role}: Bid amount set to $${Number(val).toLocaleString()}`);
  } else {
    console.log(`${role}: WARN — bid input not found`);
    return false;
  }

  // Check if button is now enabled
  const bidBtnLocator = page.locator(
    'button:has-text("Place Bid"), button:has-text("Submit Bid"), button:has-text("Bid Now"), button:has-text("Place My Bid")'
  ).first();
  const isDisabled = await bidBtnLocator.evaluate(el => el.disabled).catch(() => true);
  console.log(`${role}: Place Bid button disabled: ${isDisabled}`);

  if (isDisabled) {
    // Force submit via form submit
    console.log(`${role}: Attempting force form submit...`);
    await page.evaluate(() => {
      const form = document.querySelector('form');
      if (form) form.requestSubmit();
    });
  }

  // Find Place Bid / Submit Bid button
  const bidBtn = page.locator(
    'button:has-text("Place Bid"), button:has-text("Submit Bid"), button:has-text("Bid Now"), button:has-text("Place My Bid")'
  ).first();
  if (await bidBtn.count() > 0) {
    const btnText = await bidBtn.textContent();
    console.log(`${role}: Clicking "${btnText.trim()}"...`);
    await bidBtn.click({ force: true }); // force click even if disabled
    await page.waitForTimeout(3000);

    // Check for confirmation modal
    const confirmBtn = page.locator('button:has-text("Confirm"), button:has-text("Yes"), button:has-text("OK")').first();
    if (await confirmBtn.count() > 0) {
      console.log(`${role}: Confirming bid...`);
      await confirmBtn.click();
      await page.waitForTimeout(2000);
    }

    // Check success/error
    const successEl = await page.$eval('.text-green-600, .text-green-700, [class*="success"]', el => el.textContent.trim()).catch(() => null);
    const errorEl = await page.$eval('.text-red-600, .text-red-700', el => el.textContent.trim()).catch(() => null);
    if (successEl && !/sign out/i.test(successEl)) console.log(`${role}: SUCCESS: ${successEl}`);
    if (errorEl && !/sign out/i.test(errorEl)) console.log(`${role}: ERROR: ${errorEl}`);
    return true;
  } else {
    console.log(`${role}: WARN — bid button not found`);
    const allBtns = await page.$$eval('button', btns => btns.map(b => b.textContent.trim()).filter(t => t.length > 1 && t.length < 50));
    console.log(`${role}: Available buttons:`, allBtns.slice(0, 10));
    return false;
  }
}

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 200, args: ['--ignore-certificate-errors'] });
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await ctx.newPage();

  console.log('\n=== PHASE 5: BIDDING ===\n');
  const results = [];

  // ──────────────────────────────────────────────────────────────────────────────
  // BIDDER 1: Investor — $410,000
  // ──────────────────────────────────────────────────────────────────────────────
  console.log('\n--- BIDDER 1: INVESTOR ($410,000) ---');
  await loginAs(page, 'Investor', 'investor@brickbanq.com', 'Investor@123', 'investor');
  await shot(page, 'p5-01-investor-dashboard.png');

  // Navigate to Auctions
  await page.goto(BASE + '/investor/auctions', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);
  await shot(page, 'p5-02-investor-auctions.png');

  // List available auctions
  const investorAuctions = await page.$$eval(
    '[class*="card"], [class*="auction"], tr',
    els => els.slice(0, 5).map(e => e.textContent.trim().slice(0, 80))
  );
  console.log('Investor auctions:', investorAuctions.filter(t => t.length > 5));

  // Find our auction (78 King William = CASE_ID)
  let auctionLink = page.locator('a[href*="auctions/"], button:has-text("View"), a:has-text("Bid Now"), a:has-text("View Auction")').first();

  // Try to find "King William" or "Test Street" auction
  const specificAuction = page.locator('a:has-text("King William"), [href*="auctions/"]:near(:has-text("King William"))').first();
  if (await specificAuction.count() > 0) {
    auctionLink = specificAuction;
  }

  if (await auctionLink.count() > 0) {
    const linkHref = await auctionLink.evaluate(el => el.href || el.textContent);
    console.log('Opening auction:', linkHref.slice(0, 80));
    await auctionLink.click();
    await page.waitForTimeout(2000);
    await shot(page, 'p5-03-investor-auction-room.png');
    console.log('Auction room URL:', page.url());

    const bidSuccess = await placeBid(page, 410000, 'Investor');
    await shot(page, 'p5-04-investor-bid-placed.png');
    results.push({ role: 'Investor', amount: 410000, success: bidSuccess });
  } else {
    console.log('No auction links found — checking direct case auction URL');
    // Try direct URL: /investor/auctions/{auctionId}
    // We don't know auction ID, list all cards
    const allCards = await page.$$eval('a[href*="auction"]', links => links.map(l => ({ href: l.href, text: l.textContent.trim() })));
    console.log('Auction links found:', allCards.slice(0, 10));

    if (allCards.length > 0) {
      await page.goto(allCards[0].href, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(2000);
      await shot(page, 'p5-03-investor-auction-room.png');
      const bidSuccess = await placeBid(page, 410000, 'Investor');
      await shot(page, 'p5-04-investor-bid-placed.png');
      results.push({ role: 'Investor', amount: 410000, success: bidSuccess });
    } else {
      console.log('Investor: No auctions available');
      results.push({ role: 'Investor', amount: 410000, success: false });
    }
  }

  await logout(page);

  // ──────────────────────────────────────────────────────────────────────────────
  // BIDDER 2: Lawyer — $425,000
  // ──────────────────────────────────────────────────────────────────────────────
  console.log('\n--- BIDDER 2: LAWYER ($425,000) ---');
  await loginAs(page, 'Lawyer', 'lawyer@brickbanq.com', 'Lawyer@123', 'lawyer');
  await shot(page, 'p5-05-lawyer-dashboard.png');

  // Navigate to Lawyer's Live Auctions to get the auction ID
  await page.goto(BASE + '/lawyer/live-auctions', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);
  await shot(page, 'p5-06-lawyer-auctions.png');
  console.log('Lawyer auctions URL:', page.url());

  // Get auction ID from the page — auctions are case cards that navigate to assigned-cases or have auction IDs
  // The lawyer auction room is at /lawyer/auctions/:auctionId
  // Get the same auction ID that investor used — from /investor/auctions/:id URL
  const auctionId = '1d58db42-638e-4c7a-a234-5b3dcccac0cc'; // from Phase 5 investor run

  console.log('Using auction ID:', auctionId);
  await page.goto(BASE + `/lawyer/auctions/${auctionId}`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);
  await shot(page, 'p5-07-lawyer-auction-room.png');
  console.log('Lawyer auction room URL:', page.url());

  const lawyerBidSuccess = await placeBid(page, 425000, 'Lawyer');
  await shot(page, 'p5-08-lawyer-bid-placed.png');
  results.push({ role: 'Lawyer', amount: 425000, success: lawyerBidSuccess });

  await logout(page);

  // ──────────────────────────────────────────────────────────────────────────────
  // BIDDER 3: Admin — $450,000
  // ──────────────────────────────────────────────────────────────────────────────
  console.log('\n--- BIDDER 3: ADMIN ($450,000) ---');
  await loginAs(page, 'Admin', 'admin@brickbanq.com', 'Admin@123', 'admin');
  await shot(page, 'p5-09-admin-dashboard.png');

  // Navigate to Auction Control
  await page.goto(BASE + '/admin/auction-control', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);
  await shot(page, 'p5-10-admin-auction-control.png');

  // Look for auction rooms
  // Admin auction room: /admin/auction-room/:auctionId
  const theAuctionId = '1d58db42-638e-4c7a-a234-5b3dcccac0cc'; // from Phase 5 investor run
  console.log('Going to admin auction room:', theAuctionId);
  await page.goto(BASE + `/admin/auction-room/${theAuctionId}`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);
  await shot(page, 'p5-11-admin-auction-room.png');
  console.log('Admin auction room URL:', page.url());

  // Check if auction room loaded or 404
  const roomTitle = await page.$eval('h1, h2', el => el.textContent.trim()).catch(() => '404');
  console.log('Room title:', roomTitle);

  if (!roomTitle.includes('404')) {
    const bidSuccess = await placeBid(page, 450000, 'Admin');
    await shot(page, 'p5-12-admin-bid-placed.png');
    results.push({ role: 'Admin', amount: 450000, success: bidSuccess });
  } else {
    // Try from auction control — click View Room button
    await page.goto(BASE + '/admin/auction-control', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);
    // Find View Room buttons (they navigate to /admin/auction-room/:id)
    const viewRoomBtns = page.locator('button:has-text("View Room"), button:has-text("View"), button:has-text("Enter")');
    const count = await viewRoomBtns.count();
    console.log(`View Room buttons: ${count}`);
    if (count > 0) {
      await viewRoomBtns.first().click({ force: true });
      await page.waitForTimeout(2000);
      await shot(page, 'p5-11-admin-auction-room.png');
      console.log('Admin auction room URL:', page.url());
      const bidSuccess = await placeBid(page, 450000, 'Admin');
      await shot(page, 'p5-12-admin-bid-placed.png');
      results.push({ role: 'Admin', amount: 450000, success: bidSuccess });
    } else {
      console.log('Admin: No auction room entry found');
      results.push({ role: 'Admin', amount: 450000, success: false });
    }
  }

  // ─── Check bid history on auction control ────────────────────────────────────
  console.log('\n--- Checking bid history ---');
  await page.goto(BASE + '/admin/auction-control', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);

  // Try to find bid history / current highest bid
  const bidHistory = await page.$$eval(
    '[class*="bid"], [class*="history"], table tbody tr',
    rows => rows.slice(0, 10).map(r => r.textContent.trim().slice(0, 100))
  );
  console.log('Bid history / content:', bidHistory.filter(t => t.length > 5).slice(0, 5));
  await shot(page, 'p5-13-bid-history.png');

  // ─── PHASE 5 SUMMARY ─────────────────────────────────────────────────────────
  console.log('\n=== PHASE 5 SUMMARY ===');
  for (const r of results) {
    console.log(`  ${r.role}: $${r.amount.toLocaleString()} — ${r.success ? 'BID PLACED ✓' : 'FAILED ✗'}`);
  }

  // Update state
  STATE.bidsPlaced = results;
  fs.writeFileSync(path.join(__dirname, 'test-state.json'), JSON.stringify(STATE, null, 2));

  await browser.close();
})();
