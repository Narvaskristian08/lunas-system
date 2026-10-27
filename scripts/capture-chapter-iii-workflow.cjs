const fs=require('fs'),path=require('path');
const {chromium}=require('../lunas_web/node_modules/playwright');
const {capture,visit,ready,rows,inventory}=require('./capture-chapter-iii-extra.cjs');
const root=path.resolve(__dirname,'../artifacts/chapter-iii');
const password=process.env.LUNAS_CAPTURE_PASSWORD||fs.readFileSync(path.resolve(__dirname,'../lunas_backend/scripts/seed-dagupan-data.js'),'utf8').match(/DAGUPAN_SEED_PASSWORD \|\| '([^']+)'/)[1];
const folder='05_End_to_End_Incident_Workflow';
async function login(browser,slug){const context=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1});const page=await context.newPage();await page.goto('http://localhost:3000/login',{waitUntil:'networkidle'});await page.locator('[name=email]').fill(`dagupan.${slug}@lunas.test`);await page.locator('[name=password]').fill(password);await page.getByRole('button',{name:'Sign in to Command Center'}).click();await page.waitForURL(u=>u.pathname!='/login');await ready(page);return{context,page};}
async function main(){
 const browser=await chromium.launch({headless:true});
 const {context,page}=await login(browser,'barangay-poblacion-oeste');
 const initial='/validation-routing/6ae0998a9a9817fa086443af';
 const final='/validation-routing/6ae0998a9a9817fa086443b6';
 await visit(page,'Infrastructure Committee','WF_IC',initial,'Initial_Findings_Review',folder);
 const approve=page.getByRole('button',{name:'Approve Verification',exact:true});
 if(await approve.count()){await approve.click();await page.waitForLoadState('networkidle');await page.getByText('Report automatically routed').first().waitFor({timeout:1000}).catch(()=>{});await capture(page,'Infrastructure Committee','WF_IC','Initial_Approved_Routing',folder);}
 await visit(page,'Infrastructure Committee','WF_IC',final,'Final_Findings_Review',folder);
 const complete=page.getByRole('button',{name:'Finalize and Complete',exact:true});
 if(await complete.count()){
  await complete.click();await page.getByRole('dialog').waitFor();await capture(page,'Infrastructure Committee','WF_IC','Completion_Confirmation',folder);
  await page.getByRole('button',{name:'Confirm and Complete',exact:true}).click();
  await page.getByRole('heading',{name:'Incident completed',exact:true}).waitFor({timeout:45000});await capture(page,'Infrastructure Committee','WF_IC','Completion_Recorded',folder);
  await page.getByRole('button',{name:'Done',exact:true}).click();await capture(page,'Infrastructure Committee','WF_IC','Completed_Incident_History',folder);
 }
 await visit(page,'Infrastructure Committee','IC_LIVE','/notifications','Generated_Notifications','02_Infrastructure_Committee_Web');
 await context.close();
 const agency=await login(browser,'provider-city-maintenance');
 await visit(agency.page,'Agencies','WF_AG','/work-orders/intake/6ae0998a9a9817fa086443b6','Agency_Completed_Work',folder);
 await visit(agency.page,'Agencies','AG_LIVE','/notifications','Generated_Notifications','04_Agencies_Web');
 await visit(agency.page,'Agencies','AG_LIVE','/repair-personnel','Organization_Personnel','07_Other_Screens/AG_CITY');
 await agency.context.close();await browser.close();
 fs.writeFileSync(path.join(root,'workflow-metadata.json'),JSON.stringify({rows,inventory},null,2));console.log('Workflow browser captures',rows.length);
}
main().catch(e=>{fs.writeFileSync(path.join(root,'workflow-metadata.json'),JSON.stringify({rows,inventory,error:e.message.split('\n')[0]},null,2));console.error(e.message.split('\n')[0]);process.exitCode=1;});
