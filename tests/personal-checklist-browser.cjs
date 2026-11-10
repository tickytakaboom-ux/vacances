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
    for(const [width,colorScheme] of [[390,'light'],[1280,'dark']]){
      const context=await browser.newContext({viewport:{width,height:1000},colorScheme});
      await context.route('**/*',route=>route.request().url().startsWith(origin+'/')?route.continue():route.abort());
      await context.addInitScript(()=>{
        localStorage.setItem('zigotos-first-name-v1','Test valise');
        if(!localStorage.getItem('packing-fixture-ready')){
          localStorage.setItem('zigotos-personal-checklist-v1',JSON.stringify([{id:'personal-0',text:'Vêtements',checked:true},{id:'personal-8',text:'Serviettes',checked:true},{id:'old-charger',text:'Chargeur',checked:false},{id:'old-chargers',text:'Chargeurs',checked:true},{id:'custom-book',text:'Livre',checked:true},{id:'personal-7',text:'Mes baskets habituelles',checked:true}]));
          localStorage.setItem('zigotos-personal-checklist-version','2');localStorage.setItem('packing-fixture-ready','1');
        }
      });
      const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));await page.goto(origin);await page.waitForFunction(()=>!!window.getTripData);await page.locator('#tab-personal').click();
      const before=await page.evaluate(()=>({trip:window.getTripData(),sharedCache:localStorage.getItem('zigotos-embrun-data-v1')}));
      await page.evaluate(()=>{window.personalSharedWrites=0;window.saveSharedTrip=async()=>{window.personalSharedWrites++;return true;};});
      assert.equal(await page.locator('#personalList .checklist-item').count(),31);assert.equal(await page.locator('#personalList .packing-category').count(),7);assert.equal(await page.locator('#personalList .packing-bedding-note').count(),1);
      assert.equal(await page.locator('#personalList [data-id="packing-clothes"] input').isChecked(),true);assert.equal(await page.locator('#personalList [data-id="packing-charger"] input').isChecked(),true);assert.equal(await page.locator('#personalList [data-id="packing-shower-towel"] input').isChecked(),true);assert.equal(await page.locator('#personalList [data-id="packing-beach-towel"] input').isChecked(),false);
      assert.equal(await page.locator('#personalList [data-id="personal-7"] .check-text').textContent(),'Mes baskets habituelles');assert.equal(await page.locator('#personalList [data-id="custom-book"] input').isChecked(),true);
      assert.equal(await page.locator('#personalList [data-id="packing-sheets"] .packing-conditional').textContent(),'Alternative · à confirmer');assert.match(await page.locator('.packing-bedding-note').textContent(),/alternatives/);
      assert.equal(await page.evaluate(()=>[...document.querySelectorAll('#personalList .checklist-item')].every(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth;})),true);
      const hides=await page.addStyleTag({content:'.section-nav,.mobile-nav,.back-to-top,.toast{display:none!important}'});await page.locator('#checklist').screenshot({path:'.preview/valise-'+width+'-'+colorScheme+'.png'});await hides.evaluate(el=>el.remove());
      await page.locator('#personalList [data-id="packing-hat"] .check-text').click();await page.reload();await page.waitForFunction(()=>!!window.getTripData);assert.equal(await page.locator('#personalList [data-id="packing-hat"] input').isChecked(),true);
      const count=await page.locator('#personalList .checklist-item').count();await page.locator('#personalInput').fill('Gourde');await page.locator('#personalForm button').click();assert.equal(await page.locator('#personalList .checklist-item').count(),count);
      await page.locator('#personalInput').fill('Écouteurs');await page.locator('#personalForm button').click();assert.equal(await page.locator('#personalList .checklist-item').count(),count+1);
      page.once('dialog',dialog=>dialog.accept('Médicaments personnels (ordonnance)'));await page.locator('#personalList [data-id="packing-medicine"] .personal-edit').click();
      await page.locator('#personalList [data-id="packing-city-shoes"] .personal-delete').click();await page.reload();await page.waitForFunction(()=>!!window.getTripData);assert.equal(await page.locator('#personalList [data-id="packing-city-shoes"]').count(),0);assert.equal(await page.locator('#personalList [data-id="packing-medicine"] .check-text').textContent(),'Médicaments personnels (ordonnance)');assert.match(await page.locator('#packing-category-custom').locator('..').textContent(),/Écouteurs/);
      assert.deepEqual(await page.evaluate(()=>window.getTripData()),before.trip);assert.equal(await page.evaluate(()=>localStorage.getItem('zigotos-embrun-data-v1')),before.sharedCache);
      assert.deepEqual(errors,[]);await context.close();
    }
    console.log('PASS Ma valise : migration, coches, catégories, literie, ajouts/modifications/suppressions et rechargement ; mobile clair et ordinateur sombre, données partagées intactes.');
  } finally {server.closeAllConnections();await browser?.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
