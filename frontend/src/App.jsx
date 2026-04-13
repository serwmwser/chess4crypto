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

// 💰 Доступные ставки для создания игры
const DEPOSIT_OPTIONS = [1000, 5000, 10000, 25000, 50000, 100000, 250000, 500000]

const isMobile = () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
const fmtTime = (s) => { const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60; return h>0 ? `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}` : `${m}:${String(sec).padStart(2,'0')}` }
const formatNumber = (n) => n.toLocaleString('ru-RU')
const getTimeLabel = (mins) => { const opts = [{v:5,l:'5 мин'}, {v:15,l:'15 мин'}, {v:30,l:'30 мин'}, {v:60,l:'1 час'}, {v:1440,l:'24 часа'}]; return opts.find(o => o.v === mins)?.l || `${mins} мин` }
const isValidUrl = (str) => { try { new URL(str); return true } catch { return false } }
const formatSocialLink = (url) => { if (!url) return ''; if (!url.startsWith('http')) return `https://${url}`; return url }
const generateGameId = () => `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

function App() {
  const { t, i18n } = useTranslation()
  const { address, isConnected, status } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const {  balance: walletBalance } = useBalance({ address })
  
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
  
  // 💰 Баланс и депозиты
  const [gameBalance, setGameBalance] = useState(0)
  const [pendingDeposit, setPendingDeposit] = useState(null)
  const [createStake, setCreateStake] = useState(1000)
  
  // 🔗 Приглашения и лобби
  const [inviteData, setInviteData] = useState(null)
  const [showDepositConfirm, setShowDepositConfirm] = useState(false)
  const [selectedGameToJoin, setSelectedGameToJoin] = useState(null)
  const [lobbyTab, setLobbyTab] = useState('available') // 'available' | 'my'
  
  // 🌐 Список игр (локально для демо)
  const [gamesList, setGamesList] = useState([])
  
  // 🔐 Подключение
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectAttempt, setConnectAttempt] = useState(0)
  
  // 👤 ПРОФИЛЬ ИГРОКА
  const [playerProfile, setPlayerProfile] = useState(() => {
    if (typeof window !== 'undefined' && address) {
      const saved = localStorage.getItem(`chess4crypto_profile_${address}`)
      return saved ? JSON.parse(saved) : { nickname: '', country: 'RU', avatar: '', socialLink: '', bio: '' }
    }
    return { nickname: '', country: 'RU', avatar: '', socialLink: '', bio: '' }
  })
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState(playerProfile)
  const [avatarPreview, setAvatarPreview] = useState('')

  // 📏 Адаптивный размер
  useEffect(() => {
    const updateSize = () => setBoardWidth(Math.min(window.innerWidth * 0.88, 380))
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  // 👤 Загрузка профиля
  useEffect(() => {
    if (address) {
      const saved = localStorage.getItem(`chess4crypto_profile_${address}`)
      if (saved) { const p = JSON.parse(saved); setPlayerProfile(p); setProfileForm(p); if (p.avatar) setAvatarPreview(p.avatar) }
    }
  }, [address])

  // 🌐 Загрузка списка игр
  useEffect(() => {
    if (address) {
      // Загружаем мои игры из localStorage
      const myGames = JSON.parse(localStorage.getItem(`chess4crypto_my_games_${address}`) || '[]')
      // Загружаем доступные игры (все игры минус мои)
      const allGames = JSON.parse(localStorage.getItem('chess4crypto_all_games') || '[]')
      const available = allGames.filter(g => g.creator !== address && !g.joined && !g.finished)
      setGamesList({ my: myGames, available })
    }
  }, [address])

  // 👤 Сохранение профиля
  const saveProfile = () => {
    if (!address) return
    const updated = { ...profileForm, avatar: avatarPreview || profileForm.avatar }
    setPlayerProfile(updated)
    localStorage.setItem(`chess4crypto_profile_${address}`, JSON.stringify(updated))
    setIsEditingProfile(false)
    setMessage('✅ Профиль сохранён!')
  }

  // 🖼️ Загрузка аватара
  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { setMessage('⚠️ Файл > 2MB'); return }
    if (!file.type.startsWith('image/')) { setMessage('⚠️ Только изображения'); return }
    const reader = new FileReader()
    reader.onload = (event) => { setAvatarPreview(event.target?.result); setProfileForm(prev => ({ ...prev, avatar: event.target?.result })) }
    reader.readAsDataURL(file)
  }

  // 🎨 Подсветка ходов
  const customSquareStyles = useMemo(() => {
    const styles = {}
    if (selectedSquare) styles[selectedSquare] = { backgroundColor: 'rgba(255,255,0,0.4)' }
    possibleMoves.forEach(sq => { styles[sq] = { backgroundColor: 'rgba(20,85,30,0.5)', backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.9) 25%, transparent 25%)', backgroundSize: '14px 14px', backgroundPosition: 'center' } })
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
      if (gameRef.current.isCheckmate()) { setGameOver(true); setWinner('player'); handleGameEnd('player'); }
      else if (gameRef.current.isDraw()) { setGameOver(true); setWinner('draw'); handleGameEnd('draw'); }
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
    if (gameRef.current.isCheckmate()) { setGameOver(true); setWinner('bot'); handleGameEnd('bot'); }
    else if (gameRef.current.isDraw()) { setGameOver(true); setWinner('draw'); handleGameEnd('draw'); }
    else setMessage('♟️ Ваш ход!')
  }, [gameOver])

  // ⏱️ Таймер
  useEffect(() => {
    if (!timerActive || gameOver) return
    const interval = setInterval(() => {
      if (timerActive === 'player') {
        setPlayerTime(prev => { if (prev <= 1) { setGameOver(true); setWinner('bot'); handleGameEnd('bot'); return 0 } return prev - 1 })
      } else {
        setBotTime(prev => { if (prev <= 1) { setGameOver(true); setWinner('player'); handleGameEnd('player'); return 0 } return prev - 1 })
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [timerActive, gameOver])

  // 🏁 Обработка конца игры (выплата приза)
  const handleGameEnd = (result) => {
    setTimerActive(null)
    if (result === 'player') {
      setMessage(`🎉 Вы победили! +${formatNumber(gameBalance)} GROK зачислено!`)
      // 🔹 В ПРОДАКШЕНЕ: вызов смарт-контракта claimPrize()
      // 🔹 ДЛЯ ДЕМО: симуляция зачисления
      setTimeout(() => { setMessage('✅ Приз зачислен на ваш баланс!') }, 1500)
    } else if (result === 'bot') {
      setMessage('😔 Бот победил. Попробуйте ещё раз!')
    } else {
      setMessage('🤝 Ничья! Средства направлены на развитие приложения.')
      // 🔹 В ПРОДАКШЕНЕ: перевод в фонд развития
      setTimeout(() => { setGameBalance(0) }, 1000)
    }
  }

  // 🔗 Подключение кошелька → Профиль (исправлено сообщение)
  const handleConnect = async () => {
    if (isConnecting) return
    setIsConnecting(true)
    setConnectAttempt(prev => prev + 1)
    setMessage('🔄 Открываю кошелёк...')
    
    try {
      const connector = connectors.find(c => c.id === (isMobile() ? 'walletConnect' : 'metaMask')) || connectors.find(c => c.id === 'injected') || connectors[0]
      if (!connector) throw new Error('Кошелёк не найден')
      await connect({ connector, chainId: connector.chains?.[0]?.id })
      for (let i = 0; i < 10; i++) { await new Promise(r => setTimeout(r, 300)); if (isConnected) break }
      
      if (isConnected && address) {
        // ✅ ИСПРАВЛЕНО: не показываем "Подключение отменено" при успехе
        setMessage('✅ Кошелёк подключён!')
        setView('profile')
      }
      // ✅ ИСПРАВЛЕНО: если отменили — просто очищаем сообщение, не показываем ошибку
      else if (status === 'disconnected') {
        setMessage('') // ← Было: '⚠️ Подключение отменено'
      }
    } catch (err) {
      console.error('❌ Connect error:', err)
      if (!err?.message?.includes('User rejected')) {
        setMessage('⚠️ Ошибка: ' + (err?.shortMessage || err?.message || 'Неизвестная'))
      }
      // Если отменили — не показываем сообщение вообще
    } finally {
      setTimeout(() => setIsConnecting(false), 500)
    }
  }

  // 👁️ Авто-переход в профиль при подключении
  useEffect(() => {
    if (isConnected && address && view === 'menu') { setView('profile'); setMessage('✅ Добро пожаловать!') }
  }, [isConnected, address, view])

  // 🔗 Обработка приглашения
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const invite = params.get('invite'), stake = params.get('stake'), time = params.get('time')
      if (invite) {
        setInviteData({ gameId: invite, stake: stake ? Number(stake) : 1000, timeControl: time ? Number(time) : 15 })
        if (isConnected) { setShowDepositConfirm(true); setMessage(`💰 Внесите ${formatNumber(stake?Number(stake):1000)} GROK`) }
        else { setMessage('🔗 Найдено приглашение! Подключите кошелёк.') }
      }
    }
  }, [isConnected])

  // 💰 Создание игры
  const handleCreateGame = async () => {
    if (!isConnected || !address) { setMessage('⚠️ Подключите кошелёк'); return }
    if (createStake > (walletBalance?.value ? Number(walletBalance.value) / 1e18 : 0)) { setMessage('⚠️ Недостаточно GROK на балансе'); return }
    
    const gameId = generateGameId()
    const newGame = {
      id: gameId,
      creator: address,
      creatorName: playerProfile.nickname || `${address.slice(0,6)}...${address.slice(-4)}`,
      stake: createStake,
      timeControl,
      createdAt: Date.now(),
      status: 'waiting',
      joined: false,
      finished: false
    }
    
    // 🔹 Сохраняем в localStorage (для демо)
    const myGames = JSON.parse(localStorage.getItem(`chess4crypto_my_games_${address}`) || '[]')
    const allGames = JSON.parse(localStorage.getItem('chess4crypto_all_games') || '[]')
    myGames.push(newGame); allGames.push(newGame)
    localStorage.setItem(`chess4crypto_my_games_${address}`, JSON.stringify(myGames))
    localStorage.setItem('chess4crypto_all_games', JSON.stringify(allGames))
    
    // Обновляем список
    setGamesList(prev => ({ ...prev, my: [...prev.my, newGame] }))
    
    // Генерируем ссылку
    const link = `${window.location.origin}${window.location.pathname}?invite=${gameId}&stake=${createStake}&time=${timeControl}`
    setMessage(`🎉 Игра создана! Скопируйте ссылку: ${link}`)
    
    // 🔹 В ПРОДАКШЕНЕ: вызов контракта createGame() + депозит
  }

  // 💰 Присоединение к игре
  const handleJoinGame = (game) => {
    if (!isConnected) { setMessage('⚠️ Подключите кошелёк'); return }
    setSelectedGameToJoin(game)
    setShowDepositConfirm(true)
    setMessage(`💰 Внесите ${formatNumber(game.stake)} GROK для входа`)
  }

  // 💰 Подтверждение депозита
  const handleConfirmDeposit = async () => {
    const game = selectedGameToJoin || inviteData
    if (!game) return
    setShowDepositConfirm(false); setPendingDeposit(game.stake); setMessage(`🔄 Вносим ${formatNumber(game.stake)} GROK...`)
    
    try {
      // 🔹 ДЛЯ ДЕМО: симуляция
      await new Promise(resolve => setTimeout(resolve, 1500))
      setGameBalance(prev => prev + game.stake)
      setPendingDeposit(null); setMessage(`✅ ${formatNumber(game.stake)} GROK внесено! Игра начинается...`)
      
      // Обновляем статус игры
      if (selectedGameToJoin) {
        const allGames = JSON.parse(localStorage.getItem('chess4crypto_all_games') || '[]')
        const updated = allGames.map(g => g.id === game.id ? { ...g, joined: true, status: 'playing', challenger: address } : g)
        localStorage.setItem('chess4crypto_all_games', JSON.stringify(updated))
        setGamesList(prev => ({ ...prev, available: prev.available.filter(g => g.id !== game.id) }))
      }
      
      // Запускаем игру
      setTimeControl(game.timeControl); setPlayerTime(game.timeControl * 60); setBotTime(game.timeControl * 60)
      startGame(); setSelectedGameToJoin(null); setInviteData(null)
    } catch (err) {
      console.error('Deposit error:', err); setMessage('⚠️ Ошибка депозита'); setPendingDeposit(null); setShowDepositConfirm(true)
    }
  }

  // 🎮 Запуск игры
  const startGame = () => {
    gameRef.current.reset(); const startFen = gameRef.current.fen()
    setFen(startFen); setHistory([startFen]); setMoveIndex(0); setMovesList([]); setIsPlayerTurn(true); setGameOver(false); setWinner(null)
    setSelectedSquare(null); setPossibleMoves([]); setPlayerTime(timeControl * 60); setBotTime(timeControl * 60); setTimerActive('player')
    setMessage('♟️ Ваш ход!'); setView('game')
  }

  const handleGuestLogin = () => { setMessage('👤 Гостевой режим'); startGame() }
  const handleLogout = () => { disconnect(); setView('menu'); setMessage(''); gameRef.current.reset(); setFen(gameRef.current.fen()); setTimerActive(null); setInviteData(null); setShowDepositConfirm(false) }
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
          <button onClick={handleConnect} disabled={isConnecting} style={{ padding: '1rem', background: isConnecting ? '#64748b' : 'linear-gradient(135deg, #f59e0b, #d97706)', color: isConnecting ? '#94a3b8' : '#000', border: 'none', borderRadius: '12px', cursor: isConnecting ? 'not-allowed' : 'pointer', fontSize: '1.1rem', fontWeight: '600' }}>{isConnecting ? '⏳...' : (isMobile() ? '🔗' : '🦊')} {t('app.connectWallet') || 'Подключить кошелёк'}</button>
        </div>
        {message && <div style={{ marginTop: '1.5rem', padding: '0.8rem 1.2rem', background: message.includes('✅') ? 'rgba(16,185,129,0.2)' : message.includes('⚠️') ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.2)', borderRadius: '10px', color: message.includes('✅') ? '#34d399' : message.includes('⚠️') ? '#f87171' : '#60a5fa' }}>{message}</div>}
        <select value={i18n.language} onChange={e => i18n.changeLanguage(e.target.value)} style={{ marginTop: '2rem', padding: '0.5rem 1rem', background: '#334155', color: '#fff', border: '1px solid #475569', borderRadius: '8px', cursor: 'pointer' }}><option value="ru">🇷🇺 Русский</option><option value="en">🇬🇧 English</option></select>
        <p style={{ marginTop: '2rem', color: '#64748b', fontSize: '0.8rem' }}>© 2024 Chess4Crypto</p>
      </div>
    )
  }

  // ============================================================================
  // 👤 ПРОФИЛЬ ИГРОКА (с лобби, правилами, созданием игр)
  // ============================================================================
  if (view === 'profile') {
    const displayName = playerProfile.nickname || (address ? `${address.slice(0,6)}...${address.slice(-4)}` : 'Гость')
    const countryName = COUNTRIES.find(c => c.code === playerProfile.country)?.name || '🌍 Не указана'
    const socialIcon = playerProfile.socialLink?.includes('t.me') ? '✈️' : playerProfile.socialLink?.includes('twitter') ? '🐦' : playerProfile.socialLink?.includes('discord') ? '💬' : playerProfile.socialLink?.includes('github') ? '🐙' : '🔗'

    return (
      <div style={{ minHeight: '100vh', background: '#0f172a', color: '#f1f5f9', fontFamily: 'system-ui, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem', boxSizing: 'border-box' }}>
        
        {/* Хедер */}
        <header style={{ width: '100%', maxWidth: '480px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 1rem', background: '#1e293b', borderRadius: '12px', marginBottom: '1rem' }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#fbbf24' }}>👤 Профиль</div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {isConnected && address && <span style={{ fontSize: '0.8rem', background: '#334155', padding: '0.3rem 0.6rem', borderRadius: '8px' }}>🔗 {address.slice(0,4)}...{address.slice(-4)}</span>}
            <button onClick={handleLogout} style={{ padding: '0.4rem 0.8rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>🚪</button>
          </div>
        </header>

        {/* 👤 Карточка профиля */}
        <div style={{ background: 'linear-gradient(135deg, #1e293b, #334155)', padding: '1.2rem', borderRadius: '20px', width: '100%', maxWidth: '480px', marginBottom: '1rem', border: '2px solid #475569' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            {isEditingProfile ? (
              <label style={{ cursor: 'pointer', position: 'relative' }}>
                {avatarPreview ? <img src={avatarPreview} alt="Avatar" style={{ width: '70px', height: '70px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #fbbf24' }} /> : <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', border: '3px solid #64748b' }}>👤</div>}
                <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
                <span style={{ position: 'absolute', bottom: '0', right: '0', background: '#3b82f6', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem' }}>✏️</span>
              </label>
            ) : (
              <div>{playerProfile.avatar ? <img src={playerProfile.avatar} alt="Avatar" style={{ width: '70px', height: '70px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #fbbf24' }} /> : <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', border: '3px solid #64748b' }}>👤</div>}</div>
            )}
            <div style={{ flex: 1 }}>
              {isEditingProfile ? (
                <>
                  <input value={profileForm.nickname} onChange={e => setProfileForm({...profileForm, nickname: e.target.value.slice(0,20)})} placeholder="Ваш ник" style={{ width: '100%', padding: '0.4rem', background: '#0f172a', color: '#fff', border: '1px solid #475569', borderRadius: '6px', fontSize: '1rem', marginBottom: '0.3rem' }} />
                  <select value={profileForm.country} onChange={e => setProfileForm({...profileForm, country: e.target.value})} style={{ width: '100%', padding: '0.3rem', background: '#0f172a', color: '#fff', border: '1px solid #475569', borderRadius: '6px', fontSize: '0.85rem' }}>{COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}</select>
                </>
              ) : (
                <>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#fbbf24', margin: '0.1rem 0' }}>{displayName}</h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>{countryName}</p>
                </>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '0.6rem' }}>
            {isEditingProfile ? (
              <>
                <button onClick={saveProfile} style={{ padding: '0.4rem 1rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem' }}>💾 Сохранить</button>
                <button onClick={() => { setIsEditingProfile(false); setProfileForm(playerProfile); setAvatarPreview(playerProfile.avatar) }} style={{ padding: '0.4rem 0.8rem', background: '#64748b', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>✖️</button>
              </>
            ) : (
              <button onClick={() => { setIsEditingProfile(true); setProfileForm(playerProfile) }} style={{ padding: '0.35rem 0.9rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>✏️ Редактировать</button>
            )}
          </div>
          {!isEditingProfile && (playerProfile.socialLink || playerProfile.bio) && (
            <div style={{ borderTop: '1px solid #334155', paddingTop: '0.6rem' }}>
              {playerProfile.socialLink && <a href={formatSocialLink(playerProfile.socialLink)} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#60a5fa', fontSize: '0.8rem', textDecoration: 'none', marginBottom: '0.2rem' }}>{socialIcon} {playerProfile.socialLink.replace(/^https?:\/\//, '').slice(0, 30)}{playerProfile.socialLink.length > 30 ? '...' : ''}</a>}
              {playerProfile.bio && <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0.2rem 0 0 0', lineHeight: '1.3' }}>{playerProfile.bio}</p>}
            </div>
          )}
          {isEditingProfile && (
            <div style={{ borderTop: '1px solid #334155', paddingTop: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <input value={profileForm.socialLink} onChange={e => setProfileForm({...profileForm, socialLink: e.target.value})} placeholder="https://t.me/ник" style={{ width: '100%', padding: '0.5rem', background: '#0f172a', color: '#fff', border: '1px solid #475569', borderRadius: '6px', fontSize: '0.85rem' }} />
              <textarea value={profileForm.bio} onChange={e => setProfileForm({...profileForm, bio: e.target.value.slice(0,150)})} placeholder="О себе..." style={{ width: '100%', padding: '0.5rem', background: '#0f172a', color: '#fff', border: '1px solid #475569', borderRadius: '6px', fontSize: '0.85rem', minHeight: '40px', resize: 'vertical' }} maxLength={150} />
            </div>
          )}
        </div>

        {/* 💰 Баланс */}
        <div style={{ background: 'linear-gradient(135deg, #1e293b, #334155)', padding: '0.9rem', borderRadius: '16px', width: '100%', maxWidth: '480px', marginBottom: '1rem', textAlign: 'center', border: '2px solid #475569' }}>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.2rem' }}>🎮 Баланс игры</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fbbf24' }}>{formatNumber(gameBalance)} <span style={{fontSize:'0.9rem'}}>GROK</span></div>
        </div>

        {/* 📜 ПРАВИЛА ИГРЫ (обязательно опубликованы) */}
        <div style={{ background: '#1e293b', padding: '1rem', borderRadius: '16px', width: '100%', maxWidth: '480px', marginBottom: '1rem', border: '1px solid #475569' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 'bold', color: '#fbbf24', margin: '0 0 0.6rem 0', textAlign: 'center' }}>📋 Правила крипто-ставок</h4>
          <ul style={{ fontSize: '0.85rem', color: '#cbd5e1', margin: 0, paddingLeft: '1.2rem', lineHeight: '1.5' }}>
            <li>Создайте игру, внеся ставку: 1000–500 000 GROK</li>
            <li>Игра отображается онлайн для всех игроков</li>
            <li>Присоединиться может любой, внеся <strong>равную сумму</strong></li>
            <li>🏆 <strong>Победитель</strong> получает <strong>весь пул</strong> (ставка × 2)</li>
            <li>🤝 При <strong>ничьей</strong> средства направляются на <strong>развитие приложения</strong></li>
            <li>Все транзакции защищены смарт-контрактом</li>
          </ul>
        </div>

        {/* 🔗 Вкладки лобби */}
        <div style={{ display: 'flex', gap: '0.4rem', width: '100%', maxWidth: '480px', marginBottom: '0.8rem' }}>
          <button onClick={() => setLobbyTab('available')} style={{ flex: 1, padding: '0.6rem', background: lobbyTab === 'available' ? '#3b82f6' : '#1e293b', color: lobbyTab === 'available' ? '#fff' : '#e2e8f0', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: lobbyTab === 'available' ? '600' : '400' }}>🌐 Доступные игры</button>
          <button onClick={() => setLobbyTab('my')} style={{ flex: 1, padding: '0.6rem', background: lobbyTab === 'my' ? '#3b82f6' : '#1e293b', color: lobbyTab === 'my' ? '#fff' : '#e2e8f0', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: lobbyTab === 'my' ? '600' : '400' }}>📋 Мои игры</button>
        </div>

        {/* 🌐 Доступные игры (созданные другими) */}
        {lobbyTab === 'available' && (
          <div style={{ background: '#1e293b', padding: '1rem', borderRadius: '16px', width: '100%', maxWidth: '480px', marginBottom: '1rem', border: '2px solid #475569' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#fbbf24', marginBottom: '0.8rem', textAlign: 'center' }}>🌐 Игры других игроков</h3>
            {gamesList.available?.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', textAlign: 'center' }}>Пока нет доступных игр. Создайте свою или подождите!</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', maxHeight: '250px', overflowY: 'auto' }}>
                {gamesList.available.map(game => (
                  <div key={game.id} style={{ background: '#0f172a', padding: '0.8rem', borderRadius: '12px', border: '1px solid #334155' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#e2e8f0' }}>{game.creatorName || 'Аноним'}</span>
                      <span style={{ fontSize: '0.85rem', color: '#fbbf24', fontWeight: '600' }}>💰 {formatNumber(game.stake)} GROK</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                      <span>⏱️ {getTimeLabel(game.timeControl)}</span>
                      <span>🕐 {new Date(game.createdAt).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</span>
                    </div>
                    <button onClick={() => handleJoinGame(game)} style={{ width: '100%', padding: '0.5rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem' }}>🤝 Присоединиться</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 📋 Мои созданные игры */}
        {lobbyTab === 'my' && (
          <div style={{ background: '#1e293b', padding: '1rem', borderRadius: '16px', width: '100%', maxWidth: '480px', marginBottom: '1rem', border: '2px solid #475569' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#fbbf24', marginBottom: '0.8rem', textAlign: 'center' }}>📋 Мои игры</h3>
            {gamesList.my?.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', textAlign: 'center' }}>Вы ещё не создали игр. Нажмите "➕ Создать" ниже!</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', maxHeight: '250px', overflowY: 'auto' }}>
                {gamesList.my.map(game => (
                  <div key={game.id} style={{ background: '#0f172a', padding: '0.8rem', borderRadius: '12px', border: '1px solid #334155' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>🎮 {game.id.slice(-10)}</span>
                      <span style={{ fontSize: '0.8rem', color: game.status === 'waiting' ? '#fbbf24' : '#34d399' }}>{game.status === 'waiting' ? '⏳ Ожидание' : '🎮 В игре'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                      <span>💰 {formatNumber(game.stake)} GROK</span>
                      <span>⏱️ {getTimeLabel(game.timeControl)}</span>
                    </div>
                    {game.status === 'waiting' && (
                      <button onClick={() => { const link = `${window.location.origin}${window.location.pathname}?invite=${game.id}&stake=${game.stake}&time=${game.timeControl}`; navigator.clipboard.writeText(link); setMessage('📋 Ссылка скопирована!') }} style={{ width: '100%', padding: '0.5rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem' }}>📤 Скопировать ссылку</button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ➕ Создать игру */}
        <div style={{ background: '#1e293b', padding: '1rem', borderRadius: '16px', width: '100%', maxWidth: '480px', marginBottom: '1rem', border: '2px solid #475569' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#fbbf24', marginBottom: '0.8rem', textAlign: 'center' }}>➕ Создать новую игру</h3>
          <div style={{ marginBottom: '0.8rem' }}>
            <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.9rem', color: '#94a3b8' }}>Ставка (GROK)</label>
            <select value={createStake} onChange={e => setCreateStake(Number(e.target.value))} style={{ width: '100%', padding: '0.5rem', background: '#0f172a', color: '#fff', border: '1px solid #475569', borderRadius: '8px', fontSize: '0.95rem' }}>
              {DEPOSIT_OPTIONS.map(amt => <option key={amt} value={amt}>{formatNumber(amt)} GROK</option>)}
            </select>
          </div>
          <div style={{ marginBottom: '0.8rem' }}>
            <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.9rem', color: '#94a3b8' }}>Время на партию</label>
            <select value={timeControl} onChange={e => setTimeControl(Number(e.target.value))} style={{ width: '100%', padding: '0.5rem', background: '#0f172a', color: '#fff', border: '1px solid #475569', borderRadius: '8px', fontSize: '0.95rem' }}>
              {timeOptions.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
          </div>
          <button onClick={handleCreateGame} disabled={!isConnected} style={{ width: '100%', padding: '0.8rem', background: isConnected ? '#3b82f6' : '#475569', color: '#fff', border: 'none', borderRadius: '12px', cursor: isConnected ? 'pointer' : 'not-allowed', fontWeight: '600', fontSize: '1rem' }}>🎲 Создать игру</button>
          {!isConnected && <p style={{ fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center', marginTop: '0.4rem' }}>Подключите кошелёк для создания игры</p>}
        </div>

        {/* 🔗 Обработка приглашения */}
        {inviteData && !showDepositConfirm && (
          <div style={{ background: '#1e293b', padding: '1rem', borderRadius: '16px', width: '100%', maxWidth: '480px', marginBottom: '1rem', border: '2px solid #475569', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#fbbf24', marginBottom: '0.6rem' }}>🔗 Приглашение в игру</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '0.6rem' }}>Код: <strong>{inviteData.gameId.slice(0,12)}...</strong></p>
            <div style={{ background: '#0f172a', padding: '0.8rem', borderRadius: '12px', marginBottom: '0.8rem', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid #334155', fontSize: '0.95rem' }}><span>⏱️ Время:</span><strong>{getTimeLabel(inviteData.timeControl)}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', fontSize: '0.95rem' }}><span>💰 Ставка:</span><strong>{formatNumber(inviteData.stake)} GROK</strong></div>
            </div>
            <button onClick={() => setShowDepositConfirm(true)} disabled={pendingDeposit !== null} style={{ width: '100%', padding: '0.7rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '0.95rem' }}>{pendingDeposit ? '⏳...' : `💰 Внести ${formatNumber(inviteData.stake)} GROK`}</button>
          </div>
        )}

        {/* Модальное окно подтверждения депозита */}
        {showDepositConfirm && (selectedGameToJoin || inviteData) && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }} onClick={() => setShowDepositConfirm(false)}>
            <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '20px', maxWidth: '360px', width: '100%', border: '2px solid #475569', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 'bold', marginBottom: '1rem', color: '#fbbf24' }}>💰 Подтверждение депозита</h3>
              <p style={{ color: '#e2e8f0', fontSize: '0.95rem', marginBottom: '0.7rem', lineHeight: '1.5' }}>Вы вносите <strong>{formatNumber((selectedGameToJoin || inviteData).stake)} GROK</strong> в игру</p>
              <p style={{ color: '#e2e8f0', fontSize: '0.95rem', marginBottom: '0.7rem' }}>Время партии: <strong>{getTimeLabel((selectedGameToJoin || inviteData).timeControl)}</strong></p>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1rem' }}>Средства заблокируются в смарт-контракте до конца игры</p>
              <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center' }}>
                <button onClick={() => setShowDepositConfirm(false)} style={{ padding: '0.7rem 1.5rem', background: '#64748b', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}>Отмена</button>
                <button onClick={handleConfirmDeposit} style={{ padding: '0.7rem 1.5rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}>✅ Подтвердить</button>
              </div>
            </div>
          </div>
        )}

        {/* Кнопки действий */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', width: '100%', maxWidth: '480px' }}>
          <button onClick={() => startGame()} style={{ padding: '0.9rem', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '1rem', fontWeight: '600' }}>🤖 Играть с ботом</button>
          <button onClick={() => { setView('menu'); setMessage('') }} style={{ padding: '0.9rem', background: '#334155', color: '#fff', border: '1px solid #475569', borderRadius: '12px', cursor: 'pointer', fontSize: '1rem' }}>↩️ В меню</button>
        </div>

        {/* Язык */}
        <select value={i18n.language} onChange={e => i18n.changeLanguage(e.target.value)} style={{ marginTop: '1.2rem', padding: '0.4rem 0.8rem', background: '#334155', color: '#fff', border: '1px solid #475569', borderRadius: '8px', cursor: 'pointer' }}><option value="ru">🇷🇺 RU</option><option value="en">🇬🇧 EN</option></select>
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
          {isConnected && address && <span style={{ fontSize: '0.8rem', background: '#334155', padding: '0.3rem 0.6rem', borderRadius: '8px' }}>🔗 {address.slice(0,4)}...{address.slice(-4)}</span>}
          <button onClick={() => setView('profile')} style={{ padding: '0.4rem 0.8rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>👤</button>
          <button onClick={handleLogout} style={{ padding: '0.4rem 0.8rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>🚪</button>
        </div>
      </header>
      <div style={{ display: 'flex', justifyContent: 'space-around', width: '100%', maxWidth: '400px', marginBottom: '0.8rem' }}>
        <div style={{ background: timerActive === 'player' && !gameOver ? '#059669' : '#1e293b', padding: '0.6rem 1.2rem', borderRadius: '10px', textAlign: 'center', border: timerActive === 'player' && !gameOver ? '2px solid #34d399' : '2px solid transparent' }}><div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>👤 Вы</div><div style={{ fontSize: '1.4rem', fontWeight: 'bold', fontFamily: 'monospace' }}>{fmtTime(playerTime)}</div></div>
        <div style={{ background: timerActive === 'bot' && !gameOver ? '#059669' : '#1e293b', padding: '0.6rem 1.2rem', borderRadius: '10px', textAlign: 'center', border: timerActive === 'bot' && !gameOver ? '2px solid #34d399' : '2px solid transparent' }}><div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>🤖 Бот</div><div style={{ fontSize: '1.4rem', fontWeight: 'bold', fontFamily: 'monospace' }}>{fmtTime(botTime)}</div></div>
      </div>
      {message && <div style={{ color: '#38bdf8', marginBottom: '0.6rem', fontSize: '1rem', textAlign: 'center', minHeight: '1.3rem' }}>{message}</div>}
      <div style={{ width: boardWidth + 20, height: boardWidth + 20, background: '#1e293b', padding: '10px', borderRadius: '12px', boxShadow: theme.boardShadow, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', transition: 'box-shadow 0.3s ease' }}>
        <div style={{ width: '100%', height: '100%', filter: theme.pieceFilter, transition: 'filter 0.3s ease' }}>
          <Chessboard position={fen} onPieceDrop={onDrop} onSquareClick={onSquareClick} customSquareStyles={customSquareStyles} boardOrientation="white" boardWidth={boardWidth} customDarkSquareStyle={{ backgroundColor: theme.dark }} customLightSquareStyle={{ backgroundColor: theme.light }} customBoardStyle={{ borderRadius: '8px' }} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button onClick={() => { setSelectedSquare(null); setPossibleMoves([]); }} style={{ padding: '0.4rem 0.7rem', background: '#475569', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>✖️</button>
        <button onClick={handleBack} disabled={moveIndex === 0 || gameOver} style={{ padding: '0.4rem 0.7rem', background: moveIndex === 0 || gameOver ? '#334155' : '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: moveIndex === 0 || gameOver ? 'not-allowed' : 'pointer', fontSize: '0.85rem' }}>⏪</button>
        <button onClick={handleForward} disabled={moveIndex === history.length - 1 || gameOver} style={{ padding: '0.4rem 0.7rem', background: moveIndex === history.length - 1 || gameOver ? '#334155' : '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: moveIndex === history.length - 1 || gameOver ? 'not-allowed' : 'pointer', fontSize: '0.85rem' }}>⏩</button>
        {Object.entries(BOARD_THEMES).map(([key, t]) => (<button key={key} onClick={() => setBoardTheme(key)} title={t.name} style={{ padding: '0.4rem 0.6rem', background: boardTheme === key ? '#10b981' : '#334155', color: '#fff', border: boardTheme === key ? '2px solid #fbbf24' : '1px solid #475569', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}><span style={{ display: 'inline-block', width: '14px', height: '14px', borderRadius: '3px', background: `linear-gradient(135deg, ${t.light} 50%, ${t.dark} 50%)`, border: '1px solid #475569' }} />{key === 'classic' && '🏛️'}{key === 'wood3d' && '🪵'}{key === 'neon' && '💜'}{key === 'ocean' && '🌊'}{key === 'sunset' && '🌅'}{key === 'minimal' && '⚪'}</button>))}
        <select value={timeControl} onChange={e => { const v = Number(e.target.value); setTimeControl(v); if (view === 'game') { setPlayerTime(v*60); setBotTime(v*60) } }} style={{ padding: '0.4rem 0.6rem', background: '#334155', color: '#fff', border: '1px solid #475569', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>{timeOptions.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}</select>
      </div>
      {movesList.length > 0 && (<div style={{ background: '#1e293b', padding: '0.6rem 1rem', borderRadius: '10px', width: '100%', maxWidth: '400px', marginBottom: '1rem' }}><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.4rem' }}><span>📜 Ходы:</span><span style={{ background: '#334155', padding: '0.1rem 0.5rem', borderRadius: '6px' }}>{movesList.length}</span></div><div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', maxHeight: '60px', overflowY: 'auto' }}>{movesList.map((m, i) => <span key={i} style={{ background: i === moveIndex - 1 ? '#3b82f6' : '#334155', padding: '0.2rem 0.5rem', borderRadius: '5px', fontSize: '0.8rem' }}>{Math.floor(i/2)+1}.{i%2===0?'':'..'} {m.san}</span>)}</div></div>)}
      {gameOver && winner && (<div style={{ background: 'linear-gradient(135deg, #1e293b, #7c3aed)', padding: '1rem', borderRadius: '16px', width: '100%', maxWidth: '400px', textAlign: 'center', marginBottom: '1rem', border: '2px solid #a78bfa' }}><div style={{ fontSize: '2.5rem', marginBottom: '0.3rem' }}>{winner === 'player' ? '🏆' : winner === 'bot' ? '🤖' : '🤝'}</div><div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#fbbf24', marginBottom: '0.5rem' }}>{winner === 'player' ? '🎉 Вы победили!' : winner === 'bot' ? '😔 Бот победил' : '🤝 Ничья!'}</div><button onClick={() => { setView('profile'); setGameOver(false); setTimerActive(null); gameRef.current.reset(); setFen(gameRef.current.fen()); setHistory([gameRef.current.fen()]); setMoveIndex(0); setMovesList([]); setMessage('') }} style={{ padding: '0.6rem 1.5rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}>👤 В профиль</button></div>)}
      <select value={i18n.language} onChange={e => i18n.changeLanguage(e.target.value)} style={{ padding: '0.4rem 0.8rem', background: '#334155', color: '#fff', border: '1px solid #475569', borderRadius: '8px', cursor: 'pointer' }}><option value="ru">🇷🇺 RU</option><option value="en">🇬🇧 EN</option></select>
    </div>
  )
}

export default App