(function (root, factory) {
  "use strict";

  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiIndustryCatalog = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  "use strict";

  const SKIPPED_ACTIVE_LABELS = Object.freeze(["异星实验室", "作弊实验室"]);

  const INDUSTRY_DEFINITIONS = Object.freeze({
    "层云核心": Object.freeze({
      label: "层云核心",
      activeAbilityId: "stratus_public_corners",
      passiveIds: Object.freeze([]),
    }),
    "图灵系统": Object.freeze({
      label: "图灵系统",
      activeAbilityId: "turing_borrow_tech",
      passiveIds: Object.freeze(["turing_blue_tech_publicity"]),
    }),
    "哨兵探测网络": Object.freeze({
      label: "哨兵探测网络",
      activeAbilityId: "sentinel_arm_play_corner",
      passiveIds: Object.freeze(["sentinel_launch_scan_earth"]),
    }),
    "寰宇动力": Object.freeze({
      label: "寰宇动力",
      activeAbilityId: "huanyu_free_moves",
      passiveIds: Object.freeze(["huanyu_rocket_limit"]),
    }),
    "赫利昂联合体": Object.freeze({
      label: "赫利昂联合体",
      activeAbilityId: "helios_remove_tech_income",
      passiveIds: Object.freeze(["helios_passive_reward_slots"]),
    }),
    "任务中继站": Object.freeze({
      label: "任务中继站",
      activeAbilityId: "mission_publicity_pick_income",
      passiveIds: Object.freeze(["mission_play_type_publicity", "mission_startup_final_mark"]),
    }),
    "芬威克研究中心": Object.freeze({
      label: "芬威克研究中心",
      activeAbilityId: "fenwick_publicity_pick_corner",
      passiveIds: Object.freeze(["fenwick_research_cost"]),
    }),
    "深空探测": Object.freeze({
      label: "深空探测",
      activeAbilityId: "deepspace_swap_cards",
      passiveIds: Object.freeze(["deepspace_free_analyze"]),
    }),
    "未来跨度研究所": Object.freeze({
      label: "未来跨度研究所",
      activeAbilityId: "future_span_pick_advance",
      passiveIds: Object.freeze(["future_span_parking"]),
    }),
    "异星实验室": Object.freeze({
      label: "异星实验室",
      activeAbilityId: null,
      passiveIds: Object.freeze(["alien_lab_panels"]),
    }),
    "作弊实验室": Object.freeze({
      label: "作弊实验室",
      activeAbilityId: null,
      passiveIds: Object.freeze(["alien_lab_panels", "cheat_lab_permanent_panels"]),
    }),
    "宇宙战略集团": Object.freeze({
      label: "宇宙战略集团",
      activeAbilityId: "strategy_pick_card",
      passiveIds: Object.freeze(["strategy_passive_reward_slots"]),
    }),
  });

  function normalizeIndustryLabel(cardOrLabel) {
    const label = typeof cardOrLabel === "string"
      ? cardOrLabel
      : (cardOrLabel?.label || cardOrLabel?.id || cardOrLabel?.src || "");
    return String(label || "")
      .replace(/^industry:/, "")
      .replace(/^.*[\\/]/, "")
      .replace(/\.[^.]+$/, "");
  }

  function getIndustryDefinition(cardOrLabel) {
    const label = normalizeIndustryLabel(cardOrLabel);
    return INDUSTRY_DEFINITIONS[label] || null;
  }

  function hasImplementedActiveAbility(cardOrLabel) {
    const definition = getIndustryDefinition(cardOrLabel);
    if (!definition?.activeAbilityId) return false;
    const label = normalizeIndustryLabel(cardOrLabel);
    return !SKIPPED_ACTIVE_LABELS.includes(label);
  }

  function getPlayerIndustryLabel(player) {
    return normalizeIndustryLabel(player?.initialSelection?.industry);
  }

  function getPlayerIndustryDefinition(player) {
    return getIndustryDefinition(getPlayerIndustryLabel(player));
  }

  return Object.freeze({
    SKIPPED_ACTIVE_LABELS,
    INDUSTRY_DEFINITIONS,
    normalizeIndustryLabel,
    getIndustryDefinition,
    hasImplementedActiveAbility,
    getPlayerIndustryLabel,
    getPlayerIndustryDefinition,
  });
});
