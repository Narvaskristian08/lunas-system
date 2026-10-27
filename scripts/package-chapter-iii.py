"""Curate actual captures, verify dimensions, and package Chapter III evidence."""
from pathlib import Path
import csv,json,shutil,hashlib,zipfile,sys
from datetime import datetime,timezone
from PIL import Image,ImageOps,ImageDraw
BASE=Path(__file__).resolve().parents[1]
ROOT=BASE/'artifacts/chapter-iii'
sys.path.insert(0,str(BASE/'.chapter3-local/capture-pdf'))
import pypdfium2 as pdfium
rows=json.loads((ROOT/'capture-metadata.json').read_text())['rows']+json.loads((ROOT/'mobile-metadata.json').read_text())
backup=BASE/'.local-backups/chapter-iii-capture-review'
backup.mkdir(parents=True,exist_ok=True)
selected=[]
for r in rows:
    name=r['filename']; source=ROOT/'screenshots'/r['folder']/name
    exclude=('export_format_print' in name or name.startswith(('IC_Incident_2_','IC_Incident_3_')) or name in ['IC_validation-routing_03.png','IC_validation-routing_04.png','IC_validation-routing_reports_03.png','IC_validation-routing_reports_04.png','IC_validation-routing_reports_05.png'])
    if exclude:
        target=backup/r['folder']/name;target.parent.mkdir(parents=True,exist_ok=True)
        if source.exists():shutil.move(str(source),str(target))
        continue
    if name=='CIT_05_Location_Map.png':
        shutil.copy2(source,backup/name)
        shutil.copy2(ROOT/'mobile-preview.png',source)
        r['notes']='Actual native map viewport captured before leaving the empty demo draft; no incident submission.'
    if name.startswith('IC_Incident_1_') or name.startswith('AG_CITY_sla_'):
        folder='05_End_to_End_Incident_Workflow' if name.startswith('IC_') else '06_AI_Security_SLA_Analytics'
        dest=ROOT/'screenshots'/folder/name
        if source.exists():shutil.move(str(source),str(dest))
        r['folder']=folder
    if name.startswith(('AG_DECORP','AG_DPWH','AG_CITY_sla_')) or name in ['CIT_10_Notifications.png','IC_notifications_01.png','AG_CITY_notifications_01.png']:
        r['seeded']='No';r['notes']+=' Existing synthetic account; empty records/notifications in this view.'
    if r['folder'].startswith('05_'):r['notes']+=' Partial workflow only: initial assignment; no connected completed lifecycle.'
    if r['folder'].startswith('01_') and r['incident']=='':
        if name.startswith(('CIT_07','CIT_08','CIT_09')):r['incident']='DAGUPAN-LOCAL-031'
    selected.append(r)
for prefix in ['IC','AG_CITY']:
    doc=pdfium.PdfDocument(ROOT/f'{prefix}_Report.pdf')
    for index in [1,2]:
        name=f'{prefix}_PDF_Page_{index+1}_Graphs.png'; folder='06_AI_Security_SLA_Analytics'
        image=doc[index].render(scale=1.5).to_pil();image.save(ROOT/'screenshots'/folder/name)
        selected.append(dict(filename=name,folder=folder,role='Infrastructure Committee' if prefix=='IC' else 'City Engineering Agency',feature='Rendered PDF graphical analysis',route=f'{prefix}_Report.pdf page {index+1}',incident='',seeded='Yes',accountRole='barangay_official' if prefix=='IC' else 'utility_provider',sequence=0,section=f'PDF page {index+1}',width=image.width,height=image.height,subsection='B. System Implementation and Functional Evaluation',caption='Graphical analysis rendered from the actual scoped LUNAS report PDF using synthetic local records.',timestamp=datetime.now(timezone.utc).isoformat(),status='Captured',notes='Actual exported A4 PDF page, not a desktop screenshot; ongoing incidents are not SLA-met outcomes.'))
headers=['Screenshot filename','Folder','System role','Feature or screen name','Actual screen or route','Demonstration incident ID','Seeded data used (Yes/No)','Seeded account role','Screenshot sequence number','Scroll position or section','Image width','Image height','Chapter III subsection','Suggested figure caption','Capture timestamp','Capture status','Notes or limitations']
keys=['filename','folder','role','feature','route','incident','seeded','accountRole','sequence','section','width','height','subsection','caption','timestamp','status','notes']
hashes={}
for i,r in enumerate(selected,1):
    file=ROOT/'screenshots'/r['folder']/r['filename'];im=Image.open(file);im.verify()
    with Image.open(file) as im:assert im.size==(r['width'],r['height']),(file,im.size)
    digest=hashlib.sha256(file.read_bytes()).hexdigest()
    assert digest not in hashes,('duplicate',file,hashes.get(digest))
    hashes[digest]=str(file);r['sequence']=i
    if 'PDF_Page' not in r['filename']:assert (r['width'],r['height']) in [(1440,900),(1080,2400)]
missing=[('Committee Staff mobile screens','Blocked: Oeste login rejected; local users query found zero utility_personnel accounts. Existing role assignments were preserved.'),('Connected complete incident lifecycle','Not captured: no accessible supported-role staff account; existing snapshots are not proof of connected approvals, findings, maintenance and closure.'),('AI hazard result, face and plate blurring','Not captured: inspected records show analysis unavailable; no supported processed face/plate fixture was established. Some synthetic evidence renders an unavailable placeholder; this is not photographic evidence or privacy output.'),('Citizen completion, submission confirmation and populated notifications','Not captured: citizen has zero resolved reports, an exhausted daily quota, and no notifications. Committee and City Engineering notification centers are also empty. No new submission or artificial notice was made.'),('Staff initial/final findings and notifications','Blocked by native login role policy; no account roles changed.'),('SLA met/breached, approaching deadline, final acceptance and corrective action','No verified representative record reached in captured selection; SLA monitor shows no matched work orders. No outcomes fabricated.'),('DECORP and DPWH populated operational views','Authenticated successfully, but current scoped lists/dashboard counts are empty.'),('Photograph attachment and description entry','Only the actual empty report-entry interface captured; no photo/description was submitted.'),('Ready for Work, priority, deadline and procurement editing confirmations','Existing agency incident controls captured; no values saved and no confirmation of workflow transition claimed.')]
with (ROOT/'SCREENSHOT_MANIFEST.csv').open('w',newline='',encoding='utf-8-sig') as f:
    writer=csv.writer(f);writer.writerow(headers)
    for r in selected:writer.writerow([r[k] for k in keys])
    for feature,reason in missing:writer.writerow(['','','',feature,'','','No','','','','','','','','','Not captured',reason])
counts={folder:sum(r['folder']==folder for r in selected) for folder in sorted(p.name for p in (ROOT/'screenshots').iterdir())}
seeded=sum(r['seeded']=='Yes' for r in selected)
guide=['# Chapter III screenshot guide','All examples are synthetic local demonstrations. Choose figures at normal readable size; do not shrink an entire desktop capture to a narrow column. No final figure numbers are assigned.']
for section,description in [('A. System Requirements and Features','Citizen reporting, committee review and agency processing are illustrated. Staff and processed face/plate examples are unavailable.'),('B. System Implementation and Functional Evaluation','Use viewport sequences and actual PDF charts. The workflow folder documents a partial initial-assignment example, not a complete lifecycle.'),('C. Non-Functional Requirements Evaluation','Login, role-specific navigation and jurisdiction labels illustrate controls. Screenshots do not establish security effectiveness, AI accuracy, reliability or performance.'),('D. System Acceptability Evaluation','Use representative screens beside the relevant Survey 2 items. Actual respondent ratings must come from the study; screenshots do not substitute for responses.')]:
    guide += ['\n## '+section,description]
    relevant=selected if section.startswith('B.') else [r for r in selected if ('Dashboard' in r['filename'] or 'Login' in r['filename'] or 'Report_Entry' in r['filename'] or 'Incident_1_01' in r['filename'] or 'PDF_Page_2' in r['filename'])]
    for r in relevant:guide.append(f"\n- [{r['filename']}](screenshots/{r['folder']}/{r['filename']}) — {r['role']}; {r['feature']}. Caption: {r['caption']} Explanation: {r['notes']} Placement: {section}.")
(ROOT/'CHAPTER_III_SCREENSHOT_GUIDE.md').write_text('\n'.join(guide),encoding='utf-8')
report=f'''# Capture report
Captured on 2026-10-27 (Asia/Shanghai) from the existing local Docker stack at localhost:3000/5000 and Android emulator-5554.

Valid curated PNGs: **{len(selected)}**. Using seeded incident/statistical data: **{seeded}**. Recaptured from previous task: **0** (the requested artifact tree had no PNGs at inspection). During this run, loading/scroll candidates were recaptured and excluded candidates preserved outside the ZIP in `.local-backups/chapter-iii-capture-review`.

Counts: {json.dumps(counts)}.

Web screenshots are 1440 × 900, browser scale 1, fullPage false. Native mobile screenshots are 1080 × 2400, the actual device resolution; their tall aspect ratio is native, not a stitched page. Four separately rendered A4 PDF chart pages are export artifacts and are explicitly identified in the manifest. PDFs are also included.

All curated PNGs passed decoding, exact dimension checks and SHA-256 duplicate checks. Representative incident, dashboard, map and citizen screens were visually reviewed; this is not a claim of exhaustive visual or workflow acceptance. Existing text/interface defects are retained. Normal UI proportions are preserved; keep images large enough in the paper to read.

## Environment and implementation inspection
`lunas_web` is Next.js 16, `lunas_mobile` is Flutter/Android, `lunas_backend` is Node/Mongoose/MongoDB, and `lunas_ai` is the AI service. Existing Docker web/backend/Mongo/AI services were already running; no rebuild or service configuration change was needed. MinIO is local evidence storage. Browser tooling was already installed. Docker/ADB/browser execution required sandbox escalation and was approved automatically. Native automation uses UI Automator inspection and ADB taps/screenshots; no responsive browser is labeled mobile.

Existing fixture definitions and local account documentation were inspected. Existing synthetic committee and all four provider accounts authenticated through normal web login; citizen was already authenticated in the Docker-targeted native app. Native Citizen profile confirmed Local Citizen. No production connection, seeder, migration, account modification or incident transition was performed. No existing screenshot automation was found in tracked scripts; the old functional-screenshots-obsolete location contained no available screenshot files. Existing historical README verification claims were not treated as current proof.

## Limitations and uncaptured requirements
'''
report+='\n'.join(f'- **{feature}:** {reason}' for feature,reason in missing)
report+='''

Existing seeded committee/agency records include illustrative snapshots; history does not certify a connected government workflow. Do not interpret zero dashboard values as fabricated data. The citizen timeline example has one genuine stored event. No unsupported states, face/plate privacy results or successful procurement/repair outcomes were invented. Staff workflow, processed privacy fixtures, meaningful completed cases and live SLA outcomes remain next priorities in a separately authorized fixture/acceptance task.

## Reproduction
Run `node scripts/capture-chapter-iii.cjs` with the existing local Docker services reachable, installed Playwright browser and the documented local fixture credentials (optional environment override `LUNAS_CAPTURE_PASSWORD`). The password is read internally and never written to artifacts. The web script navigates normal login and scoped routes, waits for skeletons/fonts/images, captures viewport sections with approximately 14% overlap, and generates scoped PDFs. Native helper: `node scripts/capture-chapter-iii-mobile.cjs inspect`, then `tap`, `back`, `swipe` or `capture <folder> <name> <role> [Yes/No]`; inspect after each action because Flutter animations and keyboard state change coordinates. Do not run the helper's `password` action while screen recording.

The isolated PDF renderer was installed under `.chapter3-local/capture-pdf`; `python scripts/package-chapter-iii.py` curates metadata, renders PDF chart pages, validates files, writes documentation and creates the ZIP. Packaging expects the original raw capture metadata; preserve raw captures before rerunning. No application logic, UI, schema, permissions, dependencies or business workflow was modified. Changes are isolated scripts, generated artifacts and README documentation.
'''
(ROOT/'CAPTURE_REPORT.md').write_text(report,encoding='utf-8')
thumbs=[]
for r in selected:
    with Image.open(ROOT/'screenshots'/r['folder']/r['filename']) as im:
        tile=Image.new('RGB',(360,260),'white');thumb=ImageOps.contain(im.convert('RGB'),(350,225));tile.paste(thumb,((360-thumb.width)//2,0));ImageDraw.Draw(tile).text((4,230),r['filename'][:48],fill='black');thumbs.append(tile)
sheet=Image.new('RGB',(1440,260*((len(thumbs)+3)//4)),'#dddddd')
for i,t in enumerate(thumbs):sheet.paste(t,((i%4)*360,(i//4)*260))
sheet.save(backup/'QA-contact-sheet.jpg')
archive=ROOT/'LUNAS_Chapter_III_Screenshots.zip'
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as z:
    for r in selected:
        file=ROOT/'screenshots'/r['folder']/r['filename'];z.write(file,file.relative_to(ROOT))
    for name in ['SCREENSHOT_MANIFEST.csv','CHAPTER_III_SCREENSHOT_GUIDE.md','CAPTURE_REPORT.md','IC_Report.pdf','AG_CITY_Report.pdf']:z.write(ROOT/name,name)
with zipfile.ZipFile(archive) as z:assert z.testzip() is None;assert len(z.namelist())==len(selected)+5
print(json.dumps(dict(valid=len(selected),seeded=seeded,counts=counts,zip=str(archive)),indent=2))
