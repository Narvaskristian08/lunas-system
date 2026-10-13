#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
env_file="$repo_root/.env.local"

if [[ ! -f "$env_file" ]]; then
  cp "$repo_root/.env.local.example" "$env_file"
fi

append_if_missing() {
  local key="$1"
  local value="$2"
  if ! grep -Eq "^${key}=" "$env_file"; then
    printf '%s=%s\n' "$key" "$value" >>"$env_file"
  fi
}

# Keep an existing generated file forward-compatible with newly added local
# services without overwriting any user-provided values.
append_if_missing S3_ENDPOINT http://minio:9000
append_if_missing ONESIGNAL_APP_ID ''
append_if_missing ONESIGNAL_REST_API_KEY ''
append_if_missing ONESIGNAL_USER_AUTH_KEY ''
append_if_missing SUPABASE_URL ''
append_if_missing SUPABASE_SERVICE_ROLE_KEY ''
append_if_missing GOOGLE_MAPS_API_KEY ''
append_if_missing REGISTRATION_MFA_DELIVERY_URL ''
append_if_missing REGISTRATION_MFA_DELIVERY_TOKEN ''
append_if_missing EMAIL_PROVIDER smtp
append_if_missing RESEND_API_KEY ''
append_if_missing RESEND_API_URL https://api.resend.com
append_if_missing EMAIL_FROM 'LUNAS <your-gmail-address@gmail.com>'
append_if_missing SMTP_HOST smtp.gmail.com
append_if_missing SMTP_PORT 465
append_if_missing SMTP_SECURE true
append_if_missing SMTP_USER your-gmail-address@gmail.com
append_if_missing SMTP_PASSWORD ''
append_if_missing ACCOUNT_ACTIVATION_APP_URL http://localhost:3000/activate-account
append_if_missing ACCOUNT_ACTIVATION_DELIVERY_URL ''
append_if_missing ACCOUNT_ACTIVATION_DELIVERY_TOKEN ''
append_if_missing PASSWORD_RESET_APP_URL http://localhost:3000/reset-password
append_if_missing PASSWORD_RESET_DELIVERY_URL ''
append_if_missing PASSWORD_RESET_DELIVERY_TOKEN ''

generate_if_placeholder() {
  local key="$1"
  local value
  if grep -Eq "^${key}=(generate_|replace_)" "$env_file"; then
    value="$(openssl rand -hex 32)"
    KEY="$key" VALUE="$value" ENV_FILE="$env_file" python3 - <<'PY'
import os
from pathlib import Path

path = Path(os.environ['ENV_FILE'])
key = os.environ['KEY']
value = os.environ['VALUE']
lines = path.read_text().splitlines()
prefix = f'{key}='
path.write_text('\n'.join((prefix + value if line.startswith(prefix) else line) for line in lines) + '\n')
PY
  fi
}

for key in JWT_SECRET JWT_REFRESH_SECRET LUNAS_SESSION_SECRET REGISTRATION_MFA_SECRET \
  MONGO_ROOT_PASSWORD MINIO_ROOT_PASSWORD; do
  generate_if_placeholder "$key"
done

cd "$repo_root"
docker compose \
  --env-file "$env_file" \
  -f docker-compose.yml \
  -f docker-compose.local.yml \
  up --build "$@"
