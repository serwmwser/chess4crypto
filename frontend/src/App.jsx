import { useState, useEffect, useRef } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { useTranslation } from 'react-i18next'

// 🎨 Простые темы для доски
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
  const [view, setView] = useState('game') // Всегда показываем игру для теста
  const [fen, setFen] = useState(gameRef.current.fen())
  const [boardTheme, setBoardTheme] = useState('classic')
  const [message, setMessage] = useState('♟️ Ваш ход!')
  const [isPlayerTurn, setIsPlayerTurn] = useState(true)

  const theme = BOARD_THEMES[boardTheme]

  // 🎯 Обработка хода
  const onDrop = (source, target) => {
    try {
      const move = gameRef.current.move({ from: source, to: target, promotion: 'q' })
      if (!move) return false
      setFen(gameRef.current.fen())
      setIsPlayerTurn(false)
      setMessage('🤖 Бот думает...')
      // Простой ответ бота
      setTimeout(() => {
        const moves = gameRef.current.moves()
        if (moves.length) {
          const random = moves[Math.floor(Math.random() * moves.length)]
          gameRef.current.move(random)
          setFen(gameRef.current.fen())
          setIsPlayerTurn(true)
          setMessage('♟️ Ваш ход!')
        }
      }, 500)
      return true
    } catch { return false }
  }

  // 🔗 Подключение кошелька (упрощённое)
  const handleConnect = async () => {
    setMessage('🔄 Подключение...')
    try {
      const connector = connectors.find(c => c.id === (isMobile() ? 'walletConnect' : 'metaMask')) || connectors[0]
      if (connector) await connect({ connector })
      setMessage('✅ Подключено!')
    } catch { setMessage('⚠️ Ошибка подключения') }
  }

  // 🔄 Обновляем доску при смене темы
  useEffect(() => {
    console.log('🎨 Theme changed:', boardTheme)
  }, [boardTheme])

  // ============================================================================
  // 🎮 ИГРОВОЙ ЭКРАН (МИНИМАЛИСТИЧНЫЙ - ГАРАНТИРОВАННО РАБОТАЕТ)
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
      padding: '1rem'
    }}>
      {/* Хедер */}
      <header style={{
        width: '100%',
        maxWidth: '500px',
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
          <button onClick={handleConnect} style={{
            padding: '0.4rem 0.8rem',
            background: isConnected ? '#10b981' : '#f59e0b',
            color: isConnected ? '#fff' : '#000',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.9rem'
          }}>
            {isConnected ? '✅' : isMobile() ? '🔗' : '🦊'}
          </button>
          <button onClick={() => setView('menu')} style={{
            padding: '0.4rem 0.8rem',
            background: '#475569',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.9rem'
          }}>🏠</button>
        </div>
      </header>

      {/* Сообщение */}
      {message && (
        <div style={{
          color: '#38bdf8',
          marginBottom: '0.8rem',
          fontSize: '1rem',
          textAlign: 'center'
        }}>
          {message}
        </div>
      )}

      {/* 🎯 КОНТЕЙНЕР ДОСКИ - ЖЁСТКИЕ РАЗМЕРЫ ДЛЯ ГАРАНТИРОВАННОГО ОТОБРАЖЕНИЯ */}
      <div style={{
        width: 'min(95vw, 400px)',
        height: 'min(95vw, 400px)',
        maxWidth: '400px',
        maxHeight: '400px',
        background: '#1e293b',
        padding: '0.5rem',
        borderRadius: '12px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '1rem'
      }}>
        {/* Chessboard с явными размерами */}
        <div style={{ width: '100%', height: '100%' }}>
          <Chessboard
            position={fen}
            onPieceDrop={onDrop}
            boardOrientation="white"
            customDarkSquareStyle={{ backgroundColor: theme.dark }}
            customLightSquareStyle={{ backgroundColor: theme.light }}
            customBoardStyle={{
              borderRadius: '8px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
            }}
            // 🎯 КРИТИЧНО: явные размеры для react-chessboard
            boardWidth={'100%'}
          />
        </div>
      </div>

      {/* Выбор темы */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1rem',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        {Object.entries(BOARD_THEMES).map(([key, t]) => (
          <button
            key={key}
            onClick={() => setBoardTheme(key)}
            style={{
              padding: '0.4rem 0.8rem',
              background: boardTheme === key ? '#3b82f6' : '#334155',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}
          >
            <span style={{
              display: 'inline-block',
              width: '16px',
              height: '16px',
              borderRadius: '3px',
              background: `linear-gradient(135deg, ${t.light} 50%, ${t.dark} 50%)`
            }} />
            {key === 'wood3d' ? '🪵 3D' : '🏛️ Классика'}
          </button>
        ))}
      </div>

      {/* Язык */}
      <select
        value={i18n.language}
        onChange={e => i18n.changeLanguage(e.target.value)}
        style={{
          padding: '0.4rem 0.8rem',
          background: '#334155',
          color: '#fff',
          border: '1px solid #475569',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '0.9rem'
        }}
      >
        <option value="ru">🇷🇺 RU</option>
        <option value="en">🇬🇧 EN</option>
      </select>

      {/* Отладочная информация */}
      <details style={{
        marginTop: '1rem',
        padding: '0.8rem',
        background: '#1e293b',
        borderRadius: '8px',
        fontSize: '0.8rem',
        color: '#94a3b8',
        width: '100%',
        maxWidth: '400px'
      }}>
        <summary style={{ cursor: 'pointer', marginBottom: '0.4rem' }}>🔧 Отладка</summary>
        <div>FEN: {fen.slice(0, 50)}...</div>
        <div>Theme: {boardTheme}</div>
        <div>Connected: {isConnected ? '✅' : '❌'}</div>
        <div>Status: {status}</div>
        <button 
          onClick={() => { gameRef.current.reset(); setFen(gameRef.current.fen()); setIsPlayerTurn(true); setMessage('♟️ Ваш ход!') }}
          style={{
            marginTop: '0.5rem',
            padding: '0.3rem 0.6rem',
            background: '#ef4444',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.8rem'
          }}
        >
          🔄 Сбросить игру
        </button>
      </details>
    </div>
  )
}

export default App