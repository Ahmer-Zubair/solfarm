export type CropType =
  | 'wheat'
  | 'corn'
  | 'strawberry'
  | 'pumpkin'
  | 'carrot'
  | 'tomato'
  | 'sunflower'

export type CropDefinition = {
  type: CropType
  label: string
  objectKey: string
  growMinutes: number
  seedCost: number
  sellValue: number
  xp: number
  color: string
  symbol: string
}

export const FARM_CROPS: Record<CropType, CropDefinition> = {
  wheat: { type: 'wheat', label: 'Wheat', objectKey: 'CROP_WHEAT', growMinutes: 120, seedCost: 5, sellValue: 12, xp: 10, color: '#f5c842', symbol: 'WH' },
  corn: { type: 'corn', label: 'Corn', objectKey: 'CROP_CORN', growMinutes: 180, seedCost: 8, sellValue: 20, xp: 15, color: '#ffd700', symbol: 'CO' },
  strawberry: { type: 'strawberry', label: 'Strawberry', objectKey: 'CROP_STRAWBERRY', growMinutes: 240, seedCost: 12, sellValue: 30, xp: 20, color: '#ff5277', symbol: 'ST' },
  pumpkin: { type: 'pumpkin', label: 'Pumpkin', objectKey: 'CROP_PUMPKIN', growMinutes: 360, seedCost: 15, sellValue: 45, xp: 30, color: '#ff8c00', symbol: 'PU' },
  carrot: { type: 'carrot', label: 'Carrot', objectKey: 'CROP_CARROT', growMinutes: 150, seedCost: 6, sellValue: 15, xp: 12, color: '#ff6b35', symbol: 'CA' },
  tomato: { type: 'tomato', label: 'Tomato', objectKey: 'CROP_TOMATO', growMinutes: 210, seedCost: 10, sellValue: 25, xp: 18, color: '#dc4141', symbol: 'TO' },
  sunflower: { type: 'sunflower', label: 'Sunflower', objectKey: 'CROP_SUNFLOWER', growMinutes: 300, seedCost: 18, sellValue: 55, xp: 35, color: '#ffb800', symbol: 'SU' },
}

export const FARM_CROP_LIST = Object.values(FARM_CROPS)

export const CROP_TYPE_BY_OBJECT_KEY = Object.fromEntries(
  FARM_CROP_LIST.map((crop) => [crop.objectKey, crop.type]),
) as Record<string, CropType>

export const FARMER_PROFESSIONS = {
  'farmer-sage': {
    name: 'Eldara',
    title: 'The Herbalist',
    bonus: 'Crops grow 20% faster',
    growMultiplier: 0.8,
    sellMultiplier: 1,
    xpMultiplier: 1,
    buildMultiplier: 1,
    accent: '#6fcf97',
  },
  'farmer-sun': {
    name: 'Kael',
    title: 'The Ironhand',
    bonus: 'Buildings cost 15% less',
    growMultiplier: 1,
    sellMultiplier: 1,
    xpMultiplier: 1,
    buildMultiplier: 0.85,
    accent: '#56ccf2',
  },
  'farmer-rose': {
    name: 'Mira',
    title: 'The Merchant',
    bonus: 'Harvest sales earn 25% more',
    growMultiplier: 1,
    sellMultiplier: 1.25,
    xpMultiplier: 1,
    buildMultiplier: 1,
    accent: '#f2994a',
  },
  'farmer-river': {
    name: 'Renn',
    title: 'The Wanderer',
    bonus: 'Earn double farming XP',
    growMultiplier: 1,
    sellMultiplier: 1,
    xpMultiplier: 2,
    buildMultiplier: 1,
    accent: '#bb6bd9',
  },
} as const

