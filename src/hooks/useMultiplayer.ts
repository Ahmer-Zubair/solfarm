import { useEffect, useRef } from 'react'
import { SupabaseRealtime, supabaseData, supabaseConfigured } from '../lib/supabase'
import { useGameStore } from '../stores/gameStore'

export function useMultiplayer() {
  const connection = useRef<SupabaseRealtime | null>(null)
  const lastSent = useRef(0)

  useEffect(() => {
    if (!supabaseConfigured) {
      useGameStore.getState().setMultiplayerStatus('offline')
      return
    }
    const state = useGameStore.getState()
    const realtime = new SupabaseRealtime({
      onPlayers: (players) => useGameStore.getState().setRemotePlayers(players),
      onStatus: (status) => useGameStore.getState().setMultiplayerStatus(status),
      onChat: (message) => useGameStore.getState().receiveRemoteChat(message),
    }, {
      name: state.farmName,
      characterId: state.player.characterId,
      x: state.player.tileX,
      y: state.player.tileY,
      facing: state.player.facing,
      zone: state.activeFarmId === 'town' ? 'town' : 'farm',
    })
    connection.current = realtime
    realtime.connect()
    const sendChat = (event: Event) => {
      const message = (event as CustomEvent<{ author: string; text: string }>).detail
      if (message) realtime.sendChat(message.author, message.text)
    }
    window.addEventListener('solfarm:send-chat', sendChat)

    void supabaseData.listChat().then((messages) => {
      if (messages?.length) useGameStore.getState().replaceRemoteChat(messages)
    })

    const unsubscribe = useGameStore.subscribe((next, previous) => {
      const moved = next.player.tileX !== previous.player.tileX
        || next.player.tileY !== previous.player.tileY
        || next.player.facing !== previous.player.facing
      const changedZone = next.activeFarmId !== previous.activeFarmId
      const renamed = next.farmName !== previous.farmName || next.player.characterId !== previous.player.characterId
      if (!moved && !changedZone && !renamed) return
      const now = Date.now()
      if (!changedZone && !renamed && now - lastSent.current < 120) return
      lastSent.current = now
      realtime.updateSelf({
        name: next.farmName,
        characterId: next.player.characterId,
        x: next.player.tileX,
        y: next.player.tileY,
        facing: next.player.facing,
        zone: next.activeFarmId === 'town' ? 'town' : 'farm',
      })
    })

    return () => {
      unsubscribe()
      window.removeEventListener('solfarm:send-chat', sendChat)
      realtime.disconnect()
      connection.current = null
    }
  }, [])

  return connection
}
