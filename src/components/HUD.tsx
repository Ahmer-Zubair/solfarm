import React from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { useGameStore, type GameMode } from '../stores/gameStore'

const MODES: { id: GameMode; label: string; tip: string }[] = [
  { id: 'terrain', label: 'terrain', tip: 'Paint ground tiles' },
  { id: 'build', label: 'build', tip: 'Place buildings and objects' },
  { id: 'demolish', label: 'demolish', tip: 'Remove objects' },
  { id: 'inspect', label: 'inspect', tip: 'Inspect tiles and objects' },
]

export default function HUD() {
  const { publicKey } = useWallet()
  const store = useGameStore()

  const addr = publicKey
    ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`
    : null
  const hour = Math.floor(store.minuteOfDay / 60)
  const minute = store.minuteOfDay % 60
  const timeLabel = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
  const isNight = hour < 6 || hour >= 19
  const isTown = store.activeFarmId === 'town'
  const visibleModes = isTown ? MODES.filter((mode) => mode.id === 'inspect') : MODES

  // Actual dynamic coins balance tracker from state store
  const currentCoins = store.resources?.coins ?? 200

  return (
    <div className="game-hud" style={styles.hud}>
      <div className="game-hud__brand" style={styles.left}>
        <span style={styles.logo}>
          SOL<span style={{ color: '#9ce55a' }}>FARM</span>
        </span>
        <span style={styles.badge}>{isTown ? 'town district' : 'isometric devnet'}</span>
        {/* Dynamic global coins tracker label added seamlessly for live verification */}
        <span style={{ ...styles.badge, background: 'rgba(240,192,64,0.12)', borderColor: 'rgba(240,192,64,0.3)', color: '#f0c040', marginLeft: '4px' }}>
          {currentCoins.toLocaleString()} C
        </span>
      </div>

      <div className="game-hud__modes" style={styles.center}>
        {visibleModes.map((m) => (
          <button
            key={m.id}
            onClick={() => store.setGameMode(m.id)}
            title={m.tip}
            style={{
              ...styles.modeBtn,
              ...(store.gameMode === m.id ? styles.modeBtnActive : {}),
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="game-hud__actions" style={styles.right}>
        <div style={styles.onlinePill} title="Players connected to SolFarm realtime">
          <i style={{ ...styles.onlineDot, background: store.multiplayerStatus === 'online' ? '#6ee787' : '#f0c040' }} />
          <span>
            {store.multiplayerStatus === 'online'
              ? `${store.remotePlayers.length + 1} online`
              : store.multiplayerStatus === 'connecting' ? 'connecting' : 'local mode'}
          </span>
        </div>
        {!isTown && (
          <button
            onClick={() => {
              store.setGameMode('build')
              store.setSelectedObjectType('HOUSE')
              store.setSelectedActionLabel('farmhouse selected - choose where to build it')
            }}
            style={styles.actionBtn}
            title="Select the farmhouse for manual placement"
          >
            farmhouse
          </button>
        )}
        {isTown && (
          <button onClick={store.returnHomeFarm} style={{ ...styles.actionBtn, ...styles.backBtn }}>
            Back to Farm
          </button>
        )}
        <button onClick={store.toggleChat} style={styles.actionBtn}>
          chat
        </button>
        <button onClick={store.toggleVisitPanel} style={styles.actionBtn}>
          visit
        </button>
        <button onClick={store.toggleSocialHub} style={{ ...styles.actionBtn, ...styles.townBtn }}>
          town
        </button>
        <button onClick={store.toggleMarketplace} style={{ ...styles.actionBtn, ...styles.marketBtn }}>
          market
        </button>

        <div style={styles.stat}>
          <span style={styles.statLabel}>day {store.day}</span>
          <span style={{ ...styles.statVal, color: isNight ? '#8fb3ff' : '#f0c040' }}>{timeLabel}</span>
        </div>

        {store.pendingTx && (
          <div style={styles.pending}>
            <span style={styles.spinner}>o</span>
            <span>signing tx...</span>
          </div>
        )}

        {addr ? (
          <div style={styles.walletTag}>
            <div style={styles.walletDot} />
            <span>{addr}</span>
          </div>
        ) : (
          <div className="wallet-adapter-wrapper" style={{ minHeight: '32px' }}>
            <WalletMultiButton />
          </div>
        )}
      </div>

      {store.selectedActionLabel && (
        <div style={styles.actionToast}>{store.selectedActionLabel}</div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  hud: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 14px',
    height: 42,
    background: '#0d0f14',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    flexShrink: 0,
    gap: 12,
    userSelect: 'none',
    position: 'relative',
    zIndex: 30,
    boxSizing: 'border-box',
    willChange: 'transform',
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: '0.1em',
    fontFamily: 'var(--font-mono)',
  },
  badge: {
    fontSize: 9,
    padding: '1px 5px',
    borderRadius: 3,
    background: 'rgba(156,229,90,0.12)',
    border: '1px solid rgba(156,229,90,0.25)',
    color: '#9ce55a',
    fontFamily: 'var(--font-mono)',
    letterSpacing: '0.05em',
  },
  center: {
    display: 'flex',
    gap: 4,
  },
  modeBtn: {
    fontSize: 10,
    padding: '4px 10px',
    borderRadius: 4,
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'transparent',
    color: '#8892a4',
    fontFamily: 'var(--font-mono)',
    cursor: 'pointer',
    letterSpacing: '0.05em',
    transition: 'all 0.15s ease-in-out',
    boxSizing: 'border-box',
  },
  modeBtnActive: {
    borderColor: 'rgba(156,229,90,0.55)',
    color: '#9ce55a',
    background: 'rgba(156,229,90,0.08)',
    boxShadow: '0 0 12px rgba(156,229,90,0.15)',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  onlinePill: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    minHeight: 28,
    padding: '0 9px',
    border: '1px solid rgba(110,231,135,0.22)',
    borderRadius: 6,
    background: 'rgba(110,231,135,0.07)',
    color: '#ccefd4',
    fontSize: 9,
    whiteSpace: 'nowrap',
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    boxShadow: '0 0 10px currentColor',
  },
  actionBtn: {
    fontSize: 9,
    padding: '4px 8px',
    borderRadius: 4,
    border: '1px solid rgba(255,255,255,0.08)',
    background: '#141720',
    color: '#8892a4',
    fontFamily: 'var(--font-mono)',
    cursor: 'pointer',
    letterSpacing: '0.04em',
    transition: 'all 0.12s ease-in-out',
    boxSizing: 'border-box',
  },
  marketBtn: {
    borderColor: 'rgba(240,192,64,0.35)',
    color: '#f0c040',
    background: 'rgba(240,192,64,0.08)',
  },
  townBtn: {
    borderColor: 'rgba(92,237,240,0.35)',
    color: '#5cedf0',
    background: 'rgba(92,237,240,0.08)',
  },
  backBtn: {
    borderColor: 'rgba(156,229,90,0.48)',
    color: '#9ce55a',
    background: 'rgba(156,229,90,0.1)',
    fontWeight: 800,
  },
  pending: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    fontSize: 10,
    color: '#f0c040',
    fontFamily: 'var(--font-mono)',
  },
  spinner: {
    display: 'inline-block',
    animation: 'spin 1s linear infinite',
    fontSize: 12,
  },
  stat: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 10,
    fontFamily: 'var(--font-mono)',
  },
  statLabel: {
    color: '#4a5568',
  },
  statVal: {
    color: '#8892a4',
  },
  walletTag: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    fontSize: 10,
    fontFamily: 'var(--font-mono)',
    color: '#9ce55a',
    padding: '3px 8px',
    border: '1px solid rgba(156,229,90,0.3)',
    borderRadius: 4,
    background: 'rgba(156,229,90,0.05)',
  },
  walletDot: {
    width: 5,
    height: 5,
    borderRadius: '50%',
    background: '#9ce55a',
  },
  actionToast: {
    position: 'absolute',
    left: 14,
    top: 48,
    padding: '6px 10px',
    borderRadius: 6,
    background: 'rgba(13,15,20,0.9)',
    border: '1px solid rgba(156,229,90,0.3)',
    color: '#9ce55a',
    fontSize: 9,
    fontFamily: 'var(--font-mono)',
    boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
  },
}
