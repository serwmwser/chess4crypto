import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import { useAccount, useConnect, useDisconnect, useBalance } from 'wagmi'
import { useTranslation } from 'react-i18next'

// 🎨 6 ТЕМ ДОСОК И ФИГУР
const BOARD_THEMES = {
  classic: { name: '🏛️ Классика', light: '#eeeed2', dark: '#769656', pieceFilter: 'none', boardShadow: '0 4px 12px rgba(0,0,0,0.2)' },
  wood3d: { name: '🪵 3D Дерево', light: '#e8c49a', dark: '#8b6f47', pieceFilter: 'drop-shadow(2px 3px 2px rgba(0,0,0,0.4))', boardShadow: '0 10px 30px rgba(0,0,0,0.4)' },
  neon: { name: '💜 Неон', light: '#1a1a2e', dark: '#16213e', pieceFilter: 'drop-shadow(0 0 3px rgba(236,72,153,0.8))', boardShadow: '0 0 25px rgba(59,130,246,0.4)' },
  ocean: { name: '🌊 Океан', light: '#a8d8ea', dark: '#2a6f97', pieceFilter: 'drop-shadow(0 0 2px rgba(6,182,212,0.5))', boardShadow: '0 4px 20px rgba(6,182,212,0.3)' },
  sunset: { name: '🌅 Закат', light: '#ffecd2', dark: '#fcb69f', pieceFilter: 'drop-shadow(0 0 2px rgba(245,158,11,0.5))', boardShadow: '0 4px 16px rgba(239,68,68,0.3)' },
  minimal: { name: '⚪ Минимал', light: '#f0f0f0', dark: '#606060', pieceFilter: 'grayscale(0.3) contrast(1.1)', boardShadow: '0 2px 8px rgba(0,0,0,0.15)' }
}

// 🌍 Страны
const COUNTRIES = [
  { code: 'RU', name: '🇷🇺 Россия' }, { code: 'UA', name: '🇺🇦 Украина' }, { code: 'BY', name: '🇧🇾 Беларусь' },
  { code: 'KZ', name: '🇰🇿 Казахстан' }, { code: 'US', name: '🇺🇸 США' }, { code: 'GB', name: '🇬🇧 Великобритания' },
  { code: 'DE', name: '🇩🇪 Германия' }, { code: 'FR', name: '🇫🇷 Франция' }, { code: 'ES', name: '🇪🇸 Испания' },
  { code: 'IT', name: '🇮🇹 Италия' }, { code: 'CN', name: '🇨🇳 Китай' }, { code: 'JP', name: '🇯🇵 Япония' },
  { code: 'BR', name: '🇧🇷 Бразилия' }, { code: 'IN', name: '🇮🇳 Индия' }, { code: 'OTHER', name: '🌍 Другая' }
]

// 💰 Ставки для создания игры
const DEPOSIT_OPTIONS = [1000, 5000, 10000, 25000, 50000, 100000, 250000, 500000]

const isMobile = () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
const fmtTime = (s) => { const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60; return h>0 ? `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}` : `${m}:${String(sec).padStart(2,'0')}` }
const formatNumber = (n) => n.toLocaleString('ru-RU')
const getTimeLabel = (mins) => { const opts = [{v:5,l:'5 мин'}, {v:15,l:'15 мин'}, {v:30,l:'30 мин'}, {v:60,l:'1 час'}, {v:1440,l:'24 часа'}]; return opts.find(o => o.v === mins)?.l || `${mins} мин` }
const isValidUrl = (str) => { try { new URL(str); return true } catch { return false } }
const formatSocialLink = (url) => { if (!url) return ''; if (!url.startsWith('http')) return `https://${url}`; return url }
const generateGameId = () => `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

// 🗄️ Ключи для LocalStorage (Имитация Базы Данных)
const KEY_USER = 'chess4crypto_user_data'
const KEY_GAMES = 'chess4crypto_games_global'

function App() {
  const { t, i18n } = useTranslation()
  const { address, isConnected, status } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  
  const gameRef = useRef(new Chess())
  
  // 🎯 ЭКРАНЫ: menu | profile | game
  const [view, setView] = useState('menu')
  const [lobbyTab, setLobbyTab] = useState('available') // 'available' | 'my' | 'history'
  
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
  
  // 💰 Баланс и Данные Пользователя
  const [userData, setUserData] = useState({ 
    balance: 10000, // Стартовый баланс для теста
    profile: { nickname: '', country: 'RU', avatar: '', socialLink: '', bio: '' },
    gameHistory: [] // Хронология игр
  })
  
  // 🌐 Глобальный список игр (Лобби)
  const [globalGames, setGlobalGames] = useState([])
  const [createStake, setCreateStake] = useState(1000)
  const [pendingJoinGame, setPendingJoinGame] = useState(null)
  
  // 🔐 Подключение
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectAttempt, setConnectAttempt] = useState(0)

  // 📏 Адаптивный размер
  useEffect(() => {
    const updateSize = () => setBoardWidth(Math.min(window.innerWidth * 0.88, 380))
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  // 🗄️ Загрузка данных при старте
  useEffect(() => {
    // Загрузка профиля и баланса
    const storedUser = JSON.parse(localStorage.getItem(KEY_USER))
    if (storedUser && storedUser.address === address) {
      setUserData(storedUser.data)
    }

    // Загрузка игр из "Глобальной базы" (localStorage)
    const storedGames = JSON.parse(localStorage.getItem(KEY_GAMES) || '[]')
    setGlobalGames(storedGames)
  }, [address])

  // 📡 Слушаем изменения в других вкладках (для синхронизации лобби)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === KEY_GAMES) {
        setGlobalGames(JSON.parse(e.newValue || '[]'))
      }
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // 🔗 Обработка ссылки-приглашения
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const inviteId = params.get('invite')
      if (inviteId && view !== 'game') {
        const game = globalGames.find(g => g.id === inviteId)
        if (game && game.status === 'waiting') {
          setPendingJoinGame(game)
          setView('profile')
          setLobbyTab('available')
          setMessage(`🔗 Найдена игра! Внесите ${formatNumber(game.stake)} GROK для входа.`)
        }
      }
    }
  }, [globalGames, view])

  // 💾 Сохранение данных пользователя
  const saveUserData = (newData) => {
    setUserData(newData)
    if (address) {
      localStorage.setItem(KEY_USER, JSON.stringify({ address, data: newData }))
    }
  }

  // 💾 Сохранение глобального списка игр
  const saveGlobalGames = (games) => {
    setGlobalGames(games)
    localStorage.setItem(KEY_GAMES, JSON.stringify(games))
  }

  // 💰 Пополнение баланса (для теста)
  const handleDepositFunds = () => {
    const amount = 50000
    const newData = { ...userData, balance: userData.balance + amount }
    saveUserData(newData)
    setMessage(`✅ Баланс пополнен на +${formatNumber(amount)} GROK`)
  }

  // 🎮 Создание игры
  const handleCreateGame = () => {
    if (userData.balance < createStake) {
      setMessage('⚠️ Недостаточно GROK на балансе! Пополните баланс.')
      return
    }

    // Списываем ставку с баланса
    const newBalance = userData.balance - createStake
    const newUserData = { ...userData, balance: newBalance }
    saveUserData(newUserData)

    // Создаем запись игры
    const newGame = {
      id: generateGameId(),
      creator: address,
      creatorName: userData.profile.nickname || `${address.slice(0,6)}...`,
      stake: createStake,
      timeControl: timeControl,
      status: 'waiting', // waiting | playing | finished
      createdAt: Date.now(),
      winner: null
    }

    // Сохраняем в глобальный список
    const updatedGames = [...globalGames, newGame]
    saveGlobalGames(updatedGames)

    setMessage(`🎉 Игра создана! Ссылка скопирована.`)
    navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?invite=${newGame.id}`)
  }

  // 🤝 Присоединение к игре
  const handleJoinGame = (game) => {
    if (!game || game.status !== 'waiting') return
    if (userData.balance < game.stake) {
      setMessage('⚠️ Недостаточно GROK!')
      return
    }
    setPendingJoinGame(game)
    setMessage(`💰 Для входа в игру нужно внести ${formatNumber(game.stake)} GROK`)
  }

  // ✅ Подтверждение депозита и старт игры
  const confirmJoinAndStart = () => {
    const game = pendingJoinGame
    if (!game) return

    // Списываем ставку
    const newBalance = userData.balance - game.stake
    const newUserData = { ...userData, balance: newBalance }
    saveUserData(newUserData)

    // Обновляем статус игры
    const updatedGames = globalGames.map(g => 
      g.id === game.id ? { ...g, status: 'playing', challenger: address } : g
    )
    saveGlobalGames(updatedGames)

    // Запускаем игру
    setTimeControl(game.timeControl)
    setPlayerTime(game.timeControl * 60)
    setBotTime(game.timeControl * 60)
    startGame()
    setPendingJoinGame(null)
    setMessage(`🚀 Игра началась! Ставка: ${formatNumber(game.stake)} GROK`)
  }

  // 🏁 Завершение игры (Логика выплаты)
  const handleGameEnd = (result) => {
    setTimerActive(null)
    const currentGame = globalGames.find(g => g.status === 'playing' && g.creator === address) // Упрощенный поиск
    // В реальном приложении ID игры должен храниться в стейте, здесь берем последнюю активную или симулируем
    
    let prizeMessage = ''
    
    if (result === 'player') {
      setWinner('player')
      const prize = currentGame ? currentGame.stake * 2 : 0 // Победитель забирает банк (в демо симуляция)
      // В демо начисляем виртуальный выигрыш (т.к. реальный контракт не подключен)
      const winAmount = currentGame ? currentGame.stake * 2 : 0
      const newData = { 
        ...userData, 
        balance: userData.balance + winAmount,
        gameHistory: [
          { date: new Date().toLocaleString(), opponent: 'Bot/Player', result: 'WIN', stake: currentGame?.stake || 0, change: `+${winAmount}` },
          ...userData.gameHistory
        ]
      }
      saveUserData(newData)
      setMessage(`🏆 CHECKMATE! ВЫ ПОБЕДИЛИ! +${formatNumber(winAmount)} GROK`)
    } else if (result === 'bot' || result === 'loss') {
      setWinner('bot')
      const newData = {
        ...userData,
        gameHistory: [
          { date: new Date().toLocaleString(), opponent: 'Bot/Player', result: 'LOSS', stake: currentGame?.stake || 0, change: `-${currentGame?.stake || 0}` },
          ...userData.gameHistory
        ]
      }
      saveUserData(newData)
      setMessage('😔 Вы проиграли. Ставка ушла победителю.')
    } else {
      setWinner('draw')
      const newData = {
        ...userData,
        gameHistory: [
          { date: new Date().toLocaleString(), opponent: 'Bot/Player', result: 'DRAW', stake: currentGame?.stake || 0, change: `Фонд развития` },
          ...userData.gameHistory
        ]
      }
      saveUserData(newData)
      setMessage('🤝 Ничья! Средства перечислены в фонд развития приложения.')
    }

    // Обновляем статус игры в глобальном списке
    if (currentGame) {
      const updatedGames = globalGames.map(g => g.id === currentGame.id ? { ...g, status: 'finished', winner: result === 'player' ? address : (result === 'draw' ? 'draw' : 'opponent') } : g)
      saveGlobalGames(updatedGames)
    }
  }

  // 🔄 Сброс и запуск новой партии
  const startGame = () => {
    gameRef.current.reset()
    setFen(gameRef.current.fen())
    setHistory([gameRef.current.fen()])
    setMoveIndex(0)
    setMovesList([])
    setIsPlayerTurn(true)
    setGameOver(false)
    setWinner(null)
    setSelectedSquare(null)
    setPossibleMoves([])
    setPlayerTime(timeControl * 60)
    setBotTime(timeControl * 60)
    setTimerActive('player')
    setView('game')
  }

  // 🔗 Подключение кошелька
  const handleConnect = async () => {
    if (isConnecting) return
    setIsConnecting(true)
    setConnectAttempt(prev => prev + 1)
    setMessage('🔄 Подключение...')
    
    try {
      const connector = connectors.find(c => c.id === (isMobile() ? 'walletConnect' : 'metaMask')) || connectors.find(c => c.id === 'injected') || connectors[0]
      if (!connector) throw new Error('Кошелёк не найден')
      await connect({ connector, chainId: connector.chains?.[0]?.id })
      for (let i = 0; i < 10; i++) { await new Promise(r => setTimeout(r, 300)); if (isConnected) break }
      
      if (isConnected && address) {
        setMessage('✅ Кошелёк подключён!')
        setView('profile')
      } else {
        // ✅ Исправлено: Если отменили, просто молчим, не пишем ошибку
        setMessage('') 
      }
    } catch (err) {
      // ✅ Исправлено: Игнорируем ошибку отмены пользователем
      if (!err?.message?.includes('User rejected') && !err?.message?.includes('already pending')) {
        setMessage('⚠️ Ошибка подключения')
      } else {
        setMessage('')
      }
    } finally {
      setTimeout(() => setIsConnecting(false), 500)
    }
  }

  const handleGuestLogin = () => { setMessage('👤 Гостевой режим'); startGame() }
  const handleLogout = () => { disconnect(); setView('menu'); setMessage(''); gameRef.current.reset(); setFen(gameRef.current.fen()); setTimerActive(null); setPendingJoinGame(null) }

  // ♟️ Логика ходов
  const getValidMoves = useCallback((square) => gameRef.current.moves({ square, verbose: true }).map(m => m.to), [])
  const customSquareStyles = useMemo(() => {
    const styles = {}
    if (selectedSquare) styles[selectedSquare] = { backgroundColor: 'rgba(255,255,0,0.4)' }
    possibleMoves.forEach(sq => { styles[sq] = { backgroundColor: 'rgba(20,85,30,0.5)', backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.9) 25%, transparent 25%)', backgroundSize: '14px 14px', backgroundPosition: 'center' } })
    return styles
  }, [selectedSquare, possibleMoves])

  const onSquareClick = useCallback((square) => {
    if (gameOver) return
    const piece = gameRef.current.get(square)
    if (piece && piece.color === (isPlayerTurn ? 'w' : 'b')) { setSelectedSquare(square); setPossibleMoves(getValidMoves(square)); return }
    if (selectedSquare && possibleMoves.includes(square)) { onDrop(selectedSquare, square); setSelectedSquare(null); setPossibleMoves([]); return }
    setSelectedSquare(null); setPossibleMoves([])
  }, [gameOver, isPlayerTurn, selectedSquare, possibleMoves, getValidMoves])

  const onDrop = useCallback((source, target) => {
    if (!isPlayerTurn || gameOver) return false
    try {
      const move = gameRef.current.move({ from: source, to: target, promotion: 'q' }); if (!move) return false
      const newFen = gameRef.current.fen(), san = gameRef.current.history({ verbose: true }).pop()?.san || `${source}${target}`
      setHistory(prev => [...prev, newFen]); setMovesList(prev => [...prev, { san, from: source, to: target }])
      setFen(newFen); setMoveIndex(prev => prev + 1); setIsPlayerTurn(false); setTimerActive('bot'); setMessage('🤖 Бот думает...')
      setSelectedSquare(null); setPossibleMoves([])
      
      if (gameRef.current.isCheckmate()) { handleGameEnd('player'); return true }
      if (gameRef.current.isDraw()) { handleGameEnd('draw'); return true }
      
      setTimeout(makeBotMove, 600)
      return true
    } catch { return false }
  }, [isPlayerTurn, gameOver])

  const makeBotMove = useCallback(() => {
    if (gameOver || gameRef.current.isGameOver()) return
    const moves = gameRef.current.moves(); if (!moves.length) return
    const random = moves[Math.floor(Math.random() * moves.length)]; gameRef.current.move(random)
    const newFen = gameRef.current.fen(), san = gameRef.current.history({ verbose: true }).pop()?.san || random
    setHistory(prev => [...prev, newFen]); setMovesList(prev => [...prev, { san, from: random.from, to: random.to }])
    setFen(newFen); setMoveIndex(prev => prev + 1); setIsPlayerTurn(true); setTimerActive('player')
    
    if (gameRef.current.isCheckmate()) { handleGameEnd('bot'); return }
    if (gameRef.current.isDraw()) { handleGameEnd('draw'); return }
    setMessage('♟️ Ваш ход!')
  }, [gameOver])

  // ⏱️ Таймер
  useEffect(() => {
    if (!timerActive || gameOver) return
    const interval = setInterval(() => {
      if (timerActive === 'player') {
        setPlayerTime(prev => { if (prev <= 1) { handleGameEnd('bot'); return 0 } return prev - 1 })
      } else {
        setBotTime(prev => { if (prev <= 1) { handleGameEnd('player'); return 0 } return prev - 1 })
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [timerActive, gameOver])

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
          <button onClick={handleConnect} disabled={isConnecting} style={{ padding: '1rem', background: isConnecting ? '#64748b' : 'linear-gradient(135deg, #f59e0b, #d97706)', color: isConnecting ? '#94a3b8' : '#000', border: 'none', borderRadius: '12px', cursor: isConnecting ? 'not-allowed' : 'pointer', fontSize: '1.1rem', fontWeight: '600' }}>{isConnecting ? '⏳...' : (isMobile() ? '🔗' : '🦊')} {t('app.connectWallet') || 'Подключить кошелёк'}</button>
        </div>
        
        {message && <div style={{ marginTop: '1.5rem', padding: '0.8rem 1.2rem', background: message.includes('✅') ? 'rgba(16,185,129,0.2)' : message.includes('⚠️') ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.2)', borderRadius: '10px', color: message.includes('✅') ? '#34d399' : message.includes('⚠️') ? '#f87171' : '#60a5fa' }}>{message}</div>}
        <select value={i18n.language} onChange={e => i18n.changeLanguage(e.target.value)} style={{ marginTop: '2rem', padding: '0.5rem 1rem', background: '#334155', color: '#fff', border: '1px solid #475569', borderRadius: '8px', cursor: 'pointer' }}><option value="ru">🇷🇺 Русский</option><option value="en">🇬🇧 English</option></select>
      </div>
    )
  }

  // ============================================================================
  // 👤 ПРОФИЛЬ ИГРОКА (Лобби, Создание, История)
  // ============================================================================
  if (view === 'profile') {
    const displayName = userData.profile.nickname || (address ? `${address.slice(0,6)}...` : 'Гость')
    const countryName = COUNTRIES.find(c => c.code === userData.profile.country)?.name || '🌍'
    
    return (
      <div style={{ minHeight: '100vh', background: '#0f172a', color: '#f1f5f9', fontFamily: 'system-ui, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem', boxSizing: 'border-box' }}>
        
        {/* Хедер */}
        <header style={{ width: '100%', maxWidth: '500px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 1rem', background: '#1e293b', borderRadius: '12px', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            {userData.profile.avatar ? <img src={userData.profile.avatar} style={{width:40,height:40,borderRadius:'50%',objectFit:'cover'}} alt="Av"/> : <div style={{width:40,height:40,borderRadius:'50%',background:'#334155',display:'flex',alignItems:'center',justifyContent:'center'}}>👤</div>}
            <div>
              <div style={{fontWeight:'bold',fontSize:'1.1rem'}}>{displayName}</div>
              <div style={{fontSize:'0.8rem',color:'#94a3b8'}}>{countryName}</div>
            </div>
          </div>
          <div style={{display:'flex',gap:'0.5rem'}}>
             <span style={{fontSize:'0.8rem',background:'#334155',padding:'0.3rem 0.6rem',borderRadius:'8px',color:'#fbbf24'}}>💰 {formatNumber(userData.balance)}</span>
             <button onClick={handleLogout} style={{padding:'0.4rem 0.8rem',background:'#ef4444',color:'#fff',border:'none',borderRadius:'8px',cursor:'pointer'}}>🚪</button>
          </div>
        </header>

        {/* Сообщение */}
        {message && <div style={{width:'100%',maxWidth:'500px',padding:'0.8rem',marginBottom:'1rem',background:'rgba(59,130,246,0.2)',borderRadius:'10px',color:'#60a5fa',textAlign:'center',fontSize:'0.95rem'}}>{message}</div>}

        {/* Вкладки */}
        <div style={{display:'flex',gap:'0.5rem',width:'100%',maxWidth:'500px',marginBottom:'1rem'}}>
          {[
            { id: 'available', label: '🌐 Лобби' },
            { id: 'my', label: '📋 Мои игры' },
            { id: 'create', label: '➕ Создать' },
            { id: 'history', label: '🏆 История' }
          ].map(tab => (
            <button key={tab.id} onClick={() => setLobbyTab(tab.id)} style={{
              flex:1, padding:'0.6rem', background: lobbyTab === tab.id ? '#3b82f6' : '#1e293b', 
              color: lobbyTab === tab.id ? '#fff' : '#94a3b8', border:'none', borderRadius:'10px', cursor:'pointer', fontWeight: lobbyTab === tab.id ? '600' : '400'
            }}>{tab.label}</button>
          ))}
        </div>

        {/* Контент вкладок */}
        <div style={{ width: '100%', maxWidth: '500px' }}>
          
          {/* ➕ Создать игру */}
          {lobbyTab === 'create' && (
            <div style={{ background: '#1e293b', padding: '1.2rem', borderRadius: '16px', border: '2px solid #475569', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#fbbf24', marginBottom: '1rem', textAlign: 'center' }}>Создать новую игру</h3>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>💰 Ставка (GROK)</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                  {DEPOSIT_OPTIONS.map(amt => (
                    <button key={amt} onClick={() => setCreateStake(amt)} style={{
                      padding: '0.6rem 0.2rem', background: createStake === amt ? '#3b82f6' : '#0f172a',
                      color: '#fff', border: '1px solid #334155', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem'
                    }}>{formatNumber(amt)}</button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>⏱️ Время на партию</label>
                <select value={timeControl} onChange={e => setTimeControl(Number(e.target.value))} style={{ width: '100%', padding: '0.6rem', background: '#0f172a', color: '#fff', border: '1px solid #334155', borderRadius: '8px' }}>
                  {timeOptions.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                </select>
              </div>

              <div style={{ marginBottom: '1rem', padding: '0.8rem', background: '#0f172a', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.3rem' }}>
                  <span>Ваш баланс:</span>
                  <span style={{ color: userData.balance >= createStake ? '#10b981' : '#ef4444' }}>{formatNumber(userData.balance)} GROK</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span>Стоимость создания:</span>
                  <span>-{formatNumber(createStake)} GROK</span>
                </div>
              </div>

              <button onClick={handleCreateGame} disabled={userData.balance < createStake} style={{
                width: '100%', padding: '0.9rem', background: userData.balance >= createStake ? '#10b981' : '#334155',
                color: '#fff', border: 'none', borderRadius: '12px', cursor: userData.balance >= createStake ? 'pointer' : 'not-allowed',
                fontWeight: 'bold', fontSize: '1.1rem'
              }}>🎲 Создать игру</button>
              
              {userData.balance < createStake && (
                <button onClick={handleDepositFunds} style={{ width: '100%', marginTop: '0.8rem', padding: '0.7rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>💰 Пополнить баланс (Test)</button>
              )}
            </div>
          )}

          {/* 🌐 Лобби (Чужие игры) */}
          {lobbyTab === 'available' && (
            <div style={{ background: '#1e293b', padding: '1rem', borderRadius: '16px', border: '2px solid #475569' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#fbbf24', marginBottom: '1rem', textAlign: 'center' }}>Доступные игры</h3>
              {globalGames.filter(g => g.status === 'waiting' && g.creator !== address).length === 0 ? (
                <p style={{ color: '#94a3b8', textAlign: 'center' }}>Нет активных игр. Создайте свою или ждите!</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  {globalGames.filter(g => g.status === 'waiting' && g.creator !== address).map(game => (
                    <div key={game.id} style={{ background: '#0f172a', padding: '0.8rem', borderRadius: '12px', border: '1px solid #334155' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 'bold' }}>👤 {game.creatorName}</span>
                        <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>💰 {formatNumber(game.stake)} GROK</span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.8rem' }}>⏱️ {getTimeLabel(game.timeControl)}</div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => handleJoinGame(game)} style={{ flex: 1, padding: '0.6rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>🤝 Присоединиться</button>
                        <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?invite=${game.id}`); setMessage('📋 Ссылка скопирована!') }} style={{ padding: '0.6rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>🔗</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 📋 Мои игры */}
          {lobbyTab === 'my' && (
            <div style={{ background: '#1e293b', padding: '1rem', borderRadius: '16px', border: '2px solid #475569' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#fbbf24', marginBottom: '1rem', textAlign: 'center' }}>Мои созданные игры</h3>
              {globalGames.filter(g => g.creator === address).length === 0 ? (
                <p style={{ color: '#94a3b8', textAlign: 'center' }}>Вы ещё не создали игр.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  {globalGames.filter(g => g.creator === address).map(game => (
                    <div key={game.id} style={{ background: '#0f172a', padding: '0.8rem', borderRadius: '12px', border: '1px solid #334155' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>ID: {game.id.slice(-6)}</span>
                        <span style={{ 
                          fontSize: '0.8rem', padding: '0.2rem 0.6rem', borderRadius: '6px',
                          background: game.status === 'waiting' ? '#fbbf24' : game.status === 'playing' ? '#3b82f6' : '#ef4444',
                          color: game.status === 'waiting' ? '#000' : '#fff'
                        }}>{game.status === 'waiting' ? '⏳ Ожидание' : game.status === 'playing' ? '🔥 Играет' : '🏁 Завершена'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.8rem' }}>
                        <span>💰 {formatNumber(game.stake)} GROK</span>
                        <span>⏱️ {getTimeLabel(game.timeControl)}</span>
                      </div>
                      {game.status === 'waiting' && (
                        <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?invite=${game.id}`); setMessage('📋 Ссылка скопирована!') }} style={{ width: '100%', padding: '0.6rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>📤 Скопировать ссылку-приглашение</button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 🏆 История игр */}
          {lobbyTab === 'history' && (
            <div style={{ background: '#1e293b', padding: '1rem', borderRadius: '16px', border: '2px solid #475569' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#fbbf24', marginBottom: '1rem', textAlign: 'center' }}>Хронология игр</h3>
              {userData.gameHistory.length === 0 ? (
                <p style={{ color: '#94a3b8', textAlign: 'center' }}>История пуста. Сыграйте первую партию!</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {userData.gameHistory.map((h, idx) => (
                    <div key={idx} style={{ background: '#0f172a', padding: '0.8rem', borderRadius: '8px', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 'bold', color: h.result === 'WIN' ? '#10b981' : h.result === 'LOSS' ? '#ef4444' : '#94a3b8' }}>
                          {h.result === 'WIN' ? '🏆 Победа' : h.result === 'LOSS' ? '😔 Поражение' : '🤝 Ничья'}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{h.date}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.9rem' }}>Ставка: {h.stake}</div>
                        <div style={{ color: h.change.startsWith('+') ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>{h.change} GROK</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Кнопки действий */}
        <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', width: '100%', maxWidth: '500px' }}>
          <button onClick={() => startGame()} style={{ padding: '1rem', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '1.1rem', fontWeight: '600' }}>🤖 Быстрая игра с ботом</button>
        </div>

        {/* Модальное окно подтверждения депозита */}
        {pendingJoinGame && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }} onClick={() => setPendingJoinGame(null)}>
            <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '20px', maxWidth: '360px', width: '100%', border: '2px solid #475569', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 'bold', marginBottom: '1rem', color: '#fbbf24' }}>💰 Подтверждение входа</h3>
              <p style={{ color: '#e2e8f0', marginBottom: '0.5rem' }}>Игра: <strong>{pendingJoinGame.creatorName}</strong></p>
              <p style={{ color: '#e2e8f0', marginBottom: '1rem' }}>Сумма: <strong>{formatNumber(pendingJoinGame.stake)} GROK</strong></p>
              <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center' }}>
                <button onClick={() => setPendingJoinGame(null)} style={{ padding: '0.7rem 1.2rem', background: '#64748b', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}>Отмена</button>
                <button onClick={confirmJoinAndStart} style={{ padding: '0.7rem 1.2rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}>✅ Внести и играть</button>
              </div>
            </div>
          </div>
        )}

        <select value={i18n.language} onChange={e => i18n.changeLanguage(e.target.value)} style={{ marginTop: '1.5rem', padding: '0.5rem', background: '#334155', color: '#fff', border: '1px solid #475569', borderRadius: '8px', cursor: 'pointer' }}><option value="ru">🇷🇺 RU</option><option value="en">🇬🇧 EN</option></select>
      </div>
    )
  }

  // ============================================================================
  // 🎮 ИГРОВОЙ ЭКРАН
  // ============================================================================
  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#f1f5f9', fontFamily: 'system-ui, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0.8rem', boxSizing: 'border-box' }}>
      <header style={{ width: '100%', maxWidth: '420px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 1rem', background: '#1e293b', borderRadius: '12px', marginBottom: '1rem' }}>
        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#fbbf24' }}>♟️ Chess4Crypto</div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {isConnected && address && <span style={{ fontSize: '0.8rem', background: '#334155', padding: '0.3rem 0.6rem', borderRadius: '8px' }}>🔗 {address.slice(0,4)}...</span>}
          <button onClick={() => setView('profile')} style={{ padding: '0.4rem 0.8rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>👤</button>
          <button onClick={handleLogout} style={{ padding: '0.4rem 0.8rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>🚪</button>
        </div>
      </header>

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

      {message && <div style={{ color: '#38bdf8', marginBottom: '0.6rem', fontSize: '1rem', textAlign: 'center', minHeight: '1.3rem' }}>{message}</div>}

      <div style={{ width: boardWidth + 20, height: boardWidth + 20, background: '#1e293b', padding: '10px', borderRadius: '12px', boxShadow: theme.boardShadow, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', transition: 'box-shadow 0.3s ease' }}>
        <div style={{ width: '100%', height: '100%', filter: theme.pieceFilter, transition: 'filter 0.3s ease' }}>
          <Chessboard position={fen} onPieceDrop={onDrop} onSquareClick={onSquareClick} customSquareStyles={customSquareStyles} boardOrientation="white" boardWidth={boardWidth} customDarkSquareStyle={{ backgroundColor: theme.dark }} customLightSquareStyle={{ backgroundColor: theme.light }} customBoardStyle={{ borderRadius: '8px' }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button onClick={() => { setSelectedSquare(null); setPossibleMoves([]); }} style={{ padding: '0.4rem 0.7rem', background: '#475569', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>✖️</button>
        {Object.entries(BOARD_THEMES).map(([key, t]) => (
          <button key={key} onClick={() => setBoardTheme(key)} style={{ padding: '0.4rem 0.6rem', background: boardTheme === key ? '#10b981' : '#334155', color: '#fff', border: boardTheme === key ? '2px solid #fbbf24' : '1px solid #475569', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem' }}>{t.name}</button>
        ))}
        <select value={timeControl} onChange={e => { const v = Number(e.target.value); setTimeControl(v); if (view === 'game') { setPlayerTime(v*60); setBotTime(v*60) } }} style={{ padding: '0.4rem 0.6rem', background: '#334155', color: '#fff', border: '1px solid #475569', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
          {timeOptions.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
        </select>
      </div>

      {movesList.length > 0 && (
        <div style={{ background: '#1e293b', padding: '0.6rem 1rem', borderRadius: '10px', width: '100%', maxWidth: '400px', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.4rem' }}><span>📜 Ходы:</span><span style={{ background: '#334155', padding: '0.1rem 0.5rem', borderRadius: '6px' }}>{movesList.length}</span></div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', maxHeight: '60px', overflowY: 'auto' }}>{movesList.map((m, i) => <span key={i} style={{ background: i === moveIndex - 1 ? '#3b82f6' : '#334155', padding: '0.2rem 0.5rem', borderRadius: '5px', fontSize: '0.8rem' }}>{Math.floor(i/2)+1}.{i%2===0?'':'..'} {m.san}</span>)}</div>
        </div>
      )}

      {gameOver && winner && (
        <div style={{ background: 'linear-gradient(135deg, #1e293b, #7c3aed)', padding: '1.2rem', borderRadius: '16px', width: '100%', maxWidth: '400px', textAlign: 'center', marginBottom: '1rem', border: '2px solid #a78bfa' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.3rem' }}>{winner === 'player' ? '🏆' : winner === 'bot' ? '🤖' : '🤝'}</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#fbbf24', marginBottom: '0.5rem' }}>{winner === 'player' ? '🎉 ВЫ ПОБЕДИЛИ!' : winner === 'bot' ? '😔 Бот победил' : '🤝 Ничья!'}</div>
          <button onClick={() => { setView('profile'); setGameOver(false); setTimerActive(null); gameRef.current.reset(); setFen(gameRef.current.fen()); setHistory([gameRef.current.fen()]); setMoveIndex(0); setMovesList([]); setMessage('') }} style={{ padding: '0.7rem 1.5rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '1.1rem' }}>👤 В профиль</button>
        </div>
      )}
      
      <select value={i18n.language} onChange={e => i18n.changeLanguage(e.target.value)} style={{ padding: '0.4rem 0.8rem', background: '#334155', color: '#fff', border: '1px solid #475569', borderRadius: '8px', cursor: 'pointer' }}><option value="ru">🇷🇺 RU</option><option value="en">🇬🇧 EN</option></select>
    </div>
  )
}

export default App