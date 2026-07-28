# LUNAS Final Flutter Review

## Review scope

The complete Flutter UI was reviewed against the supplied Google Stitch screenshots and the previously documented Stitch screen inventory. The review covered all current Flutter screens, shared design tokens, reusable components, named routes, responsive layout behavior, and visible loading/empty/success/error states.

No working form validation, timers, local switch state, route-result behavior, submission delay, GPS coordinate calculation, report selection, notification read state, or logout behavior was removed.

## Final verification

- Dart files formatted successfully.
- `flutter analyze` result: **No issues found**.
- Every named route referenced by a screen is registered.
- Unknown routes now display a recoverable error page.
- Light mode remains the application default, matching the Stitch designs.

## Visual-system corrections

### Colors

- Updated the primary brand color to the Stitch-aligned LUNAS blue `#005EA8`.
- Updated the light application background to `#F7F9FC`.
- Retained consistent green, amber, red, and blue semantic colors for success, warning, critical, and information states.
- Standardized selected chips, navigation indicators, unread cards, icon containers, and status surfaces to use semantic colors with controlled opacity.

### Typography

- Retained the bundled Inter family throughout the application.
- Standardized app-bar titles with stronger weight and tighter letter spacing.
- Standardized page headings, section headings, card titles, labels, captions, and metric values through the shared theme.
- Retained Roboto Mono only for technical identifiers and timeline metadata where already used.

### Spacing and responsiveness

- Standardized the 4/8/12/16/20/24/32/48/64 spacing scale.
- Added reduced horizontal padding for screens below 360 logical pixels.
- Increased the shared content constraint to support tablet-width dashboard layouts without stretching content excessively.
- Converted the report success screen to a scrollable responsive layout.
- Retained responsive `Wrap`, `LayoutBuilder`, constrained-width, and horizontal-scroll behavior for metric grids, filters, charts, forms, maps, and navigation.

### Border radius and shadows

- Standardized cards to a 16px radius.
- Retained 12px field and button radii.
- Added a shared subtle card shadow and outline.
- Added a separate elevated shadow token for high-emphasis surfaces.
- Removed inconsistent large card radii from the shared component layer.

### Icons

- Normalized Material rounded/outlined icons by purpose:
  - outlined icons for inactive/navigation and descriptive states;
  - rounded filled icons for selected, success, GPS, and primary actions;
  - semantic colors for warnings, alerts, verification, and errors.
- Preserved the existing LUNAS logo asset in authentication branding.

## Shared-component review

The following reusable component groups now provide the visual structure across the project:

- `LunasAppScaffold`
- `LunasAppBar`
- `LunasBottomNavigation`
- `LunasButton`
- `LunasCard`
- `LunasTextField`
- `LunasStateView`
- Authentication layout, branding, security notice, social/outline actions, and OTP inputs
- Dashboard section headers, summary cards, quick actions, and report cards
- Reporting status chips, category tiles, metadata grids, and timelines
- Map canvas, map markers, nearby-report cards, and marker-detail sheet
- Notification data model and notification cards
- Analytics layout, metrics, bar charts, line charts, donut charts, and performance rows
- Profile avatar, profile menu tiles, and settings switches

The notification-only empty-state widget was removed and replaced with the shared `LunasStateView`.

## Application-state review

### Loading states

- Buttons support a shared inline loading indicator.
- Registration/profile/report update flows retain their asynchronous loading behavior.
- `LunasStateView` provides a full-page loading presentation for future service-backed screens.
- Splash retains its loading indicator and timed navigation.

### Empty states

- Notifications use the shared empty state.
- Report and analytics list structures support empty content without layout failure.
- `LunasStateView` provides a consistent empty state for future backend-filter results.

### Success states

- Report submission now uses the shared success-state presentation.
- Profile update, report update, password reset, OTP resend, location acquisition, draft save, and other local actions retain success feedback.

### Error states

- Existing form validators and submission requirements remain active.
- Missing report photos, incomplete OTP codes, invalid credentials/form values, and missing terms acceptance retain error feedback.
- Unknown navigation destinations now display a shared error state with a safe Return Home action.

## Screen review by module

### Authentication

- Splash: spacing, branding, loader, and narrow-screen behavior normalized.
- Onboarding: consistent illustration containers, pagination indicators, headings, and actions.
- Login: responsive form, Stitch-aligned hierarchy, social alternatives, recovery, and registration navigation.
- Register: shared form styling, validation, terms, verification navigation, and privacy notice.
- OTP Verification: six responsive inputs, timer, resend feedback, and reset navigation.
- Forgot Password: verified-email validation and OTP transition.
- Reset Password: secure inputs, matching validation, success feedback, and login return.

### Home and Dashboard

- Home: citizen greeting, report CTA, summary metrics, quick actions, and recent reports.
- Dashboard: community response, priority update, report metrics, recent activity, and quick actions.
- Main and bottom navigation: consistent icons, labels, selected styling, safe-area handling, and route replacement.
- Analytics is now reachable from the Dashboard app bar.

### Reports

- Report List: filters, semantic statuses, responsive cards, and report-detail navigation.
- Report Details: metadata, description, timeline, and edit navigation.
- Create Report: image, category, description, location, draft, validation, loading, and submission states.
- Edit Report: preserved form values, validation, media action, category selection, and save state.
- Upload Images: capture/gallery simulation, retake, preview, and return value.
- Report Status: responsive shared success state, timeline, details, and Home actions.
- Categories: reusable category rows and selected state.

### Maps and Location

- Incident Map: filters, nearby reports, custom map rendering, markers, and GPS feedback.
- Marker Details: reusable bottom sheet and report-detail route.
- Select Location: search field, GPS state, tap-to-coordinate logic, responsive map height, and selected address.
- Location Confirmation: confirm/adjust actions and preserved return value to Create Report.

### Notifications

- Notification List: unread states, semantic icons, filters, and mark-all-read logic.
- Notification Details: responsive detail metadata and linked report action.
- Activity Feed and Alerts: reachable through filter navigation.
- Empty results now use the shared empty state.

### Analytics

- Statistics, Charts, Reports Dashboard, Trends, and Performance Summary are connected through shared analytics navigation.
- Charts use reusable native Flutter painters and progress widgets.
- Metric grids adapt from two to four columns based on width.
- No additional chart dependency was introduced.

### Profile and Settings

- Profile: verified citizen identity, edit action, and account navigation.
- Edit Profile: responsive validated form and loading/success feedback.
- Account: personal and contact information with edit navigation.
- Security: biometric/login-alert preferences, password reset, and device information.
- Preferences: notification, appearance, and language settings.
- About: version, product information, policies, and licenses.
- Help: search, FAQs, and support feedback.
- Existing sign-out behavior remains unchanged.

## Navigation review

The application contains 34 registered named routes covering:

- authentication and recovery;
- Home, Dashboard, Map, Reports, and Profile bottom navigation;
- report creation, history, detail, edit, categories, status, media, and location flows;
- notifications and notification details;
- analytics overview, charts, report dashboard, trends, and performance;
- Profile, Edit Profile, Settings, Account, Security, Preferences, About, and Help.

Verified key paths:

- Splash → Onboarding → Login → Home
- Login → Forgot Password → OTP → Reset Password → Login
- Register → OTP Verification
- Home/Dashboard → Create Report, Report List, Report Details, Map, Notifications
- Create/Edit Report → Categories, Images, Location → Confirmation
- Report submission → Success → Details or Home
- Map marker → Marker Details → Report Details
- Notification → Notification Details → Report Details
- Dashboard → Analytics → all analytics tabs
- Profile → Edit Profile and all Settings pages
- Settings → Sign Out → Login

## Remaining issues and integration dependencies

These items require backend/product integrations and were intentionally not fabricated during the UI review:

- Authentication is currently local UI behavior; no production authentication service, session persistence, or OTP provider is connected.
- Report creation uses local simulated delays and fixture content; no confirmed API submission, draft repository, or media upload service exists.
- Image capture/gallery actions are simulated and require camera/image-picker integration.
- Maps and GPS use the existing simulated coordinate/map behavior; a production map SDK, permission workflow, geocoding, and live marker service are still required.
- Notifications use in-memory fixture data; push notifications, persistence, pagination, and deep links require a notification service.
- Analytics uses fixture values; backend aggregation, filtering, date ranges, export, and live refresh remain to be connected.
- Profile and settings are local UI state; account updates, device management, biometric authentication, support requests, and preference persistence require services.
- The supplied screenshots are composite canvas exports. A final pixel-level QA pass should use individual full-resolution Stitch screen exports at target device sizes.
- Automated widget, navigation, accessibility, golden-image, and end-to-end tests are not currently present in the project.

## Recommended next step

Connect the existing screens to approved service/repository interfaces one module at a time, beginning with authentication and report submission. After backend contracts are available, add widget and golden tests for representative phone widths before release.
