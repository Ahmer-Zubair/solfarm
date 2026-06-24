import React from 'react'
import { useGameStore } from '../stores/gameStore'

export default function FarmVisitPanel() {
  const store = useGameStore()

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <div>
          <div style={styles.title}>VISIT FARMS</div>
          <div style={styles.sub}>mock neighborhood lobby</div>
        </div>
        <button onClick={store.toggleVisitPanel} style={styles.close}>x</button>
      </div>

      <button onClick={store.returnHomeFarm} style={styles.homeBtn}>
        return to my farm
      </button>

      <div style={styles.list}>
        {store.visitableFarms.map((farm) => (
          <button key={farm.id} onClick={() => store.visitFarm(farm.id)} style={styles.card}>
            <div style={styles.cardTop}>
              <span style={styles.name}>{farm.name}</span>
              <span style={styles.level}>Lv {farm.level}</span>
            </div>
            <div style={styles.owner}>{farm.owner}</div>
            <div style={styles.meta}>
              <span>{farm.resources.crops} crops</span>
              <span>{farm.resources.coins} coins</span>
              <span>{farm.likes} likes</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    position: 'absolute',
    right: 14,
    top: 14,
    width: 300,
    zIndex: 26,
    borderRadius: 6,
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(13,15,20,0.95)',
    boxShadow: '0 12px 30px rgba(0,0,0,0.28)',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: 10,
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  title: {
    color: '#e8eaf0',
    fontSize: 10,
    fontFamily: 'var(--font-mono)',
    letterSpacing: '0.1em',
    fontWeight: 700,
  },
  sub: {
    color: '#4a5568',
    fontSize: 8,
    fontFamily: 'var(--font-mono)',
    marginTop: 3,
  },
  close: {
    border: 'none',
    background: 'transparent',
    color: '#4a5568',
    cursor: 'pointer',
  },
  homeBtn: {
    margin: 10,
    width: 'calc(100% - 20px)',
    height: 28,
    borderRadius: 4,
    border: '1px solid rgba(96,165,250,0.28)',
    background: 'rgba(96,165,250,0.08)',
    color: '#60a5fa',
    fontSize: 10,
    fontFamily: 'var(--font-mono)',
    cursor: 'pointer',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    padding: '0 10px 10px',
  },
  card: {
    textAlign: 'left',
    padding: 9,
    borderRadius: 5,
    border: '1px solid rgba(255,255,255,0.07)',
    background: '#111318',
    cursor: 'pointer',
  },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 8,
  },
  name: {
    color: '#e8eaf0',
    fontSize: 11,
    fontFamily: 'var(--font-mono)',
  },
  level: {
    color: '#9ce55a',
    fontSize: 10,
    fontFamily: 'var(--font-mono)',
  },
  owner: {
    color: '#4a5568',
    fontSize: 9,
    fontFamily: 'var(--font-mono)',
    marginTop: 4,
  },
  meta: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    color: '#8892a4',
    fontSize: 8,
    fontFamily: 'var(--font-mono)',
    marginTop: 8,
  },
}
