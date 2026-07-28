# LUNAS Screen Gap Analysis

## Status Legend

- ✅ **Already implemented** — a matching Flutter screen or design-system implementation exists.
- 🟡 **Needs redesign** — a Flutter implementation exists, but it lacks a direct Stitch design match, theme parity, or complete visual alignment.
- ❌ **Missing completely** — Stitch defines a navigable UI screen with no corresponding Flutter implementation.

## Summary

| Status | Count | Meaning |
|---|---:|---|
| ✅ Already implemented | 6 Stitch entries | Four generated light UI screens plus the light palette and product-reference outcomes |
| 🟡 Needs redesign | 3 Stitch/theme entries | Dark variants and dark reference tokens exist, but dark mode is not reachable because the app forces light mode |
| ❌ Missing completely | 0 | Every named generated Stitch screen has a Flutter implementation |

The Stitch project contains nine exposed entries:

- Six generated UI screens
- Two color reference boards
- One product reference board

Maps and Report each have light and dark Stitch variants that map to one theme-aware Flutter screen rather than separate Dart screens.

## Stitch-to-Flutter Comparison

### Operations Dashboard

| Stitch screen | Flutter implementation | Status | Notes |
|---|---|---|---|
| Dashboard (Light) | `DashboardScreen` in `lib/features/dashboard/presentation/screens/dashboard_screen.dart` | ✅ Already implemented | Includes global standing, reliability, grid density, SLA countdown, verified events, and incident stream. |

### Maps and Dispatch

| Stitch screen | Flutter implementation | Status | Notes |
|---|---|---|---|
| Maps (Light) | `MapScreen` in `lib/features/maps/presentation/screens/map_screen.dart` | ✅ Already implemented | Includes HUD controls, layers, incident selection, metrics, dispatch action, and audit timeline. |
| Maps (Dark) | Same `MapScreen` with `AppTheme.dark` | 🟡 Needs redesign | Dark theme infrastructure exists, but `ThemeMode.light` prevents this visual variant from being reached or verified in the running app. |

### Incident Reporting

| Stitch screen | Flutter implementation | Status | Notes |
|---|---|---|---|
| Report (Light) | `CreateReportScreen` and reporting flow under `lib/features/reporting/` | ✅ Already implemented | Includes evidence preview, inference state, privacy masking, metadata, category, description, location, and submission. |
| Report (Dark) | Same reporting flow with `AppTheme.dark` | 🟡 Needs redesign | Dark theme infrastructure exists, but the forced light theme prevents runtime parity testing against Stitch. |

### Sentinel Identity

| Stitch screen | Flutter implementation | Status | Notes |
|---|---|---|---|
| Profile (Light) | `ProfileScreen` in `lib/features/profile/presentation/screens/profile_screen.dart` | ✅ Already implemented | Includes identity, rank, Polygon ID, credibility, reputation metrics, ledger, and wallet presentation. |

### Design and Product References

| Stitch entry | Flutter implementation | Status | Notes |
|---|---|---|---|
| LUNASLIGHTMODE.png | `AppColorsLight` and `AppTheme.light` | ✅ Already implemented | The application currently uses light mode. |
| LUNASDARKMODE.png | `AppColorsDark` and `AppTheme.dark` | 🟡 Needs redesign | Tokens exist, but dark mode is not currently selectable or active. |
| LUNAS.png | Product direction distributed across Dashboard, Maps, Reporting, Profile, and technical UI language | ✅ Already implemented | This is a product brief, not a navigable screen. No dedicated Flutter page is expected. |

## ✅ Already Implemented

The following generated Stitch experiences have matching Flutter implementations:

1. Dashboard (Light)
2. Maps (Light)
3. Report (Light)
4. Profile (Light)

The following reference outcomes are also represented:

5. Light theme palette from LUNASLIGHTMODE.png
6. Shared product vocabulary and technical content from LUNAS.png
### Related Flutter screens that extend the Stitch flows

These screens are not separate named Stitch screens, but support the implemented Stitch experiences:

- Report History
- Report Details
- Report Status
- Location Selection
- Photo Upload

They extend the single Stitch Report design into a usable multi-screen Flutter flow.

## 🟡 Needs Redesign

### Direct Stitch parity work

#### Maps dark mode

- Flutter file: `lib/features/maps/presentation/screens/map_screen.dart`
- Theme source: `lib/core/theme/app_theme.dart`
- Gap: the app forces `ThemeMode.light`, so Maps (Dark) cannot be reached.
- Needed:
  - Add a functional theme selector or restore system theme selection.
  - Compare the live dark screen against Maps (Dark).
  - Verify map surfaces, incident card contrast, filter chips, markers, audit rail, and bottom navigation.

#### Report dark mode

- Flutter files: `lib/features/reporting/presentation/screens/`
- Theme source: `lib/core/theme/app_theme.dart`
- Gap: Report (Dark) cannot be reached while the app forces light mode.
- Needed:
  - Activate theme switching.
  - Verify inference preview, privacy chips, metadata cards, fields, category control, CTA, and network footer.
  - Confirm semantic alert/error colors match the Stitch dark design.

#### Dark reference palette

- Flutter files:
  - `lib/core/theme/app_colors.dart`
  - `lib/core/theme/app_theme.dart`
- Gap: the dark theme is defined but not exposed to users.
- Needed:
  - Connect the existing Settings screen to application-level theme state.
  - Persist the selected theme when a persistence service exists.
  - Validate every primary destination in dark mode.

### Flutter-only screens without a direct Stitch design

These screens exist and work, but cannot be considered exact Stitch matches because the Stitch project contains no corresponding named design.

#### Authentication module

| Flutter screen | Status | Reason |
|---|---|---|
| Splash | 🟡 Needs redesign | No Splash screen exists in Stitch. |
| Onboarding | 🟡 Needs redesign | No Onboarding screen exists in Stitch. |
| Login | 🟡 Needs redesign | No Login screen exists in Stitch. |
| Register | 🟡 Needs redesign | No Register screen exists in Stitch. |
| Forgot Password | 🟡 Needs redesign | No Forgot Password screen exists in Stitch. |

These screens currently follow the shared LUNAS design system, but they need dedicated Stitch references for pixel-level validation.

#### Primary application extensions

| Flutter screen | Status | Reason |
|---|---|---|
| Home | 🟡 Needs redesign | Stitch defines Dashboard as the operational landing screen, not a separate Home design. |
| Notifications | 🟡 Needs redesign | No Notifications design exists in Stitch. |
| Settings | 🟡 Needs redesign | Profile contains interface parameters, but Stitch does not expose a separate Settings screen. |

#### Reporting extensions

| Flutter screen | Status | Reason |
|---|---|---|
| Report History | 🟡 Needs redesign | No separate history design exists in Stitch. |
| Report Details | 🟡 Needs redesign | No separate details design exists in Stitch. |
| Report Status | 🟡 Needs redesign | No separate status design exists in Stitch. |
| Location Selection | 🟡 Needs redesign | No dedicated location-picker design exists in Stitch. |
| Photo Upload | 🟡 Needs redesign | The Stitch Report screen includes evidence capture, but no separate upload/camera page. |

These reporting screens reuse the visual vocabulary of Report and Maps, but dedicated designs would remove layout and content ambiguity.

## ❌ Missing Completely

None.

Every named, generated UI screen exposed by the Stitch project has a corresponding Flutter implementation:

- Dashboard (Light)
- Maps (Light)
- Maps (Dark) through the shared dark theme
- Report (Light)
- Report (Dark) through the shared dark theme
- Profile (Light)

The remaining Stitch entries are reference boards and should not be implemented as routes.

## Recommended Next Actions

1. Add application-level theme state and expose Light, Dark, and System options in Settings.
2. Run visual comparison for Maps and Report in dark mode.
3. Create dedicated Stitch designs for authentication screens.
4. Decide whether Home should remain separate or Dashboard should become the authenticated landing destination.
5. Create dedicated Stitch designs for Notifications and Settings.
6. Create detailed Stitch screens for the extended reporting flow if exact pixel parity is required.

## Important Distinction

“Needs redesign” does not mean the Flutter screen is missing or nonfunctional. It means one of the following:

- The matching Stitch variant is not reachable in the current theme configuration.
- The Flutter screen was derived from the shared design system without a dedicated Stitch screen.
- Exact visual comparison is not possible with the currently exposed Stitch project.
