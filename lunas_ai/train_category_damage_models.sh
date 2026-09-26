#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
YOLO_BIN="${SCRIPT_DIR}/.venv/bin/yolo"
BASE_CHECKPOINT="${SCRIPT_DIR}/yolov8n.pt"
RUNS_DIR="${SCRIPT_DIR}/.cache/runs"
LOGS_DIR="${SCRIPT_DIR}/.cache/logs"
RUN_TAG="$(date +%Y%m%d_%H%M%S)"

WATER_DATA="${WATER_DATA_YAML:-${SCRIPT_DIR}/datasets/water/pipe_leak_full/data.yaml}"
STREETLIGHT_DATA="${STREETLIGHT_DATA_YAML:-${SCRIPT_DIR}/datasets/streetlight/streetlight_full/data.yaml}"
ELECTRICAL_DATA="${ELECTRICAL_DATA_YAML:-${SCRIPT_DIR}/datasets/electrical/damage/data.yaml}"

if [[ ! -x "${YOLO_BIN}" ]]; then
  echo "Missing local YOLO executable: ${YOLO_BIN}" >&2
  echo "Use the existing lunas_ai/.venv; this script does not install packages." >&2
  exit 1
fi
if [[ ! -s "${BASE_CHECKPOINT}" ]]; then
  echo "Missing base checkpoint: ${BASE_CHECKPOINT}" >&2
  exit 1
fi

require_full_dataset() {
  local category="$1"
  local data_yaml="$2"
  local env_var
  case "${category}" in
    water) env_var="WATER_DATA_YAML" ;;
    streetlight) env_var="STREETLIGHT_DATA_YAML" ;;
    electrical) env_var="ELECTRICAL_DATA_YAML" ;;
    *) env_var="<CATEGORY>_DATA_YAML" ;;
  esac
  if [[ "${data_yaml}" == *preview* ]]; then
    echo "Refusing to train ${category} from a preview dataset: ${data_yaml}" >&2
    echo "Provide the complete exported dataset through ${env_var}." >&2
    exit 1
  fi
  if [[ ! -s "${data_yaml}" ]]; then
    echo "Full ${category} dataset is not available: ${data_yaml}" >&2
    echo "Place the complete YOLO export there or set ${env_var}." >&2
    exit 1
  fi
}

# Preflight every dataset before starting any training. This prevents a partial
# run where one category is replaced while another category is still a preview.
require_full_dataset water "${WATER_DATA}"
require_full_dataset streetlight "${STREETLIGHT_DATA}"
require_full_dataset electrical "${ELECTRICAL_DATA}"

mkdir -p "${RUNS_DIR}" "${LOGS_DIR}"

train_one() {
  local category="$1"
  local data_yaml="$2"
  local initial_model="$3"
  local run_name="$4"
  local destination="$5"
  local run_dir="${RUNS_DIR}/${run_name}"
  local log_file="${LOGS_DIR}/${category}_${RUN_TAG}.log"

  if [[ ! -s "${data_yaml}" ]]; then
    echo "Dataset config not found: ${data_yaml}" >&2
    return 1
  fi
  if [[ ! -s "${initial_model}" ]]; then
    echo "Initial checkpoint not found: ${initial_model}" >&2
    return 1
  fi

  echo
  echo "=== Training ${category} ==="
  echo "Dataset: ${data_yaml}"
  echo "Initial checkpoint: ${initial_model}"
  echo "Maximum epochs: 100; early stopping patience: 10"
  echo "Live log: ${log_file}"

  if ! "${YOLO_BIN}" detect train \
    "data=${data_yaml}" \
    "model=${initial_model}" \
    epochs=100 \
    patience=10 \
    batch=8 \
    imgsz=640 \
    device=cpu \
    workers=0 \
    project="${RUNS_DIR}" \
    name="${run_name}" \
    exist_ok=True 2>&1 | LC_ALL=C stdbuf -o0 tr '\r' '\n' | tee "${log_file}"; then
    echo "${category} training failed; existing checkpoint was kept." >&2
    return 1
  fi

  local trained_checkpoint="${run_dir}/weights/best.pt"
  if [[ ! -s "${trained_checkpoint}" ]]; then
    echo "${category} finished without ${trained_checkpoint}; existing checkpoint was kept." >&2
    return 1
  fi

  mkdir -p "$(dirname -- "${destination}")"
  cp "${trained_checkpoint}" "${destination}"
  echo "Saved ${category} checkpoint: ${destination}"
  echo "Results: ${run_dir}/results.csv"
}

train_one \
  water \
  "${WATER_DATA}" \
  "${BASE_CHECKPOINT}" \
  water_full_100 \
  "${SCRIPT_DIR}/models/water/waterleak/best.pt"

train_one \
  streetlight \
  "${STREETLIGHT_DATA}" \
  "${BASE_CHECKPOINT}" \
  streetlight_full_100 \
  "${SCRIPT_DIR}/models/streetlight/streetlightdamage/best.pt"

train_one \
  electrical \
  "${ELECTRICAL_DATA}" \
  "${BASE_CHECKPOINT}" \
  electrical_full_100 \
  "${SCRIPT_DIR}/models/electrical/electricpole/best.pt"

echo
echo "All three full-dataset category training runs completed successfully."
echo "Saved logs: ${LOGS_DIR}"
