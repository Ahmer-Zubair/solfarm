import React from 'react'
import { useGameStore } from '../stores/gameStore'
import { ISO_OBJECTS, ISO_TILE_LIST, isoColor } from '../lib/IsoConstants'

const QUICK_OBJECTS = ['HOUSE', 'BARN', 'WINDMILL', 'TREE_OAK', 'TREE_PINE', 'CROP_WHEAT', 'CROP_CORN', 'CROP_STRAWBERRY', 'CROP_PUMPKIN', 'WELL', 'CHEST', 'FENCE', 'LAMP_POST'] as const

export default function Hotbar() {
  const store = useGameStore()

  return (
    <div style={styles.bar}>
      <div style={styles.group}>
        <div style={styles.groupLabel}>terrain</div>
        <div style={styles.slots}>
          {ISO_TILE_LIST.map((tile) => {
            const active = store.gameMode === 'terrain' && store.selectedTileType === tile.id
            return (
              <button
                key={tile.id}
                onClick={() => {
                  store.setGameMode('terrain')
                  useGameStore.setState({ selectedTileType: tile.id })
                }}
                title={`${tile.name} - ${tile.solValue.toFixed(3)} SOL`}
                style={{ ...styles.slot, ...(active ? styles.slotActive : {}) }}
              >
                <span style={{ ...styles.tileDiamond, background: isoColor(tile.top) }} />
                <span style={styles.name}>{tile.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div style={styles.group}>
        <div style={styles.groupLabel}>build</div>
        <div style={styles.slots}>
          {QUICK_OBJECTS.map((key) => {
            const obj = ISO_OBJECTS[key]
            const active = store.gameMode === 'build' && store.selectedObjectType === key
            return (
              <button
                key={key}
                onClick={() => {
                  store.setGameMode('build')
                  store.setSelectedObjectType(key)
                }}
                title={`${obj.label} - ${obj.solValue.toFixed(3)} SOL`}
                style={{ ...styles.slot, ...(active ? styles.slotActive : {}) }}
              >
                <span style={{ ...styles.objectSwatch, background: isoColor(obj.color) }} />
                <span style={styles.name}>{obj.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div style={styles.modeTag}>
        <div style={{
          ...styles.modeDot,
          background: store.gameMode === 'demolish' ? '#ff6b6b'
            : store.gameMode === 'terrain' || store.gameMode === 'build' ? '#9ce55a'
              : '#60a5fa',
        }} />
        <span style={styles.modeLabel}>
          {store.gameMode}
          {store.hoveredTile ? ` (${store.hoveredTile.x}, ${store.hoveredTile.y})` : ''}
        </span>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  bar: {
    minHeight: 70,
    flexShrink: 0,
    background: '#0d0f14',
    borderTop: '1px solid rgba(255,255,255,0.07)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: '8px 16px',
    position: 'relative',
  },
  group: {
    display: 'flex',
    flexDirection: 'column',
    gap: 5,
  },
  groupLabel: {
    fontSize: 8,
    fontFamily: 'var(--font-mono)',
    color: '#4a5568',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
  },
  slots: {
    display: 'flex',
    gap: 4,
  },
  slot: {
    width: 48,
    height: 44,
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 4,
    background: '#141720',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    userSelect: 'none',
  },
  slotActive: {
    border: '1.5px solid #9ce55a',
    background: 'rgba(156,229,90,0.08)',
  },
  tileDiamond: {
    width: 18,
    height: 18,
    transform: 'rotate(45deg) scaleY(0.55)',
    borderRadius: 2,
    boxShadow: 'inset -3px -3px 0 rgba(0,0,0,0.18)',
  },
  objectSwatch: {
    width: 18,
    height: 18,
    borderRadius: 3,
    boxShadow: 'inset 0 -4px 0 rgba(0,0,0,0.2)',
  },
  name: {
    fontSize: 7,
    fontFamily: 'var(--font-mono)',
    color: '#8892a4',
    textAlign: 'center',
    lineHeight: 1,
    maxWidth: 44,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  modeTag: {
    position: 'absolute',
    right: 14,
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    userSelect: 'none',
  },
  modeDot: {
    width: 5,
    height: 5,
    borderRadius: '50%',
  },
  modeLabel: {
    fontSize: 9,
    fontFamily: 'var(--font-mono)',
    color: '#4a5568',
    letterSpacing: '0.06em',
  },
}
