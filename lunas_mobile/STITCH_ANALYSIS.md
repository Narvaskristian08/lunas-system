# Complete LUNAS Stitch Analysis

## Analysis Scope

This analysis is based on all attached Google Stitch canvas screenshots. Canvas labels are truncated in several places, so names below are normalized from the visible screen title and content. Repeated overview images and duplicate canvas captures are counted once.

The product is a multi-role urban infrastructure reporting and maintenance platform with seven major modules:

1. Authentication and account enrollment
2. Citizen reporting
3. Repair team operations
4. Barangay operations
5. City Engineering
6. Utility provider operations
7. System administration

## Complete Screen Inventory

### Module 1 — Authentication and Account Enrollment

| # | Normalized screen name | Purpose |
|---:|---|---|
| 1 | Splash | Brand loading and application initialization |
| 2 | Login | Username/email and password authentication |
| 3 | Select Account Type | Choose Citizen or Government/Official registration |
| 4 | Create Citizen Account | Citizen identity and contact registration |
| 5 | Citizen Account Security | Password, privacy consent, and security setup |
| 6 | Citizen Registration Welcome | Registration success and next-step entry |
| 7 | Verify Contact | OTP/contact verification |
| 8 | Select Official Role | Barangay Official, City Engineering Personnel, or Utility Provider |
| 9 | Official Identity Documents | Multi-document official verification form |
| 10 | Registration Submitted | Official registration pending-review confirmation |
| 11 | Forgot Password | Request password recovery |
| 12 | Reset Password | Enter and confirm a new password |

### Module 2 — Citizen Reporting

| # | Normalized screen name | Purpose |
|---:|---|---|
| 13 | Citizen Dashboard | Citizen overview, reporting CTA, activity, alerts, and bottom navigation |
| 14 | Citizen Home Overview | Alternate/full dashboard state with recent reports and quick actions |
| 15 | Citizen Incident Map | Browse infrastructure incidents spatially |
| 16 | Report Hazard | Full hazard submission form |
| 17 | Report Incident | Initial report capture/form state |
| 18 | AI Hazard Detection | Analyze uploaded evidence and show classification/confidence |
| 19 | Confirm Report Details | Review evidence, location, category, and description |
| 20 | Pin Location | Select and confirm incident coordinates |
| 21 | My Reports | Citizen report list with filters and statuses |
| 22 | Report Submitted | Submission confirmation and report reference |
| 23 | Report Details — Broken Streetlight | Detailed report status, evidence, metadata, and location |
| 24 | Report Timeline | Lifecycle/audit timeline for a report |
| 25 | Repair Evidence Viewer | Before/after repair evidence comparison |
| 26 | Report Resolved | Resolution summary, evidence, rating, and feedback |
| 27 | My Draft Reports | Saved drafts, resume, and create-report empty state |

### Module 3 — Repair Team Operations

| # | Normalized screen name | Purpose |
|---:|---|---|
| 28 | Repair Dashboard | Assigned work, priority items, stats, alerts, and quick actions |
| 29 | Assigned Reports | Filtered list of repair assignments |
| 30 | Work Order Details | Work order metadata, evidence, location, and actions |
| 31 | Navigate to Work Order | Route/map navigation to the incident |
| 32 | Start Work Order | Begin job, capture arrival, and acknowledge requirements |
| 33 | Update Work Progress | Progress percentage, notes, milestones, and evidence |
| 34 | Upload Repair Evidence | Capture/upload completion evidence |
| 35 | AI Image Quality Check | Evidence quality, blur, lighting, and compliance validation |
| 36 | Confirm Repair Completion | Review before/after evidence and completion checklist |
| 37 | Repair Submitted Successfully | Completion submission success and next actions |
| 38 | Finished Repair Report | Published work-order summary, evidence, verification, and timeline |
| 39 | Completed Work History | Completed/failed/pending work-order history with filters |

### Module 4 — Barangay Operations

| # | Normalized screen name | Purpose |
|---:|---|---|
| 40 | Incoming Reports | Queue of citizen reports requiring barangay action |
| 41 | Barangay Dashboard | Today’s summary, workload, quick actions, and priority incidents |
| 42 | Incident Details | Full incident record, map, evidence, and history |
| 43 | Validate Report | Evidence validation, classification, urgency, notes, and decision |
| 44 | Assign Repair | Select and assign an available repair provider |
| 45 | SLA Monitoring | Active, due-soon, and overdue SLA queues |
| 46 | Repair Verification | Verify completed work and accept/reject repair |
| 47 | Barangay Statistics | KPIs, bar charts, status donut, trends, and recent activity |

### Module 5 — City Engineering

| # | Normalized screen name | Purpose |
|---:|---|---|
| 48 | Engineering SLA Dashboard | SLA compliance trends, distribution charts, and violation tables |
| 49 | Engineering Dashboard | High-priority incidents, assignments, and quick actions |
| 50 | City Engineering Incident Dashboard | Priority incident queue and engineering workload |
| 51 | Infrastructure Analytics | citywide KPIs, heatmap, performance, and category analysis |
| 52 | Engineering Repair/Incident Details | Technical incident evidence, metadata, and response controls |
| 53 | Assign Repair Provider Dialog | Provider selection and assignment confirmation |
| 54 | Performance Reports | response times, compliance, trends, charts, and report export |
| 55 | Engineering Incident Detail | Engineering-specific incident and location detail |

### Module 6 — Utility Provider Operations

| # | Normalized screen name | Purpose |
|---:|---|---|
| 56 | Utility Dashboard | Provider profile, workload KPIs, urgent assignments, and quick actions |
| 57 | Utility Assigned Reports | Assigned utility work with urgency and action buttons |
| 58 | Utility Incident Details | Utility incident SLA, location, evidence, timeline, and actions |
| 59 | Accept Assignment Dialog | Assignment acceptance confirmation and optional note |

### Module 7 — System Administration

| # | Normalized screen name | Purpose |
|---:|---|---|
| 60 | Admin Dashboard | Platform totals, pending approvals, quick actions, and activity |
| 61 | User Management | Search, filter, role/status listing, and account controls |
| 62 | System Audit Logs | Searchable/filterable system events and status tags |
| 63 | User Profile Management | User identity, role, account status, permissions, and activity |
| 64 | Create System Announcement | Audience, priority, schedule, channels, and message form |
| 65 | Verify New Account | Review identity documents and approve/reject registration |
| 66 | System Announcements | Announcement history and enabled/disabled controls |
| 67 | System Settings | Branding, notifications, security, maintenance, and backup settings |

## Navigation Architecture

### Authentication Flow

```text
Splash
  -> Login
     -> Forgot Password -> Reset Password -> Login
     -> Select Account Type
        -> Citizen
           -> Create Citizen Account
           -> Citizen Account Security
           -> Verify Contact
           -> Citizen Registration Welcome
           -> Citizen Dashboard
        -> Official
           -> Select Official Role
           -> Official Identity Documents
           -> Registration Submitted
           -> Login after approval
```

### Citizen Flow

```text
Citizen Dashboard
  -> Report Incident
     -> Photo Upload / Camera
     -> AI Hazard Detection
     -> Pin Location
     -> Confirm Report Details
     -> Report Submitted
     -> Report Details / Timeline
  -> Citizen Incident Map
  -> My Reports
     -> Report Details
        -> Report Timeline
        -> Repair Evidence Viewer
        -> Report Resolved
  -> My Draft Reports
  -> Profile
```

### Repair Team Flow

```text
Repair Dashboard
  -> Assigned Reports
     -> Work Order Details
     -> Navigate to Work Order
     -> Start Work Order
     -> Update Work Progress
     -> Upload Repair Evidence
     -> AI Image Quality Check
     -> Confirm Repair Completion
     -> Repair Submitted Successfully
     -> Finished Repair Report
  -> Completed Work History
  -> Profile
```

### Barangay Flow

```text
Barangay Dashboard
  -> Incoming Reports
     -> Incident Details
     -> Validate Report
     -> Assign Repair
     -> SLA Monitoring
     -> Repair Verification
  -> Barangay Statistics
  -> Profile
```

### City Engineering Flow

```text
Engineering Dashboard
  -> City Engineering Incident Dashboard
  -> Engineering Incident Detail
  -> Engineering Repair/Incident Details
  -> Assign Repair Provider Dialog
  -> Engineering SLA Dashboard
  -> Infrastructure Analytics
  -> Performance Reports
  -> Profile
```

### Utility Provider Flow

```text
Utility Dashboard
  -> Utility Assigned Reports
  -> Utility Incident Details
  -> Accept Assignment Dialog
  -> Work/repair execution flow
  -> Profile
```

### Admin Flow

```text
Admin Dashboard
  -> User Management
     -> User Profile Management
     -> Verify New Account
  -> System Audit Logs
  -> Create System Announcement
  -> System Announcements
  -> System Settings
  -> Admin Profile
```

## Reusable Widgets

### Global Shell

- Role-aware application scaffold
- LUNAS top app bar
- Role badge and profile avatar
- Bottom navigation with role-specific destinations
- Back-navigation app bar
- Search field and filter toolbar
- Responsive page container
- Floating primary action button

### Cards and Lists

- KPI/stat card
- Incident/report card
- Priority alert card
- Work-order card
- User card
- Activity feed row
- Audit-log row
- Evidence thumbnail card
- Before/after evidence card
- Empty-state card
- Draft report card
- Quick-action tile
- Notification card

### Status and Metadata

- Status chip: New, Pending, Validated, Assigned, In Progress, Resolved, Rejected
- Priority chip: Low, Medium, High, Critical
- SLA badge and countdown
- AI-confidence meter
- Progress indicator
- Verification badge
- Role badge
- Metadata label/value row
- Timeline step

### Forms

- Labeled text field
- Password field with visibility control
- OTP input
- Dropdown/select field
- Segmented role/category selector
- Searchable provider selector
- Multiline notes/description field
- Date/time scheduler
- Checkbox/consent row
- Toggle setting row
- File/document uploader
- Camera/photo uploader
- Location picker field
- Form section header
- Validation message

### Reporting and Repair

- Photo capture frame
- AI hazard-result panel
- AI image-quality panel
- Image-quality checklist
- Evidence gallery
- Incident location preview
- Work progress slider/progress card
- Completion checklist
- Report submission summary
- Resolution rating control
- Feedback text area

### Administration

- User table/list
- Permission checklist
- Account status control
- Document verification viewer
- Announcement composer
- Audience selector
- Priority selector
- System setting group
- Destructive confirmation control

## Components by Type

### Dialogs

- Assign Repair Provider
- Accept Assignment
- Confirmation before assignment/acceptance
- Approval/rejection confirmation
- Potential destructive account/security confirmations

### Bottom Sheets

- Map incident detail sheet
- Filter/sort controls on small screens
- Provider selection on compact layouts
- Photo-source selection
- Location confirmation

### Charts and Analytics

- KPI number cards
- Vertical bar charts
- Grouped bar charts
- Line/trend charts
- Donut/status-distribution chart
- SLA compliance chart
- Response-time trend chart
- Infrastructure category distribution
- Heatmap/geospatial density visualization
- Progress rings and percentage bars

### Maps

- Citizen incident map
- Pin-location selector
- Repair navigation map
- Incident detail mini-map
- Barangay incident map
- Engineering heatmap
- Utility incident map
- Map markers with severity colors
- Current-location control
- Route/ETA overlay

### Forms

- Login
- Citizen registration
- Citizen security setup
- Contact verification
- Official role selection
- Official document submission
- Forgot/reset password
- Report incident
- Report confirmation
- Repair progress update
- Evidence upload
- Completion confirmation
- Barangay validation
- Repair/provider assignment
- Account verification
- System announcement
- System settings

## Shared Visual System

### Colors

The screenshots use a light civic/operational palette:

| Role | Approximate/design-reference color |
|---|---|
| App background | Cool white/light gray, approximately `#F7F9FC` to `#F9FAFB` |
| Surface/cards | White, `#FFFFFF` |
| Primary brand/navigation | Deep civic blue, approximately `#005EA8` to `#1E3A8A` |
| Primary dark text | Ink/navy, approximately `#111827` |
| Secondary text | Steel gray, approximately `#6B7280` |
| Active navigation/success | Green, approximately `#16A34A` to `#22C55E` |
| Success container | Pale green |
| Warning/SLA due | Amber/orange, approximately `#F59E0B` |
| Critical/overdue/reject | Red, approximately `#DC2626` |
| Informational container | Pale blue |
| Disabled/subtle surface | Cool gray-blue |

Exact values should be sampled from source design tokens before implementation; screenshot-derived values are visual estimates.

### Typography

- Primary family appears to be a clean sans-serif consistent with Inter/Google Sans.
- Page titles: bold, compact, dark navy
- Section headings: semibold
- Body text: regular
- Labels/captions: medium or semibold, smaller size
- KPI numbers: bold, large, high contrast
- Status labels: compact semibold
- Technical IDs/timestamps: compact sans-serif or monospaced treatment

Suggested scale:

- Display/KPI: 28–40 px
- Page title: 20–24 px
- Section title: 16–18 px
- Body: 13–15 px
- Label/caption: 10–12 px
- Button: 13–15 px semibold

### Spacing

The layouts follow a compact 4 px base system:

- 4 px: micro spacing
- 8 px: icon/label and compact gaps
- 12 px: dense control spacing
- 16 px: standard spacing
- 20–24 px: card and page padding
- 24–32 px: section separation
- 48 px: large empty-state/hero separation

### Shapes and Elevation

- Cards: 10–16 px radius
- Buttons and inputs: 6–10 px radius
- Chips: pill/full radius
- Dialogs/bottom sheets: 14–20 px radius
- Low, soft card shadows
- Thin cool-gray borders
- Filled semantic status backgrounds

## Key Product Model Inferred from the Screens

Core entities:

- User
- UserRole
- CitizenProfile
- OfficialProfile
- IncidentReport
- ReportDraft
- Evidence
- Location
- AIAnalysis
- Validation
- WorkOrder
- RepairAssignment
- RepairProvider
- SLARecord
- RepairProgress
- RepairCompletion
- AuditEvent
- Notification
- Announcement
- SystemSetting
- Barangay
- UtilityProvider
- EngineeringTeam

Core report lifecycle:

```text
Draft
-> Submitted
-> AI Analyzed
-> Pending Validation
-> Validated or Rejected
-> Assigned
-> Accepted
-> In Progress
-> Completion Submitted
-> Repair Verified
-> Resolved
```

## Important Design Conclusions

- The complete product is role-based, not a single citizen application.
- Each role has a distinct dashboard and bottom-navigation model.
- Reporting is a multi-stage workflow rather than one form.
- Repair is a full work-order workflow with AI evidence validation.
- Barangay, Engineering, and Utility roles share incident data but have different decisions and permissions.
- Admin is a separate operational console with user, approval, audit, announcement, and system configuration tools.
- Maps, evidence, status, SLA, and timeline components should be shared across roles.
- The current screenshots primarily show light mode; dark mode should not be assumed without separate complete role designs.
