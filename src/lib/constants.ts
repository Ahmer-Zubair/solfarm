export type BlockType = {
  id: number
  name: string
  color: number   // Phaser hex
  topColor?: number
  sideColor?: number
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary'
  hardness: number   // mining ticks
  mineable: boolean
  placeable: boolean
  glows?: boolean
  glowColor?: number
  solValue: number   // approximate SOL value when minted as NFT
}

export const BLOCKS: Record<number, BlockType> = {
  0: { id: 0, name: 'air',      color: 0x000000, rarity: 'common',    hardness: 0,  mineable: false, placeable: false, solValue: 0 },
  1: { id: 1, name: 'grass',    color: 0x4a7c2f, topColor: 0x6ab740, sideColor: 0x5a6a3a, rarity: 'common', hardness: 1, mineable: true,  placeable: true,  solValue: 0.001 },
  2: { id: 2, name: 'dirt',     color: 0x7a5230, rarity: 'common',    hardness: 1,  mineable: true,  placeable: true,  solValue: 0.0005 },
  3: { id: 3, name: 'stone',    color: 0x666666, rarity: 'common',    hardness: 3,  mineable: true,  placeable: true,  solValue: 0.001 },
  4: { id: 4, name: 'sand',     color: 0xc8b560, rarity: 'common',    hardness: 1,  mineable: true,  placeable: true,  solValue: 0.0008 },
  5: { id: 5, name: 'wood',     color: 0x7a5518, rarity: 'common',    hardness: 2,  mineable: true,  placeable: true,  solValue: 0.002 },
  6: { id: 6, name: 'leaves',   color: 0x2d7a1b, rarity: 'common',    hardness: 1,  mineable: true,  placeable: true,  solValue: 0.0005 },
  7: { id: 7, name: 'water',    color: 0x1e5ba8, rarity: 'common',    hardness: 0,  mineable: false, placeable: false, solValue: 0 },
  8: { id: 8, name: 'lava',     color: 0xcc3300, rarity: 'uncommon',  hardness: 0,  mineable: false, placeable: false, glows: true, glowColor: 0xff5500, solValue: 0 },
  9: { id: 9, name: 'coal',     color: 0x333333, rarity: 'common',    hardness: 3,  mineable: true,  placeable: true,  solValue: 0.003 },
  10:{ id:10, name: 'iron',     color: 0xaa8866, rarity: 'uncommon',  hardness: 4,  mineable: true,  placeable: true,  solValue: 0.008 },
  11:{ id:11, name: 'gold',     color: 0xf0c040, rarity: 'rare',      hardness: 5,  mineable: true,  placeable: true,  solValue: 0.025 },
  12:{ id:12, name: 'diamond',  color: 0x5cedf0, rarity: 'legendary', hardness: 8,  mineable: true,  placeable: true,  glows: true, glowColor: 0x5cedf0, solValue: 0.1 },
  13:{ id:13, name: 'obsidian', color: 0x1a0a2e, rarity: 'rare',      hardness: 10, mineable: true,  placeable: true,  solValue: 0.05 },
  14:{ id:14, name: 'glowstone',color: 0xffd966, rarity: 'rare',      hardness: 2,  mineable: true,  placeable: true,  glows: true, glowColor: 0xffcc00, solValue: 0.04 },
  15:{ id:15, name: 'bedrock',  color: 0x222222, rarity: 'legendary', hardness: 999,mineable: false, placeable: false, solValue: 0 },
}

export const PLACEABLE_BLOCKS = Object.values(BLOCKS).filter(b => b.placeable)

export const WORLD_WIDTH  = 256  // blocks
export const WORLD_HEIGHT = 128  // blocks
export const BLOCK_SIZE   = 16   // px
export const CHUNK_SIZE   = 16   // blocks per chunk side

export const GRAVITY        = 0.4
export const JUMP_FORCE     = -8
export const MOVE_SPEED     = 3
export const MINE_TICK_MS   = 150  // ms per mining progress tick

export const RARITY_COLORS: Record<string, string> = {
  common:    '#8892a4',
  uncommon:  '#4ade80',
  rare:      '#60a5fa',
  legendary: '#f0c040',
}

export const BIOMES = {
  plains:  { surfaceBlock: 1, subsurface: 2, deep: 3, treeChance: 0.08 },
  desert:  { surfaceBlock: 4, subsurface: 4, deep: 3, treeChance: 0.02 },
  forest:  { surfaceBlock: 1, subsurface: 2, deep: 3, treeChance: 0.25 },
} as const
