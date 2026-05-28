// capture_screenshot.js
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  // wait a moment for UI to settle
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'calculator_screenshot.png', fullPage: true });
  await browser.close();
})();
