# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin\deals.spec.ts >> Admin — All Deals & Investment Memo >> Bug 4 & 5 — Investment Memo tab loads without crash
- Location: tests\e2e\admin\deals.spec.ts:28:7

# Error details

```
TimeoutError: locator.click: Timeout 20000ms exceeded.
Call log:
  - waiting for locator('a[href*="deal"]').first()
    - locator resolved to <a aria-current="page" data-discover="true" href="/admin/all-deals" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors bg-indigo-600 text-white">…</a>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - element is outside of the viewport
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - element is outside of the viewport
    - retrying click action
      - waiting 100ms
    38 × waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - element is outside of the viewport
     - retrying click action
       - waiting 500ms

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e3]:
    - banner [ref=e4]:
      - generic [ref=e5]:
        - button "Open menu" [ref=e6] [cursor=pointer]:
          - img [ref=e7]
        - generic [ref=e9] [cursor=pointer]: Brickbanq
      - generic [ref=e10]:
        - button "Notifications" [ref=e12] [cursor=pointer]:
          - img [ref=e13]
        - generic [ref=e16]:
          - generic [ref=e17]:
            - paragraph [ref=e18]: Admin User
            - paragraph [ref=e19]: Admin
          - link "A" [ref=e20] [cursor=pointer]:
            - /url: /admin/settings
    - generic [ref=e22]:
      - generic [ref=e23]:
        - generic [ref=e24]: Menu
        - button [ref=e25] [cursor=pointer]:
          - img [ref=e26]
      - navigation [ref=e29]:
        - link [ref=e30] [cursor=pointer]:
          - /url: /admin/dashboard
          - img [ref=e31]
          - generic [ref=e36]: Dashboard
        - link [ref=e37] [cursor=pointer]:
          - /url: /admin/case-management
          - img [ref=e38]
          - generic [ref=e41]: Case Management
        - link [ref=e42] [cursor=pointer]:
          - /url: /admin/all-deals
          - img [ref=e43]
          - generic [ref=e46]: All Deals
        - link [ref=e47] [cursor=pointer]:
          - /url: /admin/auction-control
          - img [ref=e48]
          - generic [ref=e54]: Auction Control
        - link [ref=e55] [cursor=pointer]:
          - /url: /admin/kyc-review
          - img [ref=e56]
          - generic [ref=e61]: KYC Review Queue
        - link [ref=e62] [cursor=pointer]:
          - /url: /admin/document-library
          - img [ref=e63]
          - generic [ref=e65]: Document Library
        - link [ref=e66] [cursor=pointer]:
          - /url: /admin/reports-analytics
          - img [ref=e67]
          - generic [ref=e68]: Reports & Analytics
        - link [ref=e69] [cursor=pointer]:
          - /url: /admin/task-center
          - img [ref=e70]
          - generic [ref=e73]: Tasks
        - link [ref=e74] [cursor=pointer]:
          - /url: /admin/admin-center
          - img [ref=e75]
          - generic [ref=e77]: Admin Centre
        - link [ref=e78] [cursor=pointer]:
          - /url: /admin/notifications
          - img [ref=e79]
          - generic [ref=e82]: Notifications
        - link [ref=e83] [cursor=pointer]:
          - /url: /admin/settings
          - img [ref=e84]
          - generic [ref=e87]: Settings
        - button [ref=e88] [cursor=pointer]:
          - img [ref=e89]
          - generic [ref=e92]: Sign Out
    - main [ref=e93]:
      - generic [ref=e95]:
        - generic [ref=e96]:
          - heading "All Deals" [level=2] [ref=e97]
          - paragraph [ref=e98]: Manage platform deals across auctions and buy now opportunities.
        - generic [ref=e99]:
          - generic [ref=e100]:
            - textbox "Search suburb, postcode or address..." [ref=e101]
            - img [ref=e103]
          - generic [ref=e106]:
            - combobox [ref=e107] [cursor=pointer]:
              - option "All States" [selected]
              - option "VIC"
              - option "NSW"
              - option "QLD"
              - option "WA"
            - combobox [ref=e108] [cursor=pointer]:
              - option "All Status" [selected]
              - option "Draft"
              - option "Listed"
              - option "Live Auction"
              - option "Coming Soon"
              - option "Under Contract"
              - option "Settled"
              - option "Closed"
            - combobox [ref=e109] [cursor=pointer]:
              - option "Newest" [selected]
              - 'option "Price: Low to High"'
              - 'option "Price: High to Low"'
            - button "Advanced Filters" [ref=e110] [cursor=pointer]:
              - img [ref=e111]
              - text: Advanced Filters
        - generic [ref=e112]:
          - generic [ref=e113] [cursor=pointer]:
            - generic [ref=e114]:
              - img "Unit 5 100 Queen Street – BRISBANE QLD" [ref=e115]
              - generic [ref=e116]: Under Contract
              - generic [ref=e117]:
                - img [ref=e118]
                - text: Ended
              - generic [ref=e121]:
                - generic [ref=e122]:
                  - img [ref=e123]
                  - text: "2"
                - generic [ref=e125]:
                  - img [ref=e126]
                  - text: "2"
                - generic [ref=e129]:
                  - img [ref=e130]
                  - text: "1"
            - generic [ref=e134]:
              - generic [ref=e135]:
                - heading "Unit 5 100 Queen Street – BRISBANE QLD" [level=3] [ref=e136]
                - paragraph [ref=e137]:
                  - img [ref=e138]
                  - generic [ref=e141]: BRISBANE, QLD, 4000
              - generic [ref=e142]:
                - generic [ref=e143]:
                  - paragraph [ref=e144]: Loan
                  - paragraph [ref=e145]: $2,000
                - generic [ref=e146]:
                  - paragraph [ref=e147]: Bid
                  - paragraph [ref=e148]: $48,000
                - generic [ref=e149]:
                  - paragraph [ref=e150]: LVR
                  - paragraph [ref=e151]: 2%
                - generic [ref=e152]:
                  - paragraph [ref=e153]: Return
                  - paragraph [ref=e154]: 5.5%
              - generic [ref=e155]:
                - button "Auction" [ref=e156]:
                  - img [ref=e157]
                  - text: Auction
                - button [ref=e163]:
                  - img [ref=e164]
          - generic [ref=e167] [cursor=pointer]:
            - generic [ref=e168]:
              - img "78 Queen Street – Brisbane QLD" [ref=e169]
              - generic [ref=e170]: Under Contract
              - generic [ref=e171]:
                - img [ref=e172]
                - text: Ended
              - generic [ref=e175]:
                - generic [ref=e176]:
                  - img [ref=e177]
                  - text: "3"
                - generic [ref=e179]:
                  - img [ref=e180]
                  - text: "2"
                - generic [ref=e183]:
                  - img [ref=e184]
                  - text: "2"
            - generic [ref=e188]:
              - generic [ref=e189]:
                - heading "78 Queen Street – Brisbane QLD" [level=3] [ref=e190]
                - paragraph [ref=e191]:
                  - img [ref=e192]
                  - generic [ref=e195]: Brisbane, QLD, 4000
              - generic [ref=e196]:
                - generic [ref=e197]:
                  - paragraph [ref=e198]: Loan
                  - paragraph [ref=e199]: $1,000
                - generic [ref=e200]:
                  - paragraph [ref=e201]: Bid
                  - paragraph [ref=e202]: $78,000
                - generic [ref=e203]:
                  - paragraph [ref=e204]: LVR
                  - paragraph [ref=e205]: 2%
                - generic [ref=e206]:
                  - paragraph [ref=e207]: Return
                  - paragraph [ref=e208]: 5.5%
              - generic [ref=e209]:
                - button "Auction" [ref=e210]:
                  - img [ref=e211]
                  - text: Auction
                - button [ref=e217]:
                  - img [ref=e218]
          - generic [ref=e221] [cursor=pointer]:
            - generic [ref=e222]:
              - img "12 collins street – melbourne VIC" [ref=e223]
              - generic [ref=e224]: Under Contract
              - generic [ref=e225]:
                - img [ref=e226]
                - text: Ended
              - generic [ref=e229]:
                - generic [ref=e230]:
                  - img [ref=e231]
                  - text: "3"
                - generic [ref=e233]:
                  - img [ref=e234]
                  - text: "22"
                - generic [ref=e237]:
                  - img [ref=e238]
                  - text: "2"
            - generic [ref=e242]:
              - generic [ref=e243]:
                - heading "12 collins street – melbourne VIC" [level=3] [ref=e244]
                - paragraph [ref=e245]:
                  - img [ref=e246]
                  - generic [ref=e249]: melbourne, VIC, 3000
              - generic [ref=e250]:
                - generic [ref=e251]:
                  - paragraph [ref=e252]: Loan
                  - paragraph [ref=e253]: $1,001
                - generic [ref=e254]:
                  - paragraph [ref=e255]: Bid
                  - paragraph [ref=e256]: $105,001
                - generic [ref=e257]:
                  - paragraph [ref=e258]: LVR
                  - paragraph [ref=e259]: 1%
                - generic [ref=e260]:
                  - paragraph [ref=e261]: Return
                  - paragraph [ref=e262]: 5.5%
              - generic [ref=e263]:
                - button "Auction" [ref=e264]:
                  - img [ref=e265]
                  - text: Auction
                - button [ref=e271]:
                  - img [ref=e272]
          - generic [ref=e275] [cursor=pointer]:
            - generic [ref=e276]:
              - img "78 King William Street – Adelaide SA" [ref=e277]
              - generic [ref=e278]: Under Contract
              - generic [ref=e279]:
                - img [ref=e280]
                - text: Ended
              - generic [ref=e283]:
                - generic [ref=e284]:
                  - img [ref=e285]
                  - text: "3"
                - generic [ref=e287]:
                  - img [ref=e288]
                  - text: "2"
                - generic [ref=e291]:
                  - img [ref=e292]
                  - text: "2"
            - generic [ref=e296]:
              - generic [ref=e297]:
                - heading "78 King William Street – Adelaide SA" [level=3] [ref=e298]
                - paragraph [ref=e299]:
                  - img [ref=e300]
                  - generic [ref=e303]: Adelaide , SA, 5000
              - generic [ref=e304]:
                - generic [ref=e305]:
                  - paragraph [ref=e306]: Loan
                  - paragraph [ref=e307]: $400,000
                - generic [ref=e308]:
                  - paragraph [ref=e309]: Bid
                  - paragraph [ref=e310]: $0
                - generic [ref=e311]:
                  - paragraph [ref=e312]: LVR
                  - paragraph [ref=e313]: 80%
                - generic [ref=e314]:
                  - paragraph [ref=e315]: Return
                  - paragraph [ref=e316]: 5.5%
              - generic [ref=e317]:
                - button "Auction" [ref=e318]:
                  - img [ref=e319]
                  - text: Auction
                - button [ref=e325]:
                  - img [ref=e326]
          - generic [ref=e329] [cursor=pointer]:
            - generic [ref=e330]:
              - img "1 Test Street – Sydney NSW" [ref=e331]
              - generic [ref=e332]: Under Contract
              - generic [ref=e333]:
                - img [ref=e334]
                - text: Ended
              - generic [ref=e337]:
                - generic [ref=e338]:
                  - img [ref=e339]
                  - text: "4"
                - generic [ref=e341]:
                  - img [ref=e342]
                  - text: "2"
                - generic [ref=e345]:
                  - img [ref=e346]
                  - text: "2"
            - generic [ref=e350]:
              - generic [ref=e351]:
                - heading "1 Test Street – Sydney NSW" [level=3] [ref=e352]
                - paragraph [ref=e353]:
                  - img [ref=e354]
                  - generic [ref=e357]: Sydney, NSW, 2000
              - generic [ref=e358]:
                - generic [ref=e359]:
                  - paragraph [ref=e360]: Loan
                  - paragraph [ref=e361]: $3,000
                - generic [ref=e362]:
                  - paragraph [ref=e363]: Bid
                  - paragraph [ref=e364]: $0
                - generic [ref=e365]:
                  - paragraph [ref=e366]: LVR
                  - paragraph [ref=e367]: 0%
                - generic [ref=e368]:
                  - paragraph [ref=e369]: Return
                  - paragraph [ref=e370]: 5.5%
              - generic [ref=e371]:
                - button "Auction" [ref=e372]:
                  - img [ref=e373]
                  - text: Auction
                - button [ref=e379]:
                  - img [ref=e380]
          - generic [ref=e383] [cursor=pointer]:
            - generic [ref=e384]:
              - img "25 victoria street – paramatta NSW" [ref=e385]
              - generic [ref=e386]: Under Contract
              - generic [ref=e387]:
                - img [ref=e388]
                - text: Ended
              - generic [ref=e391]:
                - generic [ref=e392]:
                  - img [ref=e393]
                  - text: "3"
                - generic [ref=e395]:
                  - img [ref=e396]
                  - text: "2"
                - generic [ref=e399]:
                  - img [ref=e400]
                  - text: "2"
            - generic [ref=e404]:
              - generic [ref=e405]:
                - heading "25 victoria street – paramatta NSW" [level=3] [ref=e406]
                - paragraph [ref=e407]:
                  - img [ref=e408]
                  - generic [ref=e411]: paramatta, NSW, 3000
              - generic [ref=e412]:
                - generic [ref=e413]:
                  - paragraph [ref=e414]: Loan
                  - paragraph [ref=e415]: $2,000
                - generic [ref=e416]:
                  - paragraph [ref=e417]: Bid
                  - paragraph [ref=e418]: $228,000
                - generic [ref=e419]:
                  - paragraph [ref=e420]: LVR
                  - paragraph [ref=e421]: 3%
                - generic [ref=e422]:
                  - paragraph [ref=e423]: Return
                  - paragraph [ref=e424]: 5.5%
              - generic [ref=e425]:
                - button "Auction" [ref=e426]:
                  - img [ref=e427]
                  - text: Auction
                - button [ref=e433]:
                  - img [ref=e434]
          - generic [ref=e437] [cursor=pointer]:
            - generic [ref=e438]:
              - img "123 George Street – SYDNEY NSW" [ref=e439]
              - generic [ref=e440]: Under Contract
              - generic [ref=e441]:
                - img [ref=e442]
                - text: Ended
              - generic [ref=e445]:
                - generic [ref=e446]:
                  - img [ref=e447]
                  - text: "2"
                - generic [ref=e449]:
                  - img [ref=e450]
                  - text: "2"
                - generic [ref=e453]:
                  - img [ref=e454]
                  - text: "1"
            - generic [ref=e458]:
              - generic [ref=e459]:
                - heading "123 George Street – SYDNEY NSW" [level=3] [ref=e460]
                - paragraph [ref=e461]:
                  - img [ref=e462]
                  - generic [ref=e465]: SYDNEY , NSW, 2000
              - generic [ref=e466]:
                - generic [ref=e467]:
                  - paragraph [ref=e468]: Loan
                  - paragraph [ref=e469]: $1,000
                - generic [ref=e470]:
                  - paragraph [ref=e471]: Bid
                  - paragraph [ref=e472]: $0
                - generic [ref=e473]:
                  - paragraph [ref=e474]: LVR
                  - paragraph [ref=e475]: 0%
                - generic [ref=e476]:
                  - paragraph [ref=e477]: Return
                  - paragraph [ref=e478]: 5.5%
              - generic [ref=e479]:
                - button "Auction" [ref=e480]:
                  - img [ref=e481]
                  - text: Auction
                - button [ref=e487]:
                  - img [ref=e488]
          - generic [ref=e491] [cursor=pointer]:
            - generic [ref=e492]:
              - img "123 Brisbane – sydney NSW" [ref=e493]
              - generic [ref=e494]: Under Contract
              - generic [ref=e495]:
                - img [ref=e496]
                - text: Ended
              - generic [ref=e499]:
                - generic [ref=e500]:
                  - img [ref=e501]
                  - text: "3"
                - generic [ref=e503]:
                  - img [ref=e504]
                  - text: "3"
                - generic [ref=e507]:
                  - img [ref=e508]
                  - text: "2"
            - generic [ref=e512]:
              - heading "123 Brisbane – sydney NSW" [level=3] [ref=e514]
              - generic [ref=e515]:
                - generic [ref=e516]:
                  - paragraph [ref=e517]: Loan
                  - paragraph [ref=e518]: $500,000
                - generic [ref=e519]:
                  - paragraph [ref=e520]: Bid
                  - paragraph [ref=e521]: $510,000
                - generic [ref=e522]:
                  - paragraph [ref=e523]: LVR
                  - paragraph [ref=e524]: 86%
                - generic [ref=e525]:
                  - paragraph [ref=e526]: Return
                  - paragraph [ref=e527]: 5.5%
              - generic [ref=e528]:
                - button "Auction" [ref=e529]:
                  - img [ref=e530]
                  - text: Auction
                - button [ref=e536]:
                  - img [ref=e537]
  - region "Notifications Alt+T"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { login } from '../helpers/auth';
  3  | 
  4  | test.describe('Admin — All Deals & Investment Memo', () => {
  5  |   test.beforeEach(async ({ page }) => {
  6  |     await login(page, 'admin');
  7  |     await page.goto('/admin/all-deals');
  8  |     await page.waitForLoadState('networkidle');
  9  |   });
  10 | 
  11 |   test('All Deals page loads', async ({ page }) => {
  12 |     await expect(page.locator('text=/Deal|deal/i').first()).toBeVisible();
  13 |     await expect(page.locator('text=/Something went wrong/i')).not.toBeVisible();
  14 |   });
  15 | 
  16 |   test('Deal list shows items or empty state', async ({ page }) => {
  17 |     // Wait for loading spinner to disappear, then check content
  18 |     await page.waitForSelector('[class*="loading"], [class*="spinner"], text=/Loading/i', { state: 'hidden', timeout: 30000 }).catch(() => {});
  19 |     await page.waitForTimeout(1000);
  20 |     const hasItems = await page.locator('[class*="card"], [class*="deal"], [class*="grid"] > div').first().isVisible().catch(() => false);
  21 |     const hasEmpty = await page.locator('text=/No deals found|no deals|empty/i').first().isVisible().catch(() => false);
  22 |     const hasError = await page.locator('text=/failed|error/i').first().isVisible().catch(() => false);
  23 |     // Pass if any of: items, empty state, or error state is visible
  24 |     expect(hasItems || hasEmpty || hasError).toBeTruthy();
  25 |   });
  26 | 
  27 |   // Bug 4 + 5: Investment Memorandum tab
  28 |   test('Bug 4 & 5 — Investment Memo tab loads without crash', async ({ page }) => {
  29 |     // Wait for loading to clear
  30 |     await page.waitForSelector('[class*="animate-spin"], [class*="loading"]', { state: 'hidden', timeout: 25000 }).catch(() => {});
  31 |     await page.waitForTimeout(500);
  32 |     // Click into a deal
  33 |     const dealLink = page.locator('a[href*="deal"]').first();
  34 |     if (await dealLink.isVisible().catch(() => false)) {
> 35 |       await dealLink.click();
     |                      ^ TimeoutError: locator.click: Timeout 20000ms exceeded.
  36 |       await page.waitForLoadState('networkidle');
  37 | 
  38 |       // Look for Investment Memo tab
  39 |       const memoTab = page.locator('button:has-text("Investment Memo"), a:has-text("Investment Memo")').first();
  40 |       if (await memoTab.isVisible().catch(() => false)) {
  41 |         await memoTab.click();
  42 |         await page.waitForLoadState('networkidle');
  43 |         await expect(page.locator('text=/Something went wrong/i')).not.toBeVisible();
  44 | 
  45 |         // Bug 5: Gallery should not show 4 identical images
  46 |         const galleryImages = page.locator('[class*="gallery"] img, [class*="grid"] img');
  47 |         const count = await galleryImages.count();
  48 |         if (count >= 2) {
  49 |           const src0 = await galleryImages.nth(0).getAttribute('src');
  50 |           const src1 = await galleryImages.nth(1).getAttribute('src');
  51 |           // If there are multiple images, not all should be identical
  52 |           if (count === 4) {
  53 |             const src2 = await galleryImages.nth(2).getAttribute('src');
  54 |             const src3 = await galleryImages.nth(3).getAttribute('src');
  55 |             const allSame = src0 === src1 && src1 === src2 && src2 === src3;
  56 |             expect(allSame).toBeFalsy();
  57 |           }
  58 |         }
  59 | 
  60 |         // Bug 4: Footer text should be visible (not invisible on dark bg)
  61 |         const footer = page.locator('[class*="bg-gray-900"], [class*="dark"]').last();
  62 |         if (await footer.isVisible().catch(() => false)) {
  63 |           const footerText = page.locator('[class*="bg-gray-900"] p, [class*="bg-gray-900"] span').first();
  64 |           if (await footerText.isVisible().catch(() => false)) {
  65 |             const color = await footerText.evaluate(el => getComputedStyle(el).color);
  66 |             // Color should NOT be very dark (like #6b7280 which is nearly invisible on dark bg)
  67 |             expect(color).not.toBe('rgb(107, 114, 128)');
  68 |           }
  69 |         }
  70 |       } else {
  71 |         test.skip();
  72 |       }
  73 |     } else {
  74 |       test.skip();
  75 |     }
  76 |   });
  77 | });
  78 | 
```