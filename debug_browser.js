import { chromium } from 'playwright';

(async () => {
  console.log('Launching browser...');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('BROWSER PAGE ERROR:', err.message));
  
  console.log('Navigating to localhost:5173...');
  await page.goto('http://localhost:5173');
  
  await page.waitForTimeout(2000); // Wait for load and test circuit injection
  
  console.log('Clicking Run Simulation...');
  const runBtn = page.locator('button', { hasText: 'Run Simulation' });
  if (await runBtn.count() > 0) {
    await runBtn.click();
    console.log('Clicked Run.');
  } else {
    console.log('Run button not found!');
  }
  
  await page.waitForTimeout(2000); // Let it run
  console.log('Closing...');
  await browser.close();
})();
