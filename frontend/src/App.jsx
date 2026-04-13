import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { useTranslation } from 'react-i18next'

// 🎨 6 ТЕМ ДОСОК И ФИГУР
const BOARD_THEMES = {
  classic: { 
    name: '🏛️ Классика', 
    light: '#eeeed2', 
    dark: '#769656',
    pieceFilter: 'none',
    boardShadow: '0 4px 12px rgba(0,0,0,0.2)'
  },
  wood3d: { 
    name: '🪵 3D Дерево', 
    light: '#e8c49a', 
    dark: '#8b6f47',
    pieceFilter: 'drop-shadow(2px 3px 2px rgba(0,0,0,0.4))',
    boardShadow: '0 10px 30px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.3)'
  },
  neon: { 
    name: '💜 Неон', 
    light: '#1a1a2e', 
    dark: '#16213e',
    pieceFilter: 'drop-shadow(0 0 3px rgba(236,72,153,0.8))',
    boardShadow: '0 0 25px rgba(59,130,246,0.4)'
  },
  ocean: { 
    name: '🌊 Океан', 
    light: '#a8d8ea', 
    dark: '#2a6f97',
    pieceFilter: 'drop-shadow(0 0 2px rgba(6,182,212,0.5))',
    boardShadow: '0 4px 20px rgba(6,182,212,0.3)'
  },
  sunset: { 
    name: '🌅 Закат', 
    light: '#ffecd2', 
    dark: '#fcb69f',
    pieceFilter: 'drop-shadow(0 0 2px rgba(245,158,11,0.5))',
    boardShadow: '0 4px 16px rgba(239,68,68,0.3)'
  },
  minimal: { 
    name: '⚪ Минимал', 
    light: '#f0f0f0', 
    dark: '#606060',
    pieceFilter: 'grayscale(0.3) contrast(1.1)',
    boardShadow: '0 2px 8px rgba(0,0,0,0.15)'
  }
}

const isMobile = () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
const fmtTime = (s) => { const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60; return h>0 ? `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}` : `${m}:${String(sec).padStart(2,'0')}` }

function App() {
  const { t, i18n } = useTranslation()
  const { address, isConnected, status } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  
  const gameRef = useRef(new Chess())
  const [view, setView] = useState('menu')
  
  // 🎮 Состояние игры
  const [fen, setFen] = useState(gameRef.current.fen())
  const [history, setHistory] = useState([gameRef.current.fen()])
  const [moveIndex, setMoveIndex] = useState(0)
  const [movesList, setMovesList] = useState([])
  const [isPlayerTurn, setIsPlayerTurn] = useState(true)
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState(null)
  const [message, setMessage] = useState('')
  
  // ⏱️ Таймер
  const [timeControl, setTimeControl] = useState(5)
  const [playerTime, setPlayerTime] = useState(5 * 60)
  const [botTime, setBotTime] = useState(5 * 60)
  const [timerActive, setTimerActive] = useState(null)
  
  // 🎨 Тема и ходы
  const [boardTheme, setBoardTheme] = useState('classic')
  const [selectedSquare, setSelectedSquare] = useState(null)
  const [possibleMoves, setPossibleMoves] = useState([])
  const [boardWidth, setBoardWidth] = useState(360)
  
  // 🔐 Подключение (ИСПРАВЛЕНО: защита от дублей)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectAttempt, setConnectAttempt] = useState(0)

  // 📏 Адаптивный размер
  useEffect(() => {
    const updateSize = () => setBoardWidth(Math.min(window.innerWidth * 0.88, 380))
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  // 🎨 Подсветка ходов
  const customSquareStyles = useMemo(() => {
    const styles = {}
    if (selectedSquare) styles[selectedSquare] = { backgroundColor: 'rgba(255,255,0,0.4)' }
    possibleMoves.forEach(sq => { 
      styles[sq] = { 
        backgroundColor: 'rgba(20,85,30,0.5)', 
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.9) 25%, transparent 25%)',
        backgroundSize: '14px 14px', 
        backgroundPosition: 'center' 
      } 
    })
    return styles
  }, [selectedSquare, possibleMoves])

  const getValidMoves = useCallback((square) => gameRef.current.moves({ square, verbose: true }).map(m => m.to), [])
  
  const onSquareClick = useCallback((square) => {
    if (gameOver) return
    const piece = gameRef.current.get(square)
    if (piece && piece.color === (isPlayerTurn ? 'w' : 'b')) { setSelectedSquare(square); setPossibleMoves(getValidMoves(square)); return }
    if (selectedSquare && possibleMoves.includes(square)) { onDrop(selectedSquare, square); setSelectedSquare(null); setPossibleMoves([]); return }
    setSelectedSquare(null); setPossibleMoves([])
  }, [gameOver, isPlayerTurn, selectedSquare, possibleMoves, getValidMoves])

  const onDrop = useCallback((source, target) => {
    if (!isPlayerTurn || gameOver || moveIndex !== history.length - 1) return false
    try {
      const move = gameRef.current.move({ from: source, to: target, promotion: 'q' }); if (!move) return false
      const newFen = gameRef.current.fen(), san = gameRef.current.history({ verbose: true }).pop()?.san || `${source}${target}`
      setHistory(prev => [...prev, newFen]); setMovesList(prev => [...prev, { san, from: source, to: target }])
      setFen(newFen); setMoveIndex(prev => prev + 1); setIsPlayerTurn(false); setTimerActive('bot'); setMessage('🤖 Бот думает...')
      setSelectedSquare(null); setPossibleMoves([])
      if (gameRef.current.isCheckmate()) { setGameOver(true); setWinner('player'); setMessage('🎉 Вы победили!'); setTimerActive(null) }
      else if (gameRef.current.isDraw()) { setGameOver(true); setWinner('draw'); setMessage('🤝 Ничья!'); setTimerActive(null) }
      else setTimeout(makeBotMove, 500)
      return true
    } catch { return false }
  }, [isPlayerTurn, gameOver, moveIndex, history.length])

  const makeBotMove = useCallback(() => {
    if (gameOver || gameRef.current.isGameOver()) return
    const moves = gameRef.current.moves(); if (!moves.length) return
    const random = moves[Math.floor(Math.random() * moves.length)]; gameRef.current.move(random)
    const newFen = gameRef.current.fen(), san = gameRef.current.history({ verbose: true }).pop()?.san || random
    setHistory(prev => [...prev, newFen]); setMovesList(prev => [...prev, { san, from: random.from, to: random.to }])
    setFen(newFen); setMoveIndex(prev => prev + 1); setIsPlayerTurn(true); setTimerActive('player')
    if (gameRef.current.isCheckmate()) { setGameOver(true); setWinner('bot'); setMessage('😔 Бот победил'); setTimerActive(null) }
    else if (gameRef.current.isDraw()) { setGameOver(true); setWinner('draw'); setMessage('🤝 Ничья!'); setTimerActive(null) }
    else setMessage('♟️ Ваш ход!')
  }, [gameOver])

  // ⏱️ Таймер игры
  useEffect(() => {
    if (!timerActive || gameOver) return
    const interval = setInterval(() => {
      if (timerActive === 'player') {
        setPlayerTime(prev => { if (prev <= 1) { setGameOver(true); setWinner('bot'); setMessage('⏰ Время вышло!'); setTimerActive(null); return 0 } return prev - 1 })
      } else {
        setBotTime(prev => { if (prev <= 1) { setGameOver(true); setWinner('player'); setMessage('⏰ Бот просрочил!'); setTimerActive(null); return 0 } return prev - 1 })
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [timerActive, gameOver])

  // 🔗 ИСПРАВЛЕННОЕ подключение кошелька (защита от "already pending")
  const handleConnect = async () => {
    // ✅ Блокируем повторные вызовы
    if (isConnecting) {
      console.log('⏳ Connect already in progress')
      return
    }
    
    // ✅ Сбрасываем статус при новой попытке
    setIsConnecting(true)
    setConnectAttempt(prev => prev + 1)
    setMessage('🔄 Открываю кошелёк...')
    
    try {
      // 📱 Мобильные → WalletConnect | 💻 ПК → MetaMask
      const connector = connectors.find(c => 
        c.id === (isMobile() ? 'walletConnect' : 'metaMask')
      ) || connectors.find(c => c.id === 'injected') || connectors[0]
      
      if (!connector) throw new Error('Кошелёк не найден. Установите MetaMask или Trust Wallet.')
      
      console.log('🔗 Connecting with:', connector.id)
      
      // ✅ Вызываем connect с уникальным ключом для избежания кэширования
      await connect({ connector, chainId: connector.chains?.[0]?.id })
      
      // ✅ Ждём завершения подключения (дольше для надёжности)
      for (let i = 0; i < 10; i++) {
        await new Promise(resolve => setTimeout(resolve, 300))
        if (isConnected) break
      }
      
      if (isConnected && address) {
        setMessage('✅ Кошелёк подключён!')
        setTimeout(() => startGame(), 400)
      } else {
        // ✅ Проверяем, не отменил ли пользователь
        if (status === 'disconnected') {
          setMessage('⚠️ Подключение отменено')
        } else {
          setMessage('⏳ Ожидание подтверждения...')
          // Даём ещё время
          setTimeout(() => {
            if (!isConnected) setMessage('⚠️ Не удалось подключиться. Попробуйте ещё раз.')
          }, 3000)
        }
      }
    } catch (err) {
      console.error('❌ Connect error:', err)
      // ✅ Обрабатываем специфичные ошибки MetaMask
      if (err?.message?.includes('already pending')) {
        setMessage('⏳ MetaMask уже открыт. Подтвердите запрос в расширении.')
      } else if (err?.message?.includes('User rejected')) {
        setMessage('⚠️ Вы отменили подключение')
      } else {
        setMessage('⚠️ Ошибка: ' + (err?.shortMessage || err?.message || 'Неизвестная'))
      }
    } finally {
      // ✅ Разблокируем кнопку через небольшую задержку
      setTimeout(() => setIsConnecting(false), 500)
    }
  }

  // 👁️ Авто-переход при успешном подключении
  useEffect(() => {
    if (isConnected && address && view === 'menu' && !isConnecting) {
      setMessage('✅ Кошелёк подключён!')
      setTimeout(() => startGame(), 300)
    }
  }, [isConnected, address, view, isConnecting])

  // 🎮 Запуск игры
  const startGame = () => {
    gameRef.current.reset()
    const startFen = gameRef.current.fen()
    setFen(startFen); setHistory([startFen]); setMoveIndex(0); setMovesList([])
    setIsPlayerTurn(true); setGameOver(false); setWinner(null)
    setSelectedSquare(null); setPossibleMoves([])
    setPlayerTime(timeControl * 60); setBotTime(timeControl * 60); setTimerActive('player')
    setMessage('♟️ Ваш ход!'); setView('game')
  }

  const handleGuestLogin = () => { setMessage('👤 Гостевой режим'); startGame() }
  const handleLogout = () => { disconnect(); setView('menu'); setMessage(''); gameRef.current.reset(); setFen(gameRef.current.fen()); setTimerActive(null) }
  
  const handleBack = () => { if (moveIndex > 0 && !gameOver) { const i = moveIndex - 1; setMoveIndex(i); setFen(history[i]); gameRef.current.load(history[i]); setIsPlayerTurn(i % 2 === 0); setTimerActive(null); setMessage('⏪ Ход ' + (i+1)) } }
  const handleForward = () => { if (moveIndex < history.length - 1 && !gameOver) { const i = moveIndex + 1; setMoveIndex(i); setFen(history[i]); gameRef.current.load(history[i]); setIsPlayerTurn(i % 2 === 0); if (i === history.length - 1) { setTimerActive(isPlayerTurn ? 'player' : 'bot'); setMessage(isPlayerTurn ? '♟️ Ваш ход!' : '🤖 Бот думает...') } else setMessage('⏩ Ход ' + (i+1)) } }

  const theme = BOARD_THEMES[boardTheme]
  const timeOptions = [{v:5,l:'5 мин'}, {v:15,l:'15 мин'}, {v:30,l:'30 мин'}, {v:60,l:'1 час'}, {v:1440,l:'24 часа'}]

  // ============================================================================
  // 🎨 МЕНЮ ВХОДА
  // ============================================================================
  if (view === 'menu') {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a, #1e293b)', color: '#f1f5f9', fontFamily: 'system-ui, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#fbbf24', margin: '0 0 0.5rem 0' }}>♟️ Chess4Crypto</h1>
        <p style={{ color: '#94a3b8', fontSize: '1.1rem', marginBottom: '2rem' }}>Web3 шахматы с крипто-ставками</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '320px' }}>
          <button onClick={handleGuestLogin} style={{ padding: '1rem', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '1.1rem', fontWeight: '600' }}>👤 {t('app.guestLogin') || 'Гостевой вход'}</button>
          <button onClick={handleConnect} disabled={isConnecting} style={{ 
            padding: '1rem', 
            background: isConnecting ? '#64748b' : 'linear-gradient(135deg, #f59e0b, #d97706)', 
            color: isConnecting ? '#94a3b8' : '#000', 
            border: 'none', 
            borderRadius: '12px', 
            cursor: isConnecting ? 'not-allowed' : 'pointer', 
            fontSize: '1.1rem', 
            fontWeight: '600',
            opacity: isConnecting ? 0.7 : 1,
            transition: 'all 0.2s'
          }}>
            {isConnecting ? '⏳ Подключение...' : (isMobile() ? '🔗' : '🦊')} {t('app.connectWallet') || 'Подключить кошелёк'}
          </button>
        </div>
        
        {message && <div style={{ marginTop: '1.5rem', padding: '0.8rem 1.2rem', background: message.includes('✅') ? 'rgba(16,185,129,0.2)' : message.includes('⚠️') ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.2)', borderRadius: '10px', color: message.includes('✅') ? '#34d399' : message.includes('⚠️') ? '#f87171' : '#60a5fa', fontSize: '0.95rem' }}>{message}</div>}
        
        <select value={i18n.language} onChange={e => i18n.changeLanguage(e.target.value)} style={{ marginTop: '2rem', padding: '0.5rem 1rem', background: '#334155', color: '#fff', border: '1px solid #475569', borderRadius: '8px', cursor: 'pointer' }}><option value="ru">🇷🇺 Русский</option><option value="en">🇬🇧 English</option></select>
        <p style={{ marginTop: '2rem', color: '#64748b', fontSize: '0.8rem' }}>© 2024 Chess4Crypto</p>
      </div>
    )
  }

  // ============================================================================
  // 🎮 ИГРОВОЙ ЭКРАН (с 6 темами досок и фигур)
  // ============================================================================
  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#f1f5f9', fontFamily: 'system-ui, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0.8rem', boxSizing: 'border-box' }}>
      
      {/* Хедер */}
      <header style={{ width: '100%', maxWidth: '420px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 1rem', background: '#1e293b', borderRadius: '12px', marginBottom: '1rem' }}>
        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#fbbf24' }}>♟️ Chess4Crypto</div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {isConnected && address && <span style={{ fontSize: '0.8rem', background: '#334155', padding: '0.3rem 0.6rem', borderRadius: '8px' }}>🔗 {address.slice(0,4)}...{address.slice(-4)}</span>}
          <button onClick={handleLogout} style={{ padding: '0.4rem 0.8rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>🚪</button>
        </div>
      </header>

      {/* ⏱️ Таймеры */}
      <div style={{ display: 'flex', justifyContent: 'space-around', width: '100%', maxWidth: '400px', marginBottom: '0.8rem' }}>
        <div style={{ background: timerActive === 'player' && !gameOver ? '#059669' : '#1e293b', padding: '0.6rem 1.2rem', borderRadius: '10px', textAlign: 'center', border: timerActive === 'player' && !gameOver ? '2px solid #34d399' : '2px solid transparent' }}>
          <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>👤 Вы</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 'bold', fontFamily: 'monospace' }}>{fmtTime(playerTime)}</div>
        </div>
        <div style={{ background: timerActive === 'bot' && !gameOver ? '#059669' : '#1e293b', padding: '0.6rem 1.2rem', borderRadius: '10px', textAlign: 'center', border: timerActive === 'bot' && !gameOver ? '2px solid #34d399' : '2px solid transparent' }}>
          <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>🤖 Бот</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 'bold', fontFamily: 'monospace' }}>{fmtTime(botTime)}</div>
        </div>
      </div>

      {/* Сообщение */}
      {message && <div style={{ color: '#38bdf8', marginBottom: '0.6rem', fontSize: '1rem', textAlign: 'center', minHeight: '1.3rem' }}>{message}</div>}

      {/* 🎯 КОНТЕЙНЕР ДОСКИ с применённой темой */}
      <div style={{ 
        width: boardWidth + 20, 
        height: boardWidth + 20, 
        background: '#1e293b', 
        padding: '10px', 
        borderRadius: '12px', 
        boxShadow: theme.boardShadow,
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        marginBottom: '1rem',
        transition: 'box-shadow 0.3s ease'
      }}>
        <div style={{ 
          width: '100%', 
          height: '100%',
          filter: theme.pieceFilter,
          transition: 'filter 0.3s ease'
        }}>
          <Chessboard 
            position={fen} 
            onPieceDrop={onDrop} 
            onSquareClick={onSquareClick} 
            customSquareStyles={customSquareStyles} 
            boardOrientation="white" 
            boardWidth={boardWidth} 
            customDarkSquareStyle={{ backgroundColor: theme.dark }} 
            customLightSquareStyle={{ backgroundColor: theme.light }}
            customBoardStyle={{ borderRadius: '8px' }}
          />
        </div>
      </div>

      {/* 🎛️ Панель управления: 6 тем + навигация + время */}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        {/* ⏪⏩ Навигация */}
        <button onClick={() => { setSelectedSquare(null); setPossibleMoves([]); }} style={{ padding: '0.4rem 0.7rem', background: '#475569', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>✖️</button>
        <button onClick={handleBack} disabled={moveIndex === 0 || gameOver} style={{ padding: '0.4rem 0.7rem', background: moveIndex === 0 || gameOver ? '#334155' : '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: moveIndex === 0 || gameOver ? 'not-allowed' : 'pointer', fontSize: '0.85rem' }}>⏪</button>
        <button onClick={handleForward} disabled={moveIndex === history.length - 1 || gameOver} style={{ padding: '0.4rem 0.7rem', background: moveIndex === history.length - 1 || gameOver ? '#334155' : '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: moveIndex === history.length - 1 || gameOver ? 'not-allowed' : 'pointer', fontSize: '0.85rem' }}>⏩</button>
        
        {/* 🎨 6 ТЕМ ДОСОК И ФИГУР */}
        {Object.entries(BOARD_THEMES).map(([key, t]) => (
          <button 
            key={key} 
            onClick={() => setBoardTheme(key)} 
            title={t.name}
            style={{ 
              padding: '0.4rem 0.6rem', 
              background: boardTheme === key ? '#10b981' : '#334155', 
              color: '#fff', 
              border: boardTheme === key ? '2px solid #fbbf24' : '1px solid #475569',
              borderRadius: '8px', 
              cursor: 'pointer', 
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.2rem',
              transition: 'all 0.2s'
            }}
          >
            <span style={{ 
              display: 'inline-block', 
              width: '14px', 
              height: '14px', 
              borderRadius: '3px', 
              background: `linear-gradient(135deg, ${t.light} 50%, ${t.dark} 50%)`,
              border: '1px solid #475569'
            }} />
            {key === 'classic' && '🏛️'}
            {key === 'wood3d' && '🪵'}
            {key === 'neon' && '💜'}
            {key === 'ocean' && '🌊'}
            {key === 'sunset' && '🌅'}
            {key === 'minimal' && '⚪'}
          </button>
        ))}
        
        {/* ⏱️ Выбор времени */}
        <select value={timeControl} onChange={e => { const v = Number(e.target.value); setTimeControl(v); if (view === 'game') { setPlayerTime(v*60); setBotTime(v*60) } }} style={{ padding: '0.4rem 0.6rem', background: '#334155', color: '#fff', border: '1px solid #475569', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
          {timeOptions.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
        </select>
      </div>

      {/* 📜 История ходов */}
      {movesList.length > 0 && (
        <div style={{ background: '#1e293b', padding: '0.6rem 1rem', borderRadius: '10px', width: '100%', maxWidth: '400px', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.4rem' }}>
            <span>📜 Ходы:</span>
            <span style={{ background: '#334155', padding: '0.1rem 0.5rem', borderRadius: '6px' }}>{movesList.length}</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', maxHeight: '60px', overflowY: 'auto' }}>
            {movesList.map((m, i) => <span key={i} style={{ background: i === moveIndex - 1 ? '#3b82f6' : '#334155', padding: '0.2rem 0.5rem', borderRadius: '5px', fontSize: '0.8rem' }}>{Math.floor(i/2)+1}.{i%2===0?'':'..'} {m.san}</span>)}
          </div>
        </div>
      )}

      {/* 🏁 Баннер конца игры */}
      {gameOver && winner && (
        <div style={{ background: 'linear-gradient(135deg, #1e293b, #7c3aed)', padding: '1rem', borderRadius: '16px', width: '100%', maxWidth: '400px', textAlign: 'center', marginBottom: '1rem', border: '2px solid #a78bfa' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.3rem' }}>{winner === 'player' ? '🏆' : winner === 'bot' ? '🤖' : '🤝'}</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#fbbf24', marginBottom: '0.5rem' }}>{winner === 'player' ? '🎉 Вы победили!' : winner === 'bot' ? '😔 Бот победил' : '🤝 Ничья!'}</div>
          <button onClick={() => { setView('menu'); setGameOver(false); setTimerActive(null); gameRef.current.reset(); setFen(gameRef.current.fen()); setHistory([gameRef.current.fen()]); setMoveIndex(0); setMovesList([]); setMessage('') }} style={{ padding: '0.6rem 1.5rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}>🔄 Новая игра</button>
        </div>
      )}

      {/* Язык */}
      <select value={i18n.language} onChange={e => i18n.changeLanguage(e.target.value)} style={{ padding: '0.4rem 0.8rem', background: '#334155', color: '#fff', border: '1px solid #475569', borderRadius: '8px', cursor: 'pointer' }}><option value="ru">🇷🇺 RU</option><option value="en">🇬🇧 EN</option></select>

      {/* Отладка */}
      <details style={{ marginTop: '1rem', padding: '0.8rem', background: '#1e293b', borderRadius: '8px', fontSize: '0.8rem', color: '#94a3b8', width: '100%', maxWidth: '400px' }}>
        <summary style={{ cursor: 'pointer', marginBottom: '0.4rem' }}>🔧 Отладка</summary>
        <div>FEN: {fen.slice(0, 40)}...</div>
        <div>Board: {boardWidth}px | Theme: {boardTheme}</div>
        <div>Time: {timeControl}min | Move: {moveIndex}/{history.length-1}</div>
        <div>Timer: {timerActive || 'off'} | Connected: {isConnected ? '✅' : '❌'}</div>
        <div>Connect attempts: {connectAttempt}</div>
        <button onClick={() => { gameRef.current.reset(); setFen(gameRef.current.fen()); setHistory([gameRef.current.fen()]); setMoveIndex(0); setMovesList([]); setIsPlayerTurn(true); setGameOver(false); setWinner(null); setTimerActive('player'); setPlayerTime(timeControl*60); setBotTime(timeControl*60); setMessage('♟️ Ваш ход!') }} style={{ marginTop: '0.5rem', padding: '0.3rem 0.6rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>🔄 Сброс</button>
      </details>
    </div>
  )
}

export default App