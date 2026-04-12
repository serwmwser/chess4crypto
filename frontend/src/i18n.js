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
        newGame: '🔄 Новая игра',
        findOpponent: '⚔️ Найти соперника',
        profile: '👤 Профиль',
        logout: '🚪 Выйти',
        guestMode: 'Гостевой режим: игра с ботом',
        walletMode: 'Режим кошелька: ставки в GROK',
        availableWallets: 'Доступные кошельки:',
        yourTurn: '♟️ Ваш ход!',
        botTurn: '🤖 Бот думает...',
        checkmate: '🏁 Мат! Игра окончена.',
        draw: '🤝 Ничья!'
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
        newGame: '🔄 New Game',
        findOpponent: '⚔️ Find Opponent',
        profile: '👤 Profile',
        logout: '🚪 Logout',
        guestMode: 'Guest Mode: Play vs Bot',
        walletMode: 'Wallet Mode: Bet in GROK',
        availableWallets: 'Available Wallets:',
        yourTurn: '♟️ Your Turn!',
        botTurn: '🤖 Bot is thinking...',
        checkmate: '🏁 Checkmate! Game Over.',
        draw: '🤝 Draw!'
      }
    }
  }
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'ru',
    fallbackLng: 'en',
    interpolation: { escapeValue: false }
  })

export default i18n