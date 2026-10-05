# Evidence Storage and Push Delivery

This guide covers optional infrastructure integrations. LUNAS roles and
workflow are defined in the [project scope](../LUNAS_PROJECT_SCOPE.md).

## AWS S3 evidence storage

The backend uploads privacy-processed evidence to a private S3 bucket using the
EC2 instance role. Enable Block Public Access, versioning, and server-side
encryption. The API returns short-lived signed evidence URLs after applying
report/work-order authorization. Do not add public read policies or put AWS
credentials in web/mobile clients.

Backend settings (see `.env.example`):

```dotenv
STORAGE_PROVIDER=s3
AWS_REGION=ap-southeast-1
S3_EVIDENCE_BUCKET=lunas-evidence-production
S3_SERVER_SIDE_ENCRYPTION=AES256
EVIDENCE_SIGNED_URL_EXPIRE_SECONDS=3600
```

During migration only, set `SUPABASE_MIGRATION_READ_ENABLED=true` and provide
the legacy Supabase URL/service-role key. Run
`npm run migrate:storage -- --dry-run`, then `--apply`, and verify checksums
before disabling the fallback and removing the credentials. Test upload,
authorized signed retrieval, expiry, and access denial using separate Citizen
and official accounts before release.

## OneSignal (optional push)

In-app notifications are persisted by the backend. Push delivery is attempted
only when `ONESIGNAL_APP_ID` and `ONESIGNAL_REST_API_KEY` are configured and a
recipient has a stored device token. An unavailable push provider does not
remove the persisted in-app notification.

```dotenv
ONESIGNAL_APP_ID=your-app-id
ONESIGNAL_REST_API_KEY=server-only-rest-key
ONESIGNAL_USER_AUTH_KEY=server-only-user-auth-key
ONESIGNAL_ANDROID_CHANNEL_ID=lunas-default
```

Configure mobile platform credentials in the provider dashboard and use the
documented SDK flow to register device tokens. Confirm a real test-device
delivery; a successful API write alone does not prove push delivery. Never
commit provider secrets or include them in client builds.


## Current image privacy scope (Revision 9)

New incident and repair evidence is normalized, privacy-detected, and visually
redacted before private storage. Face and license-plate regions are blurred by the
backend using normalized boxes returned by the AI service. The backend fails closed
when privacy processing is unavailable, so a new unredacted image is not persisted.
EXIF/GPS metadata stripping remains separate from visual redaction. Historical privacy
fields are retained for compatibility; legacy images may still report `not_available`.
