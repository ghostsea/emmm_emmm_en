"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const appPath = path.join(__dirname, "..", "app.js");
const appSource = fs.readFileSync(appPath, "utf8");

function extractNamedFunctionSource(functionName) {
  const start = appSource.indexOf(`function ${functionName}(`);
  assert.ok(start >= 0, `app.js should define ${functionName}`);
  const bodyStart = appSource.indexOf(") {", start) + 2;
  assert.ok(bodyStart >= 2, `could not find body for ${functionName}`);
  let depth = 0;
  for (let index = bodyStart; index < appSource.length; index += 1) {
    if (appSource[index] === "{") depth += 1;
    if (appSource[index] !== "}") continue;
    depth -= 1;
    if (depth === 0) return appSource.slice(start, index + 1);
  }
  assert.fail(`could not extract ${functionName} from app.js`);
}

function loadNamedFunction(functionName, dependencies = {}) {
  const names = Object.keys(dependencies);
  return Function(
    ...names,
    `"use strict"; return (${extractNamedFunctionSource(functionName)});`,
  )(...names.map((name) => dependencies[name]));
}

{
  const applyCardMovementModifiers = loadNamedFunction("applyCardMovementModifiers");
  assert.deepEqual(
    applyCardMovementModifiers({ movementPoints: 1 }, []),
    { movementPoints: 1 },
  );
  assert.deepEqual(
    applyCardMovementModifiers(
      { movementPoints: 1, ignoreAsteroidRestriction: false },
      [{ movementModifiers: { ignoreAsteroidRestriction: true } }],
    ),
    { movementPoints: 1, ignoreAsteroidRestriction: true },
    "an active turn movement modifier should override the local asteroid-exit restriction",
  );
}

{
  const eventMatchesCardBonus = loadNamedFunction("eventMatchesCardBonus", {
    getNebulaColorForCardEvent: () => null,
  });
  const sameRingBonus = { eventType: "move", sameRingOnly: true };
  assert.equal(
    eventMatchesCardBonus({ type: "move", sameRing: false }, sameRingBonus),
    false,
    "b_125 should not trigger on radial movement",
  );
  assert.equal(
    eventMatchesCardBonus({ type: "move", sameRing: true }, sameRingBonus),
    true,
    "b_125 should trigger on same-ring movement",
  );
}

{
  const exchangeEffect = {
    options: {
      costPerExchange: 1,
      movementPerExchange: 2,
    },
  };
  const getExchangeOptions = loadNamedFunction("getAomomoFossilMoveLandExchangeOptions");
  const resolveExchange = loadNamedFunction("resolveAomomoFossilMoveLandExchange");
  const options = getExchangeOptions(exchangeEffect, 3);
  assert.deepEqual(options, {
    costPerExchange: 1,
    movementPerExchange: 2,
    maxCount: 3,
  });
  assert.deepEqual(resolveExchange(options, 0), {
    ok: true,
    count: 0,
    totalCost: 0,
    movementPoints: 0,
  });
  assert.deepEqual(resolveExchange(options, 2), {
    ok: true,
    count: 2,
    totalCost: 2,
    movementPoints: 4,
  });
  assert.equal(resolveExchange(options, 4).ok, false);
}

{
  const currentPlayer = { id: "player-blue", color: "blue" };
  const data = {
    NEBULA_IDS: ["sector-other", "sector-mine"],
    isSectorReadyToSettle: () => true,
    orderSectorIdsByPlayerWinPriority(_state, sectorIds, player) {
      assert.deepEqual(sectorIds, ["sector-other", "sector-mine"]);
      assert.equal(player, currentPlayer);
      return ["sector-mine", "sector-other"];
    },
    getNebulaLabel: (sectorId) => sectorId,
  };
  const buildReadySectorFinishEffects = loadNamedFunction("buildReadySectorFinishEffects", {
    data,
    nebulaDataState: {},
    resolvePlayerReference: () => null,
    getCurrentPlayer: () => currentPlayer,
    getSectorFinishWinnerTarget: () => null,
    scanEffects: { EFFECT_TYPES: { SECTOR_FINISH_SCAN: "sector_finish_scan" } },
    getSectorFinishIcon: () => "scan",
  });
  assert.deepEqual(
    buildReadySectorFinishEffects().map((effect) => effect.options.sectorId),
    ["sector-mine", "sector-other"],
    "app settlement nodes should preserve current-player-winner priority",
  );
}

for (const functionName of [
  "getRequiredMovePointsForUi",
  "confirmMovePayment",
  "executeCardEffectMove",
  "executeFreeMoveForCardTrigger",
  "executeFreeMoveForCardCorner",
  "executeFreeMoveForScanAction4",
  "executeIndustryFreeMove",
]) {
  assert.match(
    extractNamedFunctionSource(functionName),
    /applyActiveCardMovementModifiers/,
    `${functionName} should apply active turn movement modifiers`,
  );
}

assert.match(
  extractNamedFunctionSource("executeAomomoFossilMoveAndLandEffect"),
  /aomomo_fossil_move_land_count/,
  "Aomomo card 6 should open the fossil-count choice",
);
assert.match(
  extractNamedFunctionSource("handleAomomoFossilMoveLandCountChoice"),
  /resolveAomomoFossilMoveLandExchange/,
  "Aomomo card 6 count choice should resolve through the validated exchange",
);
assert.ok(
  (appSource.match(/handleAomomoFossilMoveLandCountChoice/g) || []).length >= 4,
  "Aomomo card 6 choice handler should be defined and wired to both event and AI controllers",
);

console.log("runtime-regressions.test.js: all tests passed");
