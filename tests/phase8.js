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

async function loginLawyer(page) {
  await page.goto(BASE + '/signin', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.click('button:has-text("Lawyer"):not(:has-text("Sign in"))');
  await page.waitForTimeout(400);
  await page.fill('input[type="email"]', 'lawyer@brickbanq.com');
  await page.fill('input[type="password"]', 'Lawyer@123');
  await page.click('button:has-text("Sign in as Lawyer")');
  await page.waitForURL('**/lawyer/**', { timeout: 15000 });
  await page.waitForTimeout(2000);
  console.log('Logged in as Lawyer');
}

async function fillInput(page, name, value) {
  const el = page.locator(`input[name="${name}"], textarea[name="${name}"]`).first();
  if (await el.count() > 0) {
    await el.click({ clickCount: 3 });
    await el.type(value, { delay: 20 });
  } else {
    console.log(`  WARN: field "${name}" not found`);
  }
}

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 150, args: ['--ignore-certificate-errors'] });
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await ctx.newPage();

  console.log('\n=== PHASE 8: LAWYER CREATES CASE (TEST-2024-002) ===\n');
  await loginLawyer(page);
  await shot(page, 'p8-00-lawyer-dashboard.png');

  // Check lawyer dashboard
  const dashContent = await page.$$eval('h1, h2, h3, [class*="stat"] *', els =>
    [...new Set(els.map(e => e.textContent.trim()).filter(t => t.length > 1 && t.length < 80))]
  );
  console.log('Dashboard content:', dashContent.slice(0, 10));

  // ─── Navigate to Submit New Case ─────────────────────────────────────────────
  console.log('\n--- Navigating to Submit New Case ---');
  await page.goto(BASE + '/lawyer/submit-case', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);
  await shot(page, 'p8-01-submit-case-form.png');
  console.log('Submit case URL:', page.url());

  // Verify form loaded
  const formTitle = await page.$eval('h1, h2, .text-2xl', el => el.textContent.trim()).catch(() => 'form');
  console.log('Form title:', formTitle);

  // ─── STEP 1: Property Details ─────────────────────────────────────────────────
  console.log('\n--- Step 1: Property Details ---');
  await fillInput(page, 'propertyAddress', '50 Collins Street');
  await fillInput(page, 'suburb', 'Melbourne');

  const stateSelect = page.locator('select[name="state"]').first();
  if (await stateSelect.count() > 0) await stateSelect.selectOption('VIC');

  await fillInput(page, 'postcode', '3000');
  await fillInput(page, 'intendedLoanAmount', '380000');
  await page.waitForTimeout(500);

  const nextBtn = page.locator('button:has-text("Next")').first();
  const nextEnabled = await nextBtn.evaluate(el => !el.disabled).catch(() => false);
  console.log('Next enabled:', nextEnabled ? 'YES ✓' : 'NO');
  await nextBtn.click();
  await page.waitForTimeout(1200);
  await shot(page, 'p8-02-step2-entity.png');

  // ─── STEP 2: Entity ────────────────────────────────────────────────────────────
  console.log('\n--- Step 2: Entity ---');
  await fillInput(page, 'firstName', 'LAWYER TEST');
  await fillInput(page, 'lastName', 'CASE 002');
  await fillInput(page, 'personalPhone', '0398765432');
  await fillInput(page, 'personalEmail', 'lawyertest@brickbanq.com');

  const creditConsent = page.locator('input[name="creditConsent"]').first();
  if (await creditConsent.count() > 0) await creditConsent.check();
  await page.waitForTimeout(500);
  await page.locator('button:has-text("Next")').first().click();
  await page.waitForTimeout(1200);
  await shot(page, 'p8-03-step3-payment.png');

  // ─── STEP 3: Payment ──────────────────────────────────────────────────────────
  console.log('\n--- Step 3: Payment Authorization ---');
  const authBtn = page.locator('button:has-text("Authorise"), button:has-text("Authorize"), button:has-text("I Authorise"), button:has-text("Confirm"), button:has-text("Accept")').first();
  if (await authBtn.count() > 0) {
    await authBtn.click();
    console.log('Payment authorized ✓');
  }
  await page.waitForTimeout(500);

  const step3Next = page.locator('button:has-text("Next")').first();
  const step3Disabled = await step3Next.evaluate(el => el.disabled).catch(() => false);
  if (step3Disabled) {
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find(b => /authoris|authoriz|accept|agree/i.test(b.textContent));
      if (btn) btn.click();
    });
    await page.waitForTimeout(500);
  }
  await step3Next.click({ force: !step3Disabled });
  await page.waitForTimeout(1200);
  await shot(page, 'p8-04-step4-lender.png');

  // ─── STEPS 4-10: Navigate through quickly ─────────────────────────────────────
  for (let step = 4; step <= 10; step++) {
    console.log(`--- Step ${step} ---`);

    if (step === 4) {
      await fillInput(page, 'lenderName', 'ANZ Bank');
      await fillInput(page, 'lenderEmail', 'lending@anz.com.au');
      await fillInput(page, 'lenderPhone', '0399381234');
      await fillInput(page, 'loanAccountNumber', '987654321');
    }
    if (step === 5) {
      await fillInput(page, 'outstandingDebt', '360000');
      await fillInput(page, 'originalLoanAmount', '400000');
      await fillInput(page, 'missedPayments', '3');
      await fillInput(page, 'totalArrears', '12500');
      await fillInput(page, 'valuationAmount', '650000');
    }
    if (step === 10) {
      await fillInput(page, 'defaultReason', 'Lawyer-filed case: Borrower facing financial hardship. MIP required for Melbourne property resolution.');
    }

    await page.waitForTimeout(400);
    await page.locator('button:has-text("Next")').first().click({ force: true });
    await page.waitForTimeout(1200);
  }

  await shot(page, 'p8-05-step11-submit.png');
  console.log('\n--- Step 11: Submit ---');

  const submitBtn = page.locator('button:has-text("Submit"), button[type="submit"]:has-text("Submit")').first();
  if (await submitBtn.count() > 0) {
    await submitBtn.click();
    await page.waitForTimeout(5000);
    await shot(page, 'p8-06-after-submit.png');
    const afterUrl = page.url();
    console.log('After submit URL:', afterUrl);

    const pageText = await page.evaluate(() => document.body.innerText.slice(0, 300));
    console.log('Page after submit:', pageText.replace(/\n+/g, ' ').slice(0, 200));
  } else {
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find(b => /submit|create case/i.test(b.textContent));
      if (btn) btn.click();
    });
    await page.waitForTimeout(5000);
    await shot(page, 'p8-06-after-submit.png');
  }

  // ─── Lawyer Assigned Cases ────────────────────────────────────────────────────
  console.log('\n--- Assigned Cases ---');
  await page.goto(BASE + '/lawyer/assigned-cases', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);
  await shot(page, 'p8-07-assigned-cases.png');

  const assignedCases = await page.$$eval(
    '[class*="card"], [class*="case"], table tbody tr',
    rows => rows.slice(0, 5).map(r => r.textContent.trim().slice(0, 100))
  );
  console.log('Assigned cases:', assignedCases.filter(t => t.length > 5).slice(0, 5));

  // ─── Lawyer Dashboard features ────────────────────────────────────────────────
  console.log('\n--- Lawyer Dashboard details ---');
  await page.goto(BASE + '/lawyer/dashboard', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);
  await shot(page, 'p8-08-lawyer-dashboard-full.png');

  // KYC Review
  await page.goto(BASE + '/lawyer/kyc-review', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(1500);
  await shot(page, 'p8-09-lawyer-kyc-review.png');
  console.log('KYC Review:', page.url());

  // Contract Review
  await page.goto(BASE + '/lawyer/contract-review', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(1500);
  await shot(page, 'p8-10-lawyer-contract-review.png');

  // Live Auctions
  await page.goto(BASE + '/lawyer/live-auctions', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(1500);
  await shot(page, 'p8-11-lawyer-live-auctions.png');

  // Reports
  await page.goto(BASE + '/lawyer/reports', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(1500);
  await shot(page, 'p8-12-lawyer-reports.png');

  console.log('\n=== PHASE 8 SUMMARY ===');
  console.log('Lawyer logged in: ✓');
  console.log('Case 2 (50 Collins Street Melbourne VIC 3000, $380k): submitted');
  console.log('Lawyer pages visited: assigned-cases, kyc-review, contract-review, live-auctions, reports');
  console.log('Screenshots saved to:', SS);

  await browser.close();
})();
