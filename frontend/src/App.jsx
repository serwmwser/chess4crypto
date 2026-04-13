import { useState, useEffect, useRef } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { useTranslation } from 'react-i18next'

// 🎨 Темы доски
const BOARD_THEMES = {
  classic: { light: '#eeeed2', dark: '#769656' },
  wood3d: { light: '#e8c49a', dark: '#8b6f47' }
}

const isMobile = () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

function App() {
  const { t, i18n } = useTranslation()
  const { address, isConnected, status } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  
  const gameRef = useRef(new Chess())
  
  // 🎯 ВИДЫ ЭКРАНОВ: menu | game
  const [view, setView] = useState('menu') // ✅ ВОССТАНОВЛЕНО: начинаем с меню!
  
  const [fen, setFen] = useState(gameRef.current.fen())
  const [boardTheme, setBoardTheme] = useState('classic')
  const [message, setMessage] = useState('')
  const [isPlayerTurn, setIsPlayerTurn] = useState(true)
  const [boardWidth, setBoardWidth] = useState(360)
  
  // 🔐 Состояние подключения (фикс дублирующих запросов)
  const [isConnecting, setIsConnecting] = useState(false)

  // 📏 Адаптивный размер доски
  useEffect(() => {
    const updateSize = () => setBoardWidth(Math.min(window.innerWidth * 0.88, 380))
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  // 👁️ Авто-переход в игру при успешном подключении
  useEffect(() => {
    if (isConnected && view === 'menu') {
      setMessage('✅ Кошелёк подключён!')
      setTimeout(() => startGame(), 500)
    }
  }, [isConnected, view])

  // 🔐 ИСПРАВЛЕННОЕ подключение: блокировка повторных запросов
  const handleConnect = async () => {
    if (isConnecting) return // ✅ Блокируем повторные клики
    setIsConnecting(true)
    setMessage('🔄 Открываю кошелёк...')
    
    try {
      const connector = connectors.find(c => 
        c.id === (isMobile() ? 'walletConnect' : 'metaMask')
      ) || connectors[0]
      
      if (!connector) throw new Error('Кошелёк не найден')
      
      await connect({ connector })
      // Ждём завершения подключения
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      if (!isConnected) {
        setMessage('⚠️ Подключение отменено')
      }
    } catch (err) {
      console.error('Connect error:', err)
      setMessage('⚠️ ' + (err?.shortMessage || err?.message || 'Ошибка подключения'))
    } finally {
      setIsConnecting(false) // ✅ Разблокируем кнопку
    }
  }

  // 🎮 Запуск игры
  const startGame = () => {
    gameRef.current.reset()
    setFen(gameRef.current.fen())
    setIsPlayerTurn(true)
    setMessage('♟️ Ваш ход!')
    setView('game') // ✅ Переход в игру
  }

  // 👤 Гостевой вход
  const handleGuestLogin = () => {
    setMessage('👤 Гостевой режим')
    startGame()
  }

  // 🚪 Выход
  const handleLogout = () => {
    disconnect()
    setView('menu')
    setMessage('')
    gameRef.current.reset()
    setFen(gameRef.current.fen())
  }

  // ♟️ Ход игрока
  const onDrop = (source, target) => {
    try {
      const move = gameRef.current.move({ from: source, to: target, promotion: 'q' })
      if (!move) return false
      setFen(gameRef.current.fen())
      setIsPlayerTurn(false)
      setMessage('🤖 Бот думает...')
      setTimeout(() => {
        const moves = gameRef.current.moves()
        if (moves.length) {
          gameRef.current.move(moves[Math.floor(Math.random() * moves.length)])
          setFen(gameRef.current.fen())
          setIsPlayerTurn(true)
          setMessage('♟️ Ваш ход!')
        }
      }, 600)
      return true
    } catch { return false }
  }

  const theme = BOARD_THEMES[boardTheme]

  // ============================================================================
  // 🎨 МЕНЮ ВХОДА (ВОССТАНОВЛЕНО!)
  // ============================================================================
  if (view === 'menu') {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: '#f1f5f9',
        fontFamily: 'system-ui, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        textAlign: 'center'
      }}>
        {/* Логотип */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#fbbf24', margin: 0 }}>
            ♟️ Chess4Crypto
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1.1rem', marginTop: '0.5rem' }}>
            Web3 шахматы с крипто-ставками
          </p>
        </div>

        {/* Кнопки входа */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '320px' }}>
          {/* Гостевой вход */}
          <button 
            onClick={handleGuestLogin}
            style={{
              padding: '1rem',
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '1.1rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            👤 {t('app.guestLogin') || 'Гостевой вход'}
          </button>

          {/* Подключение кошелька */}
          <button 
            onClick={handleConnect}
            disabled={isConnecting}
            style={{
              padding: '1rem',
              background: isConnecting ? '#64748b' : 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: isConnecting ? '#94a3b8' : '#000',
              border: 'none',
              borderRadius: '12px',
              cursor: isConnecting ? 'not-allowed' : 'pointer',
              fontSize: '1.1rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s'
            }}
          >
            {isConnecting ? (
              <>⏳ Подключение...</>
            ) : (
              <>{isMobile() ? '🔗' : '🦊'} {t('app.connectWallet') || 'Подключить кошелёк'}</>
            )}
          </button>
        </div>

        {/* Сообщение */}
        {message && (
          <div style={{
            marginTop: '1.5rem',
            padding: '0.8rem 1.2rem',
            background: message.includes('✅') ? 'rgba(16, 185, 129, 0.2)' : 
                       message.includes('⚠️') ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)',
            borderRadius: '10px',
            color: message.includes('✅') ? '#34d399' : 
                   message.includes('⚠️') ? '#f87171' : '#60a5fa',
            fontSize: '0.95rem'
          }}>
            {message}
          </div>
        )}

        {/* Язык */}
        <select 
          value={i18n.language} 
          onChange={e => i18n.changeLanguage(e.target.value)} 
          style={{
            marginTop: '2rem',
            padding: '0.5rem 1rem',
            background: '#334155',
            color: '#fff',
            border: '1px solid #475569',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.9rem'
          }}
        >
          <option value="ru">🇷🇺 Русский</option>
          <option value="en">🇬🇧 English</option>
        </select>

        {/* Футер */}
        <p style={{
          marginTop: '2rem',
          color: '#64748b',
          fontSize: '0.8rem'
        }}>
          © 2024 Chess4Crypto • GROK Token
        </p>
      </div>
    )
  }

  // ============================================================================
  // 🎮 ИГРОВОЙ ЭКРАН
  // ============================================================================
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f172a',
      color: '#f1f5f9',
      fontFamily: 'system-ui, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '1rem',
      boxSizing: 'border-box'
    }}>
      {/* Хедер */}
      <header style={{
        width: '100%',
        maxWidth: '420px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.8rem 1rem',
        background: '#1e293b',
        borderRadius: '12px',
        marginBottom: '1rem'
      }}>
        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#fbbf24' }}>
          ♟️ Chess4Crypto
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {isConnected && address && (
            <span style={{ fontSize: '0.8rem', background: '#334155', padding: '0.3rem 0.6rem', borderRadius: '8px' }}>
              🔗 {address.slice(0,4)}...{address.slice(-4)}
            </span>
          )}
          <button onClick={handleLogout} style={{
            padding: '0.4rem 0.8rem', background: '#ef4444', color: '#fff',
            border: 'none', borderRadius: '8px', cursor: 'pointer'
          }}>🚪</button>
        </div>
      </header>

      {/* Сообщение */}
      {message && <div style={{ color: '#38bdf8', marginBottom: '0.8rem', fontSize: '1rem', textAlign: 'center' }}>{message}</div>}

      {/* 🎯 ДОСКА */}
      <div style={{
        width: boardWidth + 20,
        height: boardWidth + 20,
        background: '#1e293b',
        padding: '10px',
        borderRadius: '12px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '1rem'
      }}>
        <Chessboard
          position={fen}
          onPieceDrop={onDrop}
          boardOrientation="white"
          boardWidth={boardWidth}
          customDarkSquareStyle={{ backgroundColor: theme.dark }}
          customLightSquareStyle={{ backgroundColor: theme.light }}
        />
      </div>

      {/* Выбор темы */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        {Object.entries(BOARD_THEMES).map(([key, t]) => (
          <button key={key} onClick={() => setBoardTheme(key)} style={{
            padding: '0.4rem 0.8rem', background: boardTheme === key ? '#3b82f6' : '#334155',
            color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem',
            display: 'flex', alignItems: 'center', gap: '0.3rem'
          }}>
            <span style={{ display: 'inline-block', width: '16px', height: '16px', borderRadius: '3px', background: `linear-gradient(135deg, ${t.light} 50%, ${t.dark} 50%)` }} />
            {key === 'wood3d' ? '🪵 3D' : '🏛️ Классика'}
          </button>
        ))}
      </div>

      {/* Язык */}
      <select value={i18n.language} onChange={e => i18n.changeLanguage(e.target.value)} style={{
        padding: '0.4rem 0.8rem', background: '#334155', color: '#fff', border: '1px solid #475569', borderRadius: '8px', cursor: 'pointer'
      }}>
        <option value="ru">🇷🇺 RU</option>
        <option value="en">🇬🇧 EN</option>
      </select>

      {/* Отладка */}
      <details style={{ marginTop: '1rem', padding: '0.8rem', background: '#1e293b', borderRadius: '8px', fontSize: '0.8rem', color: '#94a3b8', width: '100%', maxWidth: '400px' }}>
        <summary style={{ cursor: 'pointer', marginBottom: '0.4rem' }}>🔧 Отладка</summary>
        <div>FEN: {fen.slice(0, 40)}...</div>
        <div>Board: {boardWidth}px</div>
        <div>View: {view}</div>
        <div>Connected: {isConnected ? '✅' : '❌'}</div>
        <button onClick={() => { gameRef.current.reset(); setFen(gameRef.current.fen()); setIsPlayerTurn(true); setMessage('♟️ Ваш ход!') }} style={{
          marginTop: '0.5rem', padding: '0.3rem 0.6rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer'
        }}>🔄 Сброс</button>
      </details>
    </div>
  )
}

export default App