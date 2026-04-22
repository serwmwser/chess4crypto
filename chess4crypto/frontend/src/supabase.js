import { createClient } from '@supabase/supabase-js'

// 🔑 ВСТАВЬТЕ СВОИ КЛЮЧИ ИЗ SUPABASE (Settings → API)
const SUPABASE_URL = 'https://ybepednbzebkrnxivlpm.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InliZXBlZG5iemVia3JueGl2bHBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NTE5MjAsImV4cCI6MjA5MTMyNzkyMH0.zMva2tTNkkAoEqU_W7W3hw2ce3qD-YAUPhwzwZHi9sQ'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export const createGameRecord = async (gameId, creator, stake, timeLimit) => {
  const { data, error } = await supabase.from('games').insert({
    id: gameId, creator, challenger: null, stake, time_limit: timeLimit,
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    turn: 'w', status: 'waiting', winner: null, is_draw: false, done: false,
    cpaid: true, hpaid: false,  // ✅ snake_case для Supabase REST
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

export const getProfile = async (address) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('address', address.toLowerCase())
    .single()
  if (error && error.code !== 'PGRST116') {
    console.error('getProfile error:', error)
    throw error
  }
  return data
}

export const updateProfile = async (address, profileData) => {
  const { error } = await supabase
    .from('profiles')
    .upsert({
      address: address.toLowerCase(),
      avatar_url: profileData.avatar,
      display_name: profileData.name,
      bio: profileData.bio,
      website: profileData.website,
      social: profileData.social,
      updated_at: new Date().toISOString()
    }, { onConflict: 'address' })
  if (error) {
    console.error('updateProfile error:', error)
    throw error
  }
  return true
}

export const listAvailableGames = async () => {
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .eq('status', 'waiting')
    .eq('cpaid', true)    // ✅ snake_case
    .eq('hpaid', false)   // ✅ snake_case
    .order('created_at', { ascending: false })
    .limit(20)
  if (error) {
    console.error('listAvailableGames error:', error)
    throw error
  }
  return data
}