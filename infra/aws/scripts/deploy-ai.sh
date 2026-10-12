#!/usr/bin/env bash
set -euo pipefail

: "${INSTANCE_ID:?Set INSTANCE_ID to the AI EC2 instance ID}"
: "${ARTIFACT_BUCKET:?Set ARTIFACT_BUCKET to the private artifacts bucket}"
: "${AWS_REGION:?Set AWS_REGION, for example ap-southeast-1}"

AWS_PROFILE_ARG=()
if [[ -n "${AWS_PROFILE:-}" ]]; then
  AWS_PROFILE_ARG=(--profile "$AWS_PROFILE")
fi

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
release="ai-$(date -u +%Y%m%dT%H%M%SZ)"
if [[ -n "${AI_BIND_ADDRESS:-}" ]]; then
  ai_bind_address="$AI_BIND_ADDRESS"
else
  ai_bind_address="$(hostname -I 2>/dev/null | awk '{print $1}' || true)"
fi
: "${ai_bind_address:?Could not determine the AI private bind address; set AI_BIND_ADDRESS explicitly}"
archive="$(mktemp -t lunas-ai.XXXXXX.tar.gz)"
commands_file="$(mktemp -t lunas-ai-commands.XXXXXX)"
parameters_file="$(mktemp -t lunas-ai-parameters.XXXXXX.json)"
trap 'rm -f "$archive" "$commands_file" "$parameters_file"' EXIT

COPYFILE_DISABLE=1 tar -czf "$archive" \
  --exclude='lunas_ai/.venv' \
  --exclude='lunas_ai/venv' \
  --exclude='lunas_ai/.cache' \
  --exclude='lunas_ai/datasets' \
  --exclude='lunas_ai/runs' \
  --exclude='lunas_ai/logs' \
  --exclude='lunas_ai/cache' \
  --exclude='lunas_ai/**/__pycache__' \
  --exclude='lunas_ai/*.log' \
  --exclude='lunas_ai/src/models/*.zip' \
  -C "$repo_root" \
  lunas_ai

aws "${AWS_PROFILE_ARG[@]}" --region "$AWS_REGION" s3 cp \
  "$archive" "s3://$ARTIFACT_BUCKET/ai/$release/lunas-ai.tar.gz"

cat >"$commands_file" <<EOF
set -euo pipefail
export AWS_DEFAULT_REGION="$AWS_REGION"
release="$release"
ai_bind_address="$ai_bind_address"
mkdir -p /opt/lunas-ai/releases/"$release"
aws s3 cp "s3://$ARTIFACT_BUCKET/ai/$release/lunas-ai.tar.gz" /opt/lunas-ai/releases/"$release"/lunas-ai.tar.gz
tar -xzf /opt/lunas-ai/releases/"$release"/lunas-ai.tar.gz -C /opt/lunas-ai/releases/"$release"
ln -sfn /opt/lunas-ai/releases/"$release"/lunas_ai /opt/lunas-ai/lunas_ai
mkdir -p /opt/lunas-ai/logs /opt/lunas-ai/cache
docker build -t "lunas-ai:$release" /opt/lunas-ai/releases/"$release"/lunas_ai
docker rm -f lunas-ai >/dev/null 2>&1 || true
docker run -d --name lunas-ai --restart unless-stopped \
  -p "$ai_bind_address:5001:5001" \
  -e FLASK_ENV=production \
  -e FLASK_HOST=0.0.0.0 \
  -e FLASK_PORT=5001 \
  -e DEBUG=False \
  -e DEVICE=cpu \
  -e ENABLE_HALF_PRECISION=False \
  -e CONFIDENCE_THRESHOLD=0.25 \
  -e IOU_THRESHOLD=0.45 \
  -e MAX_DETECTIONS=50 \
  -e MAX_IMAGE_SIZE=1920 \
  -e IMAGE_QUALITY=85 \
  -e LOG_LEVEL=INFO \
  -e ALLOWED_ORIGINS=http://backend:5000 \
  -v /opt/lunas-ai/logs:/app/logs \
  -v /opt/lunas-ai/cache:/app/cache \
  "lunas-ai:$release"
for attempt in \$(seq 1 30); do
  if curl --fail --silent "http://\$ai_bind_address:5001/api/v1/health" >/dev/null; then
    exit 0
  fi
  sleep 10
done
exit 1
EOF

python3 -c 'import json,sys; json.dump({"commands":[sys.stdin.read()]}, sys.stdout)' \
  <"$commands_file" >"$parameters_file"
command_id="$(aws "${AWS_PROFILE_ARG[@]}" --region "$AWS_REGION" ssm send-command \
  --instance-ids "$INSTANCE_ID" \
  --document-name AWS-RunShellScript \
  --comment "Deploy LUNAS AI $release" \
  --parameters "file://$parameters_file" \
  --query 'Command.CommandId' --output text)"

status="Pending"
for attempt in $(seq 1 180); do
  status="$(aws "${AWS_PROFILE_ARG[@]}" --region "$AWS_REGION" ssm get-command-invocation \
    --command-id "$command_id" --instance-id "$INSTANCE_ID" \
    --query 'Status' --output text 2>/dev/null || true)"
  case "$status" in
    Success|Failed|Cancelled|TimedOut|Cancelling) break ;;
  esac
  sleep 10
done
if [[ "$status" != "Success" ]]; then
  aws "${AWS_PROFILE_ARG[@]}" --region "$AWS_REGION" ssm get-command-invocation \
    --command-id "$command_id" --instance-id "$INSTANCE_ID" \
    --query '{status:Status,stdout:StandardOutputContent,stderr:StandardErrorContent}'
  exit 1
fi

echo "AI service validated on $INSTANCE_ID."
if [[ "${STOP_AFTER_VALIDATION:-true}" == "true" ]]; then
  aws "${AWS_PROFILE_ARG[@]}" --region "$AWS_REGION" ec2 stop-instances --instance-ids "$INSTANCE_ID" >/dev/null
  echo "AI instance stopped after validation."
fi
