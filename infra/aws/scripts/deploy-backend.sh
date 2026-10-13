#!/usr/bin/env bash
set -euo pipefail

# Deploy the API container to an existing application EC2 host. The script is
# intentionally designed for SSM execution: it preserves the host env file,
# builds a candidate container first, and keeps the previous container for
# rollback. It does not create infrastructure or print secret values.

release="${RELEASE:?Set RELEASE to the immutable release name}"
artifact_uri="${ARTIFACT_URI:?Set ARTIFACT_URI to an existing private S3 object}"
release_dir="/opt/lunas/releases/${release}"
build_log="/tmp/lunas-backend-build-${release}.log"
candidate_name="backend-candidate-${release}"
previous_name="backend-previous-${release}"
runtime_env="/tmp/lunas-backend-runtime-${release}.env"

# Reuse the currently working runtime configuration when an existing backend
# container is present. This keeps staging on the same database and storage
# wiring until the separately tagged database host is serving MongoDB. Values
# stay on the EC2 host and are never printed by this script.
if docker inspect backend >/dev/null 2>&1; then
  docker inspect --format '{{range .Config.Env}}{{println .}}{{end}}' backend >"$runtime_env"
else
  cp /opt/lunas/backend.env "$runtime_env"
fi
chmod 600 "$runtime_env"

# Merge optional email configuration on the host without exposing credentials
# in the deployment command or build logs.
if [[ -n "${EMAIL_RUNTIME_PARAMETER:-}" ]]; then
  aws ssm get-parameter --name "$EMAIL_RUNTIME_PARAMETER" --with-decryption --query Parameter.Value --output text | python3 -c '
import json,sys
values=json.load(sys.stdin)
with open(sys.argv[1], "a") as runtime:
    for key,value in values.items():
        if key not in {"EMAIL_PROVIDER", "SMTP_HOST", "SMTP_PORT", "SMTP_SECURE", "SMTP_USER", "SMTP_PASSWORD", "EMAIL_FROM"}:
            raise ValueError("Unexpected email configuration key")
        if "\n" in str(value) or "\r" in str(value):
            raise ValueError("Invalid email configuration value")
        runtime.write(f"{key}={value}\n")
' "$runtime_env"
fi

cleanup_candidate() {
  docker rm -f "$candidate_name" >/dev/null 2>&1 || true
}
cleanup_runtime() {
  cleanup_candidate
  rm -f "$runtime_env"
}
trap cleanup_runtime EXIT

mkdir -p "$release_dir"
aws s3 cp "$artifact_uri" "$release_dir/lunas-backend.tar.gz"
tar -xzf "$release_dir/lunas-backend.tar.gz" --strip-components=2 -C "$release_dir"
test -f "$release_dir/Dockerfile"

docker build --pull=false -t "lunas-backend:${release}" "$release_dir" >"$build_log" 2>&1

docker rm -f "$candidate_name" >/dev/null 2>&1 || true
docker run -d \
  --name "$candidate_name" \
  --restart unless-stopped \
  --network lunas \
  --env-file "$runtime_env" \
  -e NODE_ENV=production \
  -e PORT=5000 \
  -e AI_SERVICE_URL="${AI_SERVICE_URL:?Set the AI private service URL}" \
  -e AI_SERVICE_ENABLED="${AI_SERVICE_ENABLED:-true}" \
  -e AI_EVIDENCE_ANALYSIS_ENABLED="${AI_EVIDENCE_ANALYSIS_ENABLED:-true}" \
  -e PRIVACY_REDACTION_ENABLED="${PRIVACY_REDACTION_ENABLED:-true}" \
  -p 127.0.0.1:5001:5000 \
  "lunas-backend:${release}" >/tmp/lunas-backend-candidate.id

healthy=0
for _ in $(seq 1 60); do
  if curl -fsS http://127.0.0.1:5001/health/ready >/tmp/lunas-backend-health.json 2>/dev/null; then
    healthy=1
    break
  fi
  sleep 2
done
test "$healthy" = 1

docker rm -f "$previous_name" >/dev/null 2>&1 || true
if docker inspect backend >/dev/null 2>&1; then
  docker stop backend >/dev/null 2>&1 || true
  docker rename backend "$previous_name"
fi
docker rm -f backend >/dev/null 2>&1 || true
docker rm -f "$candidate_name" >/dev/null 2>&1 || true
trap - EXIT

docker run -d \
  --name backend \
  --restart unless-stopped \
  --network lunas \
  --env-file "$runtime_env" \
  -e NODE_ENV=production \
  -e PORT=5000 \
  -e AI_SERVICE_URL="${AI_SERVICE_URL:?Set the AI private service URL}" \
  -e AI_SERVICE_ENABLED="${AI_SERVICE_ENABLED:-true}" \
  -e AI_EVIDENCE_ANALYSIS_ENABLED="${AI_EVIDENCE_ANALYSIS_ENABLED:-true}" \
  -e PRIVACY_REDACTION_ENABLED="${PRIVACY_REDACTION_ENABLED:-true}" \
  -p 127.0.0.1:5000:5000 \
  "lunas-backend:${release}" >/tmp/lunas-backend.id

final_healthy=0
for _ in $(seq 1 30); do
  if curl -fsS http://127.0.0.1:5000/health/ready >/tmp/lunas-backend-health-final.json 2>/dev/null; then
    final_healthy=1
    break
  fi
  sleep 2
done
if [ "$final_healthy" -ne 1 ]; then
  docker rm -f backend >/dev/null 2>&1 || true
  if docker inspect "$previous_name" >/dev/null 2>&1; then
    docker rename "$previous_name" backend
    docker start backend >/dev/null
  fi
  exit 1
fi
curl -fsS http://127.0.0.1:5000/health >/tmp/lunas-backend-health.json
rm -f "$runtime_env"

printf 'backend_health='
tr -d '\n' </tmp/lunas-backend-health.json
printf '\nbackend_ready='
tr -d '\n' </tmp/lunas-backend-health-final.json
printf '\n'
