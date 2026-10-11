# AWS deployment

This directory contains the Terraform and deployment assets for the LUNAS AWS
target. Terraform is still disabled by default in new environments; the
deployed `aws-migration` environment uses the same resources with an
authenticated AWS account.

The target topology is:

- Netlify: Next.js web application and server-side BFF;
- application EC2: Node API and Nginx reverse proxy;
- database EC2: private MongoDB on encrypted gp3 storage;
- private versioned S3 evidence bucket;
- private versioned S3 deployment-artifacts bucket;
- S3 gateway endpoint for private-subnet object access;
- IAM instance profiles for S3 and Systems Manager access;
- no load balancer or NAT gateway in the initial cost-conscious scaffold.

When `enable_ai_resources=true`, Terraform adds a separately controlled
Amazon Linux 2023 `t3.small` instance tagged `lunas-production-ai`. Its
security group accepts TCP 5001 only from the application security group, and
its instance profile is limited to Systems Manager plus read access to the
private deployment-artifacts bucket. Use
`infra/aws/scripts/deploy-ai.sh` to package the runtime-only AI container,
bind it to the host's private address, validate its health endpoint, and stop
the instance afterward. A `t3.small`
can consume free-tier credits and is not guaranteed to be permanently free.

The public web application is deployed to Netlify from the `lunas_web`
directory. Netlify uses the supported Next.js runtime; this repository does
not use a static export because the web app relies on server actions, cookies,
and protected routes. The Netlify server-side BFF uses `LUNAS_API_URL` to call
the AWS API. The application EC2 host runs only the API container and Nginx.
Nginx exposes `/api/v1/*` and `/health`; it does not proxy a second public web
container. The backend uses its EC2 role to read and write the private evidence
bucket.

The repository's `netlify.toml` sets the base directory to `lunas_web`, uses
`npm run build`, pins Node.js 22, and enables Netlify deployment skew
protection. Connect the private GitHub repository through the repository
owner's authorized Netlify integration before creating the site.

S3 is object storage, not compute: source code and running services remain on
EC2, while evidence, backups, models, and deployment artifacts are stored in
private, encrypted, versioned buckets. Runtime secrets are kept in encrypted
SSM Parameter Store and are never uploaded to S3.

The default EC2 size is `t3.micro` with T3 CPU credits set to `standard`, and
the database volume is 30 GiB. This is intended for a small development or
demonstration deployment and does not guarantee zero cost: Free Tier eligibility
depends on the account plan, account age, and total monthly usage. Stop or
terminate EC2 instances when they are not needed.

The database AMI must be prepared and reviewed separately. The scaffold does
not install MongoDB into a private subnet without an approved bootstrap path.
Use a pinned, patched AMI or a controlled Systems Manager deployment. Do not
open MongoDB or SSH to the public internet.

## Review-only workflow

```bash
cd infra/aws/terraform
cp terraform.tfvars.example terraform.tfvars
terraform init
terraform fmt -check
terraform validate
terraform plan
```

The default plan is empty because `enable_aws_resources` is `false`. Before a
real apply, create the AWS account, configure a budget alarm, replace the S3
prefix, review the AMIs and security groups, and set the enable flag explicitly.

If the account has not enabled EC2 yet, provision only the private S3 buckets
with `enable_aws_resources=true` and `enable_ec2_resources=false`. EC2/VPC/IAM
resources remain disabled until the account is eligible and the AMI/bootstrap
path has been reviewed.

After provisioning, configure the backend with the `evidence_bucket` output,
`AWS_REGION`, and the EC2 instance role. Do not copy AWS access keys into the
repository or `.env` files. The deployed app fetches its environment from
`/lunas/production/backend/env` and the web session secret from
`/lunas/production/web/session-secret` through the EC2 role.

## Client connection

For local Docker, the web BFF is configured inside the Docker network with:

```text
LUNAS_API_URL=http://backend:5000/api/v1
```

For a staging Netlify deployment, set the server-only `LUNAS_API_URL` to the
AWS API's HTTPS URL. Do not point a live Netlify site at an HTTP-only EC2
address. Until a domain and certificate are available, validate the Netlify
build and private AWS health checks only.

After HTTPS is configured, point the Flutter client at the public Nginx
endpoint using a runtime define:

```bash
flutter run \
  --dart-define=LUNAS_API_BASE_URL=https://api.<your-domain>/api/v1
```

Before a production web/mobile release, attach a domain, terminate TLS at
Nginx with a reviewed certificate, change `CORS_ORIGIN` to the exact Netlify
origin, and use the same `https://api.<your-domain>/api/v1` endpoint in mobile.
Do not add an Android cleartext exception as a production workaround.

## Transactional email

Set `EMAIL_PROVIDER=resend`, `RESEND_API_KEY`, and `EMAIL_FROM` in the backend
runtime environment for staging or production. Password reset, registration
OTP, and account activation use the same provider boundary. The API key stays
in SSM Parameter Store and is never placed in Netlify variables or a client
bundle. If Resend is not configured, the existing approved webhook variables
remain available for local QA only.

The password-reset URL must point to the Netlify site, for example:

```text
PASSWORD_RESET_APP_URL=https://app.<your-domain>/reset-password
ACCOUNT_ACTIVATION_APP_URL=https://app.<your-domain>/activate-account
```

## Deployment verification

From an authenticated AWS CLI profile, use Systems Manager rather than opening
SSH to the internet. The app instance should be SSM-managed and able to read
the artifacts bucket and Parameter Store path. Verify the public path with:

```bash
curl -fsS http://<ec2-public-host>/health
curl -fsS http://<ec2-public-host>/api/v1/health/ready
```

The API returns `401` for protected endpoints without a token; that is expected.
Evidence upload also requires the privacy/AI integration to be enabled. The AI
service can be enabled or disabled independently with `AI_SERVICE_ENABLED`,
`AI_EVIDENCE_ANALYSIS_ENABLED`, and `PRIVACY_REDACTION_ENABLED`. Keep the AI
instance stopped when it is not being validated or used; the backend should
not be exposed directly to the internet.

The mobile client already reads `LUNAS_API_BASE_URL` at build time, so no API
URL is hardcoded into the app. Use the same Nginx host as the web client for a
temporary device build, and switch it to the final HTTPS domain before release.

The MongoDB backup helpers use the EC2 instance role to write/read encrypted
archives from a private S3 backup bucket:

```bash
MONGODB_URI='mongodb://...' \
S3_BACKUP_BUCKET='lunas-backups-production' \
infra/aws/scripts/backup-mongodb.sh

MONGODB_URI='mongodb://...' \
S3_BACKUP_URI='s3://lunas-backups-production/mongodb/20260101T000000Z.archive.gz' \
infra/aws/scripts/restore-mongodb.sh
```

Restore into an isolated database first. A destructive `--drop` restore
requires `MONGORESTORE_DROP=true RESTORE_CONFIRM=I_UNDERSTAND`.
