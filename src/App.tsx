import React, { useEffect, useRef, useState } from 'react'
import HUD from './components/HUD'
import Minimap from './components/Minimap'
import InventoryModal from './components/InventoryModal'
import GlobalChat from './components/GlobalChat'
import FarmVisitPanel from './components/FarmVisitPanel'
import CreateFarmModal from './components/CreateFarmModal'
import FarmhouseMarket from './components/FarmhouseMarket'
import SocialMarketHub from './components/SocialMarketHub'
import FarmhouseShowcase from './components/FarmhouseShowcase'
import LandingPage from './components/LandingPage'
import { useGame } from './hooks/useGame'
import { useGameStore } from './stores/gameStore'
import { ISO_OBJECTS, ISO_TILES } from './lib/IsoConstants'
import { gameAudio } from './lib/audio'
import FarmControlPanel from './components/FarmControlPanel'
import { FARM_PORTAL, TOWN_PORTAL } from './lib/IsoWorld'
import { useMultiplayer } from './hooks/useMultiplayer'

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [showFarmhouseShowcase, setShowFarmhouseShowcase] = useState(false)
  const [showHowToPlay, setShowHowToPlay] = useState(false)
  const [tutorialStep, setTutorialStep] = useState(1)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const previousFarmRef = useRef<string | null>(null)
  const [showLanding, setShowLanding] = useState(() => {
    if (typeof window === 'undefined') return true
    return !new URLSearchParams(window.location.search).has('game')
  })

  const {
    showInventory, showMinimap, showChat,
    showVisitPanel, showMarketplace, showSocialHub, activeFarmId,
    farmCreated, worldLoaded, isoWorld, resources,
    player, gameMode, selectedObjectType, saveFarmNow,
    returnHomeFarm, travelTown
  } = useGameStore()

  const isTown = activeFarmId === 'town'
  const portal = isTown ? TOWN_PORTAL : FARM_PORTAL
  const isNearPortal = Math.abs(player.tileX - portal.x) + Math.abs(player.tileY - portal.y) <= 1

  useGame(containerRef)
  useMultiplayer()

  useEffect(() => {
    if (!farmCreated || !worldLoaded) return
    const id = window.setInterval(() => saveFarmNow(), 2500)
    const beforeUnload = () => saveFarmNow()
    window.addEventListener('beforeunload', beforeUnload)
    return () => {
      window.removeEventListener('beforeunload', beforeUnload)
    }
  }, [farmCreated, worldLoaded, saveFarmNow])

  useEffect(() => {
    if (showLanding || !farmCreated) return
    gameAudio.setAmbience(isTown ? 'town' : 'farm')
    gameAudio.playTravel()
  }, [farmCreated, isTown, showLanding])

  useEffect(() => {
    if (showLanding || !farmCreated) return
    if (previousFarmRef.current && previousFarmRef.current !== activeFarmId) {
      // Travel transition handled by audio only now
    }
    previousFarmRef.current = activeFarmId
  }, [activeFarmId, farmCreated, showLanding])

  const enterGame = () => {
    gameAudio.unlock()
    setShowLanding(false)
    setTutorialStep(1)
    setShowHowToPlay(true)
    window.setTimeout(() => window.dispatchEvent(new Event('solfarm:center-camera')), 80)
  }

  const handleNextStep = () => {
    if (tutorialStep < 4) {
      setTutorialStep(prev => prev + 1)
    } else {
      setShowHowToPlay(false)
    }
  }

  const canBuildOnPlayerTile = (() => {
    if (isTown || gameMode !== 'build' || !selectedObjectType || !(selectedObjectType in ISO_OBJECTS) || !isoWorld) return false
    const object = ISO_OBJECTS[selectedObjectType as keyof typeof ISO_OBJECTS]
    const anchor = isoWorld[player.tileY]?.[player.tileX]
    if (!anchor || anchor.object || anchor.occupiedBy) return false
    const blockedBases: number[] = [ISO_TILES.WATER.id, ISO_TILES.DEEPWATER.id, ISO_TILES.LAVA.id]
    if (blockedBases.includes(anchor.base)) return false
    for (let y = player.tileY; y < player.tileY + object.footprint.h; y += 1) {
      for (let x = player.tileX; x < player.tileX + object.footprint.w; x += 1) {
        const tile = isoWorld[y]?.[x]
        if (!tile || tile.object || tile.occupiedBy || tile.height !== anchor.height) return false
        if (blockedBases.includes(tile.base)) return false
      }
    }
    return true
  })()

  const placeOnCurrentTile = () => {
    gameAudio.unlock()
    window.dispatchEvent(new Event('solfarm:place-selected'))
  }

  const useTravelPortal = () => {
    gameAudio.playTravel()
    if (isTown) returnHomeFarm()
    else travelTown()
    window.setTimeout(() => window.dispatchEvent(new Event('solfarm:center-camera')), 80)
  }

  return (
    <div className="game-root" style={styles.root}>
      <style>{mediaQueries}</style>

      {showLanding && <LandingPage onEnter={enterGame} />}

      {!showLanding && (
        <div className="mobile-hud-header">
          <span style={{ color: '#9ce55a', fontWeight: 'bold', fontSize: '14px', letterSpacing: '0.12em', fontFamily: 'var(--font-mono)' }}>SOLFARM</span>
          <button
            className="hamburger-menu-btn"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle Navigation"
          >
            Menu
          </button>
        </div>
      )}

      {!showLanding && (
        <div className={`game-hud-container ${isMobileMenuOpen ? 'mobile-menu-open' : ''}`}>
          <HUD />
        </div>
      )}

      <div className="game-body" style={styles.body}>
        <div className="game-canvas-wrap" style={styles.canvasWrap}>
          <div ref={containerRef} className="game-canvas" style={styles.canvas} />

          {!worldLoaded && (
            <div style={styles.loadingOverlay}>
              <div style={styles.loadingInner}>
                <div style={styles.loadingTitle}>SOLFARM</div>
                <div style={styles.loadingBar}>
                  <div style={styles.loadingFill} />
                </div>
                <div style={styles.loadingText}>generating world…</div>
              </div>
            </div>
          )}

          {showMinimap && (
            <div className="game-minimap-wrap responsive-minimap" style={styles.minimapWrap}>
              <Minimap />
            </div>
          )}

          <div
            className="game-player-help responsive-player-help"
            style={{ ...styles.playerHelp, ...(!isTown ? { left: 272 } : {}) }}
          >
            <div style={styles.helpTitle}>PLAYER</div>
            <div>{activeFarmId === 'home' ? 'home farm' : 'Welcome to Town'}</div>
            <div className="desktop-only-text">WASD / arrows to walk</div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
              <button onClick={() => window.dispatchEvent(new Event('solfarm:center-camera'))} style={styles.centerCameraBtn}>
                center
              </button>
              {isTown && (
                <button onClick={returnHomeFarm} style={{ ...styles.centerCameraBtn, ...styles.backFarmBtn }}>
                  Back to Farm
                </button>
              )}
              <button onClick={() => { setTutorialStep(1); setShowHowToPlay(true); }} style={{ ...styles.centerCameraBtn, ...styles.guideBtn }}>
                help?
              </button>
            </div>
            <div style={{ fontSize: '9px', marginTop: '6px', opacity: 0.8 }}>Tile: {player.tileX}, {player.tileY}</div>
          </div>

          {isTown && (
            <div className="responsive-town-banner" style={styles.townBanner}>
              <strong>WELCOME TO TOWN</strong>
            </div>
          )}

          {isTown && <TownCommercePanel />}

          {farmCreated && isNearPortal && (
            <button
              className="portal-travel-button"
              onClick={useTravelPortal}
            >
              <strong>{isTown ? 'Return to Farm' : 'Travel to Town'}</strong>
              <span>Enter travel portal</span>
            </button>
          )}

          {!isTown && farmCreated && <FarmControlPanel />}

          {!isTown && gameMode === 'build' && selectedObjectType && (
            <button
              onClick={placeOnCurrentTile}
              disabled={!canBuildOnPlayerTile}
              className="responsive-build-btn"
              style={{ ...styles.placeButton, ...(!canBuildOnPlayerTile ? styles.placeButtonDisabled : {}) }}
            >
              {canBuildOnPlayerTile
                ? `Build ${selectedObjectType.toLowerCase().replace(/_/g, ' ')}`
                : 'Tile not compatible'}
            </button>
          )}

          {showChat && <GlobalChat />}
          {showVisitPanel && <FarmVisitPanel />}

          <MobileControls />
        </div>
      </div>

      {showHowToPlay && (
        <div style={styles.modalOverlay} onClick={() => setShowHowToPlay(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <span>SOLFARM TUTORIAL</span>
              <span style={{ fontSize: '11px', color: '#647084', fontFamily: 'var(--font-mono)' }}>Step {tutorialStep} of 4</span>
            </div>

            <div style={styles.modalBody}>
              {tutorialStep === 1 && (
                <div style={styles.stepItem}>
                  <span style={styles.stepBadge}>1</span>
                  <div>
                    <strong style={{ color: '#9ce55a', fontSize: '13px' }}>Explore the Map</strong>
                    <p style={{ margin: '4px 0 0 0', color: '#b0bccc' }}>Use the horizontal **navigation arrow keys** located at the bottom-left of your screen to walk around and discover perfect spots on the map.</p>
                  </div>
                </div>
              )}

              {tutorialStep === 2 && (
                <div style={styles.stepItem}>
                  <span style={styles.stepBadge}>2</span>
                  <div>
                    <strong style={{ color: '#9ce55a', fontSize: '13px' }}>Build Your Farmhouse</strong>
                    <p style={{ margin: '4px 0 0 0', color: '#b0bccc' }}>Your plot starts completely flat and empty. Choose structure objects from your toolbar to design and **build your custom farmhouse** anywhere you like.</p>
                  </div>
                </div>
              )}

              {tutorialStep === 3 && (
                <div style={styles.stepItem}>
                  <span style={styles.stepBadge}>3</span>
                  <div>
                    <strong style={{ color: '#9ce55a', fontSize: '13px' }}>Plant & Harvest Crops</strong>
                    <p style={{ margin: '4px 0 0 0', color: '#b0bccc' }}>Pick dynamic seed types from the slider right above your touch pad. Plant them in the soil, watch them grow, and **harvest your crops** to sell for coins!</p>
                  </div>
                </div>
              )}

              {tutorialStep === 4 && (
                <div style={styles.stepItem}>
                  <span style={styles.stepBadge}>4</span>
                  <div>
                    <strong style={{ color: '#9ce55a', fontSize: '13px' }}>Execute Placements</strong>
                    <p style={{ margin: '4px 0 0 0', color: '#b0bccc' }}>Position your character directly on your targeted grid tile, then press the primary neon green **"Build" action button** to confirm your placements instantly.</p>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              <button
                style={{ ...styles.modalCloseBtn, background: 'rgba(255,255,255,0.05)', color: '#8892a4', flex: 1, marginTop: 0 }}
                onClick={() => setShowHowToPlay(false)}
              >
                Skip
              </button>
              <button
                style={{ ...styles.modalCloseBtn, flex: 1, marginTop: 0 }}
                onClick={handleNextStep}
              >
                {tutorialStep === 4 ? "Let's Play!" : "Next Step"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showInventory && <InventoryModal />}
      {showMarketplace && <FarmhouseMarket />}
      {showSocialHub && <SocialMarketHub />}
      {showFarmhouseShowcase && <FarmhouseShowcase onClose={() => setShowFarmhouseShowcase(false)} />}
      {!farmCreated && worldLoaded && <CreateFarmModal />}
    </div>
  )
}

function MobileControls() {
  const sendMove = (dx: number, dy: number) => {
    gameAudio.unlock()
    window.dispatchEvent(new CustomEvent('solfarm:move-player', { detail: { dx, dy } }))
  }

  return (
    <div className="responsive-mobile-controls" style={styles.mobileControlsContainer}>
      <button aria-label="Move left" onClick={() => sendMove(-1, 0)} style={styles.dpadBtn}>←</button>
      <button aria-label="Move up" onClick={() => sendMove(0, -1)} style={styles.dpadBtn}>↑</button>
      <button aria-label="Move down" onClick={() => sendMove(0, 1)} style={styles.dpadBtn}>↓</button>
      <button aria-label="Move right" onClick={() => sendMove(1, 0)} style={styles.dpadBtn}>→</button>
    </div>
  )
}

function TownCommercePanel() {
  const store = useGameStore()
  const money = store.resources.coins

  return (
    <div className="town-commerce-panel responsive-town-commerce" style={styles.townCommerce}>
      <div style={styles.townCommerceHeader}>
        <span style={styles.townCommerceKicker}>TOWN SHOPS</span>
        <strong style={styles.townCommerceCoins}>{money.toLocaleString()} coins</strong>
      </div>

      <div style={styles.townCommerceStock}>
        <span>fruits <strong>{store.resources.fruits}</strong></span>
        <span>veg <strong>{store.resources.vegetables}</strong></span>
        <span>butter <strong>{store.resources.butter}</strong></span>
        <span>milk <strong>{store.resources.milk}</strong></span>
      </div>

      <div style={styles.townCommerceSection}>Fruit & Vegetable Market</div>
      <div style={styles.townCommerceGrid}>
        <button onClick={() => store.buyTownProduce('fruits', 5)} style={styles.townCommerceButton}>buy 5 fruits</button>
        <button onClick={() => store.sellTownProduce('fruits', 5)} style={styles.townCommerceButtonAlt}>sell 5 fruits</button>
        <button onClick={() => store.buyTownProduce('vegetables', 5)} style={styles.townCommerceButton}>buy 5 veg</button>
        <button onClick={() => store.sellTownProduce('vegetables', 5)} style={styles.townCommerceButtonAlt}>sell 5 veg</button>
      </div>

      <div style={styles.townCommerceSection}>Dairy</div>
      <div style={styles.townCommerceGrid}>
        <button onClick={() => store.buyButter(1)} style={styles.townCommerceButton}>buy butter</button>
        <button onClick={() => store.sellMilk(1)} style={styles.townCommerceButtonAlt}>sell milk</button>
        <button onClick={() => store.sellEggs(1)} style={styles.townCommerceButtonAlt}>sell egg</button>
      </div>
    </div>
  )
}

const mediaQueries = `
  html, body, #root, .game-root {
    overflow: hidden !important;
    position: fixed !important;
    width: 100vw !important;
    height: 100vh !important;
    height: 100dvh !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  .responsive-mobile-controls { display: none; }
  .mobile-hud-header { display: none; }

  .game-hud__modes,
  div[class*="game-hud__modes"],
  div[class*="EditorModes"],
  div[class*="ModeSelector"] {
    display: none !important;
  }

  /* DROPDOWN PANEL PERMANENTLY HIDDEN */
  .hud-build-panel {
    display: none !important;
    visibility: hidden !important;
    pointer-events: none !important;
  }

  @media (max-width: 1023px) {
    .desktop-only-text { display: none !important; }
    
    .responsive-player-help {
      left: auto !important;
      right: max(12px, env(safe-area-inset-right)) !important;
      top: max(56px, calc(env(safe-area-inset-top) + 8px)) !important;
      width: 200px !important;
      z-index: 1010 !important;
    }

    .responsive-minimap {
      display: block !important;
      bottom: auto !important;
      top: max(230px, calc(env(safe-area-inset-top) + 180px)) !important;
      right: max(12px, env(safe-area-inset-right)) !important;
      z-index: 1010 !important;
    }
    
    .mobile-hud-header {
      display: flex !important;
      align-items: center;
      justify-content: space-between !important;
      background: #0d0f14;
      padding: 10px 16px;
      height: 48px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      z-index: 10000;
      position: relative;
      box-sizing: border-box;
    }
    
    .hamburger-menu-btn {
      min-height: 36px;
      background: rgba(255,248,232,0.1);
      border: 1px solid rgba(255,248,232,0.18);
      color: #fff8e8;
      font-size: 12px;
      font-weight: 800;
      padding: 0 12px;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .game-hud-container {
      display: none;
      position: absolute;
      top: 48px;
      left: 0;
      width: 100vw;
      background: #111318;
      z-index: 9999;
      border-bottom: 1px solid rgba(156,229,90,0.2);
      box-shadow: 0 12px 32px rgba(0,0,0,0.6);
      box-sizing: border-box;
    }
    
    .game-hud-container.mobile-menu-open {
      display: block !important;
    }

    .game-root > div.game-hud-container .game-hud,
    .game-hud-container div[class*="hud"],
    .game-hud-container header {
      display: flex !important;
      flex-direction: column !important;
      align-items: stretch !important;
      height: auto !important;
      width: 100% !important;
      padding: 14px !important;
      gap: 10px !important;
    }

    .game-hud-container div[class*="hud"] div,
    .game-hud-container header div {
      flex-direction: column !important;
      align-items: stretch !important;
      width: 100% !important;
      gap: 6px !important;
    }

    .game-hud-container button {
      width: 100% !important;
      height: 38px !important;
      font-size: 11px !important;
    }

    .responsive-mobile-controls {
      display: flex !important;
      flex-direction: row !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 8px !important;
      top: auto !important;
      left: max(12px, env(safe-area-inset-left)) !important;
      bottom: max(12px, env(safe-area-inset-bottom)) !important;
      transform: none !important;
      padding: 10px 14px !important;
      border-radius: 14px !important;
      background: rgba(18, 35, 26, 0.88) !important;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4) !important;
      z-index: 1000 !important;
    }

    .responsive-mobile-controls button {
      grid-column: auto !important;
      grid-row: auto !important;
      flex: none !important;
      width: 48px !important;
      height: 48px !important;
      min-width: 48px !important;
      max-width: 48px !important;
      font-size: 20px !important;
      font-weight: bold !important;
      line-height: 48px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      padding: 0 !important;
      box-sizing: border-box !important;
      background: rgba(255,248,232,0.12) !important;
      color: #fff8e8 !important;
      border: 1px solid rgba(255,248,232,0.2) !important;
      border-radius: 8px !important;
    }

    .responsive-build-btn {
      position: fixed !important;
      left: 50% !important;
      right: auto !important;
      transform: translateX(-50%) !important;
      bottom: calc(max(12px, env(safe-area-inset-bottom)) + 215px) !important;
      width: 220px !important;
      min-width: 200px !important;
      height: 52px !important;
      z-index: 1015 !important;
      text-align: center !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
    }

    div[class*="FarmControlPanel"], 
    .farm-control-panel {
      position: fixed !important;
      left: max(12px, env(safe-area-inset-left)) !important;
      bottom: calc(max(12px, env(safe-area-inset-bottom)) + 78px) !important;
      width: auto !important;
      max-width: calc(100vw - 24px) !important;
      max-height: min(22vh, 120px) !important;
      display: flex !important;
      flex-direction: column-reverse !important;
      overflow-y: auto !important;
      z-index: 990 !important;
      background: rgba(13,15,20,0.92) !important;
      border: 1px solid rgba(255,255,255,0.08) !important;
      border-radius: 12px !important;
      padding: 8px !important;
    }

    .farm-control-panel section > div {
       height: auto !important;
       max-height: 100px !important;
       display: flex !important;
       flex-direction: row !important;
       overflow-x: auto !important;
       overflow-y: hidden !important;
       gap: 8px !important;
    }
  }

  @media (max-width: 560px) {
    .responsive-player-help { width: 150px !important; }
    .responsive-minimap { top: max(210px, calc(env(safe-area-inset-top) + 160px)) !important; }

    .responsive-mobile-controls {
      gap: 6px !important;
      padding: 8px 10px !important;
      left: 6px !important;
      bottom: 6px !important;
    }

    .responsive-mobile-controls button {
      width: 42px !important;
      height: 42px !important;
      min-width: 42px !important;
      max-width: 42px !important;
      font-size: 18px !important;
      line-height: 42px !important;
    }

    div[class*="FarmControlPanel"], 
    .farm-control-panel {
      bottom: calc(max(6px, env(safe-area-inset-bottom)) + 66px) !important;
      left: 6px !important;
    }

    .responsive-build-btn {
      bottom: calc(max(6px, env(safe-area-inset-bottom)) + 195px) !important;
      width: 190px !important;
      height: 46px !important;
      font-size: 11px !important;
    }
  }
`

const styles: Record<string, React.CSSProperties> = {
  root: {
    width: '100vw',
    height: '100dvh' as any,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    background: '#0d0f14',
    position: 'relative',
    WebkitTapHighlightColor: 'transparent',
  },
  body: {
    flex: 1,
    display: 'flex',
    flexDirection: 'row',
    overflow: 'hidden',
    minHeight: 0,
    position: 'relative',
    height: '100%',
  },
  canvasWrap: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    minWidth: 0,
    height: '100%',
  },
  canvas: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  loadingOverlay: {
    position: 'absolute',
    inset: 0,
    background: '#0d0f14',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  loadingInner: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
  },
  loadingTitle: {
    fontSize: 24,
    fontFamily: 'var(--font-mono)',
    fontWeight: 700,
    letterSpacing: '0.2em',
    color: '#9ce55a',
  },
  loadingBar: {
    width: 200,
    height: 3,
    background: 'rgba(255,255,255,0.07)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  loadingFill: {
    width: '60%',
    height: '100%',
    background: '#9ce55a',
    borderRadius: 2,
  },
  loadingText: {
    fontSize: 11,
    fontFamily: 'var(--font-mono)',
    color: '#4a5568',
    letterSpacing: '0.05em',
  },
  minimapWrap: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    zIndex: 10,
  },
  playerHelp: {
    position: 'absolute',
    left: 12,
    top: '64px',
    zIndex: 10,
    padding: '10px 12px',
    borderRadius: 6,
    background: 'rgba(13,15,20,0.85)',
    border: '1px solid rgba(255,255,255,0.07)',
    color: '#8892a4',
    fontSize: '11px',
    fontFamily: 'var(--font-mono)',
    lineHeight: 1.4,
    userSelect: 'none',
  },
  helpTitle: {
    color: '#9ce55a',
    fontWeight: 700,
    letterSpacing: '0.1em',
    fontSize: 9,
  },
  centerCameraBtn: {
    padding: '5px 8px',
    borderRadius: 4,
    border: '1px solid rgba(156,229,90,0.35)',
    background: 'rgba(156,229,90,0.08)',
    color: '#9ce55a',
    fontSize: '10px',
    fontFamily: 'var(--font-mono)',
    cursor: 'pointer',
  },
  guideBtn: {
    borderColor: 'rgba(100,180,255,0.38)',
    background: 'rgba(100,180,255,0.09)',
    color: '#8ed8ff',
  },
  backFarmBtn: {
    borderColor: 'rgba(255,255,255,0.35)',
    background: 'rgba(255,255,255,0.1)',
    color: '#ffffff',
  },
  townBanner: {
    position: 'absolute',
    top: 18,
    left: '50%',
    zIndex: 18,
    transform: 'translateX(-50%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3,
    padding: '9px 18px',
    border: '1px solid rgba(240,192,64,0.5)',
    borderRadius: 6,
    background: 'rgba(13,15,20,0.82)',
    color: '#fff4d7',
    fontFamily: 'var(--font-mono)',
    boxShadow: '0 12px 28px rgba(0,0,0,0.28)',
    pointerEvents: 'none',
  },
  townCommerce: {
    position: 'absolute',
    left: 14,
    bottom: 14,
    zIndex: 22,
    width: 260,
    maxWidth: 'calc(100vw - 28px)',
    padding: 10,
    borderRadius: 8,
    border: '1px solid rgba(240,192,64,0.36)',
    background: 'rgba(13,15,20,0.86)',
    backdropFilter: 'blur(10px)',
    color: '#cbd5df',
    fontFamily: 'var(--font-mono)',
    boxShadow: '0 12px 28px rgba(0,0,0,0.32)',
  },
  townCommerceHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8,
  },
  townCommerceKicker: {
    color: '#5cedf0',
    fontSize: 9,
    fontWeight: 800,
    letterSpacing: '0.12em',
  },
  townCommerceCoins: {
    color: '#f0c040',
    fontSize: 10,
  },
  townCommerceStock: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 6,
    marginBottom: 10,
    fontSize: 10,
    color: '#8892a4',
  },
  townCommerceSection: {
    margin: '8px 0 6px',
    color: '#fff4d7',
    fontSize: 10,
    fontWeight: 800,
  },
  townCommerceGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 6,
  },
  townCommerceButton: {
    minHeight: 30,
    padding: '6px 7px',
    borderRadius: 5,
    border: '1px solid rgba(156,229,90,0.4)',
    background: 'rgba(156,229,90,0.13)',
    color: '#9ce55a',
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    fontWeight: 800,
    cursor: 'pointer',
  },
  townCommerceButtonAlt: {
    minHeight: 30,
    padding: '6px 7px',
    borderRadius: 5,
    border: '1px solid rgba(240,192,64,0.4)',
    background: 'rgba(240,192,64,0.11)',
    color: '#f0c040',
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    fontWeight: 800,
    cursor: 'pointer',
  },
  placeButton: {
    position: 'absolute',
    left: '50%',
    bottom: 18,
    zIndex: 30,
    transform: 'translateX(-50%)',
    minWidth: 220,
    minHeight: 44,
    padding: '9px 18px',
    borderRadius: 7,
    border: '1px solid rgba(156,229,90,0.65)',
    background: '#9ce55a',
    color: '#0d0f14',
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    fontWeight: 800,
    cursor: 'pointer',
    boxShadow: '0 10px 28px rgba(0,0,0,0.35)',
  },
  placeButtonDisabled: {
    borderColor: 'rgba(255,255,255,0.12)',
    background: 'rgba(13,15,20,0.82)',
    color: '#647084',
    cursor: 'not-allowed',
  },
  mobileControlsContainer: {
    position: 'absolute',
    background: 'rgba(18,35,26,0.78)',
    padding: '8px',
    borderRadius: '14px',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,248,232,0.14)',
    boxShadow: '0 12px 30px rgba(0,0,0,0.28)',
    zIndex: 999,
  },
  dpadBtn: {
    width: '52px',
    height: '52px',
    background: 'rgba(255,248,232,0.12)',
    border: '1px solid rgba(255,248,232,0.2)',
    color: '#fff8e8',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 900,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    userSelect: 'none',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(5, 7, 10, 0.85)',
    backdropFilter: 'blur(6px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99999,
  },
  modalContent: {
    backgroundColor: '#111318',
    border: '1px solid rgba(156,229,90,0.35)',
    borderRadius: '12px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.7)',
    fontFamily: 'var(--font-mono)',
    width: '90%',
    maxWidth: '420px',
  },
  modalHeader: {
    color: '#9ce55a',
    fontSize: '16px',
    fontWeight: 'bold',
    letterSpacing: '0.1em',
    textAlign: 'center',
    borderBottom: '1px solid rgba(255,255,255,0.07)',
    paddingBottom: '10px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    color: '#b0bccc',
    fontSize: '12px',
    lineHeight: '1.5',
    minHeight: '80px',
  },
  stepItem: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
  },
  stepBadge: {
    background: 'rgba(156,229,90,0.15)',
    color: '#9ce55a',
    border: '1px solid #9ce55a',
    borderRadius: '50%',
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontWeight: 'bold',
    flexShrink: 0,
  },
  modalCloseBtn: {
    background: '#9ce55a',
    color: '#0d0f14',
    border: 'none',
    borderRadius: '6px',
    padding: '12px',
    fontSize: '13px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '6px',
    fontFamily: 'var(--font-mono)',
    transition: 'all 0.2s ease',
  }
}
