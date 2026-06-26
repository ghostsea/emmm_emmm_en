(function (root, factory) {
  "use strict";

  const api = factory(root);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiAppDependencies = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (root) {
  "use strict";

  const REQUIRED_GLOBALS = Object.freeze([
    Object.freeze({ key: "solar", globalName: "SetiSolarSystem" }),
    Object.freeze({ key: "players", globalName: "SetiPlayers" }),
    Object.freeze({ key: "rocketActions", globalName: "SetiRocketActions" }),
    Object.freeze({ key: "planetStats", globalName: "SetiPlanetStats" }),
    Object.freeze({ key: "planetReferenceLayout", globalName: "SetiPlanetReferenceLayout" }),
    Object.freeze({ key: "actionShared", globalName: "SetiActionShared" }),
    Object.freeze({ key: "actions", globalName: "SetiActions" }),
    Object.freeze({ key: "scanEffects", globalName: "SetiScanEffects" }),
    Object.freeze({ key: "planetRewards", globalName: "SetiPlanetRewards" }),
    Object.freeze({ key: "finalScoring", globalName: "SetiFinalScoring" }),
    Object.freeze({ key: "endGameScoring", globalName: "SetiEndGameScoring" }),
    Object.freeze({ key: "actionHistoryModule", globalName: "SetiActionHistory" }),
    Object.freeze({ key: "historyCommands", globalName: "SetiHistoryCommands" }),
    Object.freeze({ key: "historyTransactions", globalName: "SetiHistoryTransactions" }),
    Object.freeze({ key: "abilities", globalName: "SetiAbilities" }),
    Object.freeze({ key: "quickTrades", globalName: "SetiQuickTrades" }),
    Object.freeze({ key: "basicCards", globalName: "SetiBasicCards" }),
    Object.freeze({ key: "cards", globalName: "SetiCards" }),
    Object.freeze({ key: "cardEffects", globalName: "SetiCardEffects" }),
    Object.freeze({ key: "cardTaskStateModule", globalName: "SetiCardTaskState" }),
    Object.freeze({ key: "tech", globalName: "SetiTech" }),
    Object.freeze({ key: "data", globalName: "SetiData" }),
    Object.freeze({ key: "aliens", globalName: "SetiAliens" }),
    Object.freeze({ key: "initialCards", globalName: "SetiInitialCards" }),
    Object.freeze({ key: "industry", globalName: "SetiIndustry" }),
    Object.freeze({ key: "aiValuation", globalName: "SetiAIValuation" }),
    Object.freeze({ key: "ai", globalName: "SetiAI" }),
  ]);

  function collectDependencies(source = root) {
    const dependencies = {};
    const missing = [];

    for (const entry of REQUIRED_GLOBALS) {
      const value = source[entry.globalName];
      if (!value) {
        missing.push(entry.globalName);
      }
      dependencies[entry.key] = value;
    }

    if (missing.length) {
      throw new Error(`Missing SETI app dependencies: ${missing.join(", ")}`);
    }

    const aliens = dependencies.aliens;
    return {
      ...dependencies,
      jiuzhe: aliens.jiuzhe,
      yichangdian: aliens.yichangdian,
      fangzhou: aliens.fangzhou,
      banrenma: aliens.banrenma,
      chong: aliens.chong,
      amiba: aliens.amiba,
      aomomo: aliens.aomomo,
      runezu: aliens.runezu,
    };
  }

  return {
    collectDependencies,
  };
});
