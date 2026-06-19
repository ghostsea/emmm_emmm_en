(function (root, factory) {
  "use strict";

  let players = root.SetiPlayers;
  let playerTech = root.SetiPlayerTech;

  if ((!players || !playerTech) && typeof require === "function") {
    players = players || require("../players");
    playerTech = playerTech || require("../tech/player-tech");
  }

  const api = factory(players, playerTech);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiScanEffects = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (players, playerTech) {
  "use strict";

  const SCAN_COST = Object.freeze({ credits: 1, energy: 2 });
  const SCAN_ACTION_4_LAUNCH_ENERGY = 1;

  const EFFECT_ICONS = Object.freeze({
    scan_cost: "../assets/symbol/action/scan/earth_scan.png",
    earth_scan: "../assets/symbol/action/scan/earth_scan.png",
    earth_scan_improved: "../assets/symbol/action/scan/earth_scan_improved.png",
    public_card_scan: "../assets/symbol/action/scan/public_card_scan.webp",
    mercury_scan: "../assets/symbol/action/scan/mercury_scan.png",
    private_card_scan: "../assets/symbol/action/scan/private_card_scan.webp",
    scan_action_4: "../assets/symbol/action/scan/scan_action_4.png",
  });

  const EFFECT_TYPES = Object.freeze({
    PAY_SCAN_COST: "pay_scan_cost",
    EARTH_SECTOR_SCAN: "earth_sector_scan",
    IMPROVED_SECTOR_SCAN: "improved_sector_scan",
    PUBLIC_CARD_SCAN: "public_card_scan",
    MERCURY_SECTOR_SCAN: "mercury_sector_scan",
    HAND_SCAN: "hand_scan",
    SCAN_ACTION_4: "scan_action_4",
  });

  function playerOwnsPurpleTech(player, level) {
    return playerTech.playerHasActiveTile(player?.techState, `purple${level}`);
  }

  function canExecuteScan(player) {
    if (!player) return { ok: false, message: "没有当前玩家" };
    if (!players.canAfford(player, SCAN_COST)) {
      return { ok: false, message: "资源不足，扫描需要 1 信用点 + 2 能量" };
    }
    return { ok: true, message: null };
  }

  function buildScanEffectQueue(player) {
    const effects = [{
      type: EFFECT_TYPES.PAY_SCAN_COST,
      abilityId: "payScanCost",
      icon: "scan_cost",
      label: "支付扫描费用",
      undoable: true,
    }];

    if (playerOwnsPurpleTech(player, 1)) {
      effects.push({
        type: EFFECT_TYPES.IMPROVED_SECTOR_SCAN,
        abilityId: "scanSector",
        icon: "earth_scan_improved",
        label: "扇区扫描",
      });
    } else {
      effects.push({
        type: EFFECT_TYPES.EARTH_SECTOR_SCAN,
        abilityId: "scanSector",
        icon: "earth_scan",
        label: "扇区扫描",
      });
    }

    effects.push({
      type: EFFECT_TYPES.PUBLIC_CARD_SCAN,
      abilityId: "scanPublicCard",
      icon: "public_card_scan",
      label: "公共牌区扫描",
    });

    if (playerOwnsPurpleTech(player, 2)) {
      effects.push({
        type: EFFECT_TYPES.MERCURY_SECTOR_SCAN,
        abilityId: "scanSector",
        icon: "mercury_scan",
        label: "扇区扫描",
      });
    }

    if (playerOwnsPurpleTech(player, 3)) {
      effects.push({
        type: EFFECT_TYPES.HAND_SCAN,
        abilityId: "scanHandCard",
        icon: "private_card_scan",
        label: "手牌扫描",
      });
    }

    if (playerOwnsPurpleTech(player, 4)) {
      effects.push({
        type: EFFECT_TYPES.SCAN_ACTION_4,
        abilityId: "scanAction4",
        icon: "scan_action_4",
        label: "发射/移动",
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
    SCAN_ACTION_4_LAUNCH_ENERGY,
    EFFECT_ICONS,
    EFFECT_TYPES,
    playerOwnsPurpleTech,
    canExecuteScan,
    buildScanEffectQueue,
  });
});
