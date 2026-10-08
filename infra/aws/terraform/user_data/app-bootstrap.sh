#!/bin/bash
set -u

# This bootstrap intentionally contains no application secrets. It only makes
# the public app host reachable through Session Manager and installs the host
# prerequisites used by the deployment script.
exec > >(tee -a /var/log/lunas-bootstrap.log | logger -t lunas-bootstrap -s 2>/dev/console) 2>&1

echo "Starting LUNAS app host bootstrap"

systemctl enable --now amazon-ssm-agent || true

# Amazon Linux 2023 exposes Docker and Nginx through its enabled repositories.
# Keep these best-effort so SSM can still be used to repair a transient package
# mirror failure without replacing the instance.
dnf install -y docker nginx || true
systemctl enable --now docker || true
systemctl enable nginx || true

install -d -m 0750 /opt/lunas /opt/lunas/releases
echo "LUNAS app host bootstrap complete"
