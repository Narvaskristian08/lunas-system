# AWS deployment scaffold

This directory contains a reviewable, disabled-by-default Terraform scaffold
for the capstone AWS target. It does not create AWS resources until
`enable_aws_resources = true` is explicitly set and a user runs Terraform with
an authenticated AWS account.

The target topology is:

- application EC2: Node API, Python AI service, and HTTPS reverse proxy;
- database EC2: private MongoDB on encrypted gp3 storage;
- private versioned S3 evidence bucket;
- S3 gateway endpoint for private-subnet object access;
- IAM instance profiles for S3 and Systems Manager access;
- no load balancer or NAT gateway in the initial cost-conscious scaffold.

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

After provisioning, configure the backend with the `evidence_bucket` output,
`AWS_REGION`, and the EC2 instance role. Do not copy AWS access keys into the
repository or `.env` files.

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
