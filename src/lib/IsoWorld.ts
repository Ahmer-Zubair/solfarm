import { ISO_OBJECTS, ISO_TILES, ISO_WORLD_H, ISO_WORLD_W, type IsoObjectDef } from './IsoConstants'

export const FARM_PORTAL = { x: 3, y: 3 } as const
export const TOWN_PORTAL = { x: 18, y: 16 } as const

export type IsoObject = {
  type: IsoObjectDef['type']
  variant: number
  height: number
  key: string
  footprint: { w: number; h: number }
  anchorX: number
  anchorY: number
  color: number
  accentColor: number
  health: number
}

export type IsoTile = {
  base: number
  height: number
  object: IsoObject | null
  occupiedBy: { x: number; y: number } | null
  owner: string | null
  isMinted: boolean
}

function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 0xffffffff
  }
}

function noise(seed: number, x: number, y: number) {
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed * 37.719) * 43758.5453
  return n - Math.floor(n)
}

function objectFromKey(key: keyof typeof ISO_OBJECTS): IsoObject {
  const def = ISO_OBJECTS[key]
  return {
    type: def.type,
    variant: def.variant,
    height: def.height,
    key,
    footprint: def.footprint,
    anchorX: 0,
    anchorY: 0,
    color: def.color,
    accentColor: def.accentColor,
    health: 100,
  }
}

function clearObjectAt(world: IsoTile[][], wx: number, wy: number) {
  const next = placeIsoObject(world, wx, wy, null)
  world.splice(0, world.length, ...next)
}

function clearArea(world: IsoTile[][], x1: number, y1: number, x2: number, y2: number) {
  for (let y = y1; y <= y2; y += 1) {
    for (let x = x1; x <= x2; x += 1) {
      const tile = world[y]?.[x]
      if (!tile) continue
      if (tile.object) clearObjectAt(world, x, y)
      tile.occupiedBy = null
    }
  }
}

function setTileArea(world: IsoTile[][], x1: number, y1: number, x2: number, y2: number, base: number, height = 1) {
  for (let y = y1; y <= y2; y += 1) {
    for (let x = x1; x <= x2; x += 1) {
      const tile = world[y]?.[x]
      if (!tile) continue
      tile.base = base
      tile.height = height
    }
  }
}

function carveStarterFarmstead(world: IsoTile[][]) {
  clearArea(world, 10, 9, 22, 22)
  setTileArea(world, 10, 9, 22, 22, ISO_TILES.GRASS.id, 1)
  setTileArea(world, 11, 16, 21, 16, ISO_TILES.PATH.id, 1)
  setTileArea(world, 15, 10, 15, 21, ISO_TILES.PATH.id, 1)
  setTileArea(world, 11, 18, 14, 21, ISO_TILES.DIRT.id, 1)
  setTileArea(world, 17, 18, 20, 21, ISO_TILES.DIRT.id, 1)
  setTileArea(world, 12, 11, 18, 14, ISO_TILES.GRASS.id, 1)

  const setObj = (x: number, y: number, key: keyof typeof ISO_OBJECTS) => {
    const next = placeIsoObject(world, x, y, objectFromKey(key))
    world.splice(0, world.length, ...next)
  }

  setObj(13, 11, 'HOUSE')
  setObj(18, 11, 'WELL')
  setObj(19, 14, 'CHEST')
  setObj(11, 15, 'LAMP_POST')
  setObj(19, 16, 'LAMP_POST')
  setObj(21, 14, 'CHEST')
  setObj(21, 15, 'LAMP_POST')
  setObj(12, 20, 'CHICKEN')
  setObj(14, 20, 'CHICKEN')
  setObj(18, 20, 'SHEEP')
  setObj(20, 20, 'SHEEP')

  for (let x = 10; x <= 21; x += 1) {
    if (x !== 15) {
      setObj(x, 9, 'FENCE')
      setObj(x, 22, 'FENCE')
    }
  }
  for (let y = 10; y <= 21; y += 1) {
    if (y !== 16) {
      setObj(9, y, 'FENCE')
      setObj(22, y, 'FENCE')
    }
  }

  setObj(11, 18, 'CROP_WHEAT')
  setObj(17, 18, 'CROP_CORN')
  setObj(20, 10, 'TREE_APPLE')
  setObj(11, 10, 'TREE_OAK')
}

export function applyStarterFarmstead(world: IsoTile[][]): IsoTile[][] {
  const next = world.map((row) => row.map((tile) => ({ ...tile, occupiedBy: tile.occupiedBy ? { ...tile.occupiedBy } : null, object: tile.object ? { ...tile.object, footprint: { ...tile.object.footprint } } : null })))
  carveStarterFarmstead(next)
  return next
}

export function createTownPlazaWorld(): IsoTile[][] {
  const world: IsoTile[][] = []
  for (let y = 0; y < ISO_WORLD_H; y += 1) {
    const row: IsoTile[] = []
    for (let x = 0; x < ISO_WORLD_W; x += 1) {
      const waterEdge = x < 2 || y < 2 || x > 29 || y > 28 || (x > 25 && y > 22) || (x < 5 && y > 25)
      row.push({
        base: waterEdge ? ISO_TILES.WATER.id : ISO_TILES.GRASS.id,
        height: waterEdge ? 0 : 1,
        object: null,
        occupiedBy: null,
        owner: null,
        isMinted: false,
      })
    }
    world.push(row)
  }

  clearArea(world, 2, 2, 29, 28)
  setTileArea(world, 2, 2, 29, 28, ISO_TILES.GRASS.id, 1)
  setTileArea(world, 0, 29, 31, 31, ISO_TILES.WATER.id, 0)
  setTileArea(world, 26, 23, 31, 31, ISO_TILES.WATER.id, 0)
  setTileArea(world, 0, 26, 4, 31, ISO_TILES.WATER.id, 0)

  // Deliberate reference composition: a symmetrical civic cross around the fountain.
  setTileArea(world, 11, 11, 21, 21, ISO_TILES.STONE.id, 1)
  setTileArea(world, 14, 13, 18, 18, ISO_TILES.WATER.id, 0)
  setTileArea(world, 15, 14, 17, 17, ISO_TILES.STONE.id, 1)
  setTileArea(world, 13, 10, 19, 12, ISO_TILES.PATH.id, 1)
  setTileArea(world, 13, 19, 19, 25, ISO_TILES.PATH.id, 1)
  setTileArea(world, 6, 14, 12, 17, ISO_TILES.PATH.id, 1)
  setTileArea(world, 20, 14, 26, 17, ISO_TILES.PATH.id, 1)

  // Building approaches and market lanes.
  setTileArea(world, 3, 6, 11, 13, ISO_TILES.PATH.id, 1)
  setTileArea(world, 14, 3, 22, 9, ISO_TILES.PATH.id, 1)
  setTileArea(world, 3, 12, 9, 19, ISO_TILES.GRASS.id, 1)
  setTileArea(world, 4, 19, 14, 27, ISO_TILES.PATH.id, 1)
  setTileArea(world, 16, 22, 22, 27, ISO_TILES.PATH.id, 1)
  setTileArea(world, 21, 20, 27, 25, ISO_TILES.PATH.id, 1)
  setTileArea(world, 26, 23, 30, 28, ISO_TILES.WATER.id, 0)
  setTileArea(world, 24, 22, 27, 24, ISO_TILES.PATH.id, 1)

  const setObj = (x: number, y: number, key: keyof typeof ISO_OBJECTS) => {
    const next = placeIsoObject(world, x, y, objectFromKey(key))
    world.splice(0, world.length, ...next)
  }

  // Reference placement: bakery/town hall north, markets south, dock on the southeast shoreline.
  setObj(6, 9, 'MARKET_BAKERY')
  setObj(20, 5, 'TOWNHALL')
  setObj(5, 20, 'MARKET_FRUITS')
  setObj(9, 23, 'MARKET_VEGETABLES')
  setObj(17, 23, 'MARKET_DAIRY')
  setObj(27, 23, 'TOWN_DOCK')

  // Centerpiece and formal north garden.
  setObj(15, 14, 'FOUNTAIN')
  setObj(14, 8, 'TOWN_GARDEN')
  setObj(11, 11, 'FLOWER_GARDEN')
  setObj(20, 11, 'FLOWER_GARDEN')
  setObj(8, 18, 'FLOWER_GARDEN')
  setObj(21, 18, 'FLOWER_GARDEN')

  // The former farmhouse plot is now a green chicken meadow.
  setObj(4, 14, 'CHICKEN')
  setObj(6, 15, 'CHICKEN')
  setObj(5, 17, 'CHICKEN')
  setObj(8, 16, 'CHICKEN')
  setObj(19, 13, 'CHICKEN')
  setObj(20, 19, 'CHICKEN')
  setObj(11, 17, 'CHICKEN')
  // Cow removed from town portal area
  setObj(21, 20, 'CHICKEN')

  // Practical props follow the roads without covering buildings.
  setObj(10, 12, 'DECOR_TREE')
  setObj(22, 12, 'DECOR_TREE')
  setObj(10, 19, 'DECOR_BUSH')
  setObj(24, 18, 'DECOR_BUSH')
  setObj(4, 21, 'WELL')
  setObj(3, 20, 'DECOR_BARREL')
  setObj(15, 25, 'DECOR_CRATE')
  setObj(22, 25, 'DECOR_BARREL')
  setObj(8, 22, 'DECOR_SIGN')
  setObj(13, 25, 'DECOR_SIGN')

  // Fences are intentionally limited to the chicken meadow so the town stays open.
  const fenceCoords: [number, number][] = [
    [3, 12], [4, 12], [5, 12], [6, 12], [7, 12], [8, 12], [9, 12],
    [3, 19], [4, 19], [5, 19], [6, 19], [7, 19], [8, 19], [9, 19],
    [3, 13], [3, 14], [3, 15], [3, 16], [3, 17], [3, 18],
    [9, 13], [9, 14], [9, 15], [9, 17], [9, 18],
  ]
  fenceCoords.forEach(([x, y]) => setObj(x, y, 'DECOR_FENCE'))

  // Hand-grouped tree line. These positions are fixed, not procedurally scattered.
  ;([
    [3, 4, 'TREE_OAK'], [4, 5, 'TREE_OAK'], [8, 3, 'TREE_OAK'], [11, 5, 'TREE_OAK'],
    [14, 3, 'TREE_OAK'], [17, 2, 'TREE_OAK'], [25, 4, 'TREE_OAK'], [28, 5, 'TREE_OAK'],
    [28, 9, 'TREE_OAK'], [29, 14, 'TREE_OAK'], [28, 18, 'TREE_OAK'], [27, 21, 'TREE_OAK'],
    [3, 9, 'TREE_OAK'], [2, 11, 'TREE_OAK'], [2, 22, 'TREE_OAK'], [3, 24, 'TREE_OAK'],
    [6, 28, 'TREE_OAK'], [10, 28, 'TREE_OAK'], [14, 28, 'TREE_OAK'], [20, 28, 'TREE_OAK'],
  ] as [number, number, keyof typeof ISO_OBJECTS][]).forEach(([x, y, key]) => setObj(x, y, key))

  ;([
    [8, 6], [10, 8], [21, 8], [24, 10], [8, 13], [23, 13],
    [8, 18], [23, 18], [21, 27], [25, 19], [7, 25], [14, 23],
  ] as [number, number][]).forEach(([x, y]) => setObj(x, y, 'DECOR_BUSH'))

  ;([
    [4, 8], [11, 6], [26, 9], [27, 17], [3, 23], [14, 26],
  ] as [number, number][]).forEach(([x, y]) => setObj(x, y, 'DECOR_TREE'))

  setObj(TOWN_PORTAL.x, TOWN_PORTAL.y, 'TRAVEL_PORTAL')

  return world
}

export function generateIsoWorld(seed: number): IsoTile[][] {
  void seed
  const world = Array.from({ length: ISO_WORLD_H }, () =>
    Array.from({ length: ISO_WORLD_W }, () => ({
      base: ISO_TILES.GRASS.id,
      height: 1,
      object: null,
      occupiedBy: null,
      owner: null,
      isMinted: false,
    })),
  )
  return ensureFarmPortal(world)
}

export function ensureFarmPortal(world: IsoTile[][]): IsoTile[][] {
  const tile = world[FARM_PORTAL.y]?.[FARM_PORTAL.x]
  if (!tile || tile.object?.key === 'TRAVEL_PORTAL') return world
  const cleared = placeIsoObject(world, FARM_PORTAL.x, FARM_PORTAL.y, null)
  cleared[FARM_PORTAL.y][FARM_PORTAL.x] = {
    ...cleared[FARM_PORTAL.y][FARM_PORTAL.x],
    base: ISO_TILES.STONE.id,
    height: 1,
  }
  return placeIsoObject(cleared, FARM_PORTAL.x, FARM_PORTAL.y, objectFromKey('TRAVEL_PORTAL'))
}

export function getIsoTile(world: IsoTile[][] | null, wx: number, wy: number): IsoTile | null {
  if (!world || wx < 0 || wy < 0 || wx >= ISO_WORLD_W || wy >= ISO_WORLD_H) return null
  return world[wy][wx]
}

export function setIsoTile(world: IsoTile[][], wx: number, wy: number, patch: Partial<IsoTile>): IsoTile[][] {
  return world.map((row, y) => row.map((tile, x) => (x === wx && y === wy ? { ...tile, ...patch } : tile)))
}

export function placeIsoObject(world: IsoTile[][], wx: number, wy: number, object: IsoObject | null): IsoTile[][] {
  const next = world.map((row) => row.map((tile) => ({ ...tile, occupiedBy: tile.occupiedBy && tile.occupiedBy.x === wx && tile.occupiedBy.y === wy ? null : tile.occupiedBy })))
  for (let y = 0; y < ISO_WORLD_H; y += 1) {
    for (let x = 0; x < ISO_WORLD_W; x += 1) {
      if (next[y][x].object?.anchorX === wx && next[y][x].object?.anchorY === wy) next[y][x].object = null
    }
  }
  if (!object) return setIsoTile(next, wx, wy, { object: null, occupiedBy: null })

  const placed = { ...object, anchorX: wx, anchorY: wy }
  for (let y = wy; y < Math.min(ISO_WORLD_H, wy + object.footprint.h); y += 1) {
    for (let x = wx; x < Math.min(ISO_WORLD_W, wx + object.footprint.w); x += 1) {
      next[y][x] = { ...next[y][x], occupiedBy: { x: wx, y: wy } }
    }
  }
  next[wy][wx] = { ...next[wy][wx], object: placed, occupiedBy: null }
  return next
}

export function createIsoObject(key: string | null): IsoObject | null {
  if (!key || !(key in ISO_OBJECTS)) return null
  return objectFromKey(key as keyof typeof ISO_OBJECTS)
}
