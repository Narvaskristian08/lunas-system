# Evidence Storage and Push Delivery

This guide covers optional infrastructure integrations. LUNAS roles and
workflow are defined in the [project scope](../LUNAS_PROJECT_SCOPE.md).

## Supabase Storage

The backend uploads evidence with its server-side Supabase service-role key.
Create the `lunas-storage` bucket as **private**. Keep
`SUPABASE_STORAGE_PUBLIC=false`; the API returns short-lived signed evidence
URLs after applying report/work-order authorization. Do not add public read
policies or expose the service-role key in web/mobile clients.

Backend settings (see `.env.example`):

```dotenv
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=server-only-secret
SUPABASE_STORAGE_BUCKET=lunas-storage
SUPABASE_STORAGE_PUBLIC=false
EVIDENCE_SIGNED_URL_EXPIRE_SECONDS=3600
```

`SUPABASE_ANON_KEY` is retained in the configuration template for integrations
that need it; evidence upload and signed URL creation use the service-role key.
Test upload, authorized signed retrieval, expiry, and access denial using
separate Citizen and official accounts before release. Image optimization does
not detect, blur, or redact faces/license plates.

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
