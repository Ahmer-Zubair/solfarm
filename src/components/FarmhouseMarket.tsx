import React from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useGameStore, type FarmhouseStyle } from '../stores/gameStore'

const rarityColor: Record<FarmhouseStyle['rarity'], string> = {
  common: '#c8d0d8',
  uncommon: '#9ce55a',
  rare: '#5cedf0',
  epic: '#b97cff',
  mythic: '#f0c040',
}

export default function FarmhouseMarket() {
  const { publicKey } = useWallet()
  const store = useGameStore()
  const active = store.farmhouseStyles.find((style) => style.id === store.activeFarmhouseStyleId)
  const ownedCount = store.farmhouseStyles.filter((style) => style.owned).length
  const listedCount = store.farmhouseStyles.filter((style) => style.listed).length
  const mintedHomes = store.mintedItems.filter((item) => item.kind === 'farmhouse').length

  return (
    <div style={styles.overlay}>
      <div style={styles.panel}>
        <div style={styles.header}>
          <div>
            <div style={styles.eyebrow}>farmstead market</div>
            <div style={styles.title}>Own the House, Grow the Farm</div>
          </div>
          <button onClick={store.toggleMarketplace} style={styles.close}>x</button>
        </div>

        <div style={styles.hero}>
          <HousePreview styleDef={active ?? store.farmhouseStyles[0]} />
          <div style={styles.heroCopy}>
            <div style={styles.heroKicker}>{publicKey ? 'wallet linked' : 'guest market preview'}</div>
            <div style={styles.heroTitle}>{active?.name ?? 'Starter Cottage'}</div>
            <div style={styles.heroText}>
              Buy farmhouse styles with earned coins now. Wallet ownership, listing, and peer trading are staged for the backend/Solana marketplace layer.
            </div>
            <div style={styles.statStrip}>
              <MarketStat label="owned styles" value={ownedCount} />
              <MarketStat label="listed homes" value={listedCount} />
              <MarketStat label="minted homes" value={mintedHomes} />
              <MarketStat label="farmers online" value={19 + (store.day % 7)} />
            </div>
          </div>
        </div>

        <div style={styles.rarityBar}>
          {(['common', 'uncommon', 'rare', 'epic', 'mythic'] as FarmhouseStyle['rarity'][]).map((rarity) => (
            <span key={rarity} style={{ ...styles.rarityPill, borderColor: rarityColor[rarity], color: rarityColor[rarity] }}>
              {rarity}
            </span>
          ))}
        </div>

        <div style={styles.grid}>
          {store.farmhouseStyles.map((styleDef) => {
            const isActive = styleDef.id === store.activeFarmhouseStyleId
            return (
              <div key={styleDef.id} style={{ ...styles.card, ...(isActive ? styles.cardActive : {}) }}>
                <HousePreview styleDef={styleDef} small />
                <div style={styles.cardBody}>
                  <div style={styles.cardTop}>
                    <span style={styles.cardTitle}>{styleDef.name}</span>
                    <span style={{ ...styles.rarity, color: rarityColor[styleDef.rarity] }}>{styleDef.rarity}</span>
                  </div>
                  <div style={styles.tagline}>{styleDef.tagline}</div>
                  <div style={styles.metaRow}>
                    <span>{styleDef.footprint}</span>
                    <span>{styleDef.coinPrice === 0 ? 'starter' : `${styleDef.coinPrice} coins`}</span>
                    <span>{styleDef.solPrice.toFixed(3)} SOL later</span>
                  </div>
                  <div style={styles.actions}>
                    {styleDef.owned ? (
                      <button onClick={() => store.setActiveFarmhouseStyle(styleDef.id)} style={styles.primaryBtn}>
                        {isActive ? 'equipped' : 'equip'}
                      </button>
                    ) : (
                      <button onClick={() => store.buyFarmhouseStyle(styleDef.id)} style={styles.primaryBtn}>
                        buy
                      </button>
                    )}
                    <button
                      onClick={() => store.listFarmhouseStyle(styleDef.id)}
                      disabled={!styleDef.owned}
                      style={{ ...styles.secondaryBtn, opacity: styleDef.owned ? 1 : 0.45 }}
                    >
                      {styleDef.listed ? 'unlist' : 'list'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div style={styles.footer}>
          <span>Marketplace model: guest preview to wallet cloud save to server listings to compressed NFT homes.</span>
          <span>{store.resources.coins} coins available</span>
        </div>
      </div>
    </div>
  )
}

function MarketStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={styles.marketStat}>
      <span style={styles.marketStatVal}>{value}</span>
      <span style={styles.marketStatLabel}>{label}</span>
    </div>
  )
}

function HousePreview({ styleDef, small = false }: { styleDef: FarmhouseStyle; small?: boolean }) {
  const scale = small ? 0.72 : 1
  return (
    <div style={{ ...styles.preview, width: small ? 116 : 160, height: small ? 104 : 136 }}>
      <div style={{ ...styles.shadow, transform: `translateX(-50%) scale(${scale})` }} />
      <div style={{ ...styles.house, transform: `translateX(-50%) scale(${scale})` }}>
        <div style={{ ...styles.roofLeft, background: styleDef.palette.roof }} />
        <div style={{ ...styles.roofRight, background: shade(styleDef.palette.roof, 0.75) }} />
        <div style={{ ...styles.wallLeft, background: shade(styleDef.palette.wall, 0.84) }} />
        <div style={{ ...styles.wallRight, background: shade(styleDef.palette.wall, 0.68) }} />
        <div style={{ ...styles.door }} />
        <div style={{ ...styles.window, left: 76 }} />
        <div style={{ ...styles.window, left: 30 }} />
        <div style={{ ...styles.trim, background: styleDef.palette.trim }} />
      </div>
    </div>
  )
}

function shade(hex: string, factor: number) {
  const clean = hex.replace('#', '')
  const r = Math.floor(parseInt(clean.slice(0, 2), 16) * factor)
  const g = Math.floor(parseInt(clean.slice(2, 4), 16) * factor)
  const b = Math.floor(parseInt(clean.slice(4, 6), 16) * factor)
  return `rgb(${r}, ${g}, ${b})`
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 1300,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    background: 'rgba(5,8,12,0.78)',
  },
  panel: {
    width: 980,
    maxWidth: 'calc(100vw - 28px)',
    maxHeight: 'calc(100vh - 28px)',
    overflow: 'auto',
    borderRadius: 8,
    border: '1px solid rgba(156,229,90,0.22)',
    background: '#0d0f14',
    boxShadow: '0 24px 80px rgba(0,0,0,0.45)',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 16,
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  eyebrow: {
    color: '#9ce55a',
    fontSize: 9,
    fontFamily: 'var(--font-mono)',
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
  },
  title: {
    marginTop: 5,
    color: '#f2f4f8',
    fontSize: 22,
    fontFamily: 'var(--font-mono)',
    fontWeight: 800,
  },
  close: {
    border: 'none',
    background: 'transparent',
    color: '#8892a4',
    cursor: 'pointer',
    fontFamily: 'var(--font-mono)',
  },
  hero: {
    display: 'grid',
    gridTemplateColumns: '180px 1fr',
    gap: 16,
    padding: 16,
    background: 'linear-gradient(180deg, rgba(156,229,90,0.08), rgba(92,237,240,0.035))',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  heroCopy: {
    minWidth: 0,
  },
  heroKicker: {
    color: '#f0c040',
    fontSize: 10,
    fontFamily: 'var(--font-mono)',
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
  },
  heroTitle: {
    marginTop: 8,
    color: '#e8eaf0',
    fontSize: 18,
    fontFamily: 'var(--font-mono)',
    fontWeight: 800,
  },
  heroText: {
    marginTop: 8,
    maxWidth: 650,
    color: '#8892a4',
    fontSize: 12,
    lineHeight: 1.55,
    fontFamily: 'var(--font-mono)',
  },
  statStrip: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: 8,
    marginTop: 14,
  },
  marketStat: {
    padding: 8,
    borderRadius: 5,
    background: 'rgba(255,255,255,0.035)',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  marketStatVal: {
    display: 'block',
    color: '#9ce55a',
    fontSize: 15,
    fontFamily: 'var(--font-mono)',
    fontWeight: 800,
  },
  marketStatLabel: {
    color: '#4a5568',
    fontSize: 8,
    fontFamily: 'var(--font-mono)',
    textTransform: 'uppercase',
  },
  rarityBar: {
    display: 'flex',
    gap: 8,
    padding: '12px 16px 0',
    flexWrap: 'wrap',
  },
  rarityPill: {
    padding: '4px 8px',
    borderRadius: 4,
    border: '1px solid',
    fontSize: 9,
    fontFamily: 'var(--font-mono)',
    textTransform: 'uppercase',
    background: 'rgba(255,255,255,0.025)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: 10,
    padding: 16,
  },
  card: {
    display: 'grid',
    gridTemplateColumns: '104px 1fr',
    minHeight: 140,
    borderRadius: 7,
    border: '1px solid rgba(255,255,255,0.07)',
    background: '#111318',
    overflow: 'hidden',
  },
  cardActive: {
    borderColor: 'rgba(156,229,90,0.42)',
    boxShadow: '0 0 0 1px rgba(156,229,90,0.08)',
  },
  cardBody: {
    padding: 10,
    minWidth: 0,
  },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardTitle: {
    color: '#e8eaf0',
    fontSize: 12,
    fontFamily: 'var(--font-mono)',
    fontWeight: 800,
  },
  rarity: {
    fontSize: 8,
    fontFamily: 'var(--font-mono)',
    textTransform: 'uppercase',
  },
  tagline: {
    marginTop: 7,
    color: '#8892a4',
    fontSize: 10,
    lineHeight: 1.45,
    fontFamily: 'var(--font-mono)',
  },
  metaRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
    color: '#4a5568',
    fontSize: 9,
    fontFamily: 'var(--font-mono)',
  },
  actions: {
    display: 'flex',
    gap: 7,
    marginTop: 10,
  },
  primaryBtn: {
    flex: 1,
    height: 28,
    borderRadius: 4,
    border: '1px solid rgba(156,229,90,0.35)',
    background: 'rgba(156,229,90,0.1)',
    color: '#9ce55a',
    fontSize: 10,
    fontFamily: 'var(--font-mono)',
    cursor: 'pointer',
  },
  secondaryBtn: {
    width: 68,
    height: 28,
    borderRadius: 4,
    border: '1px solid rgba(255,255,255,0.08)',
    background: '#0d0f14',
    color: '#8892a4',
    fontSize: 10,
    fontFamily: 'var(--font-mono)',
    cursor: 'pointer',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    padding: '10px 16px 14px',
    color: '#4a5568',
    fontSize: 9,
    fontFamily: 'var(--font-mono)',
    borderTop: '1px solid rgba(255,255,255,0.05)',
  },
  preview: {
    position: 'relative',
    background: 'linear-gradient(180deg, rgba(116,185,216,0.16), rgba(13,15,20,0))',
    overflow: 'hidden',
  },
  shadow: {
    position: 'absolute',
    left: '50%',
    bottom: 18,
    width: 92,
    height: 26,
    borderRadius: '50%',
    background: 'rgba(0,0,0,0.28)',
  },
  house: {
    position: 'absolute',
    left: '50%',
    bottom: 28,
    width: 120,
    height: 92,
    transformOrigin: '50% 100%',
  },
  roofLeft: {
    position: 'absolute',
    left: 4,
    top: 14,
    width: 62,
    height: 42,
    clipPath: 'polygon(0 72%, 50% 0, 100% 72%, 50% 100%)',
  },
  roofRight: {
    position: 'absolute',
    left: 54,
    top: 14,
    width: 62,
    height: 42,
    clipPath: 'polygon(0 72%, 50% 0, 100% 72%, 50% 100%)',
  },
  wallLeft: {
    position: 'absolute',
    left: 20,
    top: 48,
    width: 50,
    height: 38,
    transform: 'skewY(18deg)',
  },
  wallRight: {
    position: 'absolute',
    left: 58,
    top: 48,
    width: 44,
    height: 38,
    transform: 'skewY(-18deg)',
  },
  door: {
    position: 'absolute',
    left: 53,
    top: 64,
    width: 13,
    height: 24,
    borderRadius: 2,
    background: '#7a4a24',
  },
  window: {
    position: 'absolute',
    top: 58,
    width: 13,
    height: 10,
    borderRadius: 2,
    background: '#8ed8ff',
    boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.35)',
  },
  trim: {
    position: 'absolute',
    left: 30,
    top: 83,
    width: 62,
    height: 5,
    borderRadius: 3,
  },
}
