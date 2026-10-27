/* Read-only supplementary browser captures through existing authentication. */
const fs=require('fs'),path=require('path');
const {chromium}=require('../lunas_web/node_modules/playwright');
const root=path.resolve(__dirname,'../artifacts/chapter-iii');
const password=process.env.LUNAS_CAPTURE_PASSWORD||fs.readFileSync(path.resolve(__dirname,'../lunas_backend/scripts/seed-dagupan-data.js'),'utf8').match(/DAGUPAN_SEED_PASSWORD \|\| '([^']+)'/)[1];
const saved=process.argv.includes('--menus-only')&&fs.existsSync(path.join(root,'extra-metadata.json'))?JSON.parse(fs.readFileSync(path.join(root,'extra-metadata.json'))):{rows:[],inventory:[]};
const rows=saved.rows,inventory=saved.inventory.filter(i=>i.screen!=='Authentication');
async function ready(page){await page.locator('.skeleton, .animate-spin, .animate-pulse').first().waitFor({state:'hidden',timeout:45000});await page.evaluate(()=>document.fonts.ready);}
async function capture(page,role,prefix,label,folder=`07_Other_Screens/${prefix}`,seeded='Yes'){
 await ready(page);
 const dir=path.join(root,'screenshots',folder);fs.mkdirSync(dir,{recursive:true});
 const scroller=await page.evaluateHandle(()=>[document.scrollingElement,...document.querySelectorAll('*')].filter(e=>e&&e.scrollHeight>e.clientHeight+100&&e.clientHeight>300&&['auto','scroll'].includes(getComputedStyle(e).overflowY)).sort((a,b)=>b.clientHeight-a.clientHeight)[0]||document.scrollingElement);
 await scroller.evaluate(e=>e.scrollTo({top:0,behavior:'instant'}));
 const files=[];
 for(let n=1;n<=16;n++){
  await page.evaluate(()=>new Promise(requestAnimationFrame));
  const name=`${prefix}_${label}_${String(n).padStart(2,'0')}.png`;files.push(name);
  await page.screenshot({path:path.join(dir,name),fullPage:false,animations:'disabled'});
  rows.push({filename:name,folder,role,feature:label.replaceAll('_',' '),route:new URL(page.url()).pathname,incident:label.includes('Fixture')?label:'',seeded,accountRole:role==='Infrastructure Committee'?'barangay_official':role==='Agencies'?'utility_provider':'Public',sequence:rows.length+1,section:await scroller.evaluate(e=>e.scrollTop),width:1440,height:900,subsection:folder.startsWith('07_')?'B. Other System Screens':'A. System Requirements and Features',caption:`LUNAS ${label.replaceAll('_',' ')} interface${seeded==='Yes'?' for a synthetic local account':''}.`,timestamp:new Date().toISOString(),status:'Captured',notes:'Actual local interface. No values saved; sensitive reset/activation tokens were not supplied.'});
  if(!await scroller.evaluate(async e=>{const p=e.scrollTop;e.scrollTo({top:Math.min(p+Math.round(e.clientHeight*.86),e.scrollHeight-e.clientHeight),behavior:'instant'});await new Promise(requestAnimationFrame);return e.scrollTop>p+20;}))break;
 }
 return files;
}
async function visit(page,role,prefix,route,label,folder,seeded='Yes'){
 try{
  await page.goto('http://localhost:3000'+route,{waitUntil:'networkidle',timeout:45000});await ready(page);
  const actual=new URL(page.url()).pathname;
  if(actual==='/unauthorized'&&route!=='/unauthorized'){inventory.push({role,platform:'Web',screen:label,route,implemented:'Yes',captured:'No',files:[],seeded:'No',reason:'Existing role permission redirects to /unauthorized.'});return;}
  const files=await capture(page,role,prefix,label,folder,seeded);
  inventory.push({role,platform:'Web',screen:label,route,implemented:'Yes',captured:'Yes',files,seeded,reason:actual!==route.split('?')[0]?`Existing redirect to ${actual}.`:''});
 }catch(e){inventory.push({role,platform:'Web',screen:label,route,implemented:'Yes',captured:'No',files:[],seeded:'No',reason:e.message.split('\n')[0]});}
}
async function main(){
 const browser=await chromium.launch({headless:true});
 const publicContext=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1});const pub=await publicContext.newPage();
 if(!process.argv.includes('--menus-only'))for(const [route,label] of [['/forgot-password','Forgot_Password'],['/reset-password','Reset_Password_No_Token'],['/activate-account','Activation_No_Token'],['/verify-account','Verify_Account'],['/session-expired','Session_Expired'],['/privacy','Privacy_Policy'],['/terms','Terms_Conditions'],['/maintenance','Maintenance'],['/unauthorized','Authorization_Message']])await visit(pub,'Shared public','WEB_PUBLIC',route,label,undefined,'No');
 await publicContext.close();
 for(const [slug,role,prefix] of [['barangay-poblacion-oeste','Infrastructure Committee','IC'],['provider-city-maintenance','Agencies','AG_CITY'],['provider-decorp','Agencies','AG_DECORP'],['provider-dcwd','Agencies','AG_PAMANA'],['provider-dpwh','Agencies','AG_DPWH']]){
  if(process.argv.includes('--menus-only')&&!['IC','AG_CITY'].includes(prefix))continue;
  const context=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1});const page=await context.newPage();
  try{
   await page.goto('http://localhost:3000/login',{waitUntil:'networkidle'});await page.locator('[name=email]').fill(`dagupan.${slug}@lunas.test`);await page.locator('[name=password]').fill(password);await page.getByRole('button',{name:'Sign in to Command Center'}).click();await page.waitForURL(u=>u.pathname!='/login');await ready(page);
   if(!process.argv.includes('--menus-only'))for(const [route,label] of [['/profile','Profile'],['/profile/edit','Edit_Profile'],['/profile/change-password','Change_Password'],['/recovery-email','Recovery_Email'],['/help','Help_Support']])await visit(page,role,prefix,route,label);
   if(prefix==='IC'&&!process.argv.includes('--menus-only')){
    for(const [route,label] of [['/validation-routing/tanods','Committee_Staff_Accounts'],['/validation-routing/exceptions','Agency_Routing_Exceptions']])await visit(page,role,prefix,route,label);
   }
   if(prefix==='IC'||prefix==='AG_CITY'){
    await page.goto('http://localhost:3000/dashboard',{waitUntil:'networkidle'});await ready(page);
    const menu=page.locator('button[aria-haspopup="menu"]').first();
    if(await menu.count()){
     await menu.click();await capture(page,role,prefix,'Account_Menu');
     const signOut=page.getByRole('menuitem',{name:/Sign Out/i});
     if(await signOut.count()){await signOut.click();await capture(page,role,prefix,'Logout_Confirmation');}
    }
   }
  }catch(e){inventory.push({role,platform:'Web',screen:'Authentication',route:'/login',implemented:'Yes',captured:'No',files:[],seeded:'No',reason:e.message.split('\n')[0]});}
  await context.close();
 }
 await browser.close();fs.writeFileSync(path.join(root,'extra-metadata.json'),JSON.stringify({rows,inventory},null,2));console.log('Supplementary web PNGs',rows.length,'uncaptured',inventory.filter(i=>i.captured==='No').length);
}
if(require.main===module)main().catch(e=>{console.error(e.message);process.exitCode=1});
module.exports={capture,visit,ready,rows,inventory};
