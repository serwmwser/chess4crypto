// ✅ Заглушка для Supabase (можно подключить позже)
// Если не используете — функции просто возвращают пустые значения

export const supabase = {
  from: () => ({
    select: () => ({ or: () => ({ order: () => ({ limit: () => ({ data: [], error: null }) }) }) }),
  }),
}

export const createGameRecord = async () => ({ ok: true })
export const updateGameStatus = async () => ({ ok: true })
export const subscribeToGame = () => ({ unsubscribe: () => {} })
export const getProfile = async () => null
export const updateProfile = async () => true
export const listAvailableGames = async () => []
export const recordMove = async () => ({ ok: true })