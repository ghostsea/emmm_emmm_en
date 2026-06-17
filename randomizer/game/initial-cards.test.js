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

  const incomeResult = initialCards.resolveInitialCardEffect(context, player, initialCard(9));

  assert.equal(incomeResult.ok, true);
  assert.equal(player.income.handSize, 1);
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
  white.initialSelection = { removedInitialCards: [initialCard(18)] };

  const result = initialCards.resolveInitialSelections(context, {
    playerIds: [blue.id, white.id],
  });

  assert.equal(result.ok, true);
  assert.equal(blue.resources.score, 3);
  assert.equal(blue.resources.publicity, 3);
  assert.equal(data.listPoolTokens(white).length, 2);
  assert.equal(result.results.length, 2);
  assert.equal(result.events.filter((event) => event.type === "signalMarked").length, 2);
}

console.log("initial-cards.test.js ok");
