import React, { useEffect, useState } from 'react'
import { useGameStore } from '../stores/gameStore'
import { BLOCKS, RARITY_COLORS } from '../lib/constants'

function hexColor(n: number): string {
  return '#' + n.toString(16).padStart(6, '0')
}

export default function InventoryModal() {
  const store = useGameStore()
  const { inventory, hotbar, selectedHotbarSlot } = store
  const [assignMode, setAssignMode] = useState<number | null>(null) // blockId being assigned

  // Close on E key or Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'e' || e.key === 'E' || e.key === 'Escape') {
        store.toggleInventory()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [store])

  const handleItemClick = (blockId: number) => {
    setAssignMode(blockId === assignMode ? null : blockId)
  }

  const handleSlotAssign = (slotIdx: number) => {
    if (assignMode === null) return
    store.setHotbarBlock(slotIdx, assignMode)
    setAssignMode(null)
  }

  return (
    <div style={styles.overlay} onClick={() => store.toggleInventory()}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <span style={styles.title}>INVENTORY</span>
          <span style={styles.hint}>E · ESC to close</span>
          <button onClick={() => store.toggleInventory()} style={styles.closeBtn}>×</button>
        </div>

        {/* Inventory grid */}
        <div style={styles.section}>
          <div style={styles.sectionLabel}>
            ITEMS ({inventory.length} types)
            {assignMode !== null && (
              <span style={styles.assignHint}>
                → click a hotbar slot to assign {BLOCKS[assignMode]?.name}
              </span>
            )}
          </div>
          {inventory.length === 0 ? (
            <div style={styles.emptyInv}>
              mine blocks to collect items
            </div>
          ) : (
            <div style={styles.grid}>
              {inventory.map(item => {
                const block = BLOCKS[item.blockId]
                if (!block) return null
                const isAssigning = assignMode === item.blockId
                return (
                  <div
                    key={item.blockId}
                    onClick={() => handleItemClick(item.blockId)}
                    style={{
                      ...styles.invCell,
                      ...(isAssigning ? styles.invCellActive : {}),
                    }}
                    title={`${block.name} × ${item.count} — ${block.rarity}\nSOL value: ◎${block.solValue}`}
                  >
                    <div
                      style={{
                        ...styles.invSwatch,
                        background: hexColor(block.color),
                        boxShadow: block.glows
                          ? `0 0 5px ${hexColor(block.glowColor ?? block.color)}66`
                          : undefined,
                      }}
                    />
                    <div style={styles.invName}>{block.name}</div>
                    <div style={{
                      ...styles.invCount,
                      color: item.count <= 4 ? '#f0c040' : '#4a5568',
                    }}>
                      ×{item.count}
                    </div>
                    <div style={{
                      ...styles.invRarity,
                      color: RARITY_COLORS[block.rarity],
                    }}>
                      {block.rarity}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Hotbar editor */}
        <div style={styles.section}>
          <div style={styles.sectionLabel}>HOTBAR (click to assign selected item)</div>
          <div style={styles.hotbarEdit}>
            {hotbar.map((item, i) => {
              const block = item ? BLOCKS[item.blockId] : null
              const isSelected = i === selectedHotbarSlot
              const isTarget = assignMode !== null
              return (
                <div
                  key={i}
                  onClick={() => isTarget ? handleSlotAssign(i) : store.selectHotbarSlot(i)}
                  style={{
                    ...styles.hotbarCell,
                    ...(isSelected ? styles.hotbarCellSelected : {}),
                    ...(isTarget ? styles.hotbarCellTarget : {}),
                  }}
                  title={block ? block.name : `slot ${i + 1} (empty)`}
                >
                  <div style={styles.slotNum}>{i + 1}</div>
                  {block ? (
                    <div
                      style={{
                        ...styles.invSwatch,
                        background: hexColor(block.color),
                        width: 20,
                        height: 20,
                      }}
                    />
                  ) : (
                    <div style={styles.emptySlot} />
                  )}
                  {block && (
                    <div style={{ ...styles.invName, fontSize: 7 }}>{block.name}</div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Value summary */}
        {inventory.length > 0 && (
          <div style={styles.footer}>
            <span style={styles.footerLabel}>estimated NFT value</span>
            <span style={styles.footerValue}>
              ◎ {inventory.reduce((sum, item) => {
                const b = BLOCKS[item.blockId]
                return sum + (b ? b.solValue * item.count : 0)
              }, 0).toFixed(4)}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(2px)',
  },
  modal: {
    width: 500,
    maxHeight: '80vh',
    background: '#141720',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 8,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '12px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    flexShrink: 0,
  },
  title: {
    fontSize: 12,
    fontFamily: 'var(--font-mono)',
    fontWeight: 600,
    color: '#e8eaf0',
    letterSpacing: '0.1em',
  },
  hint: {
    fontSize: 9,
    fontFamily: 'var(--font-mono)',
    color: '#2d3748',
  },
  closeBtn: {
    marginLeft: 'auto',
    fontSize: 16,
    color: '#4a5568',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'var(--font-mono)',
    lineHeight: 1,
  },
  section: {
    padding: '12px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
  },
  sectionLabel: {
    fontSize: 9,
    fontFamily: 'var(--font-mono)',
    color: '#2d3748',
    letterSpacing: '0.1em',
    marginBottom: 10,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  assignHint: {
    color: '#f0c040',
    fontSize: 9,
  },
  emptyInv: {
    fontSize: 10,
    fontFamily: 'var(--font-mono)',
    color: '#2d3748',
    padding: '16px 0',
    textAlign: 'center',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(8, 1fr)',
    gap: 4,
    maxHeight: 200,
    overflowY: 'auto',
  },
  invCell: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
    padding: '6px 4px',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 4,
    cursor: 'pointer',
    background: '#0d0f14',
    position: 'relative',
  },
  invCellActive: {
    border: '1px solid #f0c040',
    background: 'rgba(240,192,64,0.06)',
  },
  invSwatch: {
    width: 22,
    height: 22,
    borderRadius: 2,
    imageRendering: 'pixelated',
  },
  invName: {
    fontSize: 7,
    fontFamily: 'var(--font-mono)',
    color: '#4a5568',
    textAlign: 'center',
    lineHeight: 1,
  },
  invCount: {
    fontSize: 7,
    fontFamily: 'var(--font-mono)',
  },
  invRarity: {
    fontSize: 6,
    fontFamily: 'var(--font-mono)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  hotbarEdit: {
    display: 'flex',
    gap: 4,
  },
  hotbarCell: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
    padding: '6px 2px',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 4,
    cursor: 'pointer',
    background: '#0d0f14',
    position: 'relative',
    minWidth: 0,
  },
  hotbarCellSelected: {
    border: '1px solid rgba(156,229,90,0.4)',
  },
  hotbarCellTarget: {
    border: '1px solid rgba(240,192,64,0.4)',
    background: 'rgba(240,192,64,0.04)',
  },
  slotNum: {
    fontSize: 7,
    fontFamily: 'var(--font-mono)',
    color: '#2d3748',
    position: 'absolute',
    top: 2,
    left: 4,
  },
  emptySlot: {
    width: 20,
    height: 20,
    border: '1px dashed rgba(255,255,255,0.06)',
    borderRadius: 2,
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 16px',
    flexShrink: 0,
  },
  footerLabel: {
    fontSize: 9,
    fontFamily: 'var(--font-mono)',
    color: '#2d3748',
  },
  footerValue: {
    fontSize: 12,
    fontFamily: 'var(--font-mono)',
    color: '#9ce55a',
    fontWeight: 600,
  },
}
