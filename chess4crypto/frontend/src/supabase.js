import { createClient } from '@supabase/supabase-js'

// 🔑 ВСТАВЬТЕ СВОИ КЛЮЧИ ИЗ SUPABASE (Settings → API)
const SUPABASE_URL = 'https://ybepednbzebkrnxivlpm.supabase.co' // ← Замените
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InliZXBlZG5iemVia3JueGl2bHBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NTE5MjAsImV4cCI6MjA5MTMyNzkyMH0.zMva2tTNkkAoEqU_W7W3hw2ce3qD-YAUPhwzwZHi9sQ' // ← Замените

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export const createGameRecord = async (gameId, creator, stake, timeLimit) => {
  const { data, error } = await supabase.from('games').insert({
    id: gameId, creator, challenger: null, stake, time_limit: timeLimit,
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    turn: 'w', status: 'waiting', winner: null, is_draw: false, done: false,
    cPaid: true, hPaid: false, // ✅ Создатель уже внес депозит
    created_at: new Date().toISOString(), updated_at: new Date().toISOString()
  }).select().single()
  if (error) { console.error('createGameRecord error:', error); throw error }
  return data
}

export const updateGameStatus = async (gameId, updates) => {
  const { error } = await supabase.from('games').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', gameId)
  if (error) { console.error('updateGameStatus error:', error); throw error }
  return true
}

export const subscribeToGame = (gameId, callbacks) => {
  const channel = supabase.channel(`game:${gameId}`)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'games', filter: `id=eq.${gameId}` }, payload => callbacks?.onGameUpdate?.(payload.new))
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'moves', filter: `game_id=eq.${gameId}` }, payload => callbacks?.onMove?.(payload.new))
    .subscribe()
  return () => supabase.removeChannel(channel)
}