import { createClient } from '@supabase/supabase-js';

// 🔑 Загружаем переменные окружения (Vite автоматически подхватывает только те, что начинаются с VITE_)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ⚠️ Проверка: если ключи не найдены, выводим предупреждение в консоль
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase ENV variables not found.');
  console.warn('Создайте файл frontend/.env.local и добавьте:');
  console.warn('VITE_SUPABASE_URL=https://ваш-проект.supabase.co');
  console.warn('VITE_SUPABASE_ANON_KEY=ваш_anon_public_key');
}

// ✅ Создаём и экспортируем клиент Supabase
// Этот клиент используется во всех компонентах (ChallengePanel, Chat и т.д.)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);