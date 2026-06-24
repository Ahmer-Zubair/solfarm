import { useEffect, useRef, useCallback, type RefObject } from 'react'
import Phaser from 'phaser'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { AnchorProvider } from '@coral-xyz/anchor'
import { resetLegacyFarmStorageOnce, useGameStore } from '../stores/gameStore'
import { supabaseData } from '../lib/supabase'
import { IsometricScene } from '../lib/IsometricScene'
import { generateIsoWorld, getIsoTile, type IsoTile } from '../lib/IsoWorld'
import { ISO_TILES } from '../lib/IsoConstants'
import { BLOCKS } from '../lib/constants'
import { api } from '../lib/api'
import { txPlaceBlock, txMineBlock, shortKey, lamportsToSol } from '../lib/solana'

const FEE_ESTIMATE = 0.000005

function mkSig(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789'
  return Array.from({ length: 87 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export function useGame(containerRef: RefObject<HTMLDivElement>) {
  const gameRef = useRef<Phaser.Game | null>(null)
  const sceneRef = useRef<IsometricScene | null>(null)
  const worldRef = useRef<IsoTile[][] | null>(null)

  const { publicKey, wallet, signTransaction, signAllTransactions } = useWallet()
  const { connection } = useConnection()
  const store = useGameStore()

  const emitMockTx = useCallback((action: string, blockId?: number, coords?: { x: number; y: number }) => {
    const sig = mkSig()
    const blockName = blockId !== undefined
      ? (Object.values(ISO_TILES).find((tile) => tile.id === blockId)?.name ?? BLOCKS[blockId]?.name)
      : undefined
    store.addTx({
      action,
      sig,
      fee: FEE_ESTIMATE + Math.random() * 0.000002,
      status: 'confirmed',
      blockName,
      coords,
    })
  }, [store])

  const handlePlaceBlock = useCallback(async (wx: number, wy: number, blockId: number) => {
    store.setPendingTx(true)
    try {
      if (publicKey && wallet && signTransaction && signAllTransactions) {
        const provider = new AnchorProvider(
          connection,
          { publicKey, signTransaction, signAllTransactions },
          { commitment: 'confirmed' }
        )
        const sig = await txPlaceBlock(provider, wx, wy, blockId)
        store.addTx({
          action: 'place_block',
          sig,
          fee: FEE_ESTIMATE,
          status: 'confirmed',
          blockName: Object.values(ISO_TILES).find((tile) => tile.id === blockId)?.name ?? BLOCKS[blockId]?.name,
          coords: { x: wx, y: wy },
        })
      } else {
        await new Promise(r => setTimeout(r, 200 + Math.random() * 300))
        emitMockTx('place_block', blockId, { x: wx, y: wy })
      }
    } catch (e) {
      emitMockTx('place_block', blockId, { x: wx, y: wy })
    } finally {
      store.setPendingTx(false)
    }
  }, [publicKey, wallet, connection, signTransaction, signAllTransactions, store, emitMockTx])

  const handleMineBlock = useCallback(async (wx: number, wy: number) => {
    store.setPendingTx(true)
    try {
      if (publicKey && wallet && signTransaction && signAllTransactions) {
        const provider = new AnchorProvider(
          connection,
          { publicKey, signTransaction, signAllTransactions },
          { commitment: 'confirmed' }
        )
        const sig = await txMineBlock(provider, wx, wy)
        store.addTx({
          action: 'mine_block',
          sig,
          fee: FEE_ESTIMATE,
          status: 'confirmed',
          coords: { x: wx, y: wy },
        })
      } else {
        await new Promise(r => setTimeout(r, 150 + Math.random() * 200))
        emitMockTx('mine_block', undefined, { x: wx, y: wy })
      }
    } catch {
      emitMockTx('mine_block', undefined, { x: wx, y: wy })
    } finally {
      store.setPendingTx(false)
    }
  }, [publicKey, wallet, connection, signTransaction, signAllTransactions, store, emitMockTx])

  const handleInspectBlock = useCallback((wx: number, wy: number) => {
    const owner = publicKey ? shortKey(publicKey.toBase58()) : 'unowned'
    const tile = getIsoTile(useGameStore.getState().isoWorld ?? worldRef.current, wx, wy)
    const objectName = tile?.object ? tile.object.type : null
    store.addTx({
      action: 'inspect_block',
      sig: mkSig(),
      fee: 0,
      status: 'confirmed',
      coords: { x: wx, y: wy },
      blockName: objectName ? `${objectName} / ${owner}` : `owner: ${owner}`,
    })
  }, [publicKey, store])

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return

    const resetApplied = resetLegacyFarmStorageOnce()
    const loadedLocal = !resetApplied && store.loadFarmSave()
    if (!loadedLocal) {
      void supabaseData.loadFarm().then((cloudSave) => {
        if (cloudSave) store.importFarmSave(JSON.stringify(cloudSave))
      })
    }
    const loaded = useGameStore.getState()
    const seed = loaded.seed
    const world = loaded.isoWorld ?? generateIsoWorld(seed)
    worldRef.current = world
    useGameStore.getState().setIsoWorld(world, seed)
    useGameStore.getState().setWorld(new Uint8Array(256 * 128), seed)
    // Cloud restore is intentionally paused for the empty-farm reset release.
    // New local and backend saves continue from the clean farm.

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: containerRef.current.clientWidth || 800,
      height: containerRef.current.clientHeight || 500,
      backgroundColor: '#74b9d8',
      scene: [],
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      render: {
        antialias: false,
        pixelArt: true,
      },
    }

    const game = new Phaser.Game(config)
    gameRef.current = game

    game.scene.add('IsometricScene', IsometricScene, true, {
      world,
      onPlaceBlock: handlePlaceBlock,
      onMineBlock: handleMineBlock,
      onInspectBlock: handleInspectBlock,
    })
    sceneRef.current = game.scene.getScene('IsometricScene') as IsometricScene

    // --- NIGHT OVERLAY LAYOUT WATCHER ---
    const handleLayoutResize = () => {
      if (!game || !game.scale) return
      
      // Update the main game layout constraints
      game.scale.refresh()

      // Dynamically forward event with fresh dimensions to IsometricScene
      if (sceneRef.current && typeof (sceneRef.current as any).onResize === 'function') {
        (sceneRef.current as any).onResize(window.innerWidth, window.innerHeight)
      }
    }
    window.addEventListener('resize', handleLayoutResize)

    const slotInterval = setInterval(() => store.tickSlot(), 800)

    let balInterval: ReturnType<typeof setInterval>
    if (publicKey) {
      balInterval = setInterval(async () => {
        try {
          const bal = await connection.getBalance(publicKey)
          store.setSolBalance(parseFloat(lamportsToSol(bal)))
        } catch {}
      }, 5000)
    }

    return () => {
      window.removeEventListener('resize', handleLayoutResize)
      clearInterval(slotInterval)
      if (balInterval) clearInterval(balInterval)
      game.destroy(true)
      gameRef.current = null
    }
  }, []) // eslint-disable-line

  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return
  }, [publicKey, handlePlaceBlock, handleMineBlock, handleInspectBlock])

  return { gameRef, sceneRef, worldRef }
}
