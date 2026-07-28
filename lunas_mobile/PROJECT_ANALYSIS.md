# LUNAS Mobile Project Analysis

## Overview

- Framework: Flutter with Material 3
- Application entry point: `lib/main.dart`
- Navigation: `MaterialApp` named routes and `Navigator`
- Active theme mode: light
- Available themes: `AppTheme.light` and `AppTheme.dark`
- State management in use: local widget state with `StatefulWidget`
- Declared but not currently used for application state/navigation:
  - `flutter_riverpod`
  - `go_router`
- No service, repository, API client, domain model, or persistence layer currently exists under `lib/`.

## Existing Screens

### Authentication

| Screen | Class | File | State |
|---|---|---|---|
| Splash | `SplashScreen` | `lib/features/auth/presentation/screens/splash_screen.dart` | Stateful; uses a timer before navigating to Onboarding |
| Onboarding | `OnboardingScreen` | `lib/features/auth/presentation/screens/onboarding_screen.dart` | Stateful; owns a `PageController` and current-page state |
| Login | `LoginScreen` | `lib/features/auth/presentation/screens/login_screen.dart` | Stateful; owns phone controller, focus node, form validation, and login feedback |
| Register | `RegisterScreen` | `lib/features/auth/presentation/screens/register_screen.dart` | Stateful; owns registration controllers, form validation, password visibility, and terms state |
| Forgot Password | `ForgotPasswordScreen` | `lib/features/auth/presentation/screens/forgot_password_screen.dart` | Stateful; owns email controller, validation, and reset feedback |

### Primary application

| Screen | Class | File | State |
|---|---|---|---|
| Home | `HomeScreen` | `lib/features/home/presentation/screens/home_screen.dart` | Stateless overview and entry point to notifications/reporting |
| Dashboard | `DashboardScreen` | `lib/features/dashboard/presentation/screens/dashboard_screen.dart` | Stateless operational metrics and incident stream |
| Notifications | `NotificationsScreen` | `lib/features/notifications/presentation/screens/notifications_screen.dart` | Stateful local read/unread tracking |
| Profile | `ProfileScreen` | `lib/features/profile/presentation/screens/profile_screen.dart` | Stateless identity, reputation, ledger, and wallet presentation |
| Settings | `SettingsScreen` | `lib/features/settings/presentation/screens/settings_screen.dart` | Stateful local settings toggles |
| Map | `MapScreen` | `lib/features/maps/presentation/screens/map_screen.dart` | Stateful active-layer selection and reporting/location navigation |

### Reporting

| Screen | Class | File | State |
|---|---|---|---|
| Create Report | `CreateReportScreen` | `lib/features/reporting/presentation/screens/create_report_screen.dart` | Stateful report form, category, photo reference, location, validation, and submission state |
| Report History | `ReportHistoryScreen` | `lib/features/reporting/presentation/screens/report_history_screen.dart` | Stateless fixture-backed report list |
| Report Details | `ReportDetailsScreen` | `lib/features/reporting/presentation/screens/report_details_screen.dart` | Stateless report detail; accepts an optional report ID through route arguments |
| Report Status | `ReportStatusScreen` | `lib/features/reporting/presentation/screens/report_status_screen.dart` | Stateless submission/status confirmation |
| Location Selection | `LocationSelectionScreen` | `lib/features/reporting/presentation/screens/location_selection_screen.dart` | Stateful local coordinate selection; returns a coordinate string |
| Photo Upload | `PhotoUploadScreen` | `lib/features/reporting/presentation/screens/photo_upload_screen.dart` | Stateful simulated capture/library selection; returns a local reference string |

## Existing Widgets

### Application-wide reusable widgets

| Widget | File | Purpose |
|---|---|---|
| `LunasAppScaffold` | `lib/core/widgets/lunas_app_scaffold.dart` | Shared app bar, responsive content width, padding, optional back button, floating action button, and bottom navigation |
| `LunasAppBar` | `lib/core/widgets/lunas_app_bar.dart` | Shared title/subtitle app bar with optional back navigation |
| `LunasBottomNavigation` | `lib/core/widgets/lunas_bottom_navigation.dart` | Home, Dashboard, Maps, Report, and Profile destinations |
| `LunasButton` | `lib/core/widgets/lunas_button.dart` | Gradient primary button with icon, loading, disabled, and expanded states |
| `LunasCard` | `lib/core/widgets/lunas_card.dart` | Tonal rounded card with optional tap handling |
| `LunasTextField` | `lib/core/widgets/lunas_text_field.dart` | Shared `TextFormField` wrapper for common field configuration |

### Authentication widgets

| Widget | Visibility | File | Purpose |
|---|---|---|---|
| `AuthLayout` | Public | `lib/features/auth/presentation/widgets/auth_layout.dart` | Responsive authentication scaffold with ambient visual treatment |
| `LunasBrand` | Public | Same file | Shared LUNAS brand mark |
| `AuthHeading` | Public | Same file | Auth eyebrow, title, and description block |
| `SecurityNotice` | Public | Same file | Security/privacy information panel |
| `_Glow` | Private | Same file | Ambient background glow |

### Reporting widgets

| Widget | Visibility | File | Purpose |
|---|---|---|---|
| `ReportSectionTitle` | Public | `lib/features/reporting/presentation/widgets/reporting_widgets.dart` | Reporting section title with optional trailing content |
| `ReportStatusChip` | Public | Same file | Semantic reporting/audit status |
| `ReportMetadataGrid` | Public | Same file | Responsive incident metadata layout |
| `AuditTimeline` | Public | Same file | Polygon/audit event timeline |
| `_TimelineEvent` | Private | Same file | Individual timeline event |

### Screen-local private widgets

| Feature | Private widgets |
|---|---|
| Home | `_SectionTitle`, `_PulseMetric`, `_ActivityRow` |
| Dashboard | `_DashboardMetric`, `_IncidentRow` |
| Notifications | `_NotificationRow` |
| Profile | `_ReputationMetric`, `_LedgerRow` |
| Settings | `_SettingSwitch` |
| Maps | `_MapCanvas` |
| Create Report | `_EmptyCapture`, `_InferencePreview` |

## Existing Routes

Navigation is configured in `lib/main.dart` using a `Map<String, WidgetBuilder>`.

| Route | Destination | Primary entry path |
|---|---|---|
| `/` | `SplashScreen` | Initial route |
| `/onboarding` | `OnboardingScreen` | Splash timer |
| `/login` | `LoginScreen` | Onboarding completion/skip or Settings sign-out |
| `/register` | `RegisterScreen` | Login |
| `/forgot-password` | `ForgotPasswordScreen` | Login |
| `/home` | `HomeScreen` | Successful Login or bottom navigation |
| `/dashboard` | `DashboardScreen` | Bottom navigation |
| `/notifications` | `NotificationsScreen` | Home or Dashboard app-bar action |
| `/profile` | `ProfileScreen` | Bottom navigation |
| `/settings` | `SettingsScreen` | Profile app-bar action |
| `/maps` | `MapScreen` | Bottom navigation |
| `/reports/new` | `CreateReportScreen` | Home report button or bottom navigation |
| `/reports/history` | `ReportHistoryScreen` | Create Report app-bar action |
| `/reports/details` | `ReportDetailsScreen` | Report History or Report Status |
| `/reports/status` | `ReportStatusScreen` | Successful local report submission |
| `/reports/location` | `LocationSelectionScreen` | Create Report or Map |
| `/reports/photo` | `PhotoUploadScreen` | Create Report |

### Navigation behavior

- Splash replaces itself with Onboarding after a timer.
- Onboarding replaces itself with Login.
- Successful Login clears the auth stack and opens Home.
- Shared bottom navigation uses replacement navigation between Home, Dashboard, Maps, Create Report, and Profile.
- Settings is nested under Profile.
- Notifications is nested under Home/Dashboard and displays a back button.
- Photo Upload and Location Selection return values through `Navigator.pop`.
- Report History can pass a report ID to Report Details through route arguments.

## Existing Services

### Implemented services

None.

There are currently no classes or directories implementing:

- Authentication services
- HTTP/API clients
- Repositories
- Local database or secure storage
- Camera service
- Photo-picker service
- Map provider integration
- Device location/geolocation service
- Notification service
- Blockchain/Polygon client
- IPFS client
- Report submission service
- User/profile service
- Analytics or logging service

### Current local substitutes

| Feature | Current behavior |
|---|---|
| Login | Validates the phone number, shows a SnackBar, and navigates to Home |
| Register | Validates locally and shows account-creation feedback |
| Forgot Password | Validates locally and shows reset feedback |
| Notifications | Stores read state in the screen's local `Set<int>` |
| Settings | Stores switch values in local widget state |
| Report submission | Validates locally, waits for a short artificial delay, then opens Report Status |
| Photo capture/upload | Simulates capture/library selection and returns `local://hazard-evidence` |
| Location | Calculates or resets a local coordinate string and returns it |
| Map | Uses a visual placeholder canvas and static markers rather than a map SDK |
| Report history/details | Uses hard-coded fixture content |
| Profile/wallet | Uses hard-coded presentation data and SnackBar placeholders |
| Dispatch action | Shows local queued feedback |

### Declared integration-related dependencies

- `flutter_riverpod` is declared but no providers or Riverpod application scope are implemented.
- `go_router` is declared but navigation currently uses `MaterialApp.routes` and `Navigator`.
- `flutter_svg` is declared but no SVG usage was found in `lib/`.
- `google_fonts` is declared; current shared theme primarily uses bundled Inter and Roboto Mono definitions.

## Theme and design infrastructure

Although not services or screens, the project contains these shared design files:

| File | Responsibility |
|---|---|
| `lib/core/theme/app_colors.dart` | Light and dark color constants |
| `lib/core/theme/text_styles.dart` | Inter and Roboto Mono text styles |
| `lib/core/theme/app_spacing.dart` | Shared spacing scale |
| `lib/core/theme/app_radius.dart` | Shared border radii |
| `lib/core/theme/app_theme.dart` | Light/dark Material theme construction |

The application currently forces `ThemeMode.light`, while `AppTheme.dark` remains defined.
