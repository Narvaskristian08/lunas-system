/* Read-only capture of the synthetic report actually submitted from Android. */
const fs=require('fs'),path=require('path');
const {chromium}=require('../lunas_web/node_modules/playwright');
const {visit,ready,rows,inventory}=require('./capture-chapter-iii-extra.cjs');
const root=path.resolve(__dirname,'../artifacts/chapter-iii');
const pw=process.env.LUNAS_CAPTURE_PASSWORD||fs.readFileSync(path.resolve(__dirname,'../lunas_backend/scripts/seed-dagupan-data.js'),'utf8').match(/DAGUPAN_SEED_PASSWORD \|\| '([^']+)'/)[1];
async function main(){
 const browser=await chromium.launch({headless:true});const context=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1});const page=await context.newPage();
 await page.goto('http://localhost:3000/login',{waitUntil:'networkidle'});await page.locator('[name=email]').fill('dagupan.barangay-poblacion-oeste@lunas.test');await page.locator('[name=password]').fill(pw);await page.getByRole('button',{name:'Sign in to Command Center'}).click();await page.waitForURL(u=>u.pathname!='/login');await ready(page);
 await visit(page,'Infrastructure Committee','CIT_LIVE','/validation-routing/6ae1184ec5597e7577ea5391','Native_Submission_Received','05_End_to_End_Incident_Workflow');
 for(const r of rows){r.incident='LUNAS-202610-000058';r.seeded='No';r.notes='New synthetic report actually submitted through native citizen UI on 2026-10-28. Existing synthetic committee account; no validation decision performed for this report. Test-card evidence is not a real incident photograph.';}
 await context.close();await browser.close();fs.writeFileSync(path.join(root,'submission-metadata.json'),JSON.stringify({rows,inventory},null,2));console.log('Actual submission web capture PNGs',rows.length);
}
main().catch(e=>{console.error(e.message.split('\n')[0]);process.exitCode=1;});
