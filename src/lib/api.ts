const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

type ApiEnvelope<T> = {
  ok: boolean
  data?: T
  error?: { code: string; message: string }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T | null> {
  if (!API_URL) return null
  try {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...((options.headers as Record<string, string> | undefined) || {}),
    }
    if (options.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json'
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    })
    const contentType = res.headers.get('content-type') || ''
    const payload = contentType.includes('application/json')
      ? await res.json() as ApiEnvelope<T>
      : { ok: false, error: { code: 'non_json_response', message: await res.text() } }
    if (!res.ok || !payload.ok) return null
    return payload.data ?? null
  } catch {
    return null
  }
}

function body(value: unknown): RequestInit {
  return {
    method: 'POST',
    body: JSON.stringify(value),
  }
}

export const api = {
  health: () => request<{ status: string; dbPath: string }>('/health'),
  getDatabaseStats: () => request<Record<string, number>>('/api/db'),
  getMe: () => request('/api/me'),
  createFarm: (name: string) => request('/api/farms', body({ name })),
  getVisitableFarms: () => request('/api/farms'),
  getFarmSave: (farmId = 'home') => request<unknown>(`/api/farms/${farmId}/save`),
  saveFarm: (farmId: string, save: unknown) => request(`/api/farms/${farmId}/save`, {
    method: 'PUT',
    body: JSON.stringify({ save }),
  }),
  sendFarmAction: (farmId: string, action: unknown) => request(`/api/farms/${farmId}/actions`, body(action)),
  likeFarm: (farmId: string) => request(`/api/farms/${farmId}/like`, body({})),
  signGuestbook: (farmId: string, author: string, message: string, tipCoins = 0) =>
    request(`/api/farms/${farmId}/guestbook`, body({ author, message, tipCoins })),
  getGlobalChat: () => request('/api/chat/global'),
  sendGlobalChat: (author: string, text: string) => request('/api/chat/global', body({ author, text })),
  getTownOnline: () => request('/api/town/online'),
  getMarketListings: () => request('/api/market/listings'),
  purchaseListing: (listingId: string, txSignature?: string) =>
    request('/api/market/purchase', body({ listingId, txSignature })),
  getRewardsStatus: () => request('/api/rewards/status'),
  claimReward: (questId: string, farmId: string, reward: unknown) =>
    request('/api/rewards/claim', body({ questId, farmId, reward })),
  mintFarmhouse: (payload: unknown) => request('/api/mint/farmhouse', body(payload)),
  mintItem: (payload: unknown) => request('/api/mint/item', body(payload)),
  getMyAssets: () => request('/api/assets/mine'),
}
