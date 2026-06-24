import React, { useState } from 'react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { AnchorProvider } from '@coral-xyz/anchor'
import { useGameStore } from '../stores/gameStore'
import { BLOCKS, RARITY_COLORS } from '../lib/constants'
import { ISO_TILES, ISO_OBJECTS } from '../lib/IsoConstants'
import { txMintBlockNFT } from '../lib/solana'

function hexColor(n: number): string {
  return '#' + n.toString(16).padStart(6, '0')
}

type MintState = 'idle' | 'confirming' | 'success' | 'error'

type Props = {
  wx: number
  wy: number
  onClose: () => void
}

export default function MintModal({ wx, wy, onClose }: Props) {
  const { publicKey, wallet, signTransaction, signAllTransactions } = useWallet()
  const { connection } = useConnection()
  const store = useGameStore()

  const isoTile = store.isoWorld?.[wy]?.[wx] ?? null
  const isoDef = isoTile ? Object.values(ISO_TILES).find((tile) => tile.id === isoTile.base) : null
  const isoObject = isoTile?.object
    ? Object.values(ISO_OBJECTS).find((obj) =>
      obj.type === isoTile.object?.type &&
      obj.variant === isoTile.object?.variant &&
      obj.color === isoTile.object?.color
    )
    : null
  const blockId = isoTile ? Math.max(1, isoTile.base) : (store.world ? store.world[wy * 256 + wx] : 0)
  const fallbackBlock = BLOCKS[blockId]
  const block = isoDef ? {
    name: isoObject ? `${isoObject.label} on ${isoDef.name}` : isoDef.name,
    color: isoObject?.color ?? isoDef.top,
    glows: isoDef.name === 'lava',
    glowColor: isoDef.top,
    rarity: isoObject && isoObject.solValue > 0.04 ? 'rare' : 'common',
    solValue: (isoObject?.solValue ?? 0) + isoDef.solValue,
  } : fallbackBlock

  const [mintState, setMintState] = useState<MintState>('idle')
  const [txSig, setTxSig] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Close on Escape
  React.useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const handleMint = async () => {
    if (!block || mintState === 'confirming') return
    if (!publicKey || !wallet || !signTransaction || !signAllTransactions) {
      setMintState('error')
      setErrorMsg('Connect a wallet to mint on-chain.')
      return
    }
    setMintState('confirming')
    setErrorMsg(null)

    try {
      let sig: string

      const provider = new AnchorProvider(
        connection,
        { publicKey, signTransaction, signAllTransactions },
        { commitment: 'confirmed' }
      )
      sig = await txMintBlockNFT(provider, wx, wy)

      setTxSig(sig)
      setMintState('success')
      store.incrementNft()
      store.addMintedItem({
        kind: isoObject ? 'building' : 'tile',
        name: block.name,
        sig,
        x: wx,
        y: wy,
      })
      store.addTx({
        action: 'mint_nft',
        sig,
        fee: 0.012,
        status: 'confirmed',
        blockName: block.name,
        coords: { x: wx, y: wy },
      })
    } catch (e: unknown) {
      setMintState('error')
      setErrorMsg(e instanceof Error ? e.message : 'Transaction failed')
    }
  }

  if (!block) return null

  const rarityColor = RARITY_COLORS[block.rarity]

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <span style={styles.title}>MINT BLOCK NFT</span>
          <button onClick={onClose} style={styles.closeBtn}>x</button>
        </div>

        {/* Block preview */}
        <div style={styles.preview}>
          <div
            style={{
              ...styles.blockSwatch,
              background: hexColor(block.color),
              boxShadow: block.glows
                ? `0 0 20px 6px ${hexColor(block.glowColor ?? block.color)}44`
                : undefined,
            }}
          />
          <div style={styles.blockInfo}>
            <div style={styles.blockName}>{block.name}</div>
            <div style={{ ...styles.blockRarity, color: rarityColor }}>
              {block.rarity}
            </div>
            <div style={styles.blockCoords}>({wx}, {wy})</div>
          </div>
        </div>

        {/* Stats */}
        <div style={styles.statsGrid}>
          <div style={styles.statBox}>
            <div style={styles.statLabel}>est. floor value</div>
            <div style={styles.statVal}>SOL {block.solValue.toFixed(4)}</div>
          </div>
          <div style={styles.statBox}>
            <div style={styles.statLabel}>mint cost</div>
            <div style={styles.statVal}>SOL 0.012</div>
          </div>
          <div style={styles.statBox}>
            <div style={styles.statLabel}>standard</div>
            <div style={styles.statVal}>Metaplex cNFT</div>
          </div>
          <div style={styles.statBox}>
            <div style={styles.statLabel}>network</div>
            <div style={{ ...styles.statVal, color: '#9945ff' }}>Solana devnet</div>
          </div>
        </div>

        {/* Action area */}
        <div style={styles.action}>
          {mintState === 'idle' && (
            <>
              {!publicKey && (
                <div style={styles.walletWarning}>
                  connect wallet to mint this item on-chain
                </div>
              )}
              <button
                onClick={handleMint}
                disabled={!publicKey}
                style={{ ...styles.mintBtn, ...(!publicKey ? styles.disabledBtn : {}) }}
              >
                {publicKey ? 'mint on Solana devnet' : 'connect wallet to mint'}
              </button>
            </>
          )}

          {mintState === 'confirming' && (
            <div style={styles.confirming}>
              <div style={styles.confirmSpinner}>o</div>
              <div style={styles.confirmText}>
                confirming on Solana devnet...
              </div>
              <div style={styles.confirmSub}>
                this takes about 1-3 seconds on devnet
              </div>
            </div>
          )}

          {mintState === 'success' && txSig && (
            <div style={styles.success}>
              <div style={styles.successIcon}>OK</div>
              <div style={styles.successText}>NFT minted successfully</div>
              <div style={styles.sigBox}>
                {txSig.slice(0, 20)}...{txSig.slice(-8)}
              </div>
              <a
                href={`https://solscan.io/tx/${txSig}?cluster=devnet`}
                target="_blank"
                rel="noreferrer"
                style={styles.solscanLink}
              >
                view on Solscan
              </a>
              <button onClick={onClose} style={styles.doneBtn}>done</button>
            </div>
          )}

          {mintState === 'error' && (
            <div style={styles.error}>
              <div style={styles.errorText}>mint failed</div>
              {errorMsg && <div style={styles.errorMsg}>{errorMsg}</div>}
              <button onClick={() => setMintState('idle')} style={styles.retryBtn}>
                try again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1100,
  },
  modal: {
    width: 340,
    background: '#141720',
    border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: 8,
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  title: {
    fontSize: 11,
    fontFamily: 'var(--font-mono)',
    fontWeight: 600,
    color: '#e8eaf0',
    letterSpacing: '0.1em',
  },
  closeBtn: {
    fontSize: 16,
    color: '#4a5568',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'var(--font-mono)',
    lineHeight: 1,
  },
  preview: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '20px 20px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
  },
  blockSwatch: {
    width: 52,
    height: 52,
    borderRadius: 6,
    flexShrink: 0,
    imageRendering: 'pixelated',
  },
  blockInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  blockName: {
    fontSize: 16,
    fontFamily: 'var(--font-mono)',
    fontWeight: 600,
    color: '#e8eaf0',
    textTransform: 'capitalize',
  },
  blockRarity: {
    fontSize: 9,
    fontFamily: 'var(--font-mono)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },
  blockCoords: {
    fontSize: 9,
    fontFamily: 'var(--font-mono)',
    color: '#2d3748',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 1,
    background: 'rgba(255,255,255,0.03)',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
  },
  statBox: {
    padding: '10px 14px',
    background: '#141720',
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  },
  statLabel: {
    fontSize: 8,
    fontFamily: 'var(--font-mono)',
    color: '#2d3748',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  },
  statVal: {
    fontSize: 11,
    fontFamily: 'var(--font-mono)',
    color: '#8892a4',
    fontWeight: 500,
  },
  action: {
    padding: '16px',
  },
  walletWarning: {
    fontSize: 9,
    fontFamily: 'var(--font-mono)',
    color: '#4a5568',
    marginBottom: 10,
    textAlign: 'center',
    lineHeight: 1.5,
  },
  mintBtn: {
    width: '100%',
    padding: '10px',
    background: 'rgba(156,229,90,0.08)',
    border: '1px solid rgba(156,229,90,0.3)',
    borderRadius: 5,
    color: '#9ce55a',
    fontSize: 11,
    fontFamily: 'var(--font-mono)',
    cursor: 'pointer',
    letterSpacing: '0.05em',
    transition: 'background 0.15s',
  },
  disabledBtn: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  confirming: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    padding: '8px 0',
  },
  confirmSpinner: {
    fontSize: 20,
    color: '#f0c040',
    animation: 'spin 1s linear infinite',
  },
  confirmText: {
    fontSize: 11,
    fontFamily: 'var(--font-mono)',
    color: '#f0c040',
  },
  confirmSub: {
    fontSize: 9,
    fontFamily: 'var(--font-mono)',
    color: '#4a5568',
  },
  success: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    padding: '4px 0',
  },
  successIcon: {
    fontSize: 24,
    color: '#9ce55a',
  },
  successText: {
    fontSize: 12,
    fontFamily: 'var(--font-mono)',
    color: '#9ce55a',
    fontWeight: 600,
  },
  sigBox: {
    fontSize: 9,
    fontFamily: 'var(--font-mono)',
    color: '#2d3748',
    background: '#0d0f14',
    border: '1px solid rgba(255,255,255,0.04)',
    borderRadius: 3,
    padding: '5px 10px',
    width: '100%',
    textAlign: 'center',
  },
  solscanLink: {
    fontSize: 10,
    fontFamily: 'var(--font-mono)',
    color: '#9945ff',
    textDecoration: 'none',
  },
  doneBtn: {
    padding: '7px 28px',
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 4,
    color: '#4a5568',
    fontSize: 10,
    fontFamily: 'var(--font-mono)',
    cursor: 'pointer',
    marginTop: 4,
  },
  error: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'var(--font-mono)',
    color: '#ff6b6b',
  },
  errorMsg: {
    fontSize: 9,
    fontFamily: 'var(--font-mono)',
    color: '#4a5568',
    textAlign: 'center',
    lineHeight: 1.5,
    maxWidth: 220,
  },
  retryBtn: {
    padding: '7px 20px',
    background: 'rgba(255,107,107,0.08)',
    border: '1px solid rgba(255,107,107,0.3)',
    borderRadius: 4,
    color: '#ff6b6b',
    fontSize: 10,
    fontFamily: 'var(--font-mono)',
    cursor: 'pointer',
  },
}

