import Phaser from 'phaser'
import { useGameStore } from '../stores/gameStore'
import {
  ISO_TILES,
  ISO_OBJECTS,
  ISO_WORLD_H,
  ISO_WORLD_W,
  TILE_HALF_H,
  TILE_HALF_W,
  TILE_W,
  Z_SCALE,
  depthKey,
  screenToWorld,
  worldToScreen,
} from './IsoConstants'
import { getObjectAssetKey, ISO_ASSETS, ISO_ASSET_LIST, type IsoAssetKey } from './assetManifest'
import { createIsoObject, getIsoTile, type IsoTile } from './IsoWorld'
import { drawIsoCube, drawIsoObject, drawPathConnectors, drawPlacementPreview, drawSoftShadow, drawTileBlend, drawTileHighlight } from './IsoRenderer'
import { gameAudio } from './audio'
import { CROP_TYPE_BY_OBJECT_KEY, FARMER_PROFESSIONS } from './farmCatalog'

type SceneInit = {
  world: IsoTile[][]
  onPlaceBlock: (wx: number, wy: number, blockId: number) => void
  onMineBlock: (wx: number, wy: number) => void
  onInspectBlock: (wx: number, wy: number) => void
}

const ORIGIN_X = ISO_WORLD_H * TILE_HALF_W + 120
const ORIGIN_Y = 140

type FloatingFeedback = {
  x: number
  y: number
  text: string
  color: number
  bornAt: number
}

export class IsometricScene extends Phaser.Scene {
  private g!: Phaser.GameObjects.Graphics
  private highlight!: Phaser.GameObjects.Graphics
  private world: IsoTile[][] = []
  private keys!: Record<string, Phaser.Input.Keyboard.Key>
  private lastMoveAt = 0
  private onPlaceBlock?: SceneInit['onPlaceBlock']
  private onMineBlock?: SceneInit['onMineBlock']
  private onInspectBlock?: SceneInit['onInspectBlock']
  private hovered: { x: number; y: number } | null = null
  private downAt: { x: number; y: number } | null = null
  private dragging = false
  private cameraSettled = false
  private handleCenterCameraRequest = () => this.centerCameraOnPlayer(1)
  private handlePlaceSelectedRequest = () => {
    const store = useGameStore.getState()
    if (store.activeFarmId !== 'home') return
    this.placeSelectedObjectAt(store.player.tileX, store.player.tileY)
  }
  private handleRemoveCurrentRequest = () => {
    const store = useGameStore.getState()
    if (store.activeFarmId !== 'home') return
    const target = store.selectedTile ?? { x: store.player.tileX, y: store.player.tileY }
    this.removeObjectAt(target.x, target.y)
  }
  private feedbacks: FloatingFeedback[] = []
  private spritePool = new Map<string, Phaser.GameObjects.Image>()
  private activeSpriteKeys = new Set<string>()
  private playerNameText?: Phaser.GameObjects.Text
  private remoteNameTexts = new Map<string, Phaser.GameObjects.Text>()
  private activeRemoteNames = new Set<string>()
  private portalNameTexts = new Map<string, Phaser.GameObjects.Text>()
  private activePortalNames = new Set<string>()
  private objectNameTexts = new Map<string, Phaser.GameObjects.Text>()
  private activeObjectNames = new Set<string>()
  private handleMobileMove = (event: Event) => {
    const detail = (event as CustomEvent<{ dx: number; dy: number }>).detail
    if (detail) this.movePlayer(detail.dx, detail.dy)
  }

  constructor() {
    super('IsometricScene')
  }

  init(data: SceneInit) {
    this.world = data.world
    this.onPlaceBlock = data.onPlaceBlock
    this.onMineBlock = data.onMineBlock
    this.onInspectBlock = data.onInspectBlock
  }

  preload() {
    for (const asset of ISO_ASSET_LIST) {
      if (!this.textures.exists(asset.key)) this.load.image(asset.key, asset.url)
    }
  }

  create() {
    this.g = this.add.graphics()
    this.highlight = this.add.graphics()
    this.g.setDepth(0)
    this.highlight.setDepth(1000)
    this.playerNameText = this.add.text(0, 0, '', {
      fontFamily: 'JetBrains Mono, Fira Code, monospace',
      fontSize: '10px',
      color: '#fff4d7',
      stroke: '#0d0f14',
      strokeThickness: 3,
      align: 'center',
    }).setOrigin(0.5, 1).setDepth(1200)
    this.textures.get('iso.house').setFilter(Phaser.Textures.FilterMode.LINEAR)
    this.textures.get('iso.market.vegetables').setFilter(Phaser.Textures.FilterMode.LINEAR)
    ;([
      'iso.building.barn',
      'iso.tree.oak',
      'iso.animal.chicken',
      'iso.animal.cow',
      'iso.townhall',
      'iso.market.fruits',
      'iso.market.bakery',
      'iso.market.dairy',
      'iso.town.dock',
      'iso.decor.barrel',
      'iso.decor.bush',
      'iso.decor.crate',
      'iso.decor.fence',
      'iso.decor.fence_wood',
      'iso.decor.sign',
      'iso.decor.tree',
    ] as IsoAssetKey[]).forEach((key) => this.textures.get(key).setFilter(Phaser.Textures.FilterMode.LINEAR))
    this.cameras.main.setBackgroundColor('#74b9d8')
    this.cameras.main.setZoom(this.scale.width < 760 ? 0.74 : 0.88)
    this.centerCameraOnPlayer(1)
    useGameStore.getState().setCam(this.cameras.main.scrollX, this.cameras.main.scrollY, this.cameras.main.zoom)

    // Automatically synchronize Phaser system sizes when structural layout wraps change
    this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
      if (this.cameras.main) {
        this.cameras.main.setZoom(gameSize.width < 760 ? 0.74 : 0.88)
        this.centerCameraOnPlayer(1)
      }
    })
    
    window.addEventListener('solfarm:center-camera', this.handleCenterCameraRequest)
    window.addEventListener('solfarm:move-player', this.handleMobileMove)
    window.addEventListener('solfarm:place-selected', this.handlePlaceSelectedRequest)
    window.addEventListener('solfarm:remove-current', this.handleRemoveCurrentRequest)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener('solfarm:center-camera', this.handleCenterCameraRequest)
      window.removeEventListener('solfarm:move-player', this.handleMobileMove)
      window.removeEventListener('solfarm:place-selected', this.handlePlaceSelectedRequest)
      window.removeEventListener('solfarm:remove-current', this.handleRemoveCurrentRequest)
    })

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.downAt = { x: p.x, y: p.y }
      this.dragging = false
    })

    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (p.isDown) {
        const dx = p.x - p.prevPosition.x
        const dy = p.y - p.prevPosition.y
        if (Math.abs((this.downAt?.x ?? p.x) - p.x) + Math.abs((this.downAt?.y ?? p.y) - p.y) > 5) this.dragging = true
        this.cameras.main.scrollX -= dx / this.cameras.main.zoom
        this.cameras.main.scrollY -= dy / this.cameras.main.zoom
        this.clampCamera()
      }
      this.updateHover(p)
    })

    this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      this.updateHover(p)
      if (!this.dragging && this.hovered) this.handleTileAction(this.hovered.x, this.hovered.y)
      this.downAt = null
      this.dragging = false
    })

    this.input.on('wheel', (_p: Phaser.Input.Pointer, _objs: unknown, _dx: number, dy: number) => {
      const cam = this.cameras.main
      cam.zoom = Phaser.Math.Clamp(cam.zoom + (dy > 0 ? -0.08 : 0.08), 0.65, 1.8)
      this.clampCamera()
      useGameStore.getState().setCam(cam.scrollX, cam.scrollY, cam.zoom)
    })

    this.keys = this.input.keyboard?.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,F,H,C') as Record<string, Phaser.Input.Keyboard.Key>
  }

  // Exposed API method triggered directly from React pipeline to re-verify matrix bounds
  public onResize(width: number, height: number) {
    if (!this.sys || !this.cameras.main) return
    this.scale.resize(width, height)
    this.cameras.main.setSize(width, height)
    this.cameras.main.setZoom(width < 760 ? 0.74 : 0.88)
    this.centerCameraOnPlayer(1)
  }

  update(time: number, delta: number) {
    if (!this.cameraSettled && this.scale.width > 0 && this.scale.height > 0) {
      this.centerCameraOnPlayer(1)
      this.cameraSettled = true
    }
    this.handleKeyboardMove(time)
    this.drawWorld()
    this.drawHover()
    const store = useGameStore.getState()
    if (Math.random() < delta / 800) store.tickWater()
    if (Math.random() < delta / 1000) store.tickTime(2)
  }

  private updateHover(pointer: Phaser.Input.Pointer) {
    const pt = this.cameras.main.getWorldPoint(pointer.x, pointer.y)
    const { wx, wy } = screenToWorld(pt.x - ORIGIN_X, pt.y - ORIGIN_Y)
    const next = getIsoTile(this.world, wx, wy) ? { x: wx, y: wy } : null
    if (next?.x !== this.hovered?.x || next?.y !== this.hovered?.y) {
      this.hovered = next
      useGameStore.getState().setHoveredTile(next)
    }
  }

  private handleTileAction(wx: number, wy: number) {
    const store = useGameStore.getState()
    const tile = getIsoTile(this.world, wx, wy)
    if (!tile) return

    if (store.activeFarmId !== 'home') {
      store.setSelectedTile({ x: wx, y: wy })
      store.setSelectedActionLabel('visiting only')
      this.onInspectBlock?.(wx, wy)
      return
    }

    store.setSelectedTile({ x: wx, y: wy })
    const distance = Math.abs(store.player.tileX - wx) + Math.abs(store.player.tileY - wy)
    if (distance > 1) {
      if (this.canStandOn(wx, wy)) {
        this.movePlayer(wx - store.player.tileX, wy - store.player.tileY)
        store.setSelectedActionLabel('walked closer')
      } else {
        store.setSelectedActionLabel('too far away')
      }
      return
    }

    if (store.gameMode === 'terrain') {
      store.setTile(wx, wy, store.selectedTileType)
      this.world = useGameStore.getState().isoWorld ?? this.world
      store.setSelectedActionLabel(`painted ${this.tileName(store.selectedTileType)}`)
      this.onPlaceBlock?.(wx, wy, store.selectedTileType)
      return
    }

    if (store.gameMode === 'build' || store.gameMode === 'place') {
      store.setSelectedActionLabel('stand on a clear tile, then press Build')
      return
    }

    if (store.gameMode === 'demolish' || store.gameMode === 'mine') {
      this.removeObjectAt(wx, wy)
      return
    }

    if (tile.object?.type === 'crop') {
      const plot = store.cropPlots[`${wx},${wy}`]
      const now = store.day * 1440 + store.minuteOfDay
      if (plot && !plot.harvested && now < plot.readyAt && !plot.watered) {
        store.waterCrop(wx, wy)
        return
      }
      if (plot && !plot.harvested && now < plot.readyAt && !plot.fertilized) {
        store.fertilizeCrop(wx, wy)
        return
      }
      const harvested = store.harvestCrop(wx, wy)
      store.setSelectedActionLabel(harvested ? 'crop harvested' : 'crop still growing')
      if (harvested) {
        store.placeObject(wx, wy, null)
        this.world = useGameStore.getState().isoWorld ?? this.world
        this.spawnFeedback(wx, wy, '+ crops', 0xf0c040)
      }
      return
    }

    store.setSelectedActionLabel('inspected tile')
    this.onInspectBlock?.(wx, wy)
  }

  private drawWorld() {
    this.g.clear()
    this.activeSpriteKeys.clear()
    this.activeRemoteNames.clear()
    this.activePortalNames.clear()
    this.activeObjectNames.clear()
    const state = useGameStore.getState()
    const storeWorld = state.activeFarmId === 'town' ? state.townWorld : state.isoWorld
    if (storeWorld && storeWorld !== this.world) this.world = storeWorld

    const player = state.player
    const items: (
      | { kind: 'tile'; x: number; y: number; tile: IsoTile; depth: number }
      | { kind: 'object'; x: number; y: number; tile: IsoTile; depth: number }
      | { kind: 'player'; x: number; y: number; depth: number }
      | { kind: 'remotePlayer'; id: string; name: string; characterId: string; x: number; y: number; depth: number }
    )[] = []
    for (let y = 0; y < ISO_WORLD_H; y += 1) {
      for (let x = 0; x < ISO_WORLD_W; x += 1) {
        const tile = this.world[y]?.[x]
        const tileHeight = Number.isFinite(tile?.height) ? tile.height : 1
        if (tile) items.push({ kind: 'tile', x, y, tile, depth: depthKey(x, y, tileHeight) })
        if (tile?.object) {
          const fp = tile.object.footprint ?? { w: 1, h: 1 }
          const objectHeight = Number.isFinite(tile.object.height) ? tile.object.height : 1
          items.push({ kind: 'object', x, y, tile, depth: x + y + fp.w + fp.h + objectHeight * 0.03 })
        }
      }
    }
    items.push({ kind: 'player', x: player.tileX, y: player.tileY, depth: player.tileX + player.tileY + 0.45 })
    if (state.activeFarmId === 'town') {
      for (const remote of state.remotePlayers.filter((item) => item.zone === 'town')) {
        items.push({
          kind: 'remotePlayer',
          id: remote.id,
          name: remote.name,
          characterId: remote.characterId,
          x: remote.x,
          y: remote.y,
          depth: remote.x + remote.y + 0.44,
        })
      }
    }
    items.sort((a, b) => a.depth - b.depth)

    for (const item of items) {
      if (item.kind === 'player') {
        const tile = getIsoTile(this.world, item.x, item.y)
        const tileHeight = Number.isFinite(tile?.height) ? tile.height : 1
        const { sx, sy } = worldToScreen(item.x, item.y)
        if (!this.drawPlayerSprite(sx + ORIGIN_X, sy + ORIGIN_Y, tileHeight, item.depth)) {
          this.drawPlayer(sx + ORIGIN_X, sy + ORIGIN_Y, tileHeight)
        }
        this.drawPlayerName(sx + ORIGIN_X, sy + ORIGIN_Y, tileHeight)
        continue
      }
      if (item.kind === 'remotePlayer') {
        const tile = getIsoTile(this.world, item.x, item.y)
        const tileHeight = Number.isFinite(tile?.height) ? tile.height : 1
        const { sx, sy } = worldToScreen(item.x, item.y)
        this.drawRemotePlayer(item.id, item.name, item.characterId, sx + ORIGIN_X, sy + ORIGIN_Y, tileHeight, item.depth)
        continue
      }
      if (item.kind === 'object') {
        const tileHeight = Number.isFinite(item.tile.height) ? item.tile.height : 1
        const { sx, sy } = worldToScreen(item.x, item.y)
        const obj = item.tile.object!
        if (obj.type === 'crop') {
          const plot = useGameStore.getState().cropPlots[`${item.x},${item.y}`]
          if (plot && !plot.harvested) {
            const now = useGameStore.getState().day * 1440 + useGameStore.getState().minuteOfDay
            const progress = Phaser.Math.Clamp((now - plot.plantedAt) / Math.max(1, plot.readyAt - plot.plantedAt), 0, 1)
            const growthVariant = progress >= 1 ? 3 : progress > 0.62 ? 2 : progress > 0.25 ? 1 : 0
            const stagedObj = { ...obj, variant: growthVariant }
            if (!this.drawObjectSprite(`object:${item.x},${item.y}`, sx + ORIGIN_X, sy + ORIGIN_Y, stagedObj, tileHeight, item.depth)) {
              drawIsoObject(this.g, sx + ORIGIN_X, sy + ORIGIN_Y, stagedObj, tileHeight)
            }
          } else {
            if (!this.drawObjectSprite(`object:${item.x},${item.y}`, sx + ORIGIN_X, sy + ORIGIN_Y, obj, tileHeight, item.depth)) {
              drawIsoObject(this.g, sx + ORIGIN_X, sy + ORIGIN_Y, obj, tileHeight)
            }
          }
        } else {
          if (!this.drawObjectSprite(`object:${item.x},${item.y}`, sx + ORIGIN_X, sy + ORIGIN_Y, obj, tileHeight, item.depth)) {
            drawIsoObject(this.g, sx + ORIGIN_X, sy + ORIGIN_Y, obj, tileHeight)
          }
        }
        if (obj.key === 'TRAVEL_PORTAL') {
          this.drawPortalName(`portal:${item.x},${item.y}`, sx + ORIGIN_X, sy + ORIGIN_Y, tileHeight, item.depth)
        } else if (this.shouldLabelObject(obj)) {
          this.drawObjectName(`name:${item.x},${item.y}`, sx + ORIGIN_X, sy + ORIGIN_Y, obj, tileHeight, item.depth)
        }
        continue
      }
      const def = Object.values(ISO_TILES).find((t) => t.id === item.tile.base) ?? ISO_TILES.GRASS
      const { sx, sy } = worldToScreen(item.x, item.y)
      const x = sx + ORIGIN_X
      const y = sy + ORIGIN_Y
      const tileHeight = Number.isFinite(item.tile.height) ? item.tile.height : 1
      const lift = tileHeight * Z_SCALE
      const waterColor = Phaser.Display.Color.Interpolate.ColorWithColor(
          Phaser.Display.Color.ValueToColor(def.top),
          Phaser.Display.Color.ValueToColor(0x7ed6ff),
          100,
          useGameStore.getState().waterAnimTick % 100
        )
      const top = item.tile.base === ISO_TILES.WATER.id
        ? Phaser.Display.Color.GetColor(waterColor.r, waterColor.g, waterColor.b)
        : def.top

      drawIsoCube(this.g, x, y - lift, def.flat ? 0 : tileHeight, top, def.left, def.right)
      if (item.tile.base === ISO_TILES.WATER.id || item.tile.base === ISO_TILES.DEEPWATER.id) this.drawWaterSurface(x, y - lift, item.x, item.y)
      this.drawTerrainTransitions(x, y - lift, item.x, item.y, item.tile)
      if (item.tile.base === ISO_TILES.PATH.id) this.drawPathGeometry(x, y - lift, item.x, item.y)
      if (item.tile.occupiedBy) this.drawFootprintTint(x, y - lift)
      this.drawCropTimer(x, y, item.x, item.y, tileHeight)
    }
    this.drawDayNightOverlay()
    this.drawFeedbacks()
    this.hideUnusedSprites()
    for (const [id, text] of this.remoteNameTexts) {
      if (!this.activeRemoteNames.has(id)) text.setVisible(false)
    }
    for (const [id, text] of this.portalNameTexts) {
      if (!this.activePortalNames.has(id)) text.setVisible(false)
    }
    for (const [id, text] of this.objectNameTexts) {
      if (!this.activeObjectNames.has(id)) text.setVisible(false)
    }
  }

  private drawHover() {
    this.highlight.clear()
    if (!this.hovered) return
    const tile = getIsoTile(this.world, this.hovered.x, this.hovered.y)
    if (!tile) return
    const tileHeight = Number.isFinite(tile.height) ? tile.height : 1
    const mode = useGameStore.getState().gameMode
    const color = mode === 'demolish' || mode === 'mine' ? 0xff6b6b : mode === 'build' || mode === 'terrain' || mode === 'place' ? 0x9ce55a : 0xffffff
    const { sx, sy } = worldToScreen(this.hovered.x, this.hovered.y)
    const store = useGameStore.getState()
    if ((mode === 'build' || mode === 'place') && store.selectedObjectType && store.selectedObjectType in ISO_OBJECTS) {
      const fp = ISO_OBJECTS[store.selectedObjectType as keyof typeof ISO_OBJECTS].footprint
      drawPlacementPreview(
        this.highlight,
        sx + ORIGIN_X,
        sy + ORIGIN_Y - tileHeight * Z_SCALE,
        fp,
        this.canPlaceFootprint(this.hovered.x, this.hovered.y, store.selectedObjectType)
      )
      return
    }
    drawTileHighlight(this.highlight, sx + ORIGIN_X, sy + ORIGIN_Y - tileHeight * Z_SCALE, color, 0.8)
  }

  private clampCamera() {
    const cam = this.cameras.main
    const worldPixelW = ISO_WORLD_W * TILE_W
    cam.scrollX = Phaser.Math.Clamp(cam.scrollX, -240, worldPixelW + 260)
    cam.scrollY = Phaser.Math.Clamp(cam.scrollY, -220, ISO_WORLD_H * 42)
    useGameStore.getState().setCam(cam.scrollX, cam.scrollY, cam.zoom)
  }

  private handleKeyboardMove(time: number) {
    if (!this.keys) return
    if (Phaser.Input.Keyboard.JustDown(this.keys.H)) {
      this.centerCameraOnPlayer(1)
      useGameStore.getState().setSelectedActionLabel('camera centered')
      return
    }
    if (time - this.lastMoveAt < 150) return
    let dx = 0
    let dy = 0
    if (this.keys.W?.isDown || this.keys.UP?.isDown) dy = -1
    else if (this.keys.S?.isDown || this.keys.DOWN?.isDown) dy = 1
    else if (this.keys.A?.isDown || this.keys.LEFT?.isDown) dx = -1
    else if (this.keys.D?.isDown || this.keys.RIGHT?.isDown) dx = 1
    if (!dx && !dy) return
    this.lastMoveAt = time
    this.movePlayer(dx, dy)
  }

  private movePlayer(dx: number, dy: number) {
    const store = useGameStore.getState()
    const nextX = Phaser.Math.Clamp(store.player.tileX + Math.sign(dx), 0, ISO_WORLD_W - 1)
    const nextY = Phaser.Math.Clamp(store.player.tileY + Math.sign(dy), 0, ISO_WORLD_H - 1)
    if (!this.canStandOn(nextX, nextY)) return
    const facing = Math.abs(dx) > Math.abs(dy)
      ? (dx > 0 ? 'east' : 'west')
      : (dy > 0 ? 'south' : 'north')
    store.movePlayerTo(nextX, nextY, facing)
    gameAudio.playMove()
    store.setSelectedTile({ x: nextX, y: nextY })
    this.centerCameraOn(nextX, nextY)
  }

  private canStandOn(wx: number, wy: number) {
    const tile = getIsoTile(this.world, wx, wy)
    if (!tile || tile.object || tile.occupiedBy) return false
    return tile.base !== ISO_TILES.WATER.id && tile.base !== ISO_TILES.DEEPWATER.id && tile.base !== ISO_TILES.LAVA.id
  }

  private centerCameraOn(wx: number, wy: number) {
    const cam = this.cameras.main
    const tile = getIsoTile(this.world, wx, wy)
    const tileHeight = Number.isFinite(tile?.height) ? tile.height : 1
    const { sx, sy } = worldToScreen(wx, wy)
    const targetX = sx + ORIGIN_X - cam.width / 2 / cam.zoom
    const targetY = sy + ORIGIN_Y - tileHeight * Z_SCALE - cam.height / 2 / cam.zoom
    cam.scrollX = Phaser.Math.Linear(cam.scrollX, targetX, 0.35)
    cam.scrollY = Phaser.Math.Linear(cam.scrollY, targetY, 0.35)
    this.clampCamera()
  }

  private centerCameraOnPlayer(alpha = 0.35) {
    const store = useGameStore.getState()
    const cam = this.cameras.main
    if (!cam) return
    const tile = getIsoTile(this.world, store.player.tileX, store.player.tileY)
    const tileHeight = Number.isFinite(tile?.height) ? tile.height : 1
    const { sx, sy } = worldToScreen(store.player.tileX, store.player.tileY)
    const targetX = sx + ORIGIN_X - cam.width / 2 / cam.zoom
    const targetY = sy + ORIGIN_Y - tileHeight * Z_SCALE - cam.height / 2 / cam.zoom
    cam.scrollX = Phaser.Math.Linear(cam.scrollX, targetX, alpha)
    cam.scrollY = Phaser.Math.Linear(cam.scrollY, targetY, alpha)
    this.clampCamera()
  }

  private drawPlayer(sx: number, sy: number, tileHeight: number) {
    const facing = useGameStore.getState().player.facing
    const bob = Math.sin(this.time.now / 150) * 1.4
    const baseY = sy - tileHeight * Z_SCALE + 10 + bob
    const side = facing === 'west' || facing === 'north' ? -1 : 1
    drawSoftShadow(this.g, sx, baseY + 11, 28, 12, 0.23)

    this.g.fillStyle(0x1f4e8c, 1)
    this.g.fillRoundedRect(sx - 7, baseY - 18, 14, 20, 4)
    this.g.fillStyle(0x2f6fb2, 1)
    this.g.fillRoundedRect(sx - 7, baseY - 19, 8, 17, 3)
    this.g.fillStyle(0xf0c040, 1)
    this.g.fillRect(sx - 5, baseY - 17, 3, 8)
    this.g.fillRect(sx + 2, baseY - 17, 3, 8)

    this.g.lineStyle(3, 0x2456d8, 1)
    this.g.strokeLineShape(new Phaser.Geom.Line(sx - 4, baseY, sx - 9, baseY + 12))
    this.g.strokeLineShape(new Phaser.Geom.Line(sx + 4, baseY, sx + 9, baseY + 12))
    this.g.fillStyle(0x4a2b18, 1)
    this.g.fillRoundedRect(sx - 11, baseY + 10, 8, 5, 2)
    this.g.fillRoundedRect(sx + 3, baseY + 10, 8, 5, 2)

    this.g.fillStyle(0xf3c28b, 1)
    this.g.fillCircle(sx, baseY - 25, 8)
    this.g.fillStyle(0xc99b41, 1)
    this.g.fillEllipse(sx, baseY - 33, 25, 7)
    this.g.fillStyle(0xd8b64a, 1)
    this.g.fillRoundedRect(sx - 7, baseY - 43, 14, 11, 3)
    this.g.fillEllipse(sx, baseY - 43, 14, 5)
    this.g.fillStyle(0x6b4226, 1)
    this.g.fillEllipse(sx - side * 3, baseY - 28, 10, 5)
    this.g.fillStyle(0x2b1a12, 1)
    this.g.fillCircle(sx + side * 4, baseY - 26, 1.5)

    this.g.lineStyle(3, 0x2456d8, 1)
    this.g.strokeLineShape(new Phaser.Geom.Line(sx - 7, baseY - 12, sx - 14, baseY - 2))
    this.g.strokeLineShape(new Phaser.Geom.Line(sx + 7, baseY - 12, sx + 14, baseY - 2))
    this.g.fillStyle(0x9ce55a, 1)
    this.g.fillRoundedRect(sx + side * 8, baseY - 21, 9, 7, 2)
    this.g.lineStyle(1, 0xffffff, 0.45)
    this.g.strokeRoundedRect(sx + side * 8, baseY - 21, 9, 7, 2)
  }

  private drawObjectSprite(
    poolKey: string,
    sx: number,
    sy: number,
    obj: NonNullable<IsoTile['object']>,
    tileHeight: number,
    depth: number
  ) {
    const assetKey = getObjectAssetKey(obj)
    if (!assetKey || !this.textures.exists(assetKey)) return false
    const asset = ISO_ASSETS[assetKey]
    let spriteX = sx + (asset.offsetX ?? 0)
    let baseY = sy - tileHeight * Z_SCALE + TILE_HALF_H + 14 + (asset.offsetY ?? 0)
    let flipX = false
    if (assetKey === 'iso.animal.chicken') {
      const seed = obj.anchorX * 19.17 + obj.anchorY * 31.31
      const walkPhase = this.time.now / 720 + seed
      const peckPhase = this.time.now / 210 + seed * 1.7
      const stride = Math.sin(walkPhase)
      spriteX += stride * 7
      baseY += Math.sin(walkPhase * 1.8) * 2 + (Math.sin(peckPhase) > 0.76 ? 4 : 0)
      flipX = Math.cos(walkPhase) < 0
    }
    if (assetKey === 'iso.house') {
      this.drawContactShadow(spriteX, baseY + 1, 100, 18)
    } else if (assetKey === 'iso.building.barn') {
      this.drawContactShadow(spriteX, baseY + 1, 112, 20)
    } else if (assetKey === 'iso.market.vegetables') {
      this.drawContactShadow(spriteX, baseY + 1, 94, 17)
    } else if (assetKey === 'iso.townhall') {
      this.drawContactShadow(spriteX, baseY + 1, 132, 22)
    } else if (assetKey === 'iso.market.bakery' || assetKey === 'iso.market.dairy') {
      this.drawContactShadow(spriteX, baseY + 1, 98, 18)
    } else if (assetKey === 'iso.market.fruits') {
      this.drawContactShadow(spriteX, baseY + 1, 72, 14)
    } else if (assetKey === 'iso.town.dock') {
      this.drawContactShadow(spriteX, baseY + 1, 120, 20)
    } else if (assetKey === 'iso.tree.oak') {
      this.drawContactShadow(spriteX, baseY + 1, 30, 9)
    } else if (assetKey === 'iso.animal.chicken') {
      this.drawContactShadow(spriteX, baseY + 1, 18, 7)
    } else if (assetKey === 'iso.animal.cow') {
      this.drawContactShadow(spriteX, baseY + 1, 34, 10)
    } else if (assetKey.startsWith('iso.decor.')) {
      const shadowWidth = assetKey === 'iso.decor.bench' || assetKey === 'iso.decor.fence' || assetKey === 'iso.decor.fence_wood'
        ? 44
        : assetKey === 'iso.decor.tree'
          ? 30
          : 24
      const shadowHeight = assetKey === 'iso.decor.lamp' ? 7 : 9
      this.drawContactShadow(spriteX, baseY + 1, shadowWidth, shadowHeight)
    }
    const sprite = this.placeSprite(poolKey, assetKey, spriteX, baseY, asset.scale, asset.originY, 150 + depth)
    sprite.setFlipX(flipX)
    return true
  }

  private drawContactShadow(x: number, y: number, width: number, height: number) {
    drawSoftShadow(this.g, x, y, width, height, 0.15)
    drawSoftShadow(this.g, x, y - 1, width * 0.7, Math.max(4, height * 0.55), 0.22)
  }

  private shouldLabelObject(obj: NonNullable<IsoTile['object']>) {
    return !['tree', 'crop', 'rock', 'fence', 'decoration', 'lamp', 'animal'].includes(obj.type)
  }

  private drawObjectName(
    id: string,
    sx: number,
    sy: number,
    obj: NonNullable<IsoTile['object']>,
    tileHeight: number,
    depth: number,
  ) {
    const assetKey = getObjectAssetKey(obj)
    const asset = assetKey ? ISO_ASSETS[assetKey] : null
    const baseY = sy - tileHeight * Z_SCALE + TILE_HALF_H + 14 + (asset?.offsetY ?? 0)
    const topY = asset
      ? baseY - asset.height * asset.scale * asset.originY - 5
      : sy - tileHeight * Z_SCALE - Math.max(38, obj.height * 19)
    const names: Record<string, string> = {
      TOWNHALL: 'TOWN HALL',
      MARKET_BAKERY: 'BAKERY',
      MARKET_FRUITS: 'FRUIT MARKET',
      MARKET_VEGETABLES: 'VEGETABLE MARKET',
      MARKET_DAIRY: 'DAIRY',
      TOWN_DOCK: 'FISHING DOCK',
      FOUNTAIN: 'TOWN FOUNTAIN',
      TOWN_GARDEN: 'GARDEN',
      FLOWER_GARDEN: 'FLOWERS',
      WELL: 'WELL',
    }
    let label = this.objectNameTexts.get(id)
    if (!label) {
      label = this.add.text(0, 0, '', {
        fontFamily: 'JetBrains Mono, Fira Code, monospace',
        fontSize: '8px',
        fontStyle: 'bold',
        color: '#f5f7ed',
        backgroundColor: '#10151ddb',
        padding: { x: 5, y: 3 },
        stroke: '#10151d',
        strokeThickness: 2,
        align: 'center',
      }).setOrigin(0.5, 1)
      this.objectNameTexts.set(id, label)
    }
    label
      .setText(names[obj.key] ?? String(obj.label ?? obj.type ?? obj.key).toUpperCase())
      .setPosition(sx + (asset?.offsetX ?? 0), topY)
      .setDepth(1240 + depth)
      .setVisible(true)
    this.activeObjectNames.add(id)
  }

  private drawPortalName(id: string, sx: number, sy: number, tileHeight: number, depth: number) {
    let label = this.portalNameTexts.get(id)
    if (!label) {
      label = this.add.text(0, 0, 'PORTAL', {
        fontFamily: 'JetBrains Mono, Fira Code, monospace',
        fontSize: '9px',
        fontStyle: 'bold',
        color: '#bffcff',
        stroke: '#101323',
        strokeThickness: 4,
        align: 'center',
      }).setOrigin(0.5, 1)
      this.portalNameTexts.set(id, label)
    }
    label
      .setPosition(sx, sy - tileHeight * Z_SCALE - 52)
      .setDepth(1250 + depth)
      .setVisible(true)
    this.activePortalNames.add(id)
  }

  private drawPlayerSprite(sx: number, sy: number, tileHeight: number, depth: number) {
    const assetKey: IsoAssetKey = 'iso.player.south'
    if (!this.textures.exists(assetKey)) return false
    const asset = ISO_ASSETS[assetKey]
    const bob = Math.sin(this.time.now / 150) * 1.4
    const baseY = sy - tileHeight * Z_SCALE + 25 + bob
    const sprite = this.placeSprite('player', assetKey, sx, baseY, asset.scale, asset.originY, 200 + depth)
    const characterTints = {
      'farmer-sage': 0xffffff,
      'farmer-sun': 0xffc46b,
      'farmer-rose': 0xff91bd,
      'farmer-river': 0x72ddd4,
    } as const
    sprite.setTint(characterTints[useGameStore.getState().player.characterId] ?? 0xffffff)
    drawSoftShadow(this.g, sx, baseY + 11, 28, 12, 0.23)
    return true
  }

  private drawRemotePlayer(id: string, name: string, characterId: string, sx: number, sy: number, tileHeight: number, depth: number) {
    const assetKey: IsoAssetKey = 'iso.player.south'
    if (!this.textures.exists(assetKey)) return
    const asset = ISO_ASSETS[assetKey]
    const bob = Math.sin(this.time.now / 170 + id.length) * 1.1
    const baseY = sy - tileHeight * Z_SCALE + 25 + bob
    const sprite = this.placeSprite(`remote:${id}`, assetKey, sx, baseY, asset.scale, asset.originY, 200 + depth)
    const tints: Record<string, number> = {
      'farmer-sage': 0xffffff,
      'farmer-sun': 0xffc46b,
      'farmer-rose': 0xff91bd,
      'farmer-river': 0x72ddd4,
    }
    sprite.setTint(tints[characterId] ?? 0xffffff)
    drawSoftShadow(this.g, sx, baseY + 11, 28, 12, 0.23)
    let label = this.remoteNameTexts.get(id)
    if (!label) {
      label = this.add.text(0, 0, '', {
        fontFamily: 'JetBrains Mono, Fira Code, monospace',
        fontSize: '9px',
        color: '#dffcff',
        stroke: '#0d0f14',
        strokeThickness: 3,
      }).setOrigin(0.5, 1)
      this.remoteNameTexts.set(id, label)
    }
    label.setText(name.slice(0, 20)).setPosition(sx, sy - tileHeight * Z_SCALE - 48 + bob).setDepth(1200 + depth).setVisible(true)
    this.activeRemoteNames.add(id)
  }

  private drawPlayerName(sx: number, sy: number, tileHeight: number) {
    if (!this.playerNameText) return
    const store = useGameStore.getState()
    const label = `${(store.farmName || store.farmhouse.name || 'guest farmer').slice(0, 16)} | ${store.farmXp} XP`
    const bob = Math.sin(this.time.now / 150) * 1.4
    this.playerNameText
      .setText(label)
      .setPosition(sx, sy - tileHeight * Z_SCALE - 48 + bob)
      .setVisible(true)
  }

  private placeSprite(
    poolKey: string,
    textureKey: IsoAssetKey,
    x: number,
    y: number,
    scale: number,
    originY: number,
    depth: number
  ): Phaser.GameObjects.Image {
    let sprite = this.spritePool.get(poolKey)
    if (!sprite) {
      sprite = this.add.image(x, y, textureKey)
      sprite.setOrigin(0.5, originY)
      sprite.setName(poolKey)
      this.spritePool.set(poolKey, sprite)
    }
    if (sprite.texture.key !== textureKey) sprite.setTexture(textureKey)
    sprite
      .setPosition(x, y)
      .setScale(scale)
      .setOrigin(0.5, originY)
      .setDepth(depth)
      .setVisible(true)
    this.activeSpriteKeys.add(poolKey)
    return sprite
  }

  private placeSelectedObjectAt(wx: number, wy: number) {
    const store = useGameStore.getState()
    const tile = getIsoTile(this.world, wx, wy)
    const object = createIsoObject(store.selectedObjectType)
    if (!tile || !object || store.gameMode !== 'build') return
    if (!this.canPlaceFootprint(wx, wy, store.selectedObjectType)) {
      store.setSelectedActionLabel('current tile needs clear flat space')
      return
    }
    const cost = this.buildCost(store.selectedObjectType)
    if (!store.spendResources(cost)) {
      store.setSelectedActionLabel('not enough resources')
      return
    }
    if (store.selectedObjectType?.startsWith('CROP_')) {
      const cropType = CROP_TYPE_BY_OBJECT_KEY[store.selectedObjectType] ?? 'wheat'
      if (!store.plantCrop(wx, wy, cropType)) {
        store.addResources(cost)
        store.setSelectedActionLabel('crop already growing')
        return
      }
    }
    store.placeObject(wx, wy, object)
    if (store.selectedObjectType === 'CHICKEN') store.registerAnimal(wx, wy, 'chicken')
    if (store.selectedObjectType === 'COW') store.registerAnimal(wx, wy, 'cow')
    this.world = useGameStore.getState().isoWorld ?? this.world
    const stepAside = [
      { x: wx - 1, y: wy },
      { x: wx, y: wy - 1 },
      { x: wx + object.footprint.w, y: wy },
      { x: wx, y: wy + object.footprint.h },
    ].find((candidate) => this.canStandOn(candidate.x, candidate.y))
    if (stepAside) {
      store.movePlayerTo(stepAside.x, stepAside.y, store.player.facing)
      this.centerCameraOn(stepAside.x, stepAside.y)
    }
    store.setSelectedActionLabel(`built ${store.selectedObjectType?.toLowerCase().replace(/_/g, ' ')}`)
    this.spawnFeedback(wx, wy, '+ build', 0x9ce55a)
    gameAudio.playBuild()
    if (store.selectedObjectType === 'HOUSE' && !store.farmhouse.owned) {
      store.claimFarmhouse(wx, wy)
      store.setSelectedActionLabel('farmhouse claimed')
      this.spawnFeedback(wx, wy, 'home', 0xf0c040)
    }
    this.onPlaceBlock?.(wx, wy, tile.base)
  }

  private hideUnusedSprites() {
    for (const [key, sprite] of this.spritePool) {
      if (!this.activeSpriteKeys.has(key)) sprite.setVisible(false)
    }
  }

  private spawnFeedback(wx: number, wy: number, text: string, color: number) {
    const { sx, sy } = worldToScreen(wx, wy)
    this.feedbacks.push({
      x: sx + ORIGIN_X,
      y: sy + ORIGIN_Y,
      text,
      color,
      bornAt: this.time.now,
    })
    this.feedbacks = this.feedbacks.slice(-12)
  }

  private removeObjectAt(wx: number, wy: number) {
    const store = useGameStore.getState()
    let tile = getIsoTile(this.world, wx, wy)
    const anchor = tile?.occupiedBy ?? (tile?.object ? { x: wx, y: wy } : null)
    if (anchor) tile = getIsoTile(this.world, anchor.x, anchor.y)
    const object = tile?.object
    if (!tile || !object || !anchor) {
      store.setSelectedActionLabel('no object selected to remove')
      return
    }
    if (object.key === 'TRAVEL_PORTAL') {
      store.setSelectedActionLabel('travel portals cannot be removed')
      return
    }
    if (object.key === 'CHICKEN' || object.key === 'COW') store.removeAnimal(anchor.x, anchor.y)
    this.refundForObject(object.type)
    store.placeObject(anchor.x, anchor.y, null)
    if (object.type === 'crop') {
      useGameStore.setState((s) => {
        const cropPlots = { ...s.cropPlots }
        delete cropPlots[`${anchor.x},${anchor.y}`]
        return { cropPlots }
      })
    }
    useGameStore.setState((s) => ({
      farmXp: s.farmXp + 3,
      seasonPassXp: s.seasonPassXp + 1,
    }))
    this.world = useGameStore.getState().isoWorld ?? this.world
    store.setSelectedActionLabel('removed object: +3 flex XP')
    this.spawnFeedback(anchor.x, anchor.y, '+3 XP', 0x9ce55a)
    this.onMineBlock?.(anchor.x, anchor.y)
    gameAudio.playBuild()
    store.saveFarmNow()
  }

  private drawFeedbacks() {
    const now = this.time.now
    this.feedbacks = this.feedbacks.filter((item) => now - item.bornAt < 1100)
    for (const item of this.feedbacks) {
      const age = now - item.bornAt
      const t = Phaser.Math.Clamp(age / 1100, 0, 1)
      const y = item.y - 44 - t * 30
      this.g.fillStyle(0x0d0f14, 0.72 * (1 - t))
      this.g.fillRoundedRect(item.x - 25, y, 50, 13, 4)
      this.g.lineStyle(1, item.color, 0.45 * (1 - t))
      this.g.strokeRoundedRect(item.x - 25, y, 50, 13, 4)
      this.g.fillStyle(item.color, 0.95 * (1 - t))
      this.g.fillRect(item.x - 15, y + 5, 3, 3)
      this.g.fillRect(item.x + 12, y + 5, 3, 3)
    }
  }

  // Optimized to draw perfectly according to the active viewport scaling matrix
  private drawDayNightOverlay() {
    const store = useGameStore.getState()
    const hour = store.minuteOfDay / 60
    const night = hour < 6 || hour >= 19
    const dusk = (hour >= 17 && hour < 19) || (hour >= 5 && hour < 7)
    const townLightBoost = store.activeFarmId === 'town' ? 0.42 : 1
    const alpha = (night ? 0.36 : dusk ? 0.18 : 0) * townLightBoost
    if (alpha <= 0) return
    
    const cam = this.cameras.main
    this.g.fillStyle(night ? 0x07132a : 0x5d3f74, alpha)
    
    // Instead of cam.width, calculate using world parameters to cover the rendering canvas completely
    const renderW = cam.width / cam.zoom + 600
    const renderH = cam.height / cam.zoom + 600
    this.g.fillRect(cam.scrollX - 300, cam.scrollY - 300, renderW, renderH)
  }

  private tileName(id: number) {
    return Object.values(ISO_TILES).find((tile) => tile.id === id)?.name ?? 'tile'
  }

  private buildCost(key: string | null) {
    const multiplier = FARMER_PROFESSIONS[useGameStore.getState().player.characterId].buildMultiplier
    const discounted = (coins: number) => Math.max(1, Math.round(coins * multiplier))
    if (key === 'HOUSE') return { wood: 8, stone: 5, coins: discounted(35) }
    if (key === 'BARN') return { wood: 10, stone: 4, coins: discounted(28) }
    if (key === 'WINDMILL') return { wood: 12, stone: 10, coins: discounted(60) }
    if (key === 'WELL') return { stone: 8, coins: discounted(20) }
    if (key === 'FENCE') return { wood: 2, coins: discounted(3) }
    if (key === 'LAMP_POST') return { stone: 2, coins: discounted(8) }
    if (key === 'CHICKEN') return { coins: discounted(90) }
    if (key === 'COW') return { coins: discounted(240) }
    if (key === 'DECOR_BARREL') return { coins: discounted(35) }
    if (key === 'DECOR_BENCH') return { coins: discounted(75) }
    if (key === 'DECOR_BUSH') return { coins: discounted(45) }
    if (key === 'DECOR_CRATE') return { coins: discounted(30) }
    if (key === 'DECOR_FENCE') return { coins: discounted(25) }
    if (key === 'DECOR_LAMP') return { coins: discounted(90) }
    if (key === 'DECOR_SIGN') return { coins: discounted(55) }
    if (key === 'DECOR_TREE') return { coins: discounted(110) }
    if (key?.startsWith('CROP_')) return { coins: 0 }
    if (key?.startsWith('TREE')) return { wood: 1, coins: discounted(6) }
    return { wood: 3, stone: 2, coins: discounted(12) }
  }

  private refundForObject(type: string) {
    const store = useGameStore.getState()
    if (type === 'tree') store.addResources({ wood: 3, coins: 2 })
    else if (type === 'rock' || type === 'tower' || type === 'well' || type === 'mine') store.addResources({ stone: 3, coins: 2 })
    else if (type === 'crop') store.addResources({ crops: 1 })
    else store.addResources({ wood: 2, stone: 1, coins: 3 })
  }

  private drawCropTimer(sx: number, sy: number, wx: number, wy: number, tileHeight: number) {
    const store = useGameStore.getState()
    const plot = store.cropPlots[`${wx},${wy}`]
    if (!plot || plot.harvested) return
    const now = store.day * 1440 + store.minuteOfDay
    const total = Math.max(1, plot.readyAt - plot.plantedAt)
    const progress = Phaser.Math.Clamp((now - plot.plantedAt) / total, 0, 1)
    const y = sy - tileHeight * Z_SCALE - 28
    this.g.fillStyle(0x0d0f14, 0.78)
    this.g.fillRoundedRect(sx - 18, y, 36, 6, 3)
    this.g.fillStyle(progress >= 1 ? 0x9ce55a : 0xf0c040, 1)
    this.g.fillRoundedRect(sx - 17, y + 1, 34 * progress, 4, 2)
  }

  private canPlaceFootprint(wx: number, wy: number, key: string | null) {
    if (!key || !(key in ISO_OBJECTS)) return false
    const fp = ISO_OBJECTS[key as keyof typeof ISO_OBJECTS].footprint
    const anchor = getIsoTile(this.world, wx, wy)
    if (!anchor || anchor.base === ISO_TILES.WATER.id || anchor.base === ISO_TILES.DEEPWATER.id || anchor.base === ISO_TILES.LAVA.id) return false
    for (let y = wy; y < wy + fp.h; y += 1) {
      for (let x = wx; x < wx + fp.w; x += 1) {
        const tile = getIsoTile(this.world, x, y)
        if (!tile || tile.object || tile.occupiedBy) return false
    if ((tile.height ?? 1) !== (anchor.height ?? 1)) return false
        if (tile.base === ISO_TILES.WATER.id || tile.base === ISO_TILES.DEEPWATER.id || tile.base === ISO_TILES.LAVA.id) return false
      }
    }
    return true
  }

  private drawTerrainTransitions(sx: number, sy: number, wx: number, wy: number, tile: IsoTile) {
    const dirs = [
      { side: 'north' as const, x: wx, y: wy - 1 },
      { side: 'south' as const, x: wx, y: wy + 1 },
      { side: 'east' as const, x: wx + 1, y: wy },
      { side: 'west' as const, x: wx - 1, y: wy },
    ]
    for (const dir of dirs) {
      const n = getIsoTile(this.world, dir.x, dir.y)
      if (!n || n.base === tile.base) continue
      const nDef = Object.values(ISO_TILES).find((def) => def.id === n.base)
      if (!nDef) continue
      const neighborHeight = Number.isFinite(n.height) ? n.height : 1
      const tileHeight = Number.isFinite(tile.height) ? tile.height : 1
      if (neighborHeight < tileHeight || n.base === ISO_TILES.WATER.id || n.base === ISO_TILES.DEEPWATER.id || n.base === ISO_TILES.SAND.id || n.base === ISO_TILES.DIRT.id) {
        drawTileBlend(this.g, sx, sy, nDef.top, dir.side, n.base === ISO_TILES.WATER.id || n.base === ISO_TILES.DEEPWATER.id ? 0.18 : 0.24)
      }
    }
  }

  private drawPathGeometry(sx: number, sy: number, wx: number, wy: number) {
    const isPath = (x: number, y: number) => getIsoTile(this.world, x, y)?.base === ISO_TILES.PATH.id
    drawPathConnectors(this.g, sx, sy, {
      n: isPath(wx, wy - 1),
      s: isPath(wx, wy + 1),
      e: isPath(wx + 1, wy),
      w: isPath(wx - 1, wy),
    })
  }

  private drawWaterSurface(sx: number, sy: number, wx: number, wy: number) {
    const tick = useGameStore.getState().waterAnimTick
    const phase = (tick + wx * 9 + wy * 5) % 120
    const alpha = 0.08 + (phase / 120) * 0.06
    this.g.fillStyle(0xffffff, alpha)
    this.g.fillEllipse(sx - 8, sy + TILE_HALF_H - 2, 24, 7)
    if ((wx + wy + Math.floor(tick / 20)) % 5 === 0) {
      this.g.lineStyle(1, 0xffffff, 0.18)
      this.g.strokeEllipse(sx + 10, sy + TILE_HALF_H + 3, 18, 7)
    }
  }

  private drawFootprintTint(sx: number, sy: number) {
    this.g.fillStyle(0x000000, 0.06)
    this.g.fillPoints([{ x: sx, y: sy }, { x: sx + TILE_HALF_W, y: sy + TILE_HALF_W / 2 }, { x: sx, y: sy + TILE_HALF_W }, { x: sx - TILE_HALF_W, y: sy + TILE_HALF_W / 2 }], true)
  }
}
