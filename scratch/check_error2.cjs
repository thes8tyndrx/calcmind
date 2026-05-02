const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  
  // click "Daily" tab to go to DailyScreen
  const dailyTabBtn = await page.evaluateHandle(() => {
    return Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Daily'));
  });
  if (dailyTabBtn) await dailyTabBtn.click();
  
  await new Promise(r => setTimeout(r, 1000));
  
  // click a topic to start quiz
  const topicBtn = await page.evaluateHandle(() => {
    return Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('START →') || b.textContent.includes('ATTEMPT'));
  });
  
  if (topicBtn) {
    console.log("Clicking start button...");
    await topicBtn.click();
  } else {
    console.log("Could not find start button. Trying to find My Mistakes...");
    const mistakesBtn = await page.evaluateHandle(() => {
        return Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('My Mistakes'));
    });
    if (mistakesBtn) {
        await mistakesBtn.click();
        await new Promise(r => setTimeout(r, 1000));
        const mistakesStart = await page.evaluateHandle(() => {
            return Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Current Affairs') || b.textContent.includes('Vocabulary'));
        });
        if (mistakesStart) await mistakesStart.click();
    }
  }

  await new Promise(r => setTimeout(r, 3000));
  
  await browser.close();
})();
