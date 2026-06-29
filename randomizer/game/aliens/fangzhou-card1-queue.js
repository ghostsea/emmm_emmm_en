(function (root, factory) {
  "use strict";

  let placement = root.SetiAlienPlacement;

  if (typeof require === "function") {
    placement = placement || require("./placement");
  }

  const api = factory(placement);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiFangzhouCard1Queue = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (placement) {
  "use strict";

  const PLANET_REWARD_TYPES = Object.freeze({
    GAIN_RESOURCES: "gain_resources",
    GAIN_DATA: "gain_data",
    DRAW_CARDS: "draw_cards",
    PICK_CARD: "pick_card",
    ALIEN_TRACE: "alien_trace",
  });

  const CARD_EFFECT_TYPES = Object.freeze({
    SCAN_COLOR_CHOICE: "card_scan_color_choice",
    ANY_SECTOR_SCAN: "card_any_sector_scan",
    SCAN_ACTION: "card_scan_action",
    RESEARCH_TECH: "card_research_tech",
    CARD_MOVE: "card_move",
  });

  const CUSTOM_TYPES = Object.freeze({
    LAUNCH: "fangzhou_launch",
    ADDITIONAL_PUBLIC_SCAN: "fangzhou_additional_public_scan",
  });

  const GAIN_RESOURCE_KEYS = Object.freeze(["score", "credits", "energy", "publicity"]);

  const GAIN_RESOURCE_LABELS = Object.freeze({
    score: "分数",
    credits: "信用点",
    energy: "能量",
    publicity: "宣传",
  });

  function resolveGainEffectIcon(gain) {
    if (!gain) return "score";
    if (gain.score) return "score";
    if (gain.credits) return "credits";
    if (gain.energy) return "energy";
    if (gain.publicity) return "publicity";
    return "score";
  }

  function formatSingleGainLabel(gain, formatGain) {
    const formatted = formatGain?.(gain);
    if (formatted) return formatted;
    const [key, value] = Object.entries(gain || {})[0] || [];
    if (!key) return "";
    const label = GAIN_RESOURCE_LABELS[key] || key;
    return key === "score" ? `${value}${label}` : `${value}${label}`;
  }

  function buildGainResourceNodes(gain, labelPrefix, options = {}) {
    if (!gain || !Object.keys(gain).length) return [];

    const entries = GAIN_RESOURCE_KEYS
      .filter((key) => gain[key] != null && Number(gain[key]) !== 0)
      .map((key) => [key, gain[key]]);

    if (!entries.length) return [];

    return entries.map(([key, value]) => {
      const singleGain = { [key]: value };
      return {
        type: PLANET_REWARD_TYPES.GAIN_RESOURCES,
        label: `${labelPrefix}：${formatSingleGainLabel(singleGain, options.formatGain)}`,
        icon: resolveGainEffectIcon(singleGain),
        options: { gain: singleGain },
      };
    });
  }

  function buildFollowUpNodes(effect, labelPrefix, getTraceTypeLabel) {
    if (!effect) return [];
    const nodes = [];

    if (effect.alienTrace) {
      nodes.push({
        type: PLANET_REWARD_TYPES.ALIEN_TRACE,
        label: `${labelPrefix}：${getTraceTypeLabel(effect.alienTrace)}外星人痕迹`,
        icon: `alien_${effect.alienTrace}`,
        options: { traceType: effect.alienTrace },
      });
    }
    if (effect.scanAction) {
      nodes.push({
        type: CARD_EFFECT_TYPES.SCAN_ACTION,
        label: `${labelPrefix}：扫描行动`,
        icon: "scan_action",
        options: { skipCost: true },
      });
    }
    if (effect.techAction) {
      nodes.push({
        type: CARD_EFFECT_TYPES.RESEARCH_TECH,
        label: `${labelPrefix}：科技行动`,
        icon: "research_tech",
        options: { skipCost: true },
      });
    }
    if (effect.launchIgnoreLimit) {
      nodes.push({
        type: CUSTOM_TYPES.LAUNCH,
        label: `${labelPrefix}：发射（无视火箭上限）`,
        icon: "launch",
        options: { skipCost: true, ignoreRocketLimit: true },
      });
    }

    const freeMoves = Math.max(0, Math.round(Number(effect.freeMoves) || 0));
    if (freeMoves > 0) {
      nodes.push({
        type: CARD_EFFECT_TYPES.CARD_MOVE,
        label: `${labelPrefix}：${freeMoves}移动`,
        icon: "movement",
        options: { movementPoints: freeMoves },
      });
    }
    if (effect.pickCard) {
      nodes.push({
        type: PLANET_REWARD_TYPES.PICK_CARD,
        label: `${labelPrefix}：精选1张牌`,
        icon: "pick_card",
      });
    }
    if (Array.isArray(effect.sectorScans)) {
      for (const color of effect.sectorScans) {
        nodes.push({
          type: CARD_EFFECT_TYPES.SCAN_COLOR_CHOICE,
          label: `${labelPrefix}：${color}扇区扫描`,
          icon: `${color}_scan`,
          options: { color, gainData: true },
        });
      }
    }
    if (effect.extraSectorScan) {
      nodes.push({
        type: CARD_EFFECT_TYPES.ANY_SECTOR_SCAN,
        label: `${labelPrefix}：任意扇区扫描`,
        icon: "scan",
        options: { gainData: true },
      });
    }

    return nodes;
  }

  function buildCard1EffectQueue(effect, labelPrefix, options = {}) {
    if (!effect) return [];
    const getTraceTypeLabel = options.getTraceTypeLabel
      || placement.getTraceTypeLabel
      || ((traceType) => traceType);
    const nodes = [];

    nodes.push(...buildGainResourceNodes(effect.gain, labelPrefix, options));

    const blindDraw = Math.max(0, Math.round(Number(effect.blindDraw) || 0));
    if (blindDraw > 0) {
      nodes.push({
        type: PLANET_REWARD_TYPES.DRAW_CARDS,
        label: `${labelPrefix}：盲抽 ${blindDraw} 张`,
        icon: "blind_card",
        options: { count: blindDraw },
      });
    }

    const dataCount = Math.max(0, Math.round(Number(effect.dataCount) || 0));
    if (dataCount > 0) {
      nodes.push({
        type: PLANET_REWARD_TYPES.GAIN_DATA,
        label: `${labelPrefix}：获得 ${dataCount} 数据`,
        icon: "data",
        options: { count: dataCount },
      });
    }

    if (effect.additionalPublicScan) {
      nodes.push({
        type: CUSTOM_TYPES.ADDITIONAL_PUBLIC_SCAN,
        label: `${labelPrefix}：额外弃牌扫描 +${effect.additionalPublicScan}`,
        icon: "additional_public_scan",
        options: { count: Number(effect.additionalPublicScan) },
      });
    }

    nodes.push(...buildFollowUpNodes(effect, labelPrefix, getTraceTypeLabel));
    return nodes;
  }

  function buildCard1EffectQueuesByIndex(definitionsByIndex, tier, labelPrefix) {
    const queues = {};
    for (const [index, definition] of Object.entries(definitionsByIndex || {})) {
      const effect = tier === "advanced" ? definition.advanced : definition.basic;
      queues[index] = buildCard1EffectQueue(effect, `${labelPrefix} ${definition.label || index}`);
    }
    return queues;
  }

  return Object.freeze({
    PLANET_REWARD_TYPES,
    CARD_EFFECT_TYPES,
    CUSTOM_TYPES,
    GAIN_RESOURCE_KEYS,
    buildGainResourceNodes,
    buildCard1EffectQueue,
    buildFollowUpNodes,
    buildCard1EffectQueuesByIndex,
  });
});
