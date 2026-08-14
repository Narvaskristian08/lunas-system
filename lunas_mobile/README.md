# LUNAS Mobile

The LUNAS mobile app is the Flutter client for the implemented 25% citizen
reporting milestone and 50% official validation and routing milestone. It uses
the LUNAS backend as the source of truth: it does not generate demo incidents,
make local workflow decisions, or bypass backend role and jurisdiction checks.

This README covers the mobile platform only. For the overall delivery status,
see [the 25% milestone](../MILESTONE_25.md), [the 50% milestone](../MILESTONE_50.md),
and the [backend API contract](../lunas_backend/API_ENDPOINTS.md).

## Delivered scope

### 25%: citizen reporting

A public user can register only as a `citizen`, sign in, recover a password,
and manage their secure session. A signed-in citizen can:

- create a report with one JPG or PNG evidence image (up to 10 MB), a category,
  description, confirmed map location, barangay, and privacy acknowledgement;
- select an image from the photo library or capture one with the camera;
- use current location when permitted, or manually tap the map when it is not;
- review the report before uploading it to the backend;
- view their own reports, report details, evidence, and server-provided status
  history; and
- see the permitted reason when a report is rejected or marked as a duplicate.

The citizen workflow starts at `/citizen` and uses `/reports` routes. A citizen
cannot enter the official workspace through the mobile router, and the backend
also enforces that restriction.

### 50%: official validation and routing

The implemented official mobile workspace is available to these roles:

| Role | Mobile workspace | Scope enforced by backend |
| --- | --- | --- |
| `barangay_official` | Validation dashboard, queue, review, and decisions | Assigned barangay only |
| `city_engineer` | Validation dashboard, queue, review, and decisions | City-wide |
| `admin` | Validation dashboard, queue, review, and decisions | City-wide |
| `utility_provider` | Deliberately unavailable in mobile for this milestone | Routed incidents only on the backend |
| `repair_personnel` and other roles | Deliberately unavailable in mobile | No 25%/50% mobile workspace |

An eligible official can:

- view a live, server-scoped validation summary and submitted-report queue;
- search, filter, sort, refresh, and paginate the queue;
- review a report’s evidence, submitted location, status history, SLA data, and
  advisory duplicate candidates;
- validate a submitted report with priority, jurisdiction confirmation, and
  routing details;
- reject a submitted report with a required reason; or
- mark a submitted report as a duplicate with a required canonical report and
  reason.

The official workflow is limited to one of these state changes:

```text
submitted -> validated | rejected | duplicate
```

The backend performs the decision atomically. If another official has already
decided the same submitted report, the mobile app receives HTTP `409`, refreshes
the record, and shows the server’s current state. Routing records the responsible
organization; it does not create a work order or assign repair personnel.

The official workspace starts at `/official`. Its live validation routes are
`/official/validation` and `/official/validation/:id`.

## Architecture and key locations

```text
lib/
  core/
    config/api_config.dart              Runtime API URL configuration
    network/api_client.dart              Authenticated REST client and token refresh
    routes/app_router.dart               Role-aware navigation guards
    storage/secure_session_store.dart    Secure access/refresh-token storage
  features/
    auth/                               Citizen authentication and role policy
    reporting/                          Citizen report creation and report history
    maps/                               Map picker, GPS, and reverse geocoding
    validation/                         Official dashboard, queue, review, decisions
test/                                   Unit and widget tests
```

The app calls versioned backend endpoints under `/api/v1`. Relevant mobile
requests include:

- authentication: `/auth/register`, `/auth/login`, `/auth/refresh`,
  `/auth/forgot-password`, `/auth/reset-password`, and `/auth/me`;
- citizen reporting: `/incidents`, `/incidents/my`, `/incidents/:id`, and
  `/incidents/:id/history`;
- official validation: `/incidents/pending-validation`,
  `/incidents/:id/duplicate-candidates`, `/incidents/:id/sla`,
  `/incidents/:id/validate`, `/incidents/:id/reject`, and
  `/incidents/:id/mark-duplicate`; and
- official summary: `/stats/validation-summary`.

Refer to the backend API documentation for request bodies, authorization, and
error contracts. Do not treat navigation guards as the security boundary; every
API request must remain authorized by the backend.

## Prerequisites

Install or prepare the following before running the app:

- Flutter with a Dart SDK compatible with the project constraint (`^3.11.3`);
- Android Studio and an Android emulator/device, or Xcode and an iOS simulator/
  device on macOS;
- a reachable LUNAS backend with its MongoDB, authentication, and Supabase
  Storage configuration completed;
- at least one citizen test account and provisioned official test accounts;
- a Google Maps key for Android map testing; and
- a backend URL that includes `/api/v1`.

Public registration intentionally creates only citizen accounts. Create or seed
official accounts through the approved backend/admin process, with correct
barangay or organization fields, before testing official workflows.

## Configuration

### API base URL

`ApiConfig` reads the API endpoint from a compile-time Dart define:

```bash
--dart-define=LUNAS_API_BASE_URL=https://api.example.gov.ph/api/v1
```

The checked-in default is `http://10.0.2.2:5000/api/v1`, which is useful only
for an Android emulator reaching a backend on the development machine. Use a
reachable LAN or HTTPS URL for a physical device. For release-like testing,
prefer HTTPS; no clear-text traffic exception is committed to the Android app.

Never commit environment-specific endpoints or credentials.

### Android Google Maps key

The Android Gradle configuration reads, in order:

1. the `MAPS_API_KEY` Gradle property; or
2. the `GOOGLE_MAPS_API_KEY` environment variable.

For example, add the key to your user-level Gradle properties file rather than
this repository:

```properties
# ~/.gradle/gradle.properties
MAPS_API_KEY=replace-with-a-restricted-Android-key
```

Enable **Maps SDK for Android** for that key and restrict it to the Android
application ID/signing certificate used for the test build. The app’s Android
manifest already declares camera, coarse/fine location, and internet access.

### iOS maps and permissions

Camera, photo-library, and when-in-use location usage descriptions are present
in `ios/Runner/Info.plist`. Before testing the map picker on iOS, wire a
restricted iOS Google Maps SDK key into the native iOS configuration. The
checked-in Android Gradle key mechanism does not configure iOS automatically.

Use a separate restricted key per platform and keep it outside source control.

### Backend and storage requirements

The mobile app can load screens without local fixtures, but a complete report
submission needs the backend to accept multipart evidence and write it to its
configured storage provider. Before acceptance testing, verify that:

- the backend is running and the device can reach it;
- MongoDB is available;
- Supabase Storage credentials/bucket policy are configured for evidence;
- CORS and public/signed evidence URL behavior is correct for the backend’s
  intended clients; and
- official users have the correct role plus barangay/organization attributes.

## Setup and run

From the repository root:

```bash
cd lunas_mobile
flutter doctor
flutter pub get
flutter analyze
flutter test
```

Run against an Android emulator and a local backend:

```bash
flutter run \
  --dart-define=LUNAS_API_BASE_URL=http://10.0.2.2:5000/api/v1
```

Run against a shared test environment or physical device:

```bash
flutter run \
  --dart-define=LUNAS_API_BASE_URL=https://your-test-api.example.gov.ph/api/v1
```

Useful additional commands:

```bash
# List available emulators/devices.
flutter devices

# Run a specific test file.
flutter test test/auth_role_policy_test.dart
flutter test test/incident_report_test.dart
flutter test test/validation_models_test.dart

# Build only after the API and Maps configuration are set for the target.
flutter build apk --release \
  --dart-define=LUNAS_API_BASE_URL=https://your-test-api.example.gov.ph/api/v1
```

There is currently no `integration_test` suite. `flutter test` covers the
included unit/model/widget tests, not a live mobile-to-backend acceptance flow.

## Manual acceptance-test checklist

Use distinct, disposable test accounts and record the report number created by
each scenario. Complete this checklist against a real backend and storage
environment before signing off the 25% and 50% mobile work.

### Test environment and accounts

- [ ] Confirm the device can reach the configured `/api/v1` URL.
- [ ] Confirm the backend health, MongoDB, and evidence storage are operational.
- [ ] Confirm the Android Maps key is valid and restricted appropriately.
- [ ] For iOS testing, confirm an iOS Maps key is wired and the map renders.
- [ ] Prepare two citizen accounts, a same-barangay official, a different-
  barangay official, a city engineer, and an admin.
- [ ] Provision a `utility_provider` account for the unavailable-workspace test.
- [ ] Verify official users have the backend barangay/organization attributes
  expected by jurisdiction and routing rules.

### Authentication and session handling

- [ ] Register a new account and verify it is a `citizen`, never an official.
- [ ] Sign in as a citizen and verify the app opens `/citizen`.
- [ ] Sign in as a barangay official, city engineer, and admin; verify each
  opens `/official` rather than a citizen route.
- [ ] Sign in as a utility provider and verify the clear role-unavailable screen
  appears instead of the submitted-report validation queue.
- [ ] Verify an unsupported role also fails closed to the role-unavailable
  screen.
- [ ] Sign out and confirm the app returns to the sign-in flow and clears the
  local session.
- [ ] Restart the app after sign-in and verify a valid secure session restores.
- [ ] Exercise password-reset request and completion using a configured backend
  email/reset-token path.
- [ ] Expire or revoke a session in the backend and verify the app handles the
  resulting authorization failure safely.

### Citizen report creation (25%)

- [ ] Create a citizen report with a valid JPG evidence image, category,
  description, location, barangay, and privacy acknowledgement.
- [ ] Capture one report image with the camera and another from the photo
  library; verify each preview and review screen accurately reflect the file.
- [ ] Try an unsupported image type, an empty file, and an image over 10 MB;
  verify the app prevents submission with a useful message.
- [ ] Deny camera permission and verify the app reports the issue without
  crashing.
- [ ] Grant location permission and verify current-location centering, map pin,
  reverse-geocoded address, and submitted coordinates are correct.
- [ ] Deny location permission and verify a citizen can still tap the map to
  choose and confirm a location.
- [ ] Verify a report cannot continue without valid evidence, category,
  description, location, barangay, and privacy acknowledgement.
- [ ] Submit the report and verify it receives a real report number and initial
  `submitted` status from the backend.
- [ ] Open **My Reports**, the report detail, and its status history; verify the
  data is from the server and belongs only to the signed-in citizen.
- [ ] Test a network interruption during submission and verify the app gives a
  recoverable error rather than falsely presenting the report as submitted.

### Official queue and scope (50%)

- [ ] As the same-barangay official, verify the newly submitted report appears
  in the live validation queue.
- [ ] As a different-barangay official, verify the report does not appear and
  cannot be opened by manually navigating to its route.
- [ ] As a city engineer and admin, verify permitted city-wide submitted reports
  appear.
- [ ] Verify the dashboard counts match the server-scoped queue, not locally
  cached or fabricated data.
- [ ] Test search by report number and description.
- [ ] Test category, barangay, duplicate-candidate, and date filters.
- [ ] Test newest/oldest and priority sorting, plus next/previous page controls.
- [ ] Refresh the queue and verify a newly submitted matching report appears.
- [ ] Open a report and verify evidence, location/map, description, status
  history, duplicate candidates, and SLA information match backend data.
- [ ] Verify an unavailable/expired evidence URL produces a safe unavailable
  state rather than exposing a storage key or crashing.

### Validation, rejection, and duplicate decisions (50%)

- [ ] Validate one submitted report with a permitted priority, jurisdiction,
  responsible organization, responsible role, and routing reason.
- [ ] Confirm the action requires confirmation, prevents double submission, and
  changes the report to `validated` only after a successful server response.
- [ ] Verify assigned priority, jurisdiction, routing details, SLA deadline, and
  status-history event appear after validation.
- [ ] As the reporting citizen, verify the validated status appears in **My
  Reports** and the citizen timeline.
- [ ] Reject a different submitted report with a required reason and optional
  notes.
- [ ] As the reporting citizen, verify `rejected` and the permitted rejection
  reason are visible; verify internal official notes are not exposed.
- [ ] Create two similar reports and mark the later one as a duplicate of the
  correct canonical report with a required reason.
- [ ] Verify the backend rejects self-references or invalid/circular duplicate
  choices, and that the app surfaces the error safely.
- [ ] As the reporting citizen, verify `duplicate` and the permitted duplicate
  reason are visible.
- [ ] Open the same submitted report in two eligible official sessions. Make a
  decision in one, then attempt a decision in the other; verify the second
  request receives a conflict and the mobile app refreshes to the true status.
- [ ] Verify a decided report no longer presents validation action buttons.

### Authorization, privacy, and resilience

- [ ] As a citizen, try to access `/official` and an official validation URL;
  verify the router returns the citizen workspace.
- [ ] As an official, try to access `/citizen` and `/reports/new`; verify the
  router returns the official workspace.
- [ ] Confirm these client guards complement, rather than replace, backend
  authorization tests for direct API calls.
- [ ] Verify only the reporting citizen can read their report details and
  timeline.
- [ ] Verify evidence URLs are usable only as intended and no raw storage key is
  shown in the UI.
- [ ] Verify the privacy acknowledgement is explicit before upload and that a
  user sees the evidence warning before submitting an image.
- [ ] Put the device offline while loading the queue and while opening an
  incident; verify error states offer a safe retry path.
- [ ] Test on a small phone and a larger device, with text scaling enabled, to
  confirm forms, filters, and decision confirmations remain usable.

## Permissions and data handling

The app requests capabilities only when a user starts the relevant action:

| Capability | Purpose | Expected fallback |
| --- | --- | --- |
| Camera | Capture report evidence | Choose a photo from the library |
| Photo library | Choose report evidence | Use the camera, if permitted |
| Location | Center the map on the device | Tap the map manually |
| Internet | Authenticate and exchange report data | Show a recoverable network error |

Access and refresh tokens are stored through `flutter_secure_storage`. The app
attaches an access token to authenticated requests and makes one safe refresh
attempt after a `401` response. A failed refresh clears the local session.

Evidence is uploaded to the backend as multipart data. The app performs basic
file type and size validation and requires a privacy acknowledgement; the
backend remains authoritative for evidence acceptance and access control.

## Current limits and deferred mobile work

- The `utility_provider` mobile workspace is intentionally unavailable until
  routed-incident and work-order functionality is implemented.
- Repair assignment, repair updates, verification, closure, and operational
  escalation are deferred beyond the 50% milestone.
- The map picker does not claim or enforce an invented Dagupan boundary polygon;
  authoritative jurisdiction-boundary data remains a backend/data dependency.
- Android Maps configuration is included. iOS Maps SDK key wiring still needs
  to be supplied before iOS map acceptance testing.
- There is no automated live end-to-end mobile test suite yet; use the manual
  checklist above with real backend services.
- Files under historical design/catalog feature folders are not a substitute for
  the live routes listed in this README. Validate the actual citizen and
  official routes described above.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| The app cannot connect to the backend | Confirm `LUNAS_API_BASE_URL` includes `/api/v1`, the device can reach the host, and HTTPS/Android network policy is appropriate. |
| Android map is blank | Confirm the Maps SDK for Android is enabled, the key is present as `MAPS_API_KEY` or `GOOGLE_MAPS_API_KEY`, and restrictions match the test app. |
| iOS map does not load | Configure a restricted iOS Maps SDK key in the native iOS setup before testing. |
| Evidence upload fails | Verify backend multipart handling, storage credentials/bucket policy, image type/size, and device connectivity. |
| Official queue is empty | Confirm the account role and barangay/organization fields, that matching reports are still `submitted`, and that the backend scope permits access. |
| Decision shows a conflict | Another official has already decided the submitted report. Refresh the incident and use the server’s current state. |
| A user sees the role-unavailable screen | That role has no implemented mobile workspace in the 25%/50% scope; do not route it into a different role’s workflow. |

## Handoff checklist

Before declaring the mobile client ready for a milestone demonstration or
release candidate:

- [ ] `flutter analyze` passes.
- [ ] `flutter test` passes.
- [ ] The relevant Android/iOS Maps configuration is in place without committing
  keys.
- [ ] The backend, database, and evidence storage are live in the target test
  environment.
- [ ] Every applicable item in the manual acceptance checklist is completed.
- [ ] Known limitations are documented and accepted for the milestone.
