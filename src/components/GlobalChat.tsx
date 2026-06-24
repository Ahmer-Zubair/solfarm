import React, { useEffect, useRef, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useGameStore } from '../stores/gameStore'

export default function GlobalChat() {
  const { publicKey } = useWallet()
  const store = useGameStore()
  const [draft, setDraft] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [store.chatLog.length])

  const send = (e: React.FormEvent) => {
    e.preventDefault()
    const author = publicKey
      ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`
      : store.farmName || 'guest farmer'
    store.addChat(author, draft)
    setDraft('')
  }

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <div>
          <div style={styles.title}>GLOBAL CHAT</div>
          <div style={styles.sub}>{store.multiplayerStatus === 'online' ? 'Supabase realtime room' : 'reconnecting...'}</div>
        </div>
        <button onClick={store.toggleChat} style={styles.close}>x</button>
      </div>
      <div ref={listRef} style={styles.list}>
        {store.chatLog.map((msg) => (
          <div key={msg.id} style={styles.message}>
            <span style={{ ...styles.author, color: msg.system ? '#f0c040' : '#9ce55a' }}>
              {msg.author}
            </span>
            <span style={styles.text}>{msg.text}</span>
          </div>
        ))}
      </div>
      <form onSubmit={send} style={styles.form}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="say something..."
          maxLength={180}
          style={styles.input}
        />
        <button type="submit" style={styles.send}>send</button>
      </form>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    position: 'absolute',
    left: 14,
    bottom: 14,
    width: 310,
    height: 260,
    zIndex: 25,
    display: 'flex',
    flexDirection: 'column',
    background: 'rgba(13,15,20,0.94)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 6,
    boxShadow: '0 12px 30px rgba(0,0,0,0.28)',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '9px 10px',
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
    background: 'transparent',
    border: 'none',
    color: '#4a5568',
    cursor: 'pointer',
    fontFamily: 'var(--font-mono)',
  },
  list: {
    flex: 1,
    overflowY: 'auto',
    padding: '8px 10px',
  },
  message: {
    display: 'flex',
    gap: 7,
    alignItems: 'baseline',
    marginBottom: 7,
    fontSize: 10,
    fontFamily: 'var(--font-mono)',
    lineHeight: 1.35,
  },
  author: {
    flexShrink: 0,
    fontWeight: 700,
  },
  text: {
    color: '#aab2c0',
    wordBreak: 'break-word',
  },
  form: {
    display: 'flex',
    gap: 6,
    padding: 8,
    borderTop: '1px solid rgba(255,255,255,0.06)',
  },
  input: {
    minWidth: 0,
    flex: 1,
    height: 28,
    borderRadius: 4,
    border: '1px solid rgba(255,255,255,0.08)',
    background: '#111318',
    color: '#e8eaf0',
    fontSize: 10,
    fontFamily: 'var(--font-mono)',
    padding: '0 8px',
    outline: 'none',
  },
  send: {
    height: 28,
    borderRadius: 4,
    border: '1px solid rgba(156,229,90,0.3)',
    background: 'rgba(156,229,90,0.08)',
    color: '#9ce55a',
    fontSize: 10,
    fontFamily: 'var(--font-mono)',
    cursor: 'pointer',
  },
}
