#!/bin/bash
set -u

# The database subnet has no public route. MongoDB is installed later through
# the temporary private SSH bootstrap path, so this script only enables the
# host's existing management daemon and prepares its directories.
exec > >(tee -a /var/log/lunas-bootstrap.log | logger -t lunas-bootstrap -s 2>/dev/console) 2>&1

echo "Starting LUNAS database host bootstrap"
systemctl enable --now sshd || true
install -d -m 0750 /opt/lunas /var/lib/mongo /var/log/mongodb
echo "LUNAS database host bootstrap complete"
