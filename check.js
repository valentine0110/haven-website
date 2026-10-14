import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  await page.goto('http://localhost:5173/admin/properties/new', { waitUntil: 'networkidle0' });
  const html = await page.content();
  if (html.includes('went wrong')) {
    console.log('CRASH DETECTED');
  } else {
    console.log('NO CRASH. Page title:', await page.title());
  }
  await browser.close();
})();
