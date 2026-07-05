"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const BOOTSTRAP_ENV = "SETI_CUDA_LIBRARY_PATH_BOOTSTRAPPED";

function unique(values = []) {
  return values.filter((value, index, array) => value && array.indexOf(value) === index);
}

function splitLibraryPath(value = "") {
  return String(value || "")
    .split(":")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function collectVirtualEnvNvidiaLibDirs(repoRoot = path.resolve(__dirname, "..")) {
  const libRoot = path.join(repoRoot, ".venv", "lib");
  if (!fs.existsSync(libRoot)) return [];

  const dirs = [];
  for (const pythonEntry of fs.readdirSync(libRoot, { withFileTypes: true })) {
    if (!pythonEntry.isDirectory() || !pythonEntry.name.startsWith("python")) continue;
    const nvidiaRoot = path.join(libRoot, pythonEntry.name, "site-packages", "nvidia");
    if (!fs.existsSync(nvidiaRoot)) continue;
    for (const packageEntry of fs.readdirSync(nvidiaRoot, { withFileTypes: true })) {
      if (!packageEntry.isDirectory()) continue;
      const libDir = path.join(nvidiaRoot, packageEntry.name, "lib");
      if (fs.existsSync(libDir)) dirs.push(libDir);
    }
  }
  return dirs;
}

function collectSystemCudaLibDirs(env = process.env) {
  const roots = [];
  if (env.CUDA_HOME) roots.push(env.CUDA_HOME);
  if (env.CUDA_PATH) roots.push(env.CUDA_PATH);
  roots.push("/usr/local/cuda");

  const usrLocal = "/usr/local";
  if (fs.existsSync(usrLocal)) {
    for (const entry of fs.readdirSync(usrLocal, { withFileTypes: true })) {
      if (entry.isDirectory() && /^cuda-/.test(entry.name)) roots.push(path.join(usrLocal, entry.name));
    }
  }

  const dirs = [];
  for (const root of unique(roots)) {
    for (const suffix of ["lib64", "lib"]) {
      const dir = path.join(root, suffix);
      if (fs.existsSync(dir)) dirs.push(dir);
    }
  }
  return dirs;
}

function collectCudaLibraryDirs(env = process.env) {
  return unique([
    ...collectVirtualEnvNvidiaLibDirs(),
    ...collectSystemCudaLibDirs(env),
  ]);
}

function injectCudaLibraryPath(env = process.env) {
  const nextEnv = { ...env };
  const existingPaths = splitLibraryPath(nextEnv.LD_LIBRARY_PATH || "");
  const merged = unique([...collectCudaLibraryDirs(nextEnv), ...existingPaths]);
  if (merged.length) nextEnv.LD_LIBRARY_PATH = merged.join(":");
  return nextEnv;
}

function needsBootstrap(env = process.env) {
  const existingPaths = new Set(splitLibraryPath(env.LD_LIBRARY_PATH || ""));
  return collectCudaLibraryDirs(env).some((dir) => !existingPaths.has(dir));
}

function ensureCudaLibraryPathAtProcessStart(scriptPath = process.argv[1], args = process.argv.slice(2)) {
  if (process.env[BOOTSTRAP_ENV] === "1") return;
  if (!needsBootstrap(process.env)) return;

  const env = injectCudaLibraryPath({
    ...process.env,
    [BOOTSTRAP_ENV]: "1",
  });
  const result = spawnSync(process.execPath, [scriptPath, ...args], {
    env,
    stdio: "inherit",
  });
  if (result.signal) {
    process.kill(process.pid, result.signal);
    return;
  }
  process.exit(result.status == null ? 1 : result.status);
}

module.exports = Object.freeze({
  BOOTSTRAP_ENV,
  collectCudaLibraryDirs,
  ensureCudaLibraryPathAtProcessStart,
  injectCudaLibraryPath,
});