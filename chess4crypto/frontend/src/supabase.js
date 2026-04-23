import { createClient } from '@supabase/supabase-js'

// 🔑 ВСТАВЬТЕ СВОИ КЛЮЧИ ИЗ SUPABASE (Settings → API)
const SUPABASE_URL = 'https://ybepednbzebkrnxivlpm.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InliZXBlZG5iemVia3JueGl2bHBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NTE5MjAsImV4cCI6MjA5MTMyNzkyMH0.zMva2tTNkkAoEqU_W7W3hw2ce3qD-YAUPhwzwZHi9sQ'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ✅ Создание записи игры (snake_case колонки)
export const createGameRecord = async (gameId, creator, stake, timeLimit) => {
  const { data, error } = await supabase.from('games').insert({
    id: gameId,
    creator: creator.toLowerCase(),
    challenger: null,
    stake,
    time_limit: timeLimit,
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    turn: 'w',
    status: 'waiting',
    winner: null,
    is_draw: false,
    done: false,
    cpaid: true,
    hpaid: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }).select().single()
  
  if (error) {
    console.error('createGameRecord error:', error)
    throw new Error(error.message || 'Failed to create game')
  }
  return data
}

// ✅ Обновление статуса игры
export const updateGameStatus = async (gameId, updates) => {
  const { error } = await supabase
    .from('games')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', gameId)
  
  if (error) {
    console.error('updateGameStatus error:', error)
    throw new Error(error.message || 'Failed to update game')
  }
  return true
}

// ✅ Подписка на изменения игры
export const subscribeToGame = (gameId, callbacks) => {
  const channel = supabase
    .channel(`game:${gameId}`)
    .on('postgres_changes', 
      { event: 'UPDATE', schema: 'public', table: 'games', filter: `id=eq.${gameId}` }, 
      payload => callbacks?.onGameUpdate?.(payload.new)
    )
    .on('postgres_changes', 
      { event: 'INSERT', schema: 'public', table: 'moves', filter: `game_id=eq.${gameId}` }, 
      payload => callbacks?.onMove?.(payload.new)
    )
    .subscribe()
  
  return () => supabase.removeChannel(channel)
}

// ✅ Получение профиля (используем maybeSingle для обработки отсутствия)
export const getProfile = async (address) => {
  if (!address) return null
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('address', address.toLowerCase())
    .maybeSingle() // ✅ Возвращает null если не найдено, а не ошибку
  
  if (error && error.code !== 'PGRST116') {
    console.error('getProfile error:', error)
    throw new Error(error.message || 'Failed to get profile')
  }
  return data
}

// ✅ Обновление профиля
export const updateProfile = async (address, profileData) => {
  if (!address) throw new Error('Address required')
  
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
    throw new Error(error.message || 'Failed to update profile')
  }
  return true
}

// ✅ Список доступных игр (snake_case)
export const listAvailableGames = async () => {
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .eq('status', 'waiting')
    .eq('cpaid', true)
    .eq('hpaid', false)
    .order('created_at', { ascending: false })
    .limit(20)
  
  if (error) {
    console.error('listAvailableGames error:', error)
    throw new Error(error.message || 'Failed to list games')
  }
  return data
}

// ✅ Запись хода (для синхронизации)
export const recordMove = async (gameId, player, fromSq, toSq, san, fenAfter) => {
  const { error } = await supabase.from('moves').insert({
    game_id: gameId,
    player: player.toLowerCase(),
    from_sq: fromSq,
    to_sq: toSq,
    san,
    fen_after: fenAfter,
    created_at: new Date().toISOString()
  })
  
  if (error) {
    console.error('recordMove error:', error)
    throw error
  }
  return true
}