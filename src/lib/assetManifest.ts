import chickenUrl from '../assets/iso/generated/chicken.png?url'
import cowUrl from '../assets/iso/generated/cow.png?url'
import barnModelUrl from '../assets/iso/generated/barn_model.png?url'
import fenceWoodUrl from '../assets/iso/generated/fence_wood.png?url'
import decorBarrelUrl from '../assets/iso/decor/barrel.png?url'
import decorBushUrl from '../assets/iso/decor/bush.png?url'
import decorCrateUrl from '../assets/iso/decor/crate.png?url'
import decorFenceUrl from '../assets/iso/decor/fence.png?url'
import decorSignUrl from '../assets/iso/decor/sign.png?url'
import decorTreeUrl from '../assets/iso/decor/tree.png?url'
import houseUrl from '../assets/iso/generated/farm_house.png?url'
import marketBakeryUrl from '../assets/iso/generated/bakery_shop.png?url'
import marketDairyUrl from '../assets/iso/generated/dairy.png?url'
import marketFruitsUrl from '../assets/iso/generated/fruit_cart.png?url'
import marketVegetablesUrl from '../assets/iso/generated/vegetable_shop.png?url'
import playerSouthUrl from '../assets/iso/player_south.svg?url'
import townDockUrl from '../assets/iso/generated/fishing_dock.png?url'
import townhallUrl from '../assets/iso/generated/townhall.png?url'
import treeOakUrl from '../assets/iso/generated/tree.png?url'
import wheat0Url from '../assets/iso/wheat_0.svg?url'
import wheat1Url from '../assets/iso/wheat_1.svg?url'
import wheat2Url from '../assets/iso/wheat_2.svg?url'
import wheat3Url from '../assets/iso/wheat_3.svg?url'
import type { IsoObject } from './IsoWorld'

export type IsoAssetKey =
  | 'iso.house'
  | 'iso.building.barn'
  | 'iso.tree.oak'
  | 'iso.animal.chicken'
  | 'iso.animal.cow'
  | 'iso.townhall'
  | 'iso.market.fruits'
  | 'iso.market.vegetables'
  | 'iso.market.bakery'
  | 'iso.market.dairy'
  | 'iso.town.dock'
  | 'iso.decor.barrel'
  | 'iso.decor.bush'
  | 'iso.decor.crate'
  | 'iso.decor.fence'
  | 'iso.decor.fence_wood'
  | 'iso.decor.sign'
  | 'iso.decor.tree'
  | 'iso.crop.wheat.0'
  | 'iso.crop.wheat.1'
  | 'iso.crop.wheat.2'
  | 'iso.crop.wheat.3'
  | 'iso.player.south'

export type IsoAssetDef = {
  key: IsoAssetKey
  url: string
  width: number
  height: number
  originY: number
  scale: number
  offsetX?: number
  offsetY?: number
}

export const ISO_ASSETS: Record<IsoAssetKey, IsoAssetDef> = {
  'iso.house': { key: 'iso.house', url: houseUrl, width: 640, height: 640, originY: 0.94, scale: 0.34, offsetY: 7 },
  'iso.building.barn': { key: 'iso.building.barn', url: barnModelUrl, width: 768, height: 768, originY: 0.92, scale: 0.34, offsetY: 8 },
  'iso.tree.oak': { key: 'iso.tree.oak', url: treeOakUrl, width: 512, height: 512, originY: 0.91, scale: 0.3 },
  'iso.animal.chicken': { key: 'iso.animal.chicken', url: chickenUrl, width: 384, height: 384, originY: 0.9, scale: 0.2, offsetY: 3 },
  'iso.animal.cow': { key: 'iso.animal.cow', url: cowUrl, width: 512, height: 512, originY: 0.9, scale: 0.27, offsetY: 4 },
  'iso.townhall': { key: 'iso.townhall', url: townhallUrl, width: 768, height: 768, originY: 0.93, scale: 0.42, offsetY: 7 },
  'iso.market.fruits': { key: 'iso.market.fruits', url: marketFruitsUrl, width: 512, height: 512, originY: 0.9, scale: 0.32, offsetY: 5 },
  'iso.market.vegetables': { key: 'iso.market.vegetables', url: marketVegetablesUrl, width: 768, height: 768, originY: 0.94, scale: 0.3, offsetY: 8 },
  'iso.market.bakery': { key: 'iso.market.bakery', url: marketBakeryUrl, width: 640, height: 640, originY: 0.91, scale: 0.34, offsetY: 6 },
  'iso.market.dairy': { key: 'iso.market.dairy', url: marketDairyUrl, width: 640, height: 640, originY: 0.91, scale: 0.34, offsetY: 6 },
  'iso.town.dock': { key: 'iso.town.dock', url: townDockUrl, width: 640, height: 640, originY: 0.91, scale: 0.36, offsetY: 8 },
  'iso.decor.barrel': { key: 'iso.decor.barrel', url: decorBarrelUrl, width: 86, height: 95, originY: 0.88, scale: 0.5, offsetY: 3 },
  'iso.decor.bush': { key: 'iso.decor.bush', url: decorBushUrl, width: 112, height: 78, originY: 0.86, scale: 0.48, offsetY: 2 },
  'iso.decor.crate': { key: 'iso.decor.crate', url: decorCrateUrl, width: 92, height: 73, originY: 0.86, scale: 0.5, offsetY: 2 },
  'iso.decor.fence': { key: 'iso.decor.fence', url: decorFenceUrl, width: 128, height: 82, originY: 0.86, scale: 0.55, offsetY: 2 },
  'iso.decor.fence_wood': { key: 'iso.decor.fence_wood', url: fenceWoodUrl, width: 512, height: 512, originY: 0.88, scale: 0.2, offsetY: 3 },
  'iso.decor.sign': { key: 'iso.decor.sign', url: decorSignUrl, width: 96, height: 152, originY: 0.9, scale: 0.42, offsetY: 2 },
  'iso.decor.tree': { key: 'iso.decor.tree', url: decorTreeUrl, width: 150, height: 206, originY: 0.91, scale: 0.48, offsetY: 2 },
  'iso.crop.wheat.0': { key: 'iso.crop.wheat.0', url: wheat0Url, width: 128, height: 74, originY: 0.78, scale: 0.78 },
  'iso.crop.wheat.1': { key: 'iso.crop.wheat.1', url: wheat1Url, width: 128, height: 84, originY: 0.8, scale: 0.78 },
  'iso.crop.wheat.2': { key: 'iso.crop.wheat.2', url: wheat2Url, width: 128, height: 94, originY: 0.82, scale: 0.78 },
  'iso.crop.wheat.3': { key: 'iso.crop.wheat.3', url: wheat3Url, width: 128, height: 100, originY: 0.84, scale: 0.78 },
  'iso.player.south': { key: 'iso.player.south', url: playerSouthUrl, width: 64, height: 86, originY: 0.9, scale: 0.66 },
}

export const ISO_ASSET_LIST = Object.values(ISO_ASSETS)

export function getObjectAssetKey(obj: IsoObject): IsoAssetKey | null {
  if (obj.key === 'HOUSE') return 'iso.house'
  if (obj.key === 'BARN') return 'iso.building.barn'
  if (obj.key === 'TREE_OAK') return 'iso.tree.oak'
  if (obj.key === 'CHICKEN') return 'iso.animal.chicken'
  if (obj.key === 'COW') return 'iso.animal.cow'
  if (obj.key === 'TOWNHALL') return 'iso.townhall'
  if (obj.key === 'MARKET_FRUITS') return 'iso.market.fruits'
  if (obj.key === 'MARKET_VEGETABLES') return 'iso.market.vegetables'
  if (obj.key === 'MARKET_BAKERY') return 'iso.market.bakery'
  if (obj.key === 'MARKET_DAIRY') return 'iso.market.dairy'
  if (obj.key === 'TOWN_DOCK') return 'iso.town.dock'
  if (obj.key === 'DECOR_BARREL') return 'iso.decor.barrel'
  if (obj.key === 'DECOR_BUSH') return 'iso.decor.bush'
  if (obj.key === 'DECOR_CRATE') return 'iso.decor.crate'
  if (obj.key === 'DECOR_FENCE') return 'iso.decor.fence_wood'
  if (obj.key === 'FENCE') return 'iso.decor.fence_wood'
  if (obj.key === 'DECOR_SIGN') return 'iso.decor.sign'
  if (obj.key === 'DECOR_TREE') return 'iso.decor.tree'
  if (obj.key === 'CROP_WHEAT') {
    const stage = Math.max(0, Math.min(3, Math.round(obj.variant))) as 0 | 1 | 2 | 3
    return `iso.crop.wheat.${stage}` as IsoAssetKey
  }
  return null
}
