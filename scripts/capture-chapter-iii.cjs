const fs = require('fs');
const path = require('path');
const { chromium } = require('../lunas_web/node_modules/playwright');
const root = path.resolve(__dirname, '../artifacts/chapter-iii');
const folders = ['01_Citizen_Mobile','02_Infrastructure_Committee_Web','03_Committee_Staff_Mobile','04_Agencies_Web','05_End_to_End_Incident_Workflow','06_AI_Security_SLA_Analytics'];
for (const f of folders) fs.mkdirSync(path.join(root,'screenshots',f),{recursive:true});
const password = process.env.LUNAS_CAPTURE_PASSWORD || fs.readFileSync(path.resolve(__dirname,'../lunas_backend/scripts/seed-dagupan-data.js'),'utf8').match(/DAGUPAN_SEED_PASSWORD \|\| '([^']+)'/)[1];
const rows = []; const failures = [];
async function capture(page,folder,name,role,seeded=true,incident='') {
  await page.locator('.skeleton, .animate-pulse').first().waitFor({state:'hidden',timeout:45000});
  await page.evaluate(() => document.fonts.ready);
  await page.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.complete?null:new Promise(r=>{i.onload=r;i.onerror=r;setTimeout(r,3000)}))));
  const file = `${name}.png`;
  await page.screenshot({path:path.join(root,'screenshots',folder,file),fullPage:false,animations:'disabled'});
  rows.push({filename:file,folder,role,feature:name.replaceAll('_',' '),route:new URL(page.url()).pathname,incident,seeded:seeded?'Yes':'No',accountRole:role,sequence:rows.length+1,section:await page.evaluate(()=>Math.round(window.scrollY)),width:1440,height:900,subsection:'B. System Implementation and Functional Evaluation',caption:`LUNAS ${name.replaceAll('_',' ')}${seeded?' using synthetic local demonstration data':''}.`,timestamp:new Date().toISOString(),status:'Captured',notes:'Actual local application; viewport capture. Synthetic records are not government repair outcomes.'});
}
async function sections(page,folder,name,role,incident='') {
  const scroller = await page.evaluateHandle(()=>[document.scrollingElement,...document.querySelectorAll('*')].filter(e=>e&&e.scrollHeight>e.clientHeight+100&&e.clientHeight>300&&['auto','scroll'].includes(getComputedStyle(e).overflowY)).sort((a,b)=>b.clientHeight-a.clientHeight)[0]||document.scrollingElement);
  await scroller.evaluate(e=>e.scrollTop=0);
  for(let n=1;n<=6;n++) {
    await capture(page,folder,`${name}_${String(n).padStart(2,'0')}`,role,true,incident);
    const moved=await scroller.evaluate(async e=>{const prev=e.scrollTop;e.scrollTo({top:Math.min(e.scrollTop+Math.round(e.clientHeight*.86),e.scrollHeight-e.clientHeight),behavior:'instant'});await new Promise(requestAnimationFrame);return e.scrollTop>prev+20});
    if(!moved)break;
  }
}
async function go(page,route) {
 await page.goto('http://localhost:3000'+route,{waitUntil:'networkidle',timeout:45000});
 await page.locator('body').waitFor();
 await page.locator('.skeleton, .animate-pulse').first().waitFor({state:'hidden',timeout:45000});
}
async function main(){
 const browser=await chromium.launch({headless:true});
 for(const [slug,role,folder,prefix] of [['barangay-poblacion-oeste','Infrastructure Committee',folders[1],'IC'],['provider-city-maintenance','City Engineering Agency',folders[3],'AG_CITY'],['provider-decorp','DECORP Agency',folders[3],'AG_DECORP'],['provider-dcwd','PAMANA Agency',folders[3],'AG_PAMANA'],['provider-dpwh','DPWH Agency',folders[3],'AG_DPWH']]) {
 const context=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1});const page=await context.newPage();
 try {
 await go(page,'/login');if(prefix==='IC')await capture(page,folder,'IC_01_Login',role,false);
 await page.locator('input[name=email]').fill(`dagupan.${slug}@lunas.test`);await page.locator('input[name=password]').fill(password);
 await page.getByRole('button',{name:'Sign in to Command Center'}).click();
 await page.waitForURL(u=>!u.pathname.includes('/login'),{timeout:30000});
 await page.waitForLoadState('networkidle');
 await sections(page,folder,`${prefix}_Dashboard`,role);
 const routes=prefix==='IC'?['/validation-routing','/validation-routing/reports','/validation-routing/reports/export?format=print','/notifications']:prefix==='AG_CITY'?['/work-orders','/work-orders/reports','/work-orders/reports/export?format=print','/notifications','/sla']:['/work-orders'];
 for(const route of routes)try{await go(page,route);await sections(page,route.includes('export?')?folders[5]:folder,`${prefix}_${route.split('/').filter(Boolean).join('_').replaceAll('?','_').replaceAll('=','_')}`,role);
 if(route.includes('export?')) await page.pdf({path:path.join(root,`${prefix}_Report.pdf`),format:'A4',printBackground:true});
 if(route==='/validation-routing'||route==='/work-orders'){
 const links=await page.locator('a[href]').evaluateAll(as=>[...new Set(as.map(a=>a.getAttribute('href')).filter(h=>/^\/(validation-routing|work-orders\/intake)\/[a-f0-9]{24}/.test(h)))]);
 console.log(prefix,'incident links',links.length);
 for(const [i,link] of links.slice(0,prefix==='IC'?3:1).entries()){await go(page,link);await sections(page,folder,`${prefix}_Incident_${i+1}`,role,link.split('/').pop());}
 }
 }catch(e){failures.push({role,route,reason:e.message.split('\n')[0]});}
 }catch(e){failures.push({role,route:'login',reason:e.message.split('\n')[0]});}
 await context.close();
 }
 await browser.close();fs.writeFileSync(path.join(root,'capture-metadata.json'),JSON.stringify({rows,failures},null,2));console.log('Captured',rows.length,'Failures',JSON.stringify(failures));
}
main().catch(e=>{console.error(e.message);process.exitCode=1});
