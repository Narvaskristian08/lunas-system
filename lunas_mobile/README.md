# LUNAS Mobile

Flutter application for the two mobile roles only: **Citizen** and **Repair
Personnel**. Cross-platform authority, role responsibilities, and workflow
states are defined in the [current project scope](../LUNAS_PROJECT_SCOPE.md).

## Run locally

```bash
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
