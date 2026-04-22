import { createClient } from '@supabase/supabase-js'

// 🔑 ВСТАВЬТЕ СВОИ КЛЮЧИ ИЗ SUPABASE (Settings → API)
const SUPABASE_URL = 'https://ybepednbzebkrnxivlpm.supabase.co'  // ← из Шага 3
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InliZXBlZG5iemVia3JueGl2bHBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NTE5MjAsImV4cCI6MjA5MTMyNzkyMH0.zMva2tTNkkAoEqU_W7W3hw2ce3qD-YAUPhwzwZHi9sQ'  // ← из Шага 4

// ✅ Создаём и экспортируем клиент
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ✅ Создаём игру в БД
export const createGameRecord = async (gameId, creator, stake, timeLimit) => {
  const { data, error } = await supabase
    .from('games')
    .insert({
      id: gameId,
      creator: creator,
      challenger: null,
      stake: stake,
      time_limit: timeLimit,
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      turn: 'w',
      status: 'waiting',
      winner: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()
  
  if (error) {
    console.error('createGameRecord error:', error)
    throw error
  }
  return data
}

// ✅ Обновляем статус игры
export const updateGameStatus = async (gameId, updates) => {
  const { error } = await supabase
    .from('games')
    .update({ 
      ...updates, 
      updated_at: new Date().toISOString() 
    })
    .eq('id', gameId)
  
  if (error) {
    console.error('updateGameStatus error:', error)
    throw error
  }
  return true
}

// ✅ Записываем ход в БД
export const recordMove = async (gameId, player, from, to, san, fenAfter) => {
  const { error } = await supabase
    .from('moves')
    .insert({
      game_id: gameId,
      player: player,
      from_sq: from,
      to_sq: to,
      san: san,
      fen_after: fenAfter,
      created_at: new Date().toISOString()
    })
  
  if (error) {
    console.error('recordMove error:', error)
    throw error
  }
  return true
}

// ✅ Подписка на обновления игры (Realtime)
export const subscribeToGame = (gameId, callbacks) => {
  const channel = supabase
    .channel(`game:${gameId}`)
    .on('postgres_changes', { 
      event: 'UPDATE', 
      schema: 'public', 
      table: 'games',
      filter: `id=eq.${gameId}`
    }, payload => {
      if (callbacks?.onGameUpdate) {
        callbacks.onGameUpdate(payload.new)
      }
    })
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'moves',
      filter: `game_id=eq.${gameId}`
    }, payload => {
      if (callbacks?.onMove) {
        callbacks.onMove(payload.new)
      }
    })
    .subscribe(status => {
      console.log('Supabase subscription status:', status)
    })
  
  // Возвращаем функцию отписки
  return () => {
    supabase.removeChannel(channel)
  }
}

// ✅ Тест подключения к Supabase
export const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('games')
      .select('id')
      .limit(1)
    
    if (error) throw error
    console.log('✅ Supabase connected:', data)
    return true
  } catch (e) {
    console.error('❌ Supabase error:', e.message)
    return false
  }
}