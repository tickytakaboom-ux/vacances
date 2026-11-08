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
    assert.equal(await page.locator('#perPersonTotal').textContent(),'489,19 €');
    assert.match(await page.locator('#cashWithDeposit').textContent(),/3.624,34.*517,76/);
    assert.match(await page.locator('#cashWithBothDeposits').textContent(),/3.684,34.*526,33/);
    assert.match(await page.locator('#savingsGoal').textContent(),/550,00.*3.850,00/);
    for(const width of [390,1280]){
      await page.setViewportSize({width,height:1000});
      assert.equal(await page.evaluate(()=>[...document.querySelectorAll('#budget .budget-row,#budget .budget-follow-up article')].every(el=>{const box=el.getBoundingClientRect();return box.left>=0 && box.right<=innerWidth;})),true);
      await page.locator('#budget').screenshot({path:'.preview/budget-'+width+'.png'});
    }
    const beforeScenarios=await page.evaluate(()=>window.getTripData());
    const scenarios={train:[3424.34,489.19,3624.34,517.76,3684.34,526.33,165.66,23.67,1400],cars:[2636.34,376.62,2836.34,405.19,2896.34,413.76,953.66,136.24,612],mixed:[3124.34,446.33,3324.34,474.91,3384.34,483.48,465.66,66.52,1100]};
    const euros=new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR'});
    for(const width of [390,1280]){
      await page.setViewportSize({width,height:1000});
      for(const [scenario,values] of Object.entries(scenarios)){
        await page.selectOption('#transportSelect',scenario);
        assert.equal(await page.locator('#statPeople').textContent(),'7');
        assert.equal(await page.locator('#perPersonTotal').textContent(),euros.format(values[1]));
        assert.equal(await page.locator('#groupTotal').textContent(),'Budget hors cautions : '+euros.format(values[0])+' pour le groupe');
        assert.equal(await page.locator('#cashWithDeposit').textContent(),euros.format(values[2])+' · '+euros.format(values[3])+' / pers.');
        assert.equal(await page.locator('#cashWithBothDeposits').textContent(),euros.format(values[4])+' · '+euros.format(values[5])+' / pers.');
        assert.equal(await page.locator('#savingsMargin').textContent(),euros.format(values[6])+' pour le groupe · '+euros.format(values[7])+' / pers.');
        assert.equal(await page.locator('#budgetList .budget-row strong').nth(1).textContent(),euros.format(values[8])+' pour le groupe');
        assert.equal(await page.locator('#budgetList .budget-row strong').nth(4).textContent(),euros.format(400)+' pour le groupe');
        assert.equal(await page.locator('#savingsGoal').textContent(),euros.format(550)+' / pers. · '+euros.format(3850)+' pour le groupe');
        assert.equal(await page.evaluate(()=>[...document.querySelectorAll('#budget .budget-row,#transportSelect,#budget .budget-follow-up article')].every(el=>{const rect=el.getBoundingClientRect();return rect.left>=0 && rect.right<=innerWidth;})),true);
        await page.locator('#budget').screenshot({path:'.preview/scenario-'+scenario+'-'+width+'.png'});
      }
    }
    assert.deepEqual(await page.evaluate(()=>window.getTripData()),beforeScenarios,'le choix du scénario ne modifie aucune donnée partagée');
    await page.selectOption('#transportSelect','train');
    const payload = '<img src="/__budget_missing__.png" onerror="window.__budgetXss=true">';
    const accented = 'Péage & séjour "été" <amis>';
    const original = await page.evaluate(() => window.getTripData());
    const expected = structuredClone(original);
    for (const count of [7]) {
      expected.budgets[count].items[0][0] = payload;
      expected.budgets[count].items[1][0] = accented;
    }
    await page.evaluate(data => window.dispatchEvent(new CustomEvent('shared-trip-data', {detail:data})), expected);
    async function check(phase) {
      for (const count of [7]) {

        await page.waitForTimeout(100);
        assert.equal(await page.locator('#budgetList img, #budgetList script').count(), 0, phase + ': aucun élément injecté');
        assert.equal(await page.evaluate(() => window.__budgetXss === true), false, phase + ': aucun script exécuté');
        assert.deepEqual(await page.locator('#budgetList .budget-row span').allTextContents(), expected.budgets[count].items.map(item => item[0]));
        const euro = new Intl.NumberFormat('fr-FR', {style:'currency',currency:'EUR'});
        assert.deepEqual(await page.locator('#budgetList .budget-row strong').allTextContents(), expected.budgets[count].items.map(item => euro.format(item[1]) + ' pour le groupe'));
        assert.equal(await page.locator('#perPersonTotal').textContent(), euro.format(expected.budgets[count].perPerson));
        assert.equal(await page.locator('#groupTotal').textContent(), 'Budget hors cautions : ' + euro.format(expected.budgets[count].total) + ' pour le groupe');
        assert.equal(await page.locator('#depositPerPerson').textContent(), euro.format(275.70 / count) + ' / pers.');
        assert.equal(await page.locator('#depositCautionPerPerson').textContent(), euro.format(200 / count) + ' / pers.');
        assert.equal(await page.locator('#statPeople').textContent(), String(count));
        assert.equal(await page.locator('#statPrice').textContent(), euro.format(expected.budgets[count].perPerson));
      }
      assert.deepEqual(await page.evaluate(() => window.getTripData()), expected, phase + ': données intactes');
      assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('zigotos-embrun-data-v1'))), expected, phase + ': cache intact');
      assert.deepEqual(errors, []);
    }
    await check('réception');
    await page.reload();
    await page.waitForFunction(() => typeof window.getTripData === 'function');
    await check('rechargement du cache');
    assert.equal(await page.locator('#transportSelect').inputValue(),'train');
    console.log('PASS budget : 3 scénarios x mobile/bureau, dépenses, cautions, marges, épargne, sélection locale, réception/cache et libellés inertes ; réseau externe bloqué.');
  } finally {
    server.closeAllConnections();
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
