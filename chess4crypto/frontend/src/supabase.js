// ✅ Заглушка для профилей (можно подключить Supabase позже)
const profiles = {}

export const supabase = {
  from: () => ({
    select: () => ({ or: () => ({ order: () => ({ limit: () => ({ data: [], error: null }) }) }) }),
    upsert: async (data) => { profiles[data.address] = data; return { error: null } },
  }),
}

export const createGameRecord = async () => ({ ok: true })
export const updateGameStatus = async () => ({ ok: true })
export const subscribeToGame = () => ({ unsubscribe: () => {} })

export const getProfile = async (address) => profiles[address] || null
export const updateProfile = async (address, data) => {
  profiles[address] = { ...profiles[address], ...data, address, updated_at: new Date().toISOString() }
  return true
}
export const listAvailableGames = async () => []
export const recordMove = async () => ({ ok: true })