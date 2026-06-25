import { create } from 'zustand'
import { BLOCKS, WORLD_WIDTH } from '../lib/constants'
import { ISO_TILES, ISO_OBJECTS } from '../lib/IsoConstants'
import { applyStarterFarmstead, createIsoObject, createTownPlazaWorld, ensureFarmPortal, getIsoTile, placeIsoObject, setIsoTile, type IsoTile, type IsoObject } from '../lib/IsoWorld'
import { api } from '../lib/api'
import { FARM_CROPS, FARMER_PROFESSIONS, type CropType } from '../lib/farmCatalog'
import { supabaseData, type TownPlayer } from '../lib/supabase'

const TOWN_WORLD = createTownPlazaWorld()
const DEMO_COIN_BALANCE = 200

export type TxEntry = {
  id: string
  action: string
  sig: string
  fee: number
  timestamp: number
  blockName?: string
  coords?: { x: number; y: number }
  status: 'pending' | 'confirmed' | 'failed'
}

export type TxDraft = Omit<TxEntry, 'id' | 'timestamp'> & Partial<Pick<TxEntry, 'id' | 'timestamp'>>

export type InventoryItem = {
  blockId: number
  count: number
}

export type PlayerState = {
  x: number
  y: number
  tileX: number
  tileY: number
  facing: 'north' | 'south' | 'east' | 'west'
  velX: number
  velY: number
  onGround: boolean
  health: number
  maxHealth: number
  characterId: CharacterId
}

export type CharacterId = 'farmer-sage' | 'farmer-sun' | 'farmer-rose' | 'farmer-river'

export type ChatMessage = {
  id: string
  author: string
  text: string
  timestamp: number
  system?: boolean
}

export type Resources = {
  wood: number
  stone: number
  crops: number
  coins: number
  farmPoints: number
  harvestTickets: number
  animalFeed: number
  fruits: number
  vegetables: number
  butter: number
  eggs: number
  milk: number
}

export type AnimalKind = 'chicken' | 'cow'

export type FarmAnimal = {
  id: string
  kind: AnimalKind
  x: number
  y: number
  fedAt: number | null
  readyAt: number | null
}

export type CropPlot = {
  x: number
  y: number
  cropType: CropType
  plantedAt: number
  readyAt: number
  harvested: boolean
  watered: boolean
  fertilized: boolean
  mutation?: 'golden' | 'giant'
}

export type Farmhouse = {
  owned: boolean
  minted: boolean
  x: number | null
  y: number | null
  name: string
  level: number
  rarity: 'starter' | 'cozy' | 'rare' | 'epic' | 'legendary'
  gardenScore: number
  rooms: string[]
  trophies: string[]
  guestbook: GuestbookEntry[]
}

export type ToolLevels = {
  axe: number
  pickaxe: number
  shovel: number
  wateringCan: number
}

export type CropMastery = Record<CropPlot['cropType'], number>

export type CraftedItem = {
  id: string
  name: string
  kind: 'fence' | 'path' | 'furniture' | 'stall' | 'machine' | 'decoration'
  craftedAt: number
}

export type GuestbookEntry = {
  id: string
  author: string
  message: string
  timestamp: number
}

export type ActiveEvent = {
  id: string
  name: string
  detail: string
  progress: number
  goal: number
  rewardTickets: number
  endsDay: number
}

export type VisitFarm = {
  id: string
  owner: string
  name: string
  level: number
  resources: Resources
  likes: number
}

export type FarmhouseStyle = {
  id: string
  name: string
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'mythic'
  tagline: string
  footprint: string
  coinPrice: number
  solPrice: number
  owned: boolean
  listed: boolean
  palette: {
    wall: string
    roof: string
    trim: string
  }
}

export type FarmCosmeticKind = 'skin' | 'painting' | 'texture' | 'furniture'

export type FarmSaveData = {
  version: 1
  savedAt: number
  seed: number
  farmCreated: boolean
  farmName: string
  isoWorld: IsoTile[][] | null
  player: PlayerState
  resources: Resources
  cropPlots: Record<string, CropPlot>
  animals?: Record<string, FarmAnimal>
  farmhouse: Farmhouse
  farmhouseStyles?: FarmhouseStyle[]
  activeFarmhouseStyleId?: string
  claimedDailyQuests?: string[]
  purchasedCosmetics?: string[]
  craftedItems?: CraftedItem[]
  toolLevels?: ToolLevels
  cropMastery?: CropMastery
  achievements?: string[]
  weeklyQuests?: string[]
  seasonPassXp?: number
  farmLikes?: number
  tipsReceived?: number
  activeEvent?: ActiveEvent
  farmLevel: number
  farmXp: number
  day: number
  minuteOfDay: number
  chainBlockCount: number
  nftCount: number
  mintedItems: MintedItem[]
  totalFeesSpent: number
  blocksPlaced: number
  blocksMined: number
}

export type MintedItem = {
  id: string
  kind: 'tile' | 'farmhouse' | 'building'
  name: string
  x?: number
  y?: number
  sig: string
  mintedAt: number
}

export type GameMode = 'play' | 'place' | 'mine' | 'terrain' | 'build' | 'demolish' | 'inspect'
export type ToolMode = 'hand' | 'pickaxe' | 'shovel' | 'axe'
export type BuildMode = 'terrain' | 'object' | 'demolish' | 'inspect'
export type IsoObjectKey = keyof typeof ISO_OBJECTS

export type MintTarget = {
  x: number
  y: number
  blockId: number
}

export type GameStore = {
  // World
  world: Uint8Array | null
  isoWorld: IsoTile[][] | null
  townWorld: IsoTile[][]
  seed: number
  worldLoaded: boolean

  // Player
  player: PlayerState
  selectedHotbarSlot: number
  hotbar: (InventoryItem | null)[]
  inventory: InventoryItem[]
  resources: Resources
  cropPlots: Record<string, CropPlot>
  animals: Record<string, FarmAnimal>
  farmhouse: Farmhouse
  farmhouseStyles: FarmhouseStyle[]
  activeFarmhouseStyleId: string
  claimedDailyQuests: string[]
  purchasedCosmetics: string[]
  craftedItems: CraftedItem[]
  toolLevels: ToolLevels
  cropMastery: CropMastery
  achievements: string[]
  weeklyQuests: string[]
  seasonPassXp: number
  farmLikes: number
  tipsReceived: number
  activeEvent: ActiveEvent
  farmLevel: number
  farmXp: number
  mintedItems: MintedItem[]
  activeFarmId: string
  visitableFarms: VisitFarm[]
  farmCreated: boolean
  farmName: string
  lastSavedAt: number | null
  saveError: string | null

  // UI State
  gameMode: GameMode
  buildMode: BuildMode
  selectedTileType: number
  selectedObjectType: string | null
  hoveredTile: { x: number; y: number } | null
  selectedTile: { x: number; y: number } | null
  camX: number
  camY: number
  camZoom: number
  waterAnimTick: number
  toolMode: ToolMode
  isPaused: boolean
  showInventory: boolean
  showTxLog: boolean
  showMinimap: boolean
  showChat: boolean
  showProfile: boolean
  showVisitPanel: boolean
  showMarketplace: boolean
  showSocialHub: boolean
  mintTarget: MintTarget | null
  selectedActionLabel: string | null
  day: number
  minuteOfDay: number

  // Wallet / Chain
  solBalance: number
  slotHeight: number
  txLog: TxEntry[]
  chatLog: ChatMessage[]
  remotePlayers: TownPlayer[]
  multiplayerStatus: 'connecting' | 'online' | 'offline'
  pendingTx: boolean
  chainBlockCount: number
  nftCount: number
  totalFeesSpent: number

  // Mining state
  miningProgress: number
  miningTarget: { x: number; y: number } | null

  // Stats
  blocksPlaced: number
  blocksMined: number

  // Actions
  setWorld: (world: Uint8Array, seed: number) => void
  setIsoWorld: (world: IsoTile[][], seed?: number) => void
  setBlock: (x: number, y: number, blockId: number) => void
  setTile: (x: number, y: number, tileId: number) => void
  placeObject: (x: number, y: number, object: IsoObject | null) => void
  addResources: (patch: Partial<Resources>) => void
  spendResources: (cost: Partial<Resources>) => boolean
  plantCrop: (x: number, y: number, cropType: CropPlot['cropType']) => boolean
  waterCrop: (x: number, y: number) => boolean
  fertilizeCrop: (x: number, y: number) => boolean
  harvestCrop: (x: number, y: number) => boolean
  registerAnimal: (x: number, y: number, kind: AnimalKind) => void
  removeAnimal: (x: number, y: number) => void
  buyAnimalFeed: (quantity?: number) => boolean
  feedAnimal: (x: number, y: number) => boolean
  collectAnimalProduct: (x: number, y: number) => boolean
  buyTownProduce: (kind: 'fruits' | 'vegetables', quantity?: number) => boolean
  sellTownProduce: (kind: 'fruits' | 'vegetables', quantity?: number) => boolean
  buyButter: (quantity?: number) => boolean
  sellMilk: (quantity?: number) => boolean
  sellEggs: (quantity?: number) => boolean
  craftItem: (recipeId: string) => boolean
  upgradeFarmhouse: () => boolean
  upgradeTool: (tool: keyof ToolLevels) => boolean
  claimWeeklyReward: (questId: string, tickets: number, xp?: number) => boolean
  claimEventReward: () => boolean
  likeFarm: (farmId: string) => boolean
  leaveGuestbook: (author: string, message: string) => boolean
  buildFarmhouseNearPlayer: () => boolean
  polishStarterFarmstead: () => boolean
  claimFarmhouse: (x: number, y: number, minted?: boolean) => void
  mintFarmhouse: () => void
  addMintedItem: (item: Omit<MintedItem, 'id' | 'mintedAt'>) => void
  travelTown: () => void
  visitFarm: (farmId: string) => void
  returnHomeFarm: () => void
  createFarm: (name: string) => void
  setCharacter: (characterId: CharacterId) => void
  renameFarm: (name: string) => void
  saveFarmNow: () => boolean
  loadFarmSave: () => boolean
  exportFarmSave: () => string
  importFarmSave: (raw: string) => boolean
  clearFarmSave: () => void
  buyFarmhouseStyle: (styleId: string) => boolean
  setActiveFarmhouseStyle: (styleId: string) => void
  listFarmhouseStyle: (styleId: string) => void
  claimDailyQuest: (questId: string, reward: Partial<Resources>, xp?: number) => boolean
  buyMarketCosmetic: (id: string, name: string, price: number, kind: FarmCosmeticKind, asNft?: boolean) => boolean
  toggleMarketplace: () => void
  toggleSocialHub: () => void
  toggleProfile: () => void
  toggleVisitPanel: () => void
  setHoveredTile: (tile: { x: number; y: number } | null) => void
  setSelectedTile: (tile: { x: number; y: number } | null) => void
  setCam: (x: number, y: number, zoom: number) => void
  tickWater: () => void
  tickTime: (minutes?: number) => void
  setBuildMode: (m: BuildMode) => void
  setSelectedObjectType: (key: string | null) => void
  movePlayerTo: (x: number, y: number, facing?: PlayerState['facing']) => void
  setSelectedActionLabel: (label: string | null) => void
  toggleChat: () => void
  addChat: (author: string, text: string, system?: boolean) => void
  receiveRemoteChat: (message: { id: string; author: string; text: string; timestamp: number }) => void
  replaceRemoteChat: (messages: Array<{ id: string; author: string; body: string; created_at: string }>) => void
  setRemotePlayers: (players: TownPlayer[]) => void
  setMultiplayerStatus: (status: GameStore['multiplayerStatus']) => void
  updatePlayer: (partial: Partial<PlayerState>) => void
  selectHotbarSlot: (slot: number) => void
  addToInventory: (blockId: number, count?: number) => void
  removeFromInventory: (blockId: number, count?: number) => boolean
  setHotbarBlock: (slot: number, blockId: number | null) => void
  addTx: (entry: TxDraft) => void
  updateTxStatus: (sig: string, status: TxEntry['status']) => void
  setSolBalance: (bal: number) => void
  tickSlot: () => void
  setPendingTx: (v: boolean) => void
  setMiningProgress: (v: number, target: { x: number; y: number } | null) => void
  toggleInventory: () => void
  toggleTxLog: () => void
  toggleMinimap: () => void
  setGameMode: (m: GameMode) => void
  setToolMode: (m: ToolMode) => void
  togglePause: () => void
  setMintTarget: (target: MintTarget | null) => void
  incrementPlaced: () => void
  incrementMined: () => void
  incrementNft: () => void
}

const defaultHotbar: (InventoryItem | null)[] = [
  { blockId: 1, count: 64 },  // grass
  { blockId: 2, count: 64 },  // dirt
  { blockId: 3, count: 64 },  // stone
  { blockId: 5, count: 64 },  // wood
  { blockId: 4, count: 64 },  // sand
  { blockId: 6, count: 32 },  // leaves
  { blockId: 9, count: 16 },  // coal
  { blockId: 14, count: 8 },  // glowstone
  null,
]

const FARM_SAVE_KEY = 'solfarm.localFarm.emptyFarm.v1'
const FARM_RESET_MARKER_KEY = 'solfarm.reset.emptyFarm.v1'
const LEGACY_FARM_SAVE_KEYS = [
  'solfarm.localFarm.v1',
  'solfarm.localFarm.v2',
  'solfarm.localFarm.v3',
]

export function resetLegacyFarmStorageOnce() {
  if (!canUseStorage()) return false
  if (window.localStorage.getItem(FARM_RESET_MARKER_KEY) === 'done') return false
  for (const key of [...LEGACY_FARM_SAVE_KEYS, FARM_SAVE_KEY]) {
    window.localStorage.removeItem(key)
  }
  window.localStorage.setItem(FARM_RESET_MARKER_KEY, 'done')
  return true
}

const defaultToolLevels: ToolLevels = {
  axe: 1,
  pickaxe: 1,
  shovel: 1,
  wateringCan: 1,
}

const defaultCropMastery: CropMastery = {
  wheat: 0,
  corn: 0,
  strawberry: 0,
  pumpkin: 0,
  carrot: 0,
  tomato: 0,
  sunflower: 0,
}

const defaultActiveEvent: ActiveEvent = {
  id: 'harvest-festival-alpha',
  name: 'Harvest Festival',
  detail: 'Harvest crops, craft decorations, and earn limited Harvest Tickets.',
  progress: 0,
  goal: 12,
  rewardTickets: 3,
  endsDay: 7,
}

const defaultFarmhouseStyles: FarmhouseStyle[] = [
  {
    id: 'starter-cottage',
    name: 'Starter Cottage',
    rarity: 'common',
    tagline: 'A warm 2x2 homestead for the first claim.',
    footprint: '2x2',
    coinPrice: 0,
    solPrice: 0.015,
    owned: true,
    listed: false,
    palette: { wall: '#f5e8c8', roof: '#cc4444', trim: '#9ce55a' },
  },
  {
    id: 'orchard-house',
    name: 'Orchard House',
    rarity: 'uncommon',
    tagline: 'Flower boxes, apple crates, and cozy harvest bonuses.',
    footprint: '2x2',
    coinPrice: 180,
    solPrice: 0.045,
    owned: false,
    listed: true,
    palette: { wall: '#ffe6b8', roof: '#d85f4a', trim: '#78c850' },
  },
  {
    id: 'millkeeper-lodge',
    name: 'Millkeeper Lodge',
    rarity: 'rare',
    tagline: 'A farmhouse built for grain, milling, and bigger crop runs.',
    footprint: '2x3',
    coinPrice: 520,
    solPrice: 0.09,
    owned: false,
    listed: true,
    palette: { wall: '#f4eddc', roof: '#8b5a2b', trim: '#f0c040' },
  },
  {
    id: 'glasshouse-villa',
    name: 'Glasshouse Villa',
    rarity: 'epic',
    tagline: 'Greenhouse windows, rare crop aura, premium visitor flex.',
    footprint: '3x3',
    coinPrice: 1400,
    solPrice: 0.18,
    owned: false,
    listed: true,
    palette: { wall: '#dff7ef', roof: '#3acddd', trim: '#ffffff' },
  },
  {
    id: 'founder-estate',
    name: 'Founder Estate',
    rarity: 'mythic',
    tagline: 'Gold-name landmark home for future on-chain founders.',
    footprint: '3x3',
    coinPrice: 3200,
    solPrice: 0.42,
    owned: false,
    listed: true,
    palette: { wall: '#fff0c2', roof: '#f0c040', trim: '#9945ff' },
  },
]

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function makeFarmSave(s: GameStore): FarmSaveData {
  return {
    version: 1,
    savedAt: Date.now(),
    seed: s.seed,
    farmCreated: s.farmCreated,
    farmName: s.farmName,
    isoWorld: s.isoWorld,
    player: s.player,
    resources: s.resources,
    cropPlots: s.cropPlots,
    animals: s.animals,
    farmhouse: s.farmhouse,
    farmhouseStyles: s.farmhouseStyles,
    activeFarmhouseStyleId: s.activeFarmhouseStyleId,
    claimedDailyQuests: s.claimedDailyQuests,
    purchasedCosmetics: s.purchasedCosmetics,
    craftedItems: s.craftedItems,
    toolLevels: s.toolLevels,
    cropMastery: s.cropMastery,
    achievements: s.achievements,
    weeklyQuests: s.weeklyQuests,
    seasonPassXp: s.seasonPassXp,
    farmLikes: s.farmLikes,
    tipsReceived: s.tipsReceived,
    activeEvent: s.activeEvent,
    farmLevel: s.farmLevel,
    farmXp: s.farmXp,
    day: s.day,
    minuteOfDay: s.minuteOfDay,
    chainBlockCount: s.chainBlockCount,
    nftCount: s.nftCount,
    mintedItems: s.mintedItems,
    totalFeesSpent: s.totalFeesSpent,
    blocksPlaced: s.blocksPlaced,
    blocksMined: s.blocksMined,
  }
}

function parseFarmSave(raw: string): FarmSaveData | null {
  try {
    const parsed = JSON.parse(raw) as Partial<FarmSaveData>
    if (parsed.version !== 1 || typeof parsed.seed !== 'number') return null
    return parsed as FarmSaveData
  } catch {
    return null
  }
}

function isBuildableTile(tile: IsoTile | undefined) {
  return !!tile
    && !tile.object
    && !tile.occupiedBy
    && tile.base !== ISO_TILES.WATER.id
    && tile.base !== ISO_TILES.DEEPWATER.id
    && tile.base !== ISO_TILES.LAVA.id
}

function canPlaceSavedFootprint(world: IsoTile[][], wx: number, wy: number, objectKey: IsoObjectKey) {
  const fp = ISO_OBJECTS[objectKey].footprint
  const anchor = getIsoTile(world, wx, wy)
  if (!isBuildableTile(anchor)) return false
  for (let y = wy; y < wy + fp.h; y += 1) {
    for (let x = wx; x < wx + fp.w; x += 1) {
      const tile = getIsoTile(world, x, y)
      if (!isBuildableTile(tile)) return false
      if ((tile.height ?? defaultHeightForTile(tile.base)) !== (anchor.height ?? defaultHeightForTile(anchor.base))) return false
    }
  }
  return true
}

function defaultHeightForTile(base: number) {
  return base === ISO_TILES.WATER.id || base === ISO_TILES.DEEPWATER.id || base === ISO_TILES.LAVA.id ? 0 : 1
}

function normalizeIsoObject(object: Partial<IsoObject> | null | undefined): IsoObject | null {
  if (!object) return null
  const key = object.key && object.key in ISO_OBJECTS ? object.key as IsoObjectKey : null
  const def = key ? ISO_OBJECTS[key] : Object.values(ISO_OBJECTS).find((item) => item.type === object.type)
  if (!def) return null
  return {
    type: object.type ?? def.type,
    variant: Number.isFinite(object.variant) ? object.variant as number : def.variant,
    height: Number.isFinite(object.height) ? object.height as number : def.height,
    key: key ?? Object.entries(ISO_OBJECTS).find(([, item]) => item === def)?.[0] ?? 'TREE_OAK',
    footprint: object.footprint ?? def.footprint,
    anchorX: Number.isFinite(object.anchorX) ? object.anchorX as number : -1,
    anchorY: Number.isFinite(object.anchorY) ? object.anchorY as number : -1,
    color: Number.isFinite(object.color) ? object.color as number : def.color,
    accentColor: Number.isFinite(object.accentColor) ? object.accentColor as number : def.accentColor,
    health: Number.isFinite(object.health) ? object.health as number : 100,
  }
}

function normalizeIsoWorld(world: IsoTile[][] | null | undefined): IsoTile[][] | null {
  if (!world) return null
  const normalized = world.map((row, y) => row.map((tile, x) => {
    const base = Number.isFinite(tile?.base) ? tile.base : ISO_TILES.GRASS.id
    const object = normalizeIsoObject(tile?.object)
    return {
      base,
      height: Number.isFinite(tile?.height) ? tile.height : defaultHeightForTile(base),
      object: object ? { ...object, anchorX: object.anchorX >= 0 ? object.anchorX : x, anchorY: object.anchorY >= 0 ? object.anchorY : y } : null,
      occupiedBy: tile?.occupiedBy ?? null,
      owner: tile?.owner ?? null,
      isMinted: !!tile?.isMinted,
    }
  }))
  return ensureFarmPortal(normalized)
}

function normalizeFarmhouseStyles(styles: FarmhouseStyle[] | undefined): FarmhouseStyle[] {
  return defaultFarmhouseStyles.map((style) => {
    const saved = styles?.find((item) => item.id === style.id)
    return saved ? { ...style, ...saved, palette: { ...style.palette, ...saved.palette } } : style
  })
}

function normalizeResources(resources: Partial<Resources> | undefined): Resources {
  return {
    wood: resources?.wood ?? 24,
    stone: resources?.stone ?? 18,
    crops: resources?.crops ?? 6,
    coins: resources?.coins ?? DEMO_COIN_BALANCE,
    farmPoints: resources?.farmPoints ?? 0,
    harvestTickets: resources?.harvestTickets ?? 0,
    animalFeed: resources?.animalFeed ?? 6,
    fruits: resources?.fruits ?? 0,
    vegetables: resources?.vegetables ?? 0,
    butter: resources?.butter ?? 0,
    eggs: resources?.eggs ?? 0,
    milk: resources?.milk ?? 0,
  }
}

function normalizeAnimals(animals: Record<string, Partial<FarmAnimal>> | undefined): Record<string, FarmAnimal> {
  const out: Record<string, FarmAnimal> = {}
  for (const [key, animal] of Object.entries(animals ?? {})) {
    if (typeof animal.x !== 'number' || typeof animal.y !== 'number') continue
    if (animal.kind !== 'chicken' && animal.kind !== 'cow') continue
    out[key] = {
      id: animal.id ?? `${animal.kind}-${animal.x}-${animal.y}`,
      kind: animal.kind,
      x: animal.x,
      y: animal.y,
      fedAt: typeof animal.fedAt === 'number' ? animal.fedAt : null,
      readyAt: typeof animal.readyAt === 'number' ? animal.readyAt : null,
    }
  }
  return out
}

function normalizeFarmhouse(farmhouse: Partial<Farmhouse> | undefined): Farmhouse {
  return {
    owned: !!farmhouse?.owned,
    minted: !!farmhouse?.minted,
    x: typeof farmhouse?.x === 'number' ? farmhouse.x : null,
    y: typeof farmhouse?.y === 'number' ? farmhouse.y : null,
    name: farmhouse?.name ?? 'My Sol Farm',
    level: farmhouse?.level ?? 1,
    rarity: farmhouse?.rarity ?? 'starter',
    gardenScore: farmhouse?.gardenScore ?? 0,
    rooms: farmhouse?.rooms ?? ['main room'],
    trophies: farmhouse?.trophies ?? [],
    guestbook: farmhouse?.guestbook ?? [],
  }
}

function normalizeCropPlots(plots: Record<string, Partial<CropPlot>> | undefined): Record<string, CropPlot> {
  const out: Record<string, CropPlot> = {}
  for (const [key, plot] of Object.entries(plots ?? {})) {
    if (typeof plot.x !== 'number' || typeof plot.y !== 'number') continue
    out[key] = {
      x: plot.x,
      y: plot.y,
      cropType: plot.cropType ?? 'wheat',
      plantedAt: plot.plantedAt ?? 0,
      readyAt: plot.readyAt ?? 0,
      harvested: !!plot.harvested,
      watered: !!plot.watered,
      fertilized: !!plot.fertilized,
      mutation: plot.mutation,
    }
  }
  return out
}

export const useGameStore = create<GameStore>((set, get) => ({
  world: null,
  isoWorld: null,
  townWorld: TOWN_WORLD,
  seed: Math.floor(Math.random() * 999999),
  worldLoaded: false,

  player: {
    x: 16, y: 16,
    tileX: 16, tileY: 16,
    facing: 'south',
    velX: 0, velY: 0,
    onGround: false,
    health: 20, maxHealth: 20,
    characterId: 'farmer-sage',
  },

  selectedHotbarSlot: 0,
  hotbar: defaultHotbar,
  inventory: [],
  resources: {
    wood: 24,
    stone: 18,
    crops: 6,
    coins: DEMO_COIN_BALANCE,
    farmPoints: 0,
    harvestTickets: 0,
    animalFeed: 6,
    fruits: 0,
    vegetables: 0,
    butter: 0,
    eggs: 0,
    milk: 0,
  },
  cropPlots: {},
  animals: {},
  farmhouse: {
    owned: false,
    minted: false,
    x: null,
    y: null,
    name: 'My Sol Farm',
    level: 1,
    rarity: 'starter',
    gardenScore: 0,
    rooms: ['main room'],
    trophies: [],
    guestbook: [],
  },
  farmhouseStyles: defaultFarmhouseStyles,
  activeFarmhouseStyleId: 'starter-cottage',
  claimedDailyQuests: [],
  purchasedCosmetics: [],
  craftedItems: [],
  toolLevels: defaultToolLevels,
  cropMastery: defaultCropMastery,
  achievements: [],
  weeklyQuests: [],
  seasonPassXp: 0,
  farmLikes: 0,
  tipsReceived: 0,
  activeEvent: defaultActiveEvent,
  farmLevel: 1,
  farmXp: 0,
  mintedItems: [],
  activeFarmId: 'home',
  visitableFarms: [
    { id: 'sunny', owner: '7SxQ...farm', name: 'Sunny Acres', level: 4, resources: { wood: 88, stone: 41, crops: 122, coins: 940, farmPoints: 28, harvestTickets: 2, animalFeed: 12, fruits: 18, vegetables: 24, butter: 2, eggs: 8, milk: 3 }, likes: 37 },
    { id: 'pixel', owner: '9Lm2...farm', name: 'Pixel Grove', level: 7, resources: { wood: 205, stone: 160, crops: 310, coins: 2600, farmPoints: 72, harvestTickets: 6, animalFeed: 28, fruits: 44, vegetables: 51, butter: 6, eggs: 24, milk: 16 }, likes: 112 },
    { id: 'moon', owner: '3AkP...farm', name: 'Moonlit Ranch', level: 3, resources: { wood: 40, stone: 95, crops: 44, coins: 530, farmPoints: 18, harvestTickets: 1, animalFeed: 7, fruits: 8, vegetables: 12, butter: 1, eggs: 4, milk: 5 }, likes: 21 },
  ],
  farmCreated: false,
  farmName: 'My Sol Farm',
  lastSavedAt: null,
  saveError: null,

  gameMode: 'inspect',
  buildMode: 'inspect',
  selectedTileType: ISO_TILES.GRASS.id,
  selectedObjectType: 'HOUSE',
  hoveredTile: null,
  selectedTile: null,
  camX: 0,
  camY: 0,
  camZoom: 1,
  waterAnimTick: 0,
  toolMode: 'pickaxe',
  isPaused: false,
  showInventory: false,
  showTxLog: true,
  showMinimap: true,
  showChat: false,
  showProfile: true,
  showVisitPanel: false,
  showMarketplace: false,
  showSocialHub: false,
  mintTarget: null,
  selectedActionLabel: null,
  day: 1,
  minuteOfDay: 8 * 60,

  solBalance: 2.5,
  slotHeight: 329441821,
  txLog: [],
  chatLog: [
    {
      id: 'welcome',
      author: 'system',
      text: 'Welcome to SolFarm global chat.',
      timestamp: Date.now(),
      system: true,
    },
  ],
  remotePlayers: [],
  multiplayerStatus: 'connecting',
  pendingTx: false,
  chainBlockCount: 0,
  nftCount: 0,
  totalFeesSpent: 0,

  miningProgress: 0,
  miningTarget: null,

  blocksPlaced: 0,
  blocksMined: 0,

  setWorld: (world, seed) => set({ world, seed, worldLoaded: true }),

  setIsoWorld: (isoWorld, seed) => set((s) => ({
    isoWorld: ensureFarmPortal(isoWorld),
    seed: seed ?? s.seed,
    worldLoaded: true,
  })),

  setBlock: (x, y, blockId) => {
    const { world } = get()
    if (!world) return
    const newWorld = new Uint8Array(world)
    newWorld[y * WORLD_WIDTH + x] = blockId
    set({ world: newWorld })
  },

  setTile: (x, y, tileId) => {
    const { isoWorld } = get()
    if (!isoWorld) return
    set({ isoWorld: setIsoTile(isoWorld, x, y, { base: tileId }) })
  },

  placeObject: (x, y, object) => {
    const { isoWorld } = get()
    if (!isoWorld) return
    set({ isoWorld: placeIsoObject(isoWorld, x, y, object) })
  },

  addResources: (patch) => {
    set((s) => ({
      resources: {
        wood: s.resources.wood + (patch.wood ?? 0),
        stone: s.resources.stone + (patch.stone ?? 0),
        crops: s.resources.crops + (patch.crops ?? 0),
        coins: s.resources.coins + (patch.coins ?? 0),
        farmPoints: s.resources.farmPoints + (patch.farmPoints ?? 0),
        harvestTickets: s.resources.harvestTickets + (patch.harvestTickets ?? 0),
        animalFeed: s.resources.animalFeed + (patch.animalFeed ?? 0),
        fruits: s.resources.fruits + (patch.fruits ?? 0),
        vegetables: s.resources.vegetables + (patch.vegetables ?? 0),
        butter: s.resources.butter + (patch.butter ?? 0),
        eggs: s.resources.eggs + (patch.eggs ?? 0),
        milk: s.resources.milk + (patch.milk ?? 0),
      },
      farmXp: s.farmXp + Math.max(0, (patch.wood ?? 0) + (patch.stone ?? 0) + (patch.crops ?? 0) + (patch.farmPoints ?? 0) + Math.floor((patch.coins ?? 0) / 10)),
    }))
  },

  spendResources: (cost) => {
    const { resources } = get()
    const canPay = resources.wood >= (cost.wood ?? 0)
      && resources.stone >= (cost.stone ?? 0)
      && resources.crops >= (cost.crops ?? 0)
      && resources.coins >= (cost.coins ?? 0)
      && resources.farmPoints >= (cost.farmPoints ?? 0)
      && resources.harvestTickets >= (cost.harvestTickets ?? 0)
      && resources.animalFeed >= (cost.animalFeed ?? 0)
      && resources.fruits >= (cost.fruits ?? 0)
      && resources.vegetables >= (cost.vegetables ?? 0)
      && resources.butter >= (cost.butter ?? 0)
      && resources.eggs >= (cost.eggs ?? 0)
      && resources.milk >= (cost.milk ?? 0)
    if (!canPay) return false
    set((s) => ({
      resources: {
        ...s.resources,
        wood: s.resources.wood - (cost.wood ?? 0),
        stone: s.resources.stone - (cost.stone ?? 0),
        crops: s.resources.crops - (cost.crops ?? 0),
        coins: s.resources.coins - (cost.coins ?? 0),
        farmPoints: s.resources.farmPoints - (cost.farmPoints ?? 0),
        harvestTickets: s.resources.harvestTickets - (cost.harvestTickets ?? 0),
        animalFeed: s.resources.animalFeed - (cost.animalFeed ?? 0),
        fruits: s.resources.fruits - (cost.fruits ?? 0),
        vegetables: s.resources.vegetables - (cost.vegetables ?? 0),
        butter: s.resources.butter - (cost.butter ?? 0),
        eggs: s.resources.eggs - (cost.eggs ?? 0),
        milk: s.resources.milk - (cost.milk ?? 0),
      },
    }))
    return true
  },

  plantCrop: (x, y, cropType) => {
    const key = `${x},${y}`
    const state = get()
    if (state.cropPlots[key] && !state.cropPlots[key].harvested) return false
    const crop = FARM_CROPS[cropType]
    const profession = FARMER_PROFESSIONS[state.player.characterId]
    if (!state.spendResources({ coins: crop.seedCost })) {
      set({ selectedActionLabel: `need ${crop.seedCost} coins for ${crop.label} seeds` })
      return false
    }
    const now = state.day * 1440 + state.minuteOfDay
    const growMinutes = Math.round(crop.growMinutes * profession.growMultiplier)
    const mutation = Math.random() < 0.04 ? (Math.random() < 0.5 ? 'golden' : 'giant') : undefined
    set((s) => ({
      cropPlots: {
        ...s.cropPlots,
        [key]: { x, y, cropType, plantedAt: now, readyAt: now + growMinutes, harvested: false, watered: false, fertilized: false, mutation },
      },
      farmXp: s.farmXp + Math.max(2, Math.round(2 * profession.xpMultiplier)),
      seasonPassXp: s.seasonPassXp + 1,
      selectedActionLabel: `${crop.label} planted`,
    }))
    void api.sendFarmAction('home', { type: 'plant_crop', x, y, cropType, readyAt: now + growMinutes, mutation })
    return true
  },

  waterCrop: (x, y) => {
    const key = `${x},${y}`
    const state = get()
    const plot = state.cropPlots[key]
    if (!plot || plot.harvested || plot.watered) return false
    const now = state.day * 1440 + state.minuteOfDay
    const remaining = Math.max(1, plot.readyAt - now)
    set((s) => ({
      cropPlots: {
        ...s.cropPlots,
        [key]: { ...plot, watered: true, readyAt: now + Math.ceil(remaining * 0.65) },
      },
      farmXp: s.farmXp + 1,
      selectedActionLabel: 'crop watered',
    }))
    void api.sendFarmAction('home', { type: 'water_crop', x, y })
    return true
  },

  fertilizeCrop: (x, y) => {
    const key = `${x},${y}`
    const plot = get().cropPlots[key]
    if (!plot || plot.harvested || plot.fertilized) return false
    if (!get().spendResources({ crops: 1, coins: 3 })) return false
    set((s) => ({
      cropPlots: {
        ...s.cropPlots,
        [key]: { ...plot, fertilized: true, readyAt: Math.max(plot.plantedAt + 30, plot.readyAt - 45) },
      },
      farmXp: s.farmXp + 2,
      selectedActionLabel: 'crop fertilized',
    }))
    void api.sendFarmAction('home', { type: 'fertilize_crop', x, y })
    return true
  },

  harvestCrop: (x, y) => {
    const key = `${x},${y}`
    const state = get()
    const plot = state.cropPlots[key]
    const now = state.day * 1440 + state.minuteOfDay
    if (!plot || plot.harvested || now < plot.readyAt) return false
    const crop = FARM_CROPS[plot.cropType]
    const profession = FARMER_PROFESSIONS[state.player.characterId]
    const baseYield = Math.max(3, Math.round(crop.sellValue / 5))
    const bonus = (plot.watered ? 1 : 0) + (plot.fertilized ? 2 : 0) + (plot.mutation === 'giant' ? 4 : plot.mutation === 'golden' ? 2 : 0)
    const cropYield = baseYield + bonus
    const wateredBonus = plot.watered ? 5 : 0
    const coinYield = Math.round((crop.sellValue + wateredBonus + bonus * 3) * profession.sellMultiplier)
    const fpYield = plot.mutation ? 3 : 1
    set((s) => ({
      cropPlots: {
        ...s.cropPlots,
        [key]: { ...plot, harvested: true },
      },
      resources: {
        ...s.resources,
        crops: s.resources.crops + cropYield,
        coins: s.resources.coins + coinYield,
        farmPoints: s.resources.farmPoints + fpYield,
      },
      cropMastery: { ...s.cropMastery, [plot.cropType]: (s.cropMastery[plot.cropType] ?? 0) + 1 },
      farmXp: s.farmXp + Math.round((crop.xp + bonus) * profession.xpMultiplier),
      farmLevel: Math.max(s.farmLevel, Math.floor((s.farmXp + crop.xp * profession.xpMultiplier) / 120) + 1),
      seasonPassXp: s.seasonPassXp + 4,
      activeEvent: { ...s.activeEvent, progress: Math.min(s.activeEvent.goal, s.activeEvent.progress + 1) },
      selectedActionLabel: `harvested ${crop.label}: +${coinYield} coins`,
    }))
    void api.sendFarmAction('home', { type: 'harvest_crop', x, y, cropType: plot.cropType, cropYield, coinYield, farmPoints: fpYield })
    return true
  },

  registerAnimal: (x, y, kind) => {
    const key = `${x},${y}`
    set((s) => ({
      animals: {
        ...s.animals,
        [key]: {
          id: `${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          kind,
          x,
          y,
          fedAt: null,
          readyAt: null,
        },
      },
    }))
    void api.sendFarmAction('home', { type: 'place_animal', x, y, kind })
  },

  removeAnimal: (x, y) => {
    const key = `${x},${y}`
    set((s) => {
      const animals = { ...s.animals }
      delete animals[key]
      return { animals }
    })
    void api.sendFarmAction('home', { type: 'remove_animal', x, y })
  },

  buyAnimalFeed: (quantity = 5) => {
    const amount = Math.max(1, Math.floor(quantity))
    const price = amount * 3
    if (!get().spendResources({ coins: price })) {
      set({ selectedActionLabel: `need ${price} coins for animal feed` })
      return false
    }
    set((s) => ({
      resources: { ...s.resources, animalFeed: s.resources.animalFeed + amount },
      selectedActionLabel: `bought ${amount} animal feed`,
    }))
    void api.sendFarmAction('home', { type: 'buy_animal_feed', quantity: amount, price })
    get().saveFarmNow()
    return true
  },

  feedAnimal: (x, y) => {
    const key = `${x},${y}`
    const state = get()
    const animal = state.animals[key]
    if (!animal) {
      set({ selectedActionLabel: 'select a chicken or cow first' })
      return false
    }
    if (animal.readyAt !== null) {
      set({ selectedActionLabel: 'collect this animal product first' })
      return false
    }
    if (!state.spendResources({ animalFeed: 1 })) {
      set({ selectedActionLabel: 'buy more animal feed' })
      return false
    }
    const now = state.day * 1440 + state.minuteOfDay
    const productionMinutes = animal.kind === 'chicken' ? 120 : 240
    set((s) => ({
      animals: {
        ...s.animals,
        [key]: { ...animal, fedAt: now, readyAt: now + productionMinutes },
      },
      selectedActionLabel: `${animal.kind} fed`,
    }))
    void api.sendFarmAction('home', { type: 'feed_animal', x, y, kind: animal.kind, readyAt: now + productionMinutes })
    get().saveFarmNow()
    return true
  },

  collectAnimalProduct: (x, y) => {
    const key = `${x},${y}`
    const state = get()
    const animal = state.animals[key]
    const now = state.day * 1440 + state.minuteOfDay
    if (!animal || animal.readyAt === null || now < animal.readyAt) {
      set({ selectedActionLabel: 'animal product is not ready' })
      return false
    }
    const product = animal.kind === 'chicken' ? 'eggs' : 'milk'
    set((s) => ({
      animals: {
        ...s.animals,
        [key]: { ...animal, fedAt: null, readyAt: null },
      },
      resources: {
        ...s.resources,
        eggs: s.resources.eggs + (product === 'eggs' ? 1 : 0),
        milk: s.resources.milk + (product === 'milk' ? 1 : 0),
      },
      farmXp: s.farmXp + (animal.kind === 'chicken' ? 4 : 7),
      selectedActionLabel: `collected ${product === 'eggs' ? '1 egg' : '1 milk'}`,
    }))
    void api.sendFarmAction('home', { type: 'collect_animal_product', x, y, kind: animal.kind, product, quantity: 1 })
    get().saveFarmNow()
    return true
  },

  buyTownProduce: (kind, quantity = 5) => {
    const amount = Math.max(1, Math.floor(quantity))
    const unitPrice = kind === 'fruits' ? 7 : 5
    const price = amount * unitPrice
    if (!get().spendResources({ coins: price })) {
      set({ selectedActionLabel: `need ${price} coins` })
      return false
    }
    get().addResources({ [kind]: amount } as Partial<Resources>)
    set({ selectedActionLabel: `bought ${amount} ${kind}` })
    void api.sendFarmAction('home', { type: 'buy_town_produce', kind, quantity: amount, price })
    get().saveFarmNow()
    return true
  },

  sellTownProduce: (kind, quantity = 5) => {
    const amount = Math.max(1, Math.floor(quantity))
    const unitPrice = kind === 'fruits' ? 10 : 8
    if (!get().spendResources({ [kind]: amount } as Partial<Resources>)) {
      set({ selectedActionLabel: `not enough ${kind}` })
      return false
    }
    const coins = amount * unitPrice
    get().addResources({ coins })
    set({ selectedActionLabel: `sold ${amount} ${kind} for ${coins} coins` })
    void api.sendFarmAction('home', { type: 'sell_town_produce', kind, quantity: amount, coins })
    get().saveFarmNow()
    return true
  },

  buyButter: (quantity = 1) => {
    const amount = Math.max(1, Math.floor(quantity))
    const price = amount * 14
    if (!get().spendResources({ coins: price })) {
      set({ selectedActionLabel: `need ${price} coins for butter` })
      return false
    }
    get().addResources({ butter: amount })
    set({ selectedActionLabel: `bought ${amount} butter` })
    void api.sendFarmAction('home', { type: 'buy_butter', quantity: amount, price })
    get().saveFarmNow()
    return true
  },

  sellMilk: (quantity = 1) => {
    const amount = Math.max(1, Math.floor(quantity))
    if (!get().spendResources({ milk: amount })) {
      set({ selectedActionLabel: 'not enough milk' })
      return false
    }
    const coins = amount * 18
    get().addResources({ coins })
    set({ selectedActionLabel: `sold ${amount} milk for ${coins} coins` })
    void api.sendFarmAction('home', { type: 'sell_milk', quantity: amount, coins })
    get().saveFarmNow()
    return true
  },

  sellEggs: (quantity = 1) => {
    const amount = Math.max(1, Math.floor(quantity))
    if (!get().spendResources({ eggs: amount })) {
      set({ selectedActionLabel: 'not enough eggs' })
      return false
    }
    const coins = amount * 9
    get().addResources({ coins })
    set({ selectedActionLabel: `sold ${amount} eggs for ${coins} coins` })
    void api.sendFarmAction('home', { type: 'sell_eggs', quantity: amount, coins })
    get().saveFarmNow()
    return true
  },

  craftItem: (recipeId) => {
    const recipes: Record<string, { name: string; kind: CraftedItem['kind']; cost: Partial<Resources>; xp: number; score: number }> = {
      flowerFence: { name: 'Flower Fence Kit', kind: 'fence', cost: { wood: 6, crops: 2, coins: 10 }, xp: 12, score: 8 },
      cobblePath: { name: 'Cobble Path Pack', kind: 'path', cost: { stone: 8, coins: 14 }, xp: 14, score: 6 },
      oakBench: { name: 'Oak Visitor Bench', kind: 'furniture', cost: { wood: 10, coins: 28 }, xp: 18, score: 12 },
      marketStall: { name: 'Farm Market Stall', kind: 'stall', cost: { wood: 14, stone: 4, crops: 5, coins: 45 }, xp: 28, score: 20 },
      seedPress: { name: 'Seed Press Machine', kind: 'machine', cost: { wood: 12, stone: 14, coins: 70 }, xp: 35, score: 16 },
      solStatue: { name: 'Sol Garden Statue', kind: 'decoration', cost: { stone: 20, farmPoints: 8, coins: 120 }, xp: 45, score: 35 },
    }
    const recipe = recipes[recipeId]
    if (!recipe) return false
    if (!get().spendResources(recipe.cost)) {
      set({ selectedActionLabel: 'not enough crafting resources' })
      return false
    }
    const item: CraftedItem = {
      id: `${recipeId}-${Date.now()}`,
      name: recipe.name,
      kind: recipe.kind,
      craftedAt: Date.now(),
    }
    set((s) => ({
      craftedItems: [item, ...s.craftedItems].slice(0, 80),
      farmhouse: { ...s.farmhouse, gardenScore: s.farmhouse.gardenScore + recipe.score },
      farmXp: s.farmXp + recipe.xp,
      seasonPassXp: s.seasonPassXp + Math.ceil(recipe.xp / 4),
      activeEvent: { ...s.activeEvent, progress: Math.min(s.activeEvent.goal, s.activeEvent.progress + 2) },
      selectedActionLabel: `${recipe.name} crafted`,
    }))
    void api.sendFarmAction('home', { type: 'craft_item', recipeId, item })
    get().saveFarmNow()
    return true
  },

  upgradeFarmhouse: () => {
    const state = get()
    if (!state.farmhouse.owned) {
      set({ selectedActionLabel: 'build farmhouse first' })
      return false
    }
    const nextLevel = state.farmhouse.level + 1
    const cost = { wood: 8 * nextLevel, stone: 6 * nextLevel, coins: 80 * nextLevel, farmPoints: Math.max(0, nextLevel - 2) * 4 }
    if (!state.spendResources(cost)) {
      set({ selectedActionLabel: 'not enough upgrade resources' })
      return false
    }
    const rarity: Farmhouse['rarity'] = nextLevel >= 8 ? 'legendary' : nextLevel >= 6 ? 'epic' : nextLevel >= 4 ? 'rare' : nextLevel >= 2 ? 'cozy' : 'starter'
    const room = nextLevel === 2 ? 'kitchen' : nextLevel === 3 ? 'workshop' : nextLevel === 4 ? 'gallery room' : nextLevel === 5 ? 'trophy hall' : `expansion ${nextLevel}`
    set((s) => ({
      farmhouse: {
        ...s.farmhouse,
        level: nextLevel,
        rarity,
        rooms: s.farmhouse.rooms.includes(room) ? s.farmhouse.rooms : [...s.farmhouse.rooms, room],
      },
      farmXp: s.farmXp + nextLevel * 30,
      selectedActionLabel: `farmhouse level ${nextLevel}`,
    }))
    void api.sendFarmAction('home', { type: 'upgrade_farmhouse', level: nextLevel, rarity, room })
    get().saveFarmNow()
    return true
  },

  upgradeTool: (tool) => {
    const level = get().toolLevels[tool]
    const cost = { wood: 4 * level, stone: 5 * level, coins: 45 * level }
    if (!get().spendResources(cost)) {
      set({ selectedActionLabel: 'not enough tool resources' })
      return false
    }
    set((s) => ({
      toolLevels: { ...s.toolLevels, [tool]: level + 1 },
      farmXp: s.farmXp + 18 * level,
      selectedActionLabel: `${tool} level ${level + 1}`,
    }))
    void api.sendFarmAction('home', { type: 'upgrade_tool', tool, level: level + 1 })
    get().saveFarmNow()
    return true
  },

  claimWeeklyReward: (questId, tickets, xp = 40) => {
    if (get().weeklyQuests.includes(questId)) {
      set({ selectedActionLabel: 'weekly already claimed' })
      return false
    }
    set((s) => ({
      weeklyQuests: [...s.weeklyQuests, questId],
      resources: { ...s.resources, harvestTickets: s.resources.harvestTickets + tickets, farmPoints: s.resources.farmPoints + 5 },
      farmXp: s.farmXp + xp,
      seasonPassXp: s.seasonPassXp + 20,
      selectedActionLabel: `+${tickets} harvest tickets`,
    }))
    void api.claimReward(questId, 'home', { harvestTickets: tickets, farmPoints: 5 })
    get().saveFarmNow()
    return true
  },

  claimEventReward: () => {
    const event = get().activeEvent
    if (event.progress < event.goal || get().weeklyQuests.includes(event.id)) {
      set({ selectedActionLabel: event.progress < event.goal ? 'event not complete' : 'event already claimed' })
      return false
    }
    set((s) => ({
      weeklyQuests: [...s.weeklyQuests, event.id],
      resources: { ...s.resources, harvestTickets: s.resources.harvestTickets + event.rewardTickets, farmPoints: s.resources.farmPoints + 10 },
      farmhouse: { ...s.farmhouse, trophies: s.farmhouse.trophies.includes(event.name) ? s.farmhouse.trophies : [...s.farmhouse.trophies, event.name] },
      selectedActionLabel: `${event.name} reward claimed`,
    }))
    void api.claimReward(event.id, 'home', { harvestTickets: event.rewardTickets, trophy: event.name })
    get().saveFarmNow()
    return true
  },

  likeFarm: (farmId) => {
    if (farmId === 'home') {
      set((s) => ({ farmLikes: s.farmLikes + 1, selectedActionLabel: 'farm liked' }))
      void api.likeFarm(farmId)
      return true
    }
    set((s) => ({
      visitableFarms: s.visitableFarms.map((farm) => farm.id === farmId ? { ...farm, likes: farm.likes + 1 } : farm),
      selectedActionLabel: 'visited farm liked',
    }))
    void api.likeFarm(farmId)
    return true
  },

  leaveGuestbook: (author, message) => {
    const clean = message.trim().slice(0, 120)
    if (!clean) return false
    const entry: GuestbookEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      author: author.trim().slice(0, 24) || 'guest farmer',
      message: clean,
      timestamp: Date.now(),
    }
    set((s) => ({
      farmhouse: { ...s.farmhouse, guestbook: [entry, ...s.farmhouse.guestbook].slice(0, 30) },
      tipsReceived: s.tipsReceived + 1,
      resources: { ...s.resources, coins: s.resources.coins + 5 },
      selectedActionLabel: 'guestbook signed',
    }))
    void api.signGuestbook('home', entry.author, entry.message, 5)
    get().saveFarmNow()
    return true
  },

  buildFarmhouseNearPlayer: () => {
    const state = get()
    if (!state.isoWorld) return false
    if (state.farmhouse.owned) {
      set({ selectedActionLabel: 'farmhouse already owned' })
      return true
    }

    let target: { x: number; y: number } | null = null
    for (let radius = 1; radius <= 9 && !target; radius += 1) {
      for (let dy = -radius; dy <= radius && !target; dy += 1) {
        for (let dx = -radius; dx <= radius; dx += 1) {
          if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue
          const x = state.player.tileX + dx
          const y = state.player.tileY + dy
          if (canPlaceSavedFootprint(state.isoWorld, x, y, 'HOUSE')) {
            target = { x, y }
            break
          }
        }
      }
    }

    if (!target) {
      set({ selectedActionLabel: 'no clear 2x2 space nearby' })
      return false
    }

    if (!get().spendResources({ wood: 8, stone: 5, coins: 35 })) {
      set({ selectedActionLabel: 'not enough resources' })
      return false
    }

    const object = createIsoObject('HOUSE')
    if (!object) {
      set({ selectedActionLabel: 'farmhouse unavailable' })
      return false
    }

    set((s) => ({
      isoWorld: s.isoWorld ? placeIsoObject(s.isoWorld, target.x, target.y, object) : s.isoWorld,
      farmhouse: { ...s.farmhouse, owned: true, x: target.x, y: target.y },
      farmXp: s.farmXp + 20,
      blocksPlaced: s.blocksPlaced + 1,
      chainBlockCount: s.chainBlockCount + 1,
      selectedTile: target,
      selectedActionLabel: 'farmhouse built',
    }))
    void api.sendFarmAction('home', { type: 'build_farmhouse', x: target.x, y: target.y })
    get().saveFarmNow()
    return true
  },

  polishStarterFarmstead: () => {
    const world = get().isoWorld
    if (!world) return false
    const next = applyStarterFarmstead(world)
    set((s) => ({
      isoWorld: next,
      farmhouse: { ...s.farmhouse, owned: true, x: 13, y: 11 },
      player: { ...s.player, tileX: 15, tileY: 16, x: 15, y: 16 },
      selectedTile: { x: 15, y: 16 },
      selectedActionLabel: 'homestead polished',
      farmXp: s.farmXp + 10,
    }))
    void api.sendFarmAction('home', { type: 'polish_starter_farmstead' })
    get().saveFarmNow()
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('solfarm:center-camera'))
    return true
  },

  claimFarmhouse: (x, y, minted = false) => {
    set((s) => ({
      farmhouse: { ...s.farmhouse, owned: true, minted: minted || s.farmhouse.minted, x, y },
      farmXp: s.farmXp + 20,
    }))
  },

  mintFarmhouse: () => {
    set((s) => ({
      farmhouse: { ...s.farmhouse, owned: true, minted: true },
      nftCount: s.nftCount + 1,
      farmXp: s.farmXp + 35,
    }))
    void api.mintFarmhouse({ farmId: 'home', kind: 'farmhouse', name: get().farmhouse.name })
  },
  addMintedItem: (item) => {
    const minted: MintedItem = {
      ...item,
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      mintedAt: Date.now(),
    }
    set((s) => ({ mintedItems: [minted, ...s.mintedItems].slice(0, 100) }))
    void api.mintItem({ farmId: 'home', ...minted })
  },

  travelTown: () => set((s) => ({
    activeFarmId: 'town',
    showVisitPanel: false,
    showSocialHub: false,
    player: { ...s.player, tileX: 19, tileY: 16, x: 19, y: 16, facing: 'west' },
    selectedTile: { x: 19, y: 16 },
    gameMode: 'inspect',
    selectedActionLabel: 'Welcome to Town',
  })),
  visitFarm: (activeFarmId) => set({ activeFarmId, showVisitPanel: false, selectedActionLabel: activeFarmId === 'home' ? 'returned home' : 'visiting farm' }),
  returnHomeFarm: () => set((s) => ({
    activeFarmId: 'home',
    player: { ...s.player, tileX: 4, tileY: 3, x: 4, y: 3, facing: 'west' },
    selectedTile: { x: 4, y: 3 },
    selectedActionLabel: 'returned home',
  })),
  createFarm: (name) => {
    const clean = name.trim().slice(0, 32) || 'My Sol Farm'
    set((s) => ({
      farmCreated: true,
      farmName: clean,
      farmhouse: { ...s.farmhouse, name: clean },
      selectedActionLabel: `${clean} created`,
    }))
    void api.createFarm(clean)
    void supabaseData.upsertProfile(clean, get().player.characterId)
    setTimeout(() => get().saveFarmNow(), 0)
  },
  setCharacter: (characterId) => {
    set((s) => ({
      player: { ...s.player, characterId },
      selectedActionLabel: 'farmer selected',
    }))
    void supabaseData.upsertProfile(get().farmName, characterId)
  },
  renameFarm: (name) => {
    const clean = name.trim().slice(0, 32) || 'My Sol Farm'
    set((s) => ({
      farmName: clean,
      farmhouse: { ...s.farmhouse, name: clean },
      selectedActionLabel: 'farm renamed',
    }))
    void api.createFarm(clean)
    get().saveFarmNow()
  },
  saveFarmNow: () => {
    if (!canUseStorage()) return false
    try {
      const snapshot = makeFarmSave(get())
      window.localStorage.setItem(FARM_SAVE_KEY, JSON.stringify(snapshot))
      void api.saveFarm('home', snapshot)
      void supabaseData.saveFarm(snapshot)
      set({ lastSavedAt: snapshot.savedAt, saveError: null })
      return true
    } catch (e) {
      set({ saveError: e instanceof Error ? e.message : 'save failed' })
      return false
    }
  },
  loadFarmSave: () => {
    if (!canUseStorage()) return false
    const raw = window.localStorage.getItem(FARM_SAVE_KEY)
    if (!raw) return false
    const save = parseFarmSave(raw)
    if (!save) {
      set({ saveError: 'invalid save file' })
      return false
    }
    set((s) => ({
      seed: save.seed,
      farmCreated: save.farmCreated,
      farmName: save.farmName,
      isoWorld: normalizeIsoWorld(save.isoWorld),
      player: { ...save.player, characterId: save.player.characterId ?? 'farmer-sage' },
      resources: normalizeResources(save.resources),
      cropPlots: normalizeCropPlots(save.cropPlots),
      animals: normalizeAnimals(save.animals),
      farmhouse: normalizeFarmhouse(save.farmhouse),
      farmhouseStyles: normalizeFarmhouseStyles(save.farmhouseStyles),
      activeFarmhouseStyleId: save.activeFarmhouseStyleId ?? 'starter-cottage',
      claimedDailyQuests: save.claimedDailyQuests ?? [],
      purchasedCosmetics: save.purchasedCosmetics ?? [],
      craftedItems: save.craftedItems ?? [],
      toolLevels: { ...defaultToolLevels, ...save.toolLevels },
      cropMastery: { ...defaultCropMastery, ...save.cropMastery },
      achievements: save.achievements ?? [],
      weeklyQuests: save.weeklyQuests ?? [],
      seasonPassXp: save.seasonPassXp ?? 0,
      farmLikes: save.farmLikes ?? 0,
      tipsReceived: save.tipsReceived ?? 0,
      activeEvent: { ...defaultActiveEvent, ...save.activeEvent },
      farmLevel: save.farmLevel,
      farmXp: save.farmXp,
      day: save.day,
      minuteOfDay: save.minuteOfDay,
      chainBlockCount: save.chainBlockCount,
      nftCount: save.nftCount,
      mintedItems: save.mintedItems ?? [],
      totalFeesSpent: save.totalFeesSpent,
      blocksPlaced: save.blocksPlaced,
      blocksMined: save.blocksMined,
      worldLoaded: !!save.isoWorld || s.worldLoaded,
      lastSavedAt: save.savedAt,
      saveError: null,
      selectedActionLabel: 'farm loaded',
    }))
    return true
  },
  exportFarmSave: () => JSON.stringify(makeFarmSave(get()), null, 2),
  importFarmSave: (raw) => {
    const save = parseFarmSave(raw)
    if (!save) {
      set({ saveError: 'invalid save import', selectedActionLabel: 'invalid save import' })
      return false
    }
    set({
      seed: save.seed,
      farmCreated: save.farmCreated,
      farmName: save.farmName,
      isoWorld: normalizeIsoWorld(save.isoWorld),
      player: { ...save.player, characterId: save.player.characterId ?? 'farmer-sage' },
      resources: normalizeResources(save.resources),
      cropPlots: normalizeCropPlots(save.cropPlots),
      animals: normalizeAnimals(save.animals),
      farmhouse: normalizeFarmhouse(save.farmhouse),
      farmhouseStyles: normalizeFarmhouseStyles(save.farmhouseStyles),
      activeFarmhouseStyleId: save.activeFarmhouseStyleId ?? 'starter-cottage',
      claimedDailyQuests: save.claimedDailyQuests ?? [],
      purchasedCosmetics: save.purchasedCosmetics ?? [],
      craftedItems: save.craftedItems ?? [],
      toolLevels: { ...defaultToolLevels, ...save.toolLevels },
      cropMastery: { ...defaultCropMastery, ...save.cropMastery },
      achievements: save.achievements ?? [],
      weeklyQuests: save.weeklyQuests ?? [],
      seasonPassXp: save.seasonPassXp ?? 0,
      farmLikes: save.farmLikes ?? 0,
      tipsReceived: save.tipsReceived ?? 0,
      activeEvent: { ...defaultActiveEvent, ...save.activeEvent },
      farmLevel: save.farmLevel,
      farmXp: save.farmXp,
      day: save.day,
      minuteOfDay: save.minuteOfDay,
      chainBlockCount: save.chainBlockCount,
      nftCount: save.nftCount,
      mintedItems: save.mintedItems ?? [],
      totalFeesSpent: save.totalFeesSpent,
      blocksPlaced: save.blocksPlaced,
      blocksMined: save.blocksMined,
      worldLoaded: !!save.isoWorld,
      lastSavedAt: Date.now(),
      saveError: null,
      selectedActionLabel: 'farm imported',
    })
    get().saveFarmNow()
    return true
  },
  clearFarmSave: () => {
    if (canUseStorage()) {
      for (const key of [...LEGACY_FARM_SAVE_KEYS, FARM_SAVE_KEY]) {
        window.localStorage.removeItem(key)
      }
    }
    set({ lastSavedAt: null, selectedActionLabel: 'local save cleared' })
  },
  buyFarmhouseStyle: (styleId) => {
    const state = get()
    const style = state.farmhouseStyles.find((item) => item.id === styleId)
    if (!style) return false
    if (style.owned) {
      set({ activeFarmhouseStyleId: styleId, selectedActionLabel: `${style.name} equipped` })
      get().saveFarmNow()
      return true
    }
    if (!state.spendResources({ coins: style.coinPrice })) {
      set({ selectedActionLabel: `need ${style.coinPrice} coins` })
      return false
    }
    const sig = Math.random().toString(36).slice(2).padEnd(32, 'm')
    set((s) => ({
      farmhouseStyles: s.farmhouseStyles.map((item) => item.id === styleId ? { ...item, owned: true, listed: false } : item),
      activeFarmhouseStyleId: styleId,
      farmXp: s.farmXp + Math.max(20, Math.floor(style.coinPrice / 12)),
      selectedActionLabel: `${style.name} bought`,
    }))
    void api.sendFarmAction('home', { type: 'buy_farmhouse_style', styleId, name: style.name, price: style.coinPrice })
    get().addTx({
      action: 'buy_farmhouse_style',
      sig,
      fee: 0,
      status: 'confirmed',
      blockName: style.name,
    })
    get().saveFarmNow()
    return true
  },
  setActiveFarmhouseStyle: (styleId) => {
    const style = get().farmhouseStyles.find((item) => item.id === styleId && item.owned)
    if (!style) {
      set({ selectedActionLabel: 'style not owned' })
      return
    }
    set({ activeFarmhouseStyleId: styleId, selectedActionLabel: `${style.name} equipped` })
    get().saveFarmNow()
  },
  listFarmhouseStyle: (styleId) => {
    set((s) => ({
      farmhouseStyles: s.farmhouseStyles.map((item) => item.id === styleId && item.owned ? { ...item, listed: !item.listed } : item),
      selectedActionLabel: 'market listing updated',
    }))
    void api.sendFarmAction('home', { type: 'list_farmhouse_style', styleId })
    get().saveFarmNow()
  },
  claimDailyQuest: (questId, reward, xp = 10) => {
    if (get().claimedDailyQuests.includes(questId)) {
      set({ selectedActionLabel: 'reward already claimed' })
      return false
    }
    set((s) => ({
      claimedDailyQuests: [...s.claimedDailyQuests, questId],
      resources: {
        wood: s.resources.wood + (reward.wood ?? 0),
        stone: s.resources.stone + (reward.stone ?? 0),
        crops: s.resources.crops + (reward.crops ?? 0),
        coins: s.resources.coins + (reward.coins ?? 0),
        farmPoints: s.resources.farmPoints + (reward.farmPoints ?? 0),
        harvestTickets: s.resources.harvestTickets + (reward.harvestTickets ?? 0),
        animalFeed: s.resources.animalFeed + (reward.animalFeed ?? 0),
        fruits: s.resources.fruits + (reward.fruits ?? 0),
        vegetables: s.resources.vegetables + (reward.vegetables ?? 0),
        butter: s.resources.butter + (reward.butter ?? 0),
        eggs: s.resources.eggs + (reward.eggs ?? 0),
        milk: s.resources.milk + (reward.milk ?? 0),
      },
      farmXp: s.farmXp + xp,
      seasonPassXp: s.seasonPassXp + Math.ceil(xp / 3),
      selectedActionLabel: 'farm order claimed',
    }))
    void api.claimReward(questId, 'home', reward)
    get().saveFarmNow()
    return true
  },
  buyMarketCosmetic: (id, name, price, kind, asNft = false) => {
    const state = get()
    if (state.purchasedCosmetics.includes(id)) {
      set({ selectedActionLabel: `${name} already owned` })
      return true
    }
    if (!state.spendResources({ coins: price })) {
      set({ selectedActionLabel: `need ${price} coins` })
      return false
    }
    const sig = Math.random().toString(36).slice(2).padEnd(32, 'c')
    set((s) => ({
      purchasedCosmetics: [...s.purchasedCosmetics, id],
      farmXp: s.farmXp + Math.max(8, Math.floor(price / 18)),
      nftCount: asNft ? s.nftCount + 1 : s.nftCount,
      selectedActionLabel: `${name} bought`,
    }))
    if (asNft) {
      get().addMintedItem({
        kind: kind === 'painting' ? 'building' : 'farmhouse',
        name,
        sig,
      })
    }
    void api.purchaseListing(id, sig)
    get().addTx({
      action: asNft ? 'buy_nft_cosmetic' : 'buy_cosmetic',
      sig,
      fee: asNft ? 0.006 : 0,
      status: 'confirmed',
      blockName: name,
    })
    get().saveFarmNow()
    return true
  },
  toggleMarketplace: () => set((s) => ({ showMarketplace: !s.showMarketplace })),
  toggleSocialHub: () => set((s) => ({ showSocialHub: !s.showSocialHub })),
  toggleProfile: () => set((s) => ({ showProfile: !s.showProfile })),
  toggleVisitPanel: () => set((s) => ({ showVisitPanel: !s.showVisitPanel })),

  updatePlayer: (partial) =>
    set((s) => ({ player: { ...s.player, ...partial } })),

  selectHotbarSlot: (slot) => set({ selectedHotbarSlot: Math.max(0, Math.min(8, slot)) }),

  addToInventory: (blockId, count = 1) => {
    set((s) => {
      const inv = [...s.inventory]
      const idx = inv.findIndex((i) => i.blockId === blockId)
      if (idx >= 0) {
        inv[idx] = { ...inv[idx], count: inv[idx].count + count }
      } else {
        inv.push({ blockId, count })
      }
      return { inventory: inv }
    })
  },

  removeFromInventory: (blockId, count = 1) => {
    const item = get().inventory.find((i) => i.blockId === blockId)
    if (!item || item.count < count) return false
    set((s) => {
      const inv = s.inventory
        .map((i) => i.blockId === blockId ? { ...i, count: i.count - count } : i)
        .filter((i) => i.count > 0)
      return { inventory: inv }
    })
    return true
  },

  setHotbarBlock: (slot, blockId) => {
    set((s) => {
      const hotbar = [...s.hotbar]
      hotbar[slot] = blockId !== null ? { blockId, count: 64 } : null
      return { hotbar }
    })
  },

  addTx: (entry) => {
    const tx: TxEntry = {
      ...entry,
      id: entry.id ?? Math.random().toString(36).slice(2),
      timestamp: entry.timestamp ?? Date.now(),
    }
    set((s) => ({
      txLog: [tx, ...s.txLog].slice(0, 50),
      totalFeesSpent: s.totalFeesSpent + entry.fee,
      solBalance: Math.max(0, s.solBalance - entry.fee),
    }))
    void api.sendFarmAction('home', { type: 'transaction', tx })
  },

  updateTxStatus: (sig, status) => {
    set((s) => ({
      txLog: s.txLog.map((t) => t.sig === sig ? { ...t, status } : t),
    }))
  },

  setSolBalance: (bal) => set({ solBalance: bal }),

  tickSlot: () => {
    set((s) => ({ slotHeight: s.slotHeight + Math.floor(Math.random() * 3) + 1 }))
  },

  setPendingTx: (v) => set({ pendingTx: v }),

  setMiningProgress: (v, target) => set({ miningProgress: v, miningTarget: target }),

  toggleInventory: () => set((s) => ({ showInventory: !s.showInventory })),
  toggleTxLog: () => set((s) => ({ showTxLog: !s.showTxLog })),
  toggleMinimap: () => set((s) => ({ showMinimap: !s.showMinimap })),
  setHoveredTile: (hoveredTile) => set({ hoveredTile }),
  setSelectedTile: (selectedTile) => set({ selectedTile }),
  setCam: (camX, camY, camZoom) => set({ camX, camY, camZoom }),
  tickWater: () => set((s) => ({ waterAnimTick: s.waterAnimTick + 1 })),
  tickTime: (minutes = 1) => set((s) => {
    const total = s.minuteOfDay + minutes
    return {
      minuteOfDay: total % 1440,
      day: s.day + Math.floor(total / 1440),
    }
  }),
  setBuildMode: (buildMode) => set({ buildMode }),
  setSelectedObjectType: (selectedObjectType) => set({ selectedObjectType }),
  movePlayerTo: (tileX, tileY, facing) => set((s) => ({
    player: {
      ...s.player,
      x: tileX,
      y: tileY,
      tileX,
      tileY,
      facing: facing ?? s.player.facing,
    },
  })),
  setSelectedActionLabel: (selectedActionLabel) => set({ selectedActionLabel }),
  toggleChat: () => set((s) => ({ showChat: !s.showChat })),
  addChat: (author, text, system = false) => {
    const trimmed = text.trim()
    if (!trimmed) return
    const message: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      author,
      text: trimmed.slice(0, 180),
      timestamp: Date.now(),
      system,
    }
    set((s) => ({ chatLog: [...s.chatLog, message].slice(-80) }))
    if (!system) {
      void api.sendGlobalChat(author, message.text)
      void supabaseData.sendChat(author, message.text)
      window.dispatchEvent(new CustomEvent('solfarm:send-chat', { detail: message }))
    }
  },
  receiveRemoteChat: (message) => set((s) => ({
    chatLog: s.chatLog.some((item) => item.id === message.id)
      ? s.chatLog
      : [...s.chatLog, message].slice(-80),
  })),
  replaceRemoteChat: (messages) => set({
    chatLog: messages.map((message) => ({
      id: message.id,
      author: message.author,
      text: message.body,
      timestamp: new Date(message.created_at).getTime(),
    })),
  }),
  setRemotePlayers: (remotePlayers) => set({ remotePlayers }),
  setMultiplayerStatus: (multiplayerStatus) => set({ multiplayerStatus }),
  setGameMode: (gameMode) => {
    const buildMode: BuildMode =
      gameMode === 'terrain' ? 'terrain'
        : gameMode === 'build' || gameMode === 'place' ? 'object'
          : gameMode === 'demolish' || gameMode === 'mine' ? 'demolish'
            : 'inspect'
    set({ gameMode, buildMode })
  },
  setToolMode: (toolMode) => set({ toolMode }),
  togglePause: () => set((s) => ({ isPaused: !s.isPaused })),
  setMintTarget: (mintTarget) => set({ mintTarget }),

  incrementPlaced: () => set((s) => ({ blocksPlaced: s.blocksPlaced + 1, chainBlockCount: s.chainBlockCount + 1 })),
  incrementMined:  () => set((s) => ({ blocksMined: s.blocksMined + 1 })),
  incrementNft:    () => set((s) => ({ nftCount: s.nftCount + 1 })),
}))

export const makeTx = (
  action: string,
  sig: string,
  fee: number,
  blockId?: number,
  coords?: { x: number; y: number },
  status: TxEntry['status'] = 'confirmed'
): TxEntry => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  action,
  sig,
  fee,
  timestamp: Date.now(),
  blockName: blockId === undefined ? undefined : BLOCKS[blockId]?.name,
  coords,
  status,
})
