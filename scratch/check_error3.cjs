const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  
  // Click Daily tab
  await page.evaluate(() => {
    Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Daily')).click();
  });
  await new Promise(r => setTimeout(r, 1000));
  
  // Click Topic CA tab
  await page.evaluate(() => {
    Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Topic CA')).click();
  });
  await new Promise(r => setTimeout(r, 1000));
  
  // Click on Union Budget row to expand it
  await page.evaluate(() => {
    Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Budget')).click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // Click on the actual START -> button for a budget file
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button')).filter(b => b.textContent.includes('START →'));
    if(btns.length > 0) btns[0].click();
  });

  await new Promise(r => setTimeout(r, 3000));
  
  await browser.close();
})();
