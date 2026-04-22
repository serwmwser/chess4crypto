// 🔑 ВСТАВЬТЕ СВОИ КЛЮЧИ ИЗ SUPABASE
const SUPABASE_URL = 'https://ybepednbzebkrnxivlpm.supabase.co'  // ← из Шага 3
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InliZXBlZG5iemVia3JueGl2bHBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NTE5MjAsImV4cCI6MjA5MTMyNzkyMH0.zMva2tTNkkAoEqU_W7W3hw2ce3qD-YAUPhwzwZHi9sQ'  // ← из Шага 4

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
// 🔍 Тест подключения к Supabase
export const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('games').select('id').limit(1)
    if (error) throw error
    console.log('✅ Supabase connected:', data)
    return true
  } catch (e) {
    console.error('❌ Supabase error:', e.message)
    return false
  }
}