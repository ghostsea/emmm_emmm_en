(function (root, factory) {
  "use strict";

  let rocketAbility = root.SetiAbilityRocket;
  let scanAbility = root.SetiAbilityScan;
  let planetAbility = root.SetiAbilityPlanet;
  let dataAbility = root.SetiAbilityData;
  let techAbility = root.SetiAbilityTech;
  let chain = root.SetiAbilityChain;

  if ((!rocketAbility || !scanAbility || !planetAbility || !dataAbility || !techAbility || !chain) && typeof require === "function") {
    rocketAbility = rocketAbility || require("./rocket");
    scanAbility = scanAbility || require("./scan");
    planetAbility = planetAbility || require("./planet");
    dataAbility = dataAbility || require("./data");
    techAbility = techAbility || require("./tech");
    chain = chain || require("./chain");
  }

  const api = factory(rocketAbility, scanAbility, planetAbility, dataAbility, techAbility, chain);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiAbilities = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (
  rocketAbility,
  scanAbility,
  planetAbility,
  dataAbility,
  techAbility,
  chain,
) {
  "use strict";

  const ABILITIES = Object.freeze({
    launchProbe: rocketAbility.launchProbe,
    moveProbe: rocketAbility.moveProbe,
    orbitProbe: planetAbility.orbitProbe,
    landProbe: planetAbility.landProbe,
    placeData: dataAbility.placeData,
    analyzeData: dataAbility.analyzeData,
    researchTechPrepare: techAbility.researchTechPrepare,
    researchTechSelect: techAbility.researchTechSelect,
    researchTechTake: techAbility.researchTechTake,
    researchTechRotate: techAbility.researchTechRotate,
    researchTechBonus: techAbility.researchTechBonus,
    payScanCost: scanAbility.payScanCost,
    scanSector: scanAbility.scanSector,
    scanNebula: scanAbility.scanNebula,
    scanPublicCard: scanAbility.scanPublicCard,
    scanHandCard: scanAbility.scanHandCard,
    scanAction4: scanAbility.scanAction4,
  });

  function getAbility(abilityId) {
    return ABILITIES[abilityId] || null;
  }

  function executeAbility(abilityId, context, options = {}) {
    const ability = getAbility(abilityId);
    if (!ability) {
      return { ok: false, abilityId, message: `未知能力: ${abilityId}` };
    }
    return ability(context, options);
  }

  function listAbilities() {
    return Object.keys(ABILITIES);
  }

  return Object.freeze({
    ABILITIES,
    getAbility,
    executeAbility,
    listAbilities,
    rocket: rocketAbility,
    scan: scanAbility,
    planet: planetAbility,
    data: dataAbility,
    tech: techAbility,
    chain,
  });
});
