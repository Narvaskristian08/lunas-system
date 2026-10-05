#!/usr/bin/env bash
set -Eeuo pipefail

: "${MONGODB_URI:?Set MONGODB_URI to the private application database URI}"
: "${S3_BACKUP_BUCKET:?Set S3_BACKUP_BUCKET to the private backup bucket}"

backup_prefix="${S3_BACKUP_PREFIX:-mongodb}"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
backup_dir="$(mktemp -d -t lunas-mongodb-backup.XXXXXX)"
archive_path="${backup_dir}/lunas-${timestamp}.archive.gz"

cleanup() {
  rm -rf "${backup_dir}"
}
trap cleanup EXIT

mongodump \
  --uri="${MONGODB_URI}" \
  --archive="${archive_path}" \
  --gzip

aws s3 cp "${archive_path}" "s3://${S3_BACKUP_BUCKET}/${backup_prefix}/${timestamp}.archive.gz" \
  --sse AES256 \
  --only-show-errors

echo "MongoDB backup uploaded to s3://${S3_BACKUP_BUCKET}/${backup_prefix}/${timestamp}.archive.gz"
