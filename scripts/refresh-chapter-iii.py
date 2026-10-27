"""Preserve the original selection and append verified expanded captures."""
import csv,hashlib,json,re,shutil,zipfile
from pathlib import Path
from PIL import Image,ImageOps,ImageDraw
BASE=Path(__file__).resolve().parents[1]; ROOT=BASE/'artifacts/chapter-iii'; BACKUP=BASE/'.local-backups/chapter-iii-before-expansion'
BACKUP.mkdir(parents=True,exist_ok=True)
for name in ['SCREENSHOT_MANIFEST.csv','CHAPTER_III_SCREENSHOT_GUIDE.md','CAPTURE_REPORT.md','LUNAS_Chapter_III_Screenshots.zip']:
    if not (BACKUP/name).exists():shutil.copy2(ROOT/name,BACKUP/name)
with (BACKUP/'SCREENSHOT_MANIFEST.csv').open(encoding='utf-8-sig',newline='') as f:
    reader=csv.DictReader(f);HEADERS=reader.fieldnames;baseline=list(reader)
KEYS=['filename','folder','role','feature','route','incident','seeded','accountRole','sequence','section','width','height','subsection','caption','timestamp','status','notes']
original=[dict(zip(KEYS,[r.get(h,'') for h in HEADERS])) for r in baseline if r['Capture status']=='Captured']
entries={(r['folder'],r['filename']):r for r in original}
with zipfile.ZipFile(BACKUP/'LUNAS_Chapter_III_Screenshots.zip') as baseline_zip:
    original_hashes={k:hashlib.sha256(baseline_zip.read('screenshots/'+k[0]+'/'+k[1])).hexdigest() for k in entries}
inventories=[]
for name in ['extra-metadata.json','workflow-metadata.json','submission-metadata.json']:
    if (ROOT/name).exists():
        data=json.loads((ROOT/name).read_text());inventories+=data.get('inventory',[])
        for row in data['rows']:entries[(row['folder'],row['filename'])]=row
for row in json.loads((ROOT/'mobile-metadata.json').read_text()):
    key=(row['folder'],row['filename'])
    if key not in original_hashes:entries[key]=row
staff_role='utility_personnel'
for r in entries.values():
    if r['role'] in ['City Engineering Agency','DECORP Agency','PAMANA Agency','DPWH Agency']:r['role']='Agencies'
    if r['role']=='Agencies':r['accountRole']='utility_provider'
    elif r['role']=='Infrastructure Committee':r['accountRole']='barangay_official'
    elif r['role']=='Citizen':r['accountRole']='citizen' if r['seeded']=='Yes' else 'Public / synthetic citizen form'
    if r['folder'].startswith('03_') or 'Committee_Staff' in r['folder']:
        r['role']='Committee Staff';r['accountRole']=staff_role
        r['notes']='Actual native Committee Staff workspace on emulator-5554. New synthetic local account and two dedicated fixture reports; test-card evidence is not a real field photograph. No repair-personnel workflow or approval authority is granted.'
        if any(s in r['filename'] for s in ['Initial','Assigned_Inspections']):r['incident']='CHAPTER3-STAFF-INITIAL'
        if 'Final' in r['filename']:r['incident']='CHAPTER3-STAFF-FINAL'
    if r['folder'].startswith('07_'):r['subsection']='B. Other System Screens'
    else:r['subsection']='A. System Requirements and Features'
    if 'Login' in r['filename'] or r['filename']=='CIT_11_Profile.png':r['subsection']='B. Other System Screens'
    if 'Privacy_Policy' in r['filename'] or 'Terms_Conditions' in r['filename']:
        r['notes']+=' Current application legal content is a draft/template, not an approved institutional policy.'
    if r['filename'].startswith('WF_'):
        if '6ae0998a9a9817fa086443b6' in r['route']:r['incident']='CHAPTER3-STAFF-FINAL'
        elif '6ae0998a9a9817fa086443af' in r['route']:r['incident']='CHAPTER3-STAFF-INITIAL'
        r['notes']+=' New synthetic fixture. Model-seeded initial report; subsequent assignment/review/agency stages used scoped existing APIs; initial and final submissions used native UI; final acceptance used committee UI. No physical inspection, procurement or repair is claimed.'
    if r['filename'].startswith('CIT_') and '07_' in r['folder']:r['role']='Citizen';r['accountRole']='citizen' if r['seeded']=='Yes' else 'Public'
    if r['filename'].startswith('MOB_'):r['role']='Shared mobile';r['accountRole']='Public'
    if r['filename'] in ['CIT_Report_Submitted.png','CIT_New_Submission_Details.png','CIT_Report_Review_01.png','CIT_Report_Review_02.png','CIT_Report_Final_Check.png']:
        r['incident']='LUNAS-202610-000058';r['notes']='New synthetic report created through the existing native citizen submission workflow on 2026-10-28. Test-card evidence is not a real incident photograph; duplicate-candidate warning remains advisory. Not a pre-seeded incident.'
selected=[];seen={};excluded=[]
for key,r in entries.items():
    source=ROOT/'screenshots'/key[0]/key[1]
    file=source
    previous_backup=BASE/'.local-backups/chapter-iii-capture-review/expanded-duplicates'/key[0]/key[1]
    if not file.exists() and previous_backup.exists():file=previous_backup
    if not file.exists():raise RuntimeError(f'Missing image: {file}')
    # Source-confirmed aliases are not separate account screens. Keep their candidates outside the curated set.
    alias_target=None
    if '_Recovery_Email_' in r['filename']:
        prefix=r['filename'].split('_Recovery_Email_')[0];folder='02_Infrastructure_Committee_Web' if prefix=='IC' else '04_Agencies_Web';alias_target=f'screenshots/{folder}/{prefix}_Dashboard_01.png'
    if r['filename']=='IC_Agency_Routing_Exceptions_01.png':
        alias_target='screenshots/02_Infrastructure_Committee_Web/IC_validation-routing_reports_01.png'
    if alias_target and key not in original_hashes:
        previous_backup.parent.mkdir(parents=True,exist_ok=True)
        if file!=previous_backup:shutil.move(file,previous_backup)
        excluded.append((r,alias_target));continue
    # Fixed modal content needs one screenshot; scrolling its background adds no evidence.
    repeated_modal=any(label in r['filename'] for label in ['Completion_Confirmation_','Completion_Recorded_','Account_Menu_','Logout_Confirmation_']) and re.search(r'_0[2-9]\.png$',r['filename'])
    if repeated_modal and key not in original_hashes:
        first=re.sub(r'_0[2-9]\.png$','_01.png',r['filename']);dest=previous_backup;dest.parent.mkdir(parents=True,exist_ok=True)
        if file!=dest:shutil.move(file,dest)
        excluded.append((r,'screenshots/'+key[0]+'/'+first));continue
    with Image.open(file) as im:
        im.verify()
    with Image.open(file) as im:
        dims=im.size
        if 'PDF_Page' not in r['filename']:assert dims in [(1440,900),(1080,2400)],(file,dims)
        # Ignore clock/system status and compare actual application pixels.
        content=im.crop((0,70,im.width,im.height-30)) if dims==(1080,2400) else im
        digest=hashlib.sha256(content.tobytes()).hexdigest()
    if digest in seen and key not in original_hashes and r['filename']!='CS_01_Login.png':
        dest=BASE/'.local-backups/chapter-iii-capture-review/expanded-duplicates'/key[0]/key[1]
        dest.parent.mkdir(parents=True,exist_ok=True)
        if file!=dest:shutil.move(file,dest)
        excluded.append((r,seen[digest]));continue
    if file!=source:source.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(file,source)
    seen[digest]=str(file.relative_to(ROOT));r['width'],r['height']=dims;r['sequence']=len(selected)+1;selected.append(r)
for key,digest in original_hashes.items():assert hashlib.sha256((ROOT/'screenshots'/key[0]/key[1]).read_bytes()).hexdigest()==digest,'Original capture changed'
for r,match in excluded:
    inventories.append(dict(role=r['role'],platform='Android' if r['height']==2400 else 'Web',screen=r['feature'],route=r['route'],implemented='Yes (or compatibility alias)',captured='Target documented / repeated candidate excluded',files=[match],seeded=r['seeded'],reason='Repeated modal, identical viewport or source-confirmed alias; candidate preserved outside curated archive. Recovery-email redirects to dashboard; committee/agency edit-profile redirects to profile. Exceptions candidate displayed a page-load error; source redirects to reports, documented separately.'))
excluded_targets={r['filename']:match for r,match in excluded}
for item in inventories:
    if any(file in excluded_targets for file in item.get('files',[])):
        item['files']=list(dict.fromkeys(excluded_targets.get(file,file) for file in item['files']))
        item['reason']+=' Original repeated/alias candidate excluded; see retained target file.'
    if item.get('screen')=='Agency_Routing_Exceptions':
        item['implemented']='Compatibility redirect to reports';item['captured']='Target report screen captured'
        item['reason']='Initial candidate showed a page-load error. Source redirects to /validation-routing/reports; no distinct exceptions page is implemented.'
gaps=[
 ('All four roles','FAQ / About / Contact / standalone settings / account preferences / Switch Account','Not found as separate implemented routes or menu screens. Web Help and Support and legal pages were captured; native profile/account and logout interfaces were captured. No direct account-switch feature was found.'),
 ('Citizen / Committee Staff','Native terms, privacy, FAQ and help','No native routes or menu links found in current router/profile/auth source. Shared web legal pages are documented without calling them native screens.'),
 ('Shared mobile','OTP verification / reset-code / token-based reset completion','Implemented conditional screens, but require a valid registration/reset challenge. No registration, recovery delivery, code or token was fabricated, exposed or bypassed. Empty recovery and password forms are captured.'),
 ('Citizen','Reporting appeal','Implemented conditional reporting-restriction flow; current synthetic citizen is not under the separate false-report restriction, so its appeal entry point is not shown. Daily quota is a different restriction.'),
 ('Citizen','One all-UI six-stage lifecycle for the newly submitted record','The actual native submission LUNAS-202610-000058 succeeded on 2026-10-28 and was received in the matching committee view. It remains submitted. The separate completed CHAPTER3-STAFF-FINAL case began as a model-seeded report and must not be described as this new UI submission.'),
 ('Committee Staff','Separate task timeline / submitted findings detail','Current native inspection UI offers Initial, Final and Sent tabs; submitted cards have no detail action. Scoped web incident histories document actual transitions; no dedicated native timeline screen exists.'),
 ('Committee Staff','Internal incident map','Form exposes location and Open in Google Maps (external application). No embedded staff map screen is implemented. Citizen native map is separately captured.'),
 ('All relevant roles','Processed face/plate blurring and positive hazard recognition','The new actual submission shows Analysis Completed / No Hazard Suggested / 0% confidence in the committee UI. No verified face/plate photographic fixture or positive hazard example was established. Labeled synthetic evidence cards prove display/upload/advisory handling, never privacy masking or AI accuracy.'),
 ('Agencies','Legacy work-order detail and SLA work-order records','Existing operational fixtures are agency incident snapshots; no matching accessible work-order record was established for legacy /work-orders/[id] or /sla/[id]. Empty SLA monitor retained as actual state.'),
 ('Agencies','Deadline breach / overdue and corrective-action outcome','No verified representative breached/corrective case was captured. Synthetic final case has the actual recorded agency target and outcome; it does not establish cron escalation or real repair timeliness.'),
 ('All','External email, push and production behavior','Local screenshot task; no production mutation or external delivery verification.'),
]
for role,screen,reason in gaps:inventories.append(dict(role=role,platform='See description',screen=screen,route='Conditional or absent; see source-route inventory',implemented='Conditional / absent as stated',captured='No',files=[],seeded='No',reason=reason))
with (ROOT/'SCREENSHOT_MANIFEST.csv').open('w',encoding='utf-8-sig',newline='') as f:
    w=csv.writer(f);w.writerow(HEADERS)
    for r in selected:w.writerow([r[k] for k in KEYS])
    for role,screen,reason in gaps:w.writerow(['','',role,screen,'','','No','','','','','','','','','Not captured',reason])
def esc(s):return str(s).replace('|','/').replace('\n',' ')
inventory=['# Complete screen inventory','Inspected current source routes, role navigation and actual local UI on 2026-10-27 (Asia/Shanghai). Four principal roles: Citizen, Infrastructure Committee, Committee Staff, Agencies. Internal compatibility identifiers and paths do not create extra operational roles. Administrator-only governance routes are listed as outside this four-role capture scope.','\n## Captured screen states','Every row below identifies an actual PNG. Long screens use separate native/desktop viewports.','| Role | Platform | Screen | Actual route / navigation | Implemented | Capture | Screenshot | Seeded data | Limitation |','|---|---|---|---|---|---|---|---|---|']
for r in selected:inventory.append('| '+' | '.join(esc(v) for v in [r['role'],'Android' if int(r['height'])==2400 else 'PDF' if 'PDF_Page' in r['filename'] else 'Web',r['feature'],r['route'],'Yes','Succeeded',f"[screenshots/{r['folder']}/{r['filename']}](screenshots/{r['folder']}/{r['filename']})",r['seeded'],r['notes']])+' |')
inventory+=['\n## Navigation and conditional-state findings','| Role | Platform | Screen | Requested route / navigation | Implemented | Capture | Files | Seeded | Reason |','|---|---|---|---|---|---|---|---|---|']
for i in inventories:inventory.append('| '+' | '.join(esc(v) for v in [i['role'],i['platform'],i['screen'],i['route'],i['implemented'],i['captured'],', '.join(i['files']),i['seeded'],i['reason']])+' |')
inventory+=['\n## Web source-route coverage','Source discovery includes aliases and conditional detail routes. A route file alone is not proof of a distinct reachable screen.','| Source route | Principal roles / scope | Coverage or exact limitation |','|---|---|---|']
for file in sorted((BASE/'lunas_web/src/app').rglob('page.tsx')):
    rel=file.parent.relative_to(BASE/'lunas_web/src/app');route='/'+ '/'.join(p for p in rel.parts if not p.startswith('('));source=file.read_text(encoding='utf-8');perm=re.search(r'requirePermission\("([^"]+)"',source)
    roles='Shared public' if '(auth)' in rel.parts or '(public)' in rel.parts else 'Infrastructure Committee / Agencies'
    if '/admin' in route:roles='Administrator governance; outside principal operational scope'
    if perm and perm[1] in ['reports.view','reports.validate']:roles='Infrastructure Committee'
    if perm and perm[1] in ['work_orders.manage','work_orders.view','sla.view','personnel.manage']:roles='Agencies'
    covered=[r['filename'] for r in selected if r['route'].split('?')[0]==route]
    requested=[i for i in inventories if i.get('route','').split('?')[0]==route and i.get('captured','').startswith('Yes')]
    alias=re.search(r'redirect\(["\x27]([^"\x27]+)',source)
    if covered:reason='Captured: '+', '.join(covered)
    elif requested:reason='Captured via existing route redirect/modal: '+', '.join(requested[0]['files'])
    elif alias:reason='Existing redirect/compatibility alias to '+alias[1]+'; target documented separately.'
    elif '/admin' in route:reason='Not captured: admin governance is outside the four requested principal roles.'
    elif '[' in route:reason='Conditional record/context route. Concrete incident details captured where available; unmatched legacy work-order, SLA or support context was not invented.'
    elif route=='/':reason='Entry redirect; authenticated dashboard and public sign-in captured.'
    else:reason='See role/context findings; source exists but no additional distinct reachable screen established.'
    inventory.append('| '+ ' | '.join(map(esc,[route,roles,reason]))+' |')
native_map={
 'app_splash_screen.dart':('', 'Transient loader; deliberately excluded from academic figures.'),
 'citizen_login_screen.dart':('CIT_01_Login','Shared login; also CS_01_Login.'),
 'citizen_registration_screen.dart':('CIT_Registration_','Citizen registration form; no registration submitted.'),
 'registration_password_screen.dart':('CIT_Registration_Password','Empty password step; credentials were not captured.'),
 'onboarding_screen.dart':('MOB_Onboarding','Shared welcome.'),
 'password_recovery_screen.dart':('MOB_Forgot_Password','No delivery request submitted.'),
 'reset_password_with_token_screen.dart':('', 'Valid email challenge/token required; no recovery secret fabricated or exposed.'),
 'otp_verification_screen.dart':('', 'Pending registration challenge required; no registration submitted.'),
 'role_unavailable_screen.dart':('', 'Current supported synthetic roles pass this guard; no removed role presented as an operational workspace.'),
 'citizen_dashboard_screen.dart':('CIT_02_Dashboard','Citizen home and daily quota.'),
 'map_picker_screen.dart':('CIT_05_Location_Map','Native citizen location picker.'),
 'notifications_screen.dart':('CS_14_Notifications','Staff generated notices; citizen original empty center and updated generated notices where available.'),
 'notification_details_screen.dart':('CS_15_Notification_Detail','Actual native notification detail is a modal in the installed build.'),
 'change_password_screen.dart':('Change_Password','Citizen and staff empty credential forms.'),
 'citizen_profile_screen.dart':('CIT_Profile|CIT_11_Profile','Original CIT_11_Profile and expanded native profile; identical new candidate may reference the retained original.'),
 'edit_citizen_profile_screen.dart':('CIT_Edit_Profile','No changes saved.'),
 'tanod_home_screen.dart':('CS_02_Dashboard','Committee Staff canonical role utility_personnel; /repair is compatibility path.'),
 'tanod_inspections_screen.dart':('CS_03_Assigned','Initial, Final, Sent tabs and actual findings/evidence/confirmation states captured.'),
 'utility_personnel_profile_screen.dart':('CS_Profile','Profile, managed-account information, password form and sign-out captured.'),
 'barangay_picker_screen.dart':('CIT_Barangay','Only reachable inside a report draft.'),
 'category_picker_screen.dart':('CIT_04_Category_Selection','Actual category selection.'),
 'citizen_report_detail_screen.dart':('CIT_07_Report_Details','Original and completed synthetic case details.'),
 'evidence_picker_screen.dart':('CIT_Evidence','Inside draft; no real photograph or privacy efficacy claimed.'),
 'my_reports_screen.dart':('CIT_06_My_Reports','Existing synthetic reports and status filters.'),
 'new_citizen_report_screen.dart':('CIT_03_Report_Entry|CIT_Report_Review','Original quota limitation captured; resumed draft uses the next Philippine calendar day after quota reset.'),
 'reporting_appeal_screen.dart':('', 'Separate false-report-restriction context needed; current account has no appeal entry point.'),
 'report_review_screen.dart':('CIT_Report_Review','Requires complete draft; if no matching capture remains, limitation is no complete eligible draft.'),
 'report_timeline_screen.dart':('CIT_09_Timeline','Original submitted timeline and completed synthetic timeline where available.'),
}
inventory+=['\n## Native source-screen coverage','| Source screen | Capture files | Coverage or limitation |','|---|---|---|']
for file in sorted((BASE/'lunas_mobile/lib').rglob('*screen.dart')):
    prefix,note=native_map.get(file.name,('', 'No route/navigation link established.'))
    matched=[r['filename'] for r in selected if prefix and int(r['height'])==2400 and any(part in r['filename'] for part in prefix.split('|'))]
    inventory.append('| '+ ' | '.join(map(esc,[str(file.relative_to(BASE)),', '.join(matched) or 'Not captured',note]))+' |')
(ROOT/'SCREEN_INVENTORY.md').write_text('\n'.join(inventory),encoding='utf-8')
guide=['# Chapter III screenshot guide','All incident examples are synthetic local demonstrations. Retain existing figure numbering. Legal content is displayed as implemented and remains draft/template material. Screenshots illustrate interfaces; they do not establish AI accuracy, privacy effectiveness, reliability, performance or survey acceptability.']
for section in ['A. System Requirements and Features','B. Other System Screens']:
    guide+=['\n## '+section]
    if section.startswith('A.'):guide+=['Core reporting, committee decisions, field verification, agency processing, SLA visibility, generated notifications and histories. The new final case was model-seeded at intake and then progressed through existing scoped operations; no actual repair or complete citizen UI submission is claimed.']
    else:guide+=['Supporting authentication, registration, profile, security forms, account information, help/support and public legal screens. Native FAQ/settings/switch-account routes were not found; see inventory.']
    for r in selected:
        if r['subsection']!=section:continue
        guide.append(f"\n- [{r['filename']}](screenshots/{r['folder']}/{r['filename']}) — {r['role']}. Caption: {r['caption']} Placement: {section}. {r['notes']}")
(ROOT/'CHAPTER_III_SCREENSHOT_GUIDE.md').write_text('\n'.join(guide),encoding='utf-8')
counts={p.name:sum(r['folder'].split('/')[0]==p.name for r in selected) for p in sorted((ROOT/'screenshots').iterdir()) if p.is_dir()};seeded=sum(r['seeded']=='Yes' for r in selected);staff=sum(r['folder']=='03_Committee_Staff_Mobile' for r in selected);supp=counts.get('07_Other_Screens',0)
report=f'''# Expanded capture report
Captures: 2026-10-27–28 (Asia/Shanghai). Actual local Docker web/backend/MongoDB/MinIO/AI and native Android emulator-5554 (`com.example.lunas_mobile.docker`). Individual capture timestamps are in the manifest. Docker and the emulator were restarted on resume; the existing app/data were retained. The emulator GPS was explicitly set to synthetic Dagupan fixture coordinates, replacing its default US position.

## Verified output
- {len(selected)} valid curated PNGs; {seeded} use seeded/synthetic report, account or statistical data. Public/empty forms are marked No; the manifest notes whether fixtures are newly created.
- Committee Staff core folder: {staff} PNGs. Supplementary folder: {supp} PNGs (viewport images, not a claim of {supp} unique pages).
- Counts: {json.dumps(counts)}.
- All original {len(original)} PNGs were preserved byte-for-byte. Before-expansion documents/ZIP are backed up in `.local-backups/chapter-iii-before-expansion`. Identical new viewports were moved to `.local-backups/chapter-iii-capture-review/expanded-duplicates`; their retained equivalents appear in the inventory.
- Web: 1440×900, device scale 1, fullPage false. Native: 1080×2400. Four original A4 PDF chart pages remain explicitly identified as export artifacts. Long screens use separate scroll captures, no stitching or zoom reduction.
- Every curated PNG decoded and passed exact dimension checks. Duplicate content checks ignore the native system clock. ZIP integrity, entry count, manifest-file correspondence and original-image hashes are checked by this script. Contact sheets and representative full-resolution images were reviewed; do not shrink figures to narrow unreadable columns in the paper.

## Why staff captures were missing and how resolved
The existing `dagupan.tanod-poblacion-oeste@lunas.test` fixture remains `repair_personnel`. Current `auth_role_policy.dart`, mobile router and scoped inspection APIs support `utility_personnel` as Committee Staff. No mobile authentication relaxation or production migration was performed. The earlier desktop-only loop did not orchestrate staff native navigation, and the native attempt could not pass the legacy account guard.

Using the existing account-definition mechanism and Mongoose models, guarded local-only `lunas_backend/scripts/seed-chapter-iii-staff.js` created a separate `chapter3.staff-oeste@lunas.test` account with canonical role `utility_personnel`, Poblacion Oeste scope and fictional account details. It did not alter the legacy fixture. Two clearly marked new reports (`CHAPTER3-STAFF-INITIAL`, `CHAPTER3-STAFF-FINAL`) isolate the examples from previously captured reports. Existing original assignments were preserved. The seeder requires the existing local-lunas_db guard and Docker seed opt-in.

Initial assignments, a synthetic initial review for the final case, agency status/deadline recording and final assignment used normal authenticated role-scoped APIs. Synthetic image cards use the existing fixture evidence helper; they are explicitly not photographs. Native initial and final findings/evidence submissions succeeded. The committee subsequently approved the initial verification and accepted the final case through its existing web UI. These changes generated actual persisted in-app notifications. Records represent demonstrations, not government inspections, procurement or maintenance.

The native automation now waits for fresh accessibility hierarchies, retries transient hierarchy failures, selects exact clickable labels before matching text, and identifies input fields from their current bounds. A Flutter debug assertion (`_dependents.isEmpty`) occurred during modal navigation; restarting the app recovered it. No app code was changed to hide this defect. Candidate captures with incorrect intermediate labels were recaptured; final metadata reflects reviewed screens.

On 2026-10-28 the daily quota reset. The existing synthetic citizen completed the actual evidence/category/description/location/barangay/review/final-check flow and successfully submitted **LUNAS-202610-000058**. A read-only local query confirmed its persisted submitted status, and the committee received it within Poblacion Oeste. The image is a clearly labeled synthetic test card. The possible-nearby-report message was captured as advisory, with no automatic rejection or merging. Its actual AI panel shows Analysis Completed / No Hazard Suggested / 0% confidence; this is not evidence of positive hazard detection, model accuracy or face/plate masking. This new submission is separate from the completed seeded final-inspection case and was not advanced to approval or closure.

## Expanded coverage
Native staff: dashboard/action counts, Initial/Final/Sent tabs, location/report information, findings forms, synthetic evidence previews, confirmation dialogs, submitted histories, generated notifications and notification details. Profile, managed-account information, empty change-password form and logout confirmation are supplementary.

Web: committee and all four agencies retain their original core captures; expanded profile/password/help-support pages, committee staff-account pages, menus and logout confirmations are included. Source checks confirmed that committee/agency edit-profile routes redirect to their profile, recovery-email redirects to dashboard and the exceptions route redirects to reports. These are inventory aliases, not additional working screens; the initial exceptions candidate showed a page-load error and was excluded. The legacy agency organization-personnel page displayed a roster-load error; its actual form/error state is retained, with no personnel created. Shared web authentication, recovery/activation screens without tokens, public terms/privacy, maintenance and authorization messages are included. Terms/privacy are current draft/template content, not approved policy. Legacy UI labels such as `Utility Provider` and Tanod statuses remain in actual screens and are disclosed compatibility terminology, not additional principal roles. No independent Repair Personnel workspace was captured.

See SCREEN_INVENTORY.md for every captured state, all discovered web route files, every native screen source and requested absent/conditional screens. The guide distinguishes A. System Requirements and Features from B. Other System Screens; final figure numbers are not assigned.

## Remaining exact limitations
'''
report+='\n'.join(f'- **{role} — {screen}:** {reason}' for role,screen,reason in gaps)
report+='''

## Reproduction and scope
`node scripts/capture-chapter-iii.cjs` retains the original browser workflow. `node scripts/capture-chapter-iii-extra.cjs` captures supplementary web pages; `--menus-only` appends menu/dialog views. `node scripts/capture-chapter-iii-workflow.cjs` captures the dedicated fixture lifecycle and performs only the specific synthetic committee decisions; it contains IDs for this captured fixture run. Recreate fixture IDs rather than applying it to arbitrary records. Native helper: `inspect`, `tap-label`, `field`, `text`, `password`, `back`, `swipe`, `capture <folder> <name> <role> [Yes/No]`. Complete each native action before sending dependent commands, inspect changed field lists, and scroll outside text inputs. Passwords stay internal and never enter artifacts.

Local fixture preparation: copy the guarded staff fixture script into the existing backend container, provide the labeled synthetic evidence file at `/tmp/chapter3-staff-evidence.png`, and invoke with ALLOW_DEMO_SEED=true and DEMO_SEED_DOCKER=true. The existing local seed password is consumed internally; never print it. This is a local data mutation task explicitly authorized by the screenshot request; it is not a migration or production deployment.

`python scripts/refresh-chapter-iii.py` preserves the baseline selection, merges new metadata, validates files, generates the inventory/manifest/guide/report and rebuilds the ZIP. It uses Pillow already installed. Original PDFs and screenshots are retained. No business logic, permissions, authentication behavior, app UI, schema or application dependencies were changed. Only isolated automation, local synthetic fixtures, documentation and generated artifacts changed. External email/push delivery and production were not exercised.
'''
(ROOT/'CAPTURE_REPORT.md').write_text(report,encoding='utf-8')
qa=BASE/'.local-backups/chapter-iii-capture-review';qa.mkdir(parents=True,exist_ok=True)
for start in range(0,len(selected),28):
    group=selected[start:start+28];sheet=Image.new('RGB',(1440,260*((len(group)+3)//4)),'#dddddd')
    for i,r in enumerate(group):
        with Image.open(ROOT/'screenshots'/r['folder']/r['filename']) as im:thumb=ImageOps.contain(im.convert('RGB'),(350,225))
        tile=Image.new('RGB',(360,260),'white');tile.paste(thumb,((360-thumb.width)//2,0));ImageDraw.Draw(tile).text((4,230),r['filename'][:48],fill='black');sheet.paste(tile,((i%4)*360,(i//4)*260))
    sheet.save(qa/f'expanded-QA-{start//28+1}.jpg')
archive=ROOT/'LUNAS_Chapter_III_Screenshots.zip';docs=['SCREENSHOT_MANIFEST.csv','SCREEN_INVENTORY.md','CHAPTER_III_SCREENSHOT_GUIDE.md','CAPTURE_REPORT.md','IC_Report.pdf','AG_CITY_Report.pdf']
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as z:
    for r in selected:
        file=ROOT/'screenshots'/r['folder']/r['filename'];z.write(file,file.relative_to(ROOT))
    for name in docs:z.write(ROOT/name,name)
with zipfile.ZipFile(archive) as z:assert z.testzip() is None;assert len(z.namelist())==len(selected)+len(docs)
actual={str(p.relative_to(ROOT/'screenshots')).replace('\\','/') for p in (ROOT/'screenshots').rglob('*.png')};listed={r['folder']+'/'+r['filename'] for r in selected};assert actual==listed,('Unlisted files',actual-listed,'Missing files',listed-actual)
summary=dict(total=len(selected),staff=staff,supplementary=supp,seeded=seeded,counts=counts,original_preserved=len(original),excluded_duplicates=len(excluded));(ROOT/'capture-summary.json').write_text(json.dumps(summary,indent=2));print(json.dumps(summary,indent=2))
