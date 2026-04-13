import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import { useAccount, useConnect, useDisconnect, useBalance } from 'wagmi'
import { useTranslation } from 'react-i18next'

// 🎨 ТЕМЫ ДОСОК (включая новую 3D деревянную)
const BOARD_THEMES = {
  classic: { 
    name: '🏛️ Классика', 
    light: '#eeeed2', 
    dark: '#769656', 
    highlight: 'rgba(255, 255, 0, 0.4)', 
    validMove: 'rgba(20, 85, 30, 0.5)',
    boardStyle: {},
    pieceStyle: {}
  },
  neon: { 
    name: '💜 Неон', 
    light: '#1a1a2e', 
    dark: '#16213e', 
    highlight: 'rgba(236, 72, 153, 0.5)', 
    validMove: 'rgba(59, 130, 246, 0.6)',
    boardStyle: { boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)' },
    pieceStyle: { filter: 'drop-shadow(0 0 2px rgba(255,255,255,0.5))' }
  },
  forest: { 
    name: '🌲 Лес', 
    light: '#c8b59a', 
    dark: '#5d7a4f', 
    highlight: 'rgba(251, 191, 36, 0.4)', 
    validMove: 'rgba(34, 197, 94, 0.5)',
    boardStyle: { borderRadius: '8px' },
    pieceStyle: {}
  },
  ocean: { 
    name: '🌊 Океан', 
    light: '#a8d8ea', 
    dark: '#2a6f97', 
    highlight: 'rgba(255, 215, 0, 0.4)', 
    validMove: 'rgba(6, 182, 212, 0.5)',
    boardStyle: { borderRadius: '12px', boxShadow: '0 4px 20px rgba(6, 182, 212, 0.2)' },
    pieceStyle: {}
  },
  sunset: { 
    name: '🌅 Закат', 
    light: '#ffecd2', 
    dark: '#fcb69f', 
    highlight: 'rgba(245, 158, 11, 0.4)', 
    validMove: 'rgba(239, 68, 68, 0.5)',
    boardStyle: { borderRadius: '16px' },
    pieceStyle: {}
  },
  // 🪵 НОВАЯ: 3D Деревянная доска
  wood3d: {
    name: '🪵 3D Дерево',
    light: '#e8c49a',
    dark: '#8b6f47',
    highlight: 'rgba(255, 215, 0, 0.5)',
    validMove: 'rgba(34, 197, 94, 0.6)',
    // CSS-эффекты для 3D вида
    boardStyle: {
      borderRadius: '4px',
      boxShadow: `
        0 10px 30px rgba(0,0,0,0.4),
        inset 0 2px 4px rgba(255,255,255,0.3),
        inset 0 -2px 4px rgba(0,0,0,0.2)
      `,
      backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)',
      transform: 'perspective(800px) rotateX(2deg)',
      transformStyle: 'preserve-3d',
      transition: 'transform 0.3s ease'
    },
    pieceStyle: {
      filter: 'drop-shadow(2px 4px 3px rgba(0,0,0,0.4))',
      transform: 'translateZ(10px)'
    }
  }
}

// 🌍 Список стран
const COUNTRIES = [
  { code: 'RU', name: '🇷🇺 Россия' }, { code: 'UA', name: '🇺🇦 Украина' },
  { code: 'BY', name: '🇧🇾 Беларусь' }, { code: 'KZ', name: '🇰🇿 Казахстан' },
  { code: 'US', name: '🇺🇸 США' }, { code: 'GB', name: '🇬🇧 Великобритания' },
  { code: 'DE', name: '🇩🇪 Германия' }, { code: 'FR', name: '🇫🇷 Франция' },
  { code: 'ES', name: '🇪🇸 Испания' }, { code: 'IT', name: '🇮🇹 Италия' },
  { code: 'CN', name: '🇨🇳 Китай' }, { code: 'JP', name: '🇯🇵 Япония' },
  { code: 'BR', name: '🇧🇷 Бразилия' }, { code: 'IN', name: '🇮🇳 Индия' },
  { code: 'OTHER', name: '🌍 Другая' }
]

// 🔑 КОНСТАНТЫ
const CONTRACT_ADDRESS = "0xYourDeployedContractAddressHere"
const GROK_TOKEN_ADDRESS = "0x62a3e247e28cad2d2902cd2dc2e6aea7cdd14444"

const isMobile = () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
const getShareUrl = () => typeof window !== 'undefined' ? window.location.origin + window.location.pathname : 'https://serwmwser.github.io/chess4crypto'
const generateGameId = () => `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
const fmtTime = (s) => { const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60; return h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}` : `${m}:${String(sec).padStart(2,'0')}` }
const formatNumber = (n) => n.toLocaleString('ru-RU')
const getTimeLabel = (mins) => {
  const opts = [{v:5,l:'5 мин'}, {v:15,l:'15 мин'}, {v:30,l:'30 мин'}, {v:60,l:'1 час'}, {v:1440,l:'24 часа'}]
  return opts.find(o => o.v === mins)?.l || `${mins} мин`
}
const LOBBY_TABS = { available: 'available', my: 'my', join: 'join' }
const isValidUrl = (str) => { try { new URL(str); return true } catch { return false } }
const formatSocialLink = (url) => { if (!url) return ''; if (!url.startsWith('http')) return `https://${url}`; return url }

function App() {
  const { t, i18n } = useTranslation()
  const { address, isConnected, status } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const {  balance: walletBalance } = useBalance({ address })

  // 🎮 Состояние игры
  const gameRef = useRef(new Chess())
  const [view, setView] = useState('menu')
  const [fen, setFen] = useState(gameRef.current.fen())
  const [history, setHistory] = useState([gameRef.current.fen()])
  const [moveIndex, setMoveIndex] = useState(0)
  const [movesList, setMovesList] = useState([])
  const [isPlayerTurn, setIsPlayerTurn] = useState(true)
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState(null)
  const [message, setMessage] = useState('')
  
  // 📱 PWA
  const [showInstallModal, setShowInstallModal] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState(null)

  // 🎨 Тема & Ходы
  const [boardTheme, setBoardTheme] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('chess4crypto_theme') || 'classic' : 'classic')
  const [selectedSquare, setSelectedSquare] = useState(null)
  const [possibleMoves, setPossibleMoves] = useState([])

  // ⏱️ Таймер
  const [timeControl, setTimeControl] = useState(5)
  const [playerTime, setPlayerTime] = useState(timeControl * 60)
  const [botTime, setBotTime] = useState(timeControl * 60)
  const [timerActive, setTimerActive] = useState(null)

  // 💰 Баланс & Лобби
  const [gameBalance, setGameBalance] = useState(0)
  const [pendingDeposit, setPendingDeposit] = useState(null)
  const [lobbyMode, setLobbyMode] = useState('idle')
  const [lobbyTab, setLobbyTab] = useState(LOBBY_TABS.available)
  const [gameId, setGameId] = useState(null)
  const [inviteLink, setInviteLink] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [creatorStake, setCreatorStake] = useState(0)
  const [creatorTimeControl, setCreatorTimeControl] = useState(5)
  const [stakeAmount, setStakeAmount] = useState(1000)
  const [showDepositConfirm, setShowDepositConfirm] = useState(false)
  const [selectedGameToJoin, setSelectedGameToJoin] = useState(null)

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

  // 🌐 СПИСОК ИГР
  const [gamesList, setGamesList] = useState([])

  // 🎨 Подсветка ходов
  const customSquareStyles = useMemo(() => {
    const theme = BOARD_THEMES[boardTheme], styles = {}
    if (selectedSquare) styles[selectedSquare] = { backgroundColor: theme.highlight }
    possibleMoves.forEach(sq => { 
      styles[sq] = { 
        backgroundColor: theme.validMove, 
        backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.9) 25%, transparent 25%)`,
        backgroundSize: '14px 14px',
        backgroundPosition: 'center'
      } 
    })
    return styles
  }, [selectedSquare, possibleMoves, boardTheme])

  const getValidMoves = useCallback((square) => gameRef.current.moves({ square, verbose: true }).map(m => m.to), [])
  
  const onSquareClick = useCallback((square) => {
    if (gameOver || lobbyMode !== 'playing') return
    const piece = gameRef.current.get(square)
    if (piece && piece.color === (isPlayerTurn ? 'w' : 'b')) { setSelectedSquare(square); setPossibleMoves(getValidMoves(square)); return }
    if (selectedSquare && possibleMoves.includes(square)) { onDrop(selectedSquare, square); setSelectedSquare(null); setPossibleMoves([]); return }
    setSelectedSquare(null); setPossibleMoves([])
  }, [gameOver, isPlayerTurn, selectedSquare, possibleMoves, getValidMoves, lobbyMode])

  const onDrop = useCallback((source, target) => {
    if (!isPlayerTurn || gameOver || moveIndex !== history.length - 1 || lobbyMode !== 'playing') return false
    try {
      const move = gameRef.current.move({ from: source, to: target, promotion: 'q' }); if (!move) return false
      const newFen = gameRef.current.fen(), san = gameRef.current.history({ verbose: true }).pop()?.san || `${source}${target}`
      setHistory(prev => [...prev, newFen]); setMovesList(prev => [...prev, { san, from: source, to: target, piece: move.piece }])
      setFen(newFen); setMoveIndex(prev => prev + 1); setIsPlayerTurn(false); setTimerActive('bot'); setMessage('🤖 Бот думает...')
      setSelectedSquare(null); setPossibleMoves([])
      if (gameRef.current.isCheckmate()) endGame('player'); else if (gameRef.current.isDraw()) endGame('draw'); else setTimeout(makeBotMove, 1000)
      return true
    } catch { return false }
  }, [isPlayerTurn, gameOver, moveIndex, history.length, lobbyMode])

  const makeBotMove = useCallback(() => {
    if (gameOver || gameRef.current.isGameOver() || lobbyMode !== 'playing') return
    const moves = gameRef.current.moves(); if (!moves.length) return
    const random = moves[Math.floor(Math.random() * moves.length)]; gameRef.current.move(random)
    const newFen = gameRef.current.fen(), san = gameRef.current.history({ verbose: true }).pop()?.san || random
    setHistory(prev => [...prev, newFen]); setMovesList(prev => [...prev, { san, from: random.from, to: random.to, piece: random.piece }])
    setFen(newFen); setMoveIndex(prev => prev + 1); setIsPlayerTurn(true); setTimerActive('player')
    if (gameRef.current.isCheckmate()) endGame('player'); else if (gameRef.current.isDraw()) endGame('draw'); else setMessage('♟️ Ваш ход!')
  }, [gameOver, lobbyMode])

  const endGame = (result) => {
    setGameOver(true); setTimerActive(null); setSelectedSquare(null); setPossibleMoves([])
    if (result === 'player') { setWinner('player'); setMessage('🏁 КОНЕЦ ИГРЫ! Вы победили!'); if (gameBalance > 0) handleClaimPrize() }
    else if (result === 'bot') { setWinner('bot'); setMessage('🏁 КОНЕЦ ИГРЫ! Бот победил.') }
    else { setWinner('draw'); setMessage('🤝 НИЧЬЯ!'); if (gameBalance > 0) handleClaimPrize() }
    setLobbyMode('idle')
  }

  // 👤 Загрузка профиля
  useEffect(() => {
    if (address) {
      const saved = localStorage.getItem(`chess4crypto_profile_${address}`)
      if (saved) { const profile = JSON.parse(saved); setPlayerProfile(profile); setProfileForm(profile); if (profile.avatar) setAvatarPreview(profile.avatar) }
    }
  }, [address])

  const saveProfile = () => {
    if (!address) return
    const updated = { ...profileForm, avatar: avatarPreview || profileForm.avatar }
    setPlayerProfile(updated)
    localStorage.setItem(`chess4crypto_profile_${address}`, JSON.stringify(updated))
    setIsEditingProfile(false)
    setMessage('✅ Профиль сохранён!')
  }

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { setMessage('⚠️ Файл слишком большой (макс. 2MB)'); return }
    if (!file.type.startsWith('image/')) { setMessage('⚠️ Только изображения'); return }
    const reader = new FileReader()
    reader.onload = (event) => { setAvatarPreview(event.target?.result); setProfileForm(prev => ({ ...prev, avatar: event.target?.result })) }
    reader.readAsDataURL(file)
  }

  // 🔗 Подключение
  const handleConnect = async () => {
    setMessage('🔄 Открываю кошелёк...')
    try {
      const connector = isMobile() ? connectors.find(c => c.id === 'walletConnect') : (connectors.find(c => c.id === 'metaMask') || connectors.find(c => c.id === 'injected'))
      if (!connector) throw new Error('Кошелёк не найден')
      await connect({ connector }); await new Promise(resolve => setTimeout(resolve, 1500))
      if (!isConnected) throw new Error('Подключение отменено')
      return true
    } catch (err) { setMessage('⚠️ ' + (err.shortMessage || err.message || 'Не удалось подключиться')); return false }
  }

  // 🌐 Список игр (МОК)
  const fetchGamesList = useCallback(() => {
    const mockGames = [], now = Date.now()
    if (address) { for (let i = 0; i < 5; i++) { mockGames.push({ id: `mock_game_${i}`, creator: `0xMock${i}...${i}${i}${i}${i}`, creatorName: `Player${i}`, stake: [1000, 5000, 10000][i % 3], timeControl: [5, 15, 30][i % 3], createdAt: now - (i + 1) * 60000, joined: false, status: 'waiting' }) } }
    const saved = JSON.parse(localStorage.getItem('chess4crypto_my_games') || '[]')
    saved.forEach(g => mockGames.push({ ...g, isMine: true }))
    setGamesList(mockGames)
  }, [address])

  const saveMyGame = (game) => { const saved = JSON.parse(localStorage.getItem('chess4crypto_my_games') || '[]'); saved.push(game); localStorage.setItem('chess4crypto_my_games', JSON.stringify(saved)); fetchGamesList() }

  const handleShowDepositConfirm = (game) => { setSelectedGameToJoin(game); setCreatorStake(game.stake); setCreatorTimeControl(game.timeControl); if (!isConnected) { handleConnect().then(s => { if (s) setShowDepositConfirm(true) }) } else { setShowDepositConfirm(true) } }
  
  const handleConfirmDeposit = async () => {
    if (!selectedGameToJoin) return
    setShowDepositConfirm(false); setPendingDeposit(creatorStake); setMessage(`🔄 Вносим ${formatNumber(creatorStake)} GROK...`)
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      setGameBalance(prev => prev + creatorStake); setPendingDeposit(null); setMessage(`✅ ${formatNumber(creatorStake)} GROK внесено!`)
      setGamesList(prev => prev.map(g => g.id === selectedGameToJoin.id ? { ...g, joined: true, status: 'playing' } : g))
      setGameId(selectedGameToJoin.id); setLobbyMode('playing'); startGame('wallet'); setSelectedGameToJoin(null)
    } catch (err) { console.error('Deposit error:', err); setMessage('⚠️ Ошибка'); setPendingDeposit(null); setShowDepositConfirm(true) }
  }

  const handleClaimPrize = async () => { if (!gameId || !isConnected) return; setMessage('🎁 Забираю приз...'); try { await new Promise(resolve => setTimeout(resolve, 1000)); setMessage(`✅ ${formatNumber(gameBalance)} GROK зачислено!`); setGameBalance(0) } catch { setMessage('⚠️ Ошибка') } }

  useEffect(() => { if (status === 'connected' && address) { fetchGamesList(); if (!(joinCode && lobbyMode === 'join' && creatorStake > 0)) { setView('profile'); setMessage('✅ Кошелёк подключён!') } } }, [status, address, joinCode, lobbyMode, creatorStake, fetchGamesList])

  useEffect(() => { if (typeof window !== 'undefined') { const params = new URLSearchParams(window.location.search); const invite = params.get('invite') || params.get('game'); if (invite) { const id = invite.replace(/^.*invite=/, ''); setJoinCode(id); setGameId(id); setView('profile'); setLobbyMode('join'); setLobbyTab(LOBBY_TABS.join); setTimeout(() => { setCreatorStake(1000); setCreatorTimeControl(15); setMessage(`🔗 Приглашение: ${formatNumber(1000)} GROK, ${getTimeLabel(15)}`) }, 300) } } }, [])
  useEffect(() => { if (address) fetchGamesList() }, [address, fetchGamesList])

  const startGame = (mode = 'guest') => { gameRef.current.reset(); const startFen = gameRef.current.fen(); setFen(startFen); setHistory([startFen]); setMoveIndex(0); setMovesList([]); setIsPlayerTurn(true); setGameOver(false); setWinner(null); setSelectedSquare(null); setPossibleMoves([]); setPlayerTime(timeControl * 60); setBotTime(timeControl * 60); setTimerActive('player'); if (mode === 'wallet' && gameBalance === 0) setGameBalance(0); setMessage('♟️ Ваш ход!'); setView('game'); setLobbyMode('playing') }
  const handleGuestLogin = () => startGame('guest')
  const handleLogout = () => { if (isConnected) disconnect(); setView('menu'); setLobbyMode('idle'); gameRef.current.reset() }
  const goToProfile = () => { setView('profile'); fetchGamesList() }
  const handleBuyGrok = () => window.open('https://four.meme/token/0x62a3e247e28cad2d2902cd2dc2e6aea7cdd14444?code=AHGX96R5GHK9', '_blank')
  const handleThemeChange = (key) => { setBoardTheme(key); localStorage.setItem('chess4crypto_theme', key); setMessage(`🎨 ${BOARD_THEMES[key].name}`) }
  const handleBack = () => { if (moveIndex > 0 && !gameOver) { const i = moveIndex - 1; setMoveIndex(i); setFen(history[i]); gameRef.current.load(history[i]); setIsPlayerTurn(i % 2 === 0); setTimerActive(null); setMessage('⏪ История') } }
  const handleForward = () => { if (moveIndex < history.length - 1 && !gameOver) { const i = moveIndex + 1; setMoveIndex(i); setFen(history[i]); gameRef.current.load(history[i]); setIsPlayerTurn(i % 2 === 0); if (i === history.length - 1) { setTimerActive(isPlayerTurn ? 'player' : 'bot'); setMessage(isPlayerTurn ? '♟️ Ваш ход!' : '🤖 Бот думает...') } else setMessage('⏩ История') } }

  useEffect(() => { const h = (e) => { e.preventDefault(); setDeferredPrompt(e) }; window.addEventListener('beforeinstallprompt', h); return () => window.removeEventListener('beforeinstallprompt', h) }, [])
  const handleInstallApp = async () => { if (!deferredPrompt) { setShowInstallModal(true); return }; deferredPrompt.prompt(); await deferredPrompt.userChoice; setDeferredPrompt(null); setMessage('✅ Установлено!') }

  useEffect(() => { if (!timerActive || gameOver || lobbyMode !== 'playing') return; const interval = setInterval(() => { if (timerActive === 'player') { setPlayerTime(prev => { if (prev <= 1) { endGame('bot'); return 0 } return prev - 1 }) } else { setBotTime(prev => { if (prev <= 1) { endGame('player'); return 0 } return prev - 1 }) } }, 1000); return () => clearInterval(interval) }, [timerActive, gameOver, lobbyMode])

  const timeOptions = [{ value: 5, label: '5 мин' }, { value: 15, label: '15 мин' }, { value: 30, label: '30 мин' }, { value: 60, label: '1 ч' }, { value: 1440, label: '24 ч' }]
  const depositOptions = [1000, 5000, 10000, 50000, 100000, 500000]
  const theme = BOARD_THEMES[boardTheme]

  const handleCreateGame = async () => { if (!isConnected) { setMessage('⚠️ Подключите кошелёк'); return }; const id = generateGameId(); const newGame = { id, creator: address, creatorName: playerProfile.nickname || address?.slice(0,6)+'...'+address?.slice(-4), stake: stakeAmount, timeControl, createdAt: Date.now(), joined: false, status: 'waiting', isMine: true }; saveMyGame(newGame); setGameId(id); setInviteLink(`${getShareUrl()}?invite=${id}`); setLobbyMode('waiting'); setMessage('🎉 Игра создана!') }
  const handleJoinFromList = (game) => { setSelectedGameToJoin(game); setJoinCode(game.id); setCreatorStake(game.stake); setCreatorTimeControl(game.timeControl); setLobbyTab(LOBBY_TABS.join); handleShowDepositConfirm(game) }
  const handleShareInvite = async () => { const url = inviteLink || `${getShareUrl()}?invite=${joinCode}`; if (navigator.share) { try { await navigator.share({ title: 'Chess4Crypto', text: `Присоединяйся! ${formatNumber(creatorStake || stakeAmount)} GROK, ${getTimeLabel(creatorTimeControl || timeControl)}`, url }) } catch{ copyToClipboard(url) } } else { copyToClipboard(url) } }
  const copyToClipboard = (text) => { navigator.clipboard.writeText(text); setCopied(true); setMessage('📋 Скопировано!'); setTimeout(() => setCopied(false), 2000) }
  const timeOptionsLobby = timeOptions.map(o => ({...o, value: Number(o.value)}))

  // ============================================================================
  // 🎨 МЕНЮ ВХОДА (современный дизайн как chess.com)
  // ============================================================================
  if (view === 'menu') {
    return (<div style={styles.appContainer}>
      <header style={styles.modernHeader}>
        <div style={styles.logo}>♟️ <span style={styles.logoText}>Chess4Crypto</span></div>
        <div style={styles.headerActions}>
          <select value={i18n.language} onChange={e => i18n.changeLanguage(e.target.value)} style={styles.langSelect}><option value="ru">🇷🇺 RU</option><option value="en">🇬🇧 EN</option></select>
          {isConnected && address && <span style={styles.walletBadge}>🔗 {address.slice(0,4)}...{address.slice(-4)}</span>}
        </div>
      </header>
      
      <main style={styles.menuMain}>
        <div style={styles.heroSection}>
          <h1 style={styles.heroTitle}>Web3 Шахматы с крипто-ставками</h1>
          <p style={styles.heroSubtitle}>Играй с ботом, друзьями или на деньги в токенах GROK</p>
        </div>

        <div style={styles.actionCards}>
          <button onClick={handleGuestLogin} style={styles.actionCard}>
            <div style={styles.actionIcon}>👤</div>
            <div style={styles.actionText}>
              <strong>Гостевой вход</strong>
              <span>Быстрая игра с ботом</span>
            </div>
          </button>
          <button onClick={handleConnect} style={styles.actionCard} disabled={status === 'connecting'}>
            <div style={styles.actionIcon}>{isMobile() ? '🔗' : '🦊'}</div>
            <div style={styles.actionText}>
              <strong>{t('app.connectWallet')}</strong>
              <span>Игра на GROK токены</span>
            </div>
          </button>
        </div>

        <div style={styles.quickActions}>
          <button onClick={handleBuyGrok} style={styles.btnGrok}>💰 Купить GROK</button>
          <button onClick={handleInstallApp} style={styles.btnInstall}>📱 Установить приложение</button>
        </div>

        {gameBalance > 0 && <div style={styles.balanceBadge}>🎮 Баланс: <strong>{formatNumber(gameBalance)} GROK</strong></div>}
      </main>
    </div>)
  }

  // ============================================================================
  // 👤 ПРОФИЛЬ (современный дизайн)
  // ============================================================================
  if (view === 'profile') {
    const displayName = playerProfile.nickname || (address ? `${address.slice(0,6)}...${address.slice(-4)}` : 'Гость')
    const countryName = COUNTRIES.find(c => c.code === playerProfile.country)?.name || '🌍 Не указана'
    const socialIcon = playerProfile.socialLink?.includes('t.me') ? '✈️' : playerProfile.socialLink?.includes('twitter') ? '🐦' : playerProfile.socialLink?.includes('discord') ? '💬' : '🔗'

    return (<div style={styles.appContainer}>
      <header style={styles.modernHeader}>
        <div style={styles.logo}>♟️ <span style={styles.logoText}>Chess4Crypto</span></div>
        <div style={styles.headerActions}>
          <button onClick={goToProfile} style={styles.headerBtn}>🏠 Лобби</button>
          <button onClick={handleLogout} style={{...styles.headerBtn, background:'#ef4444'}}>🚪</button>
        </div>
      </header>
      
      <main style={styles.profileMain}>
        {/* 👤 Карточка профиля */}
        <div style={styles.modernProfileCard}>
          <div style={styles.profileHeader}>
            <div style={styles.avatarWrapper}>
              {isEditingProfile ? (
                <label style={styles.avatarUpload}>
                  {avatarPreview ? <img src={avatarPreview} alt="Avatar" style={styles.avatarImg} /> : <div style={styles.avatarPlaceholder}>👤</div>}
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{display:'none'}} />
                  <span style={styles.avatarEdit}>✏️</span>
                </label>
              ) : (
                <div style={styles.avatarDisplay}>
                  {playerProfile.avatar ? <img src={playerProfile.avatar} alt="Avatar" style={styles.avatarImg} /> : <div style={styles.avatarPlaceholder}>👤</div>}
                </div>
              )}
            </div>
            <div style={styles.profileHeaderText}>
              {isEditingProfile ? (
                <input value={profileForm.nickname} onChange={e => setProfileForm({...profileForm, nickname: e.target.value.slice(0,20)})} placeholder="Ваш ник" style={styles.nicknameInput} />
              ) : (
                <h2 style={styles.displayName}>{displayName}</h2>
              )}
              {isEditingProfile ? (
                <select value={profileForm.country} onChange={e => setProfileForm({...profileForm, country: e.target.value})} style={styles.countrySelect}>
                  {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                </select>
              ) : (
                <p style={styles.countryText}>{countryName}</p>
              )}
            </div>
          </div>

          <div style={styles.profileActions}>
            {isEditingProfile ? (
              <>
                <button onClick={saveProfile} style={styles.btnSave}>💾 Сохранить</button>
                <button onClick={() => { setIsEditingProfile(false); setProfileForm(playerProfile); setAvatarPreview(playerProfile.avatar) }} style={styles.btnCancel}>✖️</button>
              </>
            ) : (
              <button onClick={() => { setIsEditingProfile(true); setProfileForm(playerProfile) }} style={styles.btnEdit}>✏️ Редактировать</button>
            )}
          </div>

          {!isEditingProfile && (playerProfile.socialLink || playerProfile.bio) && (
            <div style={styles.profileExtras}>
              {playerProfile.socialLink && <a href={formatSocialLink(playerProfile.socialLink)} target="_blank" rel="noopener noreferrer" style={styles.socialLink}>{socialIcon} {playerProfile.socialLink.replace(/^https?:\/\//, '').slice(0, 35)}{playerProfile.socialLink.length > 35 ? '...' : ''}</a>}
              {playerProfile.bio && <p style={styles.bio}>{playerProfile.bio}</p>}
            </div>
          )}
          {isEditingProfile && (
            <div style={styles.editExtras}>
              <input value={profileForm.socialLink} onChange={e => setProfileForm({...profileForm, socialLink: e.target.value})} placeholder="https://t.me/ник или сайт" style={styles.input} />
              <textarea value={profileForm.bio} onChange={e => setProfileForm({...profileForm, bio: e.target.value.slice(0,150)})} placeholder="О себе..." style={{...styles.input, minHeight:'50px'}} maxLength={150} />
            </div>
          )}
        </div>

        {/* 💰 Баланс */}
        <div style={styles.modernBalanceCard}>
          <div style={styles.balanceLabel}>🎮 Баланс игры</div>
          <div style={styles.balanceValue}>{formatNumber(gameBalance)} <span style={{fontSize:'1rem'}}>GROK</span></div>
          {isConnected && gameBalance === 0 && <div style={styles.depositQuick}>{depositOptions.slice(0,3).map(amt => <button key={amt} onClick={() => { setStakeAmount(amt); handleShowDepositConfirm({stake:amt,timeControl:15}) }} style={styles.btnDepositSmall}>+{formatNumber(amt)}</button>)}</div>}
        </div>

        {/* 🔗 Вкладки лобби */}
        <div style={styles.lobbyTabs}>
          <button onClick={() => setLobbyTab(LOBBY_TABS.available)} style={{...styles.lobbyTab, active: lobbyTab === LOBBY_TABS.available}}>🌐 Доступные</button>
          <button onClick={() => setLobbyTab(LOBBY_TABS.my)} style={{...styles.lobbyTab, active: lobbyTab === LOBBY_TABS.my}}>📋 Мои</button>
          <button onClick={() => setLobbyTab(LOBBY_TABS.join)} style={{...styles.lobbyTab, active: lobbyTab === LOBBY_TABS.join}}>🔗 Код</button>
        </div>

        {/* 🌐 Доступные игры */}
        {lobbyTab === LOBBY_TABS.available && (
          <div style={styles.modernLobbyCard}>
            <h3 style={styles.lobbyTitle}>🌐 Игры других игроков</h3>
            {gamesList.filter(g => !g.isMine && !g.joined).length === 0 ? <p style={styles.emptyText}>Пока нет игр. Создайте свою!</p> : (
              <div style={styles.gamesList}>
                {gamesList.filter(g => !g.isMine && !g.joined).map(game => (
                  <div key={game.id} style={styles.modernGameCard}>
                    <div style={styles.gameHeader}><span style={styles.creatorName}>{game.creatorName || 'Аноним'}</span><span style={styles.gameStake}>💰 {formatNumber(game.stake)}</span></div>
                    <div style={styles.gameDetails}><span>⏱️ {getTimeLabel(game.timeControl)}</span><span>🕐 {new Date(game.createdAt).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</span></div>
                    <button onClick={() => handleJoinFromList(game)} style={styles.btnJoin}>🤝 Присоединиться</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 📋 Мои игры */}
        {lobbyTab === LOBBY_TABS.my && (
          <div style={styles.modernLobbyCard}>
            <h3 style={styles.lobbyTitle}>📋 Мои игры</h3>
            {gamesList.filter(g => g.isMine).length === 0 ? <p style={styles.emptyText}>Вы ещё не создали игр.</p> : (
              <div style={styles.gamesList}>
                {gamesList.filter(g => g.isMine).map(game => (
                  <div key={game.id} style={styles.modernGameCard}>
                    <div style={styles.gameHeader}><span style={styles.gameId}>🎮 {game.id.slice(-8)}</span><span style={styles.gameStatus}>{game.status === 'waiting' ? '⏳ Ожидание' : '🎮 В игре'}</span></div>
                    <div style={styles.gameDetails}><span>💰 {formatNumber(game.stake)} GROK</span><span>⏱️ {getTimeLabel(game.timeControl)}</span></div>
                    {game.status === 'waiting' && <button onClick={() => { setInviteLink(`${getShareUrl()}?invite=${game.id}`); handleShareInvite() }} style={styles.btnShare}>📤 Пригласить</button>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 🔗 Присоединиться по коду */}
        {lobbyTab === LOBBY_TABS.join && (
          <div style={styles.modernLobbyCard}>
            <h3 style={styles.lobbyTitle}>🔗 По коду</h3>
            <div style={styles.formGroup}><input value={joinCode} onChange={e => setJoinCode(e.target.value)} style={styles.input} placeholder="Код или ссылка..." /></div>
            <button onClick={() => { if(joinCode) { setLobbyMode('join'); setMessage('Поиск...') } }} style={styles.btnPrimary}>🔍 Найти</button>
          </div>
        )}

        {/* 🔗 Приглашение */}
        {lobbyMode === 'join' && joinCode && lobbyTab !== LOBBY_TABS.join && (
          <div style={styles.modernLobbyCard}>
            <h3 style={styles.lobbyTitle}>🔗 Приглашение</h3>
            <p style={styles.infoText}>Код: <strong>{joinCode}</strong></p>
            <div style={styles.inviteDetails}><div style={styles.detailRow}><span>⏱️</span><strong>{getTimeLabel(creatorTimeControl)}</strong></div><div style={styles.detailRow}><span>💰</span><strong>{formatNumber(creatorStake)} GROK</strong></div></div>
            <button onClick={() => handleShowDepositConfirm({stake:creatorStake,timeControl:creatorTimeControl,id:joinCode})} disabled={pendingDeposit !== null} style={styles.btnPrimary}>{pendingDeposit ? '⏳...' : `💰 Внести ${formatNumber(creatorStake)}`}</button>
            <button onClick={() => { setLobbyMode('idle'); setJoinCode(''); }} style={styles.btnSmall}>↩️</button>
          </div>
        )}

        {/* Модальное окно */}
        {showDepositConfirm && (
          <div style={styles.modalOverlay} onClick={() => setShowDepositConfirm(false)}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
              <h3 style={styles.modalTitle}>💰 Подтверждение</h3>
              <p style={styles.modalStep}>Вносите <strong>{formatNumber(creatorStake)} GROK</strong></p>
              <p style={styles.modalStep}>Время: <strong>{getTimeLabel(creatorTimeControl)}</strong></p>
              <div style={styles.modalActions}>
                <button onClick={() => setShowDepositConfirm(false)} style={styles.modalCancel}>Отмена</button>
                <button onClick={handleConfirmDeposit} style={styles.modalConfirm}>✅ Подтвердить</button>
              </div>
            </div>
          </div>
        )}

        {/* ➕ Создать игру */}
        {lobbyMode === 'idle' && !showDepositConfirm && (
          <div style={styles.createSection}>
            <h3 style={styles.lobbyTitle}>➕ Создать</h3>
            <div style={styles.createForm}>
              <div style={styles.formRow}><label>Ставка</label><select value={stakeAmount} onChange={e => setStakeAmount(Number(e.target.value))} style={styles.select}>{depositOptions.map(amt => <option key={amt} value={amt}>{formatNumber(amt)}</option>)}</select></div>
              <div style={styles.formRow}><label>Время</label><select value={timeControl} onChange={e => setTimeControl(Number(e.target.value))} style={styles.select}>{timeOptionsLobby.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
            </div>
            <button onClick={handleCreateGame} style={styles.btnPrimary}>🎲 Создать</button>
          </div>
        )}

        {lobbyMode === 'waiting' && inviteLink && (
          <div style={styles.modernLobbyCard}>
            <h3 style={styles.lobbyTitle}>⏳ Ожидание</h3>
            <div style={styles.codeBox}>{inviteLink}</div>
            <div style={styles.waitActions}>
              <button onClick={() => copyToClipboard(inviteLink)} style={styles.btnSmall}>{copied ? '✅' : '📋'}</button>
              <button onClick={handleShareInvite} style={styles.btnSmall}>📤</button>
              <button onClick={() => { setLobbyMode('idle'); }} style={styles.btnSmallCancel}>❌</button>
            </div>
          </div>
        )}

        {/* 🎨 Выбор темы доски */}
        <div style={styles.themeSelector}>
          <h4 style={styles.themeTitle}>🎨 Стиль доски</h4>
          <div style={styles.themeGrid}>
            {Object.entries(BOARD_THEMES).map(([key, t]) => (
              <button key={key} onClick={() => handleThemeChange(key)} style={{...styles.themeBtn, active: boardTheme === key, theme: t}}>
                <div style={styles.themePreview}>
                  <div style={{...styles.themeSquare, background: t.light}} />
                  <div style={{...styles.themeSquare, background: t.dark}} />
                </div>
                <span style={styles.themeName}>{t.name}</span>
                {boardTheme === key && <span style={styles.themeCheck}>✓</span>}
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>)
  }

  // ============================================================================
  // 🎮 ИГРОВОЙ ЭКРАН (современный дизайн)
  // ============================================================================
  return (<div style={styles.appContainer}>
    <header style={styles.modernHeader}>
      <div style={styles.logo}>♟️ <span style={styles.logoText}>Chess4Crypto</span></div>
      <div style={styles.headerActions}>
        {isConnected && address && <span style={styles.walletBadge}>🔗 {address.slice(0,4)}...{address.slice(-4)}</span>}
        <button onClick={goToProfile} style={styles.headerBtn}>🏠</button>
      </div>
    </header>
    
    <main style={styles.gameMain}>
      {gameOver && winner && (
        <div style={styles.gameOverBanner}>
          <div style={styles.gameOverIcon}>{winner === 'player' ? '🏆' : winner === 'bot' ? '🤖' : '🤝'}</div>
          <div style={styles.gameOverText}>{winner === 'player' && '🎉 ПОБЕДА!'}{winner === 'bot' && '😔 Поражение'}{winner === 'draw' && '🤝 Ничья'}</div>
          {winner === 'player' && gameBalance > 0 && <div style={styles.prizeText}>+{formatNumber(gameBalance)} GROK</div>}
          <button onClick={() => { setView('profile'); setGameOver(false); setLobbyMode('idle'); }} style={styles.btnNewGame}>🏠 В лобби</button>
        </div>
      )}
      
      <div style={styles.gameLayout}>
        {/* Левая панель: таймеры */}
        <aside style={styles.sidePanel}>
          <div style={{...styles.timerCard, active: timerActive === 'player' && !gameOver}}>
            <span style={styles.timerLabel}>👤 Вы</span>
            <span style={styles.timerValue}>{fmtTime(playerTime)}</span>
          </div>
          <div style={{...styles.timerCard, active: timerActive === 'bot' && !gameOver}}>
            <span style={styles.timerLabel}>🤖 Бот</span>
            <span style={styles.timerValue}>{fmtTime(botTime)}</span>
          </div>
          {gameBalance > 0 && !gameOver && <div style={styles.stakeBadge}>💰 {formatNumber(gameBalance)} GROK</div>}
          {!gameOver && message && <div style={styles.statusMsg}>{message}</div>}
        </aside>

        {/* Центр: доска с 3D эффектами */}
        <div style={styles.boardContainer}>
          <div style={{...styles.boardWrapper, ...theme.boardStyle}}>
            <Chessboard 
              position={fen} 
              onPieceDrop={onDrop} 
              onSquareClick={onSquareClick} 
              customSquareStyles={customSquareStyles} 
              boardOrientation="white"
              customDarkSquareStyle={{ backgroundColor: theme.dark }}
              customLightSquareStyle={{ backgroundColor: theme.light }}
              customBoardStyle={{...theme.boardStyle, borderRadius: boardTheme === 'wood3d' ? '4px' : '8px'}}
              customPieceStyles={theme.pieceStyle}
            />
          </div>
        </div>

        {/* Правая панель: ходы и управление */}
        <aside style={styles.sidePanel}>
          <div style={styles.historyPanel}>
            <div style={styles.historyHeader}><span>📜 Ходы</span><span style={styles.historyCount}>{movesList.length}</span></div>
            <div style={styles.historyList}>
              {movesList.map((m, i) => <span key={i} style={{...styles.moveChip, highlight: i === moveIndex - 1}}>{Math.floor(i/2)+1}.{i%2===0?'':'..'} {m.san}</span>)}
              {movesList.length === 0 && <span style={styles.emptyHist}>Ходов нет...</span>}
            </div>
          </div>
          <div style={styles.controls}>
            <button onClick={() => { setSelectedSquare(null); setPossibleMoves([]); }} style={styles.btnCtrl}>✖️</button>
            <button onClick={handleBack} disabled={moveIndex === 0 || gameOver} style={styles.btnCtrl}>⏪</button>
            <button onClick={handleForward} disabled={moveIndex === history.length - 1 || gameOver} style={styles.btnCtrl}>⏩</button>
          </div>
        </aside>
      </div>
      
      <p style={styles.modeInfo}>{lobbyMode === 'playing' ? '🤖 Бот' : '👤 Лобби'} • {getTimeLabel(timeControl)} • {theme.name}</p>
      
      {showInstallModal && <div style={styles.modalOverlay} onClick={() => setShowInstallModal(false)}><div style={styles.modal} onClick={e => e.stopPropagation()}><h3 style={styles.modalTitle}>📱 Установка</h3><p style={styles.modalStep}>Нажмите "Поделиться" ⎋ → "На экран «Домой»"</p><button onClick={() => setShowInstallModal(false)} style={styles.modalClose}>✓</button></div></div>}
    </main>
  </div>)
}

// 🎨 СОВРЕМЕННЫЕ СТИЛИ (как chess.com)
const styles = {
  // 🌐 Контейнер приложения
  appContainer: { minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)', color: '#f1f5f9', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
  
  // 🔝 Хедер
  modernHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', background: 'rgba(15, 23, 42, 0.95)', borderBottom: '1px solid #334155', position: 'sticky', top: 0, zIndex: 100 },
  logo: { display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.4rem', fontWeight: 'bold', color: '#fbbf24' },
  logoText: { color: '#e2e8f0', fontSize: '1.1rem' },
  headerActions: { display: 'flex', alignItems: 'center', gap: '0.8rem' },
  langSelect: { padding: '0.4rem 0.8rem', background: '#334155', color: '#fff', border: '1px solid #475569', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' },
  walletBadge: { fontSize: '0.75rem', background: '#334155', padding: '0.3rem 0.6rem', borderRadius: '20px', color: '#94a3b8' },
  headerBtn: { padding: '0.4rem 0.8rem', background: '#475569', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem' },
  
  // 🎮 Меню
  menuMain: { padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem', maxWidth: '600px', margin: '0 auto' },
  heroSection: { textAlign: 'center', marginBottom: '1rem' },
  heroTitle: { fontSize: '2rem', fontWeight: 'bold', color: '#fbbf24', marginBottom: '0.5rem' },
  heroSubtitle: { color: '#94a3b8', fontSize: '1.1rem' },
  actionCards: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', width: '100%' },
  actionCard: { display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.2rem', background: 'linear-gradient(135deg, #1e293b, #334155)', border: '2px solid #475569', borderRadius: '16px', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left' },
  actionIcon: { fontSize: '2rem' },
  actionText: { display: 'flex', flexDirection: 'column', gap: '0.2rem' },
  actionText strong: { color: '#e2e8f0', fontSize: '1rem' },
  actionText span: { color: '#94a3b8', fontSize: '0.85rem' },
  quickActions: { display: 'flex', gap: '0.8rem', flexWrap: 'wrap', justifyContent: 'center' },
  btnGrok: { padding: '0.7rem 1.5rem', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#000', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '600' },
  btnInstall: { padding: '0.7rem 1.5rem', background: '#334155', color: '#fff', border: '1px solid #475569', borderRadius: '12px', cursor: 'pointer' },
  balanceBadge: { background: 'linear-gradient(135deg, #059669, #10b981)', color: '#fff', padding: '0.5rem 1.2rem', borderRadius: '20px', fontWeight: '600' },
  
  // 👤 Профиль
  profileMain: { padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', maxWidth: '500px', margin: '0 auto' },
  modernProfileCard: { background: 'linear-gradient(135deg, #1e293b, #334155)', padding: '1.5rem', borderRadius: '20px', width: '100%', border: '2px solid #475569' },
  profileHeader: { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' },
  avatarWrapper: { position: 'relative' },
  avatarImg: { width: '70px', height: '70px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #fbbf24' },
  avatarPlaceholder: { width: '70px', height: '70px', borderRadius: '50%', background: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', border: '3px solid #64748b' },
  avatarEdit: { position: 'absolute', bottom: '0', right: '0', background: '#3b82f6', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', cursor: 'pointer' },
  profileHeaderText: { flex: 1 },
  displayName: { fontSize: '1.3rem', fontWeight: 'bold', color: '#fbbf24', margin: 0 },
  countryText: { color: '#94a3b8', fontSize: '0.9rem', margin: '0.2rem 0 0 0' },
  nicknameInput: { width: '100%', padding: '0.5rem', background: '#0f172a', color: '#fff', border: '1px solid #475569', borderRadius: '8px', fontSize: '1rem' },
  countrySelect: { width: '100%', padding: '0.4rem', background: '#0f172a', color: '#fff', border: '1px solid #475569', borderRadius: '8px', fontSize: '0.9rem' },
  profileActions: { display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '0.8rem' },
  btnSave: { padding: '0.5rem 1.2rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
  btnCancel: { padding: '0.5rem 1rem', background: '#64748b', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  btnEdit: { padding: '0.4rem 1rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' },
  profileExtras: { borderTop: '1px solid #334155', paddingTop: '0.8rem' },
  socialLink: { display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#60a5fa', fontSize: '0.85rem', textDecoration: 'none', marginBottom: '0.3rem' },
  bio: { fontSize: '0.85rem', color: '#94a3b8', margin: '0.3rem 0 0 0', lineHeight: '1.4' },
  editExtras: { borderTop: '1px solid #334155', paddingTop: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  input: { width: '100%', padding: '0.6rem', background: '#0f172a', color: '#fff', border: '1px solid #475569', borderRadius: '8px', fontSize: '0.9rem' },
  
  // 💰 Баланс
  modernBalanceCard: { background: 'linear-gradient(135deg, #1e293b, #334155)', padding: '1rem', borderRadius: '16px', width: '100%', textAlign: 'center', border: '2px solid #475569' },
  balanceLabel: { fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.3rem' },
  balanceValue: { fontSize: '1.6rem', fontWeight: 'bold', color: '#fbbf24' },
  depositQuick: { display: 'flex', gap: '0.4rem', justifyContent: 'center', marginTop: '0.6rem' },
  btnDepositSmall: { padding: '0.35rem 0.7rem', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem' },
  
  // 🌐 Лобби
  lobbyTabs: { display: 'flex', gap: '0.4rem', width: '100%', maxWidth: '400px' },
  lobbyTab: ({ active }) => ({ flex: 1, padding: '0.6rem', background: active ? '#3b82f6' : '#1e293b', color: active ? '#fff' : '#e2e8f0', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: active ? '600' : '400', transition: 'all 0.2s' }),
  modernLobbyCard: { background: '#1e293b', padding: '1.2rem', borderRadius: '16px', width: '100%', maxWidth: '400px', border: '2px solid #475569' },
  lobbyTitle: { fontSize: '1.1rem', fontWeight: 'bold', color: '#fbbf24', marginBottom: '0.8rem', textAlign: 'center' },
  gamesList: { display: 'flex', flexDirection: 'column', gap: '0.7rem', maxHeight: '280px', overflowY: 'auto' },
  modernGameCard: { background: '#0f172a', padding: '0.9rem', borderRadius: '12px', border: '1px solid #334155' },
  gameHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' },
  creatorName: { fontSize: '0.95rem', fontWeight: '600', color: '#e2e8f0' },
  gameStake: { fontSize: '0.9rem', color: '#fbbf24', fontWeight: '600' },
  gameId: { fontSize: '0.85rem', color: '#94a3b8' },
  gameStatus: { fontSize: '0.85rem', color: '#34d399' },
  gameDetails: { display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#94a3b8', marginBottom: '0.7rem' },
  btnJoin: { width: '100%', padding: '0.6rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '0.95rem' },
  btnShare: { width: '100%', padding: '0.6rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '0.95rem' },
  emptyText: { color: '#94a3b8', fontSize: '0.95rem', textAlign: 'center' },
  
  // 🔗 Приглашение
  inviteDetails: { background: '#0f172a', padding: '0.9rem', borderRadius: '12px', marginBottom: '1rem' },
  detailRow: { display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #334155', fontSize: '1rem' },
  
  // ➕ Создание
  createSection: { background: '#1e293b', padding: '1.2rem', borderRadius: '16px', width: '100%', maxWidth: '400px', border: '2px solid #475569' },
  createForm: { marginBottom: '1rem' },
  formRow: { marginBottom: '0.7rem' },
  formRow label: { display: 'block', marginBottom: '0.3rem', fontSize: '0.9rem', color: '#94a3b8' },
  select: { width: '100%', padding: '0.5rem', background: '#0f172a', color: '#fff', border: '1px solid #475569', borderRadius: '8px', fontSize: '0.95rem' },
  btnPrimary: { width: '100%', padding: '0.8rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', fontSize: '1rem' },
  btnSmall: { padding: '0.5rem 1rem', background: '#475569', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem' },
  btnSmallCancel: { padding: '0.5rem 1rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem' },
  
  // 🎮 Игра
  gameMain: { padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' },
  gameOverBanner: { background: 'linear-gradient(135deg, #1e293b, #7c3aed)', padding: '1.2rem', borderRadius: '20px', width: '100%', maxWidth: '400px', textAlign: 'center', border: '2px solid #a78bfa' },
  gameOverIcon: { fontSize: '2.5rem', marginBottom: '0.4rem' },
  gameOverText: { fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '0.4rem', color: '#fbbf24' },
  prizeText: { color: '#34d399', fontSize: '1.2rem', fontWeight: '600', marginBottom: '0.8rem' },
  btnNewGame: { padding: '0.7rem 1.8rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', fontSize: '1rem' },
  
  // 🎯 Раскладка игры
  gameLayout: { display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '1.5rem', alignItems: 'start', maxWidth: '900px', width: '100%' },
  sidePanel: { display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: '140px' },
  timerCard: ({ active }) => ({ background: active ? '#059669' : '#1e293b', padding: '0.8rem 1.2rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', border: active ? '2px solid #34d399' : '2px solid transparent', transition: 'all 0.2s' }),
  timerLabel: { fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.2rem' },
  timerValue: { fontSize: '1.5rem', fontWeight: 'bold', fontFamily: 'monospace', color: '#e2e8f0' },
  stakeBadge: { background: 'linear-gradient(135deg, #7c3aed, #a78bfa)', color: '#fff', padding: '0.5rem 1rem', borderRadius: '12px', fontSize: '0.95rem', fontWeight: '600', textAlign: 'center' },
  statusMsg: { color: '#38bdf8', textAlign: 'center', fontSize: '0.95rem', minHeight: '1.3rem' },
  
  // ♟️ Доска
  boardContainer: { display: 'flex', justifyContent: 'center' },
  boardWrapper: { background: '#1e293b', padding: '0.5rem', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' },
  
  // 📜 История ходов
  historyPanel: { background: '#1e293b', borderRadius: '12px', padding: '0.8rem', width: '140px', border: '1px solid #334155' },
  historyHeader: { display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.5rem', paddingBottom: '0.4rem', borderBottom: '1px solid #334155' },
  historyCount: { background: '#334155', padding: '0.15rem 0.5rem', borderRadius: '10px', fontSize: '0.8rem' },
  historyList: { display: 'flex', flexWrap: 'wrap', gap: '0.3rem', maxHeight: '150px', overflowY: 'auto' },
  moveChip: ({ highlight }) => ({ background: highlight ? '#3b82f6' : '#334155', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '500' }),
  emptyHist: { color: '#94a3b8', fontSize: '0.85rem' },
  controls: { display: 'flex', gap: '0.4rem', justifyContent: 'center' },
  btnCtrl: { padding: '0.5rem 0.8rem', background: '#475569', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem' },
  
  // 🎨 Выбор темы
  themeSelector: { background: '#1e293b', padding: '1rem', borderRadius: '16px', width: '100%', maxWidth: '400px', border: '2px solid #475569' },
  themeTitle: { fontSize: '1rem', fontWeight: '600', color: '#cbd5e1', marginBottom: '0.8rem', textAlign: 'center' },
  themeGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem' },
  themeBtn: ({ active, theme }) => ({ 
    padding: '0.6rem', borderRadius: '12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', 
    background: active ? 'rgba(59, 130, 246, 0.2)' : '#0f172a', border: active ? '2px solid #3b82f6' : '2px solid #334155',
    transition: 'all 0.2s', position: 'relative'
  }),
  themePreview: { display: 'flex', gap: '2px' },
  themeSquare: { width: '22px', height: '22px', borderRadius: '4px' },
  themeName: { fontSize: '0.7rem', color: '#e2e8f0', textAlign: 'center' },
  themeCheck: { position: 'absolute', top: '-6px', right: '-6px', background: '#10b981', color: '#fff', borderRadius: '50%', width: '18px', height: '18px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  
  // 📦 Модальное окно
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' },
  modal: { background: '#1e293b', padding: '1.5rem', borderRadius: '20px', maxWidth: '360px', width: '100%', border: '2px solid #475569', textAlign: 'center' },
  modalTitle: { fontSize: '1.3rem', fontWeight: 'bold', marginBottom: '1rem', color: '#fbbf24' },
  modalStep: { color: '#e2e8f0', fontSize: '0.95rem', marginBottom: '0.7rem', lineHeight: '1.5' },
  modalActions: { display: 'flex', gap: '0.8rem', justifyContent: 'center', marginTop: '1rem' },
  modalConfirm: { padding: '0.7rem 1.5rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' },
  modalCancel: { padding: '0.7rem 1.5rem', background: '#64748b', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' },
  
  // ℹ️ Доп. стили
  modeInfo: { color: '#64748b', fontSize: '0.85rem', textAlign: 'center', marginTop: '0.5rem' },
  infoText: { color: '#94a3b8', fontSize: '0.95rem', marginBottom: '0.8rem', textAlign: 'center' },
  codeBox: { background: '#0f172a', padding: '0.9rem', borderRadius: '10px', wordBreak: 'break-all', fontSize: '0.85rem', marginBottom: '1rem', border: '1px dashed #475569' },
  waitActions: { display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }
}

export default App