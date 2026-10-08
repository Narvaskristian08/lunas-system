# AWS deployment

This directory contains the Terraform and deployment assets for the LUNAS AWS
target. Terraform is still disabled by default in new environments; the
deployed `aws-migration` environment uses the same resources with an
authenticated AWS account.

The target topology is:

- application EC2: Node API, web BFF, and Nginx reverse proxy;
- database EC2: private MongoDB on encrypted gp3 storage;
- private versioned S3 evidence bucket;
- private versioned S3 deployment-artifacts bucket;
- S3 gateway endpoint for private-subnet object access;
- IAM instance profiles for S3 and Systems Manager access;
- no load balancer or NAT gateway in the initial cost-conscious scaffold.

The web and API run together on the application EC2 instance as Docker
containers. Nginx exposes `/api/v1/*` to the backend and all other paths to the
Next.js web container. The web container calls the backend over the private
Docker network, so the backend is not directly exposed to the internet. The
backend uses its EC2 role to read and write the private evidence bucket; build
artifacts are also fetched from the private artifacts bucket during deployment.

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

The web BFF is configured inside the Docker network with:

```text
LUNAS_API_URL=http://backend:5000/api/v1
```

For a temporary Android/dev build, point the Flutter client at the public
Nginx endpoint using a runtime define. Replace the host with the current EC2
address until a domain is attached:

```bash
flutter run \
  --dart-define=LUNAS_API_BASE_URL=http://<ec2-public-host>/api/v1
```

The current public endpoint is HTTP-only because no domain or certificate has
been supplied. Before a production web/mobile release, attach a domain,
terminate TLS at a load balancer or Nginx with an ACM/Let's Encrypt certificate,
change `CORS_ORIGIN`, and use an `https://` mobile endpoint. Do not add an
Android cleartext exception as a production workaround.

## Deployment verification

From an authenticated AWS CLI profile, use Systems Manager rather than opening
SSH to the internet. The app instance should be SSM-managed and able to read
the artifacts bucket and Parameter Store path. Verify the public path with:

```bash
curl -fsS http://<ec2-public-host>/health
curl -fsS http://<ec2-public-host>/api/v1/health/ready
```

The API returns `401` for protected endpoints without a token; that is expected.
Evidence upload also requires the privacy/AI integration to be enabled. The
free-tier deployment keeps the AI service disabled and therefore fails closed
for privacy-sensitive evidence processing until separate AI capacity and real
Turnstile credentials are configured.

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
