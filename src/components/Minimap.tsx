import React, { useRef, useEffect, useCallback } from 'react'
import { useGameStore } from '../stores/gameStore'
import { ISO_TILES, ISO_WORLD_H, ISO_WORLD_W, isoColor } from '../lib/IsoConstants'

const CELL = 4
const MAP_W = ISO_WORLD_W * CELL
const MAP_H = ISO_WORLD_H * CELL

function tileColor(tileId: number): string {
  return isoColor(Object.values(ISO_TILES).find((tile) => tile.id === tileId)?.top ?? ISO_TILES.GRASS.top)
}

export default function Minimap() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { isoWorld, townWorld, activeFarmId, player, hoveredTile, selectedTile, toggleMinimap } = useGameStore()
  const world = activeFarmId === 'town' ? townWorld : isoWorld

  const drawWorld = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !world) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, MAP_W, MAP_H)
    for (let y = 0; y < ISO_WORLD_H; y += 1) {
      for (let x = 0; x < ISO_WORLD_W; x += 1) {
        const tile = world[y][x]
        ctx.fillStyle = tileColor(tile.base)
        ctx.fillRect(x * CELL, y * CELL, CELL, CELL)
        if (tile.object) {
          const isBuilding = tile.object.type === 'civic' || tile.object.type === 'market' || tile.object.type === 'house' || tile.object.type === 'fountain'
          ctx.fillStyle = isBuilding ? '#ff5c5c' : '#ffffff'
          ctx.fillRect(x * CELL + 1, y * CELL + 1, 2, 2)
        }
      }
    }

    if (selectedTile) {
      ctx.strokeStyle = '#9ce55a'
      ctx.lineWidth = 1
      ctx.strokeRect(selectedTile.x * CELL + 0.5, selectedTile.y * CELL + 0.5, CELL - 1, CELL - 1)
    }

    if (hoveredTile) {
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 1
      ctx.strokeRect(hoveredTile.x * CELL + 0.5, hoveredTile.y * CELL + 0.5, CELL - 1, CELL - 1)
    }

    ctx.fillStyle = '#f0a020'
    ctx.fillRect(player.tileX * CELL, player.tileY * CELL, CELL, CELL)
  }, [world, player.tileX, player.tileY, hoveredTile, selectedTile])

  useEffect(() => {
    drawWorld()
  }, [drawWorld])

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <span style={styles.title}>MAP</span>
        <button onClick={toggleMinimap} style={styles.closeBtn}>x</button>
      </div>
      <canvas ref={canvasRef} width={MAP_W} height={MAP_H} style={styles.canvas} />
      <div style={styles.coords}>
        {hoveredTile ? `hover ${hoveredTile.x}, ${hoveredTile.y}` : 'drag map to pan'}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    background: '#0d0f14',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 4,
    overflow: 'hidden',
    userSelect: 'none',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '4px 8px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  },
  title: {
    fontSize: 8,
    fontFamily: 'var(--font-mono)',
    color: '#4a5568',
    letterSpacing: '0.1em',
  },
  closeBtn: {
    fontSize: 11,
    color: '#4a5568',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'var(--font-mono)',
    lineHeight: 1,
    padding: 0,
  },
  canvas: {
    display: 'block',
    imageRendering: 'pixelated',
    width: MAP_W * 1.5,
    height: MAP_H * 1.5,
  },
  coords: {
    padding: '3px 8px',
    fontSize: 8,
    fontFamily: 'var(--font-mono)',
    color: '#4a5568',
    borderTop: '1px solid rgba(255,255,255,0.04)',
  },
}
