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

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 400, args: ['--ignore-certificate-errors'] });
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await ctx.newPage();

  const consoleErrors = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', err => consoleErrors.push(err.message));

  console.log('\n=== PHASE 1: SMOKE TEST ===');
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  const title = await page.title();
  console.log('Page title:', title);
  console.log('URL:', page.url());

  await shot(page, 'smoke-01-login-page.png');

  console.log('Console errors on load:', consoleErrors.length ? consoleErrors : 'NONE');
  console.log('\nPhase 1 DONE');

  await browser.close();
})();
