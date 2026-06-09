# SETI Web Board Game State Design

> Version: 0.1  
> Date: 2026-06-09  
> Audience: AI coding agents, rule-engine implementers  
> Source reference: `rules/SETI规则摘要_自动化设计.md`

本文是第一份面向 AI 的状态设计文档，目标不是描述 UI，而是定义系统必须保存哪些状态。后续任何规则校验、行动结算、存档、回放、AI 策略提示，都应以本文定义的状态为唯一可信输入。

## 1. 设计目标

1. 支持 1 到 4 名玩家的本地热座游戏。
2. 支持 5 轮游戏流程、玩家回合、跳过、轮次维持和最终计分。
3. 保存玩家个人状态、公共版图状态、科技状态、卡牌状态、外星生物状态、里程碑状态和事件日志。
4. 避免把 UI 坐标、动画状态、DOM 状态混入规则状态。
5. 尽量保存事实状态，不重复保存可推导状态。
6. 所有随机结果必须落入状态或事件日志，保证存档可复现。

## 2. 总体状态入口

```ts
type PlayerId = "p1" | "p2" | "p3" | "p4";
type PlayerColor = "red" | "blue" | "green" | "yellow";
type RoundNumber = 1 | 2 | 3 | 4 | 5;

interface GameState {
  schemaVersion: 1;
  gameId: string;
  status: GameStatus;

  setup: SetupState;
  flow: FlowState;

  players: Record<PlayerId, PlayerState>;
  playerOrder: PlayerId[];

  publicBoard: PublicBoardState;
  cardState: CardState;
  techBoard: TechBoardState;
  alienState: AlienState;
  milestoneState: MilestoneState;

  pendingChoices: PendingChoice[];
  eventLog: GameEvent[];
}

type GameStatus =
  | "setup"
  | "playing"
  | "pending_choice"
  | "round_maintenance"
  | "finished";
```

### 状态保存原则

- `GameState` 是唯一可信源。
- UI 只能从 `GameState` 渲染，不能自行保存规则事实。
- 每次行动必须产生新的 `GameState` 和若干 `GameEvent`。
- `players` 最少 1 个，最多 4 个；真实玩家数量由 `playerOrder.length` 判断。
- `pendingChoices.length > 0` 时，游戏进入 `pending_choice`，必须先完成选择才能继续普通行动。

## 3. 设置状态

```ts
interface SetupState {
  playerCount: 1 | 2 | 3 | 4;
  seed?: string;
  createdAt: string;

  selectedAlienIds: AlienId[];
  sectorAssignment: SectorAssignment;
  solarRotationInitial: SolarRotationState;
  roundEndCardStacks: RoundEndCardStack[];

  ruleset: RulesetState;
}

interface SectorAssignment {
  slot1: SectorId;
  slot2: SectorId;
  slot3: SectorId;
  slot4: SectorId;
}

interface RulesetState {
  baseGame: true;
  optionalModules: string[];
  manualOverrides: string[];
}
```

说明：

- `seed` 可选，但如果系统使用随机种子生成设置，则必须保存。
- `sectorAssignment` 保存四个扇区在版图上的实际槽位。
- `solarRotationInitial` 保存初始太阳系转盘角度。
- `roundEndCardStacks` 保存每轮跳过时可选择的一轮结束牌。
- `manualOverrides` 用于记录玩家手动修正，例如某张卡暂未结构化，只记录手动效果。

## 4. 流程状态

```ts
interface FlowState {
  round: RoundNumber;
  currentPlayerId: PlayerId;
  startPlayerId: PlayerId;
  firstPassedPlayerIdThisRound?: PlayerId;

  turnPhase: TurnPhase;
  mainActionUsedThisTurn: boolean;
  freeActionWindowOpen: boolean;

  passedPlayerIdsThisRound: PlayerId[];
  roundMaintenanceDone: boolean;
  gameEndTriggered: boolean;
}

type TurnPhase =
  | "before_main_action"
  | "after_main_action"
  | "resolving_action"
  | "end_turn_checks"
  | "passed"
  | "maintenance"
  | "game_end";
```

必须保存：

- 当前轮次。
- 当前行动玩家。
- 起始玩家。
- 本轮第一位跳过玩家，因为它会触发太阳系公转。
- 本回合是否已执行主要行动。
- 本轮哪些玩家已跳过。

不建议保存：

- “下一个玩家是谁”这种可由 `playerOrder`、`currentPlayerId` 和 `passedPlayerIdsThisRound` 推导的数据。

## 5. 玩家状态

```ts
interface PlayerState {
  id: PlayerId;
  name: string;
  color: PlayerColor;

  resources: PlayerResources;
  scoreState: PlayerScoreState;
  hand: CardInstanceId[];

  dataState: PlayerDataState;
  modelState: PlayerModelState;
  techState: PlayerTechState;
  cardArea: PlayerCardAreaState;
  objectiveState: PlayerObjectiveState;

  flags: PlayerFlags;
}
```

### 5.1 玩家资源

```ts
interface PlayerResources {
  credits: number;
  energy: number;
  publicity: number;
}
```

约束：

- `credits >= 0`
- `energy >= 0`
- `0 <= publicity <= 10`
- 推广超过 10 时不保留，结算时应截断到 10。

### 5.2 玩家分数

```ts
interface PlayerScoreState {
  score: number;
  crossedScoreThresholds: ScoreThreshold[];
  chosenGoldMilestoneIds: MilestoneId[];
}

type ScoreThreshold = 20 | 25 | 30 | 50 | 70;
```

说明：

- `score` 保存当前分数。
- `crossedScoreThresholds` 防止同一分数阈值重复触发。
- 25/50/70 用于金色里程碑。
- 少于 4 人游戏时，20/30 可能触发中立里程碑。

### 5.3 玩家数据池与计算机

```ts
interface PlayerDataState {
  dataPool: DataToken[];
  discardedDataCount: number;
  computer: ComputerState;
}

interface DataToken {
  id: string;
  color?: DataColor;
  source: DataSource;
}

type DataColor = "red" | "blue" | "green" | "yellow" | "wild" | "unknown";

type DataSource =
  | { type: "sector"; sectorId: SectorId }
  | { type: "card"; cardId: CardDefinitionId }
  | { type: "reward"; rewardId: string }
  | { type: "manual"; note: string };

interface ComputerState {
  rows: ComputerRow[];
  unlockedSlotIds: ComputerSlotId[];
  filledSlots: Record<ComputerSlotId, DataToken>;
  coveredRewardsClaimed: ComputerRewardId[];
}

interface ComputerRow {
  id: string;
  slotIds: ComputerSlotId[];
  requiredForAnalyze: boolean;
}
```

约束：

- `dataPool.length <= 6`。
- 数据池满时再获得数据，应增加 `discardedDataCount` 或写事件说明，不进入 `dataPool`。
- 分析数据通常要求 `requiredForAnalyze = true` 的行已填满。
- 放入计算机的数据必须从 `dataPool` 移出。

### 5.4 玩家模型

```ts
interface PlayerModelState {
  probeLimit: number;
  spaceProbes: ProbeState[];
  satellites: PlanetModelState[];
  landers: PlanetModelState[];
  availableModels: number;
}

interface ProbeState {
  id: string;
  location: SolarLocationId;
  movePointsBanked: number;
  enteredLocationsThisTurn: SolarLocationId[];
}

interface PlanetModelState {
  id: string;
  location: PlanetBoardLocationId;
  planetId: PlanetId;
  kind: "satellite" | "lander";
  placedRound: RoundNumber;
}
```

约束：

- 太空中探测器数量只计算 `spaceProbes`，不计算 `satellites` 和 `landers`。
- 默认 `probeLimit = 1`，科技或卡牌可修改。
- `availableModels` 用于限制玩家供应区模型数量。
- “到达一个星球”要求探测器移动进入该位置，可通过 `enteredLocationsThisTurn` 判断。

### 5.5 玩家科技

```ts
interface PlayerTechState {
  ownedTechTileIds: TechTileId[];
  techByType: Record<TechType, TechTileId[]>;
  activeModifiers: RuleModifier[];
}

type TechType = "probe" | "telescope" | "computer";

interface RuleModifier {
  id: string;
  sourceTechTileId: TechTileId;
  appliesTo: RuleModifierTarget;
  value: unknown;
}

type RuleModifierTarget =
  | "probe_limit"
  | "move_cost"
  | "asteroid_exit_cost"
  | "landing_permission"
  | "scan_signal_count"
  | "scan_sector_override"
  | "computer_slots"
  | "analyze_bonus";
```

说明：

- 玩家拥有的科技板块必须保存。
- 科技带来的规则修正建议提前转成 `activeModifiers`，行动校验时统一读取。
- 科技定义本身放在 `TechBoardState.definitions` 或外部 `tech_tiles.json`。

### 5.6 玩家卡牌区域

```ts
interface PlayerCardAreaState {
  incomeCards: CardInstanceId[];
  playedProjectCards: CardInstanceId[];
  completedMissionCards: CardInstanceId[];
  endGameScoringCards: CardInstanceId[];
  tuckedCards: TuckedCardState[];
}

interface TuckedCardState {
  cardInstanceId: CardInstanceId;
  underCardInstanceId?: CardInstanceId;
  reason: "income" | "mission" | "alien" | "manual";
}
```

说明：

- 手牌只保存 `hand`。
- 收入牌、任务牌、终局计分牌必须分区保存，因为它们的计分和收入触发不同。
- 卡牌一旦作为收入插入，就不能再作为手牌或免费效果使用。

### 5.7 玩家目标与旗标

```ts
interface PlayerObjectiveState {
  lifeSignsOwned: LifeSignRecord[];
  sectorWins: SectorWinRecord[];
  planetAchievements: PlanetAchievementRecord[];
}

interface LifeSignRecord {
  id: string;
  type: LifeSignType;
  alienId?: AlienId;
  sourceEventId: string;
}

type LifeSignType = "scan" | "landing" | "analysis" | "wild";

interface SectorWinRecord {
  sectorId: SectorId;
  color: SectorColor;
  round: RoundNumber;
  sourceEventId: string;
}

interface PlanetAchievementRecord {
  planetId: PlanetId;
  kind: "orbit" | "land";
  round: RoundNumber;
  sourceEventId: string;
}

interface PlayerFlags {
  passedThisRound: boolean;
  cannotActReason?: string;
  manualNotes: string[];
}
```

说明：

- `lifeSignsOwned` 用于任务、里程碑、外星生物和终局计分。
- `sectorWins` 用于金色里程碑和某些任务。
- `planetAchievements` 用于任务、卡牌和外星生物效果。

## 6. 公共版图状态

```ts
interface PublicBoardState {
  solarSystem: SolarSystemState;
  planetBoard: PlanetBoardState;
  sectors: Record<SectorId, SectorState>;
  tokenSupply: TokenSupplyState;
}
```

### 6.1 太阳系版图

```ts
interface SolarSystemState {
  rotation: SolarRotationState;
  locations: Record<SolarLocationId, SolarLocationState>;
  adjacency: Record<SolarLocationId, SolarLocationId[]>;
  earthLocationId: SolarLocationId;
  sunLocationId: SolarLocationId;
}

interface SolarRotationState {
  wheel1Steps: number;
  wheel2Steps: number;
  wheel3Steps: number;
  wheel4Steps: number;
  rotationCount: number;
}

interface SolarLocationState {
  id: SolarLocationId;
  kind: SolarLocationKind;
  ring: number;
  planetId?: PlanetId;
  hasPublicityIcon: boolean;
  occupiedProbeIds: ProbeRef[];
  tags: SolarLocationTag[];
}

type SolarLocationKind =
  | "earth"
  | "planet"
  | "asteroid"
  | "empty_space"
  | "sun";

type SolarLocationTag =
  | "cannot_enter"
  | "extra_exit_cost"
  | "publicity_on_enter"
  | "same_ring";

interface ProbeRef {
  playerId: PlayerId;
  probeId: string;
}
```

必须保存：

- 每层转盘当前步数。
- 每个太阳系位置的类型、相邻关系、当前探测器。
- 地球位置和太阳位置。

可由状态推导：

- 某玩家是否在某个行星位置。
- 某条移动路径是否经过太阳。

### 6.2 行星版图

```ts
interface PlanetBoardState {
  planets: Record<PlanetId, PlanetState>;
  moons: Record<MoonId, MoonState>;
}

interface PlanetState {
  id: PlanetId;
  name: string;
  orbitSlots: OrbitSlotState[];
  landingSlots: LandingSlotState[];
  firstOrbitRewardClaimedBy?: PlayerId;
  firstLandingRewardClaimedBy?: PlayerId;
  rewards: PlanetRewardDefinition[];
}

interface MoonState {
  id: MoonId;
  planetId: PlanetId;
  name: string;
  landingSlot: LandingSlotState;
  requiredPermission?: LandingPermission;
  reward?: PlanetRewardDefinition;
}

interface OrbitSlotState {
  id: PlanetBoardLocationId;
  occupiedBy?: PlanetModelRef;
}

interface LandingSlotState {
  id: PlanetBoardLocationId;
  occupiedBy?: PlanetModelRef;
  grantsLifeSign?: LifeSignType;
}

interface PlanetModelRef {
  playerId: PlayerId;
  modelId: string;
  kind: "satellite" | "lander";
}
```

必须保存：

- 各行星轨道是否有人造卫星。
- 各行星/卫星着陆点是否有着陆器。
- 首位绕行/首位着陆奖励是否已被领取。
- 卫星着陆许可要求。

### 6.3 扇区状态

```ts
interface SectorState {
  id: SectorId;
  color: SectorColor;
  slot: 1 | 2 | 3 | 4;

  dataSlots: SectorDataSlot[];
  overflowMarkers: SectorMarker[];
  winnerMarkers: SectorWinnerMarker[];

  reward: SectorRewardDefinition;
  resetCount: number;
}

type SectorColor = "red" | "blue" | "green" | "yellow";

interface SectorDataSlot {
  index: number;
  dataToken?: DataToken;
  marker?: SectorMarker;
}

interface SectorMarker {
  playerId: PlayerId;
  markerId: string;
  placedAt: string;
  sourceEventId: string;
}

interface SectorWinnerMarker {
  playerId: PlayerId;
  round: RoundNumber;
  sourceEventId: string;
}
```

必须保存：

- 每个扇区颜色和所在槽位。
- 每个数据格中剩余数据或玩家标记。
- 超出数据格的额外标记。
- 赢得扇区后放在扇区上方的胜利标记。
- 扇区重置次数。

重要约束：

- `winnerMarkers` 不参与后续扇区胜负判定。
- 完成扇区时，所有参与者获得 1 推广。
- 扇区赢家由标记数量决定，平手由更靠后位置打破。
- 重置后第二名可保留 1 个标记在第一格。

### 6.4 公共标记供应

```ts
interface TokenSupplyState {
  neutralMarkers: number;
  dataTokensRemaining: DataToken[];
  exhaustedDataTokens: DataToken[];
}
```

说明：

- 如果数据 token 是无限抽象资源，可以不精确保存 `dataTokensRemaining`。
- 如果需要完整复盘或按颜色抽取数据，则必须保存数据 token 池。

## 7. 卡牌状态

卡牌要分成“定义”和“实例”。定义是静态数据，实例是本局中某一张实体牌的位置。

```ts
type CardDefinitionId = string;
type CardInstanceId = string;

interface CardState {
  definitions: Record<CardDefinitionId, CardDefinition>;
  instances: Record<CardInstanceId, CardInstanceState>;

  drawDeck: CardInstanceId[];
  discardPile: CardInstanceId[];
  market: CardInstanceId[];
  removedFromGame: CardInstanceId[];
  roundEndCardStacks: RoundEndCardStack[];
}

interface CardInstanceState {
  id: CardInstanceId;
  definitionId: CardDefinitionId;
  location: CardLocation;
  ownerId?: PlayerId;
  face: "face_up" | "face_down";
  exhausted: boolean;
  attachedTo?: CardInstanceId;
}

type CardLocation =
  | { zone: "deck" }
  | { zone: "discard" }
  | { zone: "market"; index: number }
  | { zone: "hand"; playerId: PlayerId }
  | { zone: "income"; playerId: PlayerId }
  | { zone: "played"; playerId: PlayerId }
  | { zone: "mission"; playerId: PlayerId }
  | { zone: "end_scoring"; playerId: PlayerId }
  | { zone: "round_end_offer"; round: RoundNumber; index: number }
  | { zone: "removed" };

interface RoundEndCardStack {
  round: RoundNumber;
  cardInstanceIds: CardInstanceId[];
  selectedByPlayerIds: PlayerId[];
}
```

```ts
interface CardDefinition {
  id: CardDefinitionId;
  name: string;
  type: CardType;

  sectorColor?: SectorColor;
  freeEffect?: EffectDefinition;
  mainCost?: CostDefinition;
  mainEffect?: EffectDefinition;
  incomeReward?: RewardDefinition;
  missionCondition?: PredicateDefinition;
  endGameScoring?: ScoringDefinition;

  tags: string[];
  manualOnly?: boolean;
}

type CardType =
  | "project"
  | "mission"
  | "end_scoring"
  | "income"
  | "round_end";
```

必须保存：

- 每张牌的实例位置。
- 手牌、市场、牌库、弃牌堆、收入区、任务区、终局计分区。
- 轮结束牌堆和已被选择情况。

重要约束：

- 一张牌同一时刻只能位于一个区域。
- 一张牌一次只能选择一种用途。
- 结构化效果未录入的牌，设为 `manualOnly: true`，由事件日志记录手动结算。

## 8. 科技状态

```ts
type TechTileId = string;

interface TechBoardState {
  definitions: Record<TechTileId, TechTileDefinition>;
  stacks: Record<TechType, TechStackState>;
  firstBonusByStack: Record<TechType, TechFirstBonusState>;
}

interface TechStackState {
  type: TechType;
  tileIds: TechTileId[];
  acquiredTileIds: TechTileId[];
}

interface TechFirstBonusState {
  available: boolean;
  claimedBy?: PlayerId;
  scoreValue: number;
}

interface TechTileDefinition {
  id: TechTileId;
  type: TechType;
  name: string;
  oneTimeReward?: RewardDefinition;
  modifiers: RuleModifierDefinition[];
  prerequisites?: PredicateDefinition[];
}

interface RuleModifierDefinition {
  id: string;
  appliesTo: RuleModifierTarget;
  operation: "add" | "subtract" | "set" | "allow" | "replace";
  value: unknown;
}
```

必须保存：

- 每个科技堆剩余哪些科技。
- 哪些科技已被玩家拿走。
- 每个科技堆的首位 2 分奖励是否可用、被谁领取。
- 玩家拥有科技保存在 `PlayerTechState.ownedTechTileIds`。

研究科技行动还必须写事件：

1. 研究前太阳系公转。
2. 支付 6 推广。
3. 获得科技板块。
4. 获得一次性奖励。
5. 如适用，获得首位科技奖励。

## 9. 外星生物状态

```ts
type AlienId = string;

interface AlienState {
  selectedAlienIds: AlienId[];
  aliens: Record<AlienId, AlienBoardState>;
}

interface AlienBoardState {
  id: AlienId;
  face: "face_down" | "face_up";
  discovered: boolean;

  discoveryTrack: AlienDiscoverySlot[];
  moduleState: Record<string, unknown>;

  redundantLifeSigns: LifeSignRecord[];
  endGameScoringEnabled: boolean;
}

interface AlienDiscoverySlot {
  id: string;
  requiredType: LifeSignType | "any";
  occupiedBy?: LifeSignPlacement;
}

interface LifeSignPlacement {
  playerId: PlayerId;
  type: LifeSignType;
  source: LifeSignSource;
  sourceEventId: string;
}

type LifeSignSource =
  | { type: "sector_reward"; sectorId: SectorId }
  | { type: "landing"; planetId: PlanetId; moonId?: MoonId }
  | { type: "analyze_data" }
  | { type: "card"; cardInstanceId: CardInstanceId }
  | { type: "milestone"; milestoneId: MilestoneId }
  | { type: "manual"; note: string };
```

必须保存：

- 本局抽到哪 2 个外星生物。
- 每个外星生物是否已翻开、是否已发现。
- 发现轨上的生命迹象占用情况。
- 外星生物自己的特殊状态 `moduleState`。
- 冗余生命迹象，因为某些计分或效果可能需要知道玩家拥有过哪些迹象。

设计原则：

- 主引擎只知道通用发现流程。
- 外星生物特殊规则放在插件里。
- 插件只能通过事件修改 `moduleState` 或产生标准奖励事件。

## 10. 里程碑状态

```ts
type MilestoneId = string;

interface MilestoneState {
  goldMilestones: Record<MilestoneId, GoldMilestoneState>;
  neutralMilestones: Record<MilestoneId, NeutralMilestoneState>;
}

interface GoldMilestoneState {
  id: MilestoneId;
  scoreThreshold: 25 | 50 | 70;
  claimedByPlayerIds: PlayerId[];
  scoringRule: ScoringDefinition;
}

interface NeutralMilestoneState {
  id: MilestoneId;
  scoreThreshold: 20 | 30;
  enabled: boolean;
  triggeredByPlayerIds: PlayerId[];
  effect: EffectDefinition;
}
```

必须保存：

- 金色里程碑每位玩家是否选择过。
- 少于 4 人时，中立里程碑是否启用。
- 中立里程碑被哪些玩家触发过。
- 里程碑的计分规则或效果定义。

## 11. 待选择状态

```ts
interface PendingChoice {
  id: string;
  playerId: PlayerId;
  type: PendingChoiceType;
  sourceEventId: string;
  options: ChoiceOption[];
  required: boolean;
  createdAt: string;
}

type PendingChoiceType =
  | "choose_gold_milestone"
  | "choose_end_round_card"
  | "choose_cards_to_discard"
  | "choose_tech_tile"
  | "choose_life_sign_target"
  | "choose_reward_option"
  | "choose_sector"
  | "choose_planet_or_moon"
  | "manual_resolution";

interface ChoiceOption {
  id: string;
  label: string;
  payload: unknown;
  disabled?: boolean;
  disabledReason?: string;
}
```

必须保存原因：

- 很多规则结算中途需要玩家决策，不能由系统猜。
- 存档如果停在选择中，也必须能恢复。
- AI 可以根据 `PendingChoice` 推断下一步需要用户提供什么。

约束：

- 有必选 `PendingChoice` 时，不能执行普通行动。
- 完成选择时应产生 `choice_resolved` 事件。

## 12. 事件日志

```ts
interface GameEvent {
  id: string;
  type: GameEventType;
  round: RoundNumber;
  playerId?: PlayerId;
  timestamp: string;
  actionId?: string;
  payload: unknown;
  message: string;
}

type GameEventType =
  | "game_setup"
  | "turn_started"
  | "action_declared"
  | "validation_failed"
  | "resource_paid"
  | "resource_gained"
  | "score_changed"
  | "probe_launched"
  | "probe_moved"
  | "probe_orbited"
  | "probe_landed"
  | "solar_rotated"
  | "signal_marked"
  | "sector_completed"
  | "sector_resolved"
  | "sector_reset"
  | "data_gained"
  | "data_placed_to_computer"
  | "data_analyzed"
  | "life_sign_placed"
  | "alien_discovered"
  | "card_drawn"
  | "card_discarded"
  | "card_played"
  | "income_card_inserted"
  | "tech_researched"
  | "milestone_triggered"
  | "choice_created"
  | "choice_resolved"
  | "player_passed"
  | "round_ended"
  | "game_finished"
  | "manual_adjustment";
```

事件日志用途：

- 给玩家解释自动结算。
- 支持撤销、复盘、导出战报。
- 给 AI 策略分析提供上下文。
- 调试规则错误。

建议：

- 事件日志不应替代当前状态。
- 当前状态是查询源，事件日志是历史源。
- 每条事件都应有中文 `message`。

## 13. 行动命令状态

行动命令不是长期状态，但应在事件日志里保存其快照。

```ts
interface GameAction {
  id: string;
  playerId: PlayerId;
  type: MainActionType | FreeActionType | ChoiceActionType;
  payload: unknown;
  declaredAt: string;
}

type MainActionType =
  | "launch_probe"
  | "orbit_planet"
  | "land_on_planet_or_moon"
  | "scan_nearby_star"
  | "analyze_data"
  | "play_card"
  | "research_tech"
  | "pass_round";

type FreeActionType =
  | "move_probe"
  | "place_data_to_computer"
  | "discard_card_for_free_effect"
  | "insert_income_card"
  | "complete_mission"
  | "manual_adjustment";

type ChoiceActionType = "resolve_pending_choice";
```

## 14. 不应保存的派生状态

以下信息可以通过 `GameState` 推导，不应重复保存，除非性能瓶颈明确出现：

- 当前玩家是否有足够资源执行某行动。
- 某玩家是否已经赢过某颜色扇区。
- 某玩家是否拥有某类生命迹象。
- 某扇区当前领先玩家。
- 某玩家终局预计得分。
- 下一个可行动玩家。
- 某科技是否可研究。
- 某个按钮是否可点击。

这些应由 selector 或 validator 计算：

```ts
function canApply(action: GameAction, state: GameState): ValidationResult;
function selectCurrentPlayer(state: GameState): PlayerState;
function selectAvailableMainActions(state: GameState, playerId: PlayerId): ActionOption[];
function selectSectorLeader(state: GameState, sectorId: SectorId): PlayerId | null;
function selectFinalScorePreview(state: GameState, playerId: PlayerId): ScoreBreakdown;
```

## 15. 最小存档 JSON 骨架

```json
{
  "schemaVersion": 1,
  "gameId": "seti-local-20260609-001",
  "status": "playing",
  "setup": {
    "playerCount": 2,
    "seed": "demo",
    "createdAt": "2026-06-09T12:00:00.000Z",
    "selectedAlienIds": ["alien_a", "alien_b"],
    "sectorAssignment": {
      "slot1": "sector_red",
      "slot2": "sector_blue",
      "slot3": "sector_green",
      "slot4": "sector_yellow"
    },
    "solarRotationInitial": {
      "wheel1Steps": 0,
      "wheel2Steps": 0,
      "wheel3Steps": 0,
      "wheel4Steps": 0,
      "rotationCount": 0
    },
    "roundEndCardStacks": [],
    "ruleset": {
      "baseGame": true,
      "optionalModules": [],
      "manualOverrides": []
    }
  },
  "flow": {
    "round": 1,
    "currentPlayerId": "p1",
    "startPlayerId": "p1",
    "turnPhase": "before_main_action",
    "mainActionUsedThisTurn": false,
    "freeActionWindowOpen": true,
    "passedPlayerIdsThisRound": [],
    "roundMaintenanceDone": false,
    "gameEndTriggered": false
  },
  "playerOrder": ["p1", "p2"],
  "players": {},
  "publicBoard": {},
  "cardState": {},
  "techBoard": {},
  "alienState": {},
  "milestoneState": {},
  "pendingChoices": [],
  "eventLog": []
}
```

## 16. AI 实现提示

AI 生成代码时应遵守：

1. 先实现状态类型和空局初始化。
2. 再实现 validator，不要先写 UI。
3. 每个 reducer 只处理一个行动或一个事件。
4. 卡牌、科技、外星生物效果必须数据化或插件化。
5. 所有自动结算都必须写入 `eventLog`。
6. 所有需要玩家判断的规则都必须生成 `PendingChoice`。
7. 不要把 CSS 坐标、图片偏移、DOM id 保存进 `GameState`。
8. 不要直接修改旧状态对象，使用不可变更新或明确的状态补丁。

## 17. 第一阶段必须完成的状态范围

MVP 可以先只实现这些状态：

- `GameState.schemaVersion`
- `GameState.status`
- `SetupState`
- `FlowState`
- `PlayerState.resources`
- `PlayerState.scoreState`
- `PlayerState.hand`
- `PlayerState.dataState`
- `PlayerState.modelState`
- `PlayerState.techState`
- `PublicBoardState.solarSystem`
- `PublicBoardState.sectors`
- `PlanetBoardState`
- `TechBoardState`
- `AlienState`
- `MilestoneState`
- `PendingChoice`
- `GameEvent`

暂缓实现：

- 完整卡牌 DSL。
- 所有外星生物特殊 `moduleState`。
- 复杂终局计分预览。
- 联机同步状态。
- AI 自动玩家状态。
