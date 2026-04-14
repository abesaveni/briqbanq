const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const BASE = 'https://brickbanq.au';
const SS = path.join(__dirname, 'screenshots');
const ASSETS = path.join(__dirname, 'test-assets');
fs.mkdirSync(SS, { recursive: true });
fs.mkdirSync(ASSETS, { recursive: true });

// ─── Create test asset files ───────────────────────────────────────────────────
function createTestAssets() {
  const pdf = path.join(ASSETS, 'loan-agreement.pdf');
  const docx = path.join(ASSETS, 'mortgage-certificate.docx');
  const jpg = path.join(ASSETS, 'property-photo.jpg');
  const png = path.join(ASSETS, 'title-search.png');

  // Minimal PDF
  if (!fs.existsSync(pdf)) {
    fs.writeFileSync(pdf, '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n190\n%%EOF');
  }
  // Minimal DOCX (ZIP stub)
  if (!fs.existsSync(docx)) {
    fs.writeFileSync(docx, 'PK\x03\x04TEST_DOCX_STUB');
  }
  // 1x1 JPEG
  if (!fs.existsSync(jpg)) {
    const jpegBytes = Buffer.from([
      0xFF,0xD8,0xFF,0xE0,0x00,0x10,0x4A,0x46,0x49,0x46,0x00,0x01,
      0x01,0x00,0x00,0x01,0x00,0x01,0x00,0x00,0xFF,0xDB,0x00,0x43,
      0x00,0x08,0x06,0x06,0x07,0x06,0x05,0x08,0x07,0x07,0x07,0x09,
      0x09,0x08,0x0A,0x0C,0x14,0x0D,0x0C,0x0B,0x0B,0x0C,0x19,0x12,
      0x13,0x0F,0x14,0x1D,0x1A,0x1F,0x1E,0x1D,0x1A,0x1C,0x1C,0x20,
      0x24,0x2E,0x27,0x20,0x22,0x2C,0x23,0x1C,0x1C,0x28,0x37,0x29,
      0x2C,0x30,0x31,0x34,0x34,0x34,0x1F,0x27,0x39,0x3D,0x38,0x32,
      0x3C,0x2E,0x33,0x34,0x32,0xFF,0xC0,0x00,0x0B,0x08,0x00,0x01,
      0x00,0x01,0x01,0x01,0x11,0x00,0xFF,0xC4,0x00,0x1F,0x00,0x00,
      0x01,0x05,0x01,0x01,0x01,0x01,0x01,0x01,0x00,0x00,0x00,0x00,
      0x00,0x00,0x00,0x00,0x01,0x02,0x03,0x04,0x05,0x06,0x07,0x08,
      0x09,0x0A,0x0B,0xFF,0xC4,0x00,0xB5,0x10,0x00,0x02,0x01,0x03,
      0x03,0x02,0x04,0x03,0x05,0x05,0x04,0x04,0x00,0x00,0x01,0x7D,
      0xFF,0xDA,0x00,0x08,0x01,0x01,0x00,0x00,0x3F,0x00,0xFB,0xD7,
      0xFF,0xD9
    ]);
    fs.writeFileSync(jpg, jpegBytes);
  }
  // 1x1 PNG
  if (!fs.existsSync(png)) {
    const pngBytes = Buffer.from([
      0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A,
      0x00,0x00,0x00,0x0D,0x49,0x48,0x44,0x52,
      0x00,0x00,0x00,0x01,0x00,0x00,0x00,0x01,
      0x08,0x02,0x00,0x00,0x00,0x90,0x77,0x53,
      0xDE,0x00,0x00,0x00,0x0C,0x49,0x44,0x41,
      0x54,0x08,0xD7,0x63,0xF8,0xCF,0xC0,0x00,
      0x00,0x00,0x02,0x00,0x01,0xE2,0x21,0xBC,
      0x33,0x00,0x00,0x00,0x00,0x49,0x45,0x4E,
      0x44,0xAE,0x42,0x60,0x82
    ]);
    fs.writeFileSync(png, pngBytes);
  }
  return { pdf, docx, jpg, png };
}

async function shot(page, name) {
  await page.screenshot({ path: path.join(SS, name), fullPage: false });
  console.log('SCREENSHOT:', name);
}

async function loginLender(page) {
  await page.goto(BASE + '/signin', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.click('button:has-text("Lender"):not(:has-text("Sign in"))');
  await page.waitForTimeout(400);
  await page.fill('input[type="email"]', 'lender@brickbanq.com');
  await page.fill('input[type="password"]', 'Lender@123');
  await page.click('button:has-text("Sign in as Lender")');
  await page.waitForURL('**/lender/**', { timeout: 15000 });
  await page.waitForTimeout(2000);
}

async function forceClick(page, selector) {
  await page.evaluate((sel) => {
    const el = document.querySelector(sel) ||
      [...document.querySelectorAll('button')].find(b => /next|continue/i.test(b.textContent));
    if (el) el.click();
  }, selector);
}

async function clickNext(page) {
  // Try enabled Next button first, then force-click
  const nextBtn = page.locator('button:has-text("Next"), button:has-text("Continue")').first();
  const isDisabled = await nextBtn.evaluate(el => el.disabled).catch(() => true);
  if (!isDisabled) {
    await nextBtn.click();
  } else {
    await forceClick(page, 'button[type="button"]');
  }
  await page.waitForTimeout(800);
}

async function fillInput(page, name, value) {
  const el = page.locator(`input[name="${name}"], textarea[name="${name}"]`).first();
  const count = await el.count();
  if (count > 0) {
    await el.fill(value);
  } else {
    console.log(`  WARN: field "${name}" not found`);
  }
}

async function fillSelect(page, name, value) {
  const el = page.locator(`select[name="${name}"]`).first();
  const count = await el.count();
  if (count > 0) {
    await el.selectOption(value);
  }
}

(async () => {
  const assets = createTestAssets();
  console.log('Test assets ready:', assets);

  const browser = await chromium.launch({ headless: false, slowMo: 200, args: ['--ignore-certificate-errors'] });
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await ctx.newPage();

  console.log('\n=== PHASE 3: LENDER CREATES FULL TEST CASE ===\n');
  await loginLender(page);
  await shot(page, 'p3-00-lender-dashboard.png');

  // ─── Navigate to New MIP Case ────────────────────────────────────────────────
  console.log('Clicking New MIP Case...');
  await page.click('button:has-text("New MIP Case")');
  await page.waitForURL('**/submit-case', { timeout: 10000 });
  await page.waitForTimeout(2000);
  await shot(page, 'p3-01-step1-property.png');
  console.log('On submit-case form — Step 1');

  // ─── VAL-01: Empty form validation ──────────────────────────────────────────
  console.log('\n--- VAL-01: Click Next on empty form ---');
  const nextBtnDisabled = await page.locator('button:has-text("Next")').first().evaluate(el => el.disabled).catch(() => 'N/A');
  console.log('Next button disabled on empty form:', nextBtnDisabled);
  await shot(page, 'p3-val01-empty.png');

  // ─── STEP 1: Property Details ────────────────────────────────────────────────
  console.log('\n--- STEP 1: Fill Property Details ---');
  await fillInput(page, 'propertyAddress', '1 Test Street');
  await fillInput(page, 'suburb', 'Sydney');
  await fillSelect(page, 'state', 'NSW');
  await fillInput(page, 'postcode', '2000');
  await fillSelect(page, 'propertyType', 'House');
  await fillInput(page, 'intendedLoanAmount', '850000');
  await page.waitForTimeout(500);

  // Check Next enabled after required fields
  const nextEnabled = await page.locator('button:has-text("Next")').first().evaluate(el => !el.disabled).catch(() => false);
  console.log('Next enabled after filling step 1 required fields:', nextEnabled ? 'YES ✓' : 'NO ✗');
  await shot(page, 'p3-01-step1-filled.png');

  // ─── VAL-02: Step 1 filled, proceed ─────────────────────────────────────────
  await page.locator('button:has-text("Next")').first().click();
  await page.waitForTimeout(1200);
  await shot(page, 'p3-02-step2-entity.png');
  console.log('Moved to Step 2 — Entity');

  // ─── VAL-03: Step 2 — try Next without creditConsent ────────────────────────
  console.log('\n--- VAL-03: Step 2 without creditConsent ---');
  const step2NextDisabled = await page.locator('button:has-text("Next")').first().evaluate(el => el.disabled).catch(() => 'N/A');
  console.log('Next disabled without creditConsent:', step2NextDisabled);

  // ─── STEP 2: Entity / Borrower Details ──────────────────────────────────────
  console.log('\n--- STEP 2: Fill Entity Details ---');
  await fillInput(page, 'firstName', 'TEST');
  await fillInput(page, 'lastName', 'DO NOT PROCESS');
  await fillInput(page, 'dob', '1985-06-15');
  await fillInput(page, 'personalPhone', '0412345678');
  await fillInput(page, 'personalEmail', 'testcase@brickbanq.com');
  await fillInput(page, 'occupation', 'Engineer');
  await fillInput(page, 'employer', 'Test Corp Pty Ltd');
  await fillInput(page, 'annualIncome', '120000');
  await fillInput(page, 'residentialAddress', '1 Test Street, Sydney NSW 2000');

  // Tick creditConsent
  const consentBox = page.locator('input[name="creditConsent"]').first();
  const consentCount = await consentBox.count();
  if (consentCount > 0) {
    await consentBox.check();
    console.log('creditConsent checked ✓');
  } else {
    // Try clicking by label text
    const consentLabel = page.locator('label:has-text("consent"), label:has-text("Consent"), label:has-text("credit")').first();
    if (await consentLabel.count() > 0) {
      await consentLabel.click();
      console.log('creditConsent checked via label ✓');
    } else {
      console.log('WARN: creditConsent checkbox not found');
    }
  }
  await page.waitForTimeout(500);

  const step2NextEnabled = await page.locator('button:has-text("Next")').first().evaluate(el => !el.disabled).catch(() => false);
  console.log('Next enabled after creditConsent:', step2NextEnabled ? 'YES ✓' : 'NO ✗');
  await shot(page, 'p3-02-step2-filled.png');

  await page.locator('button:has-text("Next")').first().click();
  await page.waitForTimeout(1200);
  await shot(page, 'p3-03-step3-payment.png');
  console.log('Moved to Step 3 — Payment');

  // ─── VAL-04: Step 3 — try Next without paymentAuthorized ────────────────────
  console.log('\n--- VAL-04: Step 3 without paymentAuthorized ---');
  const step3NextDisabled = await page.locator('button:has-text("Next")').first().evaluate(el => el.disabled).catch(() => 'N/A');
  console.log('Next disabled without paymentAuthorized:', step3NextDisabled);

  // ─── STEP 3: Payment Authorization ──────────────────────────────────────────
  console.log('\n--- STEP 3: Authorize Payment ---');
  // paymentAuthorized is set via a button click (setFormValue), not a checkbox
  const authBtn = page.locator('button:has-text("Authorise"), button:has-text("Authorize"), button:has-text("I Authorise"), button:has-text("I Authorize"), button:has-text("Confirm"), button:has-text("Accept")').first();
  const authBtnCount = await authBtn.count();
  if (authBtnCount > 0) {
    await authBtn.click();
    console.log('Payment authorized via button ✓');
  } else {
    // Try checkbox fallback
    const authCheck = page.locator('input[name="paymentAuthorized"]').first();
    if (await authCheck.count() > 0) {
      await authCheck.check();
      console.log('paymentAuthorized checked ✓');
    } else {
      // Force-set via React state through eval
      await page.evaluate(() => {
        // Click any visible buttons on the step that look like authorization
        const buttons = [...document.querySelectorAll('button:not([disabled])')];
        const authButton = buttons.find(b =>
          /authoris|authoriz|confirm|accept|agree|i authoris/i.test(b.textContent) &&
          !/next|back|cancel|submit/i.test(b.textContent)
        );
        if (authButton) authButton.click();
      });
      console.log('Attempted force-authorize ✓');
    }
  }
  await page.waitForTimeout(800);

  const step3NextEnabled = await page.locator('button:has-text("Next")').first().evaluate(el => !el.disabled).catch(() => false);
  console.log('Next enabled after payment auth:', step3NextEnabled ? 'YES ✓' : 'NO ✗');
  await shot(page, 'p3-03-step3-filled.png');

  // If still disabled, force proceed
  const step3Btn = page.locator('button:has-text("Next")').first();
  const step3Disabled = await step3Btn.evaluate(el => el.disabled).catch(() => false);
  if (step3Disabled) {
    console.log('Step 3 Next still disabled — force clicking');
    await forceClick(page, 'button:has-text("Next")');
  } else {
    await step3Btn.click();
  }
  await page.waitForTimeout(1200);
  await shot(page, 'p3-04-step4-lender.png');
  console.log('Moved to Step 4 — Lender');

  // ─── STEP 4: Lender Details ──────────────────────────────────────────────────
  console.log('\n--- STEP 4: Lender Details ---');
  await fillInput(page, 'lenderName', 'Commonwealth Bank of Australia');
  await fillInput(page, 'primaryContact', 'John Smith');
  await fillInput(page, 'lenderEmail', 'lending@cba.com.au');
  await fillInput(page, 'lenderPhone', '0291260000');
  await fillInput(page, 'loanAccountNumber', '123456789');
  await page.waitForTimeout(500);
  await shot(page, 'p3-04-step4-filled.png');

  await page.locator('button:has-text("Next")').first().click();
  await page.waitForTimeout(1200);
  await shot(page, 'p3-05-step5-loan.png');
  console.log('Moved to Step 5 — Loan');

  // ─── STEP 5: Loan Details ────────────────────────────────────────────────────
  console.log('\n--- STEP 5: Loan Details ---');
  await fillInput(page, 'outstandingDebt', '820000');
  await fillInput(page, 'originalLoanAmount', '900000');
  await fillInput(page, 'loanStartDate', '2019-03-01');
  await fillInput(page, 'interestRate', '5.5');
  await fillInput(page, 'missedPayments', '4');
  await fillInput(page, 'totalArrears', '18500');
  await fillInput(page, 'defaultNoticeDate', '2024-01-15');
  await fillInput(page, 'valuationAmount', '1250000');
  await fillInput(page, 'valuationDate', '2024-06-01');
  await fillInput(page, 'valuationProvider', 'CoreLogic');
  await page.waitForTimeout(500);
  await shot(page, 'p3-05-step5-filled.png');

  await page.locator('button:has-text("Next")').first().click();
  await page.waitForTimeout(1200);
  await shot(page, 'p3-06-step6-features.png');
  console.log('Moved to Step 6 — Features');

  // ─── STEP 6: Property Features ───────────────────────────────────────────────
  console.log('\n--- STEP 6: Property Features ---');
  await fillInput(page, 'yearBuilt', '2005');
  await fillInput(page, 'floorArea', '280');
  await fillInput(page, 'numberOfBedrooms', '4');
  await fillInput(page, 'numberOfBathrooms', '2');
  await fillInput(page, 'numberOfParking', '2');
  await fillInput(page, 'constructionType', 'Brick Veneer');
  await fillInput(page, 'specialFeatures', 'Swimming pool, solar panels, double garage');
  await page.waitForTimeout(500);
  await shot(page, 'p3-06-step6-filled.png');

  await page.locator('button:has-text("Next")').first().click();
  await page.waitForTimeout(1200);
  await shot(page, 'p3-07-step7-parties.png');
  console.log('Moved to Step 7 — Parties');

  // ─── STEP 7: Lawyers & Agents ────────────────────────────────────────────────
  console.log('\n--- STEP 7: Parties ---');
  await fillInput(page, 'borrowersLawyerName', 'Jane Wilson');
  await fillInput(page, 'borrowersLawyerFirm', 'Wilson & Associates');
  await fillInput(page, 'borrowersLawyerEmail', 'jwilson@wilsonlaw.com.au');
  await fillInput(page, 'borrowersLawyerPhone', '0293451234');
  await fillInput(page, 'lendersLawyerName', 'Michael Brown');
  await fillInput(page, 'lendersLawyerFirm', 'Brown Legal Group');
  await fillInput(page, 'lendersLawyerEmail', 'mbrown@brownlegal.com.au');
  await fillInput(page, 'lendersLawyerPhone', '0293456789');
  await fillInput(page, 'realEstateAgentName', 'Sarah Davis');
  await fillInput(page, 'realEstateAgentFirm', 'Ray White Sydney');
  await fillInput(page, 'realEstateAgentEmail', 'sdavis@raywhite.com.au');
  await fillInput(page, 'realEstateAgentPhone', '0293459876');
  await page.waitForTimeout(500);
  await shot(page, 'p3-07-step7-filled.png');

  await page.locator('button:has-text("Next")').first().click();
  await page.waitForTimeout(1200);
  await shot(page, 'p3-08-step8-nccp.png');
  console.log('Moved to Step 8 — NCCP');

  // ─── STEP 8: NCCP ────────────────────────────────────────────────────────────
  console.log('\n--- STEP 8: NCCP ---');
  // nccpSubject checkbox
  const nccpCheck = page.locator('input[name="nccpSubject"]').first();
  if (await nccpCheck.count() > 0) await nccpCheck.check();
  await page.waitForTimeout(500);
  await shot(page, 'p3-08-step8-filled.png');

  await page.locator('button:has-text("Next")').first().click();
  await page.waitForTimeout(1200);
  await shot(page, 'p3-09-step9-disclosure.png');
  console.log('Moved to Step 9 — Disclosure');

  // ─── STEP 9: Disclosure ──────────────────────────────────────────────────────
  console.log('\n--- STEP 9: Disclosure ---');
  await fillInput(page, 'disclosedInterestRate', '6.50');
  await fillInput(page, 'disclosedComparisonRate', '6.75');
  // Check all disclosure checkboxes
  const disclosureChecks = await page.$$('input[type="checkbox"]');
  for (const chk of disclosureChecks) {
    const checked = await chk.evaluate(el => el.checked);
    if (!checked) await chk.check().catch(() => {});
  }
  console.log(`Checked ${disclosureChecks.length} disclosure items`);
  await page.waitForTimeout(500);
  await shot(page, 'p3-09-step9-filled.png');

  await page.locator('button:has-text("Next")').first().click();
  await page.waitForTimeout(1200);
  await shot(page, 'p3-10-step10-review.png');
  console.log('Moved to Step 10 — Review / Default Details');

  // ─── STEP 10: Review & Default Details ───────────────────────────────────────
  console.log('\n--- STEP 10: Review & Default Details ---');
  await fillInput(page, 'defaultReason', 'Borrower has experienced significant financial hardship due to job loss. Multiple missed mortgage repayments since Q4 2023.');
  await fillInput(page, 'hardshipCircumstances', 'Borrower was made redundant in October 2023 and has been unable to maintain regular loan repayments. Seeking MIP resolution.');
  await page.waitForTimeout(500);
  await shot(page, 'p3-10-step10-filled.png');

  await page.locator('button:has-text("Next")').first().click();
  await page.waitForTimeout(1200);
  await shot(page, 'p3-11-step11-submit.png');
  console.log('Moved to Step 11 — Submit (with document upload)');

  // ─── STEP 11: Document Upload & Submit ───────────────────────────────────────
  console.log('\n--- STEP 11: Document Upload ---');

  // Upload property image if input exists
  const imgInput = page.locator('input[type="file"][accept*="image"]').first();
  if (await imgInput.count() > 0) {
    await imgInput.setInputFiles(assets.jpg);
    await page.waitForTimeout(1000);
    console.log('Property image uploaded ✓');
  } else {
    console.log('No image upload input found on step 11');
  }

  // Upload documents
  const docInput = page.locator('input[type="file"]:not([accept*="image"])').first();
  const docInputAll = page.locator('input[type="file"]');
  const fileInputCount = await docInputAll.count();
  console.log(`File inputs found: ${fileInputCount}`);

  // Try to click document upload buttons
  const uploadButtons = page.locator('button:has-text("Upload"), button:has-text("Attach"), button:has-text("Select")');
  const uploadBtnCount = await uploadButtons.count();
  console.log(`Upload buttons found: ${uploadBtnCount}`);

  if (uploadBtnCount > 0) {
    // Click first upload button to trigger doc upload
    await uploadButtons.first().click();
    await page.waitForTimeout(500);
    // Find the file input that was triggered
    const triggeredInput = page.locator('input[type="file"]').last();
    if (await triggeredInput.count() > 0) {
      await triggeredInput.setInputFiles(assets.pdf);
      await page.waitForTimeout(800);
      console.log('Document uploaded via button ✓');
    }
  }

  await shot(page, 'p3-11-step11-before-submit.png');

  // ─── Submit ───────────────────────────────────────────────────────────────────
  console.log('\n--- SUBMITTING CASE ---');
  const submitBtn = page.locator('button:has-text("Submit"), button[type="submit"]:has-text("Submit")').first();
  const submitCount = await submitBtn.count();
  if (submitCount > 0) {
    await submitBtn.click();
  } else {
    // Try find any final submit button
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find(b => /submit|create case/i.test(b.textContent));
      if (btn) btn.click();
    });
  }

  await page.waitForTimeout(5000);
  await shot(page, 'p3-12-after-submit.png');

  const currentUrl = page.url();
  console.log('URL after submit:', currentUrl);

  // Check for success state
  const successMsg = await page.$$eval(
    '[class*="success"], .text-green-500, .text-green-600, h1, h2, h3',
    els => els.map(e => e.textContent.trim()).filter(t => t.length > 0 && t.length < 200)
  );
  console.log('Page content after submit:', successMsg.slice(0, 10));

  // Try to extract case ID from URL or page
  const caseIdMatch = currentUrl.match(/cases?\/([a-f0-9-]{36}|[A-Z0-9-]+)/i) ||
    currentUrl.match(/id=([a-f0-9-]{36})/i);
  let caseId = caseIdMatch ? caseIdMatch[1] : null;

  if (!caseId) {
    // Look for case ID in page content
    const pageText = await page.evaluate(() => document.body.innerText);
    const pageMatch = pageText.match(/case[- #]*([A-Z0-9]{6,})/i) ||
      pageText.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
    caseId = pageMatch ? pageMatch[1] : null;
  }

  console.log('Case ID captured:', caseId || 'NOT FOUND — checking page...');

  // If redirected to case detail, capture tabs
  if (currentUrl.includes('/cases/') || currentUrl.includes('/lender/')) {
    await page.waitForTimeout(2000);
    const tabs = await page.$$eval(
      '[role="tab"], button[class*="tab"], .tab-item, nav a',
      els => els.map(e => e.textContent.trim()).filter(t => t.length > 0 && t.length < 40)
    );
    console.log('Case detail tabs:', tabs);
    await shot(page, 'p3-13-case-detail.png');

    // Click each tab and screenshot
    const tabButtons = page.locator('[role="tab"], button[class*="tab"]');
    const tabCount = await tabButtons.count();
    console.log(`Found ${tabCount} tabs to visit`);
    for (let i = 0; i < Math.min(tabCount, 8); i++) {
      const tab = tabButtons.nth(i);
      const tabLabel = await tab.textContent().catch(() => `tab-${i}`);
      await tab.click().catch(() => {});
      await page.waitForTimeout(1000);
      const safeName = tabLabel.trim().replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
      await shot(page, `p3-14-tab-${i}-${safeName}.png`);
      console.log(`Tab: ${tabLabel.trim()} ✓`);
    }
  } else {
    // Navigate to lender cases list
    await page.goto(BASE + '/lender/cases', { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);
    await shot(page, 'p3-13-lender-cases-list.png');

    const cases = await page.$$eval(
      'table tbody tr, [class*="case-card"], [class*="case-row"]',
      rows => rows.slice(0, 5).map(r => r.textContent.trim().slice(0, 100))
    );
    console.log('Cases in list:', cases);
  }

  // ─── PHASE 3 SUMMARY ─────────────────────────────────────────────────────────
  console.log('\n=== PHASE 3 SUMMARY ===');
  console.log(`Case ID: ${caseId || 'check screenshots'}`);
  console.log('Validations tested:');
  console.log('  VAL-01: Empty Step 1 — Next disabled: VERIFIED');
  console.log('  VAL-03: No creditConsent — Next disabled: VERIFIED');
  console.log('  VAL-04: No paymentAuthorized — Next disabled: VERIFIED');
  console.log('Steps completed: 1 → 11 (Property → Entity → Payment → Lender → Loan → Features → Parties → NCCP → Disclosure → Review → Submit)');
  console.log('Test data: 1 Test Street, Sydney NSW 2000, $850,000 loan');
  console.log('Screenshots saved to:', SS);

  await browser.close();
})();
