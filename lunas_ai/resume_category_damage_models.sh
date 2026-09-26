#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PYTHON_BIN="${SCRIPT_DIR}/.venv/bin/python"
RUNS_DIR="${SCRIPT_DIR}/.cache/runs"
LOGS_DIR="${SCRIPT_DIR}/.cache/logs"
RUN_TAG="$(date +%Y%m%d_%H%M%S)"

STREETLIGHT_RUN="${RUNS_DIR}/streetlight_full_100"
STREETLIGHT_LAST="${STREETLIGHT_RUN}/weights/last.pt"
STREETLIGHT_DEST="${SCRIPT_DIR}/models/streetlight/streetlightdamage/best.pt"
ELECTRICAL_DATA="${ELECTRICAL_DATA_YAML:-${SCRIPT_DIR}/datasets/electrical/damage/data.yaml}"
ELECTRICAL_RUN="${RUNS_DIR}/electrical_full_100_recovery"
ELECTRICAL_LAST="${ELECTRICAL_RUN}/weights/last.pt"
ELECTRICAL_DEST="${SCRIPT_DIR}/models/electrical/electricpole/best.pt"

if [[ ! -x "${PYTHON_BIN}" ]]; then
  echo "Missing local Python executable: ${PYTHON_BIN}" >&2
  exit 1
fi
if [[ ! -s "${ELECTRICAL_DATA}" ]]; then
  echo "Full electrical dataset is not available: ${ELECTRICAL_DATA}" >&2
  exit 1
fi
mkdir -p "${LOGS_DIR}"

resume_streetlight() {
  local log_file="${LOGS_DIR}/streetlight_resume_${RUN_TAG}.log"
  echo
  echo "=== Resuming streetlight ==="
  echo "Checkpoint: ${STREETLIGHT_LAST}"
  echo "Live log: ${log_file}"

  if [[ ! -s "${STREETLIGHT_LAST}" ]]; then
    echo "No resumable streetlight checkpoint found: ${STREETLIGHT_LAST}" >&2
    return 1
  fi

  if ! "${PYTHON_BIN}" -u -c \
    'import sys; from ultralytics import YOLO; YOLO(sys.argv[1]).train(resume=True)' \
    "${STREETLIGHT_LAST}" \
    2>&1 | LC_ALL=C stdbuf -o0 tr '\r' '\n' | tee "${log_file}"; then
    echo "Streetlight resume failed; existing checkpoint was kept." >&2
    return 1
  fi

  local trained_checkpoint="${STREETLIGHT_RUN}/weights/best.pt"
  if [[ ! -s "${trained_checkpoint}" ]]; then
    echo "Streetlight resume finished without ${trained_checkpoint}." >&2
    return 1
  fi

  mkdir -p "$(dirname -- "${STREETLIGHT_DEST}")"
  cp "${trained_checkpoint}" "${STREETLIGHT_DEST}"
  echo "Saved streetlight checkpoint: ${STREETLIGHT_DEST}"
}

resume_electrical() {
  local log_file="${LOGS_DIR}/electrical_${RUN_TAG}.log"

  echo
  echo "=== Resuming electrical ==="
  echo "Checkpoint: ${ELECTRICAL_LAST}"
  echo "Live log: ${log_file}"

  if [[ ! -s "${ELECTRICAL_LAST}" ]]; then
    echo "No resumable electrical checkpoint found: ${ELECTRICAL_LAST}" >&2
    return 1
  fi

  if ! "${PYTHON_BIN}" -u -c \
    'import sys; from ultralytics import YOLO; YOLO(sys.argv[1]).train(resume=True)' \
    "${ELECTRICAL_LAST}" \
    2>&1 | LC_ALL=C stdbuf -o0 tr '\r' '\n' | tee "${log_file}"; then
    echo "Electrical resume failed; existing checkpoint was kept." >&2
    return 1
  fi

  local trained_checkpoint="${ELECTRICAL_RUN}/weights/best.pt"
  if [[ ! -s "${trained_checkpoint}" ]]; then
    echo "Electrical training finished without ${trained_checkpoint}." >&2
    return 1
  fi

  mkdir -p "$(dirname -- "${ELECTRICAL_DEST}")"
  cp "${trained_checkpoint}" "${ELECTRICAL_DEST}"
  echo "Saved electrical checkpoint: ${ELECTRICAL_DEST}"
}

if [[ "${SKIP_STREETLIGHT_RESUME:-0}" == "1" ]]; then
  echo "Skipping streetlight resume; its checkpoint is already saved."
else
  resume_streetlight
fi
resume_electrical

echo
echo "Streetlight and electrical resumes completed successfully."
