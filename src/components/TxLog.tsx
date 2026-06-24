import React, { useEffect, useRef } from 'react'
import { useGameStore, TxEntry } from '../stores/gameStore'

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 5) return 'just now'
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  return `${Math.floor(s / 3600)}h ago`
}

function actionColor(action: string): string {
  if (action.includes('place')) return '#9ce55a'
  if (action.includes('mine'))  return '#ff6b6b'
  if (action.includes('mint'))  return '#f0c040'
  if (action.includes('inspect')) return '#60a5fa'
  return '#8892a4'
}

function actionLabel(action: string): string {
  const map: Record<string, string> = {
    place_block:   '↑ place',
    mine_block:    '⛏ mine',
    mint_nft:      '◈ mint',
    inspect_block: '◉ inspect',
  }
  return map[action] ?? action
}

function TxItem({ tx }: { tx: TxEntry }) {
  const [, forceUpdate] = React.useReducer(x => x + 1, 0)
  useEffect(() => {
    const t = setInterval(forceUpdate, 5000)
    return () => clearInterval(t)
  }, [])

  const statusColor = tx.status === 'confirmed' ? '#9ce55a'
    : tx.status === 'pending' ? '#f0c040'
    : '#ff6b6b'

  return (
    <div style={styles.item}>
      <div style={styles.itemHeader}>
        <span style={{ ...styles.action, color: actionColor(tx.action) }}>
          {actionLabel(tx.action)}
        </span>
        {tx.blockName && (
          <span style={styles.blockTag}>{tx.blockName}</span>
        )}
        <span style={{ ...styles.dot, background: statusColor }} title={tx.status} />
      </div>

      <div style={styles.sig}>
        {tx.sig.slice(0, 14)}…{tx.sig.slice(-6)}
      </div>

      <div style={styles.meta}>
        {tx.fee > 0 && (
          <span style={styles.fee}>◎ {tx.fee.toFixed(6)}</span>
        )}
        {tx.fee === 0 && (
          <span style={{ ...styles.fee, color: '#2d3748' }}>read-only</span>
        )}
        {tx.coords && (
          <span style={styles.coords}>({tx.coords.x},{tx.coords.y})</span>
        )}
        <span style={styles.time}>{timeAgo(tx.timestamp)}</span>
      </div>
    </div>
  )
}

export default function TxLog() {
  const { txLog, toggleTxLog } = useGameStore()
  const listRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to top on new tx
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = 0
    }
  }, [txLog.length])

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.liveDot} />
          <span style={styles.title}>TX LOG</span>
          {txLog.length > 0 && (
            <span style={styles.countBadge}>{txLog.length}</span>
          )}
        </div>
        <button onClick={toggleTxLog} style={styles.closeBtn} title="Hide tx log">
          ×
        </button>
      </div>

      <div ref={listRef} style={styles.list}>
        {txLog.length === 0 ? (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>◎</div>
            <div style={styles.emptyText}>no transactions yet</div>
            <div style={styles.emptyHint}>
              mine or place blocks to emit on-chain txns
            </div>
          </div>
        ) : (
          txLog.slice(0, 30).map(tx => <TxItem key={tx.id} tx={tx} />)
        )}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    minHeight: 0,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    flexShrink: 0,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: '50%',
    background: '#9ce55a',
    boxShadow: '0 0 4px #9ce55a',
    animation: 'pulse 2s ease-in-out infinite',
  },
  title: {
    fontSize: 9,
    fontFamily: 'var(--font-mono)',
    color: '#4a5568',
    letterSpacing: '0.12em',
    fontWeight: 600,
  },
  countBadge: {
    fontSize: 8,
    fontFamily: 'var(--font-mono)',
    color: '#4a5568',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 3,
    padding: '0 4px',
  },
  closeBtn: {
    fontSize: 14,
    color: '#2d3748',
    cursor: 'pointer',
    lineHeight: 1,
    padding: '0 2px',
    background: 'transparent',
    border: 'none',
    fontFamily: 'var(--font-mono)',
  },
  list: {
    flex: 1,
    overflowY: 'auto',
    padding: '4px 0',
  },
  item: {
    padding: '7px 12px',
    borderBottom: '1px solid rgba(255,255,255,0.03)',
    cursor: 'default',
  },
  itemHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  action: {
    fontSize: 10,
    fontFamily: 'var(--font-mono)',
    fontWeight: 500,
    letterSpacing: '0.02em',
  },
  blockTag: {
    fontSize: 9,
    fontFamily: 'var(--font-mono)',
    color: '#4a5568',
    background: 'rgba(255,255,255,0.04)',
    borderRadius: 2,
    padding: '0 4px',
  },
  dot: {
    marginLeft: 'auto',
    width: 5,
    height: 5,
    borderRadius: '50%',
    flexShrink: 0,
  },
  sig: {
    fontSize: 9,
    fontFamily: 'var(--font-mono)',
    color: '#2d3748',
    marginBottom: 3,
    letterSpacing: '0.02em',
  },
  meta: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  fee: {
    fontSize: 9,
    fontFamily: 'var(--font-mono)',
    color: '#4a5568',
  },
  coords: {
    fontSize: 9,
    fontFamily: 'var(--font-mono)',
    color: '#2d3748',
  },
  time: {
    fontSize: 9,
    fontFamily: 'var(--font-mono)',
    color: '#2d3748',
    marginLeft: 'auto',
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    gap: 8,
  },
  emptyIcon: {
    fontSize: 20,
    color: '#1a1d26',
  },
  emptyText: {
    fontSize: 10,
    fontFamily: 'var(--font-mono)',
    color: '#2d3748',
    letterSpacing: '0.05em',
  },
  emptyHint: {
    fontSize: 9,
    fontFamily: 'var(--font-mono)',
    color: '#1a2535',
    textAlign: 'center',
    lineHeight: 1.5,
    maxWidth: 160,
  },
}
