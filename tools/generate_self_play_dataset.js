#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawn } = require("child_process");
const cudaLibraryPath = require("./cuda-library-path");

if (require.main === module) {
  cudaLibraryPath.ensureCudaLibraryPathAtProcessStart(__filename, process.argv.slice(2));
}

const selfPlay = require("../randomizer/game/ai/self-play");

function collectCudaLibraryDirs() {
  return cudaLibraryPath.collectCudaLibraryDirs();
}

function injectCudaLibraryPath(env = process.env) {
  return cudaLibraryPath.injectCudaLibraryPath(env);
}

function numberOption(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function parseArgs(argv) {
  const options = {
    seed: "seti-cli-self-play",
    games: 50,
    concurrency: 1,
    workerMode: false,
    difficulty: "hard",
    explorationEpsilon: 0.08,
    explorationTemperature: 1.1,
    mctsRootNoiseEnabled: true,
    mctsRootNoiseAlpha: 0.3,
    mctsRootNoiseWeight: 0.25,
    activePlayerCount: 4,
    maxSteps: 10000,
    simulations: 192,
    maxDepth: 6,
    cpuct: 1.5,
    rolloutDepth: 5,
    out: "tools/_self_play_bc_samples.jsonl",
    summaryOut: "",
    backend: process.env.SELF_PLAY_BACKEND || "core-rules",
    stopOnBlocked: false,
    includeEpisodes: false,
    maxStateEntities: Math.max(1, Math.round(numberOption(process.env.MAX_STATE_ENTITIES, 192))),
    maxCandidateActions: Math.max(1, Math.round(numberOption(process.env.MAX_CANDIDATE_ACTIONS, 40))),
    entityModelServerEnabled: String(process.env.SETI_ENTITY_MODEL_SERVER_ENABLED || "1") !== "0",
    entityModelServerUrl: String(process.env.SETI_ENTITY_MODEL_SERVER_URL || ""),
    entityModelServerCount: Math.max(1, Math.round(numberOption(process.env.SETI_ENTITY_MODEL_SERVER_COUNT, 1))),
    entityModelServerBatchSize: Math.max(1, Math.round(numberOption(process.env.SETI_ENTITY_MODEL_BATCH_SIZE, 16))),
    entityModelServerBatchDelayMs: Math.max(0, Math.round(numberOption(process.env.SETI_ENTITY_MODEL_BATCH_DELAY_MS, 2))),
    entityModelServerMaxConcurrentBatches: Math.max(1, Math.round(numberOption(process.env.SETI_ENTITY_MODEL_MAX_CONCURRENT_BATCHES, 1))),
    entityModelServerIdleExitMs: Math.max(1000, Math.round(numberOption(process.env.SETI_ENTITY_MODEL_IDLE_EXIT_MS, 120000))),
    entityModelServerLogFile: String(process.env.SETI_ENTITY_MODEL_SERVER_LOG_FILE || ""),
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) continue;
    const [keyRaw, inlineValue] = arg.slice(2).split("=");
    const value = inlineValue != null ? inlineValue : argv[index + 1];
    if (inlineValue == null && value != null && !String(value).startsWith("--")) index += 1;

    switch (keyRaw) {
      case "seed":
      case "out":
      case "summaryOut":
      case "backend":
      case "difficulty":
        options[keyRaw] = String(value || options[keyRaw]);
        break;
      case "games":
      case "concurrency":
      case "activePlayerCount":
      case "maxSteps":
      case "simulations":
      case "maxDepth":
        options[keyRaw] = Math.max(1, Math.round(numberOption(value, options[keyRaw])));
        break;
      case "rolloutDepth":
        options.rolloutDepth = Math.max(0, Math.round(numberOption(value, options.rolloutDepth)));
        break;
      case "maxStateEntities":
      case "maxCandidateActions":
        options[keyRaw] = Math.max(1, Math.round(numberOption(value, options[keyRaw])));
        break;
      case "cpuct":
        options.cpuct = Math.max(0.1, numberOption(value, options.cpuct));
        break;
      case "explorationEpsilon":
        options.explorationEpsilon = Math.max(0, Math.min(1, numberOption(value, options.explorationEpsilon)));
        break;
      case "explorationTemperature":
        options.explorationTemperature = Math.max(0.05, numberOption(value, options.explorationTemperature));
        break;
      case "mctsRootNoiseEnabled":
        options.mctsRootNoiseEnabled = String(value) !== "false" && String(value) !== "0";
        break;
      case "mctsRootNoiseAlpha":
        options.mctsRootNoiseAlpha = Math.max(1e-8, numberOption(value, options.mctsRootNoiseAlpha));
        break;
      case "mctsRootNoiseWeight":
        options.mctsRootNoiseWeight = Math.max(0, Math.min(1, numberOption(value, options.mctsRootNoiseWeight)));
        break;
      case "stopOnBlocked":
        options.stopOnBlocked = String(value) !== "false" && String(value) !== "0";
        break;
      case "workerMode":
        options.workerMode = String(value) === "true";
        break;
      case "includeEpisodes":
        options.includeEpisodes = String(value) === "true";
        break;
      case "entityModelServerEnabled":
        options.entityModelServerEnabled = String(value) !== "false" && String(value) !== "0";
        break;
      case "entityModelServerUrl":
        options.entityModelServerUrl = String(value || "");
        break;
      case "entityModelServerCount":
        options.entityModelServerCount = Math.max(1, Math.round(numberOption(value, options.entityModelServerCount)));
        break;
      case "entityModelServerBatchSize":
        options.entityModelServerBatchSize = Math.max(1, Math.round(numberOption(value, options.entityModelServerBatchSize)));
        break;
      case "entityModelServerBatchDelayMs":
        options.entityModelServerBatchDelayMs = Math.max(0, Math.round(numberOption(value, options.entityModelServerBatchDelayMs)));
        break;
      case "entityModelServerMaxConcurrentBatches":
        options.entityModelServerMaxConcurrentBatches = Math.max(1, Math.round(numberOption(value, options.entityModelServerMaxConcurrentBatches)));
        break;
      case "entityModelServerIdleExitMs":
        options.entityModelServerIdleExitMs = Math.max(1000, Math.round(numberOption(value, options.entityModelServerIdleExitMs)));
        break;
      case "entityModelServerLogFile":
        options.entityModelServerLogFile = String(value || "");
        break;
      default:
        throw new Error(`Unknown option --${keyRaw}`);
    }
  }

  return options;
}

function ensureParent(filePath) {
  fs.mkdirSync(path.dirname(path.resolve(filePath)), { recursive: true });
}

function installBrowserLikeGlobals() {
  if (typeof global.structuredClone !== "function") {
    global.structuredClone = (value) => JSON.parse(JSON.stringify(value));
  }
  global.window = global;
  global.globalThis = global;
  if (typeof global.addEventListener !== "function") {
    global.addEventListener = () => {};
  }
  if (typeof global.removeEventListener !== "function") {
    global.removeEventListener = () => {};
  }
  if (typeof global.requestAnimationFrame !== "function") {
    global.requestAnimationFrame = (callback) => setTimeout(() => callback(Date.now()), 0);
  }
  if (typeof global.cancelAnimationFrame !== "function") {
    global.cancelAnimationFrame = (id) => clearTimeout(id);
  }
  if (typeof global.Image !== "function") {
    global.Image = class ImageShim {
      constructor() {
        this.onload = null;
        this.onerror = null;
        this._src = "";
        this._listeners = new Map();
      }

      addEventListener(type, handler) {
        const key = String(type || "");
        if (!this._listeners.has(key)) {
          this._listeners.set(key, new Set());
        }
        this._listeners.get(key).add(handler);
      }

      removeEventListener(type, handler) {
        const key = String(type || "");
        const set = this._listeners.get(key);
        if (!set) return;
        set.delete(handler);
      }

      _emit(type) {
        const set = this._listeners.get(type);
        if (!set) return;
        for (const handler of set) {
          try {
            handler();
          } catch (_error) {
            // Ignore listener errors in headless shim mode.
          }
        }
      }

      set src(value) {
        this._src = String(value || "");
        if (typeof this.onload === "function") {
          setTimeout(() => this.onload(), 0);
        }
        setTimeout(() => this._emit("load"), 0);
      }

      get src() {
        return this._src;
      }
    };
  }
  if (typeof global.getComputedStyle !== "function") {
    global.getComputedStyle = () => ({
      getPropertyValue() {
        return "";
      },
    });
  }
  if (typeof global.ResizeObserver !== "function") {
    global.ResizeObserver = class ResizeObserverShim {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
  if (typeof global.MutationObserver !== "function") {
    global.MutationObserver = class MutationObserverShim {
      observe() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    };
  }
  if (typeof global.CustomEvent !== "function") {
    global.CustomEvent = class CustomEventShim {
      constructor(type, init = {}) {
        this.type = type;
        this.detail = init.detail;
      }
    };
  }

  if (!global.localStorage) {
    const store = new Map();
    global.localStorage = {
      getItem(key) {
        return store.has(key) ? store.get(key) : null;
      },
      setItem(key, value) {
        store.set(key, String(value));
      },
      removeItem(key) {
        store.delete(key);
      },
      clear() {
        store.clear();
      },
    };
  }

  const elementCache = new Map();
  function createClassList(target) {
    const classes = new Set();
    function sync() {
      target._classNameInternal = Array.from(classes).join(" ");
    }
    return {
      add(...tokens) {
        tokens.flat().forEach((token) => {
          if (token) classes.add(String(token));
        });
        sync();
      },
      remove(...tokens) {
        tokens.flat().forEach((token) => classes.delete(String(token)));
        sync();
      },
      toggle(token, force) {
        const key = String(token);
        const shouldAdd = force == null ? !classes.has(key) : Boolean(force);
        if (shouldAdd) classes.add(key);
        else classes.delete(key);
        sync();
        return shouldAdd;
      },
      contains(token) {
        return classes.has(String(token));
      },
      toString() {
        return Array.from(classes).join(" ");
      },
      _replaceFromString(value) {
        classes.clear();
        String(value || "").split(/\s+/).filter(Boolean).forEach((token) => classes.add(token));
        sync();
      },
    };
  }

  function toDataKey(attributeName) {
    return String(attributeName || "")
      .replace(/^data-/, "")
      .replace(/-([a-z])/g, (_match, char) => char.toUpperCase());
  }

  function matchesSelector(node, selector) {
    if (!node || node.nodeType !== 1) return false;
    const trimmed = String(selector || "").trim();
    if (!trimmed) return false;
    if (trimmed.includes(",")) {
      return trimmed.split(",").some((part) => matchesSelector(node, part));
    }

    const classMatches = [...trimmed.matchAll(/\.([A-Za-z0-9_-]+)/g)].map((match) => match[1]);
    for (const className of classMatches) {
      if (!node.classList.contains(className)) return false;
    }

    const dataMatches = [...trimmed.matchAll(/\[data-([A-Za-z0-9_-]+)(?:=("([^"]*)"|'([^']*)'|([^\]]+)))?\]/g)];
    for (const match of dataMatches) {
      const dataKey = toDataKey(`data-${match[1]}`);
      const expected = match[3] ?? match[4] ?? match[5] ?? null;
      const actual = node.dataset[dataKey];
      if (expected == null) {
        if (actual == null) return false;
      } else if (String(actual) !== String(expected)) {
        return false;
      }
    }

    if (trimmed.startsWith(".")) return true;
    if (trimmed.startsWith("[")) return true;
    return String(node.tagName || "").toLowerCase() === trimmed.toLowerCase();
  }

  function collectMatchingDescendants(node, selector, results) {
    const children = Array.isArray(node?.children) ? node.children : [];
    for (const child of children) {
      if (matchesSelector(child, selector)) {
        results.push(child);
      }
      collectMatchingDescendants(child, selector, results);
    }
  }

  function createStubElement() {
    const style = {
      setProperty() {},
      getPropertyValue() {
        return "";
      },
      removeProperty() {},
    };
    let classNameValue = "";
    const listeners = new Map();
    const element = {
      nodeType: 1,
      tagName: "div",
      style,
      dataset: {},
      value: "",
      textContent: "",
      innerHTML: "",
      children: [],
      childNodes: [],
      parentNode: null,
      id: "",
      _classNameInternal: "",
      hidden: false,
      checked: false,
      disabled: false,
      classList: null,
      setAttribute(name, value) {
        const key = String(name || "");
        const nextValue = String(value ?? "");
        if (key === "id") {
          this.id = nextValue;
          elementCache.set(nextValue, this);
          return;
        }
        if (key === "class") {
          this.classList._replaceFromString(nextValue);
          return;
        }
        if (key.startsWith("data-")) {
          this.dataset[toDataKey(key)] = nextValue;
          return;
        }
        this[key] = nextValue;
      },
      getAttribute(name) {
        const key = String(name || "");
        if (key === "id") return this.id || null;
        if (key === "class") return this.className || null;
        if (key.startsWith("data-")) {
          return this.dataset[toDataKey(key)] ?? null;
        }
        return this[key] ?? null;
      },
      removeAttribute(name) {
        const key = String(name || "");
        if (key === "id") {
          if (this.id) elementCache.delete(this.id);
          this.id = "";
          return;
        }
        if (key === "class") {
          this.classList._replaceFromString("");
          return;
        }
        if (key.startsWith("data-")) {
          delete this.dataset[toDataKey(key)];
          return;
        }
        delete this[key];
      },
      appendChild(child) {
        if (!child) return child;
        if (child.parentNode && typeof child.parentNode.removeChild === "function") {
          child.parentNode.removeChild(child);
        }
        child.parentNode = this;
        this.childNodes.push(child);
        if (child.nodeType === 1) this.children.push(child);
        return child;
      },
      append(...items) {
        items.flat().forEach((item) => {
          if (typeof item === "string") {
            this.appendChild(global.document.createTextNode(item));
          } else {
            this.appendChild(item);
          }
        });
      },
      prepend(...items) {
        const normalized = items.flat().map((item) => (
          typeof item === "string" ? global.document.createTextNode(item) : item
        ));
        for (let index = normalized.length - 1; index >= 0; index -= 1) {
          const child = normalized[index];
          if (!child) continue;
          if (child.parentNode && typeof child.parentNode.removeChild === "function") {
            child.parentNode.removeChild(child);
          }
          child.parentNode = this;
          this.childNodes.unshift(child);
          if (child.nodeType === 1) this.children.unshift(child);
        }
      },
      removeChild(child) {
        this.childNodes = this.childNodes.filter((entry) => entry !== child);
        this.children = this.children.filter((entry) => entry !== child);
        if (child) child.parentNode = null;
        return child;
      },
      remove() {
        if (this.parentNode && typeof this.parentNode.removeChild === "function") {
          this.parentNode.removeChild(this);
        }
      },
      replaceChildren(...items) {
        for (const child of this.childNodes) {
          if (child) child.parentNode = null;
        }
        this.childNodes = [];
        this.children = [];
        if (items.length) this.append(...items);
      },
      insertAdjacentHTML() {},
      addEventListener(type, handler) {
        const key = String(type || "");
        if (!listeners.has(key)) listeners.set(key, new Set());
        listeners.get(key).add(handler);
      },
      removeEventListener(type, handler) {
        const key = String(type || "");
        const set = listeners.get(key);
        if (!set) return;
        set.delete(handler);
      },
      dispatchEvent(event) {
        const currentEvent = event || {};
        if (!currentEvent.type) return false;
        if (!currentEvent.target) currentEvent.target = this;
        currentEvent.currentTarget = this;
        if (typeof currentEvent.preventDefault !== "function") {
          currentEvent.defaultPrevented = false;
          currentEvent.preventDefault = function preventDefault() {
            this.defaultPrevented = true;
          };
        }
        if (typeof currentEvent.stopPropagation !== "function") {
          currentEvent._stopped = false;
          currentEvent.stopPropagation = function stopPropagation() {
            this._stopped = true;
          };
        }
        const set = listeners.get(String(currentEvent.type)) || new Set();
        for (const handler of set) {
          handler.call(this, currentEvent);
        }
        if (!currentEvent._stopped && currentEvent.bubbles !== false && this.parentNode?.dispatchEvent) {
          this.parentNode.dispatchEvent(currentEvent);
        }
        return !currentEvent.defaultPrevented;
      },
      focus() {},
      blur() {},
      click() {
        this.dispatchEvent({ type: "click", bubbles: true, target: this });
      },
      scrollIntoView() {},
      closest(selector) {
        let current = this;
        while (current) {
          if (matchesSelector(current, selector)) return current;
          current = current.parentNode;
        }
        return null;
      },
      querySelector(selector) {
        return this.querySelectorAll(selector)[0] || null;
      },
      querySelectorAll(selector) {
        const results = [];
        collectMatchingDescendants(this, selector, results);
        return results;
      },
      getBoundingClientRect() {
        return { left: 0, top: 0, width: 0, height: 0, right: 0, bottom: 0 };
      },
    };
    element.classList = createClassList(element);
    Object.defineProperty(element, "className", {
      get() {
        return element._classNameInternal;
      },
      set(value) {
        classNameValue = String(value || "");
        element._classNameInternal = classNameValue;
        element.classList._replaceFromString(classNameValue);
        classNameValue = element._classNameInternal;
      },
      enumerable: true,
      configurable: true,
    });
    return element;
  }

  global.document = {
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() {
      return false;
    },
    createTextNode(text) {
      return {
        nodeType: 3,
        textContent: String(text || ""),
        parentNode: null,
        remove() {
          if (this.parentNode && typeof this.parentNode.removeChild === "function") {
            this.parentNode.removeChild(this);
          }
        },
      };
    },
    querySelector() {
      return createStubElement();
    },
    querySelectorAll() {
      return [];
    },
    getElementById(id) {
      const key = String(id || "");
      if (!elementCache.has(key)) {
        elementCache.set(key, createStubElement());
      }
      return elementCache.get(key);
    },
    createElement() {
      return createStubElement();
    },
    body: createStubElement(),
  };

  global.navigator = global.navigator || { userAgent: "node" };
  global.performance = global.performance || { now: () => Date.now() };
}

function loadAppBundle() {
  installBrowserLikeGlobals();

  const scriptFiles = [
    "../randomizer/solar-system/layout.js",
    "../randomizer/solar-system/core.js",
    "../randomizer/game/card-catalog.js",
    "../randomizer/game/cards/deck.js",
    "../randomizer/game/cards/effects.js",
    "../randomizer/game/cards/task-state.js",
    "../randomizer/game/basic-cards.js",
    "../randomizer/game/players.js",
    "../randomizer/game/final-scoring.js",
    "../randomizer/game/end-game-scoring.js",
    "../randomizer/game/rockets.js",
    "../randomizer/game/planet-reference-layout.js",
    "../randomizer/game/planet-stats.js",
    "../randomizer/game/actions/shared.js",
    "../randomizer/game/actions/launch.js",
    "../randomizer/game/actions/orbit.js",
    "../randomizer/game/actions/land.js",
    "../randomizer/game/tech/catalog.js",
    "../randomizer/game/tech/board-state.js",
    "../randomizer/game/tech/player-tech.js",
    "../randomizer/game/tech/placement.js",
    "../randomizer/game/tech/bonuses.js",
    "../randomizer/game/tech/resolver.js",
    "../randomizer/game/tech/render.js",
    "../randomizer/game/tech/index.js",
    "../randomizer/game/data/placement.js",
    "../randomizer/game/data/nebula-placement.js",
    "../randomizer/game/data/state.js",
    "../randomizer/game/data/nebula-state.js",
    "../randomizer/game/data/render.js",
    "../randomizer/game/data/nebula-render.js",
    "../randomizer/game/data/index.js",
    "../randomizer/game/actions/research-tech.js",
    "../randomizer/game/actions/planet-rewards.js",
    "../randomizer/game/actions/index.js",
    "../randomizer/game/actions/quick-trades.js",
    "../randomizer/game/actions/scan-effects.js",
    "../randomizer/game/history/action-history.js",
    "../randomizer/game/history/commands.js",
    "../randomizer/game/history/transactions.js",
    "../randomizer/game/abilities/rocket.js",
    "../randomizer/game/abilities/scan.js",
    "../randomizer/game/abilities/planet.js",
    "../randomizer/game/abilities/data.js",
    "../randomizer/game/abilities/tech.js",
    "../randomizer/game/abilities/chain.js",
    "../randomizer/game/abilities/index.js",
    "../randomizer/game/aliens/placement.js",
    "../randomizer/game/aliens/catalog.js",
    "../randomizer/game/aliens/state.js",
    "../randomizer/game/aliens/jiuzhe.js",
    "../randomizer/game/aliens/yichangdian.js",
    "../randomizer/game/aliens/fangzhou.js",
    "../randomizer/game/aliens/banrenma.js",
    "../randomizer/game/aliens/chong.js",
    "../randomizer/game/aliens/amiba.js",
    "../randomizer/game/aliens/aomomo.js",
    "../randomizer/game/aliens/runezu.js",
    "../randomizer/game/aliens/fangzhou-card1-queue.js",
    "../randomizer/game/aliens/reveal-card-grants.js",
    "../randomizer/game/aliens/randomizer.js",
    "../randomizer/game/aliens/render.js",
    "../randomizer/game/aliens/index.js",
    "../randomizer/game/initial-cards.js",
    "../randomizer/game/industry/placement.js",
    "../randomizer/game/industry/state.js",
    "../randomizer/game/industry/catalog.js",
    "../randomizer/game/industry/passives.js",
    "../randomizer/game/industry/abilities.js",
    "../randomizer/game/industry/strategy-passive.js",
    "../randomizer/game/industry/helios-passive.js",
    "../randomizer/game/industry/render.js",
    "../randomizer/game/industry/index.js",
    "../randomizer/game/ai/valuation.js",
    "../randomizer/game/ai/goals.js",
    "../randomizer/game/ai/action-graph.js",
    "../randomizer/game/ai/planner.js",
    "../randomizer/game/ai/evaluator.js",
    "../randomizer/game/ai/policy.js",
    "../randomizer/game/ai/seed.js",
    "../randomizer/game/ai/observation.js",
    "../randomizer/game/ai/legal-actions.js",
    "../randomizer/game/ai/environment.js",
    "../randomizer/game/ai/data-recorder.js",
    "../randomizer/game/ai/mcts.js",
    "../randomizer/game/ai/belief.js",
    "../randomizer/game/ai/policy-network.js",
    "../randomizer/game/ai/value-network.js",
    "../randomizer/game/ai/behavior-cloning.js",
    "../randomizer/game/ai/self-play.js",
    "../randomizer/game/ai/regression-eval.js",
    "../randomizer/game/ai/trained-models.js",
    "../randomizer/game/ai/expert-trained-models.js",
    "../randomizer/game/ai/battle-analytics.js",
    "../randomizer/game/ai/index.js",
    "../randomizer/app/dependencies.js",
    "../randomizer/app/constants.js",
    "../randomizer/app/dom.js",
    "../randomizer/app/events.js",
    "../randomizer/app/action-log-export.js",
    "../randomizer/app/public-api.js",
    "../randomizer/app/ai-controller.js",
    "../randomizer/app.js",
  ];

  for (const relative of scriptFiles) {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    require(path.resolve(__dirname, relative));
  }

  if (!global.SetiRandomizer) {
    throw new Error("SetiRandomizer not initialized after loading app bundle");
  }

  return global.SetiRandomizer;
}

const DATASET_SCHEMA_VERSION = 3;

function cloneValue(value) {
  if (value == null) return value;
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function toDecisionLevel(log) {
  return log?.type === "turn-action" ? "turn" : "subflow";
}

function toDecisionType(log) {
  if (!log?.type) return null;
  return log.type === "turn-action" ? "turn-action" : String(log.type);
}

function toPolicyTargetEnvelope(log, fallbackIndex = 0) {
  const action = log?.details?.action || null;
  if (!action) {
    return {
      id: null,
      kind: null,
      actionLevel: toDecisionLevel(log),
      decisionType: toDecisionType(log),
      targetKey: `unknown:${fallbackIndex}`,
    };
  }
  const target = {
    id: action.id || null,
    kind: action.kind || null,
    actionLevel: toDecisionLevel(log),
    decisionType: toDecisionType(log),
    targetKey: `${action.kind || "unknown"}:${action.id || fallbackIndex}`,
  };
  if (action.direction != null) target.direction = action.direction;
  if (action.rocketId != null) target.rocketId = action.rocketId;
  if (action.cardId != null) target.cardId = action.cardId;
  if (action.cardInstanceId != null) target.cardInstanceId = action.cardInstanceId;
  if (action.tileId != null) target.tileId = action.tileId;
  if (action.planetId != null) target.planetId = action.planetId;
  return target;
}

function buildDecisionContext(log, episode = {}) {
  return {
    actionLevel: toDecisionLevel(log),
    decisionType: toDecisionType(log),
    pendingState: cloneValue(log?.details?.pendingState || episode?.pendingState || null),
    pendingScanTargetType: log?.details?.pendingScanTargetType
      || log?.details?.pendingState?.pendingScanTargetType
      || episode?.pendingState?.pendingScanTargetType
      || null,
  };
}

function buildObservationEnvelope(log, episode = {}) {
  const observation = log?.details?.observation || null;
  const legalActions = Array.isArray(log?.details?.candidates) ? log.details.candidates : null;
  return {
    version: 2,
    decisionContext: buildDecisionContext(log, episode),
    observation: observation ? cloneValue(observation) : null,
    legalActions: legalActions ? cloneValue(legalActions) : null,
  };
}

function summarizeObservationQuality(samples = [], options = {}) {
  let withObservation = 0;
  let missingObservation = 0;
  let totalEntityCount = 0;
  let maxEntityCount = 0;
  let entityTruncationCount = 0;
  let candidateTruncationCount = 0;
  const maxStateEntities = Math.max(1, Math.round(Number(options?.maxStateEntities) || 192));
  const maxCandidateActions = Math.max(1, Math.round(Number(options?.maxCandidateActions) || 40));

  for (const sample of samples || []) {
    const observation = sample?.observationEnvelope?.observation;
    const legalCandidates = (Array.isArray(sample?.candidates) ? sample.candidates : [])
      .filter((candidate) => candidate && candidate.available !== false);
    if (legalCandidates.length > maxCandidateActions) candidateTruncationCount += 1;

    if (observation && typeof observation === "object") {
      withObservation += 1;
      const entities = Array.isArray(observation.compactEntities) ? observation.compactEntities : [];
      totalEntityCount += entities.length;
      if (entities.length > maxEntityCount) maxEntityCount = entities.length;
      if (entities.length > maxStateEntities) entityTruncationCount += 1;
    } else {
      missingObservation += 1;
    }
  }

  return {
    withObservation,
    observationMissingCount: missingObservation,
    avgEntityCount: withObservation > 0 ? (totalEntityCount / withObservation) : 0,
    maxEntityCount,
    maxStateEntities,
    maxCandidateActions,
    entityTruncationCount,
    candidateTruncationCount,
  };
}

function buildSampleFromLog(log, context = {}) {
  const gameIndex = Math.max(1, Number(context.gameIndex) || 1);
  const stepIndex = Math.max(1, Number(context.stepIndex) || 1);
  const seed = context.seed || "seti-self-play";
  const policyTarget = toPolicyTargetEnvelope(log, stepIndex);
  const playerResult = context.playerResult || null;
  const episodeState = context.episode || {};
  return {
    schemaVersion: DATASET_SCHEMA_VERSION,
    sampleId: `${seed}:g${gameIndex}:s${stepIndex}`,
    seed,
    stepIndex,
    logType: log?.type || null,
    actionLevel: policyTarget.actionLevel,
    decisionType: policyTarget.decisionType,
    roundNumber: Number(log?.roundNumber || 0),
    turnNumber: Number(log?.turnNumber || 0),
    playerId: log?.playerId || null,
    playerLabel: log?.playerLabel || null,
    policyTarget: {
      id: policyTarget.id,
      kind: policyTarget.kind,
    },
    policyTargetV2: policyTarget,
    candidates: Array.isArray(log?.details?.candidates) ? log.details.candidates : null,
    details: log?.details || null,
    observationEnvelope: buildObservationEnvelope(log, episodeState),
    finalScore: Number(playerResult?.finalScore || 0),
    finalRank: Number(playerResult?.rank || 0),
    gameEnded: Boolean(episodeState?.gameEnded),
    blocked: Boolean(episodeState?.blocked),
    ok: episodeState?.ok !== false,
  };
}

function buildDatasetFromBatch(batchResult, seed) {
  const samples = [];
  const episodes = [];

  for (let gameIndex = 0; gameIndex < (batchResult.samples || []).length; gameIndex += 1) {
    const game = batchResult.samples[gameIndex] || {};
    const logs = Array.isArray(game.tailLogs) ? game.tailLogs : [];
    const allLogs = Array.isArray(game.logs) ? game.logs : logs;

    let stepIndex = 0;
    for (const log of allLogs) {
      if (log?.type !== "turn-action") continue;
      stepIndex += 1;
      const playerResult = game?.playerResults?.find((entry) => entry.playerId === log.playerId) || null;
      samples.push(buildSampleFromLog(log, {
        seed,
        gameIndex: gameIndex + 1,
        stepIndex,
        playerResult,
        episode: {
          blocked: Boolean(game?.summary?.blocked),
          gameEnded: Boolean(game?.summary?.gameEnded),
          ok: game?.summary?.ok !== false,
          pendingState: game?.summary?.pendingState || null,
        },
      }));
    }

    episodes.push({
      seed: game.seed || `${seed}:${gameIndex + 1}`,
      sampleCount: stepIndex,
      blocked: Boolean(game?.summary?.blocked),
      gameEnded: Boolean(game?.summary?.gameEnded),
      ok: game?.summary?.ok !== false,
      steps: Number(game?.summary?.steps || 0),
    });
  }

  return {
    version: DATASET_SCHEMA_VERSION,
    seed,
    generatedAt: new Date().toISOString(),
    sampleCount: samples.length,
    samples,
    episodes,
  };
}

function buildDatasetFromReports(reports, seed) {
  const samples = [];
  const episodes = [];

  for (let gameIndex = 0; gameIndex < reports.length; gameIndex += 1) {
    const report = reports[gameIndex] || {};
    const logs = Array.isArray(report.logs) ? report.logs : [];
    const playerResults = Array.isArray(report.playerResults) ? report.playerResults : [];

    let stepIndex = 0;
    for (const log of logs) {
      if (log?.type !== "turn-action") continue;
      stepIndex += 1;
      const playerResult = playerResults.find((entry) => entry.playerId === log.playerId) || null;
      samples.push(buildSampleFromLog(log, {
        seed,
        gameIndex: gameIndex + 1,
        stepIndex,
        playerResult,
        episode: {
          blocked: Boolean(report?.lastSummary?.blocked),
          gameEnded: Boolean(report?.lastSummary?.gameEnded),
          ok: report?.lastSummary?.ok !== false,
          pendingState: report?.pendingState || null,
        },
      }));
    }

    episodes.push({
      seed: report?.lastSummary?.seed || `${seed}:${gameIndex + 1}`,
      sampleCount: stepIndex,
      blocked: Boolean(report?.lastSummary?.blocked),
      gameEnded: Boolean(report?.lastSummary?.gameEnded),
      ok: report?.lastSummary?.ok !== false,
      steps: Number(report?.lastSummary?.steps || 0),
      message: report?.lastSummary?.message || null,
      bugCount: Array.isArray(report?.bugs) ? report.bugs.length : 0,
      bugs: Array.isArray(report?.bugs)
        ? report.bugs.slice(-5).map((bug) => ({
          message: bug?.message || null,
          details: bug?.details || null,
        }))
        : [],
      pendingState: report?.pendingState || null,
      tailLogs: Array.isArray(report?.logs) ? report.logs.slice(-5) : [],
    });
  }

  return {
    version: DATASET_SCHEMA_VERSION,
    seed,
    generatedAt: new Date().toISOString(),
    sampleCount: samples.length,
    samples,
    episodes,
  };
}

function extractSamplesAndEpisodeFromReport(report = {}, seed = "seti-self-play", gameIndex = 1) {
  const logs = Array.isArray(report.logs) ? report.logs : [];
  const playerResults = Array.isArray(report.playerResults) ? report.playerResults : [];
  const samples = [];

  let stepIndex = 0;
  for (const log of logs) {
    if (log?.type !== "turn-action") continue;
    stepIndex += 1;
    const playerResult = playerResults.find((entry) => entry.playerId === log.playerId) || null;
    samples.push(buildSampleFromLog(log, {
      seed,
      gameIndex,
      stepIndex,
      playerResult,
      episode: {
        blocked: Boolean(report?.lastSummary?.blocked),
        gameEnded: Boolean(report?.lastSummary?.gameEnded),
        ok: report?.lastSummary?.ok !== false,
        pendingState: report?.pendingState || null,
      },
    }));
  }

  const episode = {
    seed: report?.lastSummary?.seed || `${seed}:${gameIndex}`,
    sampleCount: stepIndex,
    blocked: Boolean(report?.lastSummary?.blocked),
    gameEnded: Boolean(report?.lastSummary?.gameEnded),
    ok: report?.lastSummary?.ok !== false,
    steps: Number(report?.lastSummary?.steps || 0),
    message: report?.lastSummary?.message || null,
    bugCount: Array.isArray(report?.bugs) ? report.bugs.length : 0,
    bugs: Array.isArray(report?.bugs)
      ? report.bugs.slice(-5).map((bug) => ({
        message: bug?.message || null,
        details: bug?.details || null,
      }))
      : [],
    pendingState: report?.pendingState || null,
    tailLogs: Array.isArray(report?.logs) ? report.logs.slice(-5) : [],
  };

  return { samples, episode };
}

async function writeSamplesToJsonlStream(stream, samples = []) {
  for (const sample of samples) {
    const chunk = `${JSON.stringify(sample)}\n`;
    if (!stream.write(chunk)) {
      // Respect stream backpressure for large datasets.
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => stream.once("drain", resolve));
    }
  }
}

async function runAppFullBackend(options) {
  const emitProgress = String(process.env.SETI_SELF_PLAY_PROGRESS || "") === "1";
  process.env = injectCudaLibraryPath(process.env);
  const api = loadAppBundle();
  const runSingle = typeof api.runAiAutoBattle === "function"
    ? api.runAiAutoBattle.bind(api)
    : (typeof api.startAiAutoBattle === "function" ? api.startAiAutoBattle.bind(api) : null);
  if (!runSingle) {
    throw new Error("SetiRandomizer API missing runAiAutoBattle/startAiAutoBattle");
  }

  const keepSamplesInMemory = options.workerMode !== true;
  const collectedSamples = keepSamplesInMemory ? [] : null;
  const collectedEpisodes = [];
  const blockedMessages = [];
  const bugMessages = [];
  let gamesRun = 0;
  let blockedGames = 0;
  let allOk = true;
  let sampleCount = 0;
  let totalWithObservation = 0;
  let totalObservationMissingCount = 0;
  let totalEntityCount = 0;
  let maxEntityCount = 0;
  let totalEntityTruncationCount = 0;
  let totalCandidateTruncationCount = 0;
  let totalPlayerScore = 0;
  let totalPlayerCount = 0;
  let totalWinnerScore = 0;
  let totalWinnerCount = 0;
  let outputStream = null;

  if (!keepSamplesInMemory && options.out) {
    ensureParent(options.out);
    outputStream = fs.createWriteStream(path.resolve(options.out), { encoding: "utf-8" });
  }

  let lastRuntimeDebug = null;
  try {
    for (let index = 0; index < options.games; index += 1) {
      const gameSeed = `${options.seed}:${index + 1}`;

      if (typeof api.configureAiAutoBattle === "function") {
        api.configureAiAutoBattle({
          reset: true,
          activePlayerCount: options.activePlayerCount,
          difficulty: options.difficulty,
          explorationEpsilon: options.explorationEpsilon,
          explorationTemperature: options.explorationTemperature,
          mctsRootNoiseEnabled: options.mctsRootNoiseEnabled,
          mctsRootNoiseAlpha: options.mctsRootNoiseAlpha,
          mctsRootNoiseWeight: options.mctsRootNoiseWeight,
          mctsSimulationsPerMove: options.simulations,
          mctsMaxDepth: options.maxDepth,
          mctsCpuct: options.cpuct,
          mctsRolloutDepth: options.rolloutDepth,
          stepDelayMs: 0,
        });

        const turnState = typeof api.getTurnState === "function" ? api.getTurnState() : null;
        const activePlayerIds = Array.isArray(turnState?.activePlayerIds) ? turnState.activePlayerIds : [];
        if (activePlayerIds.length) {
          api.configureAiAutoBattle({
            reset: false,
            playerIds: activePlayerIds,
            difficulty: options.difficulty,
            explorationEpsilon: options.explorationEpsilon,
            explorationTemperature: options.explorationTemperature,
            mctsRootNoiseEnabled: options.mctsRootNoiseEnabled,
            mctsRootNoiseAlpha: options.mctsRootNoiseAlpha,
            mctsRootNoiseWeight: options.mctsRootNoiseWeight,
            mctsSimulationsPerMove: options.simulations,
            mctsMaxDepth: options.maxDepth,
            mctsCpuct: options.cpuct,
            mctsRolloutDepth: options.rolloutDepth,
            activePlayerCount: options.activePlayerCount,
            stepDelayMs: 0,
          });
        }

        if (typeof api.getInitialSelectionState === "function" && typeof api.startInitialSelection === "function") {
          const setupState = api.getInitialSelectionState();
          const setupPlayerId = setupState?.currentPlayerId || null;
          const setupOffer = setupPlayerId
            ? (setupState?.offersByPlayerId?.[setupPlayerId] || null)
            : null;
          if (setupState?.phase === "selecting" && !setupOffer) {
            api.startInitialSelection();
          }
        }
      }

      // runAiAutoBattle returns full logs including turn-action and pending-flow handling.
      const report = await runSingle({
        seed: gameSeed,
        reset: false,
        activePlayerCount: options.activePlayerCount,
        difficulty: options.difficulty,
        explorationEpsilon: options.explorationEpsilon,
        explorationTemperature: options.explorationTemperature,
        mctsRootNoiseEnabled: options.mctsRootNoiseEnabled,
        mctsRootNoiseAlpha: options.mctsRootNoiseAlpha,
        mctsRootNoiseWeight: options.mctsRootNoiseWeight,
        mctsSimulationsPerMove: options.simulations,
        mctsMaxDepth: options.maxDepth,
        mctsCpuct: options.cpuct,
        mctsRolloutDepth: options.rolloutDepth,
        maxSteps: options.maxSteps,
        stopOnBlocked: options.stopOnBlocked,
        sequenceWindowTurns: "all",
        stepDelayMs: 0,
      });

      const { samples: gameSamples, episode } = extractSamplesAndEpisodeFromReport(report || {}, options.seed, index + 1);
      if (keepSamplesInMemory) {
        collectedSamples.push(...gameSamples);
      } else if (outputStream) {
        // eslint-disable-next-line no-await-in-loop
        await writeSamplesToJsonlStream(outputStream, gameSamples);
      }
      sampleCount += gameSamples.length;

      const q = summarizeObservationQuality(gameSamples, options);
      totalWithObservation += Number(q.withObservation || 0);
      totalObservationMissingCount += Number(q.observationMissingCount || 0);
      totalEntityCount += Number(q.avgEntityCount || 0) * Number(q.withObservation || 0);
      maxEntityCount = Math.max(maxEntityCount, Number(q.maxEntityCount || 0));
      totalEntityTruncationCount += Number(q.entityTruncationCount || 0);
      totalCandidateTruncationCount += Number(q.candidateTruncationCount || 0);

      if (options.includeEpisodes) collectedEpisodes.push(episode);

      gamesRun += 1;
      const isBlocked = Boolean(report?.lastSummary?.blocked);
      const isOk = report?.lastSummary?.ok !== false;
      if (isBlocked) blockedGames += 1;
      allOk = allOk && isOk;

      const playerResults = Array.isArray(report?.playerResults) ? report.playerResults : [];
      for (const entry of playerResults) {
        const finalScore = Number(entry?.finalScore);
        if (!Number.isFinite(finalScore)) continue;
        totalPlayerScore += finalScore;
        totalPlayerCount += 1;
      }
      const winnerScore = playerResults.reduce((best, entry) => {
        const value = Number(entry?.finalScore);
        if (!Number.isFinite(value)) return best;
        return Math.max(best, value);
      }, -Infinity);
      if (Number.isFinite(winnerScore)) {
        totalWinnerScore += winnerScore;
        totalWinnerCount += 1;
      }

      const message = report?.lastSummary?.message;
      if (isBlocked && typeof message === "string" && message.trim()) {
        blockedMessages.push(message);
      }
      const bugs = Array.isArray(report?.bugs) ? report.bugs : [];
      for (const bug of bugs) {
        const bugMessage = bug?.message;
        if (typeof bugMessage === "string" && bugMessage.trim()) bugMessages.push(bugMessage);
      }

      if (emitProgress) {
        process.stderr.write(`[SELF_PLAY_GAME_DONE] ${index + 1}/${options.games} seed=${gameSeed}\n`);
      }
      if (isBlocked || !isOk) {
        lastRuntimeDebug = {
          setupState: typeof api.getInitialSelectionState === "function" ? api.getInitialSelectionState() : null,
          turnState: typeof api.getTurnState === "function" ? api.getTurnState() : null,
          playerState: typeof api.getPlayerState === "function" ? api.getPlayerState() : null,
        };
      }
      if (options.stopOnBlocked && (isBlocked || !isOk)) {
        break;
      }
    }
  } finally {
    if (outputStream) {
      await new Promise((resolve, reject) => {
        outputStream.on("error", reject);
        outputStream.end(resolve);
      });
    }
  }

  const observationQuality = {
    withObservation: totalWithObservation,
    observationMissingCount: totalObservationMissingCount,
    avgEntityCount: totalWithObservation > 0 ? (totalEntityCount / totalWithObservation) : 0,
    maxEntityCount,
    maxStateEntities: Math.max(1, Math.round(Number(options?.maxStateEntities) || 192)),
    maxCandidateActions: Math.max(1, Math.round(Number(options?.maxCandidateActions) || 40)),
    entityTruncationCount: totalEntityTruncationCount,
    candidateTruncationCount: totalCandidateTruncationCount,
  };
  const finalSampleCount = keepSamplesInMemory ? collectedSamples.length : sampleCount;

  return {
    mode: "app-full",
    dataset: {
      version: DATASET_SCHEMA_VERSION,
      seed: options.seed,
      generatedAt: new Date().toISOString(),
      sampleCount: finalSampleCount,
      samples: keepSamplesInMemory ? collectedSamples : null,
      episodes: options.includeEpisodes ? collectedEpisodes : [],
      preWrittenOutput: !keepSamplesInMemory,
    },
    summary: {
      ok: allOk,
      gamesRequested: options.games,
      gamesRun,
      blockedGames,
      sampleCount: finalSampleCount,
      ...observationQuality,
      averageFinalScore: totalPlayerCount > 0 ? totalPlayerScore / totalPlayerCount : 0,
      averageWinnerFinalScore: totalWinnerCount > 0 ? totalWinnerScore / totalWinnerCount : 0,
      blockedMessages: blockedMessages.slice(0, 5),
      bugMessages: bugMessages.slice(0, 10),
      runtimeDebug: lastRuntimeDebug,
    },
  };
}

function runCoreRulesBackend(options) {
  const coreGeneratorPath = path.resolve(__dirname, "generate_self_play_dataset.core.js");
  if (!fs.existsSync(coreGeneratorPath)) {
    throw new Error("core-rules backend file missing: tools/generate_self_play_dataset.core.js");
  }
  // eslint-disable-next-line global-require, import/no-dynamic-require
  const coreBackend = require(coreGeneratorPath);
  if (typeof coreBackend.runCoreRulesSelfPlay !== "function") {
    throw new Error("core-rules backend missing runCoreRulesSelfPlay export");
  }
  return coreBackend.runCoreRulesSelfPlay(options);
}

function buildWorkerGameCounts(totalGames, workerCount) {
  const counts = [];
  const base = Math.floor(totalGames / workerCount);
  const remainder = totalGames % workerCount;
  for (let index = 0; index < workerCount; index += 1) {
    counts.push(base + (index < remainder ? 1 : 0));
  }
  return counts.filter((count) => count > 0);
}

function parseJsonlFile(filePath) {
  const text = fs.readFileSync(filePath, "utf-8");
  if (!text.trim()) return [];
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

async function appendJsonlFilesToOutput(filePaths = [], outputPath = "") {
  ensureParent(outputPath);
  const resolvedOut = path.resolve(outputPath);
  const outStream = fs.createWriteStream(resolvedOut, { encoding: "utf-8" });
  let totalLines = 0;

  const appendOne = (filePath) => new Promise((resolve, reject) => {
    const inStream = fs.createReadStream(filePath, { encoding: "utf-8" });
    let buffered = "";

    inStream.on("data", (chunk) => {
      const text = String(chunk || "");
      buffered += text;
      for (let i = 0; i < text.length; i += 1) {
        if (text.charCodeAt(i) === 10) totalLines += 1;
      }
    });
    inStream.on("error", reject);
    inStream.on("end", () => {
      if (buffered && !buffered.endsWith("\n")) totalLines += 1;
      resolve();
    });
    inStream.pipe(outStream, { end: false });
  });

  try {
    for (const filePath of filePaths) {
      await appendOne(filePath);
    }
  } finally {
    await new Promise((resolve) => outStream.end(resolve));
  }

  return totalLines;
}

function summarizeFinalScoresFromReports(reports = []) {
  let totalPlayerScore = 0;
  let totalPlayerCount = 0;
  let totalWinnerScore = 0;
  let totalWinnerCount = 0;

  for (const report of reports) {
    const playerResults = Array.isArray(report?.playerResults) ? report.playerResults : [];
    if (!playerResults.length) continue;
    for (const entry of playerResults) {
      const finalScore = Number(entry?.finalScore);
      if (!Number.isFinite(finalScore)) continue;
      totalPlayerScore += finalScore;
      totalPlayerCount += 1;
    }
    const winnerScore = playerResults.reduce((best, entry) => {
      const value = Number(entry?.finalScore);
      if (!Number.isFinite(value)) return best;
      return Math.max(best, value);
    }, -Infinity);
    if (Number.isFinite(winnerScore)) {
      totalWinnerScore += winnerScore;
      totalWinnerCount += 1;
    }
  }

  return {
    averageFinalScore: totalPlayerCount > 0 ? totalPlayerScore / totalPlayerCount : 0,
    averageWinnerFinalScore: totalWinnerCount > 0 ? totalWinnerScore / totalWinnerCount : 0,
  };
}

function runSelfPlayWorker({
  options,
  backend,
  workerIndex,
  workerGames,
  outPath,
  summaryPath,
  env = process.env,
}) {
  const workerSeed = `${options.seed}:w${workerIndex + 1}`;
  const args = [
    __filename,
    `--seed=${workerSeed}`,
    `--games=${workerGames}`,
    `--concurrency=1`,
    "--workerMode=true",
    `--activePlayerCount=${options.activePlayerCount}`,
    `--difficulty=${options.difficulty}`,
    `--explorationEpsilon=${options.explorationEpsilon}`,
    `--explorationTemperature=${options.explorationTemperature}`,
    `--mctsRootNoiseEnabled=${options.mctsRootNoiseEnabled ? "true" : "false"}`,
    `--mctsRootNoiseAlpha=${options.mctsRootNoiseAlpha}`,
    `--mctsRootNoiseWeight=${options.mctsRootNoiseWeight}`,
    `--maxSteps=${options.maxSteps}`,
    `--simulations=${options.simulations}`,
    `--maxDepth=${options.maxDepth}`,
    `--cpuct=${options.cpuct}`,
    `--rolloutDepth=${options.rolloutDepth}`,
    `--out=${outPath}`,
    `--summaryOut=${summaryPath}`,
    `--backend=${backend}`,
    `--stopOnBlocked=${options.stopOnBlocked ? "true" : "false"}`,
    `--includeEpisodes=${options.includeEpisodes ? "true" : "false"}`,
  ];

  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      cwd: process.cwd(),
      env: injectCudaLibraryPath(env),
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += String(chunk || "");
    });
    child.stderr.on("data", (chunk) => {
      const text = String(chunk || "");
      stderr += text;
      process.stderr.write(text);
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(
          `Worker ${workerIndex + 1} failed with exit code ${code}\n${stderr || stdout || "(no output)"}`,
        ));
        return;
      }
      resolve({
        workerIndex,
        workerSeed,
        outPath,
        summaryPath,
      });
    });
  });
}

function waitForEntityModelServerReady(url, timeoutMs = 15000) {
  const startedAt = Date.now();
  return new Promise((resolve, reject) => {
    function attempt() {
      const request = require("http").get(`${url}/health`, (response) => {
        response.resume();
        if (response.statusCode >= 200 && response.statusCode < 300) {
          resolve();
          return;
        }
        retry();
      });
      request.on("error", retry);
      request.setTimeout(1000, () => {
        request.destroy();
        retry();
      });
    }
    function retry() {
      if (Date.now() - startedAt >= timeoutMs) {
        reject(new Error(`entity model server not ready: ${url}`));
        return;
      }
      setTimeout(attempt, 100);
    }
    attempt();
  });
}

async function startEntityModelServerIfNeeded(options, backend, workerCount) {
  if (backend !== "app-full") return null;
  if (options.workerMode) return null;
  if (workerCount <= 1) return null;
  if (!options.entityModelServerEnabled) return null;
  if (options.entityModelServerUrl) return { servers: [{ url: options.entityModelServerUrl, process: null, logFile: null }] };

  const serverCount = Math.max(1, Math.min(Math.round(options.entityModelServerCount || 1), workerCount));
  const servers = [];
  for (let serverIndex = 0; serverIndex < serverCount; serverIndex += 1) {
    // eslint-disable-next-line no-await-in-loop
    servers.push(await startEntityModelServerProcess(options, serverIndex, serverCount));
  }
  console.error(`[self-play] entity model server pool started count=${servers.length}`);
  return { servers };
}

async function startEntityModelServerProcess(options, serverIndex = 0, serverCount = 1) {
  const logFile = options.entityModelServerLogFile
    ? path.resolve(serverCount > 1
      ? options.entityModelServerLogFile.replace(/(\.[^./\\]+)?$/, `-${serverIndex}$1`)
      : options.entityModelServerLogFile)
    : path.resolve("tools", "_self_play_tmp", `entity-model-server-${process.pid}-${serverIndex}.log`);
  ensureParent(logFile);
  fs.writeFileSync(logFile, "", "utf8");

  const args = [
    path.resolve(__dirname, "entity_model_server.js"),
    "--host=127.0.0.1",
    "--port=0",
    `--batchSize=${options.entityModelServerBatchSize}`,
    `--batchDelayMs=${options.entityModelServerBatchDelayMs}`,
    `--maxConcurrentBatches=${options.entityModelServerMaxConcurrentBatches}`,
    `--idleExitMs=${options.entityModelServerIdleExitMs}`,
  ];
  const child = spawn(process.execPath, args, {
    cwd: process.cwd(),
    env: injectCudaLibraryPath({
      ...process.env,
      SETI_ONNX_EXECUTION_PROVIDERS: process.env.SETI_ONNX_EXECUTION_PROVIDERS || "cuda",
    }),
    stdio: ["ignore", "pipe", "pipe"],
  });

  let stdout = "";
  let stderr = "";
  child.stderr.on("data", (chunk) => {
    const text = String(chunk || "");
    stderr += text;
    fs.appendFileSync(logFile, text);
  });

  const url = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`entity model server failed to start${stderr ? `: ${stderr}` : ""}`));
    }, 15000);
    child.stdout.on("data", (chunk) => {
      stdout += String(chunk || "");
      const lines = stdout.split(/\r?\n/).filter(Boolean);
      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          if (parsed?.ok && parsed?.url) {
            clearTimeout(timeout);
            resolve(parsed.url);
            return;
          }
        } catch (_error) {
          // Ignore non-JSON startup noise.
        }
      }
    });
    child.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.on("exit", (code) => {
      if (code === 0) return;
      clearTimeout(timeout);
      reject(new Error(`entity model server exited early with code ${code}${stderr ? `: ${stderr}` : ""}`));
    });
  });
  await waitForEntityModelServerReady(url);
  console.error(`[self-play] entity model server started index=${serverIndex}/${serverCount} url=${url} log=${logFile}`);
  return { url, process: child, logFile, index: serverIndex };
}

function stopEntityModelServer(handle) {
  const servers = Array.isArray(handle?.servers) ? handle.servers : (handle ? [handle] : []);
  for (const server of servers) {
    if (!server?.process || server.process.killed) continue;
    server.process.kill("SIGTERM");
  }
}

function selectEntityModelServerUrl(handle, slotIndex = 0) {
  const servers = Array.isArray(handle?.servers) ? handle.servers : [];
  if (!servers.length) return "";
  return servers[Math.max(0, slotIndex) % servers.length]?.url || "";
}

async function runConcurrentBackend(options, backend) {
  const workerCount = Math.max(1, Math.min(Math.round(options.concurrency || 1), options.games));
  if (workerCount <= 1) {
    if (backend === "app-full") return runAppFullBackend(options);
    return runCoreRulesBackend(options);
  }

  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "seti-self-play-"));
  const modelServer = await startEntityModelServerIfNeeded(options, backend, workerCount);
  try {
    // Run one game per child process to avoid long-lived worker memory growth.
    const workerResults = [];
    let nextGameIndex = 0;
    async function workerLoop(slotIndex) {
      while (true) {
        const gameIndex = nextGameIndex;
        nextGameIndex += 1;
        if (gameIndex >= options.games) break;

        const outPath = path.join(tempRoot, `game-${gameIndex + 1}.jsonl`);
        const summaryPath = path.join(tempRoot, `game-${gameIndex + 1}.summary.json`);
        // Use a stable per-game seed to keep results reproducible.
        // Worker runs exactly one game and exits.
        // eslint-disable-next-line no-await-in-loop
        const result = await runSelfPlayWorker({
          options: {
            ...options,
            seed: `${options.seed}:game-${gameIndex + 1}`,
          },
          backend,
          workerIndex: slotIndex,
          workerGames: 1,
          outPath,
          summaryPath,
          env: selectEntityModelServerUrl(modelServer, slotIndex)
            ? { ...process.env, SETI_ENTITY_MODEL_SERVER_URL: selectEntityModelServerUrl(modelServer, slotIndex) }
            : process.env,
        });
        workerResults.push({
          ...result,
          gameIndex,
        });
      }
    }

    const loops = [];
    for (let slotIndex = 0; slotIndex < workerCount; slotIndex += 1) {
      loops.push(workerLoop(slotIndex));
    }
    await Promise.all(loops);
    workerResults.sort((left, right) => left.gameIndex - right.gameIndex);

    const workerOutPaths = [];
    const allEpisodes = options.includeEpisodes ? [] : null;
    const blockedMessages = [];
    const bugMessages = [];
    let gamesRun = 0;
    let blockedGames = 0;
    let allOk = true;
    let weightedAverageFinalScoreTotal = 0;
    let weightedAverageFinalScoreCount = 0;
    let weightedAverageWinnerFinalScoreTotal = 0;
    let weightedAverageWinnerFinalScoreCount = 0;
    let totalWithObservation = 0;
    let totalObservationMissingCount = 0;
    let totalEntityCount = 0;
    let maxEntityCount = 0;
    let totalEntityTruncationCount = 0;
    let totalCandidateTruncationCount = 0;

    for (const workerResult of workerResults) {
      workerOutPaths.push(workerResult.outPath);

      const workerSummary = JSON.parse(fs.readFileSync(workerResult.summaryPath, "utf-8"));
      if (options.includeEpisodes && Array.isArray(workerSummary.episodes)) {
        allEpisodes.push(...workerSummary.episodes);
      }

      const summary = workerSummary.summary || {};
      gamesRun += Number(summary.gamesRun || 0);
      blockedGames += Number(summary.blockedGames || 0);
      allOk = allOk && (summary.ok !== false);
      const workerGamesRun = Math.max(0, Number(summary.gamesRun || 0));
      const workerAverageFinalScore = Number(summary.averageFinalScore || 0);
      const workerAverageWinnerFinalScore = Number(summary.averageWinnerFinalScore || 0);
      if (workerGamesRun > 0 && Number.isFinite(workerAverageFinalScore)) {
        weightedAverageFinalScoreTotal += workerAverageFinalScore * workerGamesRun;
        weightedAverageFinalScoreCount += workerGamesRun;
      }
      if (workerGamesRun > 0 && Number.isFinite(workerAverageWinnerFinalScore)) {
        weightedAverageWinnerFinalScoreTotal += workerAverageWinnerFinalScore * workerGamesRun;
        weightedAverageWinnerFinalScoreCount += workerGamesRun;
      }

      if (Array.isArray(summary.blockedMessages)) {
        blockedMessages.push(...summary.blockedMessages.filter((message) => typeof message === "string"));
      }
      if (Array.isArray(summary.bugMessages)) {
        bugMessages.push(...summary.bugMessages.filter((message) => typeof message === "string"));
      }

      const workerWithObservation = Math.max(0, Number(summary.withObservation || 0));
      const workerAvgEntityCount = Number(summary.avgEntityCount || 0);
      totalWithObservation += workerWithObservation;
      totalObservationMissingCount += Math.max(0, Number(summary.observationMissingCount || 0));
      if (workerWithObservation > 0 && Number.isFinite(workerAvgEntityCount)) {
        totalEntityCount += workerAvgEntityCount * workerWithObservation;
      }
      maxEntityCount = Math.max(maxEntityCount, Math.max(0, Number(summary.maxEntityCount || 0)));
      totalEntityTruncationCount += Math.max(0, Number(summary.entityTruncationCount || 0));
      totalCandidateTruncationCount += Math.max(0, Number(summary.candidateTruncationCount || 0));
    }

    const sampleCount = await appendJsonlFilesToOutput(workerOutPaths, options.out);
    const observationQuality = {
      withObservation: totalWithObservation,
      observationMissingCount: totalObservationMissingCount,
      avgEntityCount: totalWithObservation > 0 ? (totalEntityCount / totalWithObservation) : 0,
      maxEntityCount,
      maxStateEntities: options.maxStateEntities,
      maxCandidateActions: options.maxCandidateActions,
      entityTruncationCount: totalEntityTruncationCount,
      candidateTruncationCount: totalCandidateTruncationCount,
    };

    return {
      mode: backend,
      dataset: {
        version: 1,
        seed: options.seed,
        generatedAt: new Date().toISOString(),
        sampleCount,
        samples: null,
        episodes: options.includeEpisodes ? allEpisodes : [],
        preWrittenOutput: true,
      },
      summary: {
        ok: allOk,
        gamesRequested: options.games,
        gamesRun,
        blockedGames,
        sampleCount,
        ...observationQuality,
        averageFinalScore: weightedAverageFinalScoreCount > 0
          ? weightedAverageFinalScoreTotal / weightedAverageFinalScoreCount
          : 0,
        averageWinnerFinalScore: weightedAverageWinnerFinalScoreCount > 0
          ? weightedAverageWinnerFinalScoreTotal / weightedAverageWinnerFinalScoreCount
          : 0,
        blockedMessages: blockedMessages.slice(0, 20),
        bugMessages: bugMessages.slice(0, 20),
        workerCount,
      },
    };
  } finally {
    stopEntityModelServer(modelServer);
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const backend = String(options.backend || "core-rules").trim();

  let result;
  if (backend === "app-full" || backend === "core-rules") {
    result = await runConcurrentBackend(options, backend);
  } else {
    throw new Error(`Unknown backend '${backend}', expected app-full or core-rules`);
  }

  ensureParent(options.out);
  const outputPath = path.resolve(options.out);
  const samples = Array.isArray(result.dataset.samples) ? result.dataset.samples : [];
  if (result?.dataset?.preWrittenOutput !== true) {
    if (!samples.length) {
      fs.writeFileSync(outputPath, "", "utf-8");
    } else {
      const output = fs.createWriteStream(outputPath, { encoding: "utf-8" });
      for (const sample of samples) {
        output.write(`${JSON.stringify(sample)}\n`);
      }
      await new Promise((resolve, reject) => {
        output.on("error", reject);
        output.end(resolve);
      });
    }
  }

  const summary = {
    ok: true,
    mode: result.mode,
    backend,
    seed: options.seed,
    games: options.games,
    sampleCount: result.dataset.sampleCount || 0,
    out: options.out,
    summary: result.summary || null,
    episodes: options.includeEpisodes
      ? (result.dataset.episodes || [])
      : [],
  };

  if (options.summaryOut) {
    ensureParent(options.summaryOut);
    fs.writeFileSync(path.resolve(options.summaryOut), JSON.stringify(summary, null, 2), "utf-8");
  }

  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

main().catch((error) => {
  console.error(error.stack || error.message || String(error));
  process.exitCode = 1;
});
