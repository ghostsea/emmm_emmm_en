const assert = require("node:assert/strict");

const players = require("./players");
const cards = require("./cards/deck");
const data = require("./data");
const planetStats = require("./planet-stats");
const aliens = require("./aliens");
const initialCards = require("./initial-cards");

function createContext(playerInputs = [{ color: "blue" }]) {
  const playerState = players.createPlayerState({
    players: playerInputs,
    currentPlayerColor: playerInputs[0]?.color || "blue",
  });
  return {
    playerState,
    cardState: cards.createCardState(),
    nebulaDataState: data.createDefaultNebulaDataState(),
    planetStatsState: planetStats.createPlanetStatsState(),
    alienGameState: aliens.createDefaultAlienState(),
    launches: [],
    getPlayerTokenSrc(player) {
      return players.getPlayerColorDefinition(player?.color)?.normalTokenAsset || null;
    },
    blindDrawCard(player) {
      const card = {
        id: `test-card-${player.hand.length + 1}`,
        src: "../assets/cards/card_back.png",
        faceUp: false,
      };
      cards.addCardToHand(player, card);
      return { ok: true, card, message: null };
    },
    launchRocketAtEarth(player) {
      const rocket = { id: this.launches.length + 1, playerId: player.id, color: player.color };
      this.launches.push(rocket);
      return { ok: true, rocket, message: `测试发射 R${rocket.id}` };
    },
  };
}

function currentPlayer(context) {
  return players.getCurrentPlayer(context.playerState);
}

function initialCard(number) {
  return {
    id: `initial:${number}`,
    kind: "initial",
    label: `初始牌 ${number}`,
    src: `../assets/initial_card/split/${number}.png`,
  };
}

{
  const context = createContext();
  data.fillNebulaData(context.nebulaDataState, "sector-2-a", { source: "test" });
  const player = currentPlayer(context);

  const result = initialCards.resolveInitialCardEffect(context, player, initialCard(1));

  assert.equal(result.ok, true);
  assert.equal(result.cardNumber, 1);
  assert.equal(player.resources.score, 2);
  assert.equal(data.listPoolTokens(player).length, 2);
  assert.equal(player.resources.availableData, 2);
  assert.equal(
    data.listNebulaTokens(context.nebulaDataState, "sector-2-a")
      .filter((token) => token.replacedByPlayerId === player.id)
      .length,
    2,
  );
  assert.equal(result.events.filter((event) => event.type === "signalMarked").length, 2);
}

{
  const context = createContext();
  const player = currentPlayer(context);
  player.resources.credits = 99;
  player.resources.energy = 99;
  player.resources.publicity = 9;

  const result = initialCards.resolveIndustryEffect(context, player, { label: "层云核心" });

  assert.equal(result.ok, true);
  assert.equal(player.resources.credits, 3);
  assert.equal(player.resources.energy, 2);
  assert.equal(player.resources.publicity, 3);
  assert.equal(player.resources.handSize, 1);
  assert.deepEqual(player.income, {
    credits: 2,
    energy: 1,
    handSize: 1,
    publicity: 0,
    availableData: 0,
    additionalPublicScan: 0,
  });
  assert.equal(result.incomeIncreaseCount, 3);
}

{
  const context = createContext();
  const player = currentPlayer(context);

  const result = initialCards.resolveIndustryEffect(context, player, { label: "异星实验室" });

  assert.equal(result.ok, true);
  assert.equal(player.resources.publicity, 1);
  assert.equal(player.resources.credits, 2);
  assert.equal(player.resources.energy, 2);
  assert.equal(player.resources.handSize, 1);
  assert.equal(result.incomeIncreaseCount, 3);
}

{
  const context = createContext();
  const player = currentPlayer(context);

  const result = initialCards.resolveIndustryEffect(context, player, { label: "图灵系统" });

  assert.equal(result.ok, true);
  assert.equal(player.resources.credits, 4);
  assert.equal(player.resources.energy, 2);
  assert.equal(player.resources.publicity, 2);
  assert.equal(player.resources.availableData, 0, "base income data should not resolve immediately");
  assert.equal(player.income.availableData, 1);
  assert.equal(player.resources.handSize, 1);
  assert.equal(result.incomeIncreaseCount, 2);
}

{
  const context = createContext();
  const player = currentPlayer(context);

  const result = initialCards.resolveIndustryEffect(context, player, { label: "寰宇动力" });

  assert.equal(result.ok, true);
  assert.equal(context.launches.length, 2);
  assert.equal(result.incomeIncreaseCount, 2);
}

{
  const context = createContext();
  const player = currentPlayer(context);

  const result = initialCards.resolveInitialCardEffect(context, player, initialCard(3));

  assert.equal(result.ok, true);
  assert.equal(player.resources.score, 3);
  assert.equal(player.resources.publicity, 1);
  assert.equal(player.resources.handSize, 1);
  assert.equal(planetStats.getPlanetOrbitCount(context.planetStatsState, "mars"), 1);
  assert.equal(player.orbitCount, 1);
}

{
  const context = createContext();
  const player = currentPlayer(context);

  const incomeResult = initialCards.resolveInitialCardEffect(context, player, initialCard(7));

  assert.equal(incomeResult.ok, true);
  assert.equal(player.income.availableData, 1);
  assert.equal(data.listPoolTokens(player).length, 1);
  assert.equal(planetStats.getPlanetOrbitCount(context.planetStatsState, "uranus"), 1);
}

{
  const context = createContext();
  const player = currentPlayer(context);

  const incomeResult = initialCards.resolveInitialCardEffect(context, player, initialCard(9));

  assert.equal(incomeResult.ok, true);
  assert.equal(player.income.handSize, 1);
  assert.equal(player.hand.length, 1);
  assert.equal(planetStats.getPlanetOrbitCount(context.planetStatsState, "neptune"), 1);

  const traceResult = initialCards.resolveInitialCardEffect(context, player, initialCard(10));
  assert.equal(traceResult.ok, true);
  assert.equal(aliens.getAlienSlot(context.alienGameState, 2).traces.yellow.firstPlaced, true);
  assert.equal(aliens.getAlienSlot(context.alienGameState, 2).traces.yellow.ownerPlayerColor, player.color);
}

{
  const context = createContext([{ color: "blue" }, { color: "white" }]);
  data.fillNebulaData(context.nebulaDataState, "sector-1-a", { source: "test" });
  const [blue, white] = context.playerState.players;
  blue.initialSelection = { removedInitialCards: [initialCard(16)] };
  blue.initialSelection.industry = { label: "芬威克研究中心" };
  white.initialSelection = {
    industry: { label: "宇宙战略集团" },
    removedInitialCards: [initialCard(18)],
  };

  const result = initialCards.resolveInitialSelections(context, {
    playerIds: [blue.id, white.id],
  });

  assert.equal(result.ok, true);
  assert.equal(blue.resources.score, 3);
  assert.equal(blue.resources.publicity, 7);
  assert.equal(data.listPoolTokens(white).length, 2);
  assert.equal(result.results.length, 4);
  assert.deepEqual(result.pendingIncomeIncreases, [
    { playerId: blue.id, count: 3, label: "芬威克研究中心" },
    { playerId: white.id, count: 2, label: "宇宙战略集团" },
  ]);
  assert.deepEqual(result.results.map((entry) => entry.playerId), [
    blue.id,
    blue.id,
    white.id,
    white.id,
  ]);
  assert.equal(result.events.filter((event) => event.type === "signalMarked").length, 2);
}

{
  const context = createContext([{ color: "blue" }, { color: "white" }]);
  const [blue, white] = context.playerState.players;
  blue.hand = Array.from({ length: 4 }, (_item, index) => ({ id: `blue-opening-${index + 1}` }));
  white.hand = Array.from({ length: 4 }, (_item, index) => ({ id: `white-opening-${index + 1}` }));
  blue.resources.handSize = blue.hand.length;
  white.resources.handSize = white.hand.length;
  blue.initialSelection = {
    industry: { label: "任务中继站" },
    removedInitialCards: [initialCard(2), initialCard(3)],
  };
  white.initialSelection = {
    industry: { label: "宇宙战略集团" },
    removedInitialCards: [initialCard(16), initialCard(18)],
  };

  const result = initialCards.resolveInitialSelections(context, {
    playerIds: [blue.id, white.id],
  });

  assert.equal(result.ok, true);
  assert.equal(blue.hand.length, 8, "任务中继站 2 盲抽 + 两张初始牌各 1 盲抽");
  assert.equal(white.hand.length, 5, "宇宙战略集团的 1 盲抽应只进入白色玩家手牌");
  assert.equal(
    result.results
      .filter((entry) => entry.playerId === blue.id)
      .flatMap((entry) => entry.results || [])
      .filter((entry) => entry.type === "blindDraw")
      .length,
    4,
  );
  assert.equal(
    result.results
      .filter((entry) => entry.playerId === white.id)
      .flatMap((entry) => entry.results || [])
      .filter((entry) => entry.type === "blindDraw")
      .length,
    1,
  );
}

console.log("initial-cards.test.js ok");
