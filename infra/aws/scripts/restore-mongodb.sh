#!/usr/bin/env bash
set -Eeuo pipefail

: "${MONGODB_URI:?Set MONGODB_URI to the restore target URI}"
: "${S3_BACKUP_URI:?Set S3_BACKUP_URI to the backup object URI}"

restore_drop="${MONGORESTORE_DROP:-false}"
if [[ "${restore_drop}" == "true" && "${RESTORE_CONFIRM:-}" != "I_UNDERSTAND" ]]; then
  echo 'Refusing --drop restore without RESTORE_CONFIRM=I_UNDERSTAND' >&2
  exit 1
fi

restore_dir="$(mktemp -d -t lunas-mongodb-restore.XXXXXX)"
archive_path="${restore_dir}/restore.archive.gz"

cleanup() {
  rm -rf "${restore_dir}"
}
trap cleanup EXIT

aws s3 cp "${S3_BACKUP_URI}" "${archive_path}" --only-show-errors

restore_args=(
  --uri="${MONGODB_URI}"
  --archive="${archive_path}"
  --gzip
)
if [[ "${restore_drop}" == "true" ]]; then
  restore_args+=(--drop)
fi

mongorestore "${restore_args[@]}"
echo "MongoDB restore completed from ${S3_BACKUP_URI}"
