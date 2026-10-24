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
    browser = await chromium.launch({headless:true,channel:'msedge'});
    for (const width of [390,1280]) {
      const context=await browser.newContext({viewport:{width,height:900}});
      await context.addInitScript(()=>localStorage.setItem('zigotos-first-name-v1','Test'));
      await context.route('**/*',async route=>{
        const url=route.request().url();
        if(url.startsWith(origin+'/'))return route.continue();
        let body;
        if(url.endsWith('firebase-app.js'))body='export const initializeApp=()=>({});';
        if(url.endsWith('firebase-auth.js'))body='export const getAuth=app=>({app});export const signInAnonymously=async()=>({user:{uid:"device-browser-test"}});';
        if(url.endsWith('firebase-firestore.js'))body='export const getFirestore=()=>({});export const doc=(_, ...p)=>p.join("/");export const collection=doc;export const serverTimestamp=()=>1;export const setDoc=async()=>{window.testWrites++};export const addDoc=setDoc;export function onSnapshot(ref,options,success,error){window.testListeners??=[];window.testWrites??=0;const item={ref,success,error,stopped:false};window.testListeners.push(item);return()=>{item.stopped=true}}';
        if(body)return route.fulfill({contentType:'text/javascript',body});
        return route.abort();
      });
      const page=await context.newPage();const errors=[];page.on("pageerror",error=>errors.push(error.message));await page.goto(origin);await page.waitForFunction(()=>window.testListeners?.length===1);
      assert.equal(await page.locator('#deviceAccess').count(),0);
      assert.equal(await page.evaluate(()=>window.testListeners[0].ref),'trips/embrun-2027');
      await page.evaluate(()=>window.testListeners[0].success({exists:()=>true,data:()=>({contentJson:JSON.stringify(window.getTripData())}),metadata:{fromCache:false,hasPendingWrites:false}}));
      const healthy=await page.evaluate(()=>({data:window.getTripData(),cache:localStorage.getItem('zigotos-embrun-data-v1')}));
      for(const field of ['faqs','activities','days','text','checklist','budgets','assistanceContacts']) {
        await page.evaluate(({data,field})=>{data[field]=null;window.testListeners[0].success({exists:()=>true,data:()=>({contentJson:JSON.stringify(data)}),metadata:{fromCache:false,hasPendingWrites:false}});},{data:healthy.data,field});
        assert.deepEqual(await page.evaluate(()=>window.getTripData()),healthy.data);
        assert.equal(await page.evaluate(()=>localStorage.getItem('zigotos-embrun-data-v1')),healthy.cache);
        assert.equal(await page.locator('#dataWarning').isVisible(),true);
        assert.equal(await page.evaluate(()=>window.saveSharedTrip(window.getTripData())),false);
      }
      await page.evaluate(data=>window.testListeners[0].success({exists:()=>true,data:()=>({contentJson:JSON.stringify(data)}),metadata:{fromCache:false,hasPendingWrites:false}}),healthy.data);
      assert.equal(await page.locator('#dataWarning').isVisible(),false);
      assert.equal(await page.evaluate(()=>{const d=window.getTripData();d.faqs=null;return window.dispatchEvent(new CustomEvent('shared-trip-data',{detail:d,cancelable:true}));}),false);
      assert.equal(await page.evaluate(()=>localStorage.getItem('zigotos-embrun-data-v1')),healthy.cache);
      assert.deepEqual(errors,[]);
      await page.reload();await page.waitForFunction(()=>typeof window.getTripData==='function');assert.equal(await page.locator('#faqList .faq-item').count()>0,true);assert.deepEqual(errors,[]);
      // Une copie locale déjà corrompue ne doit pas empêcher le démarrage ni être effacée.
      await page.evaluate(()=>{localStorage.setItem('zigotos-embrun-data-v1','{"faqs":null}');localStorage.setItem('zigotos-personal-checklist-v1','[null]');localStorage.setItem('zigotos-personal-checklist-version','2');});
      await page.reload();await page.waitForFunction(()=>typeof window.getTripData==='function');assert.equal(await page.locator('#dataWarning').isVisible(),true);assert.equal(await page.evaluate(()=>localStorage.getItem('zigotos-embrun-data-v1')),'{"faqs":null}');assert.equal(await page.evaluate(()=>localStorage.getItem('zigotos-personal-checklist-v1')),'[null]');assert.deepEqual(errors,[]);
      await context.close();
    }
    console.log('PASS accès et données : connexion automatique, rejet des structures incorrectes, cache sain conservé, caches corrompus sans plantage ; mobile et bureau, Firebase simulé.');
  } finally {await browser?.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
