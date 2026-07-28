# LUNAS Stitch-to-Flutter Implementation Report

## Scope and classification rules

This report compares the 67 distinct screens visible in the supplied Stitch screenshots with the current Flutter application.

- ✅ **Already implemented** means the Flutter project contains a reusable foundation that can be retained without a screen redesign.
- 🟡 **Exists but needs redesign** means a screen, route, or partial workflow exists, but it does not yet cover the complete Stitch structure or has not been verified for exact visual parity.
- ❌ **Missing completely** means there is no dedicated Flutter screen or complete role-specific equivalent.

The screenshots are the design source of truth. Some canvas titles were truncated, so names below are normalized from the visible screen content.

## Summary

| Category | Result |
|---|---:|
| Stitch screens reviewed | 67 |
| Screen designs verified as exact | 0 |
| Screens with a partial Flutter equivalent | 20 |
| Screens without a dedicated equivalent | 47 |
| Existing Flutter screen files | 17 |
| Existing named routes | 17 |
| Existing service/repository layer | 0 |

No Flutter screen should currently be described as an exact Stitch implementation without a rendered side-by-side visual review. The project does, however, contain useful routing, theme, scaffold, form, and reporting foundations.

## ✅ Already implemented foundations

These are implementation assets rather than complete Stitch screens:

- Named-route navigation in `lib/app.dart`.
- A centralized theme and design-token layer.
- Shared app scaffold, app bar, bottom navigation, button, card, and text-field widgets.
- Reusable authentication form pieces.
- Reusable report form/status/history pieces.
- Responsive Flutter layout primitives in the existing feature screens.
- A forced light application theme, matching the supplied Stitch screens.

## Authentication and onboarding

| Stitch screen | Flutter equivalent | Status | Comparison |
|---|---|---|---|
| Splash | `lib/features/auth/presentation/screens/splash_screen.dart` | 🟡 | Route and screen exist; exact logo scale, loader, spacing, and timing state need visual alignment. |
| Login | `lib/features/auth/presentation/screens/login_screen.dart` | 🟡 | Form exists; must be matched to the Stitch card, social actions, hierarchy, and spacing. |
| Select Account Type | None | ❌ | Citizen/official account-type selection and explanatory content are absent. |
| Create Citizen Account | `lib/features/auth/presentation/screens/register_screen.dart` | 🟡 | Registration exists, but the Stitch multi-stage citizen flow and field grouping are incomplete. |
| Citizen Account Security | None | ❌ | Dedicated password/security step and requirement checklist are absent. |
| Citizen Registration Welcome | None | ❌ | Welcome/role-entry screen is absent. |
| Verify Contact | None | ❌ | Contact verification form and code flow are absent. |
| Select Official Role | None | ❌ | Official role cards and eligibility states are absent. |
| Official Identity Documents | None | ❌ | Document upload/review screen is absent. |
| Registration Submitted | None | ❌ | Submission receipt and review-status actions are absent. |
| Forgot Password | `lib/features/auth/presentation/screens/forgot_password_screen.dart` | 🟡 | Basic equivalent exists; exact confirmation and form states need redesign. |
| Reset Password | None | ❌ | Dedicated new-password and confirmation screen is absent. |

## Citizen application

| Stitch screen | Flutter equivalent | Status | Comparison |
|---|---|---|---|
| Citizen Dashboard | `lib/features/home/presentation/screens/home_screen.dart` / `lib/features/dashboard/presentation/screens/dashboard_screen.dart` | 🟡 | Existing summaries are not the complete Stitch citizen dashboard. |
| Citizen Home Overview | `lib/features/home/presentation/screens/home_screen.dart` | 🟡 | Partial cards/actions exist; priority actions, activity, and role-specific content need redesign. |
| Citizen Incident Map | `lib/features/maps/presentation/screens/map_screen.dart` | 🟡 | Screen exists, but the Stitch marker/filter/map-sheet experience is incomplete. |
| Report Hazard | `lib/features/reporting/presentation/screens/create_report_screen.dart` | 🟡 | Reporting form exists; exact Stitch sections, chips, map preview, and review progression differ. |
| Report Incident | `lib/features/reporting/presentation/screens/create_report_screen.dart` | 🟡 | Same underlying feature exists, but it must support the second visible reporting variant. |
| AI Hazard Detection | `lib/features/reporting/presentation/screens/photo_upload_screen.dart` and report widgets | 🟡 | Image input exists; dedicated AI result, confidence, and issue-state presentation is incomplete. |
| Confirm Report Details | Report form review state | 🟡 | Some information exists in the flow; there is no dedicated Stitch confirmation page. |
| Pin Location | `lib/features/reporting/presentation/screens/location_selection_screen.dart` | 🟡 | Location selection exists; exact full-map pinning and address confirmation need redesign. |
| My Reports | `lib/features/reporting/presentation/screens/report_history_screen.dart` | 🟡 | History exists; tabs, filters, cards, statuses, and empty states need Stitch parity. |
| Report Submitted | `lib/features/reporting/presentation/screens/report_status_screen.dart` | 🟡 | Status screen exists; receipt layout and next actions need redesign. |
| Report Details—Broken Streetlight | `lib/features/reporting/presentation/screens/report_details_screen.dart` | 🟡 | Detail equivalent exists; evidence, assignment, map, timeline, and action hierarchy differ. |
| Report Timeline | `lib/features/reporting/presentation/screens/report_details_screen.dart` | 🟡 | A partial status history can be reused; dedicated timeline treatment is not complete. |
| Repair Evidence Viewer | None | ❌ | Before/after media viewer, metadata, verification, and rating content are absent. |
| Report Resolved | `lib/features/reporting/presentation/screens/report_status_screen.dart` | 🟡 | Generic status exists; resolved summary, evidence, satisfaction, and citizen actions are incomplete. |
| My Draft Reports | None | ❌ | Draft persistence, draft list, empty state, and continue/delete actions are absent. |

## Repair-team application

| Stitch screen | Flutter equivalent | Status | Comparison |
|---|---|---|---|
| Repair Dashboard | None | ❌ | No repair-role home or workload dashboard. |
| Assigned Reports | None | ❌ | No repair assignment queue with tabs and priorities. |
| Work Order Details | None | ❌ | No repair-specific job detail workflow. |
| Navigate to Work Order | `lib/features/maps/presentation/screens/map_screen.dart` | 🟡 | Generic map exists; route-to-job map, distance, ETA, and job sheet are absent. |
| Start Work Order | None | ❌ | No start confirmation, timer, or safety checklist. |
| Update Work Progress | None | ❌ | No progress percentage, notes, status, or material update form. |
| Upload Repair Evidence | `lib/features/reporting/presentation/screens/photo_upload_screen.dart` | 🟡 | Generic photo selection exists; repair evidence requirements and before/after grouping are absent. |
| AI Image Quality Check | None | ❌ | No quality score, checks, warnings, or retake flow. |
| Confirm Repair Completion | None | ❌ | No completion checklist and evidence confirmation screen. |
| Repair Submitted Successfully | None | ❌ | No repair completion receipt screen. |
| Finished Repair Report | None | ❌ | No finished work summary with timeline and verification status. |
| Completed Work History | None | ❌ | No completed work list/history for repair personnel. |

## Barangay operations

| Stitch screen | Flutter equivalent | Status | Comparison |
|---|---|---|---|
| Incoming Reports | None | ❌ | No barangay triage feed. |
| Barangay Dashboard | None | ❌ | No barangay operational dashboard. |
| Incident Details | None | ❌ | No barangay-specific incident detail and action panel. |
| Validate Report | None | ❌ | No validation form or approve/reject workflow. |
| Assign Repair | None | ❌ | No team/provider assignment workflow. |
| SLA Monitoring | None | ❌ | No SLA metrics, breach cards, or deadline views. |
| Repair Verification | None | ❌ | No verification comparison, notes, or accept/reject actions. |
| Barangay Statistics | None | ❌ | No barangay chart and activity analytics screen. |

## City engineering

| Stitch screen | Flutter equivalent | Status | Comparison |
|---|---|---|---|
| Engineering SLA Dashboard | None | ❌ | No engineering SLA overview. |
| Engineering Dashboard | None | ❌ | No engineering role dashboard. |
| City Engineering Incident Dashboard | None | ❌ | No citywide incident metrics and filtered feed. |
| Infrastructure Analytics | None | ❌ | No infrastructure trend, heat map, or category analytics. |
| Engineering Repair/Incident Details | None | ❌ | No engineering-specific detail and intervention workflow. |
| Assign Repair Provider Dialog | None | ❌ | No provider selection dialog with availability/capacity. |
| Performance Reports | None | ❌ | No performance charts, comparison, or export workflow. |
| Engineering Incident Detail | None | ❌ | No engineering incident review with evidence and location context. |

## Utility provider

| Stitch screen | Flutter equivalent | Status | Comparison |
|---|---|---|---|
| Utility Dashboard | None | ❌ | No utility metrics, alerts, or work summary. |
| Utility Assigned Reports | None | ❌ | No provider assignment list. |
| Utility Incident Details | None | ❌ | No utility-specific incident detail and decision flow. |
| Accept Assignment Dialog | None | ❌ | No acceptance dialog, scheduling input, or rejection path. |

## Administration

| Stitch screen | Flutter equivalent | Status | Comparison |
|---|---|---|---|
| Admin Dashboard | None | ❌ | No administrative summary or quick actions. |
| User Management | None | ❌ | No searchable user directory and status actions. |
| System Audit Logs | None | ❌ | No audit-log filters, records, or detail view. |
| User Profile Management | `lib/features/profile/presentation/screens/profile_screen.dart` | 🟡 | Generic user profile exists; administrative review and account actions are absent. |
| Create System Announcement | None | ❌ | No announcement composer, targeting, or scheduling. |
| Verify New Account | None | ❌ | No official-account review and approval workflow. |
| System Announcements | `lib/features/notifications/presentation/screens/notifications_screen.dart` | 🟡 | Notifications can provide shared presentation, but announcement management is absent. |
| System Settings | `lib/features/settings/presentation/screens/settings_screen.dart` | 🟡 | User settings exist; system-wide controls, integrations, security, and destructive actions are absent. |

## Existing Flutter screens not represented as standalone Stitch canvases

| Flutter screen | Assessment |
|---|---|
| Notifications | Retain as a cross-role destination. Its content should use the same cards, tabs, read states, and role-aware notification model. |
| Profile | Retain as a shared destination, while separating self-service profile from admin user-management screens. |
| Settings | Retain for user preferences. Do not merge it with the separate Stitch System Settings screen. |
| Onboarding | Retain only if product requirements still require it; the supplied Stitch set uses welcome/account-selection screens instead of the current generic onboarding sequence. |

## Architectural gaps affecting implementation

- There is no service, repository, API-client, persistence, or domain-model layer in the inspected Flutter project.
- Current screens rely primarily on local widget state and fixture content.
- Role-aware routing and access control are absent.
- The report workflow has UI foundations but no confirmed end-to-end camera, AI analysis, map, assignment, SLA, or backend integration.
- Draft reports and resumable multi-step forms require local persistence.
- Dashboard and analytics designs require aggregate models and chart-ready data.
- Map screens require a selected map provider, permission handling, marker clustering, and geocoding.
- Official registration requires document upload, verification status, and secure identity handling.
- Admin operations require authorization checks and auditable service calls.

## Recommended interpretation

The current Flutter project is a useful citizen-facing prototype, not yet a complete implementation of the multi-role Stitch product. Existing widgets and route patterns should be reused, but most Stitch screens require new role-specific features. Backend behavior should be introduced behind interfaces so that visual implementation does not hard-code temporary data into screens.

