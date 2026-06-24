import React from 'react'
import { useGameStore } from '../stores/gameStore'

type StatRowProps = {
  label: string
  value: string | number
  accent?: boolean
  color?: string
}

function StatRow({ label, value, accent, color }: StatRowProps) {
  return (
    <div style={styles.row}>
      <span style={styles.label}>{label}</span>
      <span style={{
        ...styles.value,
        color: accent ? '#9ce55a' : color ?? '#8892a4',
      }}>
        {value}
      </span>
    </div>
  )
}

export default function StatsPanel() {
  const store = useGameStore()

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <span style={styles.title}>WORLD STATS</span>
      </div>

      <div style={styles.body}>
        <StatRow label="wood" value={store.resources.wood} color="#c8a060" />
        <StatRow label="stone" value={store.resources.stone} color="#aaaaaa" />
        <StatRow label="crops" value={store.resources.crops} color="#f0c040" />
        <StatRow label="coins" value={store.resources.coins} accent />
        <StatRow label="farm points" value={store.resources.farmPoints} color="#5cedf0" />
        <StatRow label="harvest tickets" value={store.resources.harvestTickets} color="#f0c040" />
        <StatRow label="animal feed" value={store.resources.animalFeed} color="#c8a060" />
        <StatRow label="fruits" value={store.resources.fruits} color="#ff7f50" />
        <StatRow label="vegetables" value={store.resources.vegetables} color="#9ce55a" />
        <StatRow label="butter" value={store.resources.butter} color="#ffe28a" />
        <StatRow label="eggs" value={store.resources.eggs} color="#f7e6a4" />
        <StatRow label="milk" value={store.resources.milk} color="#dbeeff" />
        <StatRow label="livestock" value={Object.keys(store.animals).length} color="#9ce55a" />
        <div style={styles.divider} />
        <StatRow label="farmhouse level" value={store.farmhouse.level} accent />
        <StatRow label="garden score" value={store.farmhouse.gardenScore} color="#9ce55a" />
        <StatRow label="crafted items" value={store.craftedItems.length} color="#c8a060" />
        <StatRow label="season XP" value={store.seasonPassXp} color="#b97cff" />
        <div style={styles.divider} />
        <StatRow label="blocks placed"  value={store.blocksPlaced} />
        <StatRow label="blocks mined"   value={store.blocksMined} />
        <StatRow label="farmhouses owned" value={store.farmhouse.owned ? 1 : 0} accent />
        <StatRow label="home styles" value={store.farmhouseStyles.filter((style) => style.owned).length} color="#f0c040" />
        <StatRow label="market listings" value={store.farmhouseStyles.filter((style) => style.listed).length} color="#5cedf0" />
        <StatRow label="deeds minted"    value={store.nftCount} color="#f0c040" />
        <div style={styles.divider} />
        <StatRow
          label="fees spent"
          value={`◎ ${store.totalFeesSpent.toFixed(5)}`}
          color="#4a5568"
        />
        <StatRow
          label="SOL balance"
          value={`◎ ${store.solBalance.toFixed(3)}`}
          accent
        />
        <div style={styles.divider} />
        <StatRow label="slot height" value={store.slotHeight.toLocaleString()} color="#4a5568" />
        <StatRow label="world seed"  value={store.seed} color="#2d3748" />
      </div>

      {/* Solana branding */}
      <div style={styles.footer}>
        <div style={styles.solanaDot} />
        <span style={styles.solanaLabel}>Solana Devnet</span>
        <a
          href="https://explorer.solana.com/?cluster=devnet"
          target="_blank"
          rel="noreferrer"
          style={styles.explorerLink}
        >
          explorer ↗
        </a>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    flexShrink: 0,
    borderTop: '1px solid rgba(255,255,255,0.05)',
    background: '#0d0f14',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    padding: '8px 12px 6px',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
  },
  title: {
    fontSize: 9,
    fontFamily: 'var(--font-mono)',
    color: '#2d3748',
    letterSpacing: '0.12em',
    fontWeight: 600,
  },
  body: {
    padding: '4px 0',
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '3px 12px',
  },
  label: {
    fontSize: 9,
    fontFamily: 'var(--font-mono)',
    color: '#2d3748',
    letterSpacing: '0.03em',
  },
  value: {
    fontSize: 10,
    fontFamily: 'var(--font-mono)',
    fontWeight: 500,
  },
  divider: {
    height: 1,
    background: 'rgba(255,255,255,0.03)',
    margin: '4px 12px',
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '7px 12px',
    borderTop: '1px solid rgba(255,255,255,0.04)',
  },
  solanaDot: {
    width: 5,
    height: 5,
    borderRadius: '50%',
    background: '#9945ff',
  },
  solanaLabel: {
    fontSize: 9,
    fontFamily: 'var(--font-mono)',
    color: '#2d3748',
    letterSpacing: '0.04em',
  },
  explorerLink: {
    marginLeft: 'auto',
    fontSize: 9,
    fontFamily: 'var(--font-mono)',
    color: '#9945ff',
    textDecoration: 'none',
    opacity: 0.6,
  },
}
