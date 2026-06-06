const { chromium } = require('playwright');
const path = require('path');
const { exec } = require('child_process');

(async () => {
  console.log('Starting dev server...');
  const server = exec('npm run preview', { env: { ...process.env, Path: "C:\\Users\\irsha\\.gemini\\antigravity\\scratch\\nodejs\\node-v20.18.0-win-x64;" + process.env.Path } });
  
  // Wait for server to start
  await new Promise(r => setTimeout(r, 5000));
  console.log('Server started, launching browser...');

  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  
  await page.screenshot({ path: path.join(__dirname, 'preview.png') });
  
  const rootHtml = await page.evaluate(() => document.getElementById('root').innerHTML);
  if (rootHtml.includes('Something went wrong')) {
      console.log('Error boundary is visible on page!');
  } else {
      console.log('No error boundary detected.');
  }

  await browser.close();
  server.kill();
  console.log('Done.');
})();
