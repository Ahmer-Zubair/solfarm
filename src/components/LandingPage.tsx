import React from 'react'
import { useGameStore } from '../stores/gameStore'
import heroArt from '../assets/solfarm-reference-hero.png'
import townArt from '../assets/solfarm-town-market.png'

type Props = {
  onEnter: () => void
}

const FEATURES = [
  { title: 'Build', body: 'Place farmhouses, barns, wells, paths, crops, animals, and decorations tile by tile.' },
  { title: 'Grow', body: 'Plant seven crops, water them, harvest produce, and turn a blank field into a working farm.' },
  { title: 'Trade', body: 'Visit the town market to buy, sell, meet other players, and manage farm resources.' },
]

const STATS = [
  { label: 'Crop types', value: '7' },
  { label: 'Farm professions', value: '4' },
  { label: 'Playable zones', value: '2' },
]

export default function LandingPage({ onEnter }: Props) {
  const store = useGameStore()
  const farmersOnline = Math.max(24, store.remotePlayers.length + 1 + store.visitableFarms.length)

  const openTown = () => {
    onEnter()
    useGameStore.setState({ showSocialHub: true })
  }

  return (
    <main className="solfarm-site">
      <nav className="solfarm-nav" aria-label="SolFarm">
        <button className="solfarm-brand" onClick={onEnter}>
          <span>SOL</span><span>FARM</span>
        </button>
        <div className="solfarm-nav-actions">
          <button onClick={openTown}>Town</button>
          <button className="solfarm-nav-play" onClick={onEnter}>Play now</button>
        </div>
      </nav>

      <section className="solfarm-hero">
        <img className="solfarm-hero-art" src={heroArt} alt="SolFarm sunny farming world" />
        <div className="solfarm-hero-shade" />
        <div className="solfarm-hero-copy">
          <p className="solfarm-kicker">{farmersOnline.toLocaleString()} farmers online</p>
          <h1>SolFarm</h1>
          <p>
            A bright isometric farming game where you grow crops, build your homestead,
            care for animals, and trade in a shared town.
          </p>
          <div className="solfarm-actions">
            <button className="solfarm-primary" onClick={onEnter}>Start farming</button>
            <button className="solfarm-secondary" onClick={openTown}>Explore town</button>
          </div>
        </div>
      </section>

      <section className="solfarm-band solfarm-features">
        {FEATURES.map((feature) => (
          <article key={feature.title}>
            <span>{feature.title}</span>
            <p>{feature.body}</p>
          </article>
        ))}
      </section>

      <section className="solfarm-showcase">
        <div className="solfarm-showcase-copy">
          <p className="solfarm-kicker">Farm, market, town</p>
          <h2>Made to feel polished on desktop and playable on mobile.</h2>
          <p>
            The interface now puts the farm controls, movement buttons, and primary action
            areas where players can reach them cleanly on small screens.
          </p>
          <div className="solfarm-stats">
            {STATS.map((stat) => (
              <div key={stat.label}>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="solfarm-town-card">
          <img src={townArt} alt="SolFarm town market preview" />
        </div>
      </section>

      <section className="solfarm-final">
        <h2>Ready for the harvest?</h2>
        <button className="solfarm-primary" onClick={onEnter}>Launch game</button>
      </section>
    </main>
  )
}
