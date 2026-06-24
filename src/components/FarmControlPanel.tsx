import React, { useMemo, useState } from 'react'
import { FARM_CROP_LIST, FARMER_PROFESSIONS, type CropType } from '../lib/farmCatalog'
import { ISO_OBJECTS } from '../lib/IsoConstants'
import { ISO_ASSETS, type IsoAssetKey } from '../lib/assetManifest'
import { useGameStore } from '../stores/gameStore'
import { gameAudio } from '../lib/audio'
import wheatIcon from '../assets/ui/crop-icons/wheat.png'
import cornIcon from '../assets/ui/crop-icons/corn.png'
import strawberryIcon from '../assets/ui/crop-icons/strawberry.png'
import pumpkinIcon from '../assets/ui/crop-icons/pumpkin.png'
import carrotIcon from '../assets/ui/crop-icons/carrot.png'
import tomatoIcon from '../assets/ui/crop-icons/tomato.png'
import sunflowerIcon from '../assets/ui/crop-icons/sunflower.png'

type FarmAction = 'plant' | 'water' | 'harvest' | 'build' | 'shop' | 'animals'

const CROP_ICONS: Record<CropType, string> = {
  wheat: wheatIcon,
  corn: cornIcon,
  strawberry: strawberryIcon,
  pumpkin: pumpkinIcon,
  carrot: carrotIcon,
  tomato: tomatoIcon,
  sunflower: sunflowerIcon,
}

const BUILDINGS = [
  { key: 'BARN', label: 'Barn', cost: '10W / 4S / 28C', asset: 'iso.building.barn' as IsoAssetKey },
  { key: 'WINDMILL', label: 'Windmill', cost: '12W / 10S / 60C' },
  { key: 'WELL', label: 'Well', cost: '8S / 20C' },
  { key: 'FENCE', label: 'Fence', cost: '2W / 3C', asset: 'iso.decor.fence_wood' as IsoAssetKey },
  { key: 'FLOWER_GARDEN', label: 'Garden', cost: '3W / 2S / 12C' },
] as const

const DECORATIONS = [
  { key: 'DECOR_BARREL', label: 'Barrel', price: 35, asset: 'iso.decor.barrel' },
  { key: 'DECOR_BUSH', label: 'Bush', price: 45, asset: 'iso.decor.bush' },
  { key: 'DECOR_CRATE', label: 'Crate', price: 30, asset: 'iso.decor.crate' },
  { key: 'DECOR_FENCE', label: 'Fence', price: 25, asset: 'iso.decor.fence_wood' },
  { key: 'DECOR_SIGN', label: 'Sign', price: 55, asset: 'iso.decor.sign' },
  { key: 'DECOR_TREE', label: 'Tree', price: 110, asset: 'iso.decor.tree' },
] as const satisfies ReadonlyArray<{ key: keyof typeof ISO_OBJECTS; label: string; price: number; asset: IsoAssetKey }>

const LIVESTOCK = [
  { key: 'CHICKEN', label: 'Chicken', price: 90, detail: '1 egg / feed', asset: 'iso.animal.chicken' as IsoAssetKey },
  { key: 'COW', label: 'Cow', price: 240, detail: '1 milk / feed', asset: 'iso.animal.cow' as IsoAssetKey },
] as const satisfies ReadonlyArray<{ key: keyof typeof ISO_OBJECTS; label: string; price: number; detail: string; asset: IsoAssetKey }>

export default function FarmControlPanel() {
  const store = useGameStore()
  const [action, setAction] = useState<FarmAction>('plant')
  const [collapsed, setCollapsed] = useState(false)
  const profession = FARMER_PROFESSIONS[store.player.characterId]
  const plots = Object.values(store.cropPlots)
  const now = store.day * 1440 + store.minuteOfDay
  const growing = plots.filter((plot) => !plot.harvested && now < plot.readyAt).length
  const ready = plots.filter((plot) => !plot.harvested && now >= plot.readyAt).length
  const harvested = plots.filter((plot) => plot.harvested).length
  const xpLevel = Math.floor(store.farmXp / 120) + 1
  const level = Math.max(store.farmLevel, xpLevel)
  const xpWithinLevel = store.farmXp % 120
  const farmScore = Math.floor(store.farmXp / 8 + store.resources.coins / 4 + (growing + ready) * 4 + store.farmhouse.gardenScore)

  const target = store.selectedTile ?? { x: store.player.tileX, y: store.player.tileY }
  const selectedPlot = store.cropPlots[`${target.x},${target.y}`]
  const selectedAnimal = store.animals[`${target.x},${target.y}`]

  const selectAction = (next: FarmAction) => {
    setAction(next)
    gameAudio.unlock()
    if (next === 'water' || next === 'harvest' || next === 'animals') store.setGameMode('inspect')
    if (next === 'build' || next === 'shop') store.setGameMode('build')
  }

  const selectCrop = (type: CropType) => {
    const crop = FARM_CROP_LIST.find((item) => item.type === type)
    if (!crop) return
    setAction('plant')
    store.setGameMode('build')
    store.setSelectedObjectType(crop.objectKey)
    store.setSelectedActionLabel(`${crop.label} selected - stand on clear soil and press Plant`)
  }

  const performCropAction = () => {
    if (!selectedPlot) {
      store.setSelectedActionLabel('select a planted crop first')
      return
    }
    if (action === 'water') {
      if (!store.waterCrop(target.x, target.y)) store.setSelectedActionLabel('crop cannot be watered')
      return
    }
    if (action === 'harvest') {
      if (store.harvestCrop(target.x, target.y)) {
        store.placeObject(target.x, target.y, null)
        gameAudio.playBuild()
      } else {
        store.setSelectedActionLabel('crop is still growing')
      }
    }
  }

  const selectedCrop = useMemo(
    () => FARM_CROP_LIST.find((crop) => crop.objectKey === store.selectedObjectType),
    [store.selectedObjectType],
  )

  return (
    <aside className={`farm-console ${collapsed ? 'farm-console--collapsed' : ''}`}>
      <div className="farm-console__brand">
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '9px', color: '#4a5568' }}>ACTIVE FARM</span>
          <strong style={{ fontSize: '12px', color: '#fff' }}>{store.farmName}</strong>
        </div>
        <div className="farm-console__coins" style={{ color: '#f0c040', fontWeight: 'bold' }}>
          {store.resources.coins.toLocaleString()} C
        </div>
        <button
          className="farm-console__collapse"
          onClick={() => setCollapsed((value) => !value)}
          aria-label={collapsed ? 'Open farm controls' : 'Collapse farm controls'}
        >
          {collapsed ? '＋' : '✕'}
        </button>
      </div>

      <div className="farm-console__level">
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '3px' }}>
          <strong>LVL {level}</strong>
          <span>{xpWithinLevel}/120 XP</span>
        </div>
        <div className="farm-console__track" style={{ background: 'rgba(255,255,255,0.05)', height: '4px', borderRadius: '2px', overflow: 'hidden' }}>
          <i style={{ display: 'block', height: '100%', background: '#9ce55a', width: `${Math.min(100, xpWithinLevel / 1.2)}%`, transition: 'width 0.3s ease' }} />
        </div>
      </div>

      <div className="farm-console__tabs">
        {(['plant', 'water', 'harvest', 'build', 'shop', 'animals'] as FarmAction[]).map((item) => (
          <button key={item} className={action === item ? 'active' : ''} onClick={() => selectAction(item)}>
            {item}
          </button>
        ))}
      </div>

      <div className="farm-console__scroll" style={{ overflowY: 'auto', flex: 1, paddingRight: '2px' }}>
        {action === 'plant' && (
          <>
            <div className="farm-console__section">Select seed</div>
            <div className="farm-scroll-grid-container">
              {FARM_CROP_LIST.map((crop) => {
                const active = selectedCrop?.type === crop.type
                const sale = Math.round(crop.sellValue * profession.sellMultiplier)
                return (
                  <button key={crop.type} className={`farm-seed ${active ? 'active' : ''}`} onClick={() => selectCrop(crop.type)}>
                    <img className="farm-seed__icon" src={CROP_ICONS[crop.type]} alt="" />
                    <span>
                      <strong>{crop.label}</strong>
                      <small>{crop.seedCost}C / Sells {sale}C</small>
                    </span>
                    <em>+{Math.round(crop.xp * profession.xpMultiplier)} XP</em>
                  </button>
                )
              })}
            </div>
            <button
              className="farm-console__primary"
              disabled={!selectedCrop}
              onClick={() => window.dispatchEvent(new Event('solfarm:place-selected'))}
            >
              {selectedCrop ? `Plant ${selectedCrop.label}` : 'Select a seed'}
            </button>
          </>
        )}

        {(action === 'water' || action === 'harvest') && (
          <div className="farm-context-card">
            <div className="farm-console__section">Selected crop</div>
            {selectedPlot ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', marginBottom: '8px' }}>
                <strong style={{ color: '#9ce55a' }}>{FARM_CROPS_LABELS[selectedPlot.cropType]}</strong>
                <span style={{ fontSize: '11px' }}>
                  {now >= selectedPlot.readyAt
                    ? 'Ready to harvest'
                    : `${Math.max(0, selectedPlot.readyAt - now)} mins left`}
                </span>
                <small style={{ color: '#647084' }}>{selectedPlot.watered ? 'Watered' : 'Needs water'}{selectedPlot.mutation ? ` / ${selectedPlot.mutation}` : ''}</small>
              </div>
            ) : <span style={{ display: 'block', margin: '12px 0', fontSize: '11px', color: '#647084' }}>Click a crop tile to select it.</span>}
            <button className="farm-console__primary" onClick={performCropAction} disabled={!selectedPlot}>
              {action === 'water' ? 'Water Crop' : 'Harvest Crop'}
            </button>
          </div>
        )}

        {action === 'build' && (
          <>
            <div className="farm-console__section">Buildings</div>
            <div className="farm-scroll-grid-container">
              {BUILDINGS.map((building) => (
                <button
                  key={building.key}
                  className={`farm-building ${store.selectedObjectType === building.key ? 'active' : ''}`}
                  onClick={() => {
                    store.setGameMode('build')
                    store.setSelectedObjectType(building.key)
                    store.setSelectedActionLabel(`${building.label} selected`)
                  }}
                >
                  {'asset' in building
                    ? <img className="farm-building__thumb" src={ISO_ASSETS[building.asset].url} alt="" />
                    : <span style={{ display: 'block', width: '16px', height: '16px', borderRadius: '3px', background: `#${ISO_OBJECTS[building.key].color.toString(16).padStart(6, '0')}` }} />}
                  <div><strong>{building.label}</strong><small>{building.cost}</small></div>
                </button>
              ))}
            </div>
            <button className="farm-console__primary" onClick={() => window.dispatchEvent(new Event('solfarm:place-selected'))}>
              Build on current tile
            </button>
            <button className="farm-console__danger" onClick={() => window.dispatchEvent(new Event('solfarm:remove-current'))}>
              Remove selected object +3 XP
            </button>
          </>
        )}

        {action === 'shop' && (
          <>
            <div className="farm-console__section">Decorations</div>
            <div className="farm-shop-grid">
              {DECORATIONS.map((item) => (
                <button
                  key={item.key}
                  className={`farm-shop-item ${store.selectedObjectType === item.key ? 'active' : ''}`}
                  onClick={() => {
                    store.setGameMode('build')
                    store.setSelectedObjectType(item.key)
                    store.setSelectedActionLabel(`${item.label} selected - ${item.price} coins`)
                  }}
                >
                  <img className="farm-shop-thumb" src={ISO_ASSETS[item.asset].url} alt="" />
                  <span><strong>{item.label}</strong><small>{item.price} coins</small></span>
                </button>
              ))}
            </div>

            <div className="farm-console__section">Livestock</div>
            <div className="farm-scroll-grid-container">
              {LIVESTOCK.map((item) => (
                <button
                  key={item.key}
                  className={`farm-building ${store.selectedObjectType === item.key ? 'active' : ''}`}
                  onClick={() => {
                    store.setGameMode('build')
                    store.setSelectedObjectType(item.key)
                    store.setSelectedActionLabel(`${item.label} selected - ${item.price} coins`)
                  }}
                >
                  {item.asset
                    ? <img className="farm-animal-thumb" src={ISO_ASSETS[item.asset].url} alt="" />
                    : <span className="farm-cow-thumb">COW</span>}
                  <div><strong>{item.label}</strong><small>{item.price} C / {item.detail}</small></div>
                </button>
              ))}
            </div>
            <button className="farm-console__primary" onClick={() => window.dispatchEvent(new Event('solfarm:place-selected'))}>
              Buy and place
            </button>
            <button className="farm-console__danger" onClick={() => window.dispatchEvent(new Event('solfarm:remove-current'))}>
              Remove selected object
            </button>
          </>
        )}

        {action === 'animals' && (
          <>
            <div className="farm-context-card">
              <div className="farm-console__section">Animal care</div>
              {selectedAnimal ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', marginBottom: '8px' }}>
                  <strong style={{ color: '#5cedf0' }}>{selectedAnimal.kind === 'chicken' ? 'Chicken' : 'Cow'}</strong>
                  <span style={{ fontSize: '11px' }}>
                    {selectedAnimal.readyAt === null
                      ? 'Hungry - feed animal'
                      : now >= selectedAnimal.readyAt
                        ? `${selectedAnimal.kind === 'chicken' ? 'Egg' : 'Milk'} ready!`
                        : `${selectedAnimal.readyAt - now} mins left`}
                  </span>
                  {selectedAnimal.readyAt !== null && now >= selectedAnimal.readyAt ? (
                    <button className="farm-console__primary" onClick={() => store.collectAnimalProduct(target.x, target.y)}>
                      Collect Product
                    </button>
                  ) : (
                    <button
                      className="farm-console__primary"
                      disabled={selectedAnimal.readyAt !== null}
                      onClick={() => store.feedAnimal(target.x, target.y)}
                    >
                      Feed animal
                    </button>
                  )}
                </div>
              ) : <span style={{ display: 'block', margin: '12px 0', fontSize: '11px', color: '#647084' }}>Click an animal tile to select it.</span>}
            </div>

            <div className="farm-animal-stock">
              <span>Feed <strong>{store.resources.animalFeed}</strong></span>
              <span>Eggs <strong>{store.resources.eggs}</strong></span>
              <span>Milk <strong>{store.resources.milk}</strong></span>
            </div>
            <button className="farm-console__primary" onClick={() => store.buyAnimalFeed(5)}>
              Buy 5 feed (15 coins)
            </button>
            <button className="farm-console__danger" onClick={() => window.dispatchEvent(new Event('solfarm:remove-current'))}>
              Remove selected animal
            </button>
          </>
        )}
      </div>

      <div className="farm-console__bonus">
        <span style={{ color: '#5cedf0' }}>{profession.title}</span>
        <strong>{profession.bonus}</strong>
      </div>

      <div className="farm-console__stats">
        <span>Crops <strong>{growing + ready}</strong></span>
        <span>Ready <strong>{ready}</strong></span>
        <span>Score <strong>{farmScore}</strong></span>
      </div>
    </aside>
  )
}

const FARM_CROPS_LABELS = Object.fromEntries(FARM_CROP_LIST.map((crop) => [crop.type, crop.label])) as Record<CropType, string>