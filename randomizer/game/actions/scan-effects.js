(function (root, factory) {
  "use strict";

  let players = root.SetiPlayers;
  let playerTech = root.SetiPlayerTech;
  let industryPassives = root.SetiIndustryPassives;

  if ((!players || !playerTech || !industryPassives) && typeof require === "function") {
    players = players || require("../players");
    playerTech = playerTech || require("../tech/player-tech");
    industryPassives = industryPassives || require("../industry/passives");
  }

  const api = factory(players, playerTech, industryPassives);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiScanEffects = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (players, playerTech, industryPassives) {
  "use strict";

  const SCAN_COST = Object.freeze({ credits: 1, energy: 2 });
  const SCAN_ACTION_2_MERCURY_COST = Object.freeze({ publicity: 1 });
  const SCAN_ACTION_4_LAUNCH_ENERGY = 1;

  const EFFECT_ICONS = Object.freeze({
    scan_cost: "../assets/symbol/effect/cost.webp",
    earth_scan: "../assets/symbol/action/scan/earth_scan.png",
    earth_scan_improved: "../assets/symbol/action/scan/earth_scan_improved.png",
    public_card_scan: "../assets/symbol/action/scan/public_card_scan.webp",
    mercury_scan: "../assets/symbol/action/scan/mercury_scan.png",
    private_card_scan: "../assets/symbol/action/scan/private_card_scan.webp",
    scan_action_4: "../assets/symbol/action/scan/scan_action_4.png",
    scan_action_finalize: "../assets/symbol/effect/finish_scan.webp",
    scan_public_refill: "../assets/symbol/action/scan/public_card_scan.webp",
    sector_finish_scan: "../assets/symbol/effect/finish_scan.webp",
    yellow_finish_scan: "../assets/symbol/effect/yellow_finish_scan.webp",
    red_finish_scan: "../assets/symbol/effect/red_finish_scan.webp",
    blue_finish_scan: "../assets/symbol/effect/blue_finish_scan.webp",
    black_finish_scan: "../assets/symbol/effect/black_finish_scan.webp",
  });

  const EFFECT_TYPES = Object.freeze({
    PAY_SCAN_COST: "pay_scan_cost",
    EARTH_SECTOR_SCAN: "earth_sector_scan",
    IMPROVED_SECTOR_SCAN: "improved_sector_scan",
    PUBLIC_CARD_SCAN: "public_card_scan",
    MERCURY_SECTOR_SCAN: "mercury_sector_scan",
    HAND_SCAN: "hand_scan",
    SCAN_ACTION_4: "scan_action_4",
    SCAN_ACTION_FINALIZE: "scan_action_finalize",
    SCAN_PUBLIC_REFILL: "scan_public_refill",
    SECTOR_FINISH_SCAN: "sector_finish_scan",
  });

  function getTurnContext(options = {}) {
    return {
      roundNumber: options.roundNumber ?? options.turnState?.roundNumber,
      turnNumber: options.turnNumber ?? options.turnState?.turnNumber,
    };
  }

  function playerOwnsPurpleTech(player, level, options = {}) {
    const tileId = `purple${level}`;
    const passives = getIndustryPassives();
    if (passives?.playerHasTechEffect) {
      const { roundNumber, turnNumber } = getTurnContext(options);
      return passives.playerHasTechEffect(player, tileId, roundNumber, turnNumber);
    }
    return playerTech.playerHasActiveTile(player?.techState, tileId);
  }

  function getIndustryPassives() {
    return industryPassives || (typeof globalThis !== "undefined" ? globalThis.SetiIndustryPassives : null);
  }

  function getStandardScanCost(player, defaultCost = SCAN_COST) {
    return getIndustryPassives()?.getStandardScanCost?.(player, defaultCost) || { ...defaultCost };
  }

  function canExecuteScan(player, options = {}) {
    if (!player) return { ok: false, message: "没有当前玩家" };
    const cost = options.cost || (options.standardAction === false ? SCAN_COST : getStandardScanCost(player));
    if (!players.canAfford(player, cost)) {
      return { ok: false, message: `资源不足，扫描需要 ${players.formatResourceCost(cost)}` };
    }
    return { ok: true, message: null };
  }

  function buildScanEffectQueue(player, options = {}) {
    const scanRunId = options.scanRunId || null;
    const fullScanAction = Boolean(options.fullScanAction || options.includeFinalize);
    const sharedOptions = scanRunId ? { scanRunId, fullScanAction } : {};
    const effects = [];

    if (playerOwnsPurpleTech(player, 1, options)) {
      effects.push({
        type: EFFECT_TYPES.IMPROVED_SECTOR_SCAN,
        abilityId: "scanSector",
        icon: "earth_scan_improved",
        label: "扇区扫描",
        options: { ...sharedOptions },
      });
    } else {
      effects.push({
        type: EFFECT_TYPES.EARTH_SECTOR_SCAN,
        abilityId: "scanSector",
        icon: "earth_scan",
        label: "扇区扫描",
        options: { ...sharedOptions },
      });
    }

    effects.push({
      type: EFFECT_TYPES.PUBLIC_CARD_SCAN,
      abilityId: "scanPublicCard",
      icon: "public_card_scan",
      label: "公共牌区扫描",
      options: { ...sharedOptions },
    });

    if (playerOwnsPurpleTech(player, 2, options)) {
      effects.push({
        type: EFFECT_TYPES.MERCURY_SECTOR_SCAN,
        abilityId: "scanSector",
        icon: "mercury_scan",
        label: "水星扇区扫描",
        options: { ...sharedOptions, cost: SCAN_ACTION_2_MERCURY_COST },
      });
    }

    if (playerOwnsPurpleTech(player, 3, options)) {
      effects.push({
        type: EFFECT_TYPES.HAND_SCAN,
        abilityId: "scanHandCard",
        icon: "private_card_scan",
        label: "手牌扫描",
        options: { ...sharedOptions },
      });
    }

    if (playerOwnsPurpleTech(player, 4, options)) {
      effects.push({
        type: EFFECT_TYPES.SCAN_ACTION_4,
        abilityId: "scanAction4",
        icon: "scan_action_4",
        label: "发射/移动",
        options: { ...sharedOptions },
      });
    }


    return effects.map((effect, index) => ({
      ...effect,
      id: `scan-effect-${index}`,
      status: "pending",
    }));
  }

  return Object.freeze({
    SCAN_COST,
    SCAN_ACTION_2_MERCURY_COST,
    SCAN_ACTION_4_LAUNCH_ENERGY,
    EFFECT_ICONS,
    EFFECT_TYPES,
    playerOwnsPurpleTech,
    getStandardScanCost,
    canExecuteScan,
    buildScanEffectQueue,
  });
});
