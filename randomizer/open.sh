#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
source "${REPO_ROOT}/tools/cuda_env.sh"
GAME_HOST="127.0.0.1"
GAME_PORT="${SETI_GAME_PORT:-8899}"
MODEL_HOST="127.0.0.1"
MODEL_PORT="${SETI_ENTITY_MODEL_SERVER_PORT:-8797}"
MODEL_BATCH_SIZE="${SETI_ENTITY_MODEL_BATCH_SIZE:-4}"
MODEL_BATCH_DELAY_MS="${SETI_ENTITY_MODEL_BATCH_DELAY_MS:-1}"
MODEL_IDLE_EXIT_MS="${SETI_ENTITY_MODEL_IDLE_EXIT_MS:-300000}"
MODEL_HEARTBEAT_MS="${SETI_ENTITY_MODEL_HEARTBEAT_MS:-5000}"
MODEL_LOG_REQUESTS="${SETI_ENTITY_MODEL_REQUEST_LOG:-1}"
MODEL_PROBE_ENABLED="${SETI_MODEL_SERVER_PROBE:-1}"
MODEL_PROBE_INTERVAL_MS="${SETI_MODEL_SERVER_PROBE_INTERVAL_MS:-3000}"
RUNTIME_CONFIG_PATH="${SCRIPT_DIR}/local-runtime-config.js"
MODEL_SERVER_URL="http://${MODEL_HOST}:${MODEL_PORT}"
PARENT_SHELL_PID="$$"
LOG_DIR="${REPO_ROOT}/tools/_runtime_logs"
RUN_ID="$(date +%Y%m%d_%H%M%S)"
MODEL_LOG_PATH="${LOG_DIR}/model_server_${RUN_ID}.log"
GAME_LOG_PATH="${LOG_DIR}/game_server_${RUN_ID}.log"
AI_MCTS_LOG_PATH="${LOG_DIR}/ai_mcts_${RUN_ID}.jsonl"

cleanup() {
	local exit_code=$?
	set +e
	if [[ -n "${WATCHDOG_PID:-}" ]]; then
		kill "${WATCHDOG_PID}" >/dev/null 2>&1 || true
		wait "${WATCHDOG_PID}" 2>/dev/null || true
	fi
	if [[ -n "${GAME_SERVER_PID:-}" ]]; then
		kill "${GAME_SERVER_PID}" >/dev/null 2>&1 || true
		wait "${GAME_SERVER_PID}" 2>/dev/null || true
	fi
	if [[ -n "${MODEL_SERVER_PID:-}" ]]; then
		kill "${MODEL_SERVER_PID}" >/dev/null 2>&1 || true
		wait "${MODEL_SERVER_PID}" 2>/dev/null || true
	fi
	rm -f "${RUNTIME_CONFIG_PATH}"
	exit "${exit_code}"
}

trap cleanup EXIT INT TERM

cat > "${RUNTIME_CONFIG_PATH}" <<EOF
window.SETI_ENTITY_MODEL_SERVER_URL = "${MODEL_SERVER_URL}";
window.SETI_AI_RUNTIME_LOG_URL = "${MODEL_SERVER_URL}/runtime-log";
(function () {
	if (window.__setiModelServerProbeInstalled) return;
	window.__setiModelServerProbeInstalled = true;
	const enabled = ${MODEL_PROBE_ENABLED} === 1;
	if (!enabled) return;
	const intervalMs = Math.max(1000, Number(${MODEL_PROBE_INTERVAL_MS}) || 3000);
	const healthUrl = "${MODEL_SERVER_URL}/health";
	const probe = () => {
		fetch(healthUrl, { method: "GET" })
			.then((response) => response.json().catch(() => ({})))
			.then((payload) => {
				if (window.console && typeof window.console.info === "function") {
					window.console.info("[SetiModelProbe] health", payload && payload.ok, payload && payload.pid);
				}
			})
			.catch((error) => {
				if (window.console && typeof window.console.warn === "function") {
					window.console.warn("[SetiModelProbe] health failed", error && error.message ? error.message : error);
				}
			});
	};
	probe();
	window.setInterval(probe, intervalMs);
})();
EOF

cd "${REPO_ROOT}"
seti_export_cuda_library_path "${REPO_ROOT}"
export SETI_CUDA_LIBRARY_PATH_BOOTSTRAPPED=1
mkdir -p "${LOG_DIR}"

node tools/entity_model_server.js \
	--host="${MODEL_HOST}" \
	--port="${MODEL_PORT}" \
	--batchSize="${MODEL_BATCH_SIZE}" \
	--batchDelayMs="${MODEL_BATCH_DELAY_MS}" \
	--idleExitMs="${MODEL_IDLE_EXIT_MS}" \
	--heartbeatMs="${MODEL_HEARTBEAT_MS}" \
	--logRequests="${MODEL_LOG_REQUESTS}" \
	--runtimeLogPath="${AI_MCTS_LOG_PATH}" \
	>"${MODEL_LOG_PATH}" 2>&1 &
MODEL_SERVER_PID=$!

(
	while kill -0 "${PARENT_SHELL_PID}" >/dev/null 2>&1; do
		sleep 1
	done
	kill "${MODEL_SERVER_PID}" >/dev/null 2>&1 || true
) &
WATCHDOG_PID=$!

echo "Model server: ${MODEL_SERVER_URL}"
echo "Game URL: http://${GAME_HOST}:${GAME_PORT}/randomizer/index.html"
echo "Model log: ${MODEL_LOG_PATH}"
echo "Game log: ${GAME_LOG_PATH}"
echo "AI MCTS log: ${AI_MCTS_LOG_PATH}"

python3 -m http.server "${GAME_PORT}" --bind "${GAME_HOST}" >"${GAME_LOG_PATH}" 2>&1
