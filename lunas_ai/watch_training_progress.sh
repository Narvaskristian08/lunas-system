#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="${SCRIPT_DIR}/.cache/logs"

if [[ $# -gt 1 ]]; then
  echo "Usage: $0 [log-file]" >&2
  exit 2
fi

if [[ $# -eq 1 ]]; then
  log_file="$1"
else
  log_file=""
  while [[ -z "${log_file}" ]]; do
    log_candidates=("${LOG_DIR}"/*.log)
    if [[ -e "${log_candidates[0]}" ]]; then
      log_file="$(ls -t "${log_candidates[@]}" | head -n 1)"
    else
      sleep 1
    fi
  done
fi

if [[ ! -f "${log_file}" ]]; then
  echo "Training log not found: ${log_file}" >&2
  exit 1
fi

while true; do
  printf '\033[2J\033[H'
  echo "Watching: ${log_file}"
  echo "Press Ctrl+C to stop watching; training will continue."
  echo
  latest_line="$(tail -c 131072 "${log_file}" | LC_ALL=C tr '\r' '\n' | rg -o '[0-9]+/100.*[0-9]+/[0-9]+.*' | tail -n 1 || true)"
  if [[ -n "${latest_line}" ]]; then
    echo "${latest_line}"
  else
    echo "Waiting for training progress..."
  fi
  sleep 2
done
