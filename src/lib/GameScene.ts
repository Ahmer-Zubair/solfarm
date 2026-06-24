import Phaser from 'phaser'
import { BLOCKS, WORLD_WIDTH, WORLD_HEIGHT, BLOCK_SIZE, GRAVITY, JUMP_FORCE, MOVE_SPEED, MINE_TICK_MS } from '../lib/constants'
import { getBlock, setBlock } from '../lib/worldgen'
import { useGameStore } from '../stores/gameStore'

type Keys = {
  W: Phaser.Input.Keyboard.Key
  A: Phaser.Input.Keyboard.Key
  S: Phaser.Input.Keyboard.Key
  D: Phaser.Input.Keyboard.Key
  SPACE: Phaser.Input.Keyboard.Key
  E: Phaser.Input.Keyboard.Key
  ONE: Phaser.Input.Keyboard.Key
  TWO: Phaser.Input.Keyboard.Key
  THREE: Phaser.Input.Keyboard.Key
  FOUR: Phaser.Input.Keyboard.Key
  FIVE: Phaser.Input.Keyboard.Key
  SIX: Phaser.Input.Keyboard.Key
  SEVEN: Phaser.Input.Keyboard.Key
  EIGHT: Phaser.Input.Keyboard.Key
  NINE: Phaser.Input.Keyboard.Key
}

const TILE_TEXTURE_SIZE = 16
const VISIBLE_COLS = Math.ceil(800 / BLOCK_SIZE) + 4
const VISIBLE_ROWS = Math.ceil(500 / BLOCK_SIZE) + 4

export class GameScene extends Phaser.Scene {
  private world!: Uint8Array
  private tilePool: Map<string, Phaser.GameObjects.Rectangle> = new Map()
  private activeTiles: Set<string> = new Set()

  private playerRect!: Phaser.GameObjects.Rectangle
  private playerEyes!: Phaser.GameObjects.Rectangle
  private playerBody!: Phaser.GameObjects.Rectangle

  private camX = 0
  private camY = 0
  private playerX = 0
  private playerY = 0
  private velX = 0
  private velY = 0
  private onGround = false

  private keys!: Keys
  private pointer!: Phaser.Input.Pointer

  private miningTimer = 0
  private miningTarget: { wx: number; wy: number } | null = null
  private miningHighlight!: Phaser.GameObjects.Rectangle
  private miningBar!: Phaser.GameObjects.Rectangle
  private miningBarBg!: Phaser.GameObjects.Rectangle

  private cursorHighlight!: Phaser.GameObjects.Rectangle
  private blockPlaceGhost!: Phaser.GameObjects.Rectangle

  private onPlaceBlock!: (wx: number, wy: number, blockId: number) => void
  private onMineBlock!: (wx: number, wy: number) => void
  private onInspectBlock!: (wx: number, wy: number) => void

  private particles: Array<{
    x: number; y: number; vx: number; vy: number
    color: number; life: number; maxLife: number
    rect: Phaser.GameObjects.Rectangle
  }> = []

  private ambientLight = 1.0

  constructor() {
    super({ key: 'GameScene' })
  }

  init(data: {
    world: Uint8Array
    spawnX: number
    spawnY: number
    onPlaceBlock: (wx: number, wy: number, blockId: number) => void
    onMineBlock: (wx: number, wy: number) => void
    onInspectBlock: (wx: number, wy: number) => void
  }) {
    this.world = data.world
    this.playerX = data.spawnX
    this.playerY = data.spawnY
    this.onPlaceBlock = data.onPlaceBlock
    this.onMineBlock = data.onMineBlock
    this.onInspectBlock = data.onInspectBlock
  }

  create() {
    this.cameras.main.setBackgroundColor(0x1a2b3c)

    this.keys = this.input.keyboard!.addKeys({
      W: Phaser.Input.Keyboard.KeyCodes.W,
      A: Phaser.Input.Keyboard.KeyCodes.A,
      S: Phaser.Input.Keyboard.KeyCodes.S,
      D: Phaser.Input.Keyboard.KeyCodes.D,
      SPACE: Phaser.Input.Keyboard.KeyCodes.SPACE,
      E: Phaser.Input.Keyboard.KeyCodes.E,
      ONE: Phaser.Input.Keyboard.KeyCodes.ONE,
      TWO: Phaser.Input.Keyboard.KeyCodes.TWO,
      THREE: Phaser.Input.Keyboard.KeyCodes.THREE,
      FOUR: Phaser.Input.Keyboard.KeyCodes.FOUR,
      FIVE: Phaser.Input.Keyboard.KeyCodes.FIVE,
      SIX: Phaser.Input.Keyboard.KeyCodes.SIX,
      SEVEN: Phaser.Input.Keyboard.KeyCodes.SEVEN,
      EIGHT: Phaser.Input.Keyboard.KeyCodes.EIGHT,
      NINE: Phaser.Input.Keyboard.KeyCodes.NINE,
    }) as unknown as Keys

    this.pointer = this.input.activePointer

    // Player visuals
    this.playerBody = this.add.rectangle(0, 0, 14, 24, 0x5b9bd5).setDepth(10)
    this.playerEyes = this.add.rectangle(0, 0, 8, 4, 0xffffff).setDepth(11)
    this.playerRect = this.add.rectangle(0, 0, 14, 24, 0x000000, 0).setDepth(12)

    // Cursor
    this.cursorHighlight = this.add
      .rectangle(0, 0, BLOCK_SIZE, BLOCK_SIZE, 0xffffff, 0)
      .setStrokeStyle(1.5, 0x9ce55a, 0.8)
      .setDepth(20)

    this.blockPlaceGhost = this.add
      .rectangle(0, 0, BLOCK_SIZE, BLOCK_SIZE, 0x9ce55a, 0.15)
      .setStrokeStyle(1, 0x9ce55a, 0.6)
      .setDepth(19)
      .setVisible(false)

    // Mining UI
    this.miningHighlight = this.add
      .rectangle(0, 0, BLOCK_SIZE, BLOCK_SIZE, 0xff4444, 0.15)
      .setStrokeStyle(1.5, 0xff4444, 1)
      .setDepth(21)
      .setVisible(false)

    this.miningBarBg = this.add
      .rectangle(0, 0, BLOCK_SIZE - 2, 3, 0x111111)
      .setDepth(22)
      .setVisible(false)

    this.miningBar = this.add
      .rectangle(0, 0, 0, 3, 0x9ce55a)
      .setOrigin(0, 0.5)
      .setDepth(23)
      .setVisible(false)

    // Mouse input
    this.input.on('pointerdown', this.handleClick, this)
    this.input.on('pointermove', this.handlePointerMove, this)
    this.input.on('pointerup', () => {
      this.miningTarget = null
      this.miningTimer = 0
      this.miningHighlight.setVisible(false)
      this.miningBarBg.setVisible(false)
      this.miningBar.setVisible(false)
      useGameStore.getState().setMiningProgress(0, null)
    })

    // Mouse wheel for hotbar
    this.input.on('wheel', (_: unknown, __: unknown, ___: unknown, deltaY: number) => {
      const store = useGameStore.getState()
      const slot = (store.selectedHotbarSlot + (deltaY > 0 ? 1 : -1) + 9) % 9
      store.selectHotbarSlot(slot)
    })

    this.drawVisibleWorld()
  }

  private worldToScreen(wx: number, wy: number) {
    return {
      sx: wx * BLOCK_SIZE - this.camX + this.cameras.main.width / 2,
      sy: wy * BLOCK_SIZE - this.camY + this.cameras.main.height / 2,
    }
  }

  private screenToWorld(sx: number, sy: number) {
    return {
      wx: Math.floor((sx - this.cameras.main.width / 2 + this.camX) / BLOCK_SIZE),
      wy: Math.floor((sy - this.cameras.main.height / 2 + this.camY) / BLOCK_SIZE),
    }
  }

  private drawVisibleWorld() {
    const startTileX = Math.floor(this.camX / BLOCK_SIZE) - 2
    const startTileY = Math.floor(this.camY / BLOCK_SIZE) - 2
    const newActive = new Set<string>()

    for (let dy = 0; dy < VISIBLE_ROWS; dy++) {
      for (let dx = 0; dx < VISIBLE_COLS; dx++) {
        const wx = startTileX + dx
        const wy = startTileY + dy
        if (wx < 0 || wx >= WORLD_WIDTH || wy < 0 || wy >= WORLD_HEIGHT) continue

        const blockId = getBlock(this.world, wx, wy)
        if (blockId === 0) continue

        const key = `${wx},${wy}`
        newActive.add(key)

        if (!this.tilePool.has(key)) {
          const block = BLOCKS[blockId]
          if (!block?.color) continue

          const { sx, sy } = this.worldToScreen(wx, wy)
          const rect = this.add.rectangle(
            sx + BLOCK_SIZE / 2,
            sy + BLOCK_SIZE / 2,
            BLOCK_SIZE - 0.5,
            BLOCK_SIZE - 0.5,
            block.color
          ).setDepth(1)

          // Top highlight for surface blocks
          if (block.topColor) {
            const topIdx = getBlock(this.world, wx, wy - 1)
            if (topIdx === 0) {
              this.add.rectangle(
                sx + BLOCK_SIZE / 2,
                sy + 1,
                BLOCK_SIZE - 0.5,
                2,
                block.topColor
              ).setDepth(2)
            }
          }

          this.tilePool.set(key, rect)
        } else {
          // Update position
          const { sx, sy } = this.worldToScreen(wx, wy)
          const rect = this.tilePool.get(key)!
          rect.setPosition(sx + BLOCK_SIZE / 2, sy + BLOCK_SIZE / 2)
        }
      }
    }

    // Hide tiles that are no longer visible
    for (const key of this.activeTiles) {
      if (!newActive.has(key)) {
        this.tilePool.get(key)?.setVisible(false)
      }
    }
    for (const key of newActive) {
      this.tilePool.get(key)?.setVisible(true)
    }

    this.activeTiles = newActive
  }

  private redrawTile(wx: number, wy: number) {
    const key = `${wx},${wy}`
    if (this.tilePool.has(key)) {
      this.tilePool.get(key)!.destroy()
      this.tilePool.delete(key)
      this.activeTiles.delete(key)
    }
    const blockId = getBlock(this.world, wx, wy)
    if (blockId !== 0) {
      const block = BLOCKS[blockId]
      if (!block?.color) return
      const { sx, sy } = this.worldToScreen(wx, wy)
      const rect = this.add.rectangle(
        sx + BLOCK_SIZE / 2,
        sy + BLOCK_SIZE / 2,
        BLOCK_SIZE - 0.5,
        BLOCK_SIZE - 0.5,
        block.color
      ).setDepth(1)
      this.tilePool.set(key, rect)
      this.activeTiles.add(key)
    }
  }

  private isSolid(wx: number, wy: number): boolean {
    const b = getBlock(this.world, wx, wy)
    if (b === 0 || b === 7 || b === 8) return false
    return true
  }

  private handleClick(pointer: Phaser.Input.Pointer) {
    const store = useGameStore.getState()
    const { wx, wy } = this.screenToWorld(pointer.x, pointer.y)
    const mode = store.gameMode

    if (mode === 'inspect') {
      const b = getBlock(this.world, wx, wy)
      if (b !== 0) this.onInspectBlock(wx, wy)
      return
    }

    if (mode === 'place') {
      const b = getBlock(this.world, wx, wy)
      if (b !== 0) return
      const hotbarItem = store.hotbar[store.selectedHotbarSlot]
      if (!hotbarItem) return
      setBlock(this.world, wx, wy, hotbarItem.blockId)
      this.redrawTile(wx, wy)
      this.spawnParticles(wx, wy, BLOCKS[hotbarItem.blockId].color, 3)
      this.onPlaceBlock(wx, wy, hotbarItem.blockId)
      store.incrementPlaced()
      return
    }

    // Mine mode — held down
    if (mode === 'mine') {
      const b = getBlock(this.world, wx, wy)
      if (b === 0 || b === 15) return // can't mine air or bedrock
      const block = BLOCKS[b]
      if (!block.mineable) return
      this.miningTarget = { wx, wy }
      this.miningTimer = 0
    }
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer) {
    const { wx, wy } = this.screenToWorld(pointer.x, pointer.y)
    const { sx, sy } = this.worldToScreen(wx, wy)
    const cx = sx + BLOCK_SIZE / 2
    const cy = sy + BLOCK_SIZE / 2
    this.cursorHighlight.setPosition(cx, cy)

    const store = useGameStore.getState()
    if (store.gameMode === 'place') {
      const b = getBlock(this.world, wx, wy)
      this.blockPlaceGhost.setPosition(cx, cy).setVisible(b === 0)
    } else {
      this.blockPlaceGhost.setVisible(false)
    }
  }

  private updateMining(delta: number) {
    if (!this.miningTarget || !this.pointer.isDown) {
      return
    }

    const { wx, wy } = this.miningTarget
    const b = getBlock(this.world, wx, wy)
    if (b === 0) {
      this.miningTarget = null
      this.miningHighlight.setVisible(false)
      this.miningBarBg.setVisible(false)
      this.miningBar.setVisible(false)
      return
    }

    const block = BLOCKS[b]
    const totalTime = block.hardness * MINE_TICK_MS

    this.miningTimer += delta
    const progress = Math.min(1, this.miningTimer / totalTime)

    const { sx, sy } = this.worldToScreen(wx, wy)
    const cx = sx + BLOCK_SIZE / 2
    const cy = sy + BLOCK_SIZE / 2

    this.miningHighlight.setPosition(cx, cy).setVisible(true)
    this.miningBarBg.setPosition(cx, sy + BLOCK_SIZE - 2).setVisible(true)
    this.miningBar
      .setPosition(sx + 1, sy + BLOCK_SIZE - 2)
      .setSize((BLOCK_SIZE - 2) * progress, 3)
      .setVisible(true)

    useGameStore.getState().setMiningProgress(progress, { x: wx, y: wy })

    if (progress >= 1) {
      // Mine complete
      this.spawnParticles(wx, wy, block.color, 8)
      setBlock(this.world, wx, wy, 0)
      this.redrawTile(wx, wy)
      this.onMineBlock(wx, wy)
      useGameStore.getState().incrementMined()
      useGameStore.getState().addToInventory(b)
      this.miningTarget = null
      this.miningTimer = 0
      this.miningHighlight.setVisible(false)
      this.miningBarBg.setVisible(false)
      this.miningBar.setVisible(false)
    }
  }

  private spawnParticles(wx: number, wy: number, color: number, count: number) {
    const { sx, sy } = this.worldToScreen(wx, wy)
    for (let i = 0; i < count; i++) {
      const vx = (Math.random() - 0.5) * 4
      const vy = (Math.random() - 0.5) * 4 - 2
      const rect = this.add.rectangle(
        sx + BLOCK_SIZE / 2,
        sy + BLOCK_SIZE / 2,
        3, 3, color
      ).setDepth(30)
      this.particles.push({ x: sx + BLOCK_SIZE / 2, y: sy + BLOCK_SIZE / 2, vx, vy, color, life: 400, maxLife: 400, rect })
    }
  }

  private updateParticles(delta: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.life -= delta
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.15
      const alpha = p.life / p.maxLife
      p.rect.setPosition(p.x, p.y).setAlpha(alpha)
      if (p.life <= 0) {
        p.rect.destroy()
        this.particles.splice(i, 1)
      }
    }
  }

  private updatePhysics(delta: number) {
    const store = useGameStore.getState()
    if (store.isPaused) return

    const dt = delta / 16.67 // normalize to 60fps

    // Input
    const left  = this.keys.A.isDown
    const right = this.keys.D.isDown
    const jump  = this.keys.W.isDown || this.keys.SPACE.isDown

    if (left)  this.velX = -MOVE_SPEED
    else if (right) this.velX = MOVE_SPEED
    else this.velX *= 0.7

    if (jump && this.onGround) {
      this.velY = JUMP_FORCE
      this.onGround = false
    }

    // Gravity
    this.velY = Math.min(this.velY + GRAVITY * dt, 15)

    // Collision X
    const pw = 13, ph = 24
    const newX = this.playerX + this.velX * dt

    const testX = this.velX > 0 ? newX + pw / 2 : newX - pw / 2
    const topTile    = Math.floor((this.playerY - ph / 2) / BLOCK_SIZE)
    const bottomTile = Math.floor((this.playerY + ph / 2 - 1) / BLOCK_SIZE)
    const tileX      = Math.floor(testX / BLOCK_SIZE)

    const colX = this.isSolid(tileX, topTile) || this.isSolid(tileX, bottomTile)
    if (!colX) {
      this.playerX = newX
    } else {
      this.velX = 0
    }

    // Collision Y
    const newY = this.playerY + this.velY * dt
    const leftTile  = Math.floor((this.playerX - pw / 2) / BLOCK_SIZE)
    const rightTile = Math.floor((this.playerX + pw / 2 - 1) / BLOCK_SIZE)

    if (this.velY > 0) {
      const tileY = Math.floor((newY + ph / 2) / BLOCK_SIZE)
      if (this.isSolid(leftTile, tileY) || this.isSolid(rightTile, tileY)) {
        this.playerY = tileY * BLOCK_SIZE - ph / 2
        this.velY = 0
        this.onGround = true
      } else {
        this.playerY = newY
        this.onGround = false
      }
    } else {
      const tileY = Math.floor((newY - ph / 2) / BLOCK_SIZE)
      if (this.isSolid(leftTile, tileY) || this.isSolid(rightTile, tileY)) {
        this.playerY = (tileY + 1) * BLOCK_SIZE + ph / 2
        this.velY = 0
      } else {
        this.playerY = newY
      }
    }

    // World bounds
    this.playerX = Math.max(8, Math.min(WORLD_WIDTH * BLOCK_SIZE - 8, this.playerX))
    this.playerY = Math.max(12, Math.min(WORLD_HEIGHT * BLOCK_SIZE - 12, this.playerY))

    // Hotbar number keys
    const numKeys = [this.keys.ONE, this.keys.TWO, this.keys.THREE, this.keys.FOUR,
      this.keys.FIVE, this.keys.SIX, this.keys.SEVEN, this.keys.EIGHT, this.keys.NINE]
    numKeys.forEach((k, i) => {
      if (Phaser.Input.Keyboard.JustDown(k)) store.selectHotbarSlot(i)
    })

    // E = toggle inventory
    if (Phaser.Input.Keyboard.JustDown(this.keys.E)) store.toggleInventory()
  }

  update(time: number, delta: number) {
    this.updatePhysics(delta)
    this.updateMining(delta)
    this.updateParticles(delta)

    // Smooth camera follow
    this.camX += (this.playerX - this.camX) * 0.12
    this.camY += (this.playerY - this.camY) * 0.12

    // Clamp camera
    const hw = this.cameras.main.width / 2
    const hh = this.cameras.main.height / 2
    this.camX = Math.max(hw, Math.min(WORLD_WIDTH * BLOCK_SIZE - hw, this.camX))
    this.camY = Math.max(hh, Math.min(WORLD_HEIGHT * BLOCK_SIZE - hh, this.camY))

    // Update player visual
    const { sx: px, sy: py } = this.worldToScreen(0, 0)
    const screenPX = this.playerX - this.camX + this.cameras.main.width / 2
    const screenPY = this.playerY - this.camY + this.cameras.main.height / 2

    this.playerBody.setPosition(screenPX, screenPY)
    this.playerEyes.setPosition(screenPX + (this.velX >= 0 ? 2 : -2), screenPY - 4)

    // Redraw world each frame (only changed tiles)
    this.drawVisibleWorld()

    // Update store
    useGameStore.getState().updatePlayer({
      x: this.playerX,
      y: this.playerY,
      velX: this.velX,
      velY: this.velY,
      onGround: this.onGround,
    })
  }

  refreshTile(wx: number, wy: number) {
    this.redrawTile(wx, wy)
  }
}
