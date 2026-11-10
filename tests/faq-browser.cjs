const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const assert = require('node:assert/strict');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

(async () => {
  const base = path.resolve(__dirname, '..');
  const types = {'.html':'text/html; charset=utf-8', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.svg':'image/svg+xml', '.woff2':'font/woff2', '.png':'image/png'};
  const server = http.createServer((req, res) => {
    const file = path.resolve(base, '.' + new URL(req.url, 'http://localhost').pathname.replace(/^\/$/, '/index.html'));
    if (!file.startsWith(base + path.sep)) { res.writeHead(403); return res.end(); }
    try { res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream'); res.end(fs.readFileSync(file)); }
    catch { res.writeHead(404); res.end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port;
  let browser;
  try {
    browser=await chromium.launch({headless:true,channel:'msedge'});
    for(const width of [390,1280]){
 const context=await browser.newContext({viewport:{width,height:900}});
 await context.route('**/*',route=>route.request().url().startsWith(origin+'/')?route.continue():route.abort());
 const page=await context.newPage();await page.goto(origin);await page.waitForFunction(()=>!!window.getTripData);
 await page.evaluate(()=>{document.querySelectorAll('dialog').forEach(d=>d.close());document.querySelectorAll('.access-gate,.welcome-overlay').forEach(e=>e.remove());});
 assert.equal(await page.locator('.faq-question').count(),5);
 await page.locator('.faq-question').first().scrollIntoViewIfNeeded();await page.locator('.faq-question').first().focus();await page.keyboard.press('Enter');assert.equal(await page.locator('.faq-question').first().getAttribute('aria-expanded'),'true');await page.keyboard.press('Space');assert.equal(await page.locator('.faq-question').first().getAttribute('aria-expanded'),'false');
 await page.locator('#faqShowAll').click();assert.equal(await page.locator('.faq-question').count(),12);
 assert.equal(await page.locator('.faq-question').last().innerText().then(t=>t.trim()),"Et si quelqu'un doit annuler ?");
 assert.equal(await page.evaluate(()=>[...document.querySelectorAll('#faqList article')].every(e=>e.getBoundingClientRect().right<=innerWidth)),true);
 await page.locator('.faq-question').last().click();assert.equal(await page.locator('.faq-question').last().getAttribute('aria-expanded'),'true');
 const data=await page.evaluate(()=>window.getTripData());await page.reload();await page.waitForFunction(()=>!!window.getTripData);assert.deepEqual(await page.evaluate(()=>window.getTripData()),data);
 await context.close();
 } console.log('PASS FAQ Edge : mobile/bureau, 5 puis 12 questions, clavier, accordéons, rechargement et absence de débordement.');
 } finally {if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
