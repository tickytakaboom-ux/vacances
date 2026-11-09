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
    for(const width of [320,390,1280]){
      const context=await browser.newContext({viewport:{width,height:900},colorScheme:'dark'});
      await context.route('**/*',route=>route.request().url().startsWith(origin+'/')?route.continue():route.abort());
      await context.addInitScript(()=>localStorage.setItem('zigotos-first-name-v1','Test thème'));
      const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));await page.goto(origin);await page.waitForFunction(()=>!!window.getTripData);
      assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');assert.equal(await page.locator('[data-theme-toggle]').getAttribute('aria-pressed'),'true');
      const before=await page.evaluate(()=>window.getTripData());
      const controls=await page.locator('.topbar :is(.brand,.theme-toggle,.user-chip,.edit-button)').evaluateAll(elements=>elements.map(el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom};}));
      assert.equal(controls.every(r=>r.left>=0&&r.right<=width),true,'en-tête sans débordement à '+width);
      assert.equal(controls.every((a,i)=>controls.every((b,j)=>i===j||a.right<=b.left||b.right<=a.left||a.bottom<=b.top||b.bottom<=a.top)),true,'commandes sans chevauchement');
      const contrasts=await page.evaluate(()=>{
        const lum=color=>{const channels=color.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});return channels[0]*.2126+channels[1]*.7152+channels[2]*.0722;};
        return ['body','.total-card','.stat-card.accent','.caution-card','.people-control select','.private-note','.weather-card'].map(selector=>{const s=getComputedStyle(document.querySelector(selector));const a=lum(s.color),b=lum(s.backgroundColor);return {selector,ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};});
      });
      for(const sample of contrasts)assert.ok(sample.ratio>=4.5,sample.selector+' contraste '+sample.ratio);
      await page.locator('[data-theme-toggle]').click();assert.equal(await page.locator('html').getAttribute('data-theme'),'light');await page.reload();await page.waitForFunction(()=>!!window.getTripData);assert.equal(await page.locator('html').getAttribute('data-theme'),'light');
      await page.locator('[data-theme-toggle]').focus();await page.keyboard.press('Space');assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');assert.deepEqual(await page.evaluate(()=>window.getTripData()),before);
      await page.screenshot({path:'.preview/theme-dark-header-'+width+'.png'});
      const css=await page.addStyleTag({content:'.section-nav,.mobile-nav,.back-to-top,.toast{display:none!important}'});
      for(const section of ['programme','budget','checklist'])await page.locator('#'+section).screenshot({path:'.preview/theme-dark-'+section+'-'+width+'.png'});
      await css.evaluate(el=>el.remove());
      for(const file of ['confidentialite.html','mentions-legales.html','regles-utilisation.html']){await page.goto(origin+'/'+file);assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');assert.equal(await page.locator('[data-theme-toggle]').count(),1);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);}
      assert.deepEqual(errors,[]);await context.close();
    }
    console.log('PASS thème : système, bascule clavier, persistance, pages d’information, contrastes >=4.5, en-tête à 320/390/1280 px et données intactes.');
  } finally {server.closeAllConnections();await browser?.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
