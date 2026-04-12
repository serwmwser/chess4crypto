import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  ru: {
    translation: {
      app: {
        title: 'Chess4Crypto',
        subtitle: 'Web3 Шахматная Платформа с ИИ, PvP и Ставками в GROK',
        guestLogin: '👤 Гостевой вход',
        connectWallet: '🦊 Подключить кошелёк',
        logout: '🚪 Выйти',
        newGame: '🔄 Новая игра',
        profile: '👤 Профиль',
        availableWallets: 'Доступные кошельки:',
        yourTurn: '♟️ Ваш ход!',
        botTurn: '🤖 Бот думает...',
        checkmate: '🏁 Мат! Игра окончена.',
        draw: '🤝 Ничья!',
        timeOutYou: '⏰ Время вышло! Вы проиграли.',
        timeOutBot: '⏰ Время бота вышло! Вы победили!',
        viewHistory: '⏪/⏩ Просмотр истории',
        walletMode: '🦊 Режим кошелька (ставки GROK)',
        guestMode: '👤 Гостевой режим (игра с ботом)'
      }
    }
  },
  en: {
    translation: {
      app: {
        title: 'Chess4Crypto',
        subtitle: 'Web3 Chess Platform with AI, PvP & GROK Token Betting',
        guestLogin: '👤 Guest Login',
        connectWallet: '🦊 Connect Wallet',
        logout: '🚪 Logout',
        newGame: '🔄 New Game',
        profile: '👤 Profile',
        availableWallets: 'Available Wallets:',
        yourTurn: '♟️ Your Turn!',
        botTurn: '🤖 Bot is thinking...',
        checkmate: '🏁 Checkmate! Game Over.',
        draw: '🤝 Draw!',
        timeOutYou: '⏰ Time out! You lost.',
        timeOutBot: '⏰ Bot ran out of time! You won!',
        viewHistory: '⏪/⏩ Viewing History',
        walletMode: '🦊 Wallet Mode (GROK Betting)',
        guestMode: '👤 Guest Mode (Play vs Bot)'
      }
    }
  }
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'ru',              // Язык по умолчанию
    fallbackLng: 'en',      // Если перевода нет → берём английский
    interpolation: {
      escapeValue: false    // React уже экранирует HTML, отключаем двойное
    }
  })

export default i18n