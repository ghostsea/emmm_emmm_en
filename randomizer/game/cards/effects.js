(function (root, factory) {
  "use strict";

  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiCardEffects = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  "use strict";

  const EFFECT_TYPES = Object.freeze({
    SCAN_NEBULA: "card_scan_nebula",
    SCAN_COLOR_CHOICE: "card_scan_color_choice",
    PUBLIC_SCAN: "card_public_scan",
    ANY_SECTOR_SCAN: "card_any_sector_scan",
    SCAN_ACTION: "card_scan_action",
    RESEARCH_TECH: "card_research_tech",
    FREE_MOVE: "card_free_move",
    DRAW_THEN_SCAN: "card_draw_then_scan",
  });

  const REWARD_TYPES = Object.freeze({
    GAIN_RESOURCES: "gain_resources",
    GAIN_DATA: "gain_data",
    DRAW_CARDS: "draw_cards",
  });

  const NEBULA_IDS_BY_COLOR = Object.freeze({
    yellow: Object.freeze(["sector-4-a", "sector-3-a"]),
    red: Object.freeze(["sector-2-b", "sector-3-b"]),
    blue: Object.freeze(["sector-2-a", "sector-1-a"]),
    black: Object.freeze(["sector-1-b", "sector-4-b"]),
  });

  const YELLOW_SECTOR_IDS = Object.freeze(["sector-4-a", "sector-3-a"]);

  function effect(id, type, label, icon, options = {}) {
    return Object.freeze({ id, type, label, icon, options: Object.freeze({ ...options }) });
  }

  function gainResourcesEffect(id, label, gain) {
    return effect(id, REWARD_TYPES.GAIN_RESOURCES, label, gain.score ? "score" : gain.energy ? "energy" : "publicity", {
      gain,
    });
  }

  function gainDataEffect(id, label, count) {
    return effect(id, REWARD_TYPES.GAIN_DATA, label, "data", { count });
  }

  function drawCardsEffect(id, label, count) {
    return effect(id, REWARD_TYPES.DRAW_CARDS, label, "blind_card", { count });
  }

  const MODELS = Object.freeze({
    "b_1.webp": Object.freeze({
      cardType: 2,
      playEffects: Object.freeze([
        effect("b1-virgo-scan", EFFECT_TYPES.SCAN_NEBULA, "室女座61扇区扫描", "yellow_scan", {
          nebulaId: "sector-4-a",
          gainData: true,
          repeat: 2,
        }),
      ]),
      tasks: Object.freeze([{
        id: "b1-yellow-sector-task",
        condition: Object.freeze({ type: "completedSectorsByColor", color: "yellow", count: 2 }),
        rewards: Object.freeze([
          gainResourcesEffect("b1-yellow-sector-reward", "完成2个黄色扇区：4分，1宣传", {
            score: 4,
            publicity: 1,
          }),
        ]),
      }]),
    }),
    "b_2.webp": Object.freeze({
      cardType: 1,
      triggers: Object.freeze([
        {
          id: "b2-visit-planet-energy",
          event: Object.freeze({ type: "visitPlanet", excludePlanetIds: Object.freeze(["earth"]) }),
          effect: gainResourcesEffect("b2-energy", "高级导航系统：1能量", { energy: 1 }),
        },
        {
          id: "b2-visit-planet-data",
          event: Object.freeze({ type: "visitPlanet", excludePlanetIds: Object.freeze(["earth"]) }),
          effect: gainDataEffect("b2-data", "高级导航系统：1数据", 1),
        },
        {
          id: "b2-visit-planet-move",
          event: Object.freeze({ type: "visitPlanet", excludePlanetIds: Object.freeze(["earth"]) }),
          effect: effect("b2-free-move", EFFECT_TYPES.FREE_MOVE, "高级导航系统：1免费移动", "movement", {
            movementPoints: 1,
          }),
        },
      ]),
    }),
    "b_3.webp": Object.freeze({
      cardType: 0,
      playEffects: Object.freeze([
        effect("b3-yellow", EFFECT_TYPES.SCAN_COLOR_CHOICE, "黄色扇区扫描（不获得数据）", "yellow_scan", { color: "yellow", gainData: false }),
        effect("b3-red", EFFECT_TYPES.SCAN_COLOR_CHOICE, "红色扇区扫描（不获得数据）", "red_scan", { color: "red", gainData: false }),
        effect("b3-blue", EFFECT_TYPES.SCAN_COLOR_CHOICE, "蓝色扇区扫描（不获得数据）", "blue_scan", { color: "blue", gainData: false }),
        effect("b3-black", EFFECT_TYPES.SCAN_COLOR_CHOICE, "黑色扇区扫描（不获得数据）", "black_scan", { color: "black", gainData: false }),
      ]),
    }),
    "b_4.webp": Object.freeze({
      cardType: 2,
      playEffects: Object.freeze([
        effect("b4-blue-tech", EFFECT_TYPES.RESEARCH_TECH, "科技（只能选择蓝色）", "research_tech", {
          techTypes: Object.freeze(["blue"]),
          skipCost: true,
        }),
      ]),
      tasks: Object.freeze([{
        id: "b4-blue-alien-task",
        condition: Object.freeze({ type: "allAliensHaveTrace", traceType: "blue" }),
        rewards: Object.freeze([gainDataEffect("b4-blue-alien-reward", "2个外星人均有蓝色痕迹：2数据", 2)]),
      }]),
    }),
    "b_5.webp": Object.freeze({
      cardType: 0,
      playEffects: Object.freeze([
        effect("b5-public-scan", EFFECT_TYPES.PUBLIC_SCAN, "公共牌区扫描", "public_card_scan", { repeat: 2 }),
      ]),
      temporaryTasks: Object.freeze([{
        id: "b5-complete-sector",
        condition: Object.freeze({ type: "sectorCompletedDuringCard", count: 1 }),
        rewards: Object.freeze([gainResourcesEffect("b5-complete-sector-reward", "完成扇区：1能量", { energy: 1 })]),
      }]),
    }),
    "b_6.webp": Object.freeze({
      cardType: 0,
      playEffects: Object.freeze([
        effect("b6-public-scan", EFFECT_TYPES.PUBLIC_SCAN, "公共牌区扫描", "public_card_scan", { repeat: 2 }),
      ]),
      temporaryTasks: Object.freeze([{
        id: "b6-complete-sector",
        condition: Object.freeze({ type: "sectorCompletedDuringCard", count: 1 }),
        rewards: Object.freeze([drawCardsEffect("b6-complete-sector-reward", "完成扇区：1盲抽", 1)]),
      }]),
    }),
    "b_7.webp": Object.freeze({
      cardType: 0,
      playEffects: Object.freeze([
        effect("b7-draw-then-scan", EFFECT_TYPES.DRAW_THEN_SCAN, "盲抽并对该牌弃牌扫描", "blind_card", {
          repeat: 3,
        }),
      ]),
    }),
    "b_8.webp": Object.freeze({
      cardType: 2,
      playEffects: Object.freeze([
        effect("b8-orange-tech", EFFECT_TYPES.RESEARCH_TECH, "科技（只能选择橙色）", "research_tech", {
          techTypes: Object.freeze(["orange"]),
          skipCost: true,
        }),
      ]),
      tasks: Object.freeze([{
        id: "b8-yellow-alien-task",
        condition: Object.freeze({ type: "allAliensHaveTrace", traceType: "yellow" }),
        rewards: Object.freeze([
          gainResourcesEffect("b8-yellow-alien-score", "2个外星人均有黄色痕迹：2分", { score: 2 }),
          drawCardsEffect("b8-yellow-alien-draw", "2个外星人均有黄色痕迹：1盲抽", 1),
        ]),
      }]),
    }),
    "b_9.webp": Object.freeze({
      cardType: 0,
      playEffects: Object.freeze([
        effect("b9-scan-action", EFFECT_TYPES.SCAN_ACTION, "扫描行动", "scan_action", { skipCost: true }),
        effect("b9-any-sector-scan", EFFECT_TYPES.ANY_SECTOR_SCAN, "额外任意扇区扫描", "scan", { gainData: true }),
      ]),
    }),
    "b_10.webp": Object.freeze({
      cardType: 1,
      triggers: Object.freeze([1, 2, 3].map((index) => ({
        id: `b10-visit-asteroid-data-${index}`,
        event: Object.freeze({ type: "visitAsteroid" }),
        effect: gainDataEffect(`b10-data-${index}`, `小行星研究：1数据 ${index}/3`, 1),
      }))),
    }),
  });

  function cloneEffectNode(source, idSuffix = "") {
    return {
      ...source,
      id: idSuffix ? `${source.id}-${idSuffix}` : source.id,
      options: { ...(source.options || {}) },
      status: "pending",
    };
  }

  function expandEffects(effects) {
    const result = [];
    for (const item of effects || []) {
      const repeat = Math.max(1, Math.round(Number(item.options?.repeat || 1)));
      for (let index = 0; index < repeat; index += 1) {
        const node = cloneEffectNode(item, repeat > 1 ? `${index + 1}` : "");
        node.options.repeat = 1;
        if (repeat > 1) node.label = `${item.label} ${index + 1}/${repeat}`;
        result.push(node);
      }
    }
    return result;
  }

  function getCardId(card) {
    if (card?.cardId) return card.cardId;
    if (Number.isInteger(card?.cardIndex)) return `b_${card.cardIndex}.webp`;
    return null;
  }

  function getCardModel(cardOrId) {
    const cardId = typeof cardOrId === "string" ? cardOrId : getCardId(cardOrId);
    return MODELS[cardId] || null;
  }

  function buildPlayEffects(card) {
    return expandEffects(getCardModel(card)?.playEffects || []);
  }

  function getTemporaryTasks(card) {
    return getCardModel(card)?.temporaryTasks || [];
  }

  function ensureCardEffectState(card) {
    if (!card) return null;
    const model = getCardModel(card);
    if (!model || (!model.triggers?.length && !model.tasks?.length)) return null;
    if (!card.cardEffectState || card.cardEffectState.modelCardId !== getCardId(card)) {
      card.cardEffectState = {
        modelCardId: getCardId(card),
        consumedTriggerIds: [],
        completedTaskIds: [],
      };
    }
    if (!Array.isArray(card.cardEffectState.consumedTriggerIds)) card.cardEffectState.consumedTriggerIds = [];
    if (!Array.isArray(card.cardEffectState.completedTaskIds)) card.cardEffectState.completedTaskIds = [];
    return card.cardEffectState;
  }

  function isTriggerConsumed(card, triggerId) {
    return Boolean(card?.cardEffectState?.consumedTriggerIds?.includes(triggerId));
  }

  function consumeTrigger(card, triggerId) {
    const state = ensureCardEffectState(card);
    if (!state || state.consumedTriggerIds.includes(triggerId)) return false;
    state.consumedTriggerIds.push(triggerId);
    return true;
  }

  function isTaskCompleted(card, taskId) {
    return Boolean(card?.cardEffectState?.completedTaskIds?.includes(taskId));
  }

  function completeTask(card, taskId) {
    const state = ensureCardEffectState(card);
    if (!state || state.completedTaskIds.includes(taskId)) return false;
    state.completedTaskIds.push(taskId);
    return true;
  }

  function eventMatchesTrigger(event, trigger) {
    if (!event || !trigger?.event || event.type !== trigger.event.type) return false;
    if (event.type === "visitPlanet") {
      const excluded = trigger.event.excludePlanetIds || [];
      return !excluded.includes(event.planetId);
    }
    return true;
  }

  function collectMatchingTriggers(player, event) {
    const matches = [];
    for (const card of player?.reservedCards || []) {
      const model = getCardModel(card);
      if (!model?.triggers?.length) continue;
      ensureCardEffectState(card);
      for (const trigger of model.triggers) {
        if (isTriggerConsumed(card, trigger.id)) continue;
        if (!eventMatchesTrigger(event, trigger)) continue;
        matches.push({ card, trigger, effect: cloneEffectNode(trigger.effect) });
      }
    }
    return matches;
  }

  function countYellowSectorWins(player, nebulaDataState) {
    const playerKeys = new Set([player?.id, player?.color].filter(Boolean));
    const wins = nebulaDataState?.sectorSettlements?.winsByPlayerId || {};
    let count = 0;
    for (const key of playerKeys) {
      for (const win of wins[key] || []) {
        if (YELLOW_SECTOR_IDS.includes(win.sectorId)) count += 1;
      }
    }
    return count;
  }

  function allAliensHaveTrace(alienGameState, traceType) {
    const slots = Object.values(alienGameState?.aliens || {});
    return slots.length > 0 && slots.every((slot) => slot?.traces?.[traceType]?.firstPlaced);
  }

  function taskConditionMet(task, player, context) {
    const condition = task?.condition;
    if (!condition) return false;
    if (condition.type === "completedSectorsByColor" && condition.color === "yellow") {
      return countYellowSectorWins(player, context.nebulaDataState) >= Number(condition.count || 1);
    }
    if (condition.type === "allAliensHaveTrace") {
      return allAliensHaveTrace(context.alienGameState, condition.traceType);
    }
    return false;
  }

  function collectReadyTasks(player, context) {
    const ready = [];
    for (const card of player?.reservedCards || []) {
      const model = getCardModel(card);
      if (!model?.tasks?.length) continue;
      ensureCardEffectState(card);
      for (const task of model.tasks) {
        if (isTaskCompleted(card, task.id)) continue;
        if (!taskConditionMet(task, player, context)) continue;
        ready.push({
          card,
          task,
          effects: expandEffects(task.rewards || []),
        });
      }
    }
    return ready;
  }

  function collectTemporaryTaskRewards(tasks, settlementResult) {
    const settlementCount = settlementResult?.settlements?.length || 0;
    const effects = [];
    for (const task of tasks || []) {
      if (task?.condition?.type !== "sectorCompletedDuringCard") continue;
      if (settlementCount < Number(task.condition.count || 1)) continue;
      effects.push(...expandEffects(task.rewards || []));
    }
    return effects;
  }

  function areAllTriggersConsumed(card) {
    const model = getCardModel(card);
    if (!model?.triggers?.length) return false;
    const consumed = card?.cardEffectState?.consumedTriggerIds || [];
    return model.triggers.every((trigger) => consumed.includes(trigger.id));
  }

  function getConsumedTriggerIndexes(card) {
    const model = getCardModel(card);
    if (!model?.triggers?.length) return [];
    const consumed = new Set(card?.cardEffectState?.consumedTriggerIds || []);
    return model.triggers
      .map((trigger, index) => consumed.has(trigger.id) ? index + 1 : null)
      .filter((index) => index != null);
  }

  return Object.freeze({
    EFFECT_TYPES,
    NEBULA_IDS_BY_COLOR,
    MODELS,
    getCardId,
    getCardModel,
    buildPlayEffects,
    getTemporaryTasks,
    ensureCardEffectState,
    consumeTrigger,
    completeTask,
    collectMatchingTriggers,
    collectReadyTasks,
    collectTemporaryTaskRewards,
    areAllTriggersConsumed,
    getConsumedTriggerIndexes,
  });
});
