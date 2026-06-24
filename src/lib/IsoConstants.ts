export const TILE_W = 64
export const TILE_H = 32
export const TILE_HALF_W = 32
export const TILE_HALF_H = 16
export const Z_SCALE = 28
export const ISO_WORLD_W = 32
export const ISO_WORLD_H = 32

export type IsoTileDef = {
  id: number
  name: string
  top: number
  left: number
  right: number
  flat: boolean
  solValue: number
}

export type IsoObjectType =
  | 'tree'
  | 'building'
  | 'crop'
  | 'rock'
  | 'chest'
  | 'well'
  | 'tower'
  | 'house'
  | 'barn'
  | 'mine'
  | 'fence'
  | 'lamp'
  | 'animal'
  | 'civic'
  | 'market'
  | 'fountain'
  | 'garden'
  | 'decoration'
  | 'portal'

export type IsoObjectDef = {
  type: IsoObjectType
  label: string
  variant: number
  height: number
  footprint: { w: number; h: number }
  color: number
  accentColor: number
  solValue: number
}

export const ISO_TILES = {
  WATER: { id: 0, name: 'water', top: 0x3a8fcc, left: 0x2a6fa0, right: 0x1a5080, flat: true, solValue: 0.001 },
  GRASS: { id: 1, name: 'grass', top: 0x6ab740, left: 0x4a8c2a, right: 0x3a6c1a, flat: false, solValue: 0.001 },
  SAND: { id: 2, name: 'sand', top: 0xe8d080, left: 0xb8a050, right: 0x988030, flat: false, solValue: 0.001 },
  DIRT: { id: 3, name: 'dirt', top: 0xc8a060, left: 0x9a7040, right: 0x7a5020, flat: false, solValue: 0.001 },
  STONE: { id: 4, name: 'stone', top: 0x999999, left: 0x666666, right: 0x444444, flat: false, solValue: 0.002 },
  LAVA: { id: 5, name: 'lava', top: 0xff6600, left: 0xcc3300, right: 0xaa2200, flat: true, solValue: 0.02 },
  SNOW: { id: 6, name: 'snow', top: 0xffffff, left: 0xccddee, right: 0xaabbcc, flat: false, solValue: 0.004 },
  PATH: { id: 7, name: 'path', top: 0xb8945a, left: 0x8a6a3a, right: 0x6a4a1a, flat: false, solValue: 0.001 },
  DEEPWATER: { id: 8, name: 'deep water', top: 0x1a5a8a, left: 0x0a3a60, right: 0x052040, flat: true, solValue: 0.001 },
} as const satisfies Record<string, IsoTileDef>

export const ISO_TILE_LIST = Object.values(ISO_TILES)

export const ISO_OBJECTS = {
  TREE_OAK: { type: 'tree', label: 'oak', variant: 0, height: 3, footprint: { w: 1, h: 1 }, color: 0x2d8a1a, accentColor: 0x6b4226, solValue: 0.002 },
  TREE_PINE: { type: 'tree', label: 'pine', variant: 1, height: 4, footprint: { w: 1, h: 1 }, color: 0x1a6a10, accentColor: 0x5a3216, solValue: 0.003 },
  TREE_APPLE: { type: 'tree', label: 'apple', variant: 2, height: 2, footprint: { w: 1, h: 1 }, color: 0x3a9a2a, accentColor: 0xff4444, solValue: 0.008 },
  TREE_PALM: { type: 'tree', label: 'palm', variant: 3, height: 3, footprint: { w: 1, h: 1 }, color: 0x4aaa3a, accentColor: 0xaa8833, solValue: 0.005 },
  ROCK_SMALL: { type: 'rock', label: 'rock', variant: 0, height: 1, footprint: { w: 1, h: 1 }, color: 0x888888, accentColor: 0xaaaaaa, solValue: 0.001 },
  ROCK_LARGE: { type: 'rock', label: 'boulder', variant: 1, height: 2, footprint: { w: 1, h: 1 }, color: 0x666666, accentColor: 0x888888, solValue: 0.003 },
  GOLD_ORE: { type: 'rock', label: 'gold', variant: 2, height: 1, footprint: { w: 1, h: 1 }, color: 0xf0c040, accentColor: 0xd4a020, solValue: 0.025 },
  DIAMOND_ORE: { type: 'rock', label: 'diamond', variant: 3, height: 1, footprint: { w: 1, h: 1 }, color: 0x5cedf0, accentColor: 0x3acddd, solValue: 0.1 },
  HOUSE: { type: 'house', label: 'house', variant: 0, height: 3, footprint: { w: 2, h: 2 }, color: 0xf5e8c8, accentColor: 0xcc4444, solValue: 0.05 },
  BARN: { type: 'barn', label: 'barn', variant: 0, height: 3, footprint: { w: 2, h: 3 }, color: 0xcc3300, accentColor: 0xf0f0f0, solValue: 0.04 },
  WINDMILL: { type: 'building', label: 'windmill', variant: 1, height: 5, footprint: { w: 2, h: 2 }, color: 0xf5f5e8, accentColor: 0x8b6914, solValue: 0.08 },
  WELL: { type: 'well', label: 'well', variant: 0, height: 2, footprint: { w: 1, h: 1 }, color: 0x888888, accentColor: 0x6b4226, solValue: 0.015 },
  CROP_WHEAT: { type: 'crop', label: 'wheat', variant: 0, height: 1, footprint: { w: 1, h: 1 }, color: 0xf0c040, accentColor: 0xd4a020, solValue: 0.005 },
  CROP_CORN: { type: 'crop', label: 'corn', variant: 1, height: 2, footprint: { w: 1, h: 1 }, color: 0x6ab740, accentColor: 0xf0c040, solValue: 0.006 },
  CROP_STRAWBERRY: { type: 'crop', label: 'strawberry', variant: 2, height: 1, footprint: { w: 1, h: 1 }, color: 0x2ecc71, accentColor: 0xff4f6d, solValue: 0.008 },
  CROP_PUMPKIN: { type: 'crop', label: 'pumpkin', variant: 3, height: 1, footprint: { w: 1, h: 1 }, color: 0x4aa33a, accentColor: 0xf08a24, solValue: 0.01 },
  CROP_CARROT: { type: 'crop', label: 'carrot', variant: 4, height: 1, footprint: { w: 1, h: 1 }, color: 0x5aa43a, accentColor: 0xff6b35, solValue: 0.006 },
  CROP_TOMATO: { type: 'crop', label: 'tomato', variant: 5, height: 1, footprint: { w: 1, h: 1 }, color: 0x3e9d48, accentColor: 0xdc4141, solValue: 0.009 },
  CROP_SUNFLOWER: { type: 'crop', label: 'sunflower', variant: 6, height: 2, footprint: { w: 1, h: 1 }, color: 0x58a83e, accentColor: 0xffb800, solValue: 0.014 },
  CHEST: { type: 'chest', label: 'chest', variant: 0, height: 1, footprint: { w: 1, h: 1 }, color: 0xf0c040, accentColor: 0x8b6914, solValue: 0.02 },
  TOWER: { type: 'tower', label: 'tower', variant: 0, height: 5, footprint: { w: 1, h: 1 }, color: 0x888888, accentColor: 0x444444, solValue: 0.06 },
  MINE_SHAFT: { type: 'mine', label: 'mine', variant: 0, height: 2, footprint: { w: 1, h: 1 }, color: 0x333333, accentColor: 0x8b6914, solValue: 0.03 },
  FENCE: { type: 'fence', label: 'fence', variant: 0, height: 1, footprint: { w: 1, h: 1 }, color: 0xc8a060, accentColor: 0xa07040, solValue: 0.001 },
  LAMP_POST: { type: 'lamp', label: 'lamp', variant: 0, height: 2, footprint: { w: 1, h: 1 }, color: 0x444444, accentColor: 0xffee88, solValue: 0.01 },
  TRAVEL_PORTAL: { type: 'portal', label: 'travel portal', variant: 0, height: 3, footprint: { w: 1, h: 1 }, color: 0x5cedf0, accentColor: 0x9945ff, solValue: 0 },
  CHICKEN: { type: 'animal', label: 'chicken', variant: 0, height: 1, footprint: { w: 1, h: 1 }, color: 0xf8f3d4, accentColor: 0xff6b35, solValue: 0.012 },
  COW: { type: 'animal', label: 'cow', variant: 3, height: 2, footprint: { w: 1, h: 1 }, color: 0xf5eee0, accentColor: 0x45352a, solValue: 0.026 },
  SHEEP: { type: 'animal', label: 'sheep', variant: 1, height: 1, footprint: { w: 1, h: 1 }, color: 0xf4f1e8, accentColor: 0x7a5a3a, solValue: 0.018 },
  HORSE: { type: 'animal', label: 'horse', variant: 2, height: 2, footprint: { w: 1, h: 1 }, color: 0x9a5a2f, accentColor: 0xf0d090, solValue: 0.03 },
  TOWNHALL: { type: 'civic', label: 'townhall', variant: 0, height: 5, footprint: { w: 3, h: 3 }, color: 0xf0dfb8, accentColor: 0x5b78b8, solValue: 0.12 },
  MARKET_STALL: { type: 'market', label: 'market', variant: 0, height: 2, footprint: { w: 2, h: 1 }, color: 0xd8503f, accentColor: 0xf5d76e, solValue: 0.035 },
  MARKET_FRUITS: { type: 'market', label: 'fruits', variant: 1, height: 3, footprint: { w: 3, h: 2 }, color: 0xd8503f, accentColor: 0x8bc34a, solValue: 0.04 },
  MARKET_VEGETABLES: { type: 'market', label: 'vegetables', variant: 2, height: 3, footprint: { w: 3, h: 2 }, color: 0x5f8f3d, accentColor: 0xf0d090, solValue: 0.04 },
  MARKET_GAMES: { type: 'market', label: 'games', variant: 3, height: 3, footprint: { w: 3, h: 2 }, color: 0xd8503f, accentColor: 0xf0c040, solValue: 0.045 },
  MARKET_BAKERY: { type: 'market', label: 'bakery', variant: 4, height: 4, footprint: { w: 3, h: 3 }, color: 0xc06a32, accentColor: 0xf5d7a0, solValue: 0.055 },
  MARKET_DAIRY: { type: 'market', label: 'dairy', variant: 5, height: 4, footprint: { w: 3, h: 3 }, color: 0xd8c8a8, accentColor: 0x4f78a8, solValue: 0.055 },
  TOWN_DOCK: { type: 'market', label: 'dock', variant: 6, height: 4, footprint: { w: 4, h: 3 }, color: 0x8b5a2b, accentColor: 0x4f78a8, solValue: 0.06 },
  FOUNTAIN: { type: 'fountain', label: 'fountain', variant: 0, height: 2, footprint: { w: 2, h: 2 }, color: 0x8fb8d8, accentColor: 0x5ee7ff, solValue: 0.045 },
  FLOWER_GARDEN: { type: 'garden', label: 'garden', variant: 0, height: 1, footprint: { w: 2, h: 2 }, color: 0x55b85a, accentColor: 0xff7ab6, solValue: 0.018 },
  TOWN_GARDEN: { type: 'garden', label: 'garden park', variant: 1, height: 2, footprint: { w: 4, h: 3 }, color: 0x55b85a, accentColor: 0xffd45a, solValue: 0.04 },
  DECOR_BARREL: { type: 'decoration', label: 'barrel', variant: 0, height: 1, footprint: { w: 1, h: 1 }, color: 0x9a6236, accentColor: 0x49301f, solValue: 0.002 },
  DECOR_BENCH: { type: 'decoration', label: 'bench', variant: 1, height: 1, footprint: { w: 2, h: 1 }, color: 0xb87536, accentColor: 0x3d2a1f, solValue: 0.004 },
  DECOR_BUSH: { type: 'decoration', label: 'flower bush', variant: 2, height: 1, footprint: { w: 1, h: 1 }, color: 0x45a43b, accentColor: 0xff7b9d, solValue: 0.003 },
  DECOR_CRATE: { type: 'decoration', label: 'crate', variant: 3, height: 1, footprint: { w: 1, h: 1 }, color: 0xb87536, accentColor: 0x59351d, solValue: 0.002 },
  DECOR_FENCE: { type: 'decoration', label: 'garden fence', variant: 4, height: 1, footprint: { w: 2, h: 1 }, color: 0x9b6b40, accentColor: 0x4c321f, solValue: 0.003 },
  DECOR_LAMP: { type: 'decoration', label: 'garden lamp', variant: 5, height: 3, footprint: { w: 1, h: 1 }, color: 0x3b332b, accentColor: 0xffd769, solValue: 0.006 },
  DECOR_SIGN: { type: 'decoration', label: 'farm sign', variant: 6, height: 2, footprint: { w: 1, h: 1 }, color: 0xa76b32, accentColor: 0x4b2d18, solValue: 0.003 },
  DECOR_TREE: { type: 'decoration', label: 'ornamental tree', variant: 7, height: 4, footprint: { w: 1, h: 1 }, color: 0x3d8f31, accentColor: 0x77502d, solValue: 0.008 },
} as const satisfies Record<string, IsoObjectDef>

export const ISO_OBJECT_KEYS = Object.keys(ISO_OBJECTS)

export function worldToScreen(wx: number, wy: number, wz = 0, camX = 0, camY = 0) {
  const sx = (wx - wy) * TILE_HALF_W - camX
  const sy = (wx + wy) * TILE_HALF_H - wz * Z_SCALE - camY
  return { sx, sy }
}

export function screenToWorld(sx: number, sy: number, camX = 0, camY = 0) {
  const adjustedX = sx + camX
  const adjustedY = sy + camY
  const wx = Math.floor((adjustedX / TILE_HALF_W + adjustedY / TILE_HALF_H) / 2)
  const wy = Math.floor((adjustedY / TILE_HALF_H - adjustedX / TILE_HALF_W) / 2)
  return { wx, wy }
}

export function depthKey(wx: number, wy: number, wz = 0): number {
  return wx + wy - wz * 0.01
}

export function isoColor(n: number): string {
  return '#' + n.toString(16).padStart(6, '0')
}
