# Netlify and AWS staging deployment

This runbook deploys the current web application to Netlify and keeps the
backend services on the existing AWS resources. It is intentionally staged:
no Terraform apply, EC2 start, S3 mutation, or DNS change is performed by a
Git push.

## Netlify project

1. Have the repository owner authorize the private GitHub repository in the
   Netlify team integration.
2. Create a Netlify project from the current `repair-personnel-creation`
   branch.
3. Use the repository root configuration. `netlify.toml` sets:
   - base directory: `lunas_web`
   - build command: `npm run build`
   - Node.js: 22
4. Add these variables in the Netlify project settings:

   ```text
   LUNAS_API_URL=https://api.<your-domain>/api/v1
   LUNAS_SESSION_SECRET=<unique high-entropy secret>
   LUNAS_DISABLE_LOGIN_CAPTCHA=false
   NEXT_PUBLIC_TURNSTILE_SITE_KEY=<hostname-restricted public key>
   ```

   `LUNAS_API_URL` and `LUNAS_SESSION_SECRET` are server-only. Never prefix
   those names with `NEXT_PUBLIC_`.
5. Use deploy previews for the staging branch. Do not promote to production
   until the API has HTTPS and the reset-email flow has been tested.

## AWS application

Before changing AWS, inventory the existing stopped application and database
instances, VPC, security groups, IAM roles, SSM parameters, and S3 buckets.
Use resource IDs and tags to confirm that the deployment will reuse the
existing resources. If they cannot be matched, stop and review the Terraform
plan rather than provisioning replacements.

The application host should run the backend Docker container and Nginx only.
The checked-in Nginx configuration exposes `/api/v1/*` and `/health` and
returns `404` for other paths because Netlify owns the web application.

Required private paths:

- MongoDB: database security group only.
- Backend port 5000: application host/private network only.
- AI port 5001: application security group only.
- S3: backend IAM role and signed URLs only.
- SSM: deployment commands and runtime parameters.

## Email and storage

Put these backend values in SSM, not Git or Netlify:

```text
EMAIL_PROVIDER=resend
RESEND_API_KEY=<secret>
EMAIL_FROM=<verified sender>
PASSWORD_RESET_APP_URL=https://app.<your-domain>/reset-password
ACCOUNT_ACTIVATION_APP_URL=https://app.<your-domain>/activate-account
```

The backend keeps evidence buckets private and continues to normalize images,
remove EXIF data, redact privacy regions when enabled, and issue signed URLs.

## AI and mobile

AI remains disabled and stopped by default. Start the dedicated AI instance
only for a controlled validation window, verify it through the private API,
then stop it again.

After the API has HTTPS, mobile builds use:

```bash
flutter run \
  --dart-define=LUNAS_API_BASE_URL=https://api.<your-domain>/api/v1
```

Without an HTTPS domain, mobile remains local-only and the Netlify site must
not be wired to an HTTP EC2 endpoint.

## Validation and rollback

Run repository checks before promotion:

```bash
cd lunas_backend && npm test && npm run lint
cd ../lunas_web && npm run lint && npx tsc --noEmit && npm run build
cd ../lunas_mobile && flutter analyze && flutter test
cd .. && docker compose config --quiet
```

Then verify AWS `/health`, `/api/v1/health/ready`, login, protected routes,
password reset, S3 evidence upload, and role permissions. AI validation is
optional and must happen only while the AI instance is intentionally running.

Rollback uses a previous Netlify deploy and stopped EC2 services. Do not
terminate instances or delete S3 objects during rollback.
