(function (root, factory) {
  "use strict";

  let players = root.SetiPlayers;
  let rockets = root.SetiRocketActions;
  let historyCommands = root.SetiHistoryCommands;
  let solar = root.SetiSolarSystem;
  let industryPassives = root.SetiIndustryPassives;

  if ((!players || !rockets || !historyCommands || !solar) && typeof require === "function") {
    players = players || require("../players");
    rockets = rockets || require("../rockets");
    historyCommands = historyCommands || require("../history/commands");
    solar = solar || require("../../solar-system/core");
    industryPassives = industryPassives || require("../industry/passives");
  }

  const api = factory(players, rockets, historyCommands, solar, industryPassives);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiAbilityRocket = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (
  players,
  rockets,
  historyCommands,
  solar,
  industryPassives,
) {
  "use strict";

  const DEFAULT_LAUNCH_COST = Object.freeze({ credits: 2 });
  const DEFAULT_MOVE_COST = Object.freeze({});
  const BASE_ROCKET_LIMIT = 1;
  const ORANGE1_ROCKET_LIMIT = 2;
  const ASTEROID_EXIT_MOVE_POINTS = 2;

  function cloneCost(cost) {
    return Object.fromEntries(
      Object.entries(cost || {}).filter(([, value]) => Number(value) > 0),
    );
  }

  function resolveCost(options, defaultCost) {
    if (options?.skipCost) return {};
    return cloneCost(options?.cost ?? defaultCost);
  }

  function hasCost(cost) {
    return Object.keys(cost || {}).length > 0;
  }

  function getIndustryPassives() {
    return industryPassives || (typeof globalThis !== "undefined" ? globalThis.SetiIndustryPassives : null);
  }

  function spendCost(player, cost) {
    if (!hasCost(cost)) return { ok: true, message: null };
    return players.spendResources(player, cost);
  }

  function buildSpendCommand(player, cost, label) {
    if (!hasCost(cost)) return null;
    return historyCommands.createResourceSpendCommand(
      player,
      cost,
      label || `消耗 ${players.formatResourceCost(cost)}`,
    );
  }

  function getRocketLimitForPlayer(player, options = {}) {
    const baseLimit = players.playerOwnsTech(player, "orange1", options) ? ORANGE1_ROCKET_LIMIT : BASE_ROCKET_LIMIT;
    const bonus = getIndustryPassives()?.getRocketLimitBonus?.(player) || 0;
    return baseLimit + bonus;
  }

  function getActiveRocketCountForPlayer(rocketState, playerId) {
    return rockets.getRocketsForPlayer(rocketState, playerId).length;
  }

  function getVisibleContent(context, coordinate) {
    if (!coordinate || !solar?.resolveVisibleContent) return null;
    return solar.resolveVisibleContent(coordinate.x, coordinate.y, context.solarState)?.content || null;
  }

  function isAsteroidContent(content) {
    return content?.kind === solar?.layout?.CONTENT_KIND?.ASTEROID;
  }

  function isCometContent(content) {
    return content?.kind === solar?.layout?.CONTENT_KIND?.COMET;
  }

  function isNonEarthPlanetContent(content) {
    return content?.kind === solar?.layout?.CONTENT_KIND?.PLANET && content.planetId !== "earth";
  }

  function isPlanetContent(content) {
    return content?.kind === solar?.layout?.CONTENT_KIND?.PLANET;
  }

  function isPassThroughContent(content) {
    const kind = content?.kind;
    return kind === solar?.layout?.CONTENT_KIND?.HOLE
      || kind === solar?.layout?.CONTENT_KIND?.OUTSIDE_WHEEL;
  }

  function isHoleContent(content) {
    return content?.kind === solar?.layout?.CONTENT_KIND?.HOLE;
  }

  function getPlayerById(playerState, playerId) {
    return (playerState?.players || []).find((player) => player.id === playerId) || null;
  }

  function buildSolarInputWithRotation(context, rotation) {
    return {
      ...(context.solarState || {}),
      rotation,
    };
  }

  function getVisibleContentAtRotation(context, coordinate, rotation) {
    if (!coordinate || !solar?.resolveVisibleContent) return null;
    return solar.resolveVisibleContent(
      coordinate.x,
      coordinate.y,
      buildSolarInputWithRotation(context, rotation),
    );
  }

  function getRotatingWheelIds(beforeRotation, afterRotation) {
    return solar.WHEEL_IDS.filter((wheelId) => (
      solar.getWheelStep(beforeRotation, wheelId) !== solar.getWheelStep(afterRotation, wheelId)
    ));
  }

  function getWheelStepDelta(beforeRotation, afterRotation, wheelId) {
    return solar.getWheelStep(afterRotation, wheelId) - solar.getWheelStep(beforeRotation, wheelId);
  }

  function resolveRocketRotationPlan(context, rocket, beforeRotation, afterRotation) {
    const from = rockets.getRocketSectorCoordinate(rocket);
    if (!from) return null;

    const rotatingWheelIds = getRotatingWheelIds(beforeRotation, afterRotation);
    if (!rotatingWheelIds.length) return null;

    const beforeVisible = getVisibleContentAtRotation(context, from, beforeRotation);
    if (
      beforeVisible?.wheelId
      && rotatingWheelIds.includes(beforeVisible.wheelId)
      && !isPassThroughContent(beforeVisible.content)
    ) {
      const to = {
        x: solar.toDisplayX(beforeVisible.baseX, beforeVisible.wheelId, afterRotation),
        y: from.y,
      };
      return {
        rocket,
        from,
        to,
        reason: "follow",
        wheelId: beforeVisible.wheelId,
        content: beforeVisible.content,
      };
    }

    for (const wheelId of solar.VISIBLE_WHEEL_IDS) {
      const beforeCell = solar.getWheelCellAtDisplayCoordinate(
        wheelId,
        from.x,
        from.y,
        beforeRotation,
      ).cell;
      const afterCell = solar.getWheelCellAtDisplayCoordinate(
        wheelId,
        from.x,
        from.y,
        afterRotation,
      ).cell;

      if (rotatingWheelIds.includes(wheelId) && isHoleContent(beforeCell) && !isPassThroughContent(afterCell)) {
        const delta = getWheelStepDelta(beforeRotation, afterRotation, wheelId);
        return {
          rocket,
          from,
          to: { x: solar.mod8(from.x + delta), y: from.y },
          reason: "pushed",
          wheelId,
          content: afterCell,
        };
      }

      if (!isPassThroughContent(beforeCell)) break;
    }

    return null;
  }

  function getOccupiedSlotsExcludingMoving(rocketState, movingRocketIds, reservedSlots) {
    const occupied = new Map();
    for (const rocket of rocketState.rockets || []) {
      if (movingRocketIds.has(rocket.id)) continue;
      if (!Number.isInteger(rocket.sectorX) || !Number.isInteger(rocket.sectorY)) continue;
      if (!Number.isInteger(rocket.slotIndex)) continue;
      const key = `${rocket.sectorX},${rocket.sectorY}`;
      if (!occupied.has(key)) occupied.set(key, new Set());
      occupied.get(key).add(rocket.slotIndex);
    }
    for (const [key, slots] of reservedSlots.entries()) {
      if (!occupied.has(key)) occupied.set(key, new Set());
      for (const slotIndex of slots) occupied.get(key).add(slotIndex);
    }
    return occupied;
  }

  function reserveRotationDestinationSlot(rocketState, movingRocketIds, reservedSlots, to) {
    const key = `${to.x},${to.y}`;
    const occupied = getOccupiedSlotsExcludingMoving(rocketState, movingRocketIds, reservedSlots);
    const occupiedSlots = occupied.get(key) || new Set();
    for (const slotIndex of solar.LAUNCH_SLOT_PRIORITY) {
      if (occupiedSlots.has(slotIndex)) continue;
      if (!reservedSlots.has(key)) reservedSlots.set(key, new Set());
      reservedSlots.get(key).add(slotIndex);
      return slotIndex;
    }
    return null;
  }

  function applyArrivalRewards(context, player, rocket, content, options = {}) {
    const rewardNotes = [];
    const events = [];
    if (!player || !content) return { rewardNotes, events };

    if (isPlanetContent(content)) {
      let publicityGained = 0;
      let publicityReward = 0;
      if (isNonEarthPlanetContent(content)) {
        const beforePublicity = Number(player.resources?.publicity) || 0;
        players.gainResources(player, { publicity: 1 });
        publicityReward = 1;
        publicityGained = Math.max(0, (Number(player.resources?.publicity) || 0) - beforePublicity);
        rewardNotes.push(`${options.prefix || "到达"}${content.label || "行星"}，宣传+1`);
      }
      events.push({
        type: "visitPlanet",
        planetId: content.planetId,
        rocketId: rocket.id,
        tokenKind: rocket.kind || "standard",
        fossilId: rocket.fossilId || null,
        playerId: player.id,
        source: options.source || "move",
        publicityReward,
        publicityGained,
      });
    }

    if (isCometContent(content)) {
      const beforePublicity = Number(player.resources?.publicity) || 0;
      players.gainResources(player, { publicity: 1 });
      const publicityGained = Math.max(0, (Number(player.resources?.publicity) || 0) - beforePublicity);
      rewardNotes.push(`${options.prefix || "到达"}彗星，宣传+1`);
      events.push({
        type: "visitComet",
        rocketId: rocket.id,
        tokenKind: rocket.kind || "standard",
        fossilId: rocket.fossilId || null,
        playerId: player.id,
        source: options.source || "move",
        publicityReward: 1,
        publicityGained,
      });
    }

    if (isAsteroidContent(content)) {
      if (players.playerOwnsTech(player, "orange2", context)) {
        players.gainResources(player, { publicity: 1 });
        rewardNotes.push("橙色2：进入小行星，宣传+1");
      }
      events.push({
        type: "visitAsteroid",
        rocketId: rocket.id,
        tokenKind: rocket.kind || "standard",
        fossilId: rocket.fossilId || null,
        playerId: player.id,
        source: options.source || "move",
      });
    }

    return { rewardNotes, events };
  }

  function resolveMoveGeometry(context, rocketId, deltaX, deltaY) {
    const rocket = context.rocketState.rockets.find((item) => item.id === rocketId);
    const from = rockets.getRocketSectorCoordinate(rocket);
    if (!rocket || !from) return { rocket, from: null, to: null, fromContent: null, toContent: null };
    const to = {
      x: solar.mod8(from.x + Number(deltaX || 0)),
      y: Math.min(
        rockets.SECTOR_RING_MAX,
        Math.max(rockets.SECTOR_RING_MIN, from.y + Number(deltaY || 0)),
      ),
    };
    return {
      rocket,
      from,
      to,
      fromContent: getVisibleContent(context, from),
      toContent: getVisibleContent(context, to),
    };
  }

  function getRequiredMovePoints(context, player, rocketId, deltaX, deltaY, options = {}) {
    const geometry = resolveMoveGeometry(context, rocketId, deltaX, deltaY);
    const exitsAsteroid = isAsteroidContent(geometry.fromContent);
    if (!options.ignoreAsteroidRestriction && exitsAsteroid && !players.playerOwnsTech(player, "orange2", context)) {
      return ASTEROID_EXIT_MOVE_POINTS;
    }
    return 1;
  }

  function resolveProvidedMovePoints(options, cost) {
    if (Number.isFinite(Number(options.movementPoints))) {
      return Math.max(0, Math.round(Number(options.movementPoints)));
    }
    if (Number.isFinite(Number(cost?.energy)) && Number(cost.energy) > 0) {
      return Math.round(Number(cost.energy));
    }
    return 1;
  }

  function launchProbe(context, options = {}) {
    const currentPlayer = players.getCurrentPlayer(context.playerState);
    if (!currentPlayer) {
      return { ok: false, abilityId: "launchProbe", message: "没有当前玩家" };
    }

    const defaultLaunchCost = getIndustryPassives()?.getStandardLaunchCost?.(currentPlayer, DEFAULT_LAUNCH_COST)
      || DEFAULT_LAUNCH_COST;
    const cost = resolveCost(options, defaultLaunchCost);
    const rocketLimit = getRocketLimitForPlayer(currentPlayer, context);
    const activeRocketCount = getActiveRocketCountForPlayer(context.rocketState, currentPlayer.id);
    if (!options.ignoreRocketLimit && activeRocketCount >= rocketLimit) {
      return {
        ok: false,
        abilityId: "launchProbe",
        message: `火箭数量已达上限（${activeRocketCount}/${rocketLimit}）`,
      };
    }

    if (hasCost(cost) && !players.canAfford(currentPlayer, cost)) {
      return {
        ok: false,
        abilityId: "launchProbe",
        message: `资源不足，需要 ${players.formatResourceCost(cost)}`,
      };
    }

    const undoState = {
      nextRocketId: context.rocketState.nextRocketId,
      activeRocketId: context.rocketState.activeRocketId,
    };
    const earthSector = options.sectorCoordinate || context.getEarthSectorCoordinate();
    const launchResult = rockets.launchRocketAtSector(context.rocketState, earthSector, {
      playerId: currentPlayer.id,
      color: currentPlayer.color,
    });

    if (!launchResult.ok) {
      return {
        ok: false,
        abilityId: "launchProbe",
        message: launchResult.message,
      };
    }

    const spendResult = spendCost(currentPlayer, cost);
    if (!spendResult.ok) {
      rockets.removeRocket(context.rocketState, launchResult.rocket.id);
      context.rocketState.nextRocketId = undoState.nextRocketId;
      context.rocketState.activeRocketId = undoState.activeRocketId;
      return {
        ok: false,
        abilityId: "launchProbe",
        message: spendResult.message,
      };
    }

    const commands = [];
    const spendCommand = buildSpendCommand(
      currentPlayer,
      cost,
      options.historyLabel || `发射消耗 ${players.formatResourceCost(cost)}`,
    );
    if (spendCommand) commands.push(spendCommand);
    commands.push(historyCommands.createRemoveRocketCommand(
      rockets,
      context.rocketState,
      launchResult.rocket.id,
      currentPlayer,
      null,
      undoState,
    ));

    const costText = hasCost(cost) ? `，消耗 ${players.formatResourceCost(cost)}` : "";
    const message = `${launchResult.message}${costText}`;
    context.rocketState.statusNote = message;

    return {
      ok: true,
      abilityId: "launchProbe",
      message,
      undoable: true,
      commands,
      cost,
      payload: {
        rocket: launchResult.rocket,
      },
      events: [{
        type: "launch",
        rocketId: launchResult.rocket.id,
        playerId: currentPlayer.id,
        source: options.source || "launch",
      }],
      rocket: launchResult.rocket,
    };
  }

  function moveProbe(context, options = {}) {
    const rocketId = Number(options.rocketId ?? context.rocketState.activeRocketId);
    const deltaX = Number(options.deltaX || 0);
    const deltaY = Number(options.deltaY || 0);
    const currentPlayer = players.getCurrentPlayer(context.playerState);
    const cost = resolveCost(options, DEFAULT_MOVE_COST);

    if (!currentPlayer) {
      return { ok: false, abilityId: "moveProbe", message: "没有当前玩家" };
    }
    if (!Number.isInteger(rocketId)) {
      return { ok: false, abilityId: "moveProbe", message: "没有可移动的飞船" };
    }
    if (hasCost(cost) && !players.canAfford(currentPlayer, cost)) {
      return {
        ok: false,
        abilityId: "moveProbe",
        message: `资源不足，需要 ${players.formatResourceCost(cost)}`,
      };
    }

    const moveCheck = rockets.canMoveRocket(context.rocketState, rocketId, deltaX, deltaY);
    if (!moveCheck.ok) {
      return { ok: false, abilityId: "moveProbe", message: moveCheck.message };
    }

    const requiredMovePoints = getRequiredMovePoints(context, currentPlayer, rocketId, deltaX, deltaY, options);
    const providedMovePoints = resolveProvidedMovePoints(options, cost);
    if (providedMovePoints < requiredMovePoints) {
      return {
        ok: false,
        abilityId: "moveProbe",
        message: `移动力不足，需要 ${requiredMovePoints} 点移动力`,
      };
    }

    const geometry = resolveMoveGeometry(context, rocketId, deltaX, deltaY);
    const beforeRocket = structuredClone(
      context.rocketState.rockets.find((rocket) => rocket.id === rocketId),
    );
    const beforePlayer = structuredClone(currentPlayer);
    const spendResult = spendCost(currentPlayer, cost);
    if (!spendResult.ok) {
      return {
        ok: false,
        abilityId: "moveProbe",
        message: spendResult.message,
      };
    }

    const moveResult = rockets.moveRocket(context.rocketState, rocketId, deltaX, deltaY);
    if (!moveResult.ok) {
      if (hasCost(cost)) players.gainResources(currentPlayer, cost);
      return {
        ok: false,
        abilityId: "moveProbe",
        message: moveResult.message,
      };
    }

    const commands = [];
    if (beforeRocket) {
      commands.push(historyCommands.createMoveRocketCommand(
        context.rocketState,
        rocketId,
        beforeRocket,
      ));
    }
    const { rewardNotes, events } = options.suppressArrivalRewards
      ? { rewardNotes: [], events: [] }
      : applyArrivalRewards(
        context,
        currentPlayer,
        moveResult.rocket,
        geometry.toContent,
        { prefix: "移动到", source: options.source || "move" },
      );
    commands.push(historyCommands.createRestorePlayerCommand(
      currentPlayer,
      beforePlayer,
      "恢复移动前玩家状态",
    ));

    const costText = hasCost(cost) ? `，消耗 ${players.formatResourceCost(cost)}` : "";
    const movePointText = requiredMovePoints > 1 ? `，需要 ${requiredMovePoints} 点移动力` : "";
    const rewardText = rewardNotes.length ? `，${rewardNotes.join("，")}` : "";
    const message = `${moveResult.message}${costText}${movePointText}${rewardText}`;
    context.rocketState.statusNote = message;

    return {
      ok: true,
      abilityId: "moveProbe",
      message,
      undoable: true,
      commands,
      cost,
      payload: {
        rocket: moveResult.rocket,
        rocketId,
        deltaX,
        deltaY,
        from: geometry.from,
        to: geometry.to,
        requiredMovePoints,
        providedMovePoints,
        rewards: rewardNotes,
      },
      events,
      rocket: moveResult.rocket,
    };
  }

  function settleRocketsAfterSolarRotation(context, beforeRotation, afterRotation) {
    if (!context?.rocketState || !context?.solarState || !context?.playerState) {
      return {
        ok: true,
        abilityId: "settleRocketsAfterSolarRotation",
        message: "太阳系旋转",
        moved: [],
        events: [],
      };
    }

    const plans = (context.rocketState.rockets || [])
      .filter((rocket) => rockets.isMovablePlayerToken(rocket) || rockets.isControllablePlayerRocket(rocket))
      .map((rocket) => resolveRocketRotationPlan(context, rocket, beforeRotation, afterRotation))
      .filter((plan) => plan && (plan.from.x !== plan.to.x || plan.from.y !== plan.to.y));

    if (!plans.length) {
      return {
        ok: true,
        abilityId: "settleRocketsAfterSolarRotation",
        message: "太阳系旋转，火箭位置不变",
        moved: [],
        events: [],
      };
    }

    const movingRocketIds = new Set(plans.map((plan) => plan.rocket.id));
    const reservedSlots = new Map();
    const moved = [];
    const allEvents = [];
    const notes = [];

    for (const plan of plans) {
      const slotIndex = reserveRotationDestinationSlot(
        context.rocketState,
        movingRocketIds,
        reservedSlots,
        plan.to,
      );
      if (slotIndex === null) {
        notes.push(`R${plan.rocket.id} 目标扇区[${plan.to.x},${plan.to.y}]已满`);
        continue;
      }

      const player = getPlayerById(context.playerState, plan.rocket.playerId);
      const beforeRocket = structuredClone(plan.rocket);
      const beforePlayer = player ? structuredClone(player) : null;
      rockets.assignRocketToSlot(plan.rocket, plan.to.x, plan.to.y, slotIndex);

      const afterVisible = getVisibleContentAtRotation(context, plan.to, afterRotation);
      const rewardResult = plan.reason === "pushed"
        ? applyArrivalRewards(context, player, plan.rocket, afterVisible?.content, {
          prefix: "推动到",
          source: "rotation",
        })
        : { rewardNotes: [], events: [] };
      allEvents.push(...rewardResult.events);

      moved.push({
        rocketId: plan.rocket.id,
        playerId: plan.rocket.playerId || null,
        from: plan.from,
        to: { ...plan.to, slotIndex },
        reason: plan.reason,
        wheelId: plan.wheelId,
        beforeRocket,
        beforePlayer,
        afterContent: afterVisible?.content || null,
        rewards: rewardResult.rewardNotes,
      });
      const reasonText = plan.reason === "pushed" ? "镂空推动" : "随盘旋转";
      const rewardText = rewardResult.rewardNotes.length ? `（${rewardResult.rewardNotes.join("，")}）` : "";
      notes.push(`R${plan.rocket.id}${reasonText}->[${plan.to.x},${plan.to.y}]#${slotIndex}${rewardText}`);
    }

    const message = notes.length ? `太阳系旋转：${notes.join("；")}` : "太阳系旋转";
    context.rocketState.statusNote = message;
    return {
      ok: true,
      abilityId: "settleRocketsAfterSolarRotation",
      message,
      moved,
      events: allEvents,
    };
  }

  return Object.freeze({
    DEFAULT_LAUNCH_COST,
    DEFAULT_MOVE_COST,
    BASE_ROCKET_LIMIT,
    ORANGE1_ROCKET_LIMIT,
    ASTEROID_EXIT_MOVE_POINTS,
    getRocketLimitForPlayer,
    getRequiredMovePoints,
    launchProbe,
    moveProbe,
    settleRocketsAfterSolarRotation,
  });
});
