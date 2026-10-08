#!/bin/bash
set -u

# AI host bootstrap deliberately contains no application secrets. The service
# is deployed later through Systems Manager using the instance role.
exec > >(tee -a /var/log/lunas-ai-bootstrap.log | logger -t lunas-ai-bootstrap -s 2>/dev/console) 2>&1

echo "Starting LUNAS AI host bootstrap"

systemctl enable --now amazon-ssm-agent || true
dnf install -y docker awscli || true
systemctl enable --now docker || true

install -d -m 0750 /opt/lunas-ai /opt/lunas-ai/releases
echo "LUNAS AI host bootstrap complete"
