// Заглушка для локального тестирования
const profiles = {}
const games = []

export const supabase = {
  from: (table) => ({
    select: () => ({
      or: () => ({
        order: () => ({
          limit: () => ({ data: [], error: null })
        })
      })
    }),
    upsert: async (data) => {
      if (table === 'profiles') profiles[data.address] = data
      return { error: null }
    }
  })
}

export const createGameRecord = async (id, creator, stake, time) => {
  console.log('DB: Game created', id)
  return { ok: true }
}

export const updateGameStatus = async (id, status) => {
  console.log('DB: Game status updated', id, status)
  return { ok: true }
}

export const subscribeToGame = (id, callbacks) => {
  console.log('DB: Subscribed to game', id)
  return { unsubscribe: () => {} }
}

export const getProfile = async (address) => profiles[address] || null
export const updateProfile = async (address, data) => {
  profiles[address] = { ...profiles[address], ...data, address }
  return true
}
export const listAvailableGames = async () => []
export const recordMove = async () => ({ ok: true })