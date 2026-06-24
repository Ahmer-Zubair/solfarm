import { WORLD_WIDTH, WORLD_HEIGHT, BLOCKS } from './constants'

// Simple seeded pseudo-Perlin noise
function seededRand(seed: number) {
  let s = seed
  return function () {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

function interpolate(a: number, b: number, t: number) {
  const f = t * t * (3 - 2 * t)
  return a + f * (b - a)
}

function noise1D(x: number, scale: number, seed: number): number {
  const rand = seededRand(seed)
  const points: number[] = []
  for (let i = 0; i < Math.ceil(WORLD_WIDTH / scale) + 2; i++) {
    points.push(rand())
  }
  const idx = x / scale
  const i0 = Math.floor(idx)
  const t = idx - i0
  return interpolate(points[i0] || 0, points[i0 + 1] || 0, t)
}

function fractalNoise(x: number, seed: number): number {
  return (
    noise1D(x, 64, seed) * 0.5 +
    noise1D(x, 32, seed + 1) * 0.3 +
    noise1D(x, 16, seed + 2) * 0.15 +
    noise1D(x,  8, seed + 3) * 0.05
  )
}

function caveNoise(x: number, y: number, seed: number): boolean {
  const rand = seededRand((x * 73856093) ^ (y * 19349663) ^ seed)
  rand(); rand()
  return rand() < 0.04
}

export function generateWorld(seed: number): Uint8Array {
  const world = new Uint8Array(WORLD_WIDTH * WORLD_HEIGHT)
  const rand = seededRand(seed + 9999)

  // Surface heights
  const heights: number[] = []
  const baseHeight = Math.floor(WORLD_HEIGHT * 0.45)
  for (let x = 0; x < WORLD_WIDTH; x++) {
    const n = fractalNoise(x, seed)
    heights.push(Math.floor(baseHeight + n * 30 - 15))
  }

  // Biome assignment (simple)
  const biomeNoise = Array.from({ length: WORLD_WIDTH }, (_, x) => noise1D(x, 80, seed + 42))

  const fill = (x: number, y: number, block: number) => {
    if (x >= 0 && x < WORLD_WIDTH && y >= 0 && y < WORLD_HEIGHT) {
      world[y * WORLD_WIDTH + x] = block
    }
  }

  const get = (x: number, y: number): number => {
    if (x < 0 || x >= WORLD_WIDTH || y < 0 || y >= WORLD_HEIGHT) return 0
    return world[y * WORLD_WIDTH + x]
  }

  // Terrain pass
  for (let x = 0; x < WORLD_WIDTH; x++) {
    const surf = heights[x]
    const bn = biomeNoise[x]
    const isDesert = bn > 0.65
    const isForest = bn < 0.35

    for (let y = 0; y < WORLD_HEIGHT; y++) {
      if (y >= WORLD_HEIGHT - 2) {
        fill(x, y, 15) // bedrock
      } else if (y > surf) {
        // below surface — stone
        fill(x, y, 3)
      } else if (y === surf) {
        fill(x, y, isDesert ? 4 : 1) // grass or sand
      } else if (y > surf - 4) {
        fill(x, y, isDesert ? 4 : 2) // dirt or sand
      } else if (y < surf) {
        // air
        fill(x, y, 0)
      }
    }

    // Trees in forest/plains
    const treeChance = isForest ? 0.18 : 0.06
    if (!isDesert && rand() < treeChance && surf > 5 && surf < WORLD_HEIGHT - 20) {
      const treeHeight = 4 + Math.floor(rand() * 3)
      for (let t = 0; t < treeHeight; t++) {
        fill(x, surf - 1 - t, 5)
      }
      // Leaves
      for (let ly = surf - treeHeight - 2; ly <= surf - treeHeight + 1; ly++) {
        for (let lx = x - 2; lx <= x + 2; lx++) {
          if (get(lx, ly) === 0) fill(lx, ly, 6)
        }
      }
    }
  }

  // Water fill for low areas
  const seaLevel = Math.floor(WORLD_HEIGHT * 0.5)
  for (let x = 0; x < WORLD_WIDTH; x++) {
    for (let y = heights[x] + 1; y <= seaLevel; y++) {
      if (get(x, y) === 0) fill(x, y, 7)
    }
  }

  // Cave pass
  for (let x = 2; x < WORLD_WIDTH - 2; x++) {
    for (let y = heights[x] + 4; y < WORLD_HEIGHT - 3; y++) {
      if (get(x, y) === 3 && caveNoise(x, y, seed)) {
        fill(x, y, 0)
        // Small cave extension
        const caveRand = seededRand((x * 31337) ^ y ^ seed)
        caveRand()
        const ext = Math.floor(caveRand() * 3)
        for (let e = 1; e <= ext; e++) {
          if (get(x + e, y) === 3) fill(x + e, y, 0)
        }
      }
    }
  }

  // Lava in deep caves
  for (let x = 2; x < WORLD_WIDTH - 2; x++) {
    for (let y = Math.floor(WORLD_HEIGHT * 0.8); y < WORLD_HEIGHT - 3; y++) {
      if (get(x, y) === 0) fill(x, y, 8) // lava
    }
  }

  // Ore veins
  const oreRand = seededRand(seed + 777)
  function placeVein(blockId: number, count: number, minDepth: number, maxDepth: number) {
    for (let i = 0; i < count; i++) {
      const vx = Math.floor(oreRand() * (WORLD_WIDTH - 4)) + 2
      const vy = minDepth + Math.floor(oreRand() * (maxDepth - minDepth))
      const size = 2 + Math.floor(oreRand() * 4)
      for (let s = 0; s < size; s++) {
        const ox = vx + Math.floor(oreRand() * 3 - 1)
        const oy = vy + Math.floor(oreRand() * 3 - 1)
        if (get(ox, oy) === 3) fill(ox, oy, blockId)
      }
    }
  }

  const base = Math.floor(WORLD_HEIGHT * 0.5)
  placeVein(9,  60, base + 2, WORLD_HEIGHT - 10)   // coal
  placeVein(10, 40, base + 5, WORLD_HEIGHT - 8)    // iron
  placeVein(11, 20, base + 15, WORLD_HEIGHT - 6)   // gold
  placeVein(12, 8,  base + 25, WORLD_HEIGHT - 4)   // diamond
  placeVein(13, 12, base + 20, WORLD_HEIGHT - 5)   // obsidian
  placeVein(14, 10, base + 10, WORLD_HEIGHT - 8)   // glowstone

  return world
}

export function getBlock(world: Uint8Array, x: number, y: number): number {
  if (x < 0 || x >= WORLD_WIDTH || y < 0 || y >= WORLD_HEIGHT) return 0
  return world[y * WORLD_WIDTH + x]
}

export function setBlock(world: Uint8Array, x: number, y: number, blockId: number): void {
  if (x < 0 || x >= WORLD_WIDTH || y < 0 || y >= WORLD_HEIGHT) return
  world[y * WORLD_WIDTH + x] = blockId
}

export function findSpawnPoint(world: Uint8Array): { x: number; y: number } {
  const cx = Math.floor(WORLD_WIDTH / 2)
  for (let y = 0; y < WORLD_HEIGHT; y++) {
    if (getBlock(world, cx, y) !== 0 && getBlock(world, cx, y) !== 7) {
      return { x: cx * 16 + 8, y: (y - 2) * 16 }
    }
  }
  return { x: cx * 16 + 8, y: 200 }
}
