import { useState, useEffect, useRef, useCallback } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import { useAccount, useConnect, useDisconnect, useBalance } from 'wagmi'
import { useTranslation } from 'react-i18next'

function App() {
  const { t, i18n } = useTranslation()
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const {  balance } = useBalance({ address })

  // 🎮 Состояние игры
  const gameRef = useRef(new Chess())
  const [view, setView] = useState('menu')
  const [fen, setFen] = useState(gameRef.current.fen())
  const [history, setHistory] = useState([fen])
  const [moveIndex, setMoveIndex] = useState(0)
  const [movesList, setMovesList] = useState([])
  const [isPlayerTurn, setIsPlayerTurn] = useState(true)
  const [gameOver, setGameOver] = useState(false)
  const [message, setMessage] = useState('')

  // ⏱️ Таймер
  const [timeControl, setTimeControl] = useState(5) // минуты
  const [playerTime, setPlayerTime] = useState(timeControl * 60)
  const [botTime, setBotTime] = useState(timeControl * 60)
  const [timerActive, setTimerActive] = useState(null) // 'player' | 'bot' | null

  // 🤖 Логика бота (случайный легальный ход)
  const makeBotMove = useCallback(() => {
    if (gameOver || gameRef.current.isGameOver()) return
    const moves = gameRef.current.moves()
    if (!moves.length) return
    const random = moves[Math.floor(Math.random() * moves.length)]
    gameRef.current.move(random)
    
    const newFen = gameRef.current.fen()
    setHistory(prev => [...prev, newFen])
    setMovesList(prev => [...prev, random])
    setFen(newFen)
    setMoveIndex(prev => prev + 1)
    setIsPlayerTurn(true)
    setTimerActive('player')
    
    if (gameRef.current.isCheckmate()) { setGameOver(true); setMessage('🏁 Мат! Бот победил.') }
    else if (gameRef.current.isDraw()) { setGameOver(true); setMessage('🤝 Ничья!') }
    else setMessage('♟️ Ваш ход!')
  }, [gameOver])

  // 🎯 Ход игрока
  const onDrop = (source, target) => {
    // Разрешаем ход только если: это ход игрока, игра не окончена, и мы в конце истории
    if (!isPlayerTurn || gameOver || moveIndex !== history.length - 1) return false
    try {
      const move = gameRef.current.move({ from: source, to: target, promotion: 'q' })
      if (!move) return false

      const newFen = gameRef.current.fen()
      setHistory(prev => [...prev, newFen])
      setMovesList(prev => [...prev, move.san])
      setFen(newFen)
      setMoveIndex(prev => prev + 1)
      setIsPlayerTurn(false)
      setTimerActive('bot')
      setMessage('🤖 Бот думает...')
      
      // Ход бота через 1 сек
      setTimeout(makeBotMove, 1000)
      return true
    } catch { return false }
  }

  // ⏪ Кнопка НАЗАД
  const handleBack = () => {
    if (moveIndex > 0) {
      const newIndex = moveIndex - 1
      setMoveIndex(newIndex)
      setFen(history[newIndex])
      gameRef.current.load(history[newIndex])
      setIsPlayerTurn(newIndex % 2 === 0)
      setTimerActive(null) // Пауза при просмотре
      setMessage('⏪ Просмотр истории')
    }
  }

  // ⏩ Кнопка ВПЕРЁД
  const handleForward = () => {
    if (moveIndex < history.length - 1) {
      const newIndex = moveIndex + 1
      setMoveIndex(newIndex)
      setFen(history[newIndex])
      gameRef.current.load(history[newIndex])
      setIsPlayerTurn(newIndex % 2 === 0)
      
      // Если вернулись в конец игры → возобновляем таймер
      if (newIndex === history.length - 1 && !gameOver) {
        setTimerActive(isPlayerTurn ? 'player' : 'bot')
        setMessage(isPlayerTurn ? '♟️ Ваш ход!' : '🤖 Бот думает...')
      } else {
        setMessage('⏩ Просмотр истории')
      }
    }
  }

  // 🚀 Начало игры
  const startGame = () => {
    gameRef.current.reset()
    const startFen = gameRef.current.fen()
    setFen(startFen)
    setHistory([startFen])
    setMoveIndex(0)
    setMovesList([])
    setIsPlayerTurn(true)
    setGameOver(false)
    setPlayerTime(timeControl * 60)
    setBotTime(timeControl * 60)
    setTimerActive('player')
    setMessage('♟️ Ваш ход!')
    setView('game')
  }

  // 🔹 Подключение кошелька
  const handleConnect = async () => {
    try {
      const conn = connectors.find(c => c.id === 'injected') || connectors[0]
      if (conn) await connect({ connector })
      startGame()
    } catch (err) { setMessage('⚠️ Ошибка: ' + err.message) }
  }

  // 🔹 Выход
  const handleLogout = () => {
    if (isConnected) disconnect()
    setView('menu')
  }

  // ⏱️ Таймер (эффект)
  useEffect(() => {
    if (!timerActive || gameOver) return
    const interval = setInterval(() => {
      if (timerActive === 'player') {
        setPlayerTime(prev => {
          if (prev <= 1) { setGameOver(true); setMessage('⏰ Время вышло! Вы проиграли.'); return 0 }
          return prev - 1
        })
      } else {
        setBotTime(prev => {
          if (prev <= 1) { setGameOver(true); setMessage('⏰ Время бота вышло! Вы победили.'); return 0 }
          return prev - 1
        })
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [timerActive, gameOver])

  // 🔤 Формат времени ММ:СС
  const fmtTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`

  // ============================================================================
  // 🎨 МЕНЮ ВХОДА
  // ============================================================================
  if (view === 'menu') {
    return (
      <div style={styles.screen}>
        <h1 style={styles.title}>♟️ {t('app.title')}</h1>
        <p style={styles.sub}>{t('app.subtitle')}</p>
        
        <div style={styles.controlGroup}>
          <label style={styles.label}>⏱️ Выберите контроль времени:</label>
          <select value={timeControl} onChange={e => setTimeControl(Number(e.target.value))} style={styles.select}>
            <option value={5}>5 минут</option>
            <option value={15}>15 минут</option>
            <option value={30}>30 минут</option>
            <option value={60}>1 час</option>
            <option value={1440}>24 часа</option>
          </select>
        </div>

        <div style={styles.btnGroup}>
          <button onClick={startGame} style={styles.btnPrimary}>👤 {t('app.guestLogin')}</button>
          <button onClick={handleConnect} style={styles.btnWallet}>🦊 {t('app.connectWallet')}</button>
        </div>

        <select value={i18n.language} onChange={e => i18n.changeLanguage(e.target.value)} style={styles.langSelect}>
          <option value="ru">🇷🇺 Русский</option>
          <option value="en">🇬🇧 English</option>
        </select>
      </div>
    )
  }

  // ============================================================================
  // 🎮 ИГРОВОЙ ЭКРАН
  // ============================================================================
  return (
    <div style={styles.screen}>
      {/* Верхняя панель */}
      <header style={styles.header}>
        <span style={styles.headerTitle}>♟️ Chess4Crypto</span>
        <div style={styles.headerRight}>
          {isConnected && address && <span style={styles.walletBadge}>🔗 {address.slice(0,6)}...{address.slice(-4)}</span>}
          <button onClick={handleLogout} style={styles.btnSmall}>🚪 {t('app.logout')}</button>
        </div>
      </header>

      {/* Таймеры */}
      <div style={styles.timers}>
        <div style={{...styles.timerBox, active: timerActive === 'player'}}>
          <span>👤 Вы</span>
          <span style={styles.timerText}>{fmtTime(playerTime)}</span>
        </div>
        <div style={{...styles.timerBox, active: timerActive === 'bot'}}>
          <span>🤖 Бот</span>
          <span style={styles.timerText}>{fmtTime(botTime)}</span>
        </div>
      </div>

      {/* Сообщение статуса */}
      {message && <div style={styles.statusMsg}>{message}</div>}

      {/* Шахматная доска */}
      <div style={styles.boardWrap}>
        <Chessboard position={fen} onPieceDrop={onDrop} boardOrientation="white" />
      </div>

      {/* Панель ходов */}
      <div style={styles.historyPanel}>
        <div style={styles.historyTitle}>📜 История ходов:</div>
        <div style={styles.historyList}>
          {movesList.map((m, i) => (
            <span key={i} style={{...styles.moveChip, highlight: i === moveIndex - 1}}>{i + 1}. {m}</span>
          ))}
          {movesList.length === 0 && <span style={styles.emptyHist}>Ходов пока нет...</span>}
        </div>
      </div>

      {/* Кнопки управления */}
      <div style={styles.controls}>
        <button onClick={handleBack} disabled={moveIndex === 0} style={styles.btnCtrl}>⏪ Назад</button>
        <button onClick={handleForward} disabled={moveIndex === history.length - 1} style={styles.btnCtrl}>⏩ Вперёд</button>
        <button onClick={() => window.location.hash = '#/profile'} style={styles.btnProfile}>👤 Профиль</button>
      </div>

      {/* Инфо о режиме */}
      <p style={styles.modeInfo}>
        {isConnected ? '🦊 Режим кошелька (ставки GROK)' : '👤 Гостевой режим (игра с ботом)'}
      </p>
    </div>
  )
}

// 🎨 СТИЛИ (гарантированно работают без внешних CSS)
const styles = {
  screen: { minHeight: '100vh', background: '#0b1120', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem' },
  title: { fontSize: '2rem', margin: '0.5rem 0' },
  sub: { color: '#94a3b8', marginBottom: '1.5rem', textAlign: 'center' },
  controlGroup: { background: '#1e293b', padding: '0.8rem', borderRadius: '10px', marginBottom: '1rem', width: '100%', maxWidth: '320px' },
  label: { display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#cbd5e1' },
  select: { width: '100%', padding: '0.5rem', background: '#334155', color: '#fff', border: 'none', borderRadius: '6px' },
  btnGroup: { display: 'flex', flexDirection: 'column', gap: '0.6rem', width: '100%', maxWidth: '320px', marginBottom: '1rem' },
  btnPrimary: { padding: '0.9rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' },
  btnWallet: { padding: '0.9rem', background: '#f59e0b', color: '#000', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' },
  langSelect: { marginTop: '1rem', padding: '0.4rem', background: '#334155', color: '#fff', border: '1px solid #475569', borderRadius: '8px', cursor: 'pointer' },
  
  header: { width: '100%', maxWidth: '600px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1e293b', padding: '0.6rem 1rem', borderRadius: '10px', marginBottom: '1rem' },
  headerTitle: { fontWeight: 'bold' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  walletBadge: { fontSize: '0.75rem', background: '#334155', padding: '0.2rem 0.5rem', borderRadius: '15px' },
  btnSmall: { padding: '0.3rem 0.6rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' },
  
  timers: { display: 'flex', gap: '1rem', marginBottom: '0.5rem', width: '100%', maxWidth: '360px', justifyContent: 'space-around' },
  timerBox: ({ active }) => ({ background: active ? '#059669' : '#1e293b', padding: '0.5rem 1rem', borderRadius: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', border: active ? '2px solid #34d399' : '2px solid transparent', transition: 'all 0.2s' }),
  timerText: { fontSize: '1.5rem', fontWeight: 'bold', fontFamily: 'monospace' },
  
  statusMsg: { color: '#38bdf8', textAlign: 'center', marginBottom: '0.5rem', minHeight: '1.2rem' },
  boardWrap: { width: 'min(95vw, 400px)', background: '#1e293b', padding: '0.3rem', borderRadius: '12px', marginBottom: '0.8rem' },
  
  historyPanel: { width: '100%', maxWidth: '400px', background: '#1e293b', borderRadius: '10px', padding: '0.5rem', marginBottom: '0.8rem', maxHeight: '150px', overflow: 'hidden' },
  historyTitle: { fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.3rem' },
  historyList: { display: 'flex', flexWrap: 'wrap', gap: '0.3rem', overflowY: 'auto', maxHeight: '110px', padding: '0.2rem' },
  moveChip: ({ highlight }) => ({ background: highlight ? '#3b82f6' : '#334155', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '500' }),
  emptyHist: { color: '#64748b', fontSize: '0.8rem' },
  
  controls: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '0.8rem' },
  btnCtrl: { padding: '0.5rem 0.8rem', background: '#475569', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem' },
  btnCtrl: { padding: '0.5rem 0.8rem', background: '#475569', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem' },
  btnProfile: { padding: '0.5rem 0.8rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem' },
  
  modeInfo: { color: '#64748b', fontSize: '0.8rem', textAlign: 'center', marginTop: 'auto' }
}

export default App