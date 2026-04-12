// ============================================================================
// CHESS4CRYPTO - Main App Component (frontend/src/App.jsx)
// ✅ Явные кнопки: Гостевой вход + Подключить кошелёк
// ============================================================================

import { useState, useEffect } from 'react'
import { useAccount, useConnect, useDisconnect, useBalance } from 'wagmi'
import { Chessboard } from 'react-chessboard'
import { Chess } from 'chess.js'
import { useTranslation } from 'react-i18next'

function App() {
  const { t, i18n } = useTranslation()
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const { data: balance } = useBalance({ address })

  const [gameMode, setGameMode] = useState('guest') // 'guest' | 'wallet'
  const [chess] = useState(() => new Chess())
  const [boardPosition, setBoardPosition] = useState(chess.fen())
  const [message, setMessage] = useState('')

  // 🔍 Лог при монтировании
  useEffect(() => {
    console.log('✅ App component mounted')
    console.log('🔗 Wagmi connected:', isConnected)
    console.log('👛 Address:', address)
    console.log('💰 Balance:', balance?.formatted)
  }, [isConnected, address, balance])

  // 🔹 Обработчик подключения кошелька
  const handleConnectWallet = async () => {
    try {
      console.log('🦊 Connect wallet clicked')
      // Подключаем первый доступный коннектор (MetaMask)
      const connector = connectors.find(c => c.id === 'injected') || connectors[0]
      if (connector) {
        await connect({ connector })
        setGameMode('wallet')
        setMessage('✅ Кошелёк подключён!')
      }
    } catch (err) {
      console.error('❌ Connect error:', err)
      setMessage('⚠️ Ошибка подключения: ' + err.message)
    }
  }

  // 🔹 Обработчик гостевого входа
  const handleGuestLogin = () => {
    console.log('👤 Guest login clicked')
    setGameMode('guest')
    setMessage('🎮 Гостевой режим активирован')
  }

  // 🔹 Обработчик выхода
  const handleLogout = () => {
    if (isConnected) disconnect()
    setGameMode('guest')
    setMessage('👋 Вы вышли')
  }

  // 🔹 Обработчик хода (для демонстрации)
  const onDrop = (sourceSquare, targetSquare) => {
    try {
      const move = chess.move({ from: sourceSquare, to: targetSquare, promotion: 'q' })
      if (move === null) return false
      setBoardPosition(chess.fen())
      return true
    } catch {
      return false
    }
  }

  // ============================================================================
  // 🎨 РЕНДЕР: Экран выбора входа (если ещё не подключены)
  // ============================================================================
  if (!isConnected && gameMode === 'guest' && !address) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        {/* Заголовок */}
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', textAlign: 'center' }}>
          ♟️ Chess4Crypto
        </h1>
        <p style={{ color: '#aaa', marginBottom: '2rem', textAlign: 'center' }}>
          Web3 Chess Platform with AI, PvP & GROK Token Betting
        </p>

        {/* Кнопки входа */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          width: '100%',
          maxWidth: '400px'
        }}>
          {/* Кнопка гостевого входа */}
          <button
            onClick={handleGuestLogin}
            style={{
              padding: '1rem 2rem',
              fontSize: '1.1rem',
              background: '#4a5568',
              color: '#fff',
              border: '2px solid #718096',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#5a6578'}
            onMouseOut={(e) => e.currentTarget.style.background = '#4a5568'}
          >
            👤 {t('app.guestLogin', 'Гостевой вход')}
          </button>

          {/* Кнопка подключения кошелька */}
          <button
            onClick={handleConnectWallet}
            style={{
              padding: '1rem 2rem',
              fontSize: '1.1rem',
              background: '#f6851b',
              color: '#fff',
              border: '2px solid #ff9f43',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              fontWeight: '600'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#ff9f43'}
            onMouseOut={(e) => e.currentTarget.style.background = '#f6851b'}
          >
            🦊 {t('app.connectWallet', 'Подключить кошелёк')}
          </button>

          {/* Доступные коннекторы (для отладки) */}
          <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.9rem', color: '#888' }}>
            <p>Доступные кошельки:</p>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              {connectors.map((c) => (
                <span key={c.id} style={{
                  padding: '0.3rem 0.8rem',
                  background: '#2d3748',
                  borderRadius: '20px',
                  fontSize: '0.8rem'
                }}>
                  {c.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Статус */}
        {message && (
          <p style={{ marginTop: '1.5rem', color: '#68d391', textAlign: 'center' }}>
            {message}
          </p>
        )}

        {/* Футер */}
        <footer style={{
          marginTop: 'auto',
          padding: '1rem',
          color: '#666',
          fontSize: '0.9rem',
          textAlign: 'center'
        }}>
          <p>🔗 Backend: {import.meta.env.VITE_WS_URL || 'not set'}</p>
          <p>🌐 Language: {i18n.language}</p>
        </footer>
      </div>
    )
  }

  // ============================================================================
  // 🎮 РЕНДЕР: Основной интерфейс (после входа)
  // ============================================================================
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      color: '#fff',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Хедер */}
      <header style={{
        padding: '1rem 2rem',
        background: 'rgba(0,0,0,0.3)',
        borderBottom: '1px solid #333',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>♟️ Chess4Crypto</h1>
        
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Статус кошелька */}
          {isConnected && address && (
            <span style={{
              padding: '0.4rem 1rem',
              background: '#2d3748',
              borderRadius: '20px',
              fontSize: '0.9rem'
            }}>
              🔗 {address.slice(0, 6)}...{address.slice(-4)}
              {balance?.formatted && ` | ${parseFloat(balance.formatted).toFixed(4)} ${balance.symbol}`}
            </span>
          )}
          
          {/* Кнопка выхода */}
          <button
            onClick={handleLogout}
            style={{
              padding: '0.5rem 1rem',
              background: '#e53e3e',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            🚪 Выйти
          </button>
          
          {/* Переключатель языка */}
          <select
            value={i18n.language}
            onChange={(e) => i18n.changeLanguage(e.target.value)}
            style={{
              padding: '0.5rem',
              background: '#2d3748',
              color: '#fff',
              border: '1px solid #4a5568',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            <option value="ru">🇷🇺 RU</option>
            <option value="en">🇬🇧 EN</option>
            <option value="es">🇪🇸 ES</option>
          </select>
        </div>
      </header>

      {/* Основной контент */}
      <main style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
        
        {/* Статус сообщения */}
        {message && (
          <div style={{
            padding: '0.8rem 1.5rem',
            background: '#2d3748',
            borderRadius: '12px',
            color: '#68d391',
            textAlign: 'center'
          }}>
            {message}
          </div>
        )}

        {/* Шахматная доска */}
        <div style={{
          width: 'min(90vw, 500px)',
          aspectRatio: '1/1',
          background: '#1a202c',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
        }}>
          <Chessboard
            position={boardPosition}
            onPieceDrop={onDrop}
            boardOrientation="white"
            customDarkSquareStyle={{ backgroundColor: '#4a5568' }}
            customLightSquareStyle={{ backgroundColor: '#e2e8f0' }}
          />
        </div>

        {/* Кнопки действий */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={() => { chess.reset(); setBoardPosition(chess.fen()); setMessage('🔄 Новая игра') }}
            style={{
              padding: '0.8rem 1.5rem',
              background: '#4299e1',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '500'
            }}
          >
            🔄 Новая игра
          </button>
          
          <button
            onClick={() => setMessage('🔍 Поиск соперника...')}
            style={{
              padding: '0.8rem 1.5rem',
              background: '#9f7aea',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '500'
            }}
          >
            ⚔️ Найти соперника
          </button>
          
          <button
            onClick={() => window.location.href = '/profile'}
            style={{
              padding: '0.8rem 1.5rem',
              background: '#38a169',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '500'
            }}
          >
            👤 Профиль
          </button>
        </div>

        {/* Информация о режиме */}
        <div style={{
          padding: '1rem',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '12px',
          textAlign: 'center',
          maxWidth: '500px'
        }}>
          <p style={{ margin: 0, fontSize: '0.95rem' }}>
            {gameMode === 'guest' 
              ? '🎮 Гостевой режим: играйте без подключения кошелька' 
              : '🦊 Режим кошелька: делайте ставки в GROK токенах'}
          </p>
        </div>
      </main>

      {/* Футер */}
      <footer style={{
        padding: '1.5rem 2rem',
        textAlign: 'center',
        color: '#666',
        fontSize: '0.9rem',
        borderTop: '1px solid #333',
        marginTop: 'auto'
      }}>
        <p>♟️ Chess4Crypto © 2026 | Web3 Chess with GROK Betting</p>
        <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#888' }}>
          Backend: {import.meta.env.VITE_WS_URL || 'not configured'}
        </p>
      </footer>
    </div>
  )
}

export default App