#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="${SCRIPT_DIR}/.cache/logs"

mkdir -p "${LOG_DIR}"

if [[ $# -gt 1 ]]; then
  echo "Usage: $0 [log-file]" >&2
  exit 2
fi

if [[ $# -eq 1 ]]; then
  log_file="$1"
else
  echo "Waiting for a training log in ${LOG_DIR} ..."
  while true; do
    log_file=""
    log_candidates=("${LOG_DIR}"/*.log)
    if [[ -e "${log_candidates[0]}" ]]; then
      log_file="$(ls -t "${log_candidates[@]}" | head -n 1)"
    fi
    if [[ -n "${log_file}" ]]; then
      break
    fi
    sleep 1
  done
fi

if [[ ! -f "${log_file}" ]]; then
  echo "Training log not found: ${log_file}" >&2
  exit 1
fi

echo "Following ${log_file}"
tail -n 30 -f "${log_file}"
