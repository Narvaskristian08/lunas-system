# LUNAS Mobile

The LUNAS mobile app is the Flutter client for citizen reporting and the
repair/maintenance personnel workflow.
It uses the LUNAS backend as the source of truth: it does not generate demo
incidents, make local workflow decisions, or bypass backend role and
jurisdiction checks.

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

The citizen workflow starts at `/citizen` and uses `/reports` routes. Web-only
role accounts cannot enter a citizen or repair workspace through the mobile
router, and the backend remains the source of truth for authorization.

### Web-only operational roles

The following roles remain available to the backend and Web Command Center but
do not have operational screens in the Flutter mobile app:

| Role | Mobile access | Web access |
| --- | --- | --- |
| `barangay_official` | Web-only message | Allowed |
| `city_engineer` | Web-only message | Allowed |
| `utility_provider` | Web-only message | Allowed |
| `admin` | Web-only message | Allowed |
| `repair_personnel` | Repair dashboard and field workflow | If applicable |
| Other roles | Unavailable | Backend policy |

Validation, routing, assignment, SLA, verification, and administration remain
backend/web responsibilities. The mobile client intentionally does not expose
their queues, dashboards, decisions, or deep links.

### Repair / maintenance personnel
An authenticated `repair_personnel` account starts at `/repair`. The server
scopes every dashboard count, list record, detail record, and action to the
current personnel assignment. The mobile workspace supports live work-order
summary/list/detail, accept/decline/start actions, append-only progress at
`25`, `50`, `75`, or `100`, explicit optional field location, and JPG/PNG
field evidence while repair is in progress.

Citizens also see only the server-provided high-level repair state on their
own reports: assigned for repair, in progress, 25/50/75% progress, or 100%
awaiting verification. Personnel details, reassignment notes, field evidence,
and internal SLA notes are not shown in that citizen view.

At `100%`, the app records only that the repair is ready for formal completion
verification. It has no verification, approval, closure, AI-quality, or fake
completion route, and it never starts background personnel location tracking.

The live repair routes are `/repair`, `/repair/work-orders`,
`/repair/work-orders/:id`, and the ID-scoped `start`, `progress`, `evidence`,
and `location` routes beneath that work order.

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
    repair/                             Repair models, API service, and field workflow
test/                                   Unit and widget tests
```

The app calls versioned backend endpoints under `/api/v1`. Relevant mobile
requests include:

- authentication: `/auth/register`, `/auth/login`, `/auth/refresh`,
  `/auth/forgot-password`, `/auth/reset-password`, and `/auth/me`;
- citizen reporting: `/incidents`, `/incidents/my`, `/incidents/:id`, and
  `/incidents/:id/history`;
- repair workflow: `/dashboard/work-orders-summary`, `/work-orders/my`,
  `/work-orders/:id`, and the `accept`, `decline`, `start`, `progress`, and
  `evidence` actions beneath a work order.

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
- at least one citizen and one `repair_personnel` test account; web-only role accounts may be used for access-boundary checks;
- a Google Maps key for Android map testing; and
- a backend URL that includes `/api/v1`.

Public registration intentionally creates only citizen accounts. Create or seed
web-only role accounts through the approved backend/admin process, with correct
barangay or organization fields, before testing Web Command Center workflows.
Citizen registration is completed through the email-code screen; the backend
does not issue or store a mobile session until that challenge succeeds.

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

For the AWS migration environment, use the EC2 Nginx endpoint while testing:

```bash
flutter run \
  --dart-define=LUNAS_API_BASE_URL=http://<ec2-public-host>/api/v1
```

This HTTP URL is temporary. A production device build requires a stable HTTPS
domain and matching backend CORS configuration.

Never commit environment-specific endpoints or credentials.

### OpenStreetMap and location permissions

Citizen report selection and repair work-location maps use `flutter_map` with
OpenStreetMap raster tiles. No Google Maps key or billing account is required.
The Maps navigation tab opens the same OpenStreetMap screen for browsing.

Visible attribution links to OpenStreetMap's copyright page. Requests identify
LUNAS, use the library's HTTP-header-aware cache (64 MB soft limit), and request
only visible tiles. Do not add bulk/offline downloads from the public tile server.
Public tiles have no uptime guarantee; choose a dedicated tile provider before
a large rollout. See https://operations.osmfoundation.org/policies/tiles/.

The optional `LUNAS_MAP_TILE_URL` build define selects a compatible XYZ tile
endpoint. Review its usage policy and attribution before changing providers.
GPS still requires device permission and location services. Android and iOS
retain their existing camera, photo-library, and location permissions.

### Backend and storage requirements

The mobile app can load screens without local fixtures, but a complete report
submission needs the backend to accept multipart evidence and write it to its
configured storage provider. Before acceptance testing, verify that:

- the backend is running and the device can reach it;
- MongoDB is available;
- the backend's EC2 role can access the private AWS S3 evidence bucket;
- CORS and public/signed evidence URL behavior is correct for the backendâ€™s
  intended clients; and
- official users have the correct role plus barangay/organization attributes.

## Setup and run

From the repository root:

```bash
cd lunas_mobile
flutter doctor
flutter pub get
flutter run --dart-define=LUNAS_API_BASE_URL=http://10.0.2.2:5000/api/v1
```

`10.0.2.2` reaches the host machine from an Android emulator. Use a reachable
LAN/HTTPS URL for a physical device and the appropriate simulator URL for iOS.
Set Google Maps and other optional integrations in their documented platform
configuration. Do not include service secrets in a mobile build.

## Citizen workflow

- Public registration creates a Citizen account only; the configured
  registration verification flow must be completed before use.
- Citizens create reports with supported category, description, location, and
  evidence; then view only their own reports, safe evidence, status history,
  permitted clarification/rejection details, and final result.
- A 100% repair update does not appear as final resolution. City Engineering
  must complete final verification first.

## Repair Personnel workflow

- Authorized accounts are provisioned through the Admin web account process;
  there is no public privileged-role picker.
- Repair Personnel see assigned work only, and can review instructions, accept
  or decline assignment, start work, update progress, attach supporting
  evidence, submit final post-maintenance evidence with completion, and review
  provider correction instructions/history.
- Completion awaits Utility Provider review and then City Engineering final
  verification. It never closes the Citizen's report by itself.

## API and security

The Express API is the source of truth for account role, citizen ownership,
organization, assignment, and incident/work-order transitions. Client route
guards are not a security boundary. Evidence upload and signed retrieval
require the backend storage configuration. Optional AI output is advisory and
may be unavailable when the service/model is not configured.

## Checks

```bash
flutter analyze
flutter test
```

Run these on a Flutter-enabled machine. Full mobile-to-backend acceptance also
requires a running API, MongoDB, configured evidence storage, and a reachable
device URL. See the [root setup and demo guide](../README.md).

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
flutter test test/repair_models_test.dart

# Build only after the API and Maps configuration are set for the target.
flutter build apk --release \
  --dart-define=LUNAS_API_BASE_URL=https://your-test-api.example.gov.ph/api/v1
```

There is currently no `integration_test` suite. `flutter test` covers the
included unit/model/widget tests, not a live mobile-to-backend acceptance flow.

## Manual acceptance-test checklist

Use distinct, disposable test accounts and record the report/work-order number
created by each scenario. Complete this checklist against a real backend and
storage environment before signing off the applicable mobile work.

### Test environment and accounts

- [ ] Confirm the device can reach the configured `/api/v1` URL.
- [ ] Confirm the backend health, MongoDB, and evidence storage are operational.
- [ ] Confirm the Android Maps key is valid and restricted appropriately.
- [ ] For iOS testing, confirm an iOS Maps key is wired and the map renders.
- [ ] Prepare citizen and `repair_personnel` test accounts.
- [ ] Keep web-only role accounts available for backend/Web Command Center tests;
  they must show the mobile Web Command Center message.

### Authentication and session handling

- [ ] Register a new account, enter its email verification code, and verify it
      becomes a `citizen`, never an official. Confirm no authenticated session
      exists before the code succeeds.
- [ ] Sign in as a citizen and verify the app opens `/citizen`.
- [ ] Sign in as a Barangay Official, City Engineering, Utility Provider, or
  Administrator account and verify the clear Web Command Center message appears.
- [ ] Verify no web-only role is redirected to a citizen or repair route.
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

### Backend/web role boundary

- [ ] Confirm validation, routing, assignment, SLA, verification, and admin
  workflows remain available through the backend/Web Command Center.
- [ ] Confirm the mobile client has no official queue, decision, or management route.

### Repair personnel workflow (75%)

- [ ] Sign in as an active `repair_personnel` account and verify it opens
  `/repair`; it must not reach citizen or official routes.
- [ ] Verify the dashboard summary and task list contain only server-assigned
  work orders for that account, including pagination and status filtering.
- [ ] Open a work order and verify incident evidence, incident map pin,
  assignment state, SLA deadline/warning, repair evidence, and progress history
  match the server response.
- [ ] Accept a pending assignment, then start it; verify a stale action receives
  a conflict and the client reloads the current record.
- [ ] Decline a pending assignment without a reason (must fail), then with a
  reason (must persist and remove it from the assignee's active list).
- [ ] Record an allowed next milestone with its required stage; confirm the app
  rejects a lower/equal or non-discrete percentage before claiming success.
- [ ] Add a field location only through an explicit progress action and verify
  denying permission does not block the update.
- [ ] Upload a valid JPG/PNG image while repair is in progress; verify it
  appears from the server after refresh and a failed upload is not presented as
  successful.
- [ ] Record `100%` with a meaningful note and verify the app shows only the
  ready-for-completion state, with no verify, approve, or close control.

### Authorization, privacy, and resilience

- [ ] As a citizen, verify `/citizen` and `/reports/new` remain available.
- [ ] As a repair person, verify `/repair` and `/repair/work-orders` remain available.
- [ ] As a web-only role, verify the app stays on `/role-unavailable` with the
  Web Command Center message.
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

- Utility Provider, Barangay Official, City Engineering, and Administrator
  operational workspaces are intentionally web-only in this mobile client.
- Formal repair verification, approval, closure, reassignment management, and
  operational escalation remain outside the 75% mobile workflow.
- The map picker does not claim or enforce an invented Dagupan boundary polygon;
  authoritative jurisdiction-boundary data remains a backend/data dependency.
- Android Maps configuration is included. iOS Maps SDK key wiring still needs
  to be supplied before iOS map acceptance testing.
- There is no automated live end-to-end mobile test suite yet; use the manual
  checklist above with real backend services.
- Files under historical design/catalog feature folders are not a substitute for
  the live routes listed in this README. Validate the actual citizen, official,
  and repair routes described above.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| The app cannot connect to the backend | Confirm `LUNAS_API_BASE_URL` includes `/api/v1`, the device can reach the host, and HTTPS/Android network policy is appropriate. |
| Map tiles do not load | Check internet access, tile-provider availability, and the optional `LUNAS_MAP_TILE_URL` build define. No Google key is needed. |
| Current position is missing | Enable GPS and grant location permission. Manual pin selection remains available. |
| Evidence upload fails | Verify backend multipart handling, storage credentials/bucket policy, image type/size, and device connectivity. |
| Official queue is empty | Confirm the account role and barangay/organization fields, that matching reports are still `submitted`, and that the backend scope permits access. |
| Decision shows a conflict | Another official has already decided the submitted report. Refresh the incident and use the serverâ€™s current state. |
| A user sees the role-unavailable screen | That role has no implemented mobile workspace; do not route it into a different roleâ€™s workflow. |

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


## Current image privacy scope (Revision 9)

Uploaded evidence is normalized and sent through the backend privacy detector before
storage. Face and license-plate regions are blurred in the backend, and only the
redacted WebP is stored. The backend fails closed when the privacy detector is
unavailable, so an unredacted new upload is not persisted. EXIF/GPS metadata stripping,
SHA-256 checksums, private storage, signed URLs, access controls, and required
acknowledgements remain in scope. Historical privacy fields are retained for
compatibility; legacy images may still report `not_available`. Location
confirmation remains separate from image privacy processing.

## Revision 8 location confirmation

The report map supports GPS and manual map pins. Reopening a previously selected pin preserves it instead of replacing it with the current position. The current fix and horizontal accuracy are used transiently for advisory comparison against the chosen damage location. Map changes and refreshed fixes recalculate comparison; final review rechecks freshness every five seconds and before submission. The server publishes configurable policy settings and recomputes the final result.

Citizens always confirm that the pin represents the actual damage location. A significant discrepancy requires an explanation, including an earlier photo or reporting from home; Other requires 10-500 characters. GPS denial, missing fixes, stale fixes, and poor accuracy allow manual reporting without an accusation. Camera and photo-library uploads remain available. Geographic barangay containment is unverified; the canonical selector and human verification remain required. GPS does not establish photo capture location. Evidence privacy redaction is handled by the backend before storage.

Location tests use controlled fixes and injected services; they are not live GPS, map SDK, or device verification. See [Revision 8 verification](../REVISION_8_LOCATION_INTEGRITY_REPORT.md).
