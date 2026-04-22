import { createClient } from '@supabase/supabase-js'

// 🔑 ВСТАВЬТЕ СВОИ КЛЮЧИ ИЗ SUPABASE (Settings → API)
const SUPABASE_URL = 'https://ybepednbzebkrnxivlpm.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InliZXBlZG5iemVia3JueGl2bHBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NTE5MjAsImV4cCI6MjA5MTMyNzkyMH0.zMva2tTNkkAoEqU_W7W3hw2ce3qD-YAUPhwzwZHi9sQ'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export const createGameRecord = async (gameId, creator, stake, timeLimit) => {
  const { data, error } = await supabase.from('games').insert({
    id: gameId, creator, challenger: null, stake, time_limit: timeLimit,
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    turn: 'w', status: 'waiting', winner: null, is_draw: false,
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

export const recordMove = async (gameId, player, from, to, san, fenAfter) => {
  const { error } = await supabase.from('moves').insert({
    game_id: gameId, player, from_sq: from, to_sq: to, san, fen_after: fenAfter,
    created_at: new Date().toISOString()
  })
  if (error) { console.error('recordMove error:', error); throw error }
  return true
}

export const subscribeToGame = (gameId, callbacks) => {
  const channel = supabase.channel(`game:${gameId}`)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'games', filter: `id=eq.${gameId}` }, payload => callbacks?.onGameUpdate?.(payload.new))
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'moves', filter: `game_id=eq.${gameId}` }, payload => callbacks?.onMove?.(payload.new))
    .subscribe()
  return () => supabase.removeChannel(channel)
}

// ✅ Тест подключения — ТОЛЬКО в консоль, НЕ В UI
export const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('games').select('id').limit(1)
    if (error) throw error
    console.log('✅ Supabase connected:', data)
    return true
  } catch (e) {
    // ❌ НЕ показываем ошибку пользователю
    console.warn('⚠️ Supabase connection warning:', e.message)
    return false
  }
}