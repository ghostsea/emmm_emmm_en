#!/usr/bin/env bash

seti_collect_cuda_library_dirs() {
  local repo_root="${1:-$(pwd)}"
  local nvidia_root
  local lib_dir

  if [[ -d "${repo_root}/.venv/lib" ]]; then
    while IFS= read -r nvidia_root; do
      while IFS= read -r lib_dir; do
        printf '%s\n' "${lib_dir}"
      done < <(find "${nvidia_root}" -mindepth 2 -maxdepth 2 -type d -name lib 2>/dev/null | sort)
    done < <(find "${repo_root}/.venv/lib" -mindepth 3 -maxdepth 3 -type d -path '*/site-packages/nvidia' 2>/dev/null | sort)
  fi

  for lib_dir in \
    "${CUDA_HOME:-}/lib64" \
    "${CUDA_HOME:-}/lib" \
    "${CUDA_PATH:-}/lib64" \
    "${CUDA_PATH:-}/lib" \
    /usr/local/cuda/lib64 \
    /usr/local/cuda/lib; do
    [[ -n "${lib_dir}" && -d "${lib_dir}" ]] && printf '%s\n' "${lib_dir}"
  done

  find /usr/local -maxdepth 2 \( -path '/usr/local/cuda-*/lib64' -o -path '/usr/local/cuda-*/lib' \) -type d 2>/dev/null | sort || true
}

seti_export_cuda_library_path() {
  local repo_root="${1:-$(pwd)}"
  local current=":${LD_LIBRARY_PATH:-}:"
  local additions=()
  local dir

  while IFS= read -r dir; do
    [[ -z "${dir}" ]] && continue
    if [[ "${current}" != *":${dir}:"* ]]; then
      additions+=("${dir}")
      current="${current}${dir}:"
    fi
  done < <(seti_collect_cuda_library_dirs "${repo_root}")

  if (( ${#additions[@]} > 0 )); then
    local joined
    joined="$(IFS=:; printf '%s' "${additions[*]}")"
    export LD_LIBRARY_PATH="${joined}${LD_LIBRARY_PATH:+:${LD_LIBRARY_PATH}}"
  fi
}