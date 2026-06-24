import React, { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useGameStore } from '../stores/gameStore'

export default function PlayerProfile() {
  const { publicKey } = useWallet()
  const store = useGameStore()
  const [showSaveTools, setShowSaveTools] = useState(false)
  const [importText, setImportText] = useState('')
  const [exportText, setExportText] = useState('')
  const level = Math.max(1, Math.floor(store.farmXp / 100) + 1)
  const nextXp = level * 100
  const xpPct = Math.min(100, Math.round((store.farmXp / nextXp) * 100))
  const owner = publicKey ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}` : 'guest farmer'

  const mintFarmhouse = () => {
    if (!store.farmhouse.owned) {
      store.setSelectedActionLabel('build a farmhouse first')
      return
    }
    if (store.farmhouse.minted) {
      store.setSelectedActionLabel('farmhouse already minted')
      return
    }
    const paid = store.spendResources({ coins: 50, wood: 4, stone: 4 })
    if (!paid) {
      store.setSelectedActionLabel('need 50 coins, 4 wood, 4 stone')
      return
    }
    const sig = Math.random().toString(36).slice(2).padEnd(32, 'x')
    store.mintFarmhouse()
    store.addMintedItem({
      kind: 'farmhouse',
      name: store.farmhouse.name,
      sig,
      x: store.farmhouse.x ?? undefined,
      y: store.farmhouse.y ?? undefined,
    })
    store.addTx({
      action: 'mint_farmhouse',
      sig,
      fee: 0.012,
      status: 'confirmed',
      blockName: store.farmhouse.name,
      coords: store.farmhouse.x !== null && store.farmhouse.y !== null ? { x: store.farmhouse.x, y: store.farmhouse.y } : undefined,
    })
    store.setSelectedActionLabel('farmhouse minted')
  }

  const exportSave = () => {
    const raw = store.exportFarmSave()
    setExportText(raw)
    const blob = new Blob([raw], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${store.farmName.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-save.json`
    a.click()
    URL.revokeObjectURL(url)
    store.setSelectedActionLabel('farm exported')
  }

  const importSave = () => {
    if (store.importFarmSave(importText)) setImportText('')
  }

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <span style={styles.title}>PLAYER PROFILE</span>
        <button onClick={store.toggleProfile} style={styles.close}>x</button>
      </div>
      <div style={styles.body}>
        <div style={styles.avatarRow}>
          <div style={styles.avatar}>S</div>
          <div>
            <div style={styles.name}>{owner}</div>
            <div style={styles.sub}>{store.farmName} | Farm level {level}</div>
          </div>
        </div>

        <div style={styles.xpTrack}>
          <div style={{ ...styles.xpFill, width: `${xpPct}%` }} />
        </div>
        <div style={styles.sub}>{store.farmXp}/{nextXp} XP</div>

        <div style={styles.resourceGrid}>
          <Resource label="wood" value={store.resources.wood} />
          <Resource label="stone" value={store.resources.stone} />
          <Resource label="crops" value={store.resources.crops} />
          <Resource label="coins" value={store.resources.coins} />
          <Resource label="farm pts" value={store.resources.farmPoints} />
          <Resource label="tickets" value={store.resources.harvestTickets} />
        </div>

        <div style={styles.farmhouse}>
          <div style={styles.sectionTitle}>farmhouse</div>
          <div style={styles.sub}>
            {store.farmhouse.owned
              ? `owned at ${store.farmhouse.x}, ${store.farmhouse.y}`
              : 'not claimed yet'}
          </div>
          <div style={styles.sub}>
            NFT status: {store.farmhouse.minted ? 'minted' : 'not minted'}
          </div>
          <div style={styles.sub}>home level: {store.farmhouse.level} | rarity: {store.farmhouse.rarity}</div>
          <div style={styles.sub}>garden score: {store.farmhouse.gardenScore} | likes: {store.farmLikes}</div>
          <div style={styles.sub}>rooms: {store.farmhouse.rooms.join(', ')}</div>
          <button onClick={store.upgradeFarmhouse} style={styles.button}>
            upgrade farmhouse
          </button>
          <button onClick={mintFarmhouse} style={styles.button}>
            {store.farmhouse.minted ? 'minted' : 'mint farmhouse'}
          </button>
          <div style={styles.levelRoad}>
            {[1, 2, 3, 4, 5].map((homeLevel) => (
              <div
                key={homeLevel}
                style={{
                  ...styles.levelStep,
                  ...(store.farmhouse.level >= homeLevel ? styles.levelStepActive : {}),
                }}
              >
                <span style={styles.levelNum}>L{homeLevel}</span>
                <span style={styles.levelText}>{homeUnlock(homeLevel)}</span>
              </div>
            ))}
          </div>
          <div style={styles.homeRooms}>
            {store.farmhouse.rooms.map((room) => (
              <span key={room} style={styles.roomPill}>{room}</span>
            ))}
          </div>
          <div style={styles.displayWall}>
            <div style={styles.wallTitle}>display wall</div>
            <div style={styles.wallGrid}>
              {(store.farmhouse.trophies.length ? store.farmhouse.trophies : ['starter deed', 'future painting', 'season trophy']).slice(0, 6).map((item, index) => (
                <span key={`${item}-${index}`} style={styles.wallItem}>{item.slice(0, 2).toUpperCase()}</span>
              ))}
            </div>
          </div>
          <div style={styles.sub}>minted items: {store.mintedItems.length}</div>
        </div>

        <div style={styles.saveBox}>
          <div style={styles.sectionTitle}>progression</div>
          <div style={styles.toolGrid}>
            {(['axe', 'pickaxe', 'shovel', 'wateringCan'] as const).map((tool) => (
              <button key={tool} onClick={() => store.upgradeTool(tool)} style={styles.miniBtn}>
                {tool} lv {store.toolLevels[tool]}
              </button>
            ))}
          </div>
          <div style={styles.sub}>
            crop mastery: wheat {store.cropMastery.wheat} | corn {store.cropMastery.corn} | berry {store.cropMastery.strawberry} | pumpkin {store.cropMastery.pumpkin}
          </div>
          <div style={styles.sub}>season pass XP: {store.seasonPassXp}</div>
        </div>

        <div style={styles.saveBox}>
          <div style={styles.sectionTitle}>crafting</div>
          <div style={styles.craftGrid}>
            <button onClick={() => store.craftItem('flowerFence')} style={styles.miniBtn}>flower fence</button>
            <button onClick={() => store.craftItem('cobblePath')} style={styles.miniBtn}>cobble path</button>
            <button onClick={() => store.craftItem('oakBench')} style={styles.miniBtn}>oak bench</button>
            <button onClick={() => store.craftItem('marketStall')} style={styles.miniBtn}>market stall</button>
            <button onClick={() => store.craftItem('seedPress')} style={styles.miniBtn}>seed press</button>
            <button onClick={() => store.craftItem('solStatue')} style={styles.miniBtn}>SOL statue</button>
          </div>
          <div style={styles.sub}>crafted items: {store.craftedItems.length}</div>
        </div>

        <div style={styles.saveBox}>
          <div style={styles.sectionTitle}>p2e rewards</div>
          <div style={styles.sub}>
            Harvest Tickets are limited reward claims for events, raffles, coupons, or future NFT crafting. Regular crops stay off-chain.
          </div>
        </div>

        <div style={styles.saveBox}>
          <div style={styles.sectionTitle}>local save</div>
          <div style={styles.sub}>
            {store.lastSavedAt ? `saved ${new Date(store.lastSavedAt).toLocaleTimeString()}` : 'not saved yet'}
          </div>
          {store.saveError && <div style={{ ...styles.sub, color: '#ff6b6b' }}>{store.saveError}</div>}
          <div style={styles.saveBtns}>
            <button onClick={() => store.saveFarmNow()} style={styles.miniBtn}>save</button>
            <button onClick={exportSave} style={styles.miniBtn}>export</button>
            <button onClick={() => setShowSaveTools((v) => !v)} style={styles.miniBtn}>import</button>
          </div>
          {showSaveTools && (
            <div style={styles.importBox}>
              {exportText && <textarea readOnly value={exportText} style={styles.textarea} />}
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="paste farm save JSON..."
                style={styles.textarea}
              />
              <button onClick={importSave} style={styles.button}>import save</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Resource({ label, value }: { label: string; value: number }) {
  return (
    <div style={styles.resource}>
      <span style={styles.resourceVal}>{value}</span>
      <span style={styles.resourceLabel}>{label}</span>
    </div>
  )
}

function homeUnlock(level: number) {
  if (level === 1) return 'porch'
  if (level === 2) return 'kitchen'
  if (level === 3) return 'workshop'
  if (level === 4) return 'NFT gallery'
  return 'trophy hall'
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    flexShrink: 0,
    background: '#0d0f14',
    borderTop: '1px solid rgba(255,255,255,0.05)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
  },
  title: {
    fontSize: 9,
    fontFamily: 'var(--font-mono)',
    color: '#4a5568',
    letterSpacing: '0.12em',
    fontWeight: 700,
  },
  close: {
    border: 'none',
    background: 'transparent',
    color: '#4a5568',
    cursor: 'pointer',
  },
  body: {
    padding: 10,
  },
  avatarRow: {
    display: 'flex',
    gap: 9,
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 6,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(156,229,90,0.12)',
    border: '1px solid rgba(156,229,90,0.3)',
    color: '#9ce55a',
    fontFamily: 'var(--font-mono)',
    fontWeight: 700,
  },
  name: {
    color: '#e8eaf0',
    fontSize: 11,
    fontFamily: 'var(--font-mono)',
  },
  sub: {
    color: '#4a5568',
    fontSize: 9,
    fontFamily: 'var(--font-mono)',
    marginTop: 3,
  },
  xpTrack: {
    height: 5,
    marginTop: 10,
    background: '#141720',
    borderRadius: 5,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    background: '#9ce55a',
  },
  resourceGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 5,
    marginTop: 10,
  },
  resource: {
    padding: 7,
    borderRadius: 4,
    border: '1px solid rgba(255,255,255,0.06)',
    background: '#111318',
  },
  resourceVal: {
    display: 'block',
    color: '#9ce55a',
    fontSize: 13,
    fontFamily: 'var(--font-mono)',
    fontWeight: 700,
  },
  resourceLabel: {
    color: '#4a5568',
    fontSize: 8,
    fontFamily: 'var(--font-mono)',
  },
  farmhouse: {
    marginTop: 10,
    paddingTop: 9,
    borderTop: '1px solid rgba(255,255,255,0.05)',
  },
  sectionTitle: {
    color: '#8892a4',
    fontSize: 9,
    fontFamily: 'var(--font-mono)',
    letterSpacing: '0.08em',
  },
  button: {
    marginTop: 8,
    width: '100%',
    height: 28,
    borderRadius: 4,
    border: '1px solid rgba(156,229,90,0.3)',
    background: 'rgba(156,229,90,0.08)',
    color: '#9ce55a',
    fontSize: 10,
    fontFamily: 'var(--font-mono)',
    cursor: 'pointer',
  },
  levelRoad: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
    gap: 4,
    marginTop: 9,
  },
  levelStep: {
    minHeight: 42,
    padding: 5,
    borderRadius: 4,
    border: '1px solid rgba(255,255,255,0.06)',
    background: '#111318',
  },
  levelStepActive: {
    borderColor: 'rgba(240,192,64,0.38)',
    background: 'rgba(240,192,64,0.08)',
  },
  levelNum: {
    display: 'block',
    color: '#f0c040',
    fontSize: 9,
    fontFamily: 'var(--font-mono)',
    fontWeight: 800,
  },
  levelText: {
    display: 'block',
    marginTop: 3,
    color: '#8892a4',
    fontSize: 7,
    fontFamily: 'var(--font-mono)',
  },
  homeRooms: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 8,
  },
  roomPill: {
    padding: '3px 5px',
    borderRadius: 4,
    background: 'rgba(156,229,90,0.08)',
    border: '1px solid rgba(156,229,90,0.18)',
    color: '#9ce55a',
    fontSize: 8,
    fontFamily: 'var(--font-mono)',
  },
  displayWall: {
    marginTop: 9,
    padding: 8,
    borderRadius: 5,
    background: '#111318',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  wallTitle: {
    color: '#8892a4',
    fontSize: 8,
    fontFamily: 'var(--font-mono)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  wallGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 5,
    marginTop: 7,
  },
  wallItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 28,
    borderRadius: 4,
    background: 'linear-gradient(135deg, rgba(153,69,255,0.18), rgba(240,192,64,0.13))',
    border: '1px solid rgba(240,192,64,0.2)',
    color: '#f0c040',
    fontSize: 9,
    fontFamily: 'var(--font-mono)',
    fontWeight: 800,
  },
  saveBox: {
    marginTop: 10,
    paddingTop: 9,
    borderTop: '1px solid rgba(255,255,255,0.05)',
  },
  saveBtns: {
    display: 'flex',
    gap: 5,
    marginTop: 8,
  },
  toolGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 5,
    marginTop: 8,
  },
  craftGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 5,
    marginTop: 8,
  },
  miniBtn: {
    flex: 1,
    height: 25,
    borderRadius: 4,
    border: '1px solid rgba(255,255,255,0.08)',
    background: '#111318',
    color: '#8892a4',
    fontSize: 9,
    fontFamily: 'var(--font-mono)',
    cursor: 'pointer',
  },
  importBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: 7,
    marginTop: 8,
  },
  textarea: {
    width: '100%',
    minHeight: 64,
    boxSizing: 'border-box',
    borderRadius: 4,
    border: '1px solid rgba(255,255,255,0.08)',
    background: '#0d0f14',
    color: '#8892a4',
    fontSize: 9,
    fontFamily: 'var(--font-mono)',
    padding: 7,
    resize: 'vertical',
    outline: 'none',
  },
}
