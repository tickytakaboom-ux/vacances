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
    browser = await chromium.launch({headless:true, channel:'msedge'});
    const context = await browser.newContext();
    await context.route('**/*', route => route.request().url().startsWith(origin + '/') ? route.continue() : route.abort());
    await context.addInitScript(() => localStorage.setItem('zigotos-first-name-v1', 'Test local'));
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(origin);
    await page.waitForFunction(() => typeof window.getTripData === 'function');
    const payload = '<img src="/__budget_missing__.png" onerror="window.__budgetXss=true">';
    const accented = 'Péage & séjour "été" <amis>';
    const original = await page.evaluate(() => window.getTripData());
    const expected = structuredClone(original);
    for (const count of [4,5,6,7]) {
      expected.budgets[count].items[0][0] = payload;
      expected.budgets[count].items[1][0] = accented;
    }
    await page.evaluate(data => window.dispatchEvent(new CustomEvent('shared-trip-data', {detail:data})), expected);
    async function check(phase) {
      for (const count of [4,5,6,7]) {
        await page.selectOption('#peopleSelect', String(count));
        await page.waitForTimeout(100);
        assert.equal(await page.locator('#budgetList img, #budgetList script').count(), 0, phase + ': aucun élément injecté');
        assert.equal(await page.evaluate(() => window.__budgetXss === true), false, phase + ': aucun script exécuté');
        assert.deepEqual(await page.locator('#budgetList .budget-row span').allTextContents(), expected.budgets[count].items.map(item => item[0]));
        const euro = new Intl.NumberFormat('fr-FR', {style:'currency',currency:'EUR'});
        assert.deepEqual(await page.locator('#budgetList .budget-row strong').allTextContents(), expected.budgets[count].items.map(item => euro.format(item[1]) + ' / pers.'));
        assert.equal(await page.locator('#perPersonTotal').textContent(), euro.format(expected.budgets[count].perPerson));
        assert.equal(await page.locator('#groupTotal').textContent(), 'Total du groupe : ' + euro.format(expected.budgets[count].total));
        assert.equal(await page.locator('#depositPerPerson').textContent(), euro.format(275.70 / count) + ' / pers.');
        assert.equal(await page.locator('#depositCautionPerPerson').textContent(), euro.format(200 / count) + ' / pers.');
        assert.equal(await page.locator('#statPeople').textContent(), String(count));
        assert.equal(await page.locator('#statPrice').textContent(), euro.format(expected.budgets[count].perPerson) + ' + ' + euro.format(200 / count) + ' = ' + euro.format(expected.budgets[count].perPerson + 200 / count));
      }
      assert.deepEqual(await page.evaluate(() => window.getTripData()), expected, phase + ': données intactes');
      assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('zigotos-embrun-data-v1'))), expected, phase + ': cache intact');
      assert.deepEqual(errors, []);
    }
    await check('réception');
    await page.reload();
    await page.waitForFunction(() => typeof window.getTripData === 'function');
    await check('rechargement du cache');
    console.log('PASS budget : réception et cache, texte littéral, aucun script/image injecté, données intactes et calculs pour 4/5/6/7 personnes ; réseau externe bloqué.');
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
