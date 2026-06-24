import React, { useState } from 'react'
import { useGameStore, type CharacterId } from '../stores/gameStore'
import { gameAudio } from '../lib/audio'
import { FARMER_PROFESSIONS } from '../lib/farmCatalog'

const CHARACTERS: {
  id: CharacterId
  name: string
  title: string
  bonus: string
  shirt: string
  accent: string
  hatColor: string
}[] = [
  { id: 'farmer-sage', ...FARMER_PROFESSIONS['farmer-sage'], shirt: '#2f6fb2', accent: '#9ce55a', hatColor: '#9ce55a' },
  { id: 'farmer-sun', ...FARMER_PROFESSIONS['farmer-sun'], shirt: '#d58b28', accent: '#ffc46b', hatColor: '#f0a030' },
  { id: 'farmer-rose', ...FARMER_PROFESSIONS['farmer-rose'], shirt: '#b85078', accent: '#ff91bd', hatColor: '#e05090' },
  { id: 'farmer-river', ...FARMER_PROFESSIONS['farmer-river'], shirt: '#287f79', accent: '#72ddd4', hatColor: '#40c0b8' },
]

function FarmerPreview({ shirt, hatColor, accent }: { shirt: string; hatColor: string; accent: string }) {
  return (
    <svg width="52" height="68" viewBox="0 0 64 86" style={{ display: 'block' }}>
      <ellipse cx="32" cy="78" rx="18" ry="6" fill="#000" opacity=".22" />
      {/* Body/shirt */}
      <path d="M22 34h20v28H22Z" fill={shirt} opacity="0.8" />
      <path d="M22 34h10v28H22Z" fill={shirt} />
      {/* Skin/face */}
      <circle cx="32" cy="25" r="11" fill="#f3c28b" />
      {/* Hat brim */}
      <path d="M18 16h28v8H18Z" fill={hatColor} opacity="0.85" />
      {/* Hat top */}
      <path d="M23 6h18v13H23Z" fill={hatColor} />
      {/* Legs */}
      <path d="M24 61 18 76h9l5-14Zm16 0 6 15h-9l-5-14Z" fill={shirt} opacity="0.8" />
      {/* Arms */}
      <path d="M20 38 12 52M44 38l8 14" stroke={shirt} strokeWidth="6" strokeLinecap="round" />
      {/* Tool in hand */}
      <rect x="40" y="34" width="10" height="8" rx="2" fill={accent} opacity="0.9" />
      {/* Eye */}
      <circle cx="36" cy="25" r="2" fill="#2b1a12" />
    </svg>
  )
}

export default function CreateFarmModal() {
  const store = useGameStore()
  const [name, setName] = useState(store.farmName)
  const [characterId, setCharacterId] = useState<CharacterId | null>(null)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!characterId) return
    gameAudio.unlock()
    store.setCharacter(characterId)
    store.createFarm(name)
  }

  const selected = CHARACTERS.find(c => c.id === characterId)

  return (
    <div style={styles.overlay}>
      <form onSubmit={submit} style={styles.modal}>
        <div style={styles.eyebrow}>farmstead outfitters</div>
        <div style={styles.title}>Create Your Farmer</div>
        <div style={styles.copy}>
          Choose your farmer name and character class. Your choice affects crop growth,
          build cost, and harvest earnings.
        </div>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={32}
          autoFocus
          style={styles.input}
          placeholder="Your farmer or farm name"
        />

        <div style={styles.characterLabel}>Choose one character</div>
        <div style={styles.characterGrid}>
          {CHARACTERS.map((character) => {
            const isSelected = characterId === character.id
            return (
              <button
                key={character.id}
                type="button"
                onClick={() => {
                  setCharacterId(character.id)
                  gameAudio.unlock()
                }}
                style={{
                  ...styles.characterCard,
                  ...(isSelected ? { ...styles.characterCardActive, borderColor: character.accent, background: `${character.accent}14` } : {}),
                }}
                aria-pressed={isSelected}
              >
                <div style={styles.avatarWrap}>
                  <FarmerPreview shirt={character.shirt} hatColor={character.hatColor} accent={character.accent} />
                  {isSelected && (
                    <div style={{ ...styles.selectedBadge, background: character.accent, color: '#0d0f14' }}>✓</div>
                  )}
                </div>
                <strong style={{ ...styles.charName, color: isSelected ? character.accent : '#e8eaf0' }}>
                  {character.name}
                </strong>
                <small style={styles.charTitle}>{character.title}</small>
                <small style={{ ...styles.charBonus, color: isSelected ? character.accent : '#4a5568' }}>
                  {character.bonus}
                </small>
              </button>
            )
          })}
        </div>

        {selected && (
          <div style={{ ...styles.selectedInfo, borderColor: `${selected.accent}40` }}>
            <span style={{ color: selected.accent, fontWeight: 800 }}>{selected.name}</span>
            <span style={styles.selectedBonusText}> · {selected.bonus}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={!characterId}
          style={{
            ...styles.button,
            ...(!characterId ? styles.buttonDisabled : {}),
            ...(selected ? { background: `${selected.accent}18`, borderColor: `${selected.accent}55`, color: selected.accent } : {}),
          }}
        >
          {characterId ? `Start as ${selected?.name}` : 'choose a character first'}
        </button>
      </form>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 1400,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0,0,0,0.78)',
    backdropFilter: 'blur(8px)',
  },
  modal: {
    width: 420,
    maxWidth: 'calc(100vw - 24px)',
    maxHeight: '95dvh',
    overflowY: 'auto',
    padding: '20px 20px 24px',
    borderRadius: 12,
    border: '1px solid rgba(156,229,90,0.2)',
    background: '#0f1117',
    boxShadow: '0 32px 80px rgba(0,0,0,0.55)',
  },
  eyebrow: {
    color: '#9ce55a',
    fontSize: 9,
    fontFamily: 'var(--font-mono)',
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  title: {
    color: '#e8eaf0',
    fontSize: 22,
    fontWeight: 800,
    fontFamily: 'var(--font-mono)',
    letterSpacing: '-0.01em',
    marginBottom: 8,
  },
  copy: {
    color: '#4a5568',
    fontSize: 11,
    lineHeight: 1.55,
    fontFamily: 'var(--font-mono)',
    marginBottom: 16,
  },
  input: {
    width: '100%',
    height: 38,
    boxSizing: 'border-box',
    borderRadius: 6,
    border: '1px solid rgba(255,255,255,0.09)',
    background: '#080a0f',
    color: '#e8eaf0',
    padding: '0 12px',
    fontSize: 13,
    fontFamily: 'var(--font-mono)',
    outline: 'none',
    marginBottom: 20,
  },
  characterLabel: {
    color: '#8892a4',
    fontSize: 10,
    fontFamily: 'var(--font-mono)',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  characterGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: 8,
  },
  characterCard: {
    minWidth: 0,
    padding: '12px 6px 10px',
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.07)',
    background: '#0d0f14',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    transition: 'border-color 0.15s, background 0.15s',
    position: 'relative',
  },
  characterCardActive: {
    borderColor: '#9ce55a',
    background: 'rgba(156,229,90,0.06)',
  },
  avatarWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    width: 16,
    height: 16,
    borderRadius: '50%',
    fontSize: 9,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 900,
  },
  charName: {
    fontSize: 11,
    fontFamily: 'var(--font-mono)',
    fontWeight: 800,
    letterSpacing: '0.03em',
  },
  charTitle: {
    fontSize: 9,
    color: '#4a5568',
    fontFamily: 'var(--font-mono)',
    letterSpacing: '0.04em',
    textAlign: 'center',
  },
  charBonus: {
    fontSize: 8.5,
    fontFamily: 'var(--font-mono)',
    textAlign: 'center',
    lineHeight: 1.3,
  },
  selectedInfo: {
    marginTop: 14,
    padding: '9px 14px',
    borderRadius: 6,
    border: '1px solid',
    background: 'rgba(255,255,255,0.02)',
    fontSize: 11,
    fontFamily: 'var(--font-mono)',
    color: '#8892a4',
  },
  selectedBonusText: {
    color: '#4a5568',
  },
  button: {
    width: '100%',
    height: 40,
    marginTop: 14,
    borderRadius: 6,
    border: '1px solid rgba(156,229,90,0.3)',
    background: 'rgba(156,229,90,0.08)',
    color: '#9ce55a',
    fontSize: 12,
    fontWeight: 800,
    fontFamily: 'var(--font-mono)',
    cursor: 'pointer',
    letterSpacing: '0.05em',
    transition: 'all 0.15s',
  },
  buttonDisabled: {
    opacity: 0.38,
    cursor: 'not-allowed',
  },
}
