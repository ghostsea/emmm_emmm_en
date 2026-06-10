(function (root, factory) {
  "use strict";

  let layout = root.SetiSolarLayout;
  if (!layout && typeof require === "function") {
    layout = require("./layout");
  }

  const api = factory(layout);

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.SetiSolarSystem = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function (layout) {
  "use strict";

  if (!layout) {
    throw new Error("SetiSolarLayout is required before SetiSolarSystem");
  }

  const WHEEL_IDS = Object.freeze([1, 2, 3, 4]);
  const VISIBLE_WHEEL_IDS = Object.freeze([...WHEEL_IDS].sort((a, b) => (
    layout.WHEELS[a].zOrder - layout.WHEELS[b].zOrder
  )));
  const MOVING_WHEEL_IDS = Object.freeze([1, 2, 3]);
  const BOARD_RING_IDS = Object.freeze([1, 2, 3, 4, 5]);
  const COUNTED_CONTENT_KINDS = new Set([
    layout.CONTENT_KIND.PLANET,
    layout.CONTENT_KIND.ASTEROID,
    layout.CONTENT_KIND.COMET,
    layout.CONTENT_KIND.NEBULA,
  ]);
  const PASS_THROUGH_KINDS = new Set([
    layout.CONTENT_KIND.HOLE,
    layout.CONTENT_KIND.OUTSIDE_WHEEL,
  ]);

  const wheelCellIndexes = buildWheelCellIndexes(layout.WHEELS);

  function mod8(n) {
    return ((Number(n) % 8) + 8) % 8;
  }

  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function buildWheelCellIndexes(wheels) {
    return Object.freeze(Object.fromEntries(
      Object.keys(wheels).map((wheelId) => {
        const entries = wheels[wheelId].cells.map((cell) => [`${cell.x},${cell.y}`, cell]);
        return [wheelId, Object.freeze(Object.fromEntries(entries))];
      }),
    ));
  }

  function normalizeSectorBySlot(input) {
    const source = input || layout.BASE_SECTOR_BY_SLOT;
    return {
      1: Number(source[1] || source.slot1 || layout.BASE_SECTOR_BY_SLOT[1]),
      2: Number(source[2] || source.slot2 || layout.BASE_SECTOR_BY_SLOT[2]),
      3: Number(source[3] || source.slot3 || layout.BASE_SECTOR_BY_SLOT[3]),
      4: Number(source[4] || source.slot4 || layout.BASE_SECTOR_BY_SLOT[4]),
    };
  }

  function toSectorAssignment(sectorBySlot) {
    const normalized = normalizeSectorBySlot(sectorBySlot);
    return {
      slot1: normalized[1],
      slot2: normalized[2],
      slot3: normalized[3],
      slot4: normalized[4],
    };
  }

  function readWheelStep(input, wheelId) {
    if (!input) return 0;
    if (Array.isArray(input)) return Number(input[wheelId] || 0);
    return Number(
      input[`wheel${wheelId}Steps`]
      || input[wheelId]
      || input[String(wheelId)]
      || 0,
    );
  }

  function normalizeRotationState(input, rotationCount) {
    const source = input && input.rotation ? input.rotation : input;
    return {
      wheel1Steps: readWheelStep(source, 1),
      wheel2Steps: readWheelStep(source, 2),
      wheel3Steps: readWheelStep(source, 3),
      wheel4Steps: readWheelStep(source, 4),
      rotationCount: Number(
        rotationCount
        ?? source?.rotationCount
        ?? input?.rotationCount
        ?? 0,
      ),
    };
  }

  function normalizeSolarInput(input) {
    const source = input || {};
    return {
      rotation: normalizeRotationState(
        source.rotation
        || source.solarRotationInitial
        || source.wheelSteps
        || source,
        source.rotationCount,
      ),
      sectorBySlot: normalizeSectorBySlot(source.sectorBySlot || source.sectorAssignment),
    };
  }

  function rotationToWheelSteps(rotation) {
    const normalized = normalizeRotationState(rotation);
    return [
      0,
      normalized.wheel1Steps,
      normalized.wheel2Steps,
      normalized.wheel3Steps,
      normalized.wheel4Steps,
    ];
  }

  function getWheelStep(rotation, wheelId) {
    const normalized = normalizeRotationState(rotation);
    return Number(normalized[`wheel${wheelId}Steps`] || 0);
  }

  function getNormalizedWheelStep(rotation, wheelId) {
    return mod8(getWheelStep(rotation, wheelId));
  }

  function toDisplayX(baseX, wheelId, rotation) {
    return mod8(baseX + getWheelStep(rotation, wheelId));
  }

  function toBaseX(displayX, wheelId, rotation) {
    return mod8(displayX - getWheelStep(rotation, wheelId));
  }

  function getBaseWheelCell(wheelId, baseX, y) {
    const wheel = layout.WHEELS[wheelId];
    if (!wheel) throw new Error(`Unknown wheel: ${wheelId}`);

    if (!wheel.rings.includes(y)) {
      return {
        x: baseX,
        y,
        kind: layout.CONTENT_KIND.OUTSIDE_WHEEL,
        label: "不属于该板块",
      };
    }

    return wheelCellIndexes[wheelId][`${baseX},${y}`] || {
      x: baseX,
      y,
      kind: layout.CONTENT_KIND.HOLE,
      label: "未标注区域，按镂空处理",
      inferred: true,
    };
  }

  function getWheelCellAtDisplayCoordinate(wheelId, displayX, y, rotation) {
    const baseX = toBaseX(displayX, wheelId, rotation);
    const cell = getBaseWheelCell(wheelId, baseX, y);
    return {
      wheelId,
      displayX,
      y,
      baseX,
      step: getWheelStep(rotation, wheelId),
      normalizedStep: getNormalizedWheelStep(rotation, wheelId),
      cell,
    };
  }

  function isPassThroughCell(cell) {
    return PASS_THROUGH_KINDS.has(cell.kind);
  }

  function getNebulaLocations(sectorBySlotInput) {
    const sectorBySlot = normalizeSectorBySlot(sectorBySlotInput);
    const locations = [];

    for (const slot of [1, 3, 4, 2]) {
      const sectorId = sectorBySlot[slot];
      const sector = layout.SECTORS[sectorId];
      const coordinates = layout.SECTOR_SLOT_COORDINATES[slot];

      for (const coordinate of coordinates) {
        const nebula = sector?.nebulae.find((item) => item.localIndex === coordinate.localIndex);
        locations.push({
          id: nebula?.id || `slot-${slot}-${coordinate.localIndex}`,
          label: nebula?.label || "未知星云",
          kind: layout.CONTENT_KIND.NEBULA,
          sectorId,
          slot,
          localIndex: coordinate.localIndex,
          side: coordinate.side,
          x: coordinate.x,
          y: coordinate.y,
        });
      }
    }

    return locations;
  }

  function getNebulaAtCoordinate(displayX, y, sectorBySlot) {
    if (y !== 5) return null;
    return getNebulaLocations(sectorBySlot).find((nebula) => nebula.x === mod8(displayX)) || null;
  }

  function collectNebulaRelations(sectorBySlotInput) {
    const sectorBySlot = normalizeSectorBySlot(sectorBySlotInput);
    return [1, 2, 3, 4].map((slot) => {
      const sectorId = sectorBySlot[slot];
      const sector = layout.SECTORS[sectorId];
      const slotDefinition = layout.SLOT_DEFINITIONS[slot];
      const pair = getNebulaLocations(sectorBySlot)
        .filter((nebula) => nebula.slot === slot)
        .sort((a, b) => a.localIndex - b.localIndex);
      const nebulaLabels = pair.map((nebula) => nebula.label);
      const xCoordinates = pair.map((nebula) => nebula.x);

      return {
        slot,
        slotLabel: slotDefinition?.label || `槽${slot}`,
        slotSide: slotDefinition?.side || null,
        sectorId,
        sectorAsset: sector?.asset || null,
        nebulaIds: pair.map((nebula) => nebula.id),
        nebulaLabels,
        xCoordinates,
        coordinates: pair.map((nebula) => [nebula.x, nebula.y]),
        clockwiseOffset: pair.length === 2 ? mod8(pair[1].x - pair[0].x) : null,
        displayText: `[${nebulaLabels.join(" ")}]-[${xCoordinates.join(",")}]`,
        relation: "same-sector-fixed-pair",
      };
    });
  }

  function resolveVisibleContent(displayX, y, input) {
    const solar = normalizeSolarInput(input);

    if (y === 0) {
      return {
        x: 0,
        y: 0,
        source: "sun",
        content: {
          kind: layout.CONTENT_KIND.SUN,
          label: "太阳",
        },
        trace: [],
      };
    }

    const nebula = getNebulaAtCoordinate(displayX, y, solar.sectorBySlot);
    if (nebula) {
      return {
        x: mod8(displayX),
        y,
        source: "sector",
        content: nebula,
        trace: [],
      };
    }

    const trace = [];
    for (const wheelId of VISIBLE_WHEEL_IDS) {
      const wheelCell = getWheelCellAtDisplayCoordinate(wheelId, mod8(displayX), y, solar.rotation);
      trace.push(wheelCell);
      if (!isPassThroughCell(wheelCell.cell)) {
        return {
          x: mod8(displayX),
          y,
          source: `wheel${wheelId}`,
          wheelId,
          baseX: wheelCell.baseX,
          content: wheelCell.cell,
          trace,
        };
      }
    }

    return {
      x: mod8(displayX),
      y,
      source: "fallback",
      content: {
        kind: layout.CONTENT_KIND.EMPTY_SPACE,
        label: "未覆盖太空",
      },
      trace,
    };
  }

  function collectStaticWheelCoordinateContents() {
    const result = {};

    for (const wheelId of WHEEL_IDS) {
      result[wheelId] = [];
      for (const y of BOARD_RING_IDS) {
        for (let x = 0; x < 8; x += 1) {
          result[wheelId].push({
            wheelId,
            x,
            y,
            cell: getBaseWheelCell(wheelId, x, y),
          });
        }
      }
    }

    return result;
  }

  function collectWheelCoordinateContents(input) {
    const solar = normalizeSolarInput(input);
    const result = {};

    for (const wheelId of WHEEL_IDS) {
      result[wheelId] = [];
      for (const y of BOARD_RING_IDS) {
        for (let displayX = 0; displayX < 8; displayX += 1) {
          result[wheelId].push(getWheelCellAtDisplayCoordinate(
            wheelId,
            displayX,
            y,
            solar.rotation,
          ));
        }
      }
    }

    return result;
  }

  function collectVisibleCoordinateContents(input) {
    const result = [resolveVisibleContent(0, 0, input)];

    for (const y of BOARD_RING_IDS) {
      for (let x = 0; x < 8; x += 1) {
        result.push(resolveVisibleContent(x, y, input));
      }
    }

    return result;
  }

  function collectPlanetLocations(input) {
    const solar = normalizeSolarInput(input);
    const planets = [];

    for (const wheelId of WHEEL_IDS) {
      const wheel = layout.WHEELS[wheelId];
      for (const cell of wheel.cells) {
        if (cell.kind !== layout.CONTENT_KIND.PLANET) continue;
        const planet = layout.PLANETS[cell.planetId] || {};
        planets.push({
          planetId: cell.planetId,
          label: cell.label,
          name: planet.name || cell.label,
          wheelId,
          baseX: cell.x,
          x: toDisplayX(cell.x, wheelId, solar.rotation),
          y: cell.y,
          fixedAfterSetup: Boolean(planet.fixedAfterSetup),
        });
      }
    }

    return planets.sort((a, b) => a.y - b.y || a.x - b.x || a.planetId.localeCompare(b.planetId));
  }

  function countContentKinds(entries) {
    return entries.reduce((counts, entry) => {
      const content = entry.content || entry.cell || {};
      counts[content.kind || layout.CONTENT_KIND.UNKNOWN] = (
        counts[content.kind || layout.CONTENT_KIND.UNKNOWN] || 0
      ) + 1;
      return counts;
    }, {});
  }

  function getContentKindLabel(kind) {
    return layout.CONTENT_KIND_LABELS[kind] || layout.CONTENT_KIND_LABELS[layout.CONTENT_KIND.UNKNOWN];
  }

  function countVisibleMeaningfulContentKinds(entries) {
    return entries.reduce((counts, entry) => {
      const content = entry.content || entry.cell || {};
      const kind = content.kind || layout.CONTENT_KIND.UNKNOWN;
      if (!COUNTED_CONTENT_KINDS.has(kind)) return counts;

      const label = getContentKindLabel(kind);
      counts[label] = (counts[label] || 0) + 1;
      return counts;
    }, {});
  }

  function countWheelContents(wheelContents) {
    return Object.fromEntries(
      Object.entries(wheelContents).map(([wheelId, entries]) => [
        wheelId,
        countContentKinds(entries.map((entry) => ({ cell: entry.cell }))),
      ]),
    );
  }

  function summarizeCell(cell) {
    return {
      kind: cell.kind,
      kindLabel: getContentKindLabel(cell.kind),
      label: cell.label || getContentKindLabel(cell.kind),
      planetId: cell.planetId,
      tags: cell.tags ? [...cell.tags] : [],
      passThrough: isPassThroughCell(cell),
      inferred: Boolean(cell.inferred),
    };
  }

  function collectWheelCoordinateReport(input) {
    const solar = normalizeSolarInput(input);

    return Object.fromEntries(WHEEL_IDS.map((wheelId) => [
      wheelId,
      {
        wheelId,
        step: getWheelStep(solar.rotation, wheelId),
        normalizedStep: getNormalizedWheelStep(solar.rotation, wheelId),
        rows: BOARD_RING_IDS.map((y) => ({
          y,
          cells: Array.from({ length: 8 }, (_, displayX) => {
            const wheelCell = getWheelCellAtDisplayCoordinate(
              wheelId,
              displayX,
              y,
              solar.rotation,
            );
            return {
              x: displayX,
              y,
              baseX: wheelCell.baseX,
              ...summarizeCell(wheelCell.cell),
            };
          }),
        })),
      },
    ]));
  }

  function collectVisibleCoordinateReport(input) {
    return collectVisibleCoordinateContents(input).map((entry) => ({
      x: entry.x,
      y: entry.y,
      source: entry.source,
      wheelId: entry.wheelId,
      baseX: entry.baseX,
      ...summarizeCell(entry.content),
      trace: entry.trace.map((item) => ({
        wheelId: item.wheelId,
        displayX: item.displayX,
        baseX: item.baseX,
        kind: item.cell.kind,
        kindLabel: getContentKindLabel(item.cell.kind),
        label: item.cell.label || getContentKindLabel(item.cell.kind),
        passThrough: isPassThroughCell(item.cell),
      })),
    }));
  }

  function collectVisibleCoordinateGroups(input) {
    const groups = {
      planets: [],
      asteroids: [],
      comets: [],
    };

    for (const cell of collectVisibleCoordinateReport(input)) {
      const coordinate = {
        x: cell.x,
        y: cell.y,
        label: cell.label,
        kind: cell.kind,
        kindLabel: cell.kindLabel,
      };

      if (cell.kind === layout.CONTENT_KIND.PLANET) {
        groups.planets.push(coordinate);
      } else if (cell.kind === layout.CONTENT_KIND.ASTEROID) {
        groups.asteroids.push(coordinate);
      } else if (cell.kind === layout.CONTENT_KIND.COMET) {
        groups.comets.push(coordinate);
      }
    }

    return groups;
  }

  function getNextOrbitWheelIds(rotationCount) {
    const stage = ((Number(rotationCount) % 3) + 3) % 3;
    if (stage === 0) return [1];
    if (stage === 1) return [1, 2];
    return [1, 2, 3];
  }

  function applySolarOrbitRotation(input, count) {
    let rotation = normalizeRotationState(input);
    const iterations = Number(count || 1);

    for (let i = 0; i < iterations; i += 1) {
      const wheelIds = getNextOrbitWheelIds(rotation.rotationCount);
      rotation = {
        ...rotation,
        rotationCount: rotation.rotationCount + 1,
      };

      for (const wheelId of wheelIds) {
        rotation[`wheel${wheelId}Steps`] -= 1;
      }
    }

    return rotation;
  }

  function createBaselineState() {
    return {
      wheelSteps: [0, 0, 0, 0, 0],
      rotation: normalizeRotationState([0, 0, 0, 0, 0], 0),
      sectorBySlot: normalizeSectorBySlot(layout.BASE_SECTOR_BY_SLOT),
    };
  }

  function createSolarSnapshot(input) {
    const solar = normalizeSolarInput(input || createBaselineState());
    const staticWheelContents = collectStaticWheelCoordinateContents();
    const currentWheelContents = collectWheelCoordinateContents(solar);
    const visibleContents = collectVisibleCoordinateContents(solar);
    const planetLocations = collectPlanetLocations(solar);
    const nebulaLocations = getNebulaLocations(solar.sectorBySlot);

    return {
      coordinateSystem: {
        xAxes: deepClone(layout.X_AXES),
        rings: deepClone(layout.RINGS),
        slots: deepClone(layout.SLOT_DEFINITIONS),
      },
      rotation: {
        ...solar.rotation,
        normalized: {
          wheel1Steps: mod8(solar.rotation.wheel1Steps),
          wheel2Steps: mod8(solar.rotation.wheel2Steps),
          wheel3Steps: mod8(solar.rotation.wheel3Steps),
          wheel4Steps: mod8(solar.rotation.wheel4Steps),
        },
      },
      sectorBySlot: solar.sectorBySlot,
      sectorAssignment: toSectorAssignment(solar.sectorBySlot),
      staticWheelContents,
      currentWheelContents,
      wheelCoordinateReport: collectWheelCoordinateReport(solar),
      visibleContents,
      visibleCoordinateReport: collectVisibleCoordinateReport(solar),
      visibleCoordinateGroups: collectVisibleCoordinateGroups(solar),
      planetLocations,
      nebulaLocations,
      nebulaRelations: collectNebulaRelations(solar.sectorBySlot),
      statistics: {
        staticWheelContentCounts: countWheelContents(staticWheelContents),
        currentWheelContentCounts: countWheelContents(currentWheelContents),
        visibleContentCounts: countContentKinds(visibleContents),
        visibleMeaningfulContentCounts: countVisibleMeaningfulContentKinds(visibleContents),
        planetCount: planetLocations.length,
        nebulaCount: nebulaLocations.length,
      },
    };
  }

  function createSetupState(input) {
    const solar = normalizeSolarInput(input || createBaselineState());
    const snapshot = createSolarSnapshot(solar);

    return {
      solarRotationInitial: {
        wheel1Steps: mod8(solar.rotation.wheel1Steps),
        wheel2Steps: mod8(solar.rotation.wheel2Steps),
        wheel3Steps: mod8(solar.rotation.wheel3Steps),
        wheel4Steps: mod8(solar.rotation.wheel4Steps),
        rotationCount: solar.rotation.rotationCount,
      },
      sectorAssignment: snapshot.sectorAssignment,
      solarStatistics: {
        planetLocations: snapshot.planetLocations,
        nebulaLocations: snapshot.nebulaLocations,
        nebulaRelations: snapshot.nebulaRelations,
        visibleContentCounts: snapshot.statistics.visibleMeaningfulContentCounts,
        visibleCoordinateGroups: snapshot.visibleCoordinateGroups,
      },
    };
  }

  return Object.freeze({
    layout,
    WHEEL_IDS,
    VISIBLE_WHEEL_IDS,
    MOVING_WHEEL_IDS,
    BOARD_RING_IDS,
    mod8,
    normalizeRotationState,
    normalizeSolarInput,
    normalizeSectorBySlot,
    toSectorAssignment,
    rotationToWheelSteps,
    getWheelStep,
    getNormalizedWheelStep,
    toDisplayX,
    toBaseX,
    getBaseWheelCell,
    getWheelCellAtDisplayCoordinate,
    resolveVisibleContent,
    collectStaticWheelCoordinateContents,
    collectWheelCoordinateContents,
    collectVisibleCoordinateContents,
    collectWheelCoordinateReport,
    collectVisibleCoordinateReport,
    collectVisibleCoordinateGroups,
    collectPlanetLocations,
    getNebulaLocations,
    getNebulaAtCoordinate,
    collectNebulaRelations,
    countContentKinds,
    getContentKindLabel,
    countVisibleMeaningfulContentKinds,
    countWheelContents,
    getNextOrbitWheelIds,
    applySolarOrbitRotation,
    createBaselineState,
    createSolarSnapshot,
    createSetupState,
  });
});
