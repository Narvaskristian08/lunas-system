# LUNAS Stitch Implementation Plan

## Goal

Implement the complete 67-screen Stitch design in safe, reviewable batches while preserving useful Flutter foundations. No Flutter implementation is included in this document.

## Planning principles

1. Confirm routes, roles, models, and service contracts before adding role-specific screens.
2. Reuse the existing theme and shared widgets, extending them only when a repeated Stitch pattern requires it.
3. Keep screen widgets presentation-focused; place data access behind services/repositories.
4. Implement one complete vertical workflow before duplicating patterns across roles.
5. Preserve existing routes with aliases or redirects when route names change.
6. Add backend integrations only after their contracts and authorization rules are known.
7. Validate every batch with static analysis, widget tests, navigation tests, and screenshot comparison.

## Common building blocks

### Models

- `User`, `UserRole`, `UserProfile`, `AccountVerification`
- `IncidentReport`, `ReportDraft`, `ReportCategory`, `ReportStatus`, `ReportPriority`
- `GeoLocation`, `Address`, `MapMarker`, `RouteEstimate`
- `MediaEvidence`, `AiAssessment`, `ImageQualityResult`
- `WorkOrder`, `WorkProgress`, `RepairAssignment`, `RepairProvider`
- `SlaPolicy`, `SlaMetric`, `StatusTimelineEvent`
- `NotificationItem`, `SystemAnnouncement`
- `DashboardMetric`, `ChartSeries`, `AnalyticsFilter`
- `AuditLogEntry`, `SystemSetting`

### Services and repositories

- `AuthService`, `RegistrationService`, `VerificationService`
- `UserRepository`, `ProfileService`, `RoleAccessService`
- `ReportRepository`, `DraftReportService`, `ReportWorkflowService`
- `LocationService`, `MapService`, `GeocodingService`, `NavigationService`
- `MediaService`, `CameraService`, `UploadService`, `AiAssessmentService`
- `WorkOrderRepository`, `AssignmentService`, `RepairEvidenceService`
- `SlaService`, `AnalyticsService`, `DashboardService`
- `NotificationService`, `AnnouncementService`
- `AdminService`, `AuditLogService`, `SystemSettingsService`

### Likely package dependencies

Package selection must be checked against current `pubspec.yaml` and backend requirements before installation.

- State/navigation: retain the existing approach; consider `go_router` only if nested role shells cannot be handled cleanly.
- Maps/location: `google_maps_flutter` or `flutter_map`, plus `geolocator` and a geocoding provider.
- Media: `camera`, `image_picker`, `file_picker`, and upload/network support.
- Charts: `fl_chart` or an approved equivalent.
- Persistence/security: `shared_preferences` or a database for drafts, and `flutter_secure_storage` for sensitive tokens.
- Networking: the project's approved HTTP client and serialization approach.
- Files/export: platform share/download support for performance reports if required.

## Batch 0 — Architecture and design-system readiness

Before screen work:

- Confirm the six roles: citizen, repair personnel, barangay, engineering, utility provider, and administrator.
- Define route guards and a role-aware shell/navigation model.
- Finalize report and work-order state machines.
- Define service interfaces and fixture repositories without replacing future backend contracts.
- Extend shared components for status chips, metric cards, list rows, empty states, timelines, evidence tiles, filter bars, map overlays, chart containers, confirmation dialogs, and bottom sheets.
- Create a visual regression checklist for phone widths represented by the Stitch screens.

## Batch 1 — Authentication and account onboarding

### Existing screens to redesign

- Splash
- Login
- Create Citizen Account (`RegisterScreen`)
- Forgot Password

### Missing screens

| Screen | Module | Suggested Flutter path | Required widgets | Required models | Required services | Route | Dependencies |
|---|---|---|---|---|---|---|---|
| Select Account Type | Authentication | `lib/features/auth/presentation/screens/select_account_type_screen.dart` | Role option cards, benefit list, primary CTA | `UserRole` | `RoleAccessService` | `/auth/account-type` | Existing theme/navigation |
| Citizen Account Security | Authentication | `lib/features/auth/presentation/screens/citizen_account_security_screen.dart` | Password fields, strength meter, requirement checklist | Registration draft | `RegistrationService` | `/auth/citizen/security` | Secure input/state |
| Citizen Registration Welcome | Authentication | `lib/features/auth/presentation/screens/citizen_registration_welcome_screen.dart` | Welcome hero, role summary, CTA | `UserRole` | `RegistrationService` | `/auth/citizen/welcome` | Image asset |
| Verify Contact | Authentication | `lib/features/auth/presentation/screens/verify_contact_screen.dart` | OTP inputs, resend timer, channel selector | Contact verification | `VerificationService` | `/auth/verify-contact` | OTP/timer support |
| Select Official Role | Authentication | `lib/features/auth/presentation/screens/select_official_role_screen.dart` | Role cards, eligibility badges, disabled states | `UserRole` | `RoleAccessService` | `/auth/official/role` | None beyond shared UI |
| Official Identity Documents | Authentication | `lib/features/auth/presentation/screens/official_identity_documents_screen.dart` | Upload tiles, document list, requirement panel | Verification document | `UploadService`, `VerificationService` | `/auth/official/documents` | `camera`, `image_picker`, `file_picker` |
| Registration Submitted | Authentication | `lib/features/auth/presentation/screens/registration_submitted_screen.dart` | Success state, reference card, next actions | `AccountVerification` | `VerificationService` | `/auth/submitted` | None beyond shared UI |
| Reset Password | Authentication | `lib/features/auth/presentation/screens/reset_password_screen.dart` | Password fields, strength rules, success state | Password reset request | `AuthService` | `/auth/reset-password` | Secure token/deep-link handling |

### Exit criteria

- Citizen and official registration branches are reachable.
- Back navigation preserves entered data.
- Login/reset/verification error and loading states are designed.
- Existing authentication behavior is wrapped rather than replaced.

## Batch 2 — Citizen dashboard, navigation, notifications, and profile

### Existing screens to redesign

- Citizen Dashboard
- Citizen Home Overview
- Citizen Incident Map
- Notifications
- Profile
- User Settings

No entirely new standalone Stitch screen is required in this batch; it establishes the citizen shell used by reporting. Add role-aware dashboard, notification, profile, and settings models/services before screen redesign.

### Exit criteria

- Citizen bottom navigation matches Stitch.
- Dashboard cards open the correct report, map, and history destinations.
- Notifications, profile, and settings are reachable from all intended entry points.
- Map permission denial and unavailable-location states are represented.

## Batch 3 — Citizen reporting workflow

### Existing screens to redesign

- Report Hazard
- Report Incident
- AI Hazard Detection
- Confirm Report Details
- Pin Location
- My Reports
- Report Submitted
- Report Details
- Report Timeline
- Report Resolved

### Missing screens

| Screen | Module | Suggested Flutter path | Required widgets | Required models | Required services | Route | Dependencies |
|---|---|---|---|---|---|---|---|
| Repair Evidence Viewer | Citizen Reports | `lib/features/reports/presentation/screens/repair_evidence_viewer_screen.dart` | Before/after viewer, evidence metadata, verifier card, rating form | `MediaEvidence`, `WorkOrder`, `StatusTimelineEvent` | `ReportRepository`, `RepairEvidenceService` | `/reports/:id/evidence` | Image viewer/cache |
| My Draft Reports | Citizen Reports | `lib/features/reports/presentation/screens/report_drafts_screen.dart` | Draft cards, empty state, continue/delete actions | `ReportDraft` | `DraftReportService` | `/reports/drafts` | Local persistence |

### Exit criteria

- Create, save draft, resume, locate, attach media, review, submit, and track form one continuous flow.
- Camera, image, permission, location, and retry states are preserved.
- Every report action routes to the correct report ID.

## Batch 4 — Repair personnel

| Missing screen | Module | Suggested Flutter path | Required widgets | Required models | Required services | Route | Dependencies |
|---|---|---|---|---|---|---|---|
| Repair Dashboard | Repair | `lib/features/repair/presentation/screens/repair_dashboard_screen.dart` | Greeting, workload metrics, priority queue, quick actions | `DashboardMetric`, `WorkOrder` | `DashboardService`, `WorkOrderRepository` | `/repair/dashboard` | Chart support if retained |
| Assigned Reports | Repair | `lib/features/repair/presentation/screens/assigned_reports_screen.dart` | Tabs, filters, assignment cards, status chips | `RepairAssignment`, `WorkOrder` | `WorkOrderRepository` | `/repair/assignments` | None beyond shared UI |
| Work Order Details | Repair | `lib/features/repair/presentation/screens/work_order_details_screen.dart` | Incident summary, evidence, map preview, SLA panel, actions | `WorkOrder`, `IncidentReport`, `SlaMetric` | `WorkOrderRepository` | `/repair/work-orders/:id` | Maps/image cache |
| Start Work Order | Repair | `lib/features/repair/presentation/screens/start_work_order_screen.dart` | Job header, safety checklist, start CTA | `WorkOrder`, checklist model | `ReportWorkflowService` | `/repair/work-orders/:id/start` | Location/time capture |
| Update Work Progress | Repair | `lib/features/repair/presentation/screens/update_work_progress_screen.dart` | Progress control, status picker, notes, material fields | `WorkProgress`, `WorkOrder` | `ReportWorkflowService` | `/repair/work-orders/:id/progress` | Form state |
| AI Image Quality Check | Repair | `lib/features/repair/presentation/screens/image_quality_check_screen.dart` | Score ring, check rows, warnings, retake/continue actions | `ImageQualityResult`, `MediaEvidence` | `AiAssessmentService` | `/repair/work-orders/:id/image-check` | Camera/image processing |
| Confirm Repair Completion | Repair | `lib/features/repair/presentation/screens/confirm_repair_completion_screen.dart` | Before/after media, checklist, completion summary | `WorkOrder`, `MediaEvidence` | `RepairEvidenceService`, `ReportWorkflowService` | `/repair/work-orders/:id/confirm` | Upload support |
| Repair Submitted Successfully | Repair | `lib/features/repair/presentation/screens/repair_submitted_screen.dart` | Success state, work-order summary, actions | `WorkOrder` | `WorkOrderRepository` | `/repair/work-orders/:id/submitted` | None beyond shared UI |
| Finished Repair Report | Repair | `lib/features/repair/presentation/screens/finished_repair_report_screen.dart` | Completion header, evidence, incident summary, timeline | `WorkOrder`, `StatusTimelineEvent` | `WorkOrderRepository` | `/repair/work-orders/:id/finished` | Image/map support |
| Completed Work History | Repair | `lib/features/repair/presentation/screens/completed_work_history_screen.dart` | Filter chips, completed cards, empty/loading states | `WorkOrder`, analytics filter | `WorkOrderRepository` | `/repair/history` | None beyond shared UI |

### Partial screens reused in this batch

- `MapScreen` becomes the base for **Navigate to Work Order**.
- `PhotoUploadScreen` becomes the media-capture base for **Upload Repair Evidence**.

## Batch 5 — Barangay operations

| Missing screen | Module | Suggested Flutter path | Required widgets | Required models | Required services | Route | Dependencies |
|---|---|---|---|---|---|---|---|
| Incoming Reports | Barangay | `lib/features/barangay/presentation/screens/incoming_reports_screen.dart` | Tabs, filters, report cards, priority/status chips | `IncidentReport`, `ReportPriority` | `ReportRepository` | `/barangay/reports` | Realtime/pagination if supported |
| Barangay Dashboard | Barangay | `lib/features/barangay/presentation/screens/barangay_dashboard_screen.dart` | Metrics, priority queue, quick actions, activity list | `DashboardMetric`, `IncidentReport` | `DashboardService` | `/barangay/dashboard` | Charts |
| Incident Details | Barangay | `lib/features/barangay/presentation/screens/barangay_incident_details_screen.dart` | Evidence, map, citizen summary, timeline, actions | `IncidentReport`, `StatusTimelineEvent` | `ReportRepository` | `/barangay/reports/:id` | Maps/images |
| Validate Report | Barangay | `lib/features/barangay/presentation/screens/validate_report_screen.dart` | Validation checklist, category/severity fields, decision bar | Validation result, `IncidentReport` | `ReportWorkflowService` | `/barangay/reports/:id/validate` | Form validation |
| Assign Repair | Barangay | `lib/features/barangay/presentation/screens/assign_repair_screen.dart` | Provider/team cards, schedule, notes, confirmation | `RepairAssignment`, `RepairProvider` | `AssignmentService` | `/barangay/reports/:id/assign` | Date/time picker |
| SLA Monitoring | Barangay | `lib/features/barangay/presentation/screens/sla_monitoring_screen.dart` | SLA metrics, breach cards, filter tabs, countdown states | `SlaMetric`, `SlaPolicy` | `SlaService` | `/barangay/sla` | Charts/timers |
| Repair Verification | Barangay | `lib/features/barangay/presentation/screens/repair_verification_screen.dart` | Evidence comparison, verification checklist, reject/approve bar | `WorkOrder`, `MediaEvidence` | `RepairEvidenceService`, `ReportWorkflowService` | `/barangay/repairs/:id/verify` | Image viewer |
| Barangay Statistics | Barangay | `lib/features/barangay/presentation/screens/barangay_statistics_screen.dart` | Metric cards, bar/donut charts, activity feed | `DashboardMetric`, `ChartSeries` | `AnalyticsService` | `/barangay/statistics` | Chart package |

## Batch 6 — City engineering and analytics

| Missing screen | Module | Suggested Flutter path | Required widgets | Required models | Required services | Route | Dependencies |
|---|---|---|---|---|---|---|---|
| Engineering SLA Dashboard | Engineering | `lib/features/engineering/presentation/screens/engineering_sla_dashboard_screen.dart` | SLA cards, trends, provider table, breach queue | `SlaMetric`, `ChartSeries` | `SlaService`, `AnalyticsService` | `/engineering/sla` | Charts |
| Engineering Dashboard | Engineering | `lib/features/engineering/presentation/screens/engineering_dashboard_screen.dart` | City metrics, alerts, quick actions, incident feed | `DashboardMetric`, `IncidentReport` | `DashboardService` | `/engineering/dashboard` | Charts |
| City Engineering Incident Dashboard | Engineering | `lib/features/engineering/presentation/screens/city_incident_dashboard_screen.dart` | Category/status tabs, metrics, filtered incidents | `IncidentReport`, `AnalyticsFilter` | `ReportRepository`, `AnalyticsService` | `/engineering/incidents` | Pagination/charts |
| Infrastructure Analytics | Engineering | `lib/features/engineering/presentation/screens/infrastructure_analytics_screen.dart` | KPI cards, trends, heat map, category charts | `ChartSeries`, `MapMarker`, `AnalyticsFilter` | `AnalyticsService`, `MapService` | `/engineering/analytics` | Charts/maps |
| Engineering Repair/Incident Details | Engineering | `lib/features/engineering/presentation/screens/engineering_repair_details_screen.dart` | Evidence, SLA, provider, map, intervention actions | `IncidentReport`, `WorkOrder`, `SlaMetric` | `ReportRepository`, `AssignmentService` | `/engineering/repairs/:id` | Maps/images |
| Assign Repair Provider Dialog | Engineering | `lib/features/engineering/presentation/widgets/assign_repair_provider_dialog.dart` | Provider selector, availability rows, confirmation actions | `RepairProvider`, `RepairAssignment` | `AssignmentService` | Dialog from `/engineering/repairs/:id` | Dialog/form state |
| Performance Reports | Engineering | `lib/features/engineering/presentation/screens/performance_reports_screen.dart` | KPIs, charts, date filters, export CTA | `ChartSeries`, `AnalyticsFilter` | `AnalyticsService` | `/engineering/performance` | Charts/export/share |
| Engineering Incident Detail | Engineering | `lib/features/engineering/presentation/screens/engineering_incident_detail_screen.dart` | Incident header, evidence, map, timeline, response actions | `IncidentReport`, `StatusTimelineEvent` | `ReportRepository`, `ReportWorkflowService` | `/engineering/incidents/:id` | Maps/images |

## Batch 7 — Utility providers

| Missing screen | Module | Suggested Flutter path | Required widgets | Required models | Required services | Route | Dependencies |
|---|---|---|---|---|---|---|---|
| Utility Dashboard | Utility | `lib/features/utility/presentation/screens/utility_dashboard_screen.dart` | Metrics, urgent alerts, quick actions, workload summary | `DashboardMetric`, `WorkOrder` | `DashboardService`, `WorkOrderRepository` | `/utility/dashboard` | Charts |
| Utility Assigned Reports | Utility | `lib/features/utility/presentation/screens/utility_assigned_reports_screen.dart` | Assignment sections, filters, report cards | `RepairAssignment`, `WorkOrder` | `WorkOrderRepository` | `/utility/assignments` | Pagination if supported |
| Utility Incident Details | Utility | `lib/features/utility/presentation/screens/utility_incident_details_screen.dart` | SLA banner, incident data, evidence, map, decision actions | `IncidentReport`, `RepairAssignment` | `ReportRepository`, `AssignmentService` | `/utility/assignments/:id` | Maps/images |
| Accept Assignment Dialog | Utility | `lib/features/utility/presentation/widgets/accept_assignment_dialog.dart` | Schedule input, acknowledgement, reject/accept actions | `RepairAssignment` | `AssignmentService` | Dialog from `/utility/assignments/:id` | Date/time picker |

## Batch 8 — Administration, profile, and system settings

| Missing screen | Module | Suggested Flutter path | Required widgets | Required models | Required services | Route | Dependencies |
|---|---|---|---|---|---|---|---|
| Admin Dashboard | Administration | `lib/features/admin/presentation/screens/admin_dashboard_screen.dart` | User/system metrics, quick actions, audit/activity cards | `DashboardMetric`, `AuditLogEntry` | `AdminService`, `DashboardService` | `/admin/dashboard` | Charts |
| User Management | Administration | `lib/features/admin/presentation/screens/user_management_screen.dart` | Search, filters, user rows, status actions | `User`, `UserRole` | `UserRepository`, `AdminService` | `/admin/users` | Pagination |
| System Audit Logs | Administration | `lib/features/admin/presentation/screens/system_audit_logs_screen.dart` | Filter bar, log rows, status chips, detail expansion | `AuditLogEntry`, `AnalyticsFilter` | `AuditLogService` | `/admin/audit-logs` | Pagination/export if required |
| Create System Announcement | Administration | `lib/features/admin/presentation/screens/create_announcement_screen.dart` | Audience picker, title/body fields, scheduling, preview | `SystemAnnouncement`, `UserRole` | `AnnouncementService` | `/admin/announcements/new` | Date/time picker |
| Verify New Account | Administration | `lib/features/admin/presentation/screens/verify_new_account_screen.dart` | Applicant summary, document viewer, checklist, decision actions | `AccountVerification`, verification document | `VerificationService`, `AdminService` | `/admin/verifications/:id` | Secure document viewer |

### Existing screens to redesign in this batch

- **User Profile Management** should be a privileged admin screen derived from the existing profile components, not a replacement for self-service Profile.
- **System Announcements** can reuse notification cards but requires management controls and its own route.
- **System Settings** can reuse settings rows but requires system-level authorization and service-backed controls.

Suggested paths and routes:

| Screen | Suggested Flutter path | Models/services | Route |
|---|---|---|---|
| User Profile Management | `lib/features/admin/presentation/screens/user_profile_management_screen.dart` | `User`, `AccountVerification`; `UserRepository`, `AdminService` | `/admin/users/:id` |
| System Announcements | `lib/features/admin/presentation/screens/system_announcements_screen.dart` | `SystemAnnouncement`; `AnnouncementService` | `/admin/announcements` |
| System Settings | `lib/features/admin/presentation/screens/system_settings_screen.dart` | `SystemSetting`; `SystemSettingsService` | `/admin/settings` |

## Batch 9 — Integration, reachability, and visual verification

- Add role guards and safe unauthorized redirects.
- Verify Splash routes to the correct auth or role shell.
- Verify all bottom-navigation destinations preserve state.
- Verify every dashboard card, report action, notification, profile action, and settings action.
- Verify dialog dismissal, form cancellation, Android system back, and app-bar back.
- Add deep-link behavior for reports, assignments, verification requests, and password reset.
- Test permission denied/permanently denied flows for camera, photos, files, and location.
- Test loading, empty, offline, retry, error, and stale-data states.
- Run `flutter analyze`, unit tests, widget tests, and navigation reachability tests.
- Render representative phone sizes and compare every screen against Stitch.

## Safest implementation order

1. Architecture, model contracts, route map, role guards, and shared components.
2. Authentication and registration because every role depends on identity and role selection.
3. Citizen shell and the report lifecycle because it creates the core incident data.
4. Repair workflow because it consumes validated incident assignments.
5. Barangay validation, assignment, SLA, and verification.
6. Engineering dashboards, provider assignment, and analytics.
7. Utility provider acceptance and work views.
8. Administration, account verification, announcements, and system controls.
9. Cross-role navigation, accessibility, visual regression, and end-to-end testing.

## Approval gate

Do not start Flutter implementation until the screen inventory, role assumptions, proposed routes, package choices, and backend service boundaries in this plan have been approved.

