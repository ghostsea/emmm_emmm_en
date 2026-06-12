(function (root, factory) {
  "use strict";

  let rocketAbility = root.SetiAbilityRocket;
  let scanAbility = root.SetiAbilityScan;

  if ((!rocketAbility || !scanAbility) && typeof require === "function") {
    rocketAbility = rocketAbility || require("./rocket");
    scanAbility = scanAbility || require("./scan");
  }

  const api = factory(rocketAbility, scanAbility);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiAbilities = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (
  rocketAbility,
  scanAbility,
) {
  "use strict";

  const ABILITIES = Object.freeze({
    launchProbe: rocketAbility.launchProbe,
    moveProbe: rocketAbility.moveProbe,
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
  });
});
