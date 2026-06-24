import React, { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useGameStore, type FarmCosmeticKind } from '../stores/gameStore'
import townMarketImage from '../assets/solfarm-town-market.png'

type MarketItem = {
  id: string
  name: string
  kind: FarmCosmeticKind
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'mythic'
  price: number
  nft?: boolean
  description: string
  palette: string[]
}

const marketItems: MarketItem[] = [
  { id: 'skin-harvest-gold', name: 'Harvest Gold Farmhouse Skin', kind: 'skin', rarity: 'rare', price: 460, description: 'Warm gold roof trim and premium porch glow.', palette: ['#f0c040', '#fff0c2', '#7a4a24'] },
  { id: 'skin-moonlit-manor', name: 'Moonlit Manor Skin', kind: 'skin', rarity: 'epic', price: 980, description: 'Cool moon-blue walls for night-market prestige.', palette: ['#8fb3ff', '#dff7ff', '#3a4d7a'] },
  { id: 'painting-sunrise-field', name: 'Sunrise Field Painting', kind: 'painting', rarity: 'uncommon', price: 180, nft: true, description: 'A tradable wall painting for your farmhouse interior.', palette: ['#f0c040', '#9ce55a', '#74b9d8'] },
  { id: 'painting-founder-map', name: 'Founder Map Painting', kind: 'painting', rarity: 'mythic', price: 2200, nft: true, description: 'A collectible map deed painting for early market legends.', palette: ['#9945ff', '#f0c040', '#111318'] },
  { id: 'texture-cobble-path', name: 'Cobble Path Texture', kind: 'texture', rarity: 'common', price: 90, description: 'Cleaner market road texture for farm paths.', palette: ['#999999', '#666666', '#c8c8c8'] },
  { id: 'texture-flower-meadow', name: 'Flower Meadow Texture', kind: 'texture', rarity: 'rare', price: 420, description: 'Soft grass overlay with tiny flower flecks.', palette: ['#6ab740', '#ff7a7a', '#f0c040'] },
  { id: 'furniture-oak-bench', name: 'Oak Meet Bench', kind: 'furniture', rarity: 'uncommon', price: 210, description: 'A social bench for your visitor yard.', palette: ['#7a4a24', '#c8a060', '#4a8c2a'] },
  { id: 'furniture-marble-fountain', name: 'Marble Fountain', kind: 'furniture', rarity: 'epic', price: 1250, description: 'A plaza-grade fountain for premium farm entrances.', palette: ['#f5f5e8', '#8ed8ff', '#b8c5d6'] },
]

const visitors = [
  { name: 'OrchardMax', farm: 'Sunny Acres', status: 'trading paintings', color: '#9ce55a' },
  { name: 'PixelMina', farm: 'Glasshouse Row', status: 'spectating homes', color: '#5cedf0' },
  { name: '7SxQ...farm', farm: 'Moonlit Ranch', status: 'listing textures', color: '#b97cff' },
  { name: 'BarnDAO', farm: 'Founder Estate', status: 'near market gate', color: '#f0c040' },
]

const rarityColor: Record<MarketItem['rarity'], string> = {
  common: '#c8d0d8',
  uncommon: '#9ce55a',
  rare: '#5cedf0',
  epic: '#b97cff',
  mythic: '#f0c040',
}

export default function SocialMarketHub() {
  const { publicKey } = useWallet()
  const store = useGameStore()
  const [tab, setTab] = useState<'plaza' | 'spectate' | 'market'>('plaza')
  const [guestbookText, setGuestbookText] = useState('Beautiful farm. See you at the market.')
  const visibleItems = marketItems.filter((item) => tab !== 'market' || true)
  const enterTown = () => {
    store.travelTown()
    useGameStore.setState({ showSocialHub: false })
    window.dispatchEvent(new Event('solfarm:center-camera'))
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.panel}>
        <div style={styles.header}>
          <div>
            <div style={styles.eyebrow}>town market beta</div>
            <div style={styles.title}>Meet, Spectate, Trade</div>
          </div>
          <button onClick={store.toggleSocialHub} style={styles.close}>x</button>
        </div>

        <div style={styles.tabs}>
          <button onClick={() => setTab('plaza')} style={{ ...styles.tab, ...(tab === 'plaza' ? styles.tabActive : {}) }}>meet plaza</button>
          <button onClick={() => setTab('spectate')} style={{ ...styles.tab, ...(tab === 'spectate' ? styles.tabActive : {}) }}>spectate farms</button>
          <button onClick={() => setTab('market')} style={{ ...styles.tab, ...(tab === 'market' ? styles.tabActive : {}) }}>marketplace</button>
        </div>

        {tab === 'plaza' && (
          <div style={styles.plazaGrid}>
            <div style={styles.scene}>
              <div style={styles.marketImageWrap}>
                <img src={townMarketImage} alt="Solfarm playable town plaza" style={styles.marketImage} />
                <div style={styles.marketImageHud}>
                  <span>{visitors.length + 12} farmers nearby</span>
                  <button onClick={enterTown} style={styles.marketHudButton}>enter playable town</button>
                </div>
              </div>
            </div>
            <div style={styles.side}>
              <div style={styles.sectionTitle}>online farmers</div>
              <div style={styles.copy}>
                This is the mock shell for the future shared market instance: players spawn here, chat, inspect cosmetics, and walk through farm portals.
              </div>
              {visitors.map((visitor) => (
                <div key={visitor.name} style={styles.visitorRow}>
                  <span style={{ ...styles.dot, background: visitor.color }} />
                  <div>
                    <div style={styles.visitorName}>{visitor.name}</div>
                    <div style={styles.visitorMeta}>{visitor.farm} / {visitor.status}</div>
                  </div>
                </div>
              ))}
              <div style={styles.walletNote}>
                {publicKey ? 'Wallet linked: future listings and direct trades can be signed.' : 'Guest mode: browse and buy mock items now; wallet will unlock cloud identity and real listings.'}
              </div>
              <div style={styles.walletNote}>
                P2E shell: crops earn off-chain resources; weekly and event goals earn limited Harvest Tickets for raffles, coupons, and future NFT crafting.
              </div>
              <button onClick={enterTown} style={styles.primaryBtn}>travel into town world</button>
            </div>
          </div>
        )}

        {tab === 'spectate' && (
          <div style={styles.spectateGrid}>
            {store.visitableFarms.map((farm) => (
              <div key={farm.id} style={styles.farmCard}>
                <div style={styles.farmPreview}>
                  <div style={styles.miniHouse} />
                  <div style={styles.miniField} />
                  <div style={styles.miniPath} />
                </div>
                <div style={styles.farmName}>{farm.name}</div>
                <div style={styles.visitorMeta}>{farm.owner} / level {farm.level} / {farm.likes} likes</div>
                <button onClick={() => store.visitFarm(farm.id)} style={styles.primaryBtn}>spectate farmhouse</button>
                <button onClick={() => store.likeFarm(farm.id)} style={{ ...styles.primaryBtn, ...styles.secondaryBtn }}>like farm</button>
              </div>
            ))}
            <div style={styles.farmCard}>
              <div style={styles.farmPreview}>
                <div style={{ ...styles.miniHouse, background: '#f0c040' }} />
                <div style={{ ...styles.miniField, background: '#9945ff' }} />
                <div style={styles.miniPath} />
              </div>
              <div style={styles.farmName}>{store.farmName}</div>
              <div style={styles.visitorMeta}>your farm / {store.farmLikes} likes / {store.tipsReceived} tips</div>
              <button onClick={store.returnHomeFarm} style={styles.primaryBtn}>return home</button>
              <button onClick={() => store.likeFarm('home')} style={{ ...styles.primaryBtn, ...styles.secondaryBtn }}>test like</button>
              <textarea
                value={guestbookText}
                onChange={(e) => setGuestbookText(e.target.value)}
                style={styles.guestbook}
              />
              <button
                onClick={() => store.leaveGuestbook(publicKey ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}` : 'guest farmer', guestbookText)}
                style={styles.primaryBtn}
              >
                sign guestbook + tip
              </button>
            </div>
          </div>
        )}

        {tab === 'market' && (
          <div style={styles.marketGrid}>
            {visibleItems.map((item) => {
              const owned = store.purchasedCosmetics.includes(item.id)
              return (
                <div key={item.id} style={styles.itemCard}>
                  <div style={styles.itemPreview}>
                    {item.palette.map((color, index) => (
                      <span key={color} style={{ ...styles.swatch, background: color, transform: `translate(${index * 14}px, ${index * 5}px)` }} />
                    ))}
                  </div>
                  <div style={styles.itemTop}>
                    <span style={styles.itemName}>{item.name}</span>
                    <span style={{ ...styles.rarity, color: rarityColor[item.rarity] }}>{item.rarity}</span>
                  </div>
                  <div style={styles.visitorMeta}>{item.kind}{item.nft ? ' / NFT-ready painting' : ' / visual only'}</div>
                  <div style={styles.description}>{item.description}</div>
                  <div style={styles.buyRow}>
                    <span style={styles.price}>{item.price} coins</span>
                    <button
                      onClick={() => store.buyMarketCosmetic(item.id, item.name, item.price, item.kind, item.nft)}
                      style={styles.primaryBtn}
                    >
                      {owned ? 'owned' : 'buy'}
                    </button>
                  </div>
                </div>
              )
            })}
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
    zIndex: 1350,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    background: 'rgba(5,8,12,0.78)',
  },
  panel: {
    width: 1040,
    maxWidth: 'calc(100vw - 28px)',
    maxHeight: 'calc(100vh - 28px)',
    overflow: 'auto',
    borderRadius: 8,
    border: '1px solid rgba(92,237,240,0.2)',
    background: '#0d0f14',
    boxShadow: '0 24px 80px rgba(0,0,0,0.45)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: 16,
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  eyebrow: {
    color: '#5cedf0',
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
  tabs: {
    display: 'flex',
    gap: 8,
    padding: 12,
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  },
  tab: {
    height: 30,
    padding: '0 12px',
    borderRadius: 4,
    border: '1px solid rgba(255,255,255,0.08)',
    background: '#111318',
    color: '#8892a4',
    fontSize: 10,
    fontFamily: 'var(--font-mono)',
    cursor: 'pointer',
  },
  tabActive: {
    borderColor: 'rgba(92,237,240,0.4)',
    background: 'rgba(92,237,240,0.09)',
    color: '#5cedf0',
  },
  plazaGrid: {
    display: 'grid',
    gridTemplateColumns: '1.25fr 0.75fr',
    gap: 14,
    padding: 16,
  },
  scene: {
    minHeight: 360,
    borderRadius: 7,
    border: '1px solid rgba(255,255,255,0.06)',
    background: 'linear-gradient(180deg, rgba(116,185,216,0.2), rgba(13,15,20,0.1))',
    padding: 14,
  },
  marketMap: {
    position: 'relative',
    height: '100%',
    minHeight: 330,
    clipPath: 'polygon(50% 0, 100% 32%, 78% 100%, 22% 100%, 0 32%)',
    background: 'linear-gradient(135deg, #6ab740, #4a8c2a)',
    border: '1px solid rgba(255,255,255,0.12)',
  },
  marketImageWrap: {
    position: 'relative',
    height: '100%',
    minHeight: 330,
    borderRadius: 6,
    overflow: 'hidden',
    background: '#0d0f14',
  },
  marketImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
    imageRendering: 'pixelated',
  },
  marketImageHud: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    padding: 10,
    borderRadius: 6,
    background: 'rgba(13,15,20,0.72)',
    border: '1px solid rgba(255,255,255,0.12)',
    backdropFilter: 'blur(10px)',
    color: '#fff4d7',
    fontSize: 10,
    fontFamily: 'var(--font-mono)',
  },
  marketHudButton: {
    height: 28,
    padding: '0 10px',
    borderRadius: 4,
    border: '1px solid rgba(156,229,90,0.35)',
    background: 'rgba(156,229,90,0.12)',
    color: '#9ce55a',
    fontSize: 9,
    fontFamily: 'var(--font-mono)',
    cursor: 'pointer',
  },
  fountain: {
    position: 'absolute',
    left: '50%',
    top: '47%',
    width: 78,
    height: 38,
    transform: 'translate(-50%, -50%)',
    borderRadius: '50%',
    background: '#8ed8ff',
    boxShadow: '0 0 0 8px #d8d8d8, 0 18px 35px rgba(0,0,0,0.24)',
  },
  avatar: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 5,
    boxShadow: '0 8px 18px rgba(0,0,0,0.28)',
  },
  marketStall: {
    position: 'absolute',
    left: '18%',
    top: '62%',
    width: 74,
    height: 48,
    borderRadius: 4,
    background: '#cc4444',
    boxShadow: 'inset 0 -12px 0 rgba(0,0,0,0.18), 0 14px 24px rgba(0,0,0,0.25)',
  },
  side: {
    minWidth: 0,
  },
  sectionTitle: {
    color: '#e8eaf0',
    fontSize: 13,
    fontFamily: 'var(--font-mono)',
    fontWeight: 800,
  },
  copy: {
    marginTop: 8,
    color: '#8892a4',
    fontSize: 11,
    lineHeight: 1.55,
    fontFamily: 'var(--font-mono)',
  },
  visitorRow: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    padding: 9,
    marginTop: 8,
    borderRadius: 5,
    border: '1px solid rgba(255,255,255,0.06)',
    background: '#111318',
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: '50%',
  },
  visitorName: {
    color: '#e8eaf0',
    fontSize: 10,
    fontFamily: 'var(--font-mono)',
    fontWeight: 700,
  },
  visitorMeta: {
    color: '#4a5568',
    fontSize: 9,
    fontFamily: 'var(--font-mono)',
    marginTop: 3,
  },
  walletNote: {
    marginTop: 12,
    padding: 10,
    borderRadius: 5,
    border: '1px solid rgba(240,192,64,0.22)',
    color: '#f0c040',
    background: 'rgba(240,192,64,0.06)',
    fontSize: 10,
    lineHeight: 1.5,
    fontFamily: 'var(--font-mono)',
  },
  spectateGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
    gap: 10,
    padding: 16,
  },
  farmCard: {
    borderRadius: 7,
    border: '1px solid rgba(255,255,255,0.07)',
    background: '#111318',
    padding: 10,
  },
  farmPreview: {
    position: 'relative',
    height: 110,
    borderRadius: 6,
    overflow: 'hidden',
    background: 'linear-gradient(135deg, #6ab740, #3a8fcc)',
  },
  miniHouse: {
    position: 'absolute',
    left: 76,
    top: 30,
    width: 52,
    height: 40,
    clipPath: 'polygon(50% 0, 100% 35%, 82% 100%, 18% 100%, 0 35%)',
    background: '#f5e8c8',
    boxShadow: 'inset 0 -14px 0 #cc4444',
  },
  miniField: {
    position: 'absolute',
    left: 22,
    top: 66,
    width: 68,
    height: 28,
    background: '#c8a060',
    transform: 'skewX(-28deg)',
  },
  miniPath: {
    position: 'absolute',
    left: 96,
    top: 0,
    width: 16,
    height: 120,
    background: '#d0aa68',
    transform: 'rotate(28deg)',
  },
  farmName: {
    marginTop: 8,
    color: '#e8eaf0',
    fontSize: 12,
    fontFamily: 'var(--font-mono)',
    fontWeight: 800,
  },
  primaryBtn: {
    marginTop: 9,
    width: '100%',
    height: 30,
    borderRadius: 4,
    border: '1px solid rgba(92,237,240,0.35)',
    background: 'rgba(92,237,240,0.08)',
    color: '#5cedf0',
    fontSize: 10,
    fontFamily: 'var(--font-mono)',
    cursor: 'pointer',
  },
  secondaryBtn: {
    borderColor: 'rgba(240,192,64,0.34)',
    background: 'rgba(240,192,64,0.08)',
    color: '#f0c040',
  },
  guestbook: {
    width: '100%',
    minHeight: 52,
    marginTop: 9,
    borderRadius: 4,
    border: '1px solid rgba(255,255,255,0.08)',
    background: '#0d0f14',
    color: '#8892a4',
    fontSize: 10,
    fontFamily: 'var(--font-mono)',
    padding: 8,
    resize: 'vertical',
    boxSizing: 'border-box',
  },
  marketGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
    gap: 10,
    padding: 16,
  },
  itemCard: {
    borderRadius: 7,
    border: '1px solid rgba(255,255,255,0.07)',
    background: '#111318',
    padding: 10,
  },
  itemPreview: {
    position: 'relative',
    height: 70,
    borderRadius: 6,
    background: '#0d0f14',
    overflow: 'hidden',
  },
  swatch: {
    position: 'absolute',
    left: '38%',
    top: 18,
    width: 48,
    height: 30,
    clipPath: 'polygon(50% 0, 100% 50%, 50% 100%, 0 50%)',
    boxShadow: '0 10px 18px rgba(0,0,0,0.25)',
  },
  itemTop: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 9,
  },
  itemName: {
    color: '#e8eaf0',
    fontSize: 11,
    fontFamily: 'var(--font-mono)',
    fontWeight: 800,
  },
  rarity: {
    fontSize: 8,
    fontFamily: 'var(--font-mono)',
    textTransform: 'uppercase',
  },
  description: {
    minHeight: 42,
    marginTop: 8,
    color: '#8892a4',
    fontSize: 10,
    lineHeight: 1.45,
    fontFamily: 'var(--font-mono)',
  },
  buyRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  price: {
    color: '#f0c040',
    fontSize: 10,
    fontFamily: 'var(--font-mono)',
  },
}

