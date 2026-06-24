import React from 'react'
import { useGameStore, type Resources } from '../stores/gameStore'

type Order = {
  id: string
  label: string
  detail: string
  progress: number
  goal: number
  reward: Partial<Resources>
  xp: number
}

export default function FarmOrders() {
  const store = useGameStore()
  const activeStyle = store.farmhouseStyles.find((style) => style.id === store.activeFarmhouseStyleId)
  const harvestedCount = Object.values(store.cropPlots).filter((plot) => plot.harvested).length
  const orders: Order[] = [
    {
      id: 'claim-home',
      label: 'Build your farmhouse',
      detail: 'Choose the farmhouse and place it yourself on your empty land.',
      progress: store.farmhouse.owned ? 1 : 0,
      goal: 1,
      reward: { coins: 35, wood: 4 },
      xp: 18,
    },
    {
      id: 'plant-rows',
      label: 'Plant crop rows',
      detail: 'Start a harvest loop for the farm economy.',
      progress: Object.values(store.cropPlots).filter((plot) => !plot.harvested).length,
      goal: 3,
      reward: { coins: 60, crops: 4 },
      xp: 22,
    },
    {
      id: 'style-market',
      label: 'Open a house style',
      detail: activeStyle ? `Currently wearing: ${activeStyle.name}` : 'Buy or equip a home style.',
      progress: store.farmhouseStyles.filter((style) => style.owned).length,
      goal: 2,
      reward: { coins: 90, stone: 4 },
      xp: 26,
    },
    {
      id: 'mint-home',
      label: 'Mint home deed',
      detail: 'Turn the farmhouse into an ownership asset.',
      progress: store.farmhouse.minted ? 1 : 0,
      goal: 1,
      reward: { coins: 120 },
      xp: 40,
    },
    {
      id: 'craft-social-yard',
      label: 'Craft social yard',
      detail: 'Craft benches, stalls, paths, or decorations for visitors.',
      progress: store.craftedItems.length,
      goal: 3,
      reward: { coins: 160, farmPoints: 6 },
      xp: 45,
    },
  ]

  const weeklyDone = harvestedCount >= 8 && store.farmhouse.level >= 2
  const eventDone = store.activeEvent.progress >= store.activeEvent.goal

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <span style={styles.title}>FARM ORDERS</span>
        <span style={styles.reset}>UTC daily</span>
      </div>
      <div style={styles.body}>
        {orders.map((order) => {
          const done = order.progress >= order.goal
          const claimed = store.claimedDailyQuests.includes(order.id)
          const pct = Math.min(100, Math.round((order.progress / order.goal) * 100))
          return (
            <div key={order.id} style={styles.order}>
              <div style={styles.orderTop}>
                <span style={styles.orderLabel}>{order.label}</span>
                <span style={styles.orderProgress}>{Math.min(order.progress, order.goal)}/{order.goal}</span>
              </div>
              <div style={styles.detail}>{order.detail}</div>
              <div style={styles.track}>
                <div style={{ ...styles.fill, width: `${pct}%` }} />
              </div>
              <div style={styles.rewardRow}>
                <span>+{order.reward.coins ?? 0} coins · +{order.xp} XP</span>
                <button
                  onClick={() => store.claimDailyQuest(order.id, order.reward, order.xp)}
                  disabled={!done || claimed}
                  style={{ ...styles.claim, opacity: done && !claimed ? 1 : 0.42 }}
                >
                  {claimed ? 'claimed' : 'claim'}
                </button>
              </div>
            </div>
          )
        })}
        <div style={styles.order}>
          <div style={styles.orderTop}>
            <span style={styles.orderLabel}>Weekly verified harvest</span>
            <span style={styles.orderProgress}>{Math.min(harvestedCount, 8)}/8</span>
          </div>
          <div style={styles.detail}>Harvest 8 crops and own a level 2 farmhouse. Future backend verifies this before token-adjacent rewards.</div>
          <div style={styles.track}>
            <div style={{ ...styles.fill, width: `${Math.min(100, Math.round((harvestedCount / 8) * 100))}%`, background: '#5cedf0' }} />
          </div>
          <div style={styles.rewardRow}>
            <span>+2 harvest tickets | +5 farm points</span>
            <button
              onClick={() => store.claimWeeklyReward('weekly-harvest-alpha', 2, 65)}
              disabled={!weeklyDone || store.weeklyQuests.includes('weekly-harvest-alpha')}
              style={{ ...styles.claim, opacity: weeklyDone && !store.weeklyQuests.includes('weekly-harvest-alpha') ? 1 : 0.42 }}
            >
              {store.weeklyQuests.includes('weekly-harvest-alpha') ? 'claimed' : 'claim'}
            </button>
          </div>
        </div>

        <div style={styles.order}>
          <div style={styles.orderTop}>
            <span style={styles.orderLabel}>{store.activeEvent.name}</span>
            <span style={styles.orderProgress}>{store.activeEvent.progress}/{store.activeEvent.goal}</span>
          </div>
          <div style={styles.detail}>{store.activeEvent.detail} Ends day {store.activeEvent.endsDay}.</div>
          <div style={styles.track}>
            <div style={{ ...styles.fill, width: `${Math.min(100, Math.round((store.activeEvent.progress / store.activeEvent.goal) * 100))}%`, background: '#f0c040' }} />
          </div>
          <div style={styles.rewardRow}>
            <span>+{store.activeEvent.rewardTickets} tickets | event trophy</span>
            <button
              onClick={store.claimEventReward}
              disabled={!eventDone || store.weeklyQuests.includes(store.activeEvent.id)}
              style={{ ...styles.claim, opacity: eventDone && !store.weeklyQuests.includes(store.activeEvent.id) ? 1 : 0.42 }}
            >
              {store.weeklyQuests.includes(store.activeEvent.id) ? 'claimed' : 'claim'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    flexShrink: 0,
    borderTop: '1px solid rgba(255,255,255,0.05)',
    background: '#0d0f14',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 12px 6px',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
  },
  title: {
    fontSize: 9,
    fontFamily: 'var(--font-mono)',
    color: '#8892a4',
    letterSpacing: '0.12em',
    fontWeight: 700,
  },
  reset: {
    fontSize: 8,
    fontFamily: 'var(--font-mono)',
    color: '#4a5568',
  },
  body: {
    display: 'flex',
    flexDirection: 'column',
    gap: 7,
    padding: 10,
  },
  order: {
    padding: 8,
    borderRadius: 5,
    border: '1px solid rgba(255,255,255,0.06)',
    background: '#111318',
  },
  orderTop: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 8,
  },
  orderLabel: {
    color: '#e8eaf0',
    fontSize: 10,
    fontFamily: 'var(--font-mono)',
    fontWeight: 700,
  },
  orderProgress: {
    color: '#9ce55a',
    fontSize: 9,
    fontFamily: 'var(--font-mono)',
  },
  detail: {
    marginTop: 4,
    color: '#4a5568',
    fontSize: 8,
    lineHeight: 1.4,
    fontFamily: 'var(--font-mono)',
  },
  track: {
    height: 4,
    marginTop: 7,
    borderRadius: 4,
    overflow: 'hidden',
    background: '#0d0f14',
  },
  fill: {
    height: '100%',
    background: '#9ce55a',
  },
  rewardRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 7,
    color: '#8892a4',
    fontSize: 8,
    fontFamily: 'var(--font-mono)',
  },
  claim: {
    height: 22,
    padding: '0 8px',
    borderRadius: 4,
    border: '1px solid rgba(156,229,90,0.35)',
    background: 'rgba(156,229,90,0.08)',
    color: '#9ce55a',
    fontSize: 8,
    fontFamily: 'var(--font-mono)',
    cursor: 'pointer',
  },
}
