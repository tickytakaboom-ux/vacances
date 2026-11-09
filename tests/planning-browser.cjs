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
      const context=await browser.newContext({viewport:{width,height:1000}});
      await context.route('**/*',route=>route.request().url().startsWith(origin+'/')?route.continue():route.abort());
      await context.addInitScript(()=>localStorage.setItem('zigotos-first-name-v1','Test planning'));
      const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
      await page.goto(origin);await page.waitForFunction(()=>!!window.getTripData);
      assert.equal(await page.locator('#timeline .day').count(),8);
      assert.match(await page.locator('#timeline').textContent(),/Dimanche 11 juillet/);assert.match(await page.locator('#timeline').textContent(),/Dimanche 18 juillet/);
      assert.equal(await page.locator('#timeline .planning-optional').count()>0,true);assert.equal(await page.locator('#timeline .planning-pending').count()>0,true);
      for(const href of await page.locator('#timeline .day-links a').evaluateAll(links=>links.map(link=>link.getAttribute('href'))))assert.equal(await page.locator(href).count(),1);
      assert.equal(await page.evaluate(()=>[...document.querySelectorAll('#timeline .day')].every(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth;})),true);
      const originalData=await page.evaluate(()=>window.getTripData());
      assert.equal(await page.locator('#timeline .planning-details').count(),2);
      for(let index=0;index<8;index++)assert.equal(await page.locator('.day-copy').nth(index).evaluate(el=>editableDayText(el)),originalData.days[index][2],'aucune information perdue, jour '+index);
      assert.equal(await page.evaluate(()=>document.querySelector('#programme>.section-heading').getBoundingClientRect().bottom<=document.querySelector('#timeline').getBoundingClientRect().top),true);
      if(width<700){
        assert.equal(await page.locator('#timeline .day-links a').evaluateAll(links=>links.every(a=>a.getBoundingClientRect().height>=44)),true);
        assert.equal(await page.locator('#timeline .day-links').evaluateAll(groups=>groups.every(group=>{const boxes=[...group.querySelectorAll('a')].map(a=>a.getBoundingClientRect());return boxes.every((a,i)=>boxes.every((b,j)=>i===j||a.right<=b.left||b.right<=a.left||a.bottom<=b.top||b.bottom<=a.top));})),true);
      }
      for(const index of [3,5]){
        const day=page.locator('#timeline .day').nth(index);const detail=day.locator('details');
        assert.equal(await detail.evaluate(el=>el.open),false);assert.equal(await day.locator('.planning-main').isVisible(),true);assert.equal(await day.locator('.planning-optional').isVisible(),true);
        if(index===3)assert.match(await detail.locator('summary').textContent(),/À confirmer/);
        await detail.locator('summary').focus();await page.keyboard.press('Enter');assert.equal(await detail.evaluate(el=>el.open),true);assert.equal(await detail.locator('.planning-part').isVisible(),true);
        await page.keyboard.press('Space');assert.equal(await detail.evaluate(el=>el.open),false);
        await detail.locator('summary').click();assert.equal(await detail.evaluate(el=>el.open),true);
      }
      await page.evaluate(()=>window.dispatchEvent(new CustomEvent('shared-trip-data',{detail:window.getTripData(),cancelable:true})));
      assert.equal(await page.locator('#timeline .planning-details[open]').count(),2,'les notes ouvertes restent ouvertes après réception');
      await page.evaluate(()=>document.querySelectorAll('#timeline details').forEach(el=>el.open=false));
      assert.deepEqual(await page.evaluate(()=>window.getTripData()),originalData);
      await page.evaluate(()=>document.querySelector('#toggleEdit').click());
      for(let index=0;index<8;index++)assert.equal(await page.locator('.day-copy').nth(index).innerText(),originalData.days[index][2],'édition complète, jour '+index);
      await page.evaluate(()=>document.querySelector('#editButton').click());
      await page.waitForFunction(()=>!document.body.classList.contains('editing'));
      assert.deepEqual(await page.evaluate(()=>window.getTripData()),originalData,'ouvrir/fermer le mode édition ne modifie aucune donnée');
      const overlayStyles=await page.evaluate(()=>[...document.querySelectorAll('.section-nav,.mobile-nav,.back-to-top,.toast')].map(el=>{const style=el.getAttribute('style');el.style.setProperty('display','none','important');return style;}));
      await page.locator('#programme').screenshot({path:'.preview/planning-finition-'+width+'.png'});
      await page.evaluate(styles=>document.querySelectorAll('.section-nav,.mobile-nav,.back-to-top,.toast').forEach((el,i)=>{if(styles[i]===null)el.removeAttribute('style');else el.setAttribute('style',styles[i]);}),overlayStyles);

      const initial=await page.evaluate(()=>window.getTripData());
      await page.evaluate(()=>{window.saveSharedTrip=async()=>true;document.querySelector('#toggleEdit').click();});
      const day=page.locator('.day-copy').first();await day.fill('Au programme : notre arrivée personnalisée.\nAu choix : repos.');
      await page.evaluate(()=>document.querySelector('#editButton').click());
      await page.waitForFunction(()=>JSON.parse(localStorage.getItem('zigotos-embrun-data-v1')).days[0][2].includes('notre arrivée personnalisée'));
      await page.reload();await page.waitForFunction(()=>!!window.getTripData);assert.match(await page.locator('.day-copy').first().textContent(),/notre arrivée personnalisée/);assert.equal(await page.locator('.day-copy').first().locator('.planning-optional').count(),1);
      assert.deepEqual(await page.evaluate(()=>window.getTripData().budgets),initial.budgets);
      assert.deepEqual(await page.evaluate(()=>window.getTripData().activities),initial.activities);
      await page.evaluate(()=>{const value=window.getTripData();value.days[1][2]='Au choix : <img src=x onerror="window.planningXss=true">';window.dispatchEvent(new CustomEvent('shared-trip-data',{detail:value,cancelable:true}));});
      assert.equal(await page.locator('#timeline img,#timeline script').count(),0);assert.equal(await page.evaluate(()=>window.planningXss===true),false);assert.deepEqual(errors,[]);
      await context.close();
    }
    console.log('PASS planning : liens tactiles 44 px, détails clavier/tactile, contenu intégral et inchangé, notes ouvertes préservées, édition/cache, huit dates et autres rubriques conservées ; mobile et bureau.');
  } finally {server.closeAllConnections();await browser?.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
