const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '')
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || ''

type SupabaseSession = {
  access_token: string
  refresh_token: string
  expires_at?: number
  user: { id: string }
}

type RealtimeMessage = {
  topic?: string
  event?: string
  payload?: any
  ref?: string
}

const SESSION_KEY = 'solfarm.supabase.session.v1'
const CLIENT_KEY = 'solfarm.client.id.v1'

function clientId() {
  let id = window.sessionStorage.getItem(CLIENT_KEY)
  if (!id) {
    id = crypto.randomUUID()
    window.sessionStorage.setItem(CLIENT_KEY, id)
  }
  return id
}

function readSession(): SupabaseSession | null {
  try {
    return JSON.parse(window.localStorage.getItem(SESSION_KEY) || 'null')
  } catch {
    return null
  }
}

async function authRequest(path: string, body: unknown) {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null
  const response = await fetch(`${SUPABASE_URL}/auth/v1/${path}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  if (!response.ok) return null
  return response.json() as Promise<SupabaseSession>
}

let sessionPromise: Promise<SupabaseSession | null> | null = null

export async function getSupabaseSession() {
  if (sessionPromise) return sessionPromise
  sessionPromise = (async () => {
    const saved = readSession()
    const now = Math.floor(Date.now() / 1000)
    if (saved?.access_token && (!saved.expires_at || saved.expires_at > now + 60)) return saved
    if (saved?.refresh_token) {
      const refreshed = await authRequest('token?grant_type=refresh_token', { refresh_token: saved.refresh_token })
      if (refreshed?.access_token) {
        window.localStorage.setItem(SESSION_KEY, JSON.stringify(refreshed))
        return refreshed
      }
    }
    const created = await authRequest('signup', {})
    if (created?.access_token) {
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(created))
      return created
    }
    return null
  })()
  return sessionPromise
}

async function rest<T>(path: string, init: RequestInit = {}): Promise<T | null> {
  const session = await getSupabaseSession()
  if (!SUPABASE_URL || !SUPABASE_KEY || !session?.access_token) return null
  try {
    const headers: Record<string, string> = {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${session.access_token}`,
      Accept: 'application/json',
      ...((init.headers as Record<string, string> | undefined) || {}),
    }
    if (init.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json'
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      ...init,
      headers,
    })
    if (!response.ok) return null
    if (response.status === 204) return {} as T
    return response.json() as Promise<T>
  } catch {
    return null
  }
}

export const supabaseData = {
  async upsertProfile(displayName: string, characterId: string) {
    const session = await getSupabaseSession()
    if (!session) return null
    return rest('profiles?on_conflict=id', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify({
        id: session.user.id,
        display_name: displayName,
        character_id: characterId,
        updated_at: new Date().toISOString(),
      }),
    })
  },

  async saveFarm(save: unknown) {
    const session = await getSupabaseSession()
    if (!session) return null
    return rest('farm_saves?on_conflict=user_id', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({
        user_id: session.user.id,
        save_data: save,
        updated_at: new Date().toISOString(),
      }),
    })
  },

  async loadFarm<T>() {
    const session = await getSupabaseSession()
    if (!session) return null
    const rows = await rest<Array<{ save_data: T }>>(
      `farm_saves?select=save_data&user_id=eq.${encodeURIComponent(session.user.id)}&limit=1`,
    )
    return rows?.[0]?.save_data ?? null
  },

  async listChat() {
    return rest<Array<{ id: string; author: string; body: string; created_at: string }>>(
      'chat_messages?select=id,author,body,created_at&order=created_at.asc&limit=80',
    )
  },

  async sendChat(author: string, text: string) {
    return rest('chat_messages', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ author, body: text }),
    })
  },
}

export type TownPlayer = {
  id: string
  name: string
  characterId: string
  x: number
  y: number
  facing: 'north' | 'south' | 'east' | 'west'
  zone: 'farm' | 'town'
  updatedAt: number
}

type MultiplayerHandlers = {
  onPlayers: (players: TownPlayer[]) => void
  onChat: (message: { id: string; author: string; text: string; timestamp: number }) => void
  onStatus: (status: 'connecting' | 'online' | 'offline') => void
}

export class SupabaseRealtime {
  private socket: WebSocket | null = null
  private heartbeat: number | null = null
  private reconnect: number | null = null
  private ref = 1
  private self: TownPlayer
  private players = new Map<string, TownPlayer>()

  constructor(private handlers: MultiplayerHandlers, initial: Omit<TownPlayer, 'id' | 'updatedAt'>) {
    this.self = { ...initial, id: clientId(), updatedAt: Date.now() }
  }

  connect() {
    if (!SUPABASE_URL || !SUPABASE_KEY || this.socket) return
    this.handlers.onStatus('connecting')
    const websocketUrl = SUPABASE_URL.replace(/^http/, 'ws')
    this.socket = new WebSocket(`${websocketUrl}/realtime/v1/websocket?apikey=${encodeURIComponent(SUPABASE_KEY)}&vsn=1.0.0`)
    this.socket.onopen = () => {
      this.send('realtime:solfarm-town', 'phx_join', {
        config: {
          broadcast: { ack: false, self: false },
          presence: { enabled: true, key: this.self.id },
          postgres_changes: [],
          private: false,
        },
      }, '1')
      this.heartbeat = window.setInterval(() => this.send('phoenix', 'heartbeat', {}), 25000)
    }
    this.socket.onmessage = (event) => this.handle(JSON.parse(event.data) as RealtimeMessage)
    this.socket.onerror = () => this.handlers.onStatus('offline')
    this.socket.onclose = () => {
      this.cleanupSocket()
      this.handlers.onStatus('offline')
      this.reconnect = window.setTimeout(() => this.connect(), 3000)
    }
  }

  updateSelf(patch: Partial<TownPlayer>) {
    this.self = { ...this.self, ...patch, id: this.self.id, updatedAt: Date.now() }
    this.track()
    this.broadcast('player_move', this.self)
  }

  sendChat(author: string, text: string) {
    this.broadcast('chat', { id: crypto.randomUUID(), author, text, timestamp: Date.now() })
  }

  disconnect() {
    if (this.reconnect) window.clearTimeout(this.reconnect)
    this.reconnect = null
    this.socket?.close()
    this.cleanupSocket()
  }

  private track() {
    this.send('realtime:solfarm-town', 'presence', { type: 'presence', event: 'track', payload: this.self })
  }

  private broadcast(event: string, payload: unknown) {
    this.send('realtime:solfarm-town', 'broadcast', { type: 'broadcast', event, payload })
  }

  private send(topic: string, event: string, payload: unknown, joinRef = '1') {
    if (this.socket?.readyState !== WebSocket.OPEN) return
    this.socket.send(JSON.stringify({ topic, event, payload, ref: String(this.ref++), join_ref: joinRef }))
  }

  private handle(message: RealtimeMessage) {
    if (message.event === 'phx_reply' && message.payload?.status === 'ok') {
      this.handlers.onStatus('online')
      this.track()
      return
    }
    if (message.event === 'presence_state') {
      this.players.clear()
      for (const [key, value] of Object.entries(message.payload || {})) {
        const meta = (value as any)?.metas?.[0]
        if (meta && key !== this.self.id) this.players.set(key, { ...meta, id: key })
      }
      this.emitPlayers()
      return
    }
    if (message.event === 'presence_diff') {
      for (const key of Object.keys(message.payload?.leaves || {})) this.players.delete(key)
      for (const [key, value] of Object.entries(message.payload?.joins || {})) {
        const meta = (value as any)?.metas?.[0]
        if (meta && key !== this.self.id) this.players.set(key, { ...meta, id: key })
      }
      this.emitPlayers()
      return
    }
    const event = message.payload?.event
    const payload = message.payload?.payload
    if (message.event === 'broadcast' && event === 'player_move' && payload?.id !== this.self.id) {
      this.players.set(payload.id, payload)
      this.emitPlayers()
    }
    if (message.event === 'broadcast' && event === 'chat' && payload) this.handlers.onChat(payload)
  }

  private emitPlayers() {
    const fresh = [...this.players.values()].filter((player) => Date.now() - player.updatedAt < 60000)
    this.handlers.onPlayers(fresh)
  }

  private cleanupSocket() {
    if (this.heartbeat) window.clearInterval(this.heartbeat)
    this.heartbeat = null
    this.socket = null
  }
}

export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY)
